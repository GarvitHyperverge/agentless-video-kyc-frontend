import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { uploadSessionRecording } from '../api/sessionRecording';
import { SessionRecordingContextType } from './type';
import { getStoredLocation } from '../../utils/location';
import { watermarkStream } from '../../utils/watermark';
import { fixWebMDuration } from '../../utils/fixWebMDuration';

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
  const recordingBlobRef = useRef<Blob | null>(null);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = useCallback(async (): Promise<void> => {
    // If recording is already active, don't restart
    if (isSessionRecording) {
      console.log('Already recording with shared stream');
      return;
    }

    try {
      // Stop any existing recording first
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // Use existing stream or create new one
      let originalStream: MediaStream;
      if (recordingStream) {
        // Use existing shared stream - just restart recording
        originalStream = recordingStream;
      } else {
        // Create new shared stream with front camera + audio
        originalStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        setRecordingStream(originalStream);
        console.log('Shared stream created and initialized');
      }

      // Get location for watermarking
      const location = getStoredLocation();
      if (!location) {
        console.warn('No location found for watermarking, recording without watermark');
        // Continue without watermarking if location not available
      }

      // Watermark the stream in real-time if we have location
      let streamToRecord: MediaStream = originalStream;
      if (location) {
        try {
          // Use current timestamp for watermarking (in seconds)
          const timestamp = Math.floor(Date.now() / 1000);
          streamToRecord = watermarkStream(originalStream, timestamp, location.latitude, location.longitude);
          console.log('Stream watermarked in real-time');
        } catch (err) {
          console.warn('Failed to watermark stream, recording original:', err);
          // Continue with original stream if watermarking fails
        }
      }

      const mediaRecorder = new MediaRecorder(streamToRecord);
      chunksRef.current = [];
      // Store chunks of data as they become available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setIsSessionRecording(true);
      console.log('Session recording started with watermarked stream');
    } catch (err) {
      console.error('Failed to start session recording:', err);
      throw err;
    }
  }, [isSessionRecording, recordingStream]);

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
      
      // Checking if recorder is on or not
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = async () => {
          // Wait longer to ensure all chunks are collected and MediaRecorder has finished writing
          setTimeout(async () => {
            const finalChunks = [...chunksRef.current];
            
            const originalBlob = new Blob(finalChunks, { type: 'video/webm' });
            console.log('Created blob from', finalChunks.length, 'chunks, total size:', originalBlob.size, 'bytes');
            
            // Fix duration metadata (MediaRecorder sometimes doesn't write it correctly)
            // This ensures the video has correct duration metadata when uploaded to backend
            let blob: Blob;
            try {
              console.log('Fixing WebM duration metadata for session recording...');
              blob = await fixWebMDuration(originalBlob);
              
              // Log success - the blob now has correct duration metadata
              console.log('Session recording duration fixed successfully. Original size:', originalBlob.size, 'bytes, Fixed size:', blob.size, 'bytes');
              
            } catch (err) {
              console.error('Failed to fix WebM duration metadata:', err);
              console.warn('Using original blob - duration metadata may be incorrect');
              blob = originalBlob;
            }
            
            recordingBlobRef.current = blob;
            resolve(blob);
          }, 500); // Increased delay to ensure all chunks are collected
        };
        mediaRecorderRef.current.stop();
      } else {
        // If recorder is not on, just resolve
        resolve(recordingBlobRef.current);
      }
    });
  }, [recordingStream]);

  const uploadRecording = useCallback(async (): Promise<boolean> => {
    // Stop recording and get blob (already watermarked during recording)
    const blobToUpload = await stopRecording();
    
    if (!blobToUpload || blobToUpload.size === 0) {
      console.error('No recording data to upload');
      return false;
    }

    try {
      // Video is already watermarked during recording, upload directly
      // Cookie is automatically sent with credentials: 'include'
      console.log(`Uploading session recording (already watermarked): ${(blobToUpload.size / 1024 / 1024).toFixed(2)}MB`);
      const response = await uploadSessionRecording(blobToUpload);
      
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
      }}
    >
      {children}
    </SessionRecordingContext.Provider>
  );
};
