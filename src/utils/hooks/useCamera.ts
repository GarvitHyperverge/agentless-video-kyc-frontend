import { useState, useRef, useEffect } from 'react';

interface CameraOptions {
  facingMode?: 'user' | 'environment';
  width?: { ideal: number };
  height?: { ideal: number };
  audio?: boolean;
}

interface UseCameraReturn {
  streamRef: React.MutableRefObject<MediaStream | null>;
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
  isCameraReady: boolean;
  isCameraOpen: boolean;
  error: string | null;
  startCamera: (options?: CameraOptions) => Promise<void>;
  stopCamera: () => void;
  setError: (error: string | null) => void;
}

/**
 * Simple camera hook - just start camera, attach to video, and stop camera
 */
export const useCamera = (initialOptions?: CameraOptions): UseCameraReturn => {
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Attach stream to video element when stream is available
  useEffect(() => {
    if (streamRef.current && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadedmetadata = () => {
        setIsCameraReady(true);
      };
    }
  });

  /**
   * Start camera
   */
  const startCamera = async (options?: CameraOptions) => {
    const opts = options || initialOptions;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: opts?.facingMode || 'user',
          width: opts?.width || { ideal: 1280 },
          height: opts?.height || { ideal: 720 },
        },
        audio: opts?.audio || false,
      });

      streamRef.current = stream;
      setIsCameraOpen(true);
      setError(null);
    } catch (err) {
      const errorMessage = opts?.audio
        ? 'Unable to access camera and microphone. Please ensure permissions are granted.'
        : 'Unable to access camera. Please ensure camera permissions are granted.';
      setError(errorMessage);
      console.error('Camera error:', err);
    }
  };

  /**
   * Stop camera
   */
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setIsCameraReady(false);
  };

  return {
    streamRef,
    videoRef,
    isCameraReady,
    isCameraOpen,
    error,
    startCamera,
    stopCamera,
    setError,
  };
};
