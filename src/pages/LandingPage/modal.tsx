import React from 'react';
import { Camera, Mic, MapPin, ShieldCheck, X } from 'lucide-react';
import { PermissionsModalProps } from './type';

const PermissionsModal: React.FC<PermissionsModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop - darker for better focus on white modal */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-md rounded-t-[24px] sm:rounded-[24px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        {/* Close Button for desktop/tablet */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 sm:block hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-indigo-50 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Permissions Required</h2>
          <p className="text-slate-500 text-[15px] leading-relaxed">
            To complete your verification, we need to access your device hardware.
          </p>
        </div>

        {/* Permissions List */}
        <div className="space-y-3 mb-8">
          {/* Camera */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 border border-slate-50">
              <Camera className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-slate-800 font-bold text-[14px]">Camera Access</h3>
              <p className="text-slate-500 text-xs">For video call and photo capture</p>
            </div>
          </div>

          {/* Microphone */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 border border-slate-50">
              <Mic className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-slate-800 font-bold text-[14px]">Microphone Access</h3>
              <p className="text-slate-500 text-xs">To record your voice for verification</p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 border border-slate-50">
              <MapPin className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-slate-800 font-bold text-[14px]">Location Access</h3>
              <p className="text-slate-500 text-xs">Required for compliance & security</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full py-4 bg-[#5851eb] hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-70`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              'Allow & Continue'
            )}
          </button>
          
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-3 text-slate-500 font-semibold text-sm hover:text-slate-700 transition-colors"
          >
            Not now
          </button>
        </div>

        {/* iOS Home Indicator Spacer (Mobile Only) */}
        <div className="h-1.5 w-24 bg-slate-100 mx-auto rounded-full mt-4 sm:hidden" />
      </div>
    </div>
  );
};

export default PermissionsModal;