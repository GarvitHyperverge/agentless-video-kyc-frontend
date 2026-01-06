import React from 'react';
import { useLanding } from './hook';

const LandingPage = () => {
  const { handleStartVerification } = useLanding();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center relative overflow-hidden">
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

      {/* Main content card */}
      <div className="relative z-10 text-center px-6">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 md:p-16 shadow-2xl max-w-lg mx-auto">
          {/* Logo/Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 rotate-3 hover:rotate-0 transition-transform duration-300">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Video{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              KYC
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-400 text-lg mb-10 leading-relaxed">
            Complete your identity verification securely and seamlessly in just a few minutes.
          </p>

          {/* CTA Button */}
          <button
            onClick={handleStartVerification}
            className="group relative w-full py-4 px-8 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-lg rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              Start Verification
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </button>

          {/* Security badge */}
          <div className="mt-8 flex items-center justify-center gap-2 text-slate-500 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>Secured with end-to-end encryption</span>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-slate-500 text-sm">
          By proceeding, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
