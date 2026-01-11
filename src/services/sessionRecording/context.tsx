import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { uploadSessionRecording } from '../api/sessionRecording';
import { validateSession } from '../../utils/session';

interface SessionRecordingContextType {
  isSessionRecording: boolean;
  recordingStream: MediaStream | null;
  startRecording: (stream?: MediaStream) => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  downloadRecording: () => Promise<boolean>;
  uploadRecording: () => Promise<boolean>;
  getSharedStream: () => MediaStream | null;
  pauseRecording: () => void;
  resumeRecording: () => void;
  isStreamInitialized: boolean;
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
  const [isSessionRecording, setIsSessionRecording] = useState(false);
  const chunksRef = useRef<Blob[]>([]);
  // Final video recording blob to be uploaded
  const recordingBlobRef = useRef<Blob | null>(null);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const pausedTracksRef = useRef<MediaStreamTrack[]>([]);
  const [isStreamInitialized, setIsStreamInitialized] = useState(false);

  const startRecording = useCallback(async (providedStream?: MediaStream): Promise<void> => {
    // If we already have a stream and recording is active, don't restart
    if (recordingStream && isSessionRecording && !providedStream) {
      console.log('Already recording with shared stream');
      return;
    }

    // If provided stream is the same as existing, don't restart
    if (recordingStream && providedStream === recordingStream && isSessionRecording) {
      console.log('Already recording with this stream');
      return;
    }

    try {
      // Stop any existing recording first
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // Use provided stream or existing stream, or create new one
      let stream: MediaStream;
      if (providedStream) {
        stream = providedStream;
      } else if (recordingStream && isStreamInitialized) {
        // Use existing shared stream - just restart recording
        stream = recordingStream;
      } else {
        // Create new shared stream with front camera + audio
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        setRecordingStream(stream);
        setIsStreamInitialized(true);
        console.log('Shared stream created and initialized');
      }

      // Only set stream if we created a new one
      if (!recordingStream) {
        setRecordingStream(stream);
        setIsStreamInitialized(true);
      }

      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);

      // Store chunks of data as they become available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setIsSessionRecording(true);
      console.log('Session recording started with shared stream');
    } catch (err) {
      console.error('Failed to start session recording:', err);
      throw err;
    }
  }, [isSessionRecording, recordingStream, isStreamInitialized]);

  const pauseRecording = useCallback(() => {
    if (recordingStream && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      // Pause video tracks but keep audio for session recording
      const videoTracks = recordingStream.getVideoTracks();
      pausedTracksRef.current = videoTracks;
      videoTracks.forEach(track => {
        track.enabled = false;
      });
      console.log('Session recording video paused (audio continues)');
    }
  }, [recordingStream]);

  const resumeRecording = useCallback(() => {
    if (pausedTracksRef.current.length > 0) {
      pausedTracksRef.current.forEach(track => {
        track.enabled = true;
      });
      pausedTracksRef.current = [];
      console.log('Session recording video resumed');
    }
  }, []);

  const getSharedStream = useCallback(() => {
    return recordingStream;
  }, [recordingStream]);

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
      setIsSessionRecording(false);
      setIsStreamInitialized(false);
      
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

  // Not used as of now in the project
  const downloadRecording = useCallback(async (): Promise<boolean> => {
    let sessionId: string;
    try {
      sessionId = validateSession();
    } catch (err) {
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
    let sessionId: string;
    try {
      sessionId = validateSession();
    } catch (err) {
      console.error('No session ID found');
      return false;
    }

    // Get location from localStorage (stored during initial permission request on LandingPage)
    const storedLatitude = localStorage.getItem('user_latitude');
    const storedLongitude = localStorage.getItem('user_longitude');
    
    let latitude: number;
    let longitude: number;
    
    if (storedLatitude && storedLongitude) {
      latitude = parseFloat(storedLatitude);
      longitude = parseFloat(storedLongitude);
    } else {
      // Fallback if location not found in localStorage
      console.warn('Location not found in localStorage, using default values');
      latitude = 0;
      longitude = 0;
    }

    // Stop recording and get blob
    const blob = await stopRecording();
    
    if (!blob || blob.size === 0) {
      console.error('No recording data to upload');
      return false;
    }

    try {
      console.log(`Uploading session recording: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
      const response = await uploadSessionRecording(sessionId, blob, latitude, longitude);
      
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
        isSessionRecording,
        recordingStream,
        startRecording,
        stopRecording,
        downloadRecording,
        uploadRecording,
        getSharedStream,
        pauseRecording,
        resumeRecording,
        isStreamInitialized,
      }}
    >
      {children}
    </SessionRecordingContext.Provider>
  );
};
