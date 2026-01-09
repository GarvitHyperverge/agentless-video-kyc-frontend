import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecordingStatus } from './type';
import { generateOtp } from './utils';
import { uploadOtpVideo } from '../../services/api/otpVideo';
import { useSessionValidation } from '../../utils/hooks/useSessionValidation';
import { validateSession } from '../../utils/session';
import { useCamera } from '../../utils/hooks/useCamera';

export const useOtpPage = () => {
  const navigate = useNavigate();
  
  // Shared hooks
  useSessionValidation(); // Auto-validates on mount
  const {
    streamRef,
    videoRef,
    isCameraReady,
    error: cameraError,
    startCamera,
    stopCamera,
    setError: setCameraError,
  } = useCamera({
    facingMode: 'user',
    width: { ideal: 1280 },
    height: { ideal: 720 },
    audio: true,
  });

  // Page-specific state
  const [otp, setOtp] = useState<string>('');
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle'); 
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Refs for recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Combined error state
  const error = cameraError || uploadError;

  // Initialize OTP and start camera on component mount (session validation handled by hook)
  useEffect(() => {
    setOtp(generateOtp());
    startCamera();

    // Cleanup function
    return () => {
      stopCamera();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  /**
   * Start recording video and audio from the camera stream
   * Collects chunks of video data as they become available
   */
  const startRecording = () => {
    if (!streamRef.current) {
      setCameraError('Camera not available. Please refresh and try again.');
      return;
    }

    // Reset chunks array for new recording
    chunksRef.current = [];
    
    // Create MediaRecorder with WebM format 
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9,opus',
    });

    // Collect video chunks as they become available
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    // Store recorder reference and start recording
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setRecordingStatus('recording');
    setRecordingTime(0);

    // Start timer to track recording duration
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  /**
   * Stop the active recording and create video blob
   * Waits for recording to fully stop before creating blob to ensure all chunks are collected
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === 'recording') {
      const mediaRecorder = mediaRecorderRef.current;
      
      // Create a promise that resolves when recording fully stops
      const stopPromise = new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => {
          resolve();
        };
      });

      // Request any remaining buffered data and stop recording
      mediaRecorder.requestData();
      mediaRecorder.stop();
      
      // Clear the recording timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Wait for recording to fully stop, then create blob
      stopPromise.then(() => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoBlob(blob);
        setVideoUrl(url);
        setRecordingStatus('recorded');
      });
    }
  };

  /**
   * Reset recording state and restart camera for a new recording
   * Cleans up previous video blob and URL to prevent memory leaks
   */
  const retakeVideo = async () => {
    // Revoke object URL to free memory
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoBlob(null);
    setVideoUrl(null);
    setRecordingTime(0);
    setUploadError(null);
    setCameraError(null);
    setRecordingStatus('idle');

    // Restart camera using existing helper functions
    stopCamera();
    await startCamera();
  };

  /**
   * Generate a new OTP code and reset video recording
   * Called when user clicks "Generate New OTP" button
   */
  const regenerateOtp = async () => {
    setOtp(generateOtp());
    await retakeVideo();
  };

  /**
   * Upload recorded video to backend and navigate to next step
   * Converts video blob to base64 format before uploading
   */
  const handleContinue = async () => {
    if (!videoBlob) {
      setUploadError('Please record a video reading the OTP');
      return;
    }

    let sessionId: string;
    try {
      sessionId = validateSession();
    } catch (err) {
      setUploadError('Session not found. Please start the verification process again.');
      return;
    }

    setIsProcessing(true);
    setRecordingStatus('uploading');
    setUploadError(null);

    try {
      // Get location from localStorage (stored during initial permission request on LandingPage)
      const storedLatitude = localStorage.getItem('user_latitude');
      const storedLongitude = localStorage.getItem('user_longitude');
      
      let latitude: number;
      let longitude: number;
      
      if (storedLatitude && storedLongitude) {
        latitude = parseFloat(storedLatitude);
        longitude = parseFloat(storedLongitude);
      } else {
        // Fallback if location not found in localStorage
        console.warn('Location not found in localStorage, using default values');
        latitude = 0;
        longitude = 0;
      }

      // Upload video with OTP, session ID, and geolocation to backend using FormData
      const response = await uploadOtpVideo(sessionId, otp, videoBlob, latitude, longitude);

      if (response.success) {
        // Release camera resources before navigating away
        stopCamera();
        navigate('/selfie');
      } else {
        setUploadError(response.message || 'Failed to upload video');
        setRecordingStatus('recorded');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err instanceof Error ? err.message : 'Failed to upload video. Please try again.');
      setRecordingStatus('recorded');
    } finally {
      setIsProcessing(false);
    }
  };

  // Determine if continue button should be enabled
  const canContinue = recordingStatus === 'recorded' && videoBlob !== null;

  return {
    otp,
    recordingStatus,
    videoUrl,
    recordingTime,
    isProcessing,
    error,
    isCameraReady,
    videoRef,
    startRecording,
    stopRecording,
    retakeVideo,
    regenerateOtp,
    handleContinue,
    canContinue,
  };
};
