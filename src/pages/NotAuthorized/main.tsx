import { ShieldAlert, ArrowRight, Lock } from 'lucide-react';

const NotAuthorizedPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-slate-900 overflow-hidden">
      {/* 1. Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        
        {/* Warning Icon Container */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-red-100 opacity-50 rounded-full animate-pulse" />
          <div className="relative w-24 h-24 bg-red-50 rounded-full flex items-center justify-center shadow-sm">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
          {/* Small Lock Badge */}
          <div className="absolute -bottom-1 -right-1 bg-white p-2 rounded-full shadow-md border border-slate-50">
            <Lock className="w-4 h-4 text-[#5851eb]" />
          </div>
        </div>

        {/* Title & Description */}
        <h1 className="text-3xl font-black text-[#1a1a4a] mb-4 tracking-tight">
          Access Denied
        </h1>
        
        <p className="text-slate-500 text-lg mb-10 leading-relaxed max-w-xs">
          You are not authorized to view this page. Please sign in with an approved account.
        </p>
      </div>

      {/* 2. Bottom Action Area (Consistent with the rest of the app) */}
      <div className="pb-12 flex flex-col items-center gap-4 px-8">
        {/* Branding Footer */}
        <div className="flex items-center gap-1.5 opacity-30 mt-4">
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

export default NotAuthorizedPage;