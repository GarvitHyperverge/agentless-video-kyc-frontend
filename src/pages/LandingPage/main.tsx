import React from 'react';
import { CreditCard, Lock, Info, Loader2, ChevronRight } from 'lucide-react';
import { useLanding } from './hook';
import PermissionsModal from './modal';
import ReadyModal from './readyModal';

const LandingPage: React.FC = () => {
  const { 
    handleStartVerification, 
    showPermissionsModal, 
    showReadyModal,
    handleCloseModal, 
    handleConfirmPermissions, 
    isLoading, 
    activationError 
  } = useLanding();

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-slate-900">
      {/* Main Content Area */}
      <main className="flex-1 px-6 pt-12 pb-32">
        {/* Header Section */}
        <header className="mb-10">
          <h1 className="text-[26px] font-bold leading-tight text-slate-800 tracking-tight">
            Let's start with your video verification process
          </h1>
          
          {/* Activation Error - Positioned below title */}
          {activationError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-3">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{activationError}</p>
            </div>
          )}
        </header>

        <section>
          <h2 className="text-[17px] font-semibold text-indigo-900/80 mb-5">
            What we require
          </h2>

          <div className="space-y-4">
            {/* Requirement Card: PAN Card */}
            <div className="flex items-center p-5 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div className="bg-white p-2.5 rounded-xl shadow-sm mr-4 border border-slate-50">
                <CreditCard className="w-6 h-6 text-indigo-600" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-[15px]">Original PAN card</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  Government issued card not a photocopy.
                </p>
              </div>
            </div>

            {/* Requirement Card: Permissions */}
            <div className="flex items-center p-5 bg-slate-50/80 rounded-2xl border border-slate-100 relative">
              <div className="bg-white p-2.5 rounded-xl shadow-sm mr-4 border border-slate-50">
                <Lock className="w-6 h-6 text-indigo-600" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-[15px]">Access Permissions</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  Camera, Location, Microphone
                </p>
              </div>
              <button className="text-slate-400 p-1">
                <Info className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Action Button - Fixed at bottom */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-slate-50">
        <button 
          onClick={handleStartVerification}
          disabled={isLoading}
          className={`w-full flex items-center justify-center text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] ${
            isLoading ? 'bg-indigo-400' : 'bg-[#5851eb] hover:bg-indigo-700 shadow-lg shadow-indigo-200'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <span className="flex items-center gap-2">
              Start verification
            </span>
          )}
        </button>
        
        {/* Visual spacer for modern mobile browsers */}
        <div className="h-2 w-32 bg-slate-100 mx-auto rounded-full mt-6" />
      </footer>

      {/* Your existing Permissions Modal */}
      <PermissionsModal
        isOpen={showPermissionsModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmPermissions}
        isLoading={isLoading}
      />

      <ReadyModal isOpen={showReadyModal} />
    </div>
  );
};

export default LandingPage;