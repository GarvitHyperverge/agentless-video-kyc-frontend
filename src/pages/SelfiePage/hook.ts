import { useState } from 'react';
import { SelfieImage } from './type';
import { uploadSelfie } from '../../services/api/selfie';
import { useSessionValidation } from '../../utils/hooks/useSessionValidation';
import { useCameraCapture } from '../../utils/hooks/useCameraCapture';
import { useUploadHandler } from '../../utils/hooks/useUploadHandler';
import { createObjectUrl, revokeObjectUrl } from '../../utils/objectUrl';
import { getToken } from '../../utils/session';
import { getJWTTimestamp } from '../../utils/jwt';
import { getStoredLocation } from '../../utils/location';
import { watermarkImage } from '../../utils/watermark';

export const useSelfiePage = () => {
  useSessionValidation(); // Auto-validates on mount
  
  // Use camera capture hook with shared stream
  const {
    videoRef,
    isCameraReady,
    isCameraOpen,
    error: cameraError,
    setError: setCameraError,
    openCamera: openCameraBase,
    closeCamera,
    capturePhoto: capturePhotoBase,
  } = useCameraCapture({ autoInitializeStream: true });

  // Page-specific state
  const [selfieImage, setSelfieImage] = useState<SelfieImage>({ imageFile: null, imageUrl: null });

  // Use upload handler hook
  const { isProcessing, uploadError, setUploadError, handleUpload } = useUploadHandler({
    uploadFn: (token: string) => uploadSelfie({ token, imageFile: selfieImage.imageFile! }),
    onBeforeNavigate: () => {
      if (selfieImage.imageUrl) {
        revokeObjectUrl(selfieImage.imageUrl);
      }
    },
    navigateTo: '/verify/complete',
    errorMessagePrefix: 'Failed to upload selfie',
  });

  // Combined error state
  const combinedError = cameraError || uploadError;

  /**
   * Open camera for selfie capture - uses shared stream
   */
  const openCamera = () => {
    setUploadError(null);
    setCameraError(null);
    openCameraBase();
  };

  /**
   * Capture full photo from video stream
   */
  const capturePhoto = async () => {
    const blob = await capturePhotoBase();
    if (!blob) return;

    try {
      // Get token and location for watermarking
      const token = getToken();
      const location = getStoredLocation();

      if (!token || !location) {
        setCameraError('Missing token or location data. Please refresh and try again.');
        return;
      }

      // Extract timestamp from JWT
      const timestamp = getJWTTimestamp(token);

      // Watermark the image
      const watermarkedBlob = await watermarkImage(blob, timestamp, location.latitude, location.longitude);

      // Convert watermarked Blob to File for upload
      const file = new File([watermarkedBlob], 'selfie.jpg', { type: 'image/jpeg' });
      
      // Create object URL for display (use original blob for preview)
      const imageUrl = createObjectUrl(blob);

      setSelfieImage({ imageFile: file, imageUrl });
      closeCamera(); // Close camera view but keep stream active
    } catch (err) {
      console.error('Capture error:', err);
      setCameraError('Failed to capture photo. Please try again.');
    }
  };

  /**
   * Remove captured selfie image and clean up object URL
   */
  const removeImage = () => {
    revokeObjectUrl(selfieImage.imageUrl);
    setSelfieImage({ imageFile: null, imageUrl: null });
  };

  /**
   * Retake photo - reset image and reopen camera
   */
  const retakePhoto = async () => {
    removeImage(); // This cleans up the object URL
    setUploadError(null);
    setCameraError(null);
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

    await handleUpload();
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
