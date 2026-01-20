import React from 'react';
import { Camera, ChevronRight, X, CheckCircle2 } from 'lucide-react';

interface BackProps {
  panImage: { url: string | null; file: File | null };
  onBack: () => void;
  onSubmit: () => void;
  openUploadOptions: (side: 'back') => void;
  removeImage: (side: 'back') => void;
  isProcessing: boolean;
}

const PanBack: React.FC<BackProps> = ({ panImage, onBack, onSubmit, openUploadOptions, removeImage, isProcessing }) => {
  return (
    <div className="flex flex-col min-h-screen bg-white px-6 pt-12 pb-10 animate-in slide-in-from-right duration-300">
      <header className="mb-6">
        <button onClick={onBack} className="text-[#5851eb] font-bold text-sm mb-2">← Back to Front</button>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Submit a Pan card</h1>
        <p className="text-slate-500 text-sm mt-3">Now capture the **Back Side** of your PAN card</p>
      </header>

      <div className="relative flex-1 bg-[#F1F3FF] rounded-[24px] overflow-hidden flex flex-col items-center justify-center border border-slate-100 mb-8">
        {panImage.url ? (
          <div className="w-full h-full p-6 relative">
            <img src={panImage.url} alt="Back" className="w-full h-full object-contain rounded-xl" />
            <button onClick={() => removeImage('back')} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full"><X size={16}/></button>
          </div>
        ) : (
          <img src="/path-to-pan-back-asset.png" alt="Template" className="max-w-[80%] opacity-80" />
        )}
      </div>

      <footer className="space-y-4">
        <button onClick={() => openUploadOptions('back')} className="w-full bg-[#5851eb] text-white font-bold py-4.5 rounded-xl">
          Capture PAN Back
        </button>
        <button disabled={!panImage.file || isProcessing} onClick={onSubmit} className="w-full bg-emerald-600 text-white font-bold py-4.5 rounded-xl">
          {isProcessing ? "Uploading..." : "Finish & Verify"}
        </button>
      </footer>
    </div>
  );
};

export default PanBack;