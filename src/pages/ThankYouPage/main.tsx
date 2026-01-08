import React, { useEffect, useState } from 'react';
import { useSessionRecording } from '../../services/sessionRecording/context';
import { completeVerificationSession } from '../../services/api/verificationSessions';

const ThankYouPage: React.FC = () => {
  const [showConfetti, setShowConfetti] = useState(true);
  const { stopRecording, downloadRecording } = useSessionRecording();

  // Stop recording and download when page loads
  useEffect(() => {
    const handleRecording = async () => {
      try {
        await stopRecording();
        console.log('Session recording stopped');
        
        // Download the recording
        setTimeout(async () => {
          await downloadRecording();
        }, 300);
      } catch (err) {
        console.error('Error handling session recording:', err);
      }
    };
    
    // Small delay to ensure page is fully loaded
    const timer = setTimeout(handleRecording, 500);
    return () => clearTimeout(timer);
  }, [stopRecording, downloadRecording]);

  // Complete verification session when page loads
  useEffect(() => {
    const handleCompleteVerification = async () => {
      const sessionId = localStorage.getItem('session_id');
      
      if (!sessionId) {
        console.error('No session ID found');
        return;
      }

      try {
        await completeVerificationSession({ sessionId });
        console.log('Verification session completed successfully');
      } catch (err) {
        console.error('Error completing verification session:', err);
      }
    };

    // Call the API after a short delay to ensure page is loaded
    const timer = setTimeout(handleCompleteVerification, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center relative overflow-hidden py-8 px-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      {/* Confetti animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                backgroundColor: ['#10b981', '#14b8a6', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'][
                  Math.floor(Math.random() * 6)
                ],
                animation: `fall ${2 + Math.random() * 2}s ease-in forwards`,
                animationDelay: `${Math.random() * 1}s`,
              }}
            />
          ))}
        </div>
      )}

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

        {/* Footer text */}
        <p className="text-slate-500 text-sm mt-6">
          Reference ID: {localStorage.getItem('session_id') || 'N/A'}
        </p>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
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
