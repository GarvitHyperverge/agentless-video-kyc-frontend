import React, { useEffect, useState } from 'react';
import { useSessionRecording } from '../../services/sessionRecording/context';
import { completeVerificationSession } from '../../services/api/verificationSessions';
import { CheckCircle2, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

let hasStartedVerification = false;

const ThankYouPage: React.FC = () => {
  const { uploadRecording } = useSessionRecording();
  const [isUploadComplete, setIsUploadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasStartedVerification) return;
    hasStartedVerification = true;

    const handleCompleteVerification = async () => {
      try {
        const uploadSuccess = await uploadRecording();
        if (!uploadSuccess) {
          setError('Failed to upload session recording. Please try again.');
          return;
        }
        await completeVerificationSession();
        setIsUploadComplete(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred during verification');
      }
    };

    setTimeout(handleCompleteVerification, 1000);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-slate-900 overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        
        {/* 1. Loading State */}
        {!isUploadComplete && !error && (
          <div className="animate-in fade-in duration-500 flex flex-col items-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <Loader2 className="w-10 h-10 text-[#5851eb] animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-[#1a1a4a] mb-2">Finalizing...</h1>
            <p className="text-slate-500 text-sm">Securing your verification data</p>
          </div>
        )}

        {/* 2. Error State */}
        {error && (
          <div className="animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-[#1a1a4a] mb-4">Something went wrong</h1>
            <p className="text-slate-500 mb-8">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-[#5851eb] text-white rounded-xl font-bold shadow-lg"
            >
              Try Again
            </button>
          </div>
        )}

        {/* 3. Success State */}
        {isUploadComplete && (
          <div className="animate-in slide-in-from-bottom-8 duration-700 flex flex-col items-center">
            {/* Success Icon */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-[#5851eb] opacity-20 rounded-full animate-ping" />
              <div className="relative w-24 h-24 bg-[#5851eb] rounded-full flex items-center justify-center shadow-2xl shadow-indigo-200">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-black text-[#1a1a4a] mb-4">You are all set!</h1>
            <p className="text-slate-500 text-lg mb-10 leading-relaxed max-w-xs">
              As per RBI we have record this part of the verification
            </p>

            {/* Status Info Card */}
            <div className="w-full max-w-sm bg-slate-50 border border-slate-100 rounded-3xl p-6 mb-8 text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="font-bold text-slate-800">Verification Submitted</span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-slate-500">
                  <span className="text-emerald-500 font-bold">•</span>
                  Documents uploaded successfully
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-500">
                  <span className="text-emerald-500 font-bold">•</span>
                  Identity match confirmed
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-500">
                  <span className="text-emerald-500 font-bold">•</span>
                  Review expected in 24-48 hours
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThankYouPage;