import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PanImages } from './type';
import { uploadPanCardImages } from '../../services/api/panCard';
import { useCameraCapture } from '../../utils/hooks/useCameraCapture';
import { createObjectUrl, revokeObjectUrl } from '../../utils/objectUrl';
import { getJWTTimestamp } from '../../utils/jwt';
import { getStoredLocation } from '../../utils/location';
import { getToken } from '../../utils/session';
import { watermarkImage } from '../../utils/watermark';

export const usePanPage = () => {
  const navigate = useNavigate();
  
  // Use camera capture hook with shared stream (front camera)
  const {
    videoRef,
    isCameraReady,
    isCameraOpen,
    setIsCameraOpen,
    capturePhoto: capturePhotoBase,
  } = useCameraCapture();

  const [panImages, setPanImages] = useState<PanImages>({ 
    front: { file: null, url: null }, 
    back: { file: null, url: null } 
  }); 
  const [activeSide, setActiveSide] = useState<'front' | 'back' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Open camera for document capture (uses shared stream - front camera)
  const startCameraForCapture = () => {
    setCameraError(null);
    setIsCameraOpen(true);
  };

  // Close camera modal
  const stopCamera = () => {
    setIsCameraOpen(false);
  };

  /**
   * Capture full photo from video stream
   */
  const capturePhoto = async () => {
    if (!activeSide) return;

    const blob = await capturePhotoBase();
    if (!blob) return;

    try {
      // Convert blob to File for storage
      const file = new File([blob], `pan_${activeSide}.jpg`, { type: 'image/jpeg' });
      // Create object URL for display (preview)
      const imageUrl = createObjectUrl(blob);
      // Save file and preview URL (watermarking will happen on upload)
      setPanImages((prev) => ({ 
        ...prev, 
        [activeSide]: { file, url: imageUrl } 
      }));
      stopCamera();
      setActiveSide(null);
    } catch (err) {
      console.error('Capture error:', err);
      setCameraError('Failed to capture photo. Please try again.');
    }
  };

  /**
   * Handles PAN card image file upload from user's local system
   */
  const handlePanImageFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeSide) return;

    setUploadError(null);

    try {
      // Create object URL for display (preview)
      const imageUrl = createObjectUrl(file);
      
      // Save file and preview URL (watermarking will happen on upload)
      setPanImages((prev) => ({ ...prev, [activeSide]: { file, url: imageUrl } }));
      setActiveSide(null);
    } catch (err) {
      setUploadError('Failed to process image. Please try again.');
      console.error('Image processing error:', err);
    } finally {
      // Reset input value to allow re-selecting the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /**
   * Open upload options modal for a specific side (front or back)
   */
  const openUploadOptions = (side: 'front' | 'back') => {
    setActiveSide(side);
    setUploadError(null);
    setCameraError(null);
  };

  /**
   * Handle user selection of upload mode (camera or file)
   */
  const selectUploadMode = (mode: 'camera' | 'file') => {
    if (mode === 'camera') {
      startCameraForCapture();
    } else if (mode === 'file') {
      fileInputRef.current?.click(); // Trigger hidden file input
    }
  };

  /**
   * Close upload options modal and reset state
   */
  const closeUploadOptions = () => {
    stopCamera();
    setActiveSide(null);
    setUploadError(null);
    setCameraError(null);
  };

  /**
   * Remove uploaded image for a specific side and clean up object URL
   */
  const removeImage = (side: 'front' | 'back') => {
    setPanImages((prev) => {
      revokeObjectUrl(prev[side]?.url);
      return { ...prev, [side]: { file: null, url: null } };
    });
  };

  /**
   * Upload PAN card images to backend and navigate to OTP page
   * Validates that both front and back images are present before uploading
   */
  const handleContinue = async () => {
    if (!panImages.front.file || !panImages.back.file) {
      setUploadError('Please upload both front and back images of your PAN card');
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

    setIsProcessing(true);
    setUploadError(null);

    try {
      const timestamp = getJWTTimestamp(token);

      // Watermark both images 
      const watermarkedFrontBlob = await watermarkImage(panImages.front.file!, timestamp, location.latitude, location.longitude);
      const watermarkedBackBlob = await watermarkImage(panImages.back.file!, timestamp, location.latitude, location.longitude);

      const watermarkedFrontFile = new File([watermarkedFrontBlob], panImages.front.file!.name, { type: panImages.front.file!.type });
      const watermarkedBackFile = new File([watermarkedBackBlob], panImages.back.file!.name, { type: panImages.back.file!.type });

      const response = await uploadPanCardImages({
        token,
        frontImageFile: watermarkedFrontFile,
        backImageFile: watermarkedBackFile,
      });

      if (response.success) {
        // Clean up object URLs before navigating
        revokeObjectUrl(panImages.front.url);
        revokeObjectUrl(panImages.back.url);
        navigate('/verify/otp');
      } else {
        setUploadError(response.message || 'Failed to upload images. Please try again.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err instanceof Error ? err.message : 'Failed to upload images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Determine if continue button should be enabled
  const canContinue = panImages.front.file !== null && panImages.back.file !== null;

  return {
    panImages,
    activeSide,
    isCameraOpen,
    isCameraReady,
    isProcessing,
    cameraError,
    uploadError,
    videoRef,
    fileInputRef,
    openUploadOptions,
    selectUploadMode,
    closeUploadOptions,
    capturePhoto,
    handlePanImageFileUpload,
    removeImage,
    handleContinue,
    canContinue,
  };
};
