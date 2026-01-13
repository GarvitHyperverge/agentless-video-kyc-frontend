import React from 'react';
import { useOtpPage } from './hook';

const OtpPage: React.FC = () => {
  const {
    otp,
    recordingStatus,
    videoUrl,
    isProcessing,
    cameraError,
    uploadError,
    isCameraReady,
    isCameraOpen,
    setIsCameraOpen,
    videoRef,
    openCameraForRecording,
    startRecording,
    stopRecording,
    retakeVideo,
    regenerateOtp,
    handleContinue,
    canContinue,
  } = useOtpPage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-rose-900 flex items-center justify-center relative overflow-hidden py-8 px-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-3xl" />
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
      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-rose-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/25">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              OTP{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">
                Verification
              </span>
            </h1>
            <p className="text-slate-400 text-base">
              Please read the OTP aloud while recording yourself
            </p>
          </div>

          {/* OTP Display */}
          <div className="mb-8">
            <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-6 text-center">
              <p className="text-slate-400 text-sm mb-3">Your OTP Code</p>
              <div className="flex justify-center items-center gap-2">
                {otp.split('').map((digit, index) => (
                  <span
                    key={index}
                    className="w-12 h-14 bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/30 rounded-xl flex items-center justify-center text-3xl font-bold text-white"
                  >
                    {digit}
                  </span>
                ))}
              </div>
              <button
                onClick={regenerateOtp}
                disabled={recordingStatus === 'recording' || isProcessing}
                className="mt-4 text-rose-400 hover:text-rose-300 text-sm flex items-center gap-2 mx-auto transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Generate New OTP
              </button>
            </div>
          </div>

          {/* Error message */}
          {cameraError && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {cameraError}
            </div>
          )}
          {uploadError && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {uploadError}
            </div>
          )}

          {/* Video Section */}
          <div className="mb-8">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700">
              {/* Idle state - show placeholder */}
              {recordingStatus === 'idle' && !isCameraOpen && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                  <div className="text-center">
                    <svg className="w-16 h-16 text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-slate-400 text-sm">Click "Start Recording" to begin</p>
                  </div>
                </div>
              )}

              {/* Camera preview (inline) */}
              {isCameraOpen && (recordingStatus === 'idle' || recordingStatus === 'recording') && (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  
                  {/* Loading indicator */}
                  {!isCameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800/90">
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

                  {/* Recording indicator */}
                  {recordingStatus === 'recording' && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full">
                      <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
                      <span className="text-white text-sm font-medium">Recording</span>
                    </div>
                  )}
                </>
              )}

              {/* Recorded video preview */}
              {(recordingStatus === 'recorded' || recordingStatus === 'uploading') && videoUrl && (
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain bg-black"
                />
              )}
            </div>

            {/* Recording controls */}
            <div className="flex justify-center gap-4 mt-6">
              {recordingStatus === 'idle' && !isCameraOpen && (
                <button
                  onClick={openCameraForRecording}
                  className="px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95"
                >
                  <span className="w-3 h-3 bg-white rounded-full" />
                  Start Recording
                </button>
              )}

              {isCameraOpen && recordingStatus === 'idle' && (
                <button
                  onClick={startRecording}
                  disabled={!isCameraReady}
                  className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
                    isCameraReady
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95'
                      : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span className="w-3 h-3 bg-white rounded-full" />
                  Start Recording
                </button>
              )}

              {recordingStatus === 'recording' && (
                <button
                  onClick={stopRecording}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg hover:scale-105 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                  Stop Recording
                </button>
              )}

              {recordingStatus === 'recorded' && (
                <>
                  <button
                    onClick={retakeVideo}
                    disabled={isProcessing}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Retake Video
                  </button>
                  <button
                    onClick={regenerateOtp}
                    disabled={isProcessing}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Generate New OTP
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-8 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Instructions
            </h3>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-rose-500/20 rounded-full flex items-center justify-center text-xs text-rose-400 flex-shrink-0 mt-0.5">1</span>
                Click "Start Recording" when you're ready
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-rose-500/20 rounded-full flex items-center justify-center text-xs text-rose-400 flex-shrink-0 mt-0.5">2</span>
                Clearly read aloud the 6-digit OTP shown above
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-rose-500/20 rounded-full flex items-center justify-center text-xs text-rose-400 flex-shrink-0 mt-0.5">3</span>
                Ensure your face is clearly visible in the frame
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-rose-500/20 rounded-full flex items-center justify-center text-xs text-rose-400 flex-shrink-0 mt-0.5">4</span>
                Click "Stop Recording" when done
              </li>
            </ul>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!canContinue || isProcessing}
            className={`w-full py-4 px-8 font-semibold text-lg rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-3 ${
              canContinue && !isProcessing
                ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-rose-500/30 hover:shadow-rose-500/50 hover:scale-[1.02] active:scale-[0.98]'
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
                Processing...
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
    </div>
  );
};

export default OtpPage;
