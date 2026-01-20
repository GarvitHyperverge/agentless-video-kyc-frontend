import { useLogin } from './hook';
import { Loader2, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

const LoginPage = () => {
  const { formData, isLoading, error, handleInputChange, handleSubmit } = useLogin();

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-slate-900 overflow-hidden">
      {/* 1. Header/Logo Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-full max-w-sm text-center">
          {/* Animated Icon Container */}
          <div className="relative mb-8 inline-block">
            <div className="absolute inset-0 bg-indigo-100 opacity-50 rounded-3xl rotate-6 animate-pulse" />
            <div className="relative w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl border border-slate-50">
              <Lock className="w-10 h-10 text-[#5851eb]" />
            </div>
          </div>

          <h1 className="text-3xl font-black text-[#1a1a4a] mb-2 tracking-tight">
            Auditor Login
          </h1>
          <p className="text-slate-500 text-sm mb-10">
            Secure access to the audit dashboard
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-center gap-3 animate-in shake-1">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div>
              <label htmlFor="username" className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[#1a1a4a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5851eb]/10 focus:border-[#5851eb] transition-all disabled:opacity-50"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[#1a1a4a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5851eb]/10 focus:border-[#5851eb] transition-all disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#5851eb] text-white py-4.5 rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] text-lg flex items-center justify-center gap-2 disabled:bg-slate-200"
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 2. Footer Section */}
      <div className="pb-12 flex flex-col items-center gap-4">
        {/* Branding */}
        <div className="flex items-center gap-1.5 opacity-30 mt-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
            <div className="w-1 h-1.5 border-r border-b border-white rotate-45 mb-0.5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#1a1a4a]">
            powered by HyperVerge
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;