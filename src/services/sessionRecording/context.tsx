import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { uploadSessionRecording } from '../api/sessionRecording';
import { getToken } from '../../utils/session';
import { SessionRecordingContextType } from './type';
import { getJWTTimestamp } from '../../utils/jwt';
import { getStoredLocation } from '../../utils/location';
import { watermarkVideo } from '../../utils/watermark';

const SessionRecordingContext = createContext<SessionRecordingContextType | null>(null);

export const useSessionRecording = (): SessionRecordingContextType => {
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

  const startRecording = useCallback(async (): Promise<void> => {
    // If we already have a stream and recording is active, don't restart
    if (recordingStream && isSessionRecording) {
      console.log('Already recording with shared stream');
      return;
    }

    try {
      // Stop any existing recording first
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // Use existing stream or create new one
      let stream: MediaStream;
      if (recordingStream && isStreamInitialized) {
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

  const uploadRecording = useCallback(async (): Promise<boolean> => {
    // uploadRecording is only called from protected routes, so token must exist
    const token = getToken();
    if (!token) {
      console.error('No token found');
      return false;
    }

    // Stop recording and get blob
    const originalBlob = await stopRecording();
    
    if (!originalBlob || originalBlob.size === 0) {
      console.error('No recording data to upload');
      return false;
    }

    try {
      // Get location for watermarking
      const location = getStoredLocation();

      let blobToUpload = originalBlob;
      
      if (location) {
        try {
          // Extract timestamp from JWT
          const timestamp = getJWTTimestamp(token);
          
          // Watermark the video
          console.log('Watermarking session recording...');
          blobToUpload = await watermarkVideo(originalBlob, timestamp, location.latitude, location.longitude);
          console.log('Session recording watermarked successfully');
        } catch (err) {
          console.warn('Failed to watermark video, using original:', err);
          // Continue with original blob if watermarking fails
        }
      } else {
        console.warn('Location data not available, uploading without watermark');
      }

      console.log(`Uploading session recording: ${(blobToUpload.size / 1024 / 1024).toFixed(2)}MB`);
      const response = await uploadSessionRecording(token, blobToUpload);
      
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
