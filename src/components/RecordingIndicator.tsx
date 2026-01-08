import React, { useRef, useEffect } from 'react';
import { useSessionRecording } from '../services/sessionRecording/context';

const RecordingIndicator: React.FC = () => {
  const { isRecording, recordingStream } = useSessionRecording();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && recordingStream) {
      if (videoRef.current.srcObject !== recordingStream) {
        videoRef.current.srcObject = recordingStream;
      }
      
      // Ensure video plays automatically
      if (videoRef.current.paused) {
        videoRef.current.play().catch((err) => {
          console.error('Error playing recording preview:', err);
        });
      }
    } else if (videoRef.current && !recordingStream) {
      // Clear video element when stream is removed
      videoRef.current.srcObject = null;
      videoRef.current.pause();
    }
  }, [recordingStream]);

  // Show if recording OR if we have a stream (even if recording state hasn't updated yet)
  if (!isRecording && !recordingStream) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Video preview with recording badge */}
      {recordingStream && (
        <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-red-500/50">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-40 h-28 object-cover"
          />
          {/* Recording indicator overlay */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-500/90 backdrop-blur-sm px-2 py-0.5 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-[10px] font-medium">REC</span>
          </div>
        </div>
      )}
      {/* Fallback if stream not available but recording */}
      {!recordingStream && isRecording && (
        <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-red-500/50 w-40 h-28 flex items-center justify-center">
          <div className="flex items-center gap-1.5 bg-red-500/90 backdrop-blur-sm px-2 py-0.5 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-[10px] font-medium">REC</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordingIndicator;
