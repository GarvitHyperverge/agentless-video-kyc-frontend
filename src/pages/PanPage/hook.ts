import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PanImages } from './type';
import { compressImage, validateImageFile } from './utils';
import { uploadPanCardImages } from '../../services/api/panCard';

export const usePanPage = () => {
  const navigate = useNavigate();
  const [panImages, setPanImages] = useState<PanImages>({ front: null, back: null });
  const [activeSide, setActiveSide] = useState<'front' | 'back' | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if session exists
  useEffect(() => {
    const sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      alert('Session not found. Please start the verification process again.');
      navigate('/');
    }
  }, [navigate]);

  // Initialize video stream when camera opens and video element is ready
  useEffect(() => {
    if (isCameraOpen && streamRef.current) {
      setIsCameraReady(false);
      // Wait for next frame to ensure video element is mounted
      const initVideo = () => {
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.onloadedmetadata = () => {
            setIsCameraReady(true);
          };
          videoRef.current.play().catch(console.error);
        } else {
          // Video element not ready yet, try again next frame
          requestAnimationFrame(initVideo);
        }
      };
      requestAnimationFrame(initVideo);
    }
  }, [isCameraOpen]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      setError(null);
    } catch (err) {
      setError('Unable to access camera. Please ensure camera permissions are granted.');
      console.error('Camera error:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setIsCameraReady(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !activeSide) return;

    const video = videoRef.current;
    
    // Actual video dimensions (from the camera)
    const videoNaturalWidth = video.videoWidth;
    const videoNaturalHeight = video.videoHeight;
    
    // Displayed video element dimensions (on screen)
    const displayWidth = video.clientWidth;
    const displayHeight = video.clientHeight;
    
    // Calculate object-cover scaling
    const videoAspect = videoNaturalWidth / videoNaturalHeight;
    const displayAspect = displayWidth / displayHeight;
    
    let scale: number;
    let offsetX = 0;
    let offsetY = 0;
    
    if (videoAspect > displayAspect) {
      // Video is wider - height fits, width is cropped
      scale = videoNaturalHeight / displayHeight;
      offsetX = (videoNaturalWidth - displayWidth * scale) / 2;
    } else {
      // Video is taller - width fits, height is cropped
      scale = videoNaturalWidth / displayWidth;
      offsetY = (videoNaturalHeight - displayHeight * scale) / 2;
    }
    
    // Guide frame dimensions on screen (90% width, max 448px, aspect ratio 1.6)
    const guideAspectRatio = 1.6;
    const guideWidthOnScreen = Math.min(displayWidth * 0.9, 448);
    const guideHeightOnScreen = guideWidthOnScreen / guideAspectRatio;
    
    // Guide frame position on screen (centered)
    const guideXOnScreen = (displayWidth - guideWidthOnScreen) / 2;
    const guideYOnScreen = (displayHeight - guideHeightOnScreen) / 2;
    
    // Convert screen coordinates to video coordinates
    const cropX = offsetX + guideXOnScreen * scale;
    const cropY = offsetY + guideYOnScreen * scale;
    const cropWidth = guideWidthOnScreen * scale;
    const cropHeight = guideHeightOnScreen * scale;

    // Create canvas with good resolution
    const outputWidth = Math.min(cropWidth, 1200);
    const outputHeight = outputWidth / guideAspectRatio;
    
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw only the cropped portion
    ctx.drawImage(
      video,
      cropX, cropY, cropWidth, cropHeight,  // Source rectangle (in video coordinates)
      0, 0, outputWidth, outputHeight        // Destination rectangle
    );
    
    const imageData = canvas.toDataURL('image/jpeg', 0.9);

    setPanImages((prev) => ({ ...prev, [activeSide]: imageData }));
    stopCamera();
    setActiveSide(null);
  }, [activeSide, stopCamera]);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !activeSide) return;

      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const compressedImage = await compressImage(file);
        setPanImages((prev) => ({ ...prev, [activeSide]: compressedImage }));
        setActiveSide(null);
      } catch (err) {
        setError('Failed to process image. Please try again.');
        console.error('Image processing error:', err);
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [activeSide]
  );

  const openUploadOptions = (side: 'front' | 'back') => {
    setActiveSide(side);
    setError(null);
  };

  const selectUploadMode = (mode: 'camera' | 'file') => {
    if (mode === 'camera') {
      startCamera();
    } else if (mode === 'file') {
      fileInputRef.current?.click();
    }
  };

  const closeUploadOptions = () => {
    stopCamera();
    setActiveSide(null);
    setError(null);
  };

  const removeImage = (side: 'front' | 'back') => {
    setPanImages((prev) => ({ ...prev, [side]: null }));
  };

  const handleContinue = async () => {
    if (!panImages.front || !panImages.back) {
      setError('Please upload both front and back images of your PAN card');
      return;
    }

    const sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      setError('Session not found. Please start the verification process again.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Upload images to backend
      const response = await uploadPanCardImages({
        sessionId,
        frontImage: panImages.front,
        backImage: panImages.back,
      });

      if (response.success) {
        // Store image paths in session storage for next step
        sessionStorage.setItem('pan_images', JSON.stringify({
          sessionId,
          frontPath: response.data.frontImagePath,
          backPath: response.data.backImagePath,
        }));
        navigate('/verification');
      } else {
        setError(response.message || 'Failed to upload PAN card images');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload PAN card images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

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
