import { useCallback, useEffect, useRef, useState } from 'react';
import { capturePhotoFromVideo } from '../camera';
import { useSessionRecording } from '../../services/sessionRecording/context';

interface UseBackCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCameraReady: boolean;
  isCameraOpen: boolean;
  setIsCameraOpen: React.Dispatch<React.SetStateAction<boolean>>;
  startBackCamera: () => Promise<MediaStream | null>;
  stopBackCamera: () => void;
  capturePhoto: () => Promise<Blob | null>;
}

const stopMediaStream = (stream: MediaStream | null) => {
  if (!stream) return;
  stream.getTracks().forEach((t) => {
    if (t.readyState === 'live') t.stop();
  });
};

/**
 * Request a back camera stream only.
 * Returns null if back camera is unavailable.
 */
const requestBackCameraStream = async (): Promise<MediaStream | null> => {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    });
  } catch {
    return null;
  }
};

/**
 * Hook for capturing photos using back camera, with fallback to shared stream (front camera).
 * Tries back camera first, falls back to shared stream if back camera is unavailable.
 */
export const useBackCamera = (): UseBackCameraReturn => {
  const { getSharedStream, recordingStream, startRecording } = useSessionRecording();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isUsingSharedStreamRef = useRef(false);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const startBackCamera = useCallback(async (): Promise<MediaStream | null> => {
    if (streamRef.current) return streamRef.current;

    // Try back camera first
    let stream = await requestBackCameraStream();
    
    // Fallback to shared stream if back camera is unavailable
    if (!stream) {
      try {
        // Ensure shared stream is initialized
        if (!recordingStream) {
          await startRecording();
        }
        stream = getSharedStream();
        if (stream) {
          isUsingSharedStreamRef.current = true;
        }
      } catch (err) {
        console.warn('Could not get shared stream as fallback:', err);
      }
    }

    if (!stream) return null;

    streamRef.current = stream;
    return stream;
  }, [getSharedStream, recordingStream, startRecording]);

  const stopBackCamera = useCallback(() => {
    setIsCameraReady(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    // Only stop the stream if it's a dedicated back camera stream (not shared)
    if (!isUsingSharedStreamRef.current && streamRef.current) {
      stopMediaStream(streamRef.current);
    }
    streamRef.current = null;
    isUsingSharedStreamRef.current = false;
  }, []);

  // Attach stream to video element when camera modal opens
  useEffect(() => {
    if (!isCameraOpen) {
      // If the UI closes, stop the stream to avoid keeping camera on.
      stopBackCamera();
      return;
    }

    if (!videoRef.current) return;
    if (!streamRef.current) return;

    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.onloadedmetadata = () => {
      setIsCameraReady(true);
    };
    video.play().catch((err) => {
      console.error('Error playing back camera video:', err);
    });
  }, [isCameraOpen, stopBackCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBackCamera();
    };
  }, [stopBackCamera]);

  const capturePhoto = useCallback(async (): Promise<Blob | null> => {
    if (!videoRef.current) return null;
    try {
      return await capturePhotoFromVideo(videoRef.current);
    } catch (err) {
      console.error('Capture error:', err);
      return null;
    }
  }, []);

  return {
    videoRef,
    isCameraReady,
    isCameraOpen,
    setIsCameraOpen,
    startBackCamera,
    stopBackCamera,
    capturePhoto,
  };
};

