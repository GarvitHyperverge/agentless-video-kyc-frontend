import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecordingStatus } from './type';
import { generateOtp, blobToBase64 } from './utils';
import { uploadOtpVideo } from '../../services/api/otpVideo';
import { useSessionValidation } from '../../utils/hooks/useSessionValidation';
import { useCamera } from '../../utils/hooks/useCamera';

export const useOtpPage = () => {
  const navigate = useNavigate();
  
  // Shared hooks
  const { validateSession } = useSessionValidation();
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

  // Initialize OTP, validate session, and start camera on component mount
  useEffect(() => {
    try {
      validateSession();
      setOtp(generateOtp());
      startCamera();
    } catch {
      // Session validation hook handles navigation
    }

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
   * Collects chunks of video data and creates a blob when stopped
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

    // When recording stops, create blob and preview URL
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoBlob(blob);
      setVideoUrl(url);
      setRecordingStatus('recorded');
    };
  };

  /**
   * Stop the active recording
   * Triggers onstop handler which creates the video blob
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === 'recording') {
      mediaRecorderRef.current.stop(); // This triggers the onstop handler
      
      // Clear the recording timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
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

    const sessionId = validateSession();
    if (!sessionId) {
      setUploadError('Session not found. Please start the verification process again.');
      return;
    }

    setIsProcessing(true);
    setRecordingStatus('uploading');
    setUploadError(null);

    try {
      // Convert blob to base64 string for API upload
      const videoBase64 = await blobToBase64(videoBlob);

      // Upload video with OTP and session ID to backend
      const response = await uploadOtpVideo({
        sessionId,
        otp,
        video: videoBase64,
      });

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
