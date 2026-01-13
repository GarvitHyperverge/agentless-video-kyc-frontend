import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecordingStatus } from './type';
import { generateOtp } from './utils';
import { uploadOtpVideo } from '../../services/api/otpVideo';
import { useSessionRecording } from '../../services/sessionRecording/context';
import { useCameraCapture } from '../../utils/hooks/useCameraCapture';
import { createObjectUrl, revokeObjectUrl } from '../../utils/objectUrl';
import { getToken } from '../../utils/session';
import { getJWTTimestamp } from '../../utils/jwt';
import { getStoredLocation } from '../../utils/location';
import { watermarkVideo } from '../../utils/watermark';

export const useOtpPage = () => {
  const navigate = useNavigate();
  
  // Use camera capture hook with shared stream
  const {
    videoRef,
    isCameraReady,
    isCameraOpen,
    setIsCameraOpen,
  } = useCameraCapture();

  // Shared hooks for MediaRecorder
  const { getSharedStream } = useSessionRecording();

  // Page-specific state
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [otp, setOtp] = useState<string>('');
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle'); 
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Refs for recording (local recording for OTP video)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Initialize OTP on component mount
  useEffect(() => {
    setOtp(generateOtp());
  }, []);

  /**
   * Open camera for recording
   */
  const openCameraForRecording = () => {
    setCameraError(null);
    setUploadError(null);
    setIsCameraOpen(true);
  };

  /**
   * Start recording video and audio from the shared camera stream
   * Collects chunks of video data as they become available
   */
  const startRecording = () => {
    const sharedStream = getSharedStream();
    if (!sharedStream) {
      setCameraError('Camera not available. Please refresh and try again.');
      return;
    }

      // Reset chunks array for new recording
      chunksRef.current = [];
    
    // Create MediaRecorder with WebM format using shared stream
    const mediaRecorder = new MediaRecorder(sharedStream, {
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

      // Wait for recording to fully stop, then create blob (watermarking happens on upload)
      stopPromise.then(async () => {
        // Check if chunks were cleared (user clicked retake)
        if (chunksRef.current.length === 0) {
          return;
        }

        // Create blob from recorded chunks (no watermarking yet)
        const originalBlob = new Blob(chunksRef.current, { type: 'video/webm' });
        
        // Create preview URL and save blob (watermarking will happen on upload)
        const url = createObjectUrl(originalBlob);
        setVideoBlob(originalBlob);
        setVideoUrl(url);
        setRecordingStatus('recorded');
        setIsCameraOpen(false); // Close camera after recording
      });
    }
  };

  /**
   * Reset recording state for a new recording
   * Cleans up previous video blob and URL to prevent memory leaks
   */
  const retakeVideo = async () => {
    // Stop any active recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error('Error stopping recording:', e);
      }
      mediaRecorderRef.current = null;
    }
    
    // Clear chunks
    chunksRef.current = [];
    
    // Revoke object URL to free memory
    revokeObjectUrl(videoUrl);
    setVideoBlob(null);
    setVideoUrl(null);
    setUploadError(null);
    setCameraError(null);
    
    // Reset to idle and reopen camera
    setRecordingStatus('idle');
    setIsCameraOpen(true);
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
   * Watermarks the video before uploading
   */
  const handleContinue = async () => {
    if (!videoBlob) {
      setUploadError('Please record a video reading the OTP');
      return;
    }

    // Route is already protected by VerificationProtectedRoute, so token must exist
    const token = getToken();
    if (!token) {
      setUploadError('Session not found. Please start the verification process again.');
      return;
    }

    const location = getStoredLocation();
    if (!location) {
      setUploadError('Missing location data. Please refresh and try again.');
      return;
    }

    setRecordingStatus('uploading');
    setIsProcessing(true);
    setUploadError(null);

    try {
      // Watermark video before uploading
      const timestamp = getJWTTimestamp(token);
      const watermarkedBlob = await watermarkVideo(videoBlob, timestamp, location.latitude, location.longitude);

      const response = await uploadOtpVideo(token, otp, watermarkedBlob);

      if (response.success) {
        // Clean up object URL before navigating
        revokeObjectUrl(videoUrl);
        navigate('/verify/selfie');
      } else {
        setUploadError(response.message || 'Failed to upload video. Please try again.');
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
    isProcessing,
    cameraError,
    uploadError,
    isCameraReady,
    isCameraOpen,
    setIsCameraOpen,
    videoRef,
    openCameraForRecording,
    startRecording,
    stopRecording,
    retakeVideo,
    regenerateOtp,
    handleContinue,
    canContinue,
  };
};
