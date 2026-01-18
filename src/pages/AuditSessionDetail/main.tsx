import React from 'react';
import { useSessionDetail } from './hook';
import { StatusBadge } from '../../components/StatusBadge';
import { MatchIndicator } from '../../components/MatchIndicator';
import { ImageLightbox } from '../../components/ImageLightbox';
import { VideoPlayer } from '../../components/VideoPlayer';
import { setAuditorLoggedOut, getAuditorUsername } from '../../utils/auth';
import { logoutAuditSession } from '../../services/api/auditSessions';

const SessionDetailPage: React.FC = () => {
  const {
    sessionData,
    loading,
    error,
    successMessage,
    isUpdating,
    handleAuditStatusUpdate,
    navigate,
  } = useSessionDetail();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getValidationColor = (value: string) => {
    const normalized = value.toLowerCase();
    if (normalized === 'yes' || normalized === 'pass' || normalized === 'true') {
      return 'text-green-400';
    }
    if (normalized === 'no' || normalized === 'fail' || normalized === 'false') {
      return 'text-red-400';
    }
    return 'text-slate-400';
  };

  const formatFieldValue = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined || value === '') {
      return 'No data';
    }
    return String(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <svg
          className="w-12 h-12 text-white animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300">
            {error || 'Session not found'}
          </div>
          <button
            onClick={() => navigate('/audit/sessions')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  const {
    session,
    businessPartnerPanData,
    cardIdValidation,
    fieldMatchResults,
    faceMatchResult,
    selfieValidation,
    sessionMetadata,
    verificationInputs,
    mediaPaths,
  } = sessionData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-400">
          <button
            onClick={() => navigate('/audit/sessions')}
            className="hover:text-white transition-colors"
          >
            Sessions
          </button>
          <span>/</span>
          <span className="text-white">{session.session_uid}</span>
        </div>

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Session Details
            </h1>
            <p className="text-slate-400">Review and manage verification session</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Audit Status Buttons */}
            <div className="flex items-center gap-2 mr-4">
              <button
                onClick={() => handleAuditStatusUpdate('pass')}
                disabled={isUpdating}
                className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  isUpdating
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50'
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                PASS
              </button>
              <button
                onClick={() => handleAuditStatusUpdate('fail')}
                disabled={isUpdating}
                className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  isUpdating
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50'
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                FAIL
              </button>
            </div>
            <div className="flex items-center gap-2 text-slate-300 mr-2">
              <svg
                className="w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-sm font-medium">
                {getAuditorUsername() || 'Auditor'}
              </span>
            </div>
            <button
              onClick={() => navigate('/audit/sessions')}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              ← Back to List
            </button>
            <button
              onClick={async () => {
                try {
                  await logoutAuditSession();
                } catch (error) {
                  console.error('Logout request failed:', error);
                } finally {
                  setAuditorLoggedOut();
                  navigate('/audit/login', { replace: true });
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-300 text-sm flex items-center gap-3">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-3">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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

        <div className="space-y-6">
          {/* Section 1: Session Overview */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Session Overview</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-slate-400 text-sm">Session UID</label>
                <div className="text-white font-mono text-sm mt-1">
                  {session.session_uid}
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-sm">External Transaction ID</label>
                <div className="text-white text-sm mt-1">
                  {formatFieldValue(session.external_txn_id)}
                </div>
              </div>
              {session.client_name && (
                <div>
                  <label className="text-slate-400 text-sm">Client Name</label>
                  <div className="text-white text-sm mt-1">
                    {formatFieldValue(session.client_name)}
                  </div>
                </div>
              )}
              <div>
                <label className="text-slate-400 text-sm">Status</label>
                <div className="mt-1">
                  <StatusBadge status={session.status} />
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-sm">Audit Status</label>
                <div className="mt-1">
                  <StatusBadge status={session.audit_status || 'pending'} />
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-sm">Created At</label>
                <div className="text-white text-sm mt-1">
                  {formatDate(session.created_at)}
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-sm">Updated At</label>
                <div className="text-white text-sm mt-1">
                  {formatDate(session.updated_at)}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: PAN Information */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">PAN Information</h2>

            {/* Business Partner Data */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                Business Partner Data
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-sm">PAN Number</label>
                  <div className="text-white text-sm mt-1">
                    {formatFieldValue(businessPartnerPanData.pan_number)}
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Full Name</label>
                  <div className="text-white text-sm mt-1">
                    {formatFieldValue(businessPartnerPanData.full_name)}
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Father Name</label>
                  <div className="text-white text-sm mt-1">
                    {formatFieldValue(businessPartnerPanData.father_name)}
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Date of Birth</label>
                  <div className="text-white text-sm mt-1">
                    {formatFieldValue(businessPartnerPanData.date_of_birth)}
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Source Party</label>
                  <div className="text-white text-sm mt-1">
                    {formatFieldValue(businessPartnerPanData.source_party)}
                  </div>
                </div>
              </div>
            </div>

            {/* Extracted PAN Data */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">
                Extracted PAN Data
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-sm">ID Number</label>
                  <div className="text-white text-sm mt-1">
                    {formatFieldValue(cardIdValidation.id_number)}
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Full Name</label>
                  <div className="text-white text-sm mt-1">
                    {formatFieldValue(cardIdValidation.full_name)}
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Date of Birth</label>
                  <div className="text-white text-sm mt-1">
                    {formatFieldValue(cardIdValidation.date_of_birth)}
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Father Name</label>
                  <div className="text-white text-sm mt-1">
                    {formatFieldValue(cardIdValidation.father_name)}
                  </div>
                </div>
              </div>
            </div>

            {/* Field Match Results */}
            {fieldMatchResults && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Field Match Results
                </h3>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="mb-4 grid grid-cols-3 gap-4 text-xs text-slate-400 font-medium">
                    <div>Field</div>
                    <div>Business Partner</div>
                    <div>Extracted Data</div>
                  </div>
                  <MatchIndicator
                    label="Name"
                    value1={businessPartnerPanData.full_name}
                    value2={cardIdValidation.full_name}
                    match={fieldMatchResults.results.name.match}
                  />
                  <MatchIndicator
                    label="Date of Birth"
                    value1={businessPartnerPanData.date_of_birth}
                    value2={cardIdValidation.date_of_birth}
                    match={fieldMatchResults.results.dateOfBirth.match}
                  />
                  <MatchIndicator
                    label="PAN Number"
                    value1={businessPartnerPanData.pan_number}
                    value2={cardIdValidation.id_number}
                    match={fieldMatchResults.results.idNumber.match}
                  />
                  <MatchIndicator
                    label="Father Name"
                    value1={businessPartnerPanData.father_name}
                    value2={cardIdValidation.father_name}
                    match={fieldMatchResults.results.fatherName.match}
                  />
                </div>
                <div className="mt-4">
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                      fieldMatchResults.allMatched
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    <span className="font-medium">Overall Verification Status:</span>
                    <span>
                      {fieldMatchResults.allMatched ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Images */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Images</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="text-slate-400 text-sm mb-2 block">
                  PAN Card Front
                </label>
                <ImageLightbox
                  src={mediaPaths.images.panFront}
                  alt="PAN Front"
                  className="w-full h-48 object-cover"
                />
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-2 block">
                  PAN Card Back
                </label>
                <ImageLightbox
                  src={mediaPaths.images.panBack}
                  alt="PAN Back"
                  className="w-full h-48 object-cover"
                />
              </div>
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Selfie</label>
                <ImageLightbox
                  src={mediaPaths.images.selfie}
                  alt="Selfie"
                  className="w-full h-48 object-cover"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Validation Results */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">
              Validation Results
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Face Match */}
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Face Match
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-400 text-sm">Match Value</label>
                    <div
                      className={`text-sm font-medium mt-1 ${getValidationColor(
                        faceMatchResult.match_value || ''
                      )}`}
                    >
                      {formatFieldValue(faceMatchResult.match_value)}
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">Confidence Score</label>
                    <div className="text-white text-sm mt-1">
                      {formatFieldValue(faceMatchResult.match_confidence)}
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">Action</label>
                    <div
                      className={`text-sm font-medium mt-1 ${getValidationColor(
                        faceMatchResult.action || ''
                      )}`}
                    >
                      {formatFieldValue(faceMatchResult.action)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Liveness Check */}
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Liveness Check
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-400 text-sm">Live Face Value</label>
                    <div
                      className={`text-sm font-medium mt-1 ${getValidationColor(
                        selfieValidation.live_face_value || ''
                      )}`}
                    >
                      {formatFieldValue(selfieValidation.live_face_value)}
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">
                      Live Face Confidence
                    </label>
                    <div className="text-white text-sm mt-1">
                      {formatFieldValue(selfieValidation.live_face_confidence)}
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">Action</label>
                    <div
                      className={`text-sm font-medium mt-1 ${getValidationColor(
                        selfieValidation.action || ''
                      )}`}
                    >
                      {formatFieldValue(selfieValidation.action)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Session Metadata */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Session Metadata</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-slate-400 text-sm">Location</label>
                <div className="text-white text-sm mt-1">
                  {sessionMetadata.latitude !== null && sessionMetadata.latitude !== undefined &&
                   sessionMetadata.longitude !== null && sessionMetadata.longitude !== undefined
                    ? `${sessionMetadata.latitude}, ${sessionMetadata.longitude}`
                    : 'No data'}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  (Map integration can be added here)
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-sm">Permissions</label>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    {sessionMetadata.camera_permission ? (
                      <svg
                        className="w-5 h-5 text-green-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-red-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <span className="text-white text-sm">Camera</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {sessionMetadata.microphone_permission ? (
                      <svg
                        className="w-5 h-5 text-green-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-red-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <span className="text-white text-sm">Microphone</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {sessionMetadata.location_permission ? (
                      <svg
                        className="w-5 h-5 text-green-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-red-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <span className="text-white text-sm">Location</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-sm">IP Address</label>
                <div className="text-white text-sm mt-1">
                  {formatFieldValue(sessionMetadata.ip_address)}
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-sm">Device Type</label>
                <div className="text-white text-sm mt-1">
                  {formatFieldValue(sessionMetadata.device_type)}
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: Videos */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Videos</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <VideoPlayer
                  src={mediaPaths.videos.otpVideo}
                  title="OTP Video"
                />
                {verificationInputs.find((input) => input.input_type === 'OTP') && (
                  <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <label className="text-slate-400 text-sm block mb-2">OTP Value</label>
                    <div className="text-white font-mono text-lg font-semibold">
                      {formatFieldValue(verificationInputs.find((input) => input.input_type === 'OTP')?.input_value)}
                    </div>
                  </div>
                )}
              </div>
              <VideoPlayer
                src={mediaPaths.videos.sessionRecording}
                title="Session Recording"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailPage;
