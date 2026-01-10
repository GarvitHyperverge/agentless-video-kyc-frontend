import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === 'approved' || normalizedStatus === 'pass') {
      return 'bg-green-500/20 text-green-300 border-green-500/30';
    }
    if (normalizedStatus === 'rejected' || normalizedStatus === 'fail') {
      return 'bg-red-500/20 text-red-300 border-red-500/30';
    }
    if (normalizedStatus === 'flagged' || normalizedStatus === 'warning') {
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    }
    return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
        status
      )}`}
    >
      {status.toUpperCase()}
    </span>
  );
};
