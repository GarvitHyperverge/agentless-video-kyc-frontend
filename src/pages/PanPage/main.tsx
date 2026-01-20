import React, { useState } from 'react';
import { Camera, Upload, X, ChevronLeft } from 'lucide-react'; // Added ChevronLeft for back button
import { usePanPage } from './hook';
import PanFront from './front';
import PanBack from './back';
import RecordingIndicator from '../../components/RecordingIndicator';

const PanPage: React.FC = () => {
  // 1. Navigation State
  const [currentStep, setCurrentStep] = useState<'front' | 'back'>('front');

  // 2. Logic Hook
  const {
    panImages,
    activeSide,
    isCameraOpen,
    isCameraReady,
    isProcessing,
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
    <div className="relative min-h-screen bg-white overflow-x-hidden">
      {/* 1. TOP UI LAYER 
          This container holds the back button and the recording indicator 
          exactly as seen in image_9eb043.png
      */}
      <div className="absolute top-6 left-6 right-6 z-40 flex justify-between items-start pointer-events-none">
        <button 
          onClick={() => currentStep === 'back' ? goToFront() : window.history.back()}
          className="p-3 bg-slate-50 rounded-full text-slate-400 pointer-events-auto active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* The RecordingIndicator component handles its own internal fixed/absolute positioning */}
        <div className="pointer-events-auto">
          <RecordingIndicator />
        </div>
      </div>

      {/* Hidden file input for gallery uploads */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handlePanImageFileUpload}
      />

      {/* 4. Step Rendering - Adjusted padding to prevent overlap with floating UI */}
      <div className="pt-24"> 
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
      </div>

      {/* 5. Choice Modal (Camera vs Gallery) */}
      {activeSide && !isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={closeUploadOptions} />
          <div className="relative bg-white w-full max-w-md rounded-t-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8" />
            <h3 className="text-xl font-bold text-slate-800 mb-2 text-center font-sans">Capture {activeSide} side</h3>
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
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />

            <button 
                onClick={closeUploadOptions} 
                className="absolute top-8 right-8 text-white bg-black/40 p-2 rounded-full backdrop-blur-md active:scale-90 transition-transform"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="h-44 bg-black flex items-center justify-center">
            <button 
              onClick={capturePhoto} 
              disabled={!isCameraReady}
              className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center active:scale-90 transition-all disabled:opacity-50"
            >
              <div className="w-14 h-14 bg-white rounded-full shadow-lg" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanPage;