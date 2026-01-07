import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { uploadSessionRecording } from '../api/sessionRecording';

interface SessionRecordingContextType {
  isRecording: boolean;
  recordingStream: MediaStream | null;
  startRecording: (stream: MediaStream) => void;
  stopRecording: () => Promise<Blob | null>;
  getRecordingBlob: () => Blob | null;
  uploadRecording: () => Promise<boolean>;
  downloadRecording: () => Promise<boolean>;
}

const SessionRecordingContext = createContext<SessionRecordingContextType | null>(null);

export const useSessionRecording = () => {
  const context = useContext(SessionRecordingContext);
  if (!context) {
    throw new Error('useSessionRecording must be used within SessionRecordingProvider');
  }
  return context;
};

export const SessionRecordingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingBlobRef = useRef<Blob | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback((stream: MediaStream) => {
    // Don't start if already recording with the same stream
    if (mediaRecorderRef.current && isRecording && streamRef.current === stream) {
      console.log('Already recording with this stream');
      return;
    }

    try {
      // Stop any existing recording first
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // Create a new stream that combines video and audio
      streamRef.current = stream;
      setRecordingStream(stream);
      chunksRef.current = [];
      
      // Check for supported mime types with fallback
      let mimeType = '';
      const types = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ];

      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
      };

      mediaRecorder.onstop = () => {
        // Ensure all chunks are collected before creating blob
        const finalChunks = [...chunksRef.current];
        const blob = new Blob(finalChunks, { type: mimeType || 'video/webm' });
        recordingBlobRef.current = blob;
        setIsRecording(false);
        // Don't clear the stream here - let stopRecording handle it
        console.log('Session recording stopped, blob size:', blob.size, 'chunks:', finalChunks.length);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      console.log('Session recording started with mimeType:', mimeType || 'default');
    } catch (err) {
      console.error('Failed to start session recording:', err);
      setRecordingStream(null);
    }
  }, [isRecording]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        // Wait for all data to be available
        mediaRecorderRef.current.onstop = () => {
          // Small delay to ensure all chunks are collected
          setTimeout(() => {
            const finalChunks = [...chunksRef.current];
            const blob = new Blob(finalChunks, { type: 'video/webm' });
            recordingBlobRef.current = blob;
            setIsRecording(false);
            setRecordingStream(null);
            
            // Stop all tracks
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
              streamRef.current = null;
            }
            
            console.log('Session recording stopped, blob size:', blob.size, 'chunks:', finalChunks.length);
            resolve(blob);
          }, 100);
        };
        mediaRecorderRef.current.stop();
      } else {
        // Stop tracks even if recorder is already stopped
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        resolve(recordingBlobRef.current);
      }
    });
  }, []);

  const getRecordingBlob = useCallback(() => {
    return recordingBlobRef.current;
  }, []);

  const downloadRecording = useCallback(async (): Promise<boolean> => {
    const sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      console.error('No session ID found');
      return false;
    }

    // Stop recording if still active
    const blob = await stopRecording();
    
    if (!blob || blob.size === 0) {
      console.error('No recording data to download');
      return false;
    }

    try {
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sessionId}_session_recording.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Session recording downloaded');
      return true;
    } catch (err) {
      console.error('Error downloading session recording:', err);
      return false;
    }
  }, [stopRecording]);

  const uploadRecording = useCallback(async (): Promise<boolean> => {
    const sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      console.error('No session ID found');
      return false;
    }

    // Stop recording if still active
    const blob = await stopRecording();
    
    if (!blob || blob.size === 0) {
      console.error('No recording data to upload');
      return false;
    }

    try {
      // Convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert to base64'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const response = await uploadSessionRecording({
        sessionId,
        video: base64,
      });

      if (response.success) {
        console.log('Session recording uploaded successfully');
        return true;
      } else {
        console.error('Failed to upload session recording:', response.message);
        return false;
      }
    } catch (err) {
      console.error('Error uploading session recording:', err);
      return false;
    }
  }, [stopRecording]);

  // Handle tab close/unload - try to save recording
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (isRecording && mediaRecorderRef.current) {
        // Stop recording synchronously as much as possible
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        // Note: async upload may not complete on tab close
        // Consider using sendBeacon or storing in IndexedDB for retry
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isRecording]);

  return (
    <SessionRecordingContext.Provider
      value={{
        isRecording,
        recordingStream,
        startRecording,
        stopRecording,
        getRecordingBlob,
        uploadRecording,
        downloadRecording,
      }}
    >
      {children}
    </SessionRecordingContext.Provider>
  );
};
