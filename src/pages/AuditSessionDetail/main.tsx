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
      return 'text-emerald-600'; // Modern green
    }
    if (normalized === 'no' || normalized === 'fail' || normalized === 'false') {
      return 'text-red-600'; // Modern red
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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#5851eb] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="mb-4 text-red-600 font-bold">
            {error || 'Session not found'}
          </div>
          <button
            onClick={() => navigate('/audit/sessions')}
            className="px-6 py-2 bg-[#5851eb] text-white rounded-xl font-bold"
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
          <button
            onClick={() => navigate('/audit/sessions')}
            className="hover:text-[#5851eb] transition-colors"
          >
            Sessions
          </button>
          <span>/</span>
          <span className="text-slate-600 font-mono">{session.session_uid}</span>
        </div>

        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-[#1a1a4a] mb-1">
              Session Details
            </h1>
            <p className="text-slate-500 text-sm">Verify and manage the audit process</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Audit Status Buttons */}
            <div className="flex items-center gap-2 mr-2">
              <button
                onClick={() => handleAuditStatusUpdate('pass')}
                disabled={isUpdating}
                className="px-6 py-2.5 bg-[#5851eb] text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-100 disabled:opacity-50 transition-all hover:scale-105"
              >
                PASS
              </button>
              <button
                onClick={() => handleAuditStatusUpdate('fail')}
                disabled={isUpdating}
                className="px-6 py-2.5 bg-white border-2 border-red-100 text-red-600 rounded-xl font-black text-[11px] uppercase tracking-widest disabled:opacity-50 transition-all hover:bg-red-50"
              >
                FAIL
              </button>
            </div>
            <div className="flex items-center gap-2 text-slate-500 bg-white px-3 py-2 rounded-xl border border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider">
                {getAuditorUsername() || 'Auditor'}
              </span>
            </div>
            <button
              onClick={() => navigate('/audit/sessions')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors font-bold text-sm"
            >
              ← Back
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
              className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              title="Logout"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {(successMessage || error) && (
          <div className={`mb-6 p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 ${
            successMessage ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
          }`}>
            {successMessage || error}
          </div>
        )}

        <div className="space-y-8">
          {/* Section 1: Session Overview */}
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
            <h2 className="text-xl font-black text-[#1a1a4a] mb-8 uppercase tracking-tight">Session Overview</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <InfoItem label="Session UID" value={session.session_uid} mono />
              <InfoItem label="Transaction ID" value={formatFieldValue(session.external_txn_id)} />
              {session.client_name && <InfoItem label="Client Name" value={formatFieldValue(session.client_name)} />}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</label>
                <StatusBadge status={session.status} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Audit Status</label>
                <StatusBadge status={session.audit_status || 'pending'} />
              </div>
              <InfoItem label="Created At" value={formatDate(session.created_at)} />
            </div>
          </div>

          {/* Section 2: PAN Information */}
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
            <h2 className="text-xl font-black text-[#1a1a4a] mb-8 uppercase tracking-tight">PAN Verification</h2>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Business Partner Data */}
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 pb-2 border-b border-slate-50">Business Target</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  <InfoItem label="PAN Number" value={formatFieldValue(businessPartnerPanData.pan_number)} />
                  <InfoItem label="Full Name" value={formatFieldValue(businessPartnerPanData.full_name)} />
                  <InfoItem label="Father Name" value={formatFieldValue(businessPartnerPanData.father_name)} />
                  <InfoItem label="Date of Birth" value={formatFieldValue(businessPartnerPanData.date_of_birth)} />
                </div>
              </div>

              {/* Extracted PAN Data */}
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 pb-2 border-b border-slate-50">Extracted Data</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  <InfoItem label="ID Number" value={formatFieldValue(cardIdValidation.id_number)} />
                  <InfoItem label="Full Name" value={formatFieldValue(cardIdValidation.full_name)} />
                  <InfoItem label="Date of Birth" value={formatFieldValue(cardIdValidation.date_of_birth)} />
                  <InfoItem label="Father Name" value={formatFieldValue(cardIdValidation.father_name)} />
                </div>
              </div>
            </div>

            {/* Field Match Results */}
            {fieldMatchResults && (
              <div className="mt-12 pt-12 border-t border-slate-100">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#5851eb] mb-6">Match Integrity Results</h3>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="mb-6 grid grid-cols-3 gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <div>Field</div>
                    <div>Target Value</div>
                    <div>Extracted</div>
                  </div>
                  <div className="space-y-4">
                    <MatchIndicator label="Name" value1={businessPartnerPanData.full_name} value2={cardIdValidation.full_name} match={fieldMatchResults.results.name.match} />
                    <MatchIndicator label="DOB" value1={businessPartnerPanData.date_of_birth} value2={cardIdValidation.date_of_birth} match={fieldMatchResults.results.dateOfBirth.match} />
                    <MatchIndicator label="PAN ID" value1={businessPartnerPanData.pan_number} value2={cardIdValidation.id_number} match={fieldMatchResults.results.idNumber.match} />
                    <MatchIndicator label="Father" value1={businessPartnerPanData.father_name} value2={cardIdValidation.father_name} match={fieldMatchResults.results.fatherName.match} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Images */}
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
            <h2 className="text-xl font-black text-[#1a1a4a] mb-8 uppercase tracking-tight">Media Assets</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <MediaBox label="PAN Front" src={mediaPaths.images.panFront} />
              <MediaBox label="PAN Back" src={mediaPaths.images.panBack} />
              <MediaBox label="Selfie" src={mediaPaths.images.selfie} />
            </div>
          </div>

          {/* Section 4: Validation Results */}
          <div className="grid md:grid-cols-2 gap-8">
            <ValidationCard 
              title="Biometric Match" 
              value={faceMatchResult.match_value} 
              confidence={faceMatchResult.match_confidence} 
              action={faceMatchResult.action} 
              colorFn={getValidationColor}
            />
            <ValidationCard 
              title="Liveness Detection" 
              value={selfieValidation.live_face_value} 
              confidence={selfieValidation.live_face_confidence} 
              action={selfieValidation.action} 
              colorFn={getValidationColor}
            />
          </div>

          {/* Section 5: Metadata */}
          <div className="bg-[#1a1a4a] text-white rounded-[32px] p-8 shadow-xl">
            <h2 className="text-xl font-black mb-8 opacity-90">System Metadata</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              <InfoItem light label="IP Address" value={formatFieldValue(sessionMetadata.ip_address)} />
              <InfoItem light label="Device" value={formatFieldValue(sessionMetadata.device_type)} />
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Permissions</label>
                <div className="flex gap-4">
                  <PermToggle label="Cam" active={sessionMetadata.camera_permission} />
                  <PermToggle label="Mic" active={sessionMetadata.microphone_permission} />
                  <PermToggle label="Loc" active={sessionMetadata.location_permission} />
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: Videos */}
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
            <h2 className="text-xl font-black text-[#1a1a4a] mb-8 uppercase tracking-tight">Video Recording</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <VideoPlayer src={mediaPaths.videos.otpVideo} title="OTP Interaction" />
                {verificationInputs.find(i => i.input_type === 'OTP') && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Captured OTP</label>
                    <span className="text-2xl font-black text-[#5851eb] tracking-widest">
                      {formatFieldValue(verificationInputs.find(i => i.input_type === 'OTP')?.input_value)}
                    </span>
                  </div>
                )}
              </div>
              <VideoPlayer src={mediaPaths.videos.sessionRecording} title="Audit Trace Video" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Internal Helper Components for Clean Theme */

