import React from 'react';
import { useSelfiePage } from './hook';
import { Loader2, RotateCcw, X, CheckCircle2 } from 'lucide-react';

const SelfiePage: React.FC = () => {
  const {
    selfieImage,
    isCameraOpen,
    isCameraReady,
    isProcessing,
    cameraError,
    uploadError,
    videoRef,
    openCamera,
    setIsCameraOpen,
    capturePhoto,
    retakePhoto,
    handleContinue,
    canContinue,
  } = useSelfiePage();

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-slate-900 overflow-hidden">
      
      {/* 1. Full-Bleed Preview Section */}
      <div className="relative flex-1 bg-slate-100 overflow-hidden">
        {isCameraOpen || selfieImage.imageUrl ? (
          <div className="w-full h-full">
            {selfieImage.imageUrl ? (
              <img 
                src={selfieImage.imageUrl} 
                alt="Captured Selfie" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover" 
                
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-100">
             <p className="text-sm font-bold uppercase tracking-widest opacity-60">Ready for Selfie</p>
          </div>
        )}

        {/* Floating REC Badge */}
        {(isCameraOpen || (selfieImage.imageUrl && !isProcessing)) && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full border border-white/20 z-10">
            <div className={`w-2.5 h-2.5 rounded-full ${isCameraOpen ? 'bg-red-500 animate-pulse' : 'bg-white'}`} />
            <span className="text-[11px] font-bold uppercase tracking-widest">Rec</span>
          </div>
        )}
      </div>

      {/* 2. Bottom Action Sheet */}
      <div className="bg-white px-8 pt-8 pb-10 relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="text-center">
          <h1 className="text-[#1a1a4a] text-2xl font-bold mb-12">Selfie verification</h1>

          {/* Action Buttons */}
          <div className="space-y-4">
            {!selfieImage.imageUrl && !isCameraOpen ? (
              <button 
                onClick={openCamera}
                className="w-full bg-[#5851eb] text-white py-4.5 rounded-2xl font-bold shadow-xl shadow-indigo-100 active:scale-[0.98] transition-all text-lg"
              >
                Open Camera
              </button>
            ) : isCameraOpen ? (
              <button 
                onClick={capturePhoto}
                disabled={!isCameraReady}
                className="w-full bg-[#5851eb] text-white py-4.5 rounded-2xl font-bold shadow-xl shadow-indigo-100 animate-in fade-in text-lg disabled:opacity-50"
              >
                {isCameraReady ? "Capture" : <Loader2 className="animate-spin mx-auto" />}
              </button>
            ) : (
              <div className="flex gap-4 animate-in slide-in-from-bottom-4">
                <button 
                  onClick={retakePhoto}
                  disabled={isProcessing}
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
              <span>{cameraError || uploadError}</span>
            </div>
          )}

          {/* Footer Utility */}
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-1.5 opacity-40">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">powered by HyperVerge</span>
            </div>
          </div>
        </div>
      </div>

      {/* Close Camera Overlay [Optional based on image_5c650d.jpg] */}
      {isCameraOpen && (
        <button 
          onClick={() => setIsCameraOpen(false)}
          className="absolute top-8 right-8 text-white bg-black/40 p-2 rounded-full backdrop-blur-md z-[100] active:scale-90 transition-transform"
        >
          <X size={24} />
        </button>
      )}
    </div>
  );
};

export default SelfiePage;