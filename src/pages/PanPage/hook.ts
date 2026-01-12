import { useState, useRef, useEffect } from 'react';
import { PanImages } from './type';
import { uploadPanCardImages } from '../../services/api/panCard';
import { useSessionRecording } from '../../services/sessionRecording/context';
import { useSessionValidation } from '../../utils/hooks/useSessionValidation';
import { getDeviceType } from '../LandingPage/utils';
import { useCameraCapture } from '../../utils/hooks/useCameraCapture';
import { useUploadHandler } from '../../utils/hooks/useUploadHandler';
import { createObjectUrl, revokeObjectUrl } from '../../utils/objectUrl';

export const usePanPage = () => {
  const { 
    startRecording, 
    pauseRecording, 
    resumeRecording,
    isStreamInitialized 
  } = useSessionRecording();
  useSessionValidation(); // Auto-validates on mount
  
  // Temporary stream for document capture
  const temporaryStreamRef = useRef<MediaStream | null>(null);

  // Use camera capture hook with temporary stream ref
  const {
    videoRef,
    isCameraReady,
    isCameraOpen,
    error: cameraError,
    setError: setCameraError,
    openCamera: openCameraBase,
    closeCamera: closeCameraBase,
    capturePhoto: capturePhotoBase,
  } = useCameraCapture({ 
    autoInitializeStream: false,
    customStreamRef: temporaryStreamRef
  });

  const [panImages, setPanImages] = useState<PanImages>({ 
    front: { file: null, url: null }, 
    back: { file: null, url: null } 
  }); 
  const [activeSide, setActiveSide] = useState<'front' | 'back' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use upload handler hook
  const { isProcessing, uploadError, setUploadError, handleUpload } = useUploadHandler({
    uploadFn: (sessionId: string) => uploadPanCardImages({
      sessionId,
      frontImageFile: panImages.front.file!,
      backImageFile: panImages.back.file!,
    }),
    onBeforeNavigate: () => {
      revokeObjectUrl(panImages.front.url);
      revokeObjectUrl(panImages.back.url);
    },
    navigateTo: '/verify/otp',
    errorMessagePrefix: 'Failed to upload images',
  });

  // Ensure shared stream is started (for session recording)
  useEffect(() => {
    const initializeSharedStream = async () => {
      try {
        // Start shared stream if not already initialized
        if (!isStreamInitialized) {
          await startRecording();
        }
      } catch (err) {
        console.warn('Could not initialize shared stream:', err);
        setCameraError('Unable to access camera. Please ensure permissions are granted.');
      }
    };

    initializeSharedStream();
  }, [isStreamInitialized, startRecording, setCameraError]);

  // Start temporary camera stream for document capture
  const startCameraForCapture = async () => {
    try {
      // Pause session recording video track
      pauseRecording();
      
      // Determine camera based on device type
      const deviceType = getDeviceType();
      // Desktop: use front camera, Mobile/Tablet: use back camera
      const facingMode = deviceType === 'desktop' ? 'user' : 'environment';
      
      // Create temporary camera stream for document capture
      const documentCameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      
      temporaryStreamRef.current = documentCameraStream;
      
      // Open camera - hook will attach stream to video element
      setCameraError(null);
      openCameraBase();
      console.log(`Temporary ${facingMode === 'user' ? 'front' : 'back'} camera stream started for document capture (${deviceType})`);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Unable to access camera. Please ensure permissions are granted.');
      resumeRecording(); // Resume if failed
    }
  };

  const stopCamera = () => {
    // Stop temporary camera stream
    if (temporaryStreamRef.current) {
      temporaryStreamRef.current.getTracks().forEach(track => track.stop());
      temporaryStreamRef.current = null;
      console.log('Temporary camera stream stopped');
    }
    
    // Resume session recording
    resumeRecording();
    
    // Close camera modal
    closeCameraBase();
  };

  /**
   * Capture full photo from video stream
   */
  const capturePhoto = async () => {
    if (!activeSide) return;

    const blob = await capturePhotoBase();
    if (!blob) return;

    try {
      // Convert Blob to File for upload
      const file = new File([blob], `pan_${activeSide}.jpg`, { type: 'image/jpeg' });
      
      // Create object URL for display
      const imageUrl = createObjectUrl(blob);

      // Save image for the active side and close camera
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
   * 
   * Stores the File object directly and creates an object URL for display.
   */
  const handlePanImageFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeSide) return;

    setUploadError(null);

    try {
      // Create object URL for display
      const imageUrl = createObjectUrl(file);
      
      // Save file and URL for the active side
      setPanImages((prev) => ({ ...prev, [activeSide]: { file, url: imageUrl } }));
      setActiveSide(null);
    } catch (err) {
      setUploadError('Failed to process image. Please try again.');
      console.error('Image processing error:', err);
    } finally {
      // Reset file input to allow selecting same file again
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

    await handleUpload();
  };

  // Determine if continue button should be enabled
  const canContinue = panImages.front.file !== null && panImages.back.file !== null;

  // Combined error state
  const combinedError = cameraError || uploadError;

  return {
    panImages,
    activeSide,
    isCameraOpen,
    isCameraReady,
    isProcessing,
    error: combinedError,
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
