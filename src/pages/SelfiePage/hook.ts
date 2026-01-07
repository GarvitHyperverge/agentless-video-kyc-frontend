import { useState } from 'react';
import { SelfieImage } from './type';
import { uploadSelfie } from '../../services/api/selfie';
import { useSessionValidation } from '../../utils/hooks/useSessionValidation';
import { useCamera } from '../../utils/hooks/useCamera';
import { useUpload } from '../../utils/hooks/useUpload';
import { capturePhotoFromVideo } from '../../utils/camera';

export const useSelfiePage = () => {
  const { validateSession } = useSessionValidation();
  
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

  const { isProcessing, error: uploadError, setError: setUploadError, executeUpload } = useUpload();

  // Page-specific state
  const [selfieImage, setSelfieImage] = useState<SelfieImage>({ image: null });

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

    try {
      const sessionId = validateSession();

      await executeUpload({
        uploadFunction: async (data) => {
          const response = await uploadSelfie(data);
          return {
            success: response.success,
            message: response.message,
          };
        },
        uploadData: {
          sessionId,
          image: selfieImage.image,
        },
        successNavigateTo: '/thank-you',
        errorMessage: 'Failed to upload selfie',
        onSuccess: () => {
          // Store in sessionStorage if needed
          sessionStorage.setItem('selfie_image', JSON.stringify({
            sessionId,
            imagePath: '', // Will be set by backend response
          }));
        },
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload selfie');
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