const InfoItem = ({ label, value, mono, light }: any) => (
  <div className="flex flex-col gap-1">
    <label className={`text-[10px] font-black uppercase tracking-widest ${light ? 'opacity-50 text-white' : 'text-slate-400'}`}>
      {label}
    </label>
    <div className={`text-sm font-bold ${light ? 'text-white' : 'text-[#1a1a4a]'} ${mono ? 'font-mono break-all' : ''}`}>
      {value}
    </div>
  </div>
);

const MediaBox = ({ label, src }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</label>
    <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
      <ImageLightbox src={src} alt={label} className="w-full h-48 object-cover" />
    </div>
  </div>
);

const ValidationCard = ({ title, value, confidence, action, colorFn }: any) => (
  <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">{title}</h3>
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-slate-50 pb-4">
        <span className="text-3xl font-black text-[#1a1a4a]">{confidence || '0'}%</span>
        <span className={`text-xs font-black uppercase tracking-widest ${colorFn(value || '')}`}>
          {value || 'N/A'}
        </span>
      </div>
      <div className="flex justify-between text-xs font-bold">
        <span className="text-slate-400 uppercase tracking-tighter">System Decision</span>
        <span className="text-[#1a1a4a]">{action}</span>
      </div>
    </div>
  </div>
);

const PermToggle = ({ label, active }: any) => (
  <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${
    active ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-red-50 border-red-200 text-red-600'
  }`}>
    {label}
  </div>
);

export default SessionDetailPage;