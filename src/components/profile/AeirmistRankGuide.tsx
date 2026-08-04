import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Cpu, 
  Lock, 
  ShieldCheck, 
  Zap, 
  Sparkles,
  TrendingUp,
  Award,
  ChevronRight,
  Info
} from 'lucide-react';
import { AEIRMIST_THRESHOLDS } from '../../lib/aeirmistRanks';
import { AeirmistRankBadge } from './AeirmistRankBadge';

interface AeirmistRankGuideProps {
  isOpen: boolean;
  onClose: () => void;
  currentPoints: number;
  currentRank: string;
}

export const AeirmistRankGuide: React.FC<AeirmistRankGuideProps> = ({ 
  isOpen, 
  onClose, 
  currentPoints, 
  currentRank 
}) => {
  // We want to show ranks from lowest to highest for the guide
  const progressionList = [...AEIRMIST_THRESHOLDS].reverse();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 20 }} 
            className="relative z-10 w-full max-w-xl max-h-[85vh] bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-aeirmist-cyan/10 border border-aeirmist-cyan/20 flex items-center justify-center">
                  <TrendingUp size={20} className="text-aeirmist-cyan" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Node Progression Guide</h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Aeirmist Network Rank System</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer group"
              >
                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Current Status Banner */}
            <div className="px-6 sm:px-8 py-5 bg-gradient-to-r from-aeirmist-cyan/5 to-transparent border-b border-white/5 shrink-0 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">Your Current Score</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white font-mono">{currentPoints.toLocaleString()}</span>
                  <span className="text-aeirmist-cyan text-xs font-black tracking-widest uppercase">AP</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">Active Level</p>
                <div className="mt-1 px-3 py-1 rounded-lg bg-aeirmist-cyan/15 border border-aeirmist-cyan/30 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-aeirmist-cyan animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-aeirmist-cyan">{currentRank}</span>
                </div>
              </div>
            </div>

            {/* Scrollable Rank List */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 scrollbar-hide">
              {progressionList.map((tier, idx) => {
                const isCurrent = currentRank === tier.rank;
                const isUnlocked = currentPoints >= tier.points;
                const isNext = !isUnlocked && (idx === 0 || currentPoints >= progressionList[idx - 1].points);
                const pointsToUnlock = tier.points - currentPoints;

                return (
                  <div 
                    key={tier.rank}
                    className={`relative group transition-all duration-500 ${!isUnlocked && !isNext ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}
                  >
                    {/* Connection Line */}
                    {idx < progressionList.length - 1 && (
                      <div className="absolute left-[23px] top-12 bottom-[-24px] w-[2px] bg-gradient-to-b from-white/10 to-transparent z-0" />
                    )}

                    <div className={`relative z-10 p-5 rounded-2xl border transition-all duration-300 ${
                      isCurrent 
                        ? 'bg-white/[0.05] border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)]' 
                        : isUnlocked 
                          ? 'bg-white/[0.02] border-white/5' 
                          : isNext 
                            ? 'bg-aeirmist-cyan/[0.02] border-aeirmist-cyan/20' 
                            : 'bg-black/40 border-white/5'
                    }`}>
                      <div className="flex gap-5 items-start">
                        {/* Left: Badge */}
                        <div className="shrink-0">
                          <div className={`p-1 rounded-xl transition-transform duration-500 group-hover:scale-110 ${isCurrent ? 'bg-white/5' : ''}`}>
                            <AeirmistRankBadge score={tier.points} size="sm" />
                          </div>
                        </div>

                        {/* Right: Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`text-sm font-black uppercase tracking-widest ${isCurrent ? 'text-white' : 'text-white/80'}`} style={{ color: isCurrent ? tier.color : undefined }}>
                              {tier.rank}
                            </h4>
                            {isCurrent ? (
                              <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/10 text-white border border-white/10">Active Node</span>
                            ) : isUnlocked ? (
                              <ShieldCheck size={14} className="text-aeirmist-lime" />
                            ) : (
                              <Lock size={12} className="text-white/20" />
                            )}
                          </div>

                          <div className="flex items-center gap-3 mb-4">
                            <p className="text-[11px] font-medium text-white/50">
                              Requires <span className="font-mono text-white font-bold">{tier.points.toLocaleString()} AP</span>
                            </p>
                            {isNext && pointsToUnlock > 0 && (
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-aeirmist-cyan/10 border border-aeirmist-cyan/20">
                                <TrendingUp size={10} className="text-aeirmist-cyan" />
                                <span className="text-[8px] font-black text-aeirmist-cyan uppercase tracking-tighter">Next Milestone: {pointsToUnlock.toLocaleString()} AP needed</span>
                              </div>
                            )}
                          </div>

                          {/* Benefits Grid */}
                          <div className="flex flex-wrap gap-2">
                            {tier.benefits?.map((benefit: string, bIdx: number) => (
                              <div 
                                key={bIdx}
                                className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 flex items-center gap-1.5 group/benefit transition-colors hover:bg-white/[0.06]"
                              >
                                <div className="w-1 h-1 rounded-full bg-white/20 group-hover/benefit:bg-aeirmist-cyan transition-colors" />
                                <span className="text-[8px] font-bold text-white/40 uppercase tracking-wide group-hover/benefit:text-white/70 transition-colors">{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer: How to earn */}
            <div className="p-6 bg-black/40 border-t border-white/5 shrink-0">
              <div className="flex items-center gap-2 mb-4">
                <Info size={14} className="text-white/40" />
                <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Aeirmist Synchronization Methods</h5>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Post Creation</p>
                  <p className="text-xs font-mono font-bold text-aeirmist-lime">+500 AP</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Story Upload</p>
                  <p className="text-xs font-mono font-bold text-aeirmist-lime">+200 AP</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Receive Like</p>
                  <p className="text-xs font-mono font-bold text-aeirmist-lime">+50 AP</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Comment Interaction</p>
                  <p className="text-xs font-mono font-bold text-aeirmist-lime">+100 AP</p>
                </div>
              </div>
              <p className="mt-5 text-center text-[7.5px] font-bold text-white/20 uppercase tracking-[0.3em]">Max Sync: Aeirmist Infinity Elite • 1,000,000 AP</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
