import React from 'react';

interface VideoPlayerProps {
  src: string;
  title: string;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title,
  className = '',
}) => {
  return (
    <div className={`rounded-lg border border-slate-700 overflow-hidden ${className}`}>
      <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700">
        <h4 className="text-white text-sm font-medium">{title}</h4>
      </div>
      <video
        src={src}
        controls
        className="w-full h-auto bg-black"
        onError={(e) => {
          const video = e.target as HTMLVideoElement;
          video.style.display = 'none';
          const errorDiv = document.createElement('div');
          errorDiv.className =
            'w-full h-48 bg-slate-800 flex items-center justify-center text-slate-400';
          errorDiv.textContent = 'Video not available';
          video.parentElement?.appendChild(errorDiv);
        }}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};
