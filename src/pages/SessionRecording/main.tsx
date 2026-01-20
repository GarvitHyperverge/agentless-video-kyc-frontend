import React, { useRef, useEffect } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { useSessionRecording } from '../../services/sessionRecording/context';
import { useNavigate } from 'react-router-dom';

const SessionRecordingPage: React.FC = () => {
  const { isSessionRecording, recordingStream, startRecording } = useSessionRecording();
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (!isSessionRecording) {
      startRecording();
    }
  }, [isSessionRecording, startRecording]);
  
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

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-slate-900 px-6 pt-12 pb-10">
      
      {/* 1. Heading Section */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold leading-tight text-slate-800 tracking-tight">
          You are all set!
        </h1>
        <p className="text-slate-500 text-sm mt-2 leading-relaxed max-w-[280px]">
          As per RBI we have record this part of the verification
        </p>
      </header>

      {/* 2. Main Frame - Corrected to capture entire container */}
      <div className="relative flex-1 rounded-[24px] overflow-hidden bg-slate-900 shadow-sm border border-slate-100">
        {recordingStream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover" 
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <span className="text-slate-500 text-xs font-medium uppercase tracking-widest">Camera Loading</span>
          </div>
        )}
      </div>

      {/* 3. Info Card & Slider Section */}
      <div className="mt-6 flex flex-col items-center">
        {/* Helper Card */}
        <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-3 mb-6">
          <div className="bg-white p-2 rounded-lg shadow-xs">
            <CreditCard className="w-5 h-5 text-[#5851eb]" />
          </div>
          <p className="text-indigo-950 font-bold text-[15px]">Keep Original PAN card handy</p>
        </div>

        {/* 4. Indicator Slider */}
        <div className="flex gap-1.5 mb-8">
          <div className="h-1 w-8 bg-[#5851eb] rounded-full" />
          <div className="h-1 w-2 bg-slate-200 rounded-full" />
          <div className="h-1 w-2 bg-slate-100 rounded-full" />
        </div>
      </div>

      {/* 5. Start Button */}
      <footer className="space-y-4">
        <button 
          className="w-full bg-[#5851eb] text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all"
          onClick={()=>{
            navigate('/verify/pan');
          }}
        >
          Start video verification
        </button>
        
        <div className="h-1 w-28 bg-slate-800 mx-auto rounded-full mt-2" />
      </footer>
    </div>
  );
};

export default SessionRecordingPage;