import React from 'react';

interface MatchIndicatorProps {
  match: boolean;
  value1: string;
  value2: string;
  label: string;
}

export const MatchIndicator: React.FC<MatchIndicatorProps> = ({
  match,
  value1,
  value2,
  label,
}) => {
  return (
    <div className="grid grid-cols-3 gap-4 items-center py-3 border-b border-slate-700/50">
      <div className="text-slate-400 text-sm font-medium">{label}</div>
      <div className="text-white text-sm">{value1 || 'N/A'}</div>
      <div className="flex items-center gap-3">
        <div className="text-white text-sm">{value2 || 'N/A'}</div>
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center ${
            match
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {match ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};
