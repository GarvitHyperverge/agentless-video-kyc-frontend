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
    startCamera: startCameraHook,
    stopCamera,
    setError: setCameraError,
  } = useCamera({
    facingMode: 'user',
    width: { ideal: 1280 },
    height: { ideal: 720 },
    audio: false,
    autoAttach: false, // Manual attachment via useEffect
  });

  const { isProcessing, error: uploadError, setError: setUploadError, executeUpload } = useUpload();

  // Page-specific state
  const [selfieImage, setSelfieImage] = useState<SelfieImage>({ image: null });

  // Combined error state
  const error = cameraError || uploadError;

  /**
   * Capture photo from video stream, cropping to guide frame area
   * Uses shared utility function for photo capture
   */
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const displayWidth = video.clientWidth;
    const displayHeight = video.clientHeight;

    // Get actual guide element dimensions from DOM
    const guideElement = document.getElementById('selfie-guide');
    let guideWidthOnScreen = Math.min(displayWidth * 0.7, 400);
    let guideHeightOnScreen = guideWidthOnScreen * (4 / 3); // aspect ratio 3:4
    
    if (guideElement) {
      guideWidthOnScreen = guideElement.offsetWidth;
      guideHeightOnScreen = guideElement.offsetHeight;
    }

    // Guide is centered in the display area
    const guideXOnScreen = (displayWidth - guideWidthOnScreen) / 2;
    const guideYOnScreen = (displayHeight - guideHeightOnScreen) / 2;

    // Calculate scale for coordinate conversion
    const videoNaturalWidth = video.videoWidth;
    const videoNaturalHeight = video.videoHeight;
    const videoAspect = videoNaturalWidth / videoNaturalHeight;
    const displayAspect = displayWidth / displayHeight;

    let scale: number;
    let offsetX = 0;
    let offsetY = 0;

    if (videoAspect > displayAspect) {
      scale = videoNaturalHeight / displayHeight;
      offsetX = (videoNaturalWidth - displayWidth * scale) / 2;
    } else {
      scale = videoNaturalWidth / displayWidth;
      offsetY = (videoNaturalHeight - displayHeight * scale) / 2;
    }

    // Map screen coordinates to video coordinates
    const cropX = offsetX + guideXOnScreen * scale;
    const cropY = offsetY + guideYOnScreen * scale;
    const cropWidth = guideWidthOnScreen * scale;
    const cropHeight = guideHeightOnScreen * scale;

    // Output dimensions (maintain aspect ratio)
    const outputWidth = Math.min(cropWidth, 800);
    const outputHeight = outputWidth * (guideHeightOnScreen / guideWidthOnScreen);

    // Use utility function to capture photo
    const imageData = capturePhotoFromVideo(video, {
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      outputWidth,
      outputHeight,
      quality: 0.9,
    });

    setSelfieImage({ image: imageData });
    stopCamera();
  };

  /**
   * Open camera for selfie capture
   */
  const openCamera = () => {
    setUploadError(null);
    setCameraError(null);
    startCameraHook({
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 },
      audio: false,
      autoAttach: false,
    });
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
