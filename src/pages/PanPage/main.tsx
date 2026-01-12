import React from 'react';
import { usePanPage } from './hook';

const PanPage: React.FC = () => {
  const {
    panImages,
    activeSide,
    isCameraOpen,
    isCameraReady,
    isProcessing,
    error,
    videoRef,
    fileInputRef,
    openUploadOptions,
    selectUploadMode,
    closeUploadOptions,
    capturePhoto,
    handlePanImageFileUpload,
    removeImage,
    handleContinue,
    canContinue,
  } = usePanPage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center relative overflow-hidden py-8 px-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />
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

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handlePanImageFileUpload}
      />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              PAN Card{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                Verification
              </span>
            </h1>
            <p className="text-slate-400 text-base">
              Please capture or upload clear images of your PAN card (both sides)
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}

          {/* PAN Card Upload Sections */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Front Side */}
            <div className="space-y-3">
              <label className="text-white font-medium flex items-center gap-2">
                <span className="w-6 h-6 bg-indigo-500/30 rounded-full flex items-center justify-center text-xs text-indigo-300">
                  1
                </span>
                Front Side
              </label>
              <div
                onClick={() => !panImages.front.file && openUploadOptions('front')}
                className={`relative aspect-[1.6] rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
                  panImages.front.file
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-slate-600 bg-slate-800/50 hover:border-indigo-500/50 hover:bg-slate-800 cursor-pointer'
                }`}
              >
                {panImages.front.url ? (
                  <>
                    <img src={panImages.front.url} alt="PAN Front" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openUploadOptions('front');
                        }}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage('front');
                        }}
                        className="p-2 bg-red-500/30 hover:bg-red-500/50 rounded-lg backdrop-blur-sm transition-colors"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="absolute bottom-2 right-2 p-1.5 bg-emerald-500 rounded-full">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                    <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-sm">Click to add front side</span>
                  </div>
                )}
              </div>
            </div>

            {/* Back Side */}
            <div className="space-y-3">
              <label className="text-white font-medium flex items-center gap-2">
                <span className="w-6 h-6 bg-indigo-500/30 rounded-full flex items-center justify-center text-xs text-indigo-300">
                  2
                </span>
                Back Side
              </label>
              <div
                onClick={() => !panImages.back.file && openUploadOptions('back')}
                className={`relative aspect-[1.6] rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
                  panImages.back.file
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-slate-600 bg-slate-800/50 hover:border-indigo-500/50 hover:bg-slate-800 cursor-pointer'
                }`}
              >
                {panImages.back.url ? (
                  <>
                    <img src={panImages.back.url} alt="PAN Back" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openUploadOptions('back');
                        }}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage('back');
                        }}
                        className="p-2 bg-red-500/30 hover:bg-red-500/50 rounded-lg backdrop-blur-sm transition-colors"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="absolute bottom-2 right-2 p-1.5 bg-emerald-500 rounded-full">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                    <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-sm">Click to add back side</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="mb-8 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              Tips for a clear capture
            </h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Ensure good lighting and avoid shadows
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Place the card on a flat, contrasting surface
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Make sure all text and details are clearly visible
              </li>
            </ul>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!canContinue || isProcessing}
            className={`w-full py-4 px-8 font-semibold text-lg rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-3 ${
              canContinue && !isProcessing
                ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Uploading...
              </>
            ) : (
              <>
                Continue to Verification
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload Options Modal */}
      {activeSide && !isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeUploadOptions} />
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 text-center">
              Upload {activeSide === 'front' ? 'Front' : 'Back'} Side
            </h3>
            <p className="text-slate-400 text-sm text-center mb-6">Choose how you want to add the image</p>

            <div className="space-y-3">
              <button
                onClick={() => selectUploadMode('camera')}
                className="w-full p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl transition-colors flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Take Photo</p>
                  <p className="text-slate-400 text-sm">Use your camera to capture</p>
                </div>
              </button>

              <button
                onClick={() => selectUploadMode('file')}
                className="w-full p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl transition-colors flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-violet-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Upload File</p>
                  <p className="text-slate-400 text-sm">Select from your device</p>
                </div>
              </button>
            </div>

            <button
              onClick={closeUploadOptions}
              className="w-full mt-4 py-3 text-slate-400 hover:text-white transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Camera view area */}
          <div className="absolute inset-0 bottom-24">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

            {/* Loading indicator */}
            {!isCameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                <div className="text-center">
                  <svg className="w-12 h-12 text-white animate-spin mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <p className="text-white text-sm">Initializing camera...</p>
                </div>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={closeUploadOptions}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Capture button - fixed at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-black/90 flex items-center justify-center">
            <button
              onClick={capturePhoto}
              disabled={!isCameraReady}
              className={`w-18 h-18 rounded-full flex items-center justify-center shadow-lg transition-all ${
                isCameraReady
                  ? 'bg-white hover:scale-105 active:scale-95'
                  : 'bg-white/30 cursor-not-allowed'
              }`}
              style={{ width: '72px', height: '72px' }}
            >
              <div 
                className={`rounded-full border-4 ${isCameraReady ? 'bg-white border-slate-800' : 'bg-white/50 border-slate-500'}`}
                style={{ width: '60px', height: '60px' }}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanPage;
