import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionsList } from './hook';
import { StatusBadge } from '../../components/StatusBadge';
import { setAuditorLoggedOut, getAuditorUsername } from '../../utils/auth';
import { logoutAuditSession } from '../../services/api/auditSessions';
import { LogOut, User, Calendar, Hash, ArrowRight, Loader2, Filter } from 'lucide-react';

const SessionsListPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    sessions,
    total,
    loading,
    error,
    filter,
    handleFilterChange,
    handleRowClick,
  } = useSessionsList();

  const handleLogout = async () => {
    try {
      await logoutAuditSession();
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      setAuditorLoggedOut();
      navigate('/audit/login', { replace: true });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      {/* 1. Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#5851eb] rounded-lg flex items-center justify-center">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <span className="font-black text-[#1a1a4a] tracking-tight text-lg">AuditPanel</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 text-slate-500">
              <User size={16} className="text-[#5851eb]" />
              <span className="text-sm font-bold uppercase tracking-wider text-[11px]">
                {getAuditorUsername() || 'Auditor'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-500 font-bold text-sm hover:bg-red-50 p-2 rounded-xl transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {/* 2. Page Header & Stats */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-[#1a1a4a] mb-2">Verification Sessions</h1>
          <p className="text-slate-500 text-sm">Review and manage incoming identity verifications.</p>
        </div>

        {/* 3. Filters Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <Filter size={16} className="text-slate-400 mr-2" />
            {(['all', 'pending', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${
                  filter === f
                    ? 'bg-[#1a1a4a] text-white border-[#1a1a4a]'
                    : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          
          {!loading && (
            <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Total: {total} Sessions
            </div>
          )}
        </div>

        {/* 4. Table / Content Area */}
        {error ? (
          <div className="bg-red-50 border border-red-100 p-6 rounded-3xl flex items-center gap-4 text-red-600 font-bold animate-in fade-in">
            <AlertCircle />
            {error}
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-[#5851eb] animate-spin" />
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Fetching Sessions...</span>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden transition-all">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">UID / Transaction</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Date</th>
                    <th className="px-8 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-medium">
                        No sessions match your filter.
                      </td>
                    </tr>
                  ) : (
                    sessions.map((session) => (
                      <tr 
                        key={session.session_uid} 
                        className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onClick={() => handleRowClick(session.session_uid)}
                      >
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-[#1a1a4a] font-bold text-sm font-mono truncate max-w-[120px]">
                              {session.session_uid}
                            </span>
                            <span className="text-slate-400 text-[11px] mt-1">
                              TXN: {session.external_txn_id || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <StatusBadge status={session.status} />
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <Calendar size={14} className="text-slate-300" />
                            {formatDate(session.created_at)}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button className="p-2 bg-slate-100 text-slate-400 rounded-xl group-hover:bg-[#5851eb] group-hover:text-white transition-all">
                            <ArrowRight size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="py-8 flex justify-center opacity-30">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
            <div className="w-1 h-1.5 border-r border-b border-white rotate-45 mb-0.5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#1a1a4a]">
            powered by HyperVerge
          </span>
        </div>
      </footer>
    </div>
  );
};

// Internal icon for the nav
const ShieldCheck = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const AlertCircle = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default SessionsListPage;