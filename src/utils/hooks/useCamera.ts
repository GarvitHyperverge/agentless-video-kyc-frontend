import { useState, useRef, useEffect } from 'react';

interface CameraOptions {
  facingMode?: 'user' | 'environment';
  width?: { ideal: number };
  height?: { ideal: number };
  audio?: boolean;
  autoAttach?: boolean; // Whether to auto-attach stream to video element
  onCameraReady?: () => void; // Callback when camera is ready
}

interface UseCameraReturn {
  streamRef: React.MutableRefObject<MediaStream | null>;
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
  isCameraReady: boolean;
  isCameraOpen: boolean;
  error: string | null;
  startCamera: (options?: CameraOptions) => Promise<void>;
  stopCamera: () => void;
  setIsCameraOpen: (open: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Unified hook for camera management across all pages
 * Handles camera initialization, stream management, and video element attachment
 */
export const useCamera = (initialOptions?: CameraOptions): UseCameraReturn => {
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoAttachRef = useRef<boolean>(initialOptions?.autoAttach !== false);
  const isAttachingRef = useRef<boolean>(false);

  // Initialize video stream when camera opens and video element is ready
  // Only runs when autoAttach is false (manual attachment mode)
  useEffect(() => {
    // Skip if auto-attach mode (handled in startCamera) or already attaching
    if (autoAttachRef.current || isAttachingRef.current) {
      return;
    }

    if (isCameraOpen && streamRef.current && videoRef.current && !videoRef.current.srcObject) {
      setIsCameraReady(false);
      isAttachingRef.current = true;
      const initVideo = () => {
        if (videoRef.current && streamRef.current && !videoRef.current.srcObject) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.onloadedmetadata = () => {
            setIsCameraReady(true);
            isAttachingRef.current = false;
            if (initialOptions?.onCameraReady) {
              initialOptions.onCameraReady();
            }
          };
          videoRef.current.play().catch((err) => {
            isAttachingRef.current = false;
            // Ignore AbortError - video play was interrupted, which is fine
            if (err.name !== 'AbortError') {
              console.error('Video play error:', err);
            }
          });
        } else if (!videoRef.current) {
          // Video element not ready yet, try again next frame
          requestAnimationFrame(initVideo);
        } else {
          isAttachingRef.current = false;
        }
      };
      requestAnimationFrame(initVideo);
    }
  }, [isCameraOpen, initialOptions]);

  /**
   * Start camera with specified options
   */
  const startCamera = async (options?: CameraOptions) => {
    const opts = options || initialOptions;
    const shouldAutoAttach = opts?.autoAttach !== false;
    autoAttachRef.current = shouldAutoAttach;
    
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
      
      // If autoAttach is true (default), attach immediately to video element
      if (shouldAutoAttach) {
        setIsCameraOpen(true);
        isAttachingRef.current = true;
        // Use requestAnimationFrame to ensure video element is ready
        requestAnimationFrame(() => {
          if (videoRef.current && streamRef.current) {
            // Clear any existing stream first to prevent conflicts
            if (videoRef.current.srcObject) {
              videoRef.current.srcObject = null;
            }
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.onloadedmetadata = () => {
              setIsCameraReady(true);
              isAttachingRef.current = false;
              if (opts?.onCameraReady) {
                opts.onCameraReady();
              }
            };
            videoRef.current.play().catch((err) => {
              isAttachingRef.current = false;
              // Ignore AbortError - video play was interrupted, which is fine
              if (err.name !== 'AbortError') {
                console.error('Video play error:', err);
              }
            });
          } else {
            isAttachingRef.current = false;
          }
        });
      } else {
        // Manual attachment mode - useEffect will handle attachment
        setIsCameraOpen(true);
      }
      
      setError(null);
    } catch (err) {
      isAttachingRef.current = false;
      const errorMessage = opts?.audio
        ? 'Unable to access camera and microphone. Please ensure permissions are granted.'
        : 'Unable to access camera. Please ensure camera permissions are granted.';
      setError(errorMessage);
      console.error('Camera error:', err);
    }
  };

  /**
   * Stop camera stream and release media tracks
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
    isAttachingRef.current = false;
  };

  return {
    streamRef,
    videoRef,
    isCameraReady,
    isCameraOpen,
    error,
    startCamera,
    stopCamera,
    setIsCameraOpen,
    setError,
  };
};
