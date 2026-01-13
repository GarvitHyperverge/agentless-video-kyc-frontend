import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecordingStatus } from './type';
import { generateOtp } from './utils';
import { uploadOtpVideo } from '../../services/api/otpVideo';
import { useSessionRecording } from '../../services/sessionRecording/context';
import { attachStreamToVideo } from '../../utils/stream';
import { createObjectUrl, revokeObjectUrl } from '../../utils/objectUrl';
import { getToken } from '../../utils/session';
import { getJWTTimestamp } from '../../utils/jwt';
import { getStoredLocation } from '../../utils/location';
import { watermarkVideo } from '../../utils/watermark';

export const useOtpPage = () => {
  const navigate = useNavigate();
  
  // Shared hooks
  const { getSharedStream, isStreamInitialized, startRecording: startSessionRecording } = useSessionRecording();

  // Use shared stream for video element
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Page-specific state
  const [otp, setOtp] = useState<string>('');
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle'); 
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Refs for recording (local recording for OTP video)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watermarkingAbortedRef = useRef<boolean>(false);

  // Combined error state
  const combinedError = error || uploadError;

  // Initialize OTP and attach shared stream on component mount
  useEffect(() => {
    const initializeStream = async () => {
      try {
        setOtp(generateOtp());
        
        // Ensure shared stream is started
        if (!isStreamInitialized) {
          await startSessionRecording();
        }
        
        // Attach shared stream to video element
        const sharedStream = getSharedStream();
        attachStreamToVideo(videoRef.current, sharedStream, () => {
          setIsCameraReady(true);
        });
      } catch (err) {
        console.warn('Could not initialize shared stream:', err);
        setError('Unable to access camera. Please ensure permissions are granted.');
      }
    };

    initializeStream();

    // Cleanup function - don't stop the shared stream, just clear timer
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isStreamInitialized, startSessionRecording, getSharedStream]);

  /**
   * Start recording video and audio from the shared camera stream
   * Collects chunks of video data as they become available
   */
  const startRecording = () => {
    const sharedStream = getSharedStream();
    if (!sharedStream) {
      setError('Camera not available. Please refresh and try again.');
      return;
    }

    // Reset watermarking abort flag
    watermarkingAbortedRef.current = false;

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
      
      // Reset watermarking abort flag
      watermarkingAbortedRef.current = false;
      
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

      // Set status to processing while watermarking
      setRecordingStatus('processing');

      // Wait for recording to fully stop, then create and watermark blob
      stopPromise.then(async () => {
        // Check if watermarking was aborted
        if (watermarkingAbortedRef.current) {
          return;
        }

        const originalBlob = new Blob(chunksRef.current, { type: 'video/webm' });
        
        // Get token and location for watermarking
        const token = getToken();
        const location = getStoredLocation();

        if (!token || !location) {
          console.error('Missing token or location data for watermarking');
          // Use original blob if watermarking fails
          if (!watermarkingAbortedRef.current) {
            const url = createObjectUrl(originalBlob);
            setVideoBlob(originalBlob);
            setVideoUrl(url);
            setRecordingStatus('recorded');
          }
          return;
        }

        try {
          // Extract timestamp from JWT
          const timestamp = getJWTTimestamp(token);

          // Watermark the video (this may take time, so check abort flag)
          const watermarkedBlob = await watermarkVideo(originalBlob, timestamp, location.latitude, location.longitude);
          
          // Check again if watermarking was aborted during processing
          if (watermarkingAbortedRef.current) {
            return;
          }
          
          const url = createObjectUrl(watermarkedBlob);
          setVideoBlob(watermarkedBlob);
          setVideoUrl(url);
          setRecordingStatus('recorded');
        } catch (err) {
          console.error('Watermarking error:', err);
          // Fallback to original blob if watermarking fails
          if (!watermarkingAbortedRef.current) {
            const url = createObjectUrl(originalBlob);
            setVideoBlob(originalBlob);
            setVideoUrl(url);
            setRecordingStatus('recorded');
          }
        }
      });
    }
  };

  /**
   * Reset recording state for a new recording
   * Cleans up previous video blob and URL to prevent memory leaks
   * Stream remains active - no need to restart it
   */
  const retakeVideo = async () => {
    // Abort any ongoing watermarking process
    watermarkingAbortedRef.current = true;
    
    // Stop any active recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // Ignore errors
      }
      mediaRecorderRef.current = null;
    }
    
    // Clear chunks
    chunksRef.current = [];
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Revoke object URL to free memory
    revokeObjectUrl(videoUrl);
    setVideoBlob(null);
    setVideoUrl(null);
    setRecordingTime(0);
    setUploadError(null);
    setError(null);
    
    // Reset camera ready state to show loading
    setIsCameraReady(false);
    setRecordingStatus('idle');

    // Clear video element and reattach shared stream
    if (videoRef.current) {
      // Clear any existing srcObject (blob URL or previous stream)
      videoRef.current.srcObject = null;
      videoRef.current.load(); // Reset video element
    }

    // Use requestAnimationFrame to ensure DOM is updated before reattaching stream
    requestAnimationFrame(() => {
      const sharedStream = getSharedStream();
      if (sharedStream && videoRef.current) {
        attachStreamToVideo(videoRef.current, sharedStream, () => {
          setIsCameraReady(true);
        });
        // Ensure video plays
        videoRef.current?.play().catch((err) => {
          console.warn('Failed to play video after retake:', err);
        });
      }
    });
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

    // Route is already protected by VerificationProtectedRoute, so token must exist
    const token = getToken();
    if (!token) {
      setUploadError('Session not found. Please start the verification process again.');
      return;
    }

    setRecordingStatus('uploading');
    setIsProcessing(true);
    setUploadError(null);

    try {
      const response = await uploadOtpVideo(token, otp, videoBlob);

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
    recordingTime,
    isProcessing,
    error: combinedError,
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
