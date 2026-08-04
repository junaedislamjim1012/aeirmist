import React from 'react';
import { AlertTriangle, MessageSquare, ArrowRight } from 'lucide-react';

interface ModerationWarningModalProps {
  isOpen: boolean;
  reason?: string | null;
  suggestion?: string | null;
  onEdit: () => void;
  onProceedAnyway: () => void;
}

export const ModerationWarningModal: React.FC<ModerationWarningModalProps> = ({
  isOpen,
  reason,
  suggestion,
  onEdit,
  onProceedAnyway
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#0f1420] border border-amber-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Language Courtesy Warning</h3>
            <p className="text-[10px] text-white/50 uppercase font-mono tracking-widest">Community Guideline Pulse</p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-white/80 leading-relaxed">
          <p>{reason || 'Your comment appears to contain harsh or non-constructive language.'}</p>
          {suggestion && (
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-xs text-cyan-200">
              <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-400 block mb-1">Constructive Alternative:</span>
              "{suggestion}"
            </div>
          )}
          <p className="text-[11px] text-white/50">
            Maintaining respectful communication keeps Aeirmist welcoming for everyone.
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onEdit}
            className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Edit Message
          </button>
          <button
            type="button"
            onClick={onProceedAnyway}
            className="flex-1 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
          >
            <span>Post Anyway</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
