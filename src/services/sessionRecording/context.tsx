import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { uploadSessionRecording } from '../api/sessionRecording';

interface SessionRecordingContextType {
  isRecording: boolean;
  recordingStream: MediaStream | null;
  startRecording: (stream: MediaStream) => void;
  stopRecording: () => Promise<Blob | null>;
  downloadRecording: () => Promise<boolean>;
  uploadRecording: () => Promise<boolean>;
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
  const chunksRef = useRef<Blob[]>([]);
  // Final video recording blob to be uploaded
  const recordingBlobRef = useRef<Blob | null>(null);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = useCallback((stream: MediaStream) => {
    // Don't start if already recording with the same stream
    if (mediaRecorderRef.current && isRecording && recordingStream === stream) {
      console.log('Already recording with this stream');
      return;
    }

    try {
      // Stop any existing recording first
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // Create a new stream that combines video and audio
      setRecordingStream(stream);
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);

      // Store chunks of data as they are available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      console.log('Session recording started');
    } catch (err) {
      console.error('Failed to start session recording:', err);
    }
  }, [isRecording, recordingStream]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      // Capture the current stream before stopping
      const currentStream = recordingStream;
      
      // Stop tracks immediately (don't wait for recorder to stop)
      if (currentStream) {
        currentStream.getTracks().forEach(track => {
          if (track.readyState === 'live') {
            track.stop();
            console.log('Stopped track:', track.kind, track.label, 'State:', track.readyState);
          }
        });
      }
      
      // Clear stream state immediately so UI updates right away
      setRecordingStream(null);
      setIsRecording(false);
      
      // Checking if recorder is on or not
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = () => {
          // Small delay to ensure all chunks are collected
          setTimeout(() => {
            const finalChunks = [...chunksRef.current];
            const blob = new Blob(finalChunks, { type: 'video/webm' });
            recordingBlobRef.current = blob;
            
            console.log('Session recording stopped, blob size:', blob.size, 'chunks:', finalChunks.length);
            resolve(blob);
          }, 100);
        };
        mediaRecorderRef.current.stop();
      } else {
        // If recorder is not on, just resolve
        resolve(recordingBlobRef.current);
      }
    });
  }, [recordingStream]);

  const downloadRecording = useCallback(async (): Promise<boolean> => {
    const sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      console.error('No session ID found');
      return false;
    }

    // Stop recording 
    const blob = await stopRecording();
    
    if (!blob || blob.size === 0) {
      console.error('No recording data to download');
      return false;
    }

    try {
      // Automatically download the recording
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

    // Stop recording and get blob
    const blob = await stopRecording();
    
    if (!blob || blob.size === 0) {
      console.error('No recording data to upload');
      return false;
    }

    try {
      console.log(`Uploading session recording: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
      const response = await uploadSessionRecording(sessionId, blob);
      
      if (response.success) {
        console.log('Session recording uploaded successfully:', response.data.videoPath);
        return true;
      } else {
        console.error('Upload failed:', response.message);
        return false;
      }
    } catch (err) {
      console.error('Error uploading session recording:', err);
      return false;
    }
  }, [stopRecording]);

  return (
    <SessionRecordingContext.Provider
      value={{
        isRecording,
        recordingStream,
        startRecording,
        stopRecording,
        downloadRecording,
        uploadRecording,
      }}
    >
      {children}
    </SessionRecordingContext.Provider>
  );
};
