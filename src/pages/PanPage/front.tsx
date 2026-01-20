import React from 'react';
import {CheckCircle2, ChevronRight, X } from 'lucide-react';
import PanFrontExample from '../../assets/PanFrontExample.jpeg';
interface FrontProps {
  panImage: { url: string | null; file: File | null };
  onNext: () => void;
  openUploadOptions: (side: 'front') => void;
  removeImage: (side: 'front') => void;
}

const PanFront: React.FC<FrontProps> = ({ panImage, onNext, openUploadOptions, removeImage }) => {
  return (
    <div className="flex flex-col min-h-screen bg-white px-6 pt-12 pb-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Submit a Pan card</h1>
        <p className="text-slate-500 text-sm mt-3">Please capture the **Front Side** of your PAN card</p>
      </header>

      <div className="relative flex-1 bg-[#F1F3FF] rounded-[24px] overflow-hidden flex flex-col items-center justify-center border border-slate-100 mb-8">
        {panImage.url ? (
          <div className="w-full h-full p-6 relative">
            <img src={panImage.url} alt="Front" className="w-full h-full object-contain rounded-xl" />
            <button onClick={() => removeImage('front')} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full"><X size={16}/></button>
          </div>
        ) : (
          <img src={PanFrontExample} alt="Template" className="max-w-[80%] opacity-80" />
        )}
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-[#333742] text-white px-4 py-2 rounded-full flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-[#FF4D4D] rounded-full animate-pulse" />
          <span className="text-xs font-bold uppercase">REC</span>
        </div>
      </div>

      <footer className="space-y-4">
        <button onClick={() => openUploadOptions('front')} className="w-full bg-[#5851eb] text-white font-bold py-4.5 rounded-xl">
          {panImage.url ? "Retake PAN" : "Capture PAN Front"}
        </button>
        <button disabled={!panImage.file} onClick={onNext} className={`w-full py-4.5 rounded-xl font-bold flex items-center justify-center gap-2 ${panImage.file ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
          Continue<ChevronRight size={18} />
        </button>
        <div className="flex justify-center items-center gap-1.5 pt-4 opacity-40">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest">powered by HyperVerge</span>
        </div>
      </footer>
    </div>
  );
};

export default PanFront;