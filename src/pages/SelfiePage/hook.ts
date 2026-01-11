import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SelfieImage } from './type';
import { uploadSelfie } from '../../services/api/selfie';
import { useSessionValidation } from '../../utils/hooks/useSessionValidation';
import { validateSession } from '../../utils/session';
import { useSessionRecording } from '../../services/sessionRecording/context';
import { capturePhotoFromVideo } from '../../utils/camera';

export const useSelfiePage = () => {
  const navigate = useNavigate();
  useSessionValidation(); // Auto-validates on mount
  
  // Use shared stream from session recording
  const { getSharedStream, isStreamInitialized, startRecording } = useSessionRecording();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Page-specific state
  const [selfieImage, setSelfieImage] = useState<SelfieImage>({ imageFile: null, imageUrl: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Initialize shared stream on mount
  useEffect(() => {
    const initializeStream = async () => {
      try {
        // Ensure shared stream is started
        if (!isStreamInitialized) {
          await startRecording();
        }
        // Note: Don't attach stream here - wait until camera modal opens
        // This prevents the video from playing in the background
      } catch (err) {
        console.warn('Could not initialize shared stream:', err);
        setError('Unable to access camera. Please ensure permissions are granted.');
      }
    };

    initializeStream();
  }, [isStreamInitialized, startRecording]);

  // Attach stream to video element when camera modal opens
  useEffect(() => {
    if (isCameraOpen && videoRef.current) {
      const sharedStream = getSharedStream();
      if (sharedStream) {
        videoRef.current.srcObject = sharedStream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      } else {
        setError('Camera stream not available. Please ensure permissions are granted.');
      }
    } else if (!isCameraOpen) {
      // Reset camera ready state when modal closes
      setIsCameraReady(false);
    }
  }, [isCameraOpen, getSharedStream]);

  // Combined error state
  const combinedError = error || uploadError;

  /**
   * Open camera for selfie capture - uses shared stream
   */
  const openCamera = () => {
    setUploadError(null);
    setError(null);
    setIsCameraOpen(true);
  };

  /**
   * Close camera view - stream remains active for recording
   */
  const closeCamera = () => {
    setIsCameraOpen(false);
    setIsCameraReady(false);
    // Don't stop the stream, just hide the camera view
    // The shared stream continues recording in the background
  };

  /**
   * Capture full photo from video stream
   */
  const capturePhoto = async () => {
    if (!videoRef.current) return;

    try {
      // Capture full video frame as Blob
      const blob = await capturePhotoFromVideo(videoRef.current);
      
      // Convert Blob to File for upload
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
      
      // Create object URL for display
      const imageUrl = URL.createObjectURL(blob);

      setSelfieImage({ imageFile: file, imageUrl });
      closeCamera(); // Close camera view but keep stream active
    } catch (err) {
      console.error('Capture error:', err);
      setError('Failed to capture photo. Please try again.');
    }
  };

  /**
   * Remove captured selfie image and clean up object URL
   */
  const removeImage = () => {
    if (selfieImage.imageUrl) {
      URL.revokeObjectURL(selfieImage.imageUrl);
    }
    setSelfieImage({ imageFile: null, imageUrl: null });
  };

  /**
   * Retake photo - reset image and reopen camera
   */
  const retakePhoto = async () => {
    removeImage(); // This cleans up the object URL
    setUploadError(null);
    setError(null);
    openCamera(); // Open camera view (stream is already active)
  };

  /**
   * Upload selfie to backend and navigate to thank you page
   */
  const handleContinue = async () => {
    if (!selfieImage.imageFile) {
      setUploadError('Please capture or upload a selfie');
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
    setUploadError(null);

    try {
      const response = await uploadSelfie({
        sessionId,
        imageFile: selfieImage.imageFile,
      });

      if (response.success) {
        // Clean up object URL before navigating
        if (selfieImage.imageUrl) {
          URL.revokeObjectURL(selfieImage.imageUrl);
        }
        navigate('/verify/complete');
      } else {
        setUploadError(response.message || 'Failed to upload selfie');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err instanceof Error ? err.message : 'Failed to upload selfie. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const canContinue = selfieImage.imageFile !== null;

  return {
    selfieImage,
    isCameraOpen,
    isCameraReady,
    isProcessing,
    error: combinedError,
    videoRef,
    openCamera,
    closeCamera,
    capturePhoto,
    removeImage,
    retakePhoto,
    handleContinue,
    canContinue,
  };
};
