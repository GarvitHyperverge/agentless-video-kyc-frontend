import React from 'react';
import { Check } from 'lucide-react';

interface ReadyModalProps {
  isOpen: boolean;
}

const ReadyModal: React.FC<ReadyModalProps> = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300" />
      
      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] 
                      flex flex-col items-center justify-center 
                      p-12 pb-16 pt-20 min-h-[50vh] sm:min-h-[450px] 
                      shadow-2xl animate-in slide-in-from-bottom duration-500">
        
        {/* Content wrapper centered within the taller modal */}
        <div className="flex flex-col items-center text-center w-full">
          {/* Animated Success Circle */}
          <div className="relative mb-10">
            <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center shadow-lg">
              <Check 
                className="w-12 h-12 text-white animate-in zoom-in duration-300 delay-150" 
                strokeWidth={3} 
              />
            </div>
            {/* Pulse effect */}
            <div className="absolute inset-0 w-24 h-24 bg-slate-900 rounded-full animate-ping opacity-10" />
          </div>

          {/* Text Content */}
          <div className="space-y-4 px-4">
            <h2 className="text-[24px] font-bold leading-tight text-slate-800 tracking-tight">
              You are ready to begin your verification process
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadyModal;