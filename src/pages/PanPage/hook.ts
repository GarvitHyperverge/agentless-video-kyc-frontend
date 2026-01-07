import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PanImages } from './type';
import { uploadPanCardImages } from '../../services/api/panCard';
import { useSessionRecording } from '../../services/sessionRecording/context';
import { useSessionValidation } from '../../utils/hooks/useSessionValidation';
import { useCamera } from '../../utils/hooks/useCamera';
import { capturePhotoFromVideo } from '../../utils/camera';

export const usePanPage = () => {
  const navigate = useNavigate();
  const { isRecording, startRecording } = useSessionRecording();
  const { validateSession } = useSessionValidation();
  
  // Camera hook with back camera for document capture
  const {
    videoRef,
    isCameraReady,
    isCameraOpen,
    error: cameraError,
    startCamera,
    stopCamera,
    setError: setCameraError,
  } = useCamera({
    facingMode: 'environment',
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    audio: false,
  });

  // Page-specific state
  const [panImages, setPanImages] = useState<PanImages>({ front: null, back: null }); 
  const [activeSide, setActiveSide] = useState<'front' | 'back' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionRecordingStartedRef = useRef(false);

  // Combined error state
  const error = cameraError || uploadError;

  // Validate session and start session recording on component mount
  useEffect(() => {
    try {
      validateSession();
    } catch {
      // Session validation hook handles navigation
    }

    // Start session recording immediately when page loads for audit trail
    const startSessionRecording = async () => {
      if (!sessionRecordingStartedRef.current && !isRecording) {
        try {
          const recordingStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true,
          });
          startRecording(recordingStream);
          sessionRecordingStartedRef.current = true;
          console.log('Session recording started on page load');
        } catch (err) {
          console.warn('Could not start session recording:', err);
        }
      }
    };

    startSessionRecording();
  }, [isRecording, startRecording]);

  /**
   * Request access to back camera (environment) for document capture
   */
  const startCameraForCapture = async () => {
    await startCamera({
      facingMode: 'environment',
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      audio: false,
    });
  };

  /**
   * Capture full photo from video stream
   */
  const capturePhoto = () => {
    if (!videoRef.current || !activeSide) return;

    // Capture full video frame
    const imageData = capturePhotoFromVideo(videoRef.current);

    // Save image for the active side and close camera
    setPanImages((prev) => ({ ...prev, [activeSide]: imageData }));
    stopCamera();
    setActiveSide(null);
  };

  /**
   * Handle file upload from file input
   * Converts uploaded image file to base64 format
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeSide) return;

    setUploadError(null);

    try {
      // Convert file to base64 using FileReader
      const imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target?.result as string);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      
      // Save image for the active side
      setPanImages((prev) => ({ ...prev, [activeSide]: imageData }));
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
   * Remove uploaded image for a specific side
   */
  const removeImage = (side: 'front' | 'back') => {
    setPanImages((prev) => ({ ...prev, [side]: null }));
  };

  /**
   * Upload PAN card images to backend and navigate to OTP page
   * Validates that both front and back images are present before uploading
   */
  const handleContinue = async () => {
    if (!panImages.front || !panImages.back) {
      setUploadError('Please upload both front and back images of your PAN card');
      return;
    }

    const sessionId = validateSession();
    if (!sessionId) {
      setUploadError('Session not found. Please start the verification process again.');
      return;
    }

    setIsProcessing(true);
    setUploadError(null);

    try {
      // Upload images to backend
      const response = await uploadPanCardImages({
        sessionId,
        frontImage: panImages.front,
        backImage: panImages.back,
      });

      if (response.success) {
        navigate('/otp');
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
  const canContinue = panImages.front !== null && panImages.back !== null;

  return {
    panImages,
    activeSide,
    isCameraOpen,
    isCameraReady,
    isProcessing,
    error,
    videoRef,
    fileInputRef,
    openUploadOptions,
    selectUploadMode,
    closeUploadOptions,
    capturePhoto,
    handleFileUpload,
    removeImage,
    handleContinue,
    canContinue,
  };
};
