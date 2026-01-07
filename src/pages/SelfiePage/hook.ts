import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SelfieImage } from './type';
import { uploadSelfie } from '../../services/api/selfie';

export const useSelfiePage = () => {
  const navigate = useNavigate();
  const [selfieImage, setSelfieImage] = useState<SelfieImage>({ image: null });
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check if session exists
  useEffect(() => {
    const sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      alert('Session not found. Please start the verification process again.');
      navigate('/');
    }
  }, [navigate]);

  // Initialize video stream when camera opens
  useEffect(() => {
    if (isCameraOpen && streamRef.current) {
      setIsCameraReady(false);
      const initVideo = () => {
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.onloadedmetadata = () => {
            setIsCameraReady(true);
          };
          videoRef.current.play().catch(console.error);
        } else {
          requestAnimationFrame(initVideo);
        }
      };
      requestAnimationFrame(initVideo);
    }
  }, [isCameraOpen]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
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
    if (!videoRef.current) return;

    const video = videoRef.current;
    const videoNaturalWidth = video.videoWidth;
    const videoNaturalHeight = video.videoHeight;
    const displayWidth = video.clientWidth;
    const displayHeight = video.clientHeight;

    // Calculate scale and offset for object-cover
    let scale: number;
    let offsetX = 0;
    let offsetY = 0;

    const videoAspect = videoNaturalWidth / videoNaturalHeight;
    const displayAspect = displayWidth / displayHeight;

    if (videoAspect > displayAspect) {
      // Video is wider - crop sides
      scale = videoNaturalHeight / displayHeight;
      offsetX = (videoNaturalWidth - displayWidth * scale) / 2;
    } else {
      // Video is taller - crop top/bottom
      scale = videoNaturalWidth / displayWidth;
      offsetY = (videoNaturalHeight - displayHeight * scale) / 2;
    }

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

    // Map screen coordinates to video coordinates
    const cropX = offsetX + guideXOnScreen * scale;
    const cropY = offsetY + guideYOnScreen * scale;
    const cropWidth = guideWidthOnScreen * scale;
    const cropHeight = guideHeightOnScreen * scale;

    // Output dimensions (maintain aspect ratio)
    const outputWidth = Math.min(cropWidth, 800);
    const outputHeight = outputWidth * (guideHeightOnScreen / guideWidthOnScreen);

    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      video,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, outputWidth, outputHeight
    );

    const imageData = canvas.toDataURL('image/jpeg', 0.9);

    setSelfieImage({ image: imageData });
    stopCamera();
  }, [stopCamera]);

  const openCamera = () => {
    setError(null);
    startCamera();
  };

  const closeCamera = () => {
    stopCamera();
    setError(null);
  };

  const removeImage = () => {
    setSelfieImage({ image: null });
  };

  const retakePhoto = async () => {
    setSelfieImage({ image: null });
    setError(null);
    
    // Start fresh camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsCameraReady(true);
          };
          videoRef.current.play().catch(console.error);
        }
      });
    } catch (err) {
      setError('Unable to access camera. Please try again.');
      console.error('Camera error:', err);
    }
  };

  const handleContinue = async () => {
    if (!selfieImage.image) {
      setError('Please capture or upload a selfie');
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
      const response = await uploadSelfie({
        sessionId,
        image: selfieImage.image,
      });

      if (response.success) {
        sessionStorage.setItem('selfie_image', JSON.stringify({
          sessionId,
          imagePath: response.data.imagePath,
        }));
        navigate('/thank-you');
      } else {
        setError(response.message || 'Failed to upload selfie');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload selfie. Please try again.');
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
