import { useState, useRef, useEffect } from 'react';
import { useSessionRecording } from '../../services/sessionRecording/context';
import { capturePhotoFromVideo } from '../camera';

// No options interface needed - always auto-initializes shared stream

interface UseCameraCaptureReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCameraReady: boolean;
  isCameraOpen: boolean;
  setIsCameraOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCameraReady: React.Dispatch<React.SetStateAction<boolean>>;
  capturePhoto: () => Promise<Blob | null>;
}

/**
 * Reusable hook for camera capture functionality
 * Handles stream initialization, video element attachment, and photo capture
 */
export const useCameraCapture = (): UseCameraCaptureReturn => {
  const { getSharedStream, recordingStream, startRecording } = useSessionRecording();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Initialize shared stream on mount
  useEffect(() => {
    const initializeStream = async () => {
      try {
        if (!recordingStream) {
          await startRecording();
        }
      } catch (err) {
        console.warn('Could not initialize shared stream:', err);
      }
    };

    initializeStream();
  }, [recordingStream, startRecording]);

  // Attach stream to video element when camera modal opens
  useEffect(() => {
    if (isCameraOpen && videoRef.current) {
      // Use requestAnimationFrame to ensure video element is fully mounted in DOM
      // This prevents timing issues where React state updates before DOM is ready
      requestAnimationFrame(() => {
        // Double-check element still exists (otherwise throw ts error below)
        if (!videoRef.current) return;
        
        // Get shared camera stream from session recording context
        const stream = getSharedStream();
        
        if (stream) {
          // Attach stream to video element (browser starts receiving frames)
          videoRef.current.srcObject = stream;
          
          // This event fires when browser has processed the stream and knows video properties
          // We set isCameraReady=true here to ensure stream is fully initialized before allowing capture
          videoRef.current.onloadedmetadata = () => {
            setIsCameraReady(true);
          };
          
          // Start playing video stream
          videoRef.current.play().catch((err) => {
            console.error('Error playing video:', err);
          });
        }
      });
    } else if (!isCameraOpen) {
      // Reset camera ready state when modal closes
      setIsCameraReady(false);
    }
  }, [isCameraOpen, getSharedStream]);


  /**
   * Capture photo from video stream
   */
  const capturePhoto = async (): Promise<Blob | null> => {
    if (!videoRef.current) {
      return null;
    }

    try {
      const blob = await capturePhotoFromVideo(videoRef.current);
      return blob;
    } catch (err) {
      console.error('Capture error:', err);
      return null;
    }
  };

  return {
    videoRef,
    isCameraReady,
    isCameraOpen,
    setIsCameraOpen,
    setIsCameraReady,
    capturePhoto,
  };
};
