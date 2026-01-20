import React, { useRef, useEffect } from 'react';
import { useSessionRecording } from '../services/sessionRecording/context';

const RecordingIndicator: React.FC = () => {
  const { isSessionRecording, recordingStream } = useSessionRecording();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && recordingStream) {
      if (videoRef.current.srcObject !== recordingStream) {
        videoRef.current.srcObject = recordingStream;
      }
      
      if (videoRef.current.paused) {
        videoRef.current.play().catch((err) => {
          console.error('Error playing recording preview:', err);
        });
      }
    } else if (videoRef.current && !recordingStream) {
      videoRef.current.srcObject = null;
      videoRef.current.pause();
    }
  }, [recordingStream]);

  if (!isSessionRecording && !recordingStream) return null;

  return (
    <div className="fixed top-2 right-2 z-[100] pointer-events-none">
      {/* Video preview matching the image style */}
      <div className="relative bg-slate-200 rounded-[18px] overflow-hidden border-white border-4 w-28 h-36 sm:w-32 sm:h-32">
        {recordingStream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover" 
          />
        ) : (
          /* Fallback if stream is starting */
          <div className="w-full h-full bg-slate-100 flex items-center justify-center" />
        )}
      </div>
    </div>
  );
};

export default RecordingIndicator;