import React, { useState } from 'react';
import { Camera, Upload, X} from 'lucide-react';
import { usePanPage } from './hook';
import PanFront from './front';
import PanBack from './back';

const TestingPanPage: React.FC = () => {
  // 1. Navigation State
  const [currentStep, setCurrentStep] = useState<'front' | 'back'>('front');

  // 2. Logic Hook
  const {
    panImages,
    activeSide,
    isCameraOpen,
    isCameraReady,
    isProcessing,
    cameraError,
    uploadError,
    videoRef,
    fileInputRef,
    openUploadOptions,
    selectUploadMode,
    closeUploadOptions,
    capturePhoto,
    handlePanImageFileUpload,
    removeImage,
    handleContinue,
  } = usePanPage();

  // 3. Handlers
  const goToBack = () => setCurrentStep('back');
  const goToFront = () => setCurrentStep('front');

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {/* Hidden file input for gallery uploads */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handlePanImageFileUpload}
      />

      {/* 4. Step Rendering */}
      {currentStep === 'front' ? (
        <PanFront
          panImage={panImages.front}
          onNext={goToBack}
          openUploadOptions={() => openUploadOptions('front')}
          removeImage={() => removeImage('front')}
        />
      ) : (
        <PanBack
          panImage={panImages.back}
          onBack={goToFront}
          onSubmit={handleContinue}
          openUploadOptions={() => openUploadOptions('back')}
          removeImage={() => removeImage('back')}
          isProcessing={isProcessing}
        />
      )}

      {/* 5. Choice Modal (Camera vs Gallery) */}
      {activeSide && !isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={closeUploadOptions} />
          <div className="relative bg-white w-full max-w-md rounded-t-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8" />
            <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">Capture {activeSide} side</h3>
            <p className="text-slate-500 text-sm text-center mb-8">Align your card within the frame</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => selectUploadMode('camera')} 
                className="flex flex-col items-center gap-3 p-6 bg-slate-50 rounded-2xl border border-slate-100 active:bg-slate-100 transition-all"
              >
                <div className="bg-white p-3 rounded-xl shadow-sm text-[#5851eb]"><Camera className="w-6 h-6" /></div>
                <span className="font-bold text-sm text-slate-700">Camera</span>
              </button>
              <button 
                onClick={() => selectUploadMode('file')} 
                className="flex flex-col items-center gap-3 p-6 bg-slate-50 rounded-2xl border border-slate-100 active:bg-slate-100 transition-all"
              >
                <div className="bg-white p-3 rounded-xl shadow-sm text-[#5851eb]"><Upload className="w-6 h-6" /></div>
                <span className="font-bold text-sm text-slate-700">Gallery</span>
              </button>
            </div>
            <button onClick={closeUploadOptions} className="w-full mt-6 py-2 text-slate-400 font-bold text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* 6. Full-Screen Camera Interface */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="relative flex-1">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            
            {/* Alignment Guide Overlay */}
            <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
              <div className="w-full aspect-[1.58] border-2 border-white/20 rounded-3xl relative">
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl" />
              </div>
            </div>

            {/* Error Message if camera fails */}
            {(cameraError || uploadError) && (
              <div className="absolute top-20 inset-x-6 p-3 bg-red-600/90 text-white text-xs rounded-xl text-center">
                {cameraError || uploadError}
              </div>
            )}

            <button 
                onClick={closeUploadOptions} 
                className="absolute top-8 right-8 text-white bg-black/40 p-2 rounded-full backdrop-blur-md active:scale-90 transition-transform"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Capture Trigger */}
          <div className="h-40 bg-black flex items-center justify-center">
            <button 
              onClick={capturePhoto} 
              disabled={!isCameraReady}
              className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center active:scale-90 transition-transform"
            >
              <div className="w-14 h-14 bg-white rounded-full shadow-lg" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestingPanPage;