import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SelfieImage } from './type';
import { uploadSelfie } from '../../services/api/selfie';
import { useCameraCapture } from '../../utils/hooks/useCameraCapture';
import { createObjectUrl, revokeObjectUrl } from '../../utils/objectUrl';
import { getToken } from '../../utils/session';
import { getJWTTimestamp } from '../../utils/jwt';
import { getStoredLocation } from '../../utils/location';
import { watermarkImage } from '../../utils/watermark';

export const useSelfiePage = () => {
  const navigate = useNavigate();
  
  // Use camera capture hook with shared stream
  const {
    videoRef,
    isCameraReady,
    isCameraOpen,
    setIsCameraOpen,
    capturePhoto: capturePhotoBase,
  } = useCameraCapture();

  // Page-specific state
  const [selfieImage, setSelfieImage] = useState<SelfieImage>({ imageFile: null, imageUrl: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Combined error state
  const combinedError = cameraError || uploadError;

  /**
   * Open camera for selfie capture - uses shared stream
   */
  const openCamera = () => {
    setUploadError(null);
    setCameraError(null);
    setIsCameraOpen(true);
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
      setIsCameraOpen(false); // Close camera view but keep stream active
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

    // Route is already protected by VerificationProtectedRoute, so token must exist
    const token = getToken();
    if (!token) {
      setUploadError('Session not found. Please start the verification process again.');
      return;
    }

    setIsProcessing(true);
    setUploadError(null);

    try {
      const response = await uploadSelfie({ token, imageFile: selfieImage.imageFile });

      if (response.success) {
        // Clean up object URL before navigating
        if (selfieImage.imageUrl) {
          revokeObjectUrl(selfieImage.imageUrl);
        }
        navigate('/verify/complete');
      } else {
        setUploadError(response.message || 'Failed to upload selfie. Please try again.');
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
    setIsCameraOpen,
    capturePhoto,
    removeImage,
    retakePhoto,
    handleContinue,
    canContinue,
  };
};
