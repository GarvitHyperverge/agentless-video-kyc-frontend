import React from 'react';
import { CheckCircle2, X, ChevronRight } from 'lucide-react';
import PanBackExample from '../../assets/PanBackExample.webp';

interface BackProps {
  panImage: { url: string | null; file: File | null };
  onBack: () => void;
  onSubmit: () => void;
  openUploadOptions: (side: 'back') => void;
  removeImage: (side: 'back') => void;
  isProcessing: boolean;
}

const PanBack: React.FC<BackProps> = ({ panImage, onSubmit, openUploadOptions, removeImage, isProcessing }) => {
  const isButtonDisabled = !panImage.file || isProcessing;

  return (
    <div className="flex flex-col min-h-screen bg-white px-6 pt-12 pb-10 animate-in slide-in-from-right duration-300">
      {/* Header aligned with Front page style */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Submit a Pan card</h1>
        <p className="text-slate-500 text-sm mt-3">Now capture the **Back Side** of your PAN card</p>
      </header>

      {/* Image Container matching Front page aesthetics */}
      <div className="relative flex-1 bg-[#F1F3FF] rounded-[24px] overflow-hidden flex flex-col items-center justify-center border border-slate-100 mb-8">
        {panImage.url ? (
          <div className="w-full h-full p-6 relative">
            <img src={panImage.url} alt="Back" className="w-full h-full object-contain rounded-xl shadow-sm" />
            <button 
              onClick={() => removeImage('back')} 
              className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg active:scale-90 transition-transform"
            >
              <X size={16}/>
            </button>
          </div>
        ) : (
          <img src={PanBackExample} alt="Template" className="max-w-[80%] opacity-80" />
        )}
      </div>

      {/* Synchronized REC Indicator */}
      <div className="flex justify-center mb-8">
        <div className="bg-[#333742] text-white px-4 py-2 rounded-full flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-[#FF4D4D] rounded-full animate-pulse" />
          <span className="text-xs font-bold uppercase">REC</span>
        </div>
      </div>

      <footer className="space-y-4">
        {/* Secondary Action: Capture/Retake */}
        <button 
          onClick={() => openUploadOptions('back')} 
          className="w-full bg-[#5851eb] text-white font-bold py-4.5 rounded-xl active:scale-95 transition-all shadow-lg"
        >
          {panImage.url ? "Retake PAN Back" : "Capture PAN Back"}
        </button>

        {/* Primary Action: Verify (Aesthetics matched to Front Page "Continue" logic) */}
        <button 
          disabled={isButtonDisabled} 
          onClick={onSubmit} 
          className={`w-full py-4.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
            isButtonDisabled 
              ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
              : "bg-emerald-600 text-white shadow-xl active:scale-95"
          }`}
        >
          {isProcessing ? "Processing..." : "Finish & Verify"}
          {!isProcessing && <ChevronRight size={18} />}
        </button>

        {/* Branding footer matched from Front page */}
        <div className="flex justify-center items-center gap-1.5 pt-4 opacity-40">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest">powered by HyperVerge</span>
        </div>
      </footer>
    </div>
  );
};

export default PanBack;