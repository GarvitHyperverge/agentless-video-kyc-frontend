import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SelfieImage } from './type';
import { uploadSelfie } from '../../services/api/selfie';
import { useSessionValidation } from '../../utils/hooks/useSessionValidation';
import { validateSession } from '../../utils/session';
import { useCamera } from '../../utils/hooks/useCamera';
import { capturePhotoFromVideo } from '../../utils/camera';

export const useSelfiePage = () => {
  const navigate = useNavigate();
  useSessionValidation(); // Auto-validates on mount
  
  // Camera hook with front camera for selfie
  const {
    videoRef,
    isCameraReady,
    isCameraOpen,
    error: cameraError,
    startCamera,
    stopCamera,
    setError: setCameraError,
  } = useCamera({
    facingMode: 'user',
    width: { ideal: 1280 },
    height: { ideal: 720 },
    audio: false,
  });

  // Page-specific state
  const [selfieImage, setSelfieImage] = useState<SelfieImage>({ image: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Combined error state
  const error = cameraError || uploadError;

  /**
   * Capture full photo from video stream
   */
  const capturePhoto = () => {
    if (!videoRef.current) return;

    // Capture full video frame
    const imageData = capturePhotoFromVideo(videoRef.current);

    setSelfieImage({ image: imageData });
    stopCamera();
  };

  /**
   * Open camera for selfie capture
   */
  const openCamera = () => {
    setUploadError(null);
    setCameraError(null);
    startCamera();
  };

  /**
   * Close camera
   */
  const closeCamera = () => {
    stopCamera();
    setUploadError(null);
    setCameraError(null);
  };

  /**
   * Remove captured selfie image
   */
  const removeImage = () => {
    setSelfieImage({ image: null });
  };

  /**
   * Retake photo - reset image and restart camera
   */
  const retakePhoto = async () => {
    setSelfieImage({ image: null });
    setUploadError(null);
    setCameraError(null);
    await openCamera();
  };

  /**
   * Upload selfie to backend and navigate to thank you page
   */
  const handleContinue = async () => {
    if (!selfieImage.image) {
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
        image: selfieImage.image,
      });

      if (response.success) {
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

  const canContinue = selfieImage.image !== null;

  return {
    selfieImage,
    isCameraOpen,
    isCameraReady,
    isProcessing,
    error,
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
