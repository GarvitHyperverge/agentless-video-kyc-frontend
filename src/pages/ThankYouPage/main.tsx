import React, { useEffect, useState } from 'react';
import { useSessionRecording } from '../../services/sessionRecording/context';
import { completeVerificationSession } from '../../services/api/verificationSessions';
import { useSessionValidation } from '../../utils/hooks/useSessionValidation';
import { getToken, validateSession } from '../../utils/session';

// Module-level flag that persists across component remounts (StrictMode)
let hasStartedVerification = false;

const ThankYouPage: React.FC = () => {
  const { uploadRecording } = useSessionRecording();
  useSessionValidation(); // Auto-validates on mount
  const [isUploadComplete, setIsUploadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // Complete verification session and upload recording when page loads
  useEffect(() => {
    // Prevent multiple calls - module-level variable persists across StrictMode remounts
    if (hasStartedVerification) return;
    hasStartedVerification = true;

    const handleCompleteVerification = async () => {
      let token: string;
      try {
        token = validateSession();
      } catch (err) {
        console.error('No token found');
        setError('Session not found');
        return;
      }

      try {
        // Upload session recording first
        console.log('Uploading session recording...');
        const uploadSuccess = await uploadRecording();
        if (!uploadSuccess) {
          setError('Failed to upload session recording. Please try again.');
          return;
        }
        
        console.log('Session recording uploaded successfully');
        
        // Only complete verification session after successful upload
        await completeVerificationSession({ token });
        console.log('Verification session completed successfully');
        
        setIsUploadComplete(true);
      } catch (err) {
        console.error('Error during verification process:', err);
        setError(err instanceof Error ? err.message : 'An error occurred during verification');
      }
    };

    // Call the API after a short delay to ensure page is loaded
    // Don't store timer - we want it to run even if component remounts in StrictMode
    setTimeout(handleCompleteVerification, 1000);
    
    // No cleanup needed - we want the request to proceed even if component remounts
    return () => {
      // Intentionally empty - don't cancel the timer
    };
  }, []); // Empty dependency array - only run once on mount

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center relative overflow-hidden py-8 px-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-lg mx-auto text-center">
        {!isUploadComplete && !error && (
          /* Loading state */
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-emerald-500/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin"></div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Processing...</h2>
              <p className="text-slate-300">
                Completing verification and uploading session recording
              </p>
            </div>
          </div>
        )}

        {error && (
          /* Error state */
          <div className="backdrop-blur-xl bg-white/5 border border-red-500/30 rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="flex flex-col items-center justify-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
              <p className="text-slate-300 mb-4">{error}</p>
              <p className="text-slate-400 text-sm">Please refresh the page and try again.</p>
            </div>
          </div>
        )}

        {isUploadComplete && (
          /* Success content */
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
          {/* Success icon with animation */}
          <div className="relative w-28 h-28 mx-auto mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full animate-ping opacity-20" />
            <div className="relative w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <svg
                className="w-14 h-14 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ animation: 'checkmark 0.5s ease-out 0.3s forwards', opacity: 0 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            You're{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              Verified!
            </span>
          </h1>

          {/* Message */}
          <p className="text-slate-300 text-lg mb-8 leading-relaxed">
            Thank you for completing the verification process. Your identity has been successfully verified.
          </p>

          {/* Status card */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 font-semibold text-lg">Verification Complete</span>
            </div>
            <p className="text-slate-400 text-sm">
              All your documents and selfie have been submitted successfully.
            </p>
          </div>

          {/* What's next section */}
          <div className="text-left bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 mb-8">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              What happens next?
            </h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                Your documents will be reviewed by our team
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                You'll receive a confirmation within 24-48 hours
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                You can safely close this window now
              </li>
            </ul>
          </div>
          </div>
        )}

        {/* Footer text */}
        {isUploadComplete && (
          <p className="text-slate-500 text-sm mt-6">
            Reference ID: {getToken() || 'N/A'}
          </p>
        )}
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes checkmark {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default ThankYouPage;
