import React from 'react';
import { X, Settings, HelpCircle, Bot } from 'lucide-react';

interface CameraTopBarProps {
  onClose: () => void;
  formatTime: (s: number) => string;
  recordingTime: number;
  isRecording: boolean;
  isHD: boolean;
  setIsHD: (b: boolean) => void;
}

export const CameraTopBar: React.FC<CameraTopBarProps> = ({ onClose, formatTime, recordingTime, isRecording, isHD, setIsHD }) => (
  <header className="fixed top-0 w-full z-[1050] flex justify-between items-center px-6 pt-[calc(1rem+var(--spacing-safe-top))] pb-4 bg-gradient-to-b from-black/80 to-transparent">
    <button onClick={onClose} className="text-aeirmist-cyan hover:scale-110 transition-transform active:scale-95">
      <X size={28} />
    </button>
    
    <div className="flex flex-col items-center gap-1">
      <div className="glass-panel px-4 py-1 rounded-full border-aeirmist-cyan/20">
        <span className="text-[12px] font-black tracking-widest text-aeirmist-cyan">
          {isRecording ? formatTime(recordingTime) : '00:00'}
        </span>
      </div>
      <div className="flex items-center gap-2">
         <span className="text-[8px] font-bold text-white/50 bg-white/10 px-2 py-0.5 rounded-full">HD</span>
         <span className="text-[8px] font-bold text-white/50 bg-white/10 px-2 py-0.5 rounded-full">60FPS</span>
         <span className="text-[8px] font-bold text-yellow-500/50 bg-yellow-500/10 px-2 py-0.5 rounded-full">HDR</span>
      </div>
    </div>

    <div className="flex gap-4 text-aeirmist-cyan">
      <button><Settings size={22} /></button>
      <button><HelpCircle size={22} /></button>
      <button><Bot size={22} /></button>
    </div>
  </header>
);
