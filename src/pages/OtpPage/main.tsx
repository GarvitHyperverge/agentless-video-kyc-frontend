import React from 'react';
import { useOtpPage } from './hook';
import { RotateCcw, AlertCircle, Loader2, X } from 'lucide-react';

const OtpPage: React.FC = () => {
  const {
    otp,
    recordingStatus,
    videoUrl,
    isProcessing,
    cameraError,
    uploadError,
    isCameraOpen,
    videoRef,
    openCameraForRecording,
    startRecording,
    stopRecording,
    retakeVideo,
    regenerateOtp,
    handleContinue,
    canContinue,
  } = useOtpPage();

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-slate-900 overflow-hidden">
      
      {/* 1. Full-Bleed Camera Preview Section */}
      <div className="relative flex-1 bg-slate-100 overflow-hidden">
        {/* Camera/Video Logic */}
        {isCameraOpen || videoUrl ? (
          <div className="w-full h-full">
            {videoUrl ? (
              <video src={videoUrl} autoPlay muted loop className="w-full h-full object-cover" />
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-100">
             <p className="text-sm font-bold uppercase tracking-widest opacity-60">Camera Ready</p>
          </div>
        )}

        {/* Floating REC Badge */}
        {(recordingStatus === 'recording' || isCameraOpen) && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full border border-white/20 z-10">
            <div className={`w-2.5 h-2.5 rounded-full ${recordingStatus === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-white'}`} />
            <span className="text-[11px] font-bold uppercase tracking-widest">Rec</span>
          </div>
        )}
      </div>

      {/* 2. Bottom Verification Sheet */}
      <div className="bg-white rounded-t-[40px] shadow-[0_-15px_50px_rgba(0,0,0,0.15)] px-8 pt-10 pb-10 -mt-12 relative z-20 border-t border-slate-50">
        <div className="text-center">
          <h2 className="text-slate-400 font-bold text-[12px] uppercase tracking-[0.2em] mb-3">OTP step</h2>
          <h1 className="text-[#1a1a4a] text-2xl font-bold mb-8">Read OTP Aloud</h1>

          {/* Large Digit Display */}
          <div className="flex justify-center items-center gap-5 mb-8">
            {otp.split('').map((digit, index) => (
              <span key={index} className="text-5xl font-black text-[#1a1a4a] tracking-tight">
                {digit}
              </span>
            ))}
          </div>

          {/* Recording Status Label */}
          <p className="text-slate-400 text-sm font-semibold mb-10">
            {recordingStatus === 'recording' ? 'Recording in progress...' : 'Recording ends in 8s'}
          </p>

          {/* Action Buttons */}
          <div className="space-y-4">
            {recordingStatus === 'idle' && !isCameraOpen ? (
              <button 
                onClick={openCameraForRecording}
                className="w-full bg-[#5851eb] text-white py-4.5 rounded-2xl font-bold shadow-xl shadow-indigo-100 active:scale-[0.98] transition-all text-lg"
              >
                Start video verification
              </button>
            ) : recordingStatus === 'idle' && isCameraOpen ? (
              <button 
                onClick={startRecording}
                className="w-full bg-red-500 text-white py-4.5 rounded-2xl font-bold shadow-xl shadow-red-100 animate-in fade-in text-lg"
              >
                Begin Recording
              </button>
            ) : recordingStatus === 'recording' ? (
              <button 
                onClick={stopRecording}
                className="w-full bg-slate-900 text-white py-4.5 rounded-2xl font-bold active:scale-[0.98] transition-all text-lg"
              >
                Stop Recording
              </button>
            ) : (
              <div className="flex gap-4 animate-in slide-in-from-bottom-4">
                <button 
                  onClick={retakeVideo}
                  className="flex-1 bg-slate-100 text-slate-600 py-4.5 rounded-2xl font-bold flex items-center justify-center gap-2 active:bg-slate-200 transition-colors"
                >
                  <RotateCcw size={18} /> Retake
                </button>
                <button 
                  onClick={handleContinue}
                  disabled={!canContinue || isProcessing}
                  className="flex-[2.5] bg-[#5851eb] text-white py-4.5 rounded-2xl font-bold shadow-xl shadow-indigo-100 disabled:bg-slate-200 transition-all active:scale-[0.98]"
                >
                  {isProcessing ? <Loader2 className="animate-spin mx-auto" /> : "Continue"}
                </button>
              </div>
            )}
          </div>

          {/* Error Feedbacks */}
          {(cameraError || uploadError) && (
            <div className="mt-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center gap-2 text-red-600 text-[13px] font-bold">
              <AlertCircle size={16} />
              <span>{cameraError || uploadError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Utility */}
      <div className="pb-8 bg-white flex flex-col items-center gap-4">
        <button 
          onClick={regenerateOtp} 
          disabled={recordingStatus === 'recording'}
          className="text-[#5851eb] text-[13px] font-bold flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity disabled:opacity-20"
        >
          <RotateCcw size={14} /> Regenerate OTP
        </button>
        
        <div className="flex items-center gap-1 opacity-30">
          <div className="w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
            <div className="w-1 h-1.5 border-r border-b border-white rotate-45 mb-0.5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">powered by HyperVerge</span>
        </div>
      </div>
    </div>
  );
};

export default OtpPage;