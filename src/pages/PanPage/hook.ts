import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PanImages } from './type';
import { uploadPanCardImages } from '../../services/api/panCard';
import { useSessionRecording } from '../../services/sessionRecording/context';
import { useSessionValidation } from '../../utils/hooks/useSessionValidation';
import { validateSession } from '../../utils/session';
import { capturePhotoFromVideo } from '../../utils/camera';

export const usePanPage = () => {
  const navigate = useNavigate();
  const { 
    isSessionRecording, 
    startRecording, 
    getSharedStream, 
    pauseRecording, 
    resumeRecording,
    isStreamInitialized 
  } = useSessionRecording();
  useSessionValidation(); // Auto-validates on mount
  
  // Use shared stream for video element (front camera)
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Temporary stream for back camera document capture
  const temporaryStreamRef = useRef<MediaStream | null>(null);
  const isUsingBackCameraRef = useRef(false);

  const [panImages, setPanImages] = useState<PanImages>({ 
    front: { file: null, url: null }, 
    back: { file: null, url: null } 
  }); 
  const [activeSide, setActiveSide] = useState<'front' | 'back' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensure shared stream is started and attach to video element
  useEffect(() => {
    const initializeSharedStream = async () => {
      try {
        // Start shared stream if not already initialized
        if (!isStreamInitialized) {
          await startRecording();
        }
        
        // Attach shared stream to video element (front camera)
        const sharedStream = getSharedStream();
        if (sharedStream && videoRef.current && !isUsingBackCameraRef.current) {
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

    initializeSharedStream();
  }, [isStreamInitialized, startRecording, getSharedStream]);

  // Start temporary back camera stream for document capture
  const startCameraForCapture = async () => {
    try {
      // Pause session recording video track
      pauseRecording();
      
      // Create temporary back camera stream
      const backCameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      
      temporaryStreamRef.current = backCameraStream;
      isUsingBackCameraRef.current = true;
      
      if (videoRef.current) {
        videoRef.current.srcObject = backCameraStream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      }
      setIsCameraOpen(true);
      setError(null);
      console.log('Temporary back camera stream started for document capture');
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access back camera. Please ensure permissions are granted.');
      resumeRecording(); // Resume if failed
    }
  };

  const stopCamera = () => {
    // Stop temporary back camera stream
    if (temporaryStreamRef.current) {
      temporaryStreamRef.current.getTracks().forEach(track => track.stop());
      temporaryStreamRef.current = null;
      isUsingBackCameraRef.current = false;
      console.log('Temporary back camera stream stopped');
    }
    
    // Resume session recording
    resumeRecording();
    
    // Reattach shared stream to video element
    const sharedStream = getSharedStream();
    if (sharedStream && videoRef.current) {
      videoRef.current.srcObject = sharedStream;
      videoRef.current.onloadedmetadata = () => {
        setIsCameraReady(true);
      };
    }
    
    setIsCameraOpen(false);
    setIsCameraReady(false);
  };

  /**
   * Capture full photo from video stream
   */
  const capturePhoto = async () => {
    if (!videoRef.current || !activeSide) return;

    try {
      // Capture full video frame as Blob
      const blob = await capturePhotoFromVideo(videoRef.current);
      
      // Convert Blob to File for upload
      const file = new File([blob], `pan_${activeSide}.jpg`, { type: 'image/jpeg' });
      
      // Create object URL for display
      const imageUrl = URL.createObjectURL(blob);

      // Save image for the active side and close camera
      setPanImages((prev) => ({ 
        ...prev, 
        [activeSide]: { file, url: imageUrl } 
      }));
      stopCamera();
      setActiveSide(null);
    } catch (err) {
      console.error('Capture error:', err);
      setError('Failed to capture photo. Please try again.');
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
      const imageUrl = URL.createObjectURL(file);
      
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
    setError(null);
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
    setError(null);
  };

  /**
   * Remove uploaded image for a specific side and clean up object URL
   */
  const removeImage = (side: 'front' | 'back') => {
    setPanImages((prev) => {
      // Clean up object URL if it exists
      if (prev[side]?.url) {
        URL.revokeObjectURL(prev[side].url);
      }
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
      // Upload images to backend
      const response = await uploadPanCardImages({
        sessionId,
        frontImageFile: panImages.front.file,
        backImageFile: panImages.back.file,
      });

      if (response.success) {
        // Clean up object URLs before navigating
        if (panImages.front.url) {
          URL.revokeObjectURL(panImages.front.url);
        }
        if (panImages.back.url) {
          URL.revokeObjectURL(panImages.back.url);
        }
        navigate('/verify/otp');
      } else {
        setUploadError(response.message || 'Failed to upload images');
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

  // Combined error state
  const combinedError = error || uploadError;

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
