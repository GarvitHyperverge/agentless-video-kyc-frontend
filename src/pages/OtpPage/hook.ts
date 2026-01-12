import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecordingStatus } from './type';
import { generateOtp } from './utils';
import { uploadOtpVideo } from '../../services/api/otpVideo';
import { useSessionValidation } from '../../utils/hooks/useSessionValidation';
import { validateSession } from '../../utils/session';
import { useSessionRecording } from '../../services/sessionRecording/context';

export const useOtpPage = () => {
  const navigate = useNavigate();
  
  // Shared hooks
  useSessionValidation(); // Auto-validates on mount
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
        if (sharedStream && videoRef.current) {
          videoRef.current.srcObject = sharedStream;
          videoRef.current.onloadedmetadata = () => {
            setIsCameraReady(true);
          };
        }
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
   * Reset recording state for a new recording
   * Cleans up previous video blob and URL to prevent memory leaks
   * Stream remains active - no need to restart it
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
    setError(null);
    setRecordingStatus('idle');

    // Ensure shared stream is attached to video element
    const sharedStream = getSharedStream();
    if (sharedStream && videoRef.current) {
      videoRef.current.srcObject = sharedStream;
      videoRef.current.onloadedmetadata = () => {
        setIsCameraReady(true);
      };
    }
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
      // Upload video with OTP and session ID to backend using FormData
      const response = await uploadOtpVideo(sessionId, otp, videoBlob);

      if (response.success) {
        // Navigate away - shared stream continues recording
        navigate('/verify/selfie');
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
