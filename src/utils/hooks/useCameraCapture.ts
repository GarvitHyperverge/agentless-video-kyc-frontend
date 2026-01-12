import { useState, useRef, useEffect } from 'react';
import { useSessionRecording } from '../../services/sessionRecording/context';
import { capturePhotoFromVideo } from '../camera';

interface UseCameraCaptureOptions {
  /**
   * If true, initializes shared stream on mount
   * If false, stream must be initialized manually
   */
  autoInitializeStream?: boolean;
  /**
   * Custom stream ref - if provided, will watch this ref for stream changes
   */
  customStreamRef?: React.MutableRefObject<MediaStream | null>;
}

interface UseCameraCaptureReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCameraReady: boolean;
  isCameraOpen: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  openCamera: () => void;
  closeCamera: () => void;
  capturePhoto: () => Promise<Blob | null>;
}

/**
 * Reusable hook for camera capture functionality
 * Handles stream initialization, video element attachment, and photo capture
 */
export const useCameraCapture = (
  options: UseCameraCaptureOptions = {}
): UseCameraCaptureReturn => {
  const { autoInitializeStream = true, customStreamRef } = options;
  
  const { getSharedStream, isStreamInitialized, startRecording } = useSessionRecording();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize shared stream on mount if autoInitializeStream is true
  useEffect(() => {
    if (!autoInitializeStream) return;

    const initializeStream = async () => {
      try {
        if (!isStreamInitialized) {
          await startRecording();
        }
      } catch (err) {
        console.warn('Could not initialize shared stream:', err);
        setError('Unable to access camera. Please ensure permissions are granted.');
      }
    };

    initializeStream();
  }, [autoInitializeStream, isStreamInitialized, startRecording]);

  // Attach stream to video element when camera modal opens
  useEffect(() => {
    if (isCameraOpen && videoRef.current) {
      // Use requestAnimationFrame to ensure video element is mounted
      requestAnimationFrame(() => {
        if (!videoRef.current) return;
        
        // Use custom stream ref if provided, otherwise use shared stream
        const stream = customStreamRef?.current || getSharedStream();
        
        if (stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsCameraReady(true);
          };
          videoRef.current.play().catch((err) => {
            console.error('Error playing video:', err);
          });
        } else {
          setError('Camera stream not available. Please ensure permissions are granted.');
        }
      });
    } else if (!isCameraOpen) {
      // Reset camera ready state when modal closes
      setIsCameraReady(false);
    }
  }, [isCameraOpen, getSharedStream, customStreamRef]);

  /**
   * Open camera view
   */
  const openCamera = () => {
    setError(null);
    setIsCameraOpen(true);
  };

  /**
   * Close camera view - stream remains active for recording
   */
  const closeCamera = () => {
    setIsCameraOpen(false);
    setIsCameraReady(false);
  };

  /**
   * Capture photo from video stream
   */
  const capturePhoto = async (): Promise<Blob | null> => {
    if (!videoRef.current) {
      setError('Video element not available');
      return null;
    }

    try {
      const blob = await capturePhotoFromVideo(videoRef.current);
      return blob;
    } catch (err) {
      console.error('Capture error:', err);
      setError('Failed to capture photo. Please try again.');
      return null;
    }
  };

  return {
    videoRef,
    isCameraReady,
    isCameraOpen,
    error,
    setError,
    openCamera,
    closeCamera,
    capturePhoto,
  };
};
