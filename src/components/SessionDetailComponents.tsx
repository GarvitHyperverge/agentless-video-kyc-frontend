import React from 'react';
import { ImageLightbox } from './ImageLightbox';

interface InfoItemProps {
  label: string;
  value: string | number;
  mono?: boolean;
  light?: boolean;
}

export const InfoItem: React.FC<InfoItemProps> = ({ label, value, mono, light }) => (
  <div className="flex flex-col gap-1">
    <label className={`text-[10px] font-black uppercase tracking-widest ${light ? 'opacity-50 text-white' : 'text-slate-400'}`}>
      {label}
    </label>
    <div className={`text-sm font-bold ${light ? 'text-white' : 'text-[#1a1a4a]'} ${mono ? 'font-mono break-all' : ''}`}>
      {value}
    </div>
  </div>
);

interface MediaBoxProps {
  label: string;
  src: string;
}

export const MediaBox: React.FC<MediaBoxProps> = ({ label, src }) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</label>
    <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
      <ImageLightbox src={src} alt={label} className="w-full h-48 object-cover" />
    </div>
  </div>
);

interface ValidationCardProps {
  title: string;
  value: string;
  confidence: number | string | null;
  action: string;
  colorFn: (value: string) => string;
}

export const ValidationCard: React.FC<ValidationCardProps> = ({ title, value, confidence, action, colorFn }) => {
  const confidenceValue = confidence !== null && confidence !== undefined 
    ? (typeof confidence === 'string' ? parseFloat(confidence) || 0 : confidence)
    : 0;
  
  return (
    <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">{title}</h3>
      <div className="space-y-6">
        <div className="flex justify-between items-end border-b border-slate-50 pb-4">
          <span className="text-3xl font-black text-[#1a1a4a]">{confidenceValue}%</span>
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
};

interface PermToggleProps {
  label: string;
  active: boolean;
}

export const PermToggle: React.FC<PermToggleProps> = ({ label, active }) => (
  <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${
    active ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-red-50 border-red-200 text-red-600'
  }`}>
    {label}
  </div>
);
