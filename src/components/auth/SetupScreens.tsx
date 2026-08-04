import React from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { AeirmistLogo } from '../ui/AeirmistLogo';
import { DynamicAesthetic } from '../ui/DynamicAesthetic';

export const SetupRequiredScreen = ({ connectionError, isConnecting }: { connectionError: string | null, isConnecting: boolean }) => (
  <div className="h-full bg-aeirmist-bg flex items-center justify-center p-6 relative overflow-hidden">
    <div className="absolute inset-0 bg-aeirmist-magenta/5 blur-[120px] rounded-full animate-pulse" />
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel max-w-md w-full p-10 rounded-[3rem] text-center border-aeirmist-magenta/20 z-10"
    >
      <div className="w-16 h-16 bg-aeirmist-magenta/10 rounded-2xl flex items-center justify-center text-aeirmist-magenta mx-auto mb-6">
        <Lock size={32} />
      </div>
      <h2 className="text-2xl font-display font-bold mb-4 uppercase tracking-widest text-white">Setup Required</h2>
      <p className="text-white/40 text-sm mb-8 leading-relaxed">
        {connectionError || "The Link hasn't been established. Please complete the Firebase setup in the AI Studio panel to activate the Aeirmist."}
      </p>
      
      <div className="space-y-4">
        <div className="p-4 rounded-3xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-aeirmist-cyan animate-pulse mb-4">
          {isConnecting ? 'Resonating with Cloud...' : 'Awaiting Cloud Sync...'}
        </div>
      </div>
    </motion.div>
  </div>
);

export const PairingFailedScreen = ({ error, onRetry }: { error: string, onRetry: () => void }) => (
  <div className="fixed inset-0 bg-aeirmist-bg flex items-center justify-center z-[200] overflow-hidden">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.05)_0%,transparent_70%)]" />
    
    <div className="relative flex flex-col items-center max-w-sm w-full p-8 md:p-12 text-center space-y-8 z-10">
      <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 text-red-500 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.15)]">
        <AlertCircle size={36} className="animate-pulse" />
      </div>
      
      <div className="space-y-3">
          <h2 className="text-xl font-display font-black uppercase tracking-[0.3em] text-white">Connection Failed</h2>
          <p className="text-[10px] text-red-400/80 uppercase tracking-widest font-bold font-mono">
            Pairing Message Connection Broken
          </p>
      </div>

      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 w-full">
        <p className="text-[10px] text-white/60 leading-relaxed uppercase tracking-wider">
          {error}
        </p>
      </div>

      <button 
        onClick={onRetry}
        className="w-full py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-aeirmist-cyan hover:shadow-[0_0_20px_rgba(0,188,212,0.4)] transition-all"
      >
        Return to Welcome Center
      </button>
    </div>
  </div>
);

export const PurgeScreen = ({ onCancel, onLogout }: { onCancel: () => void, onLogout: () => void }) => (
  <div className="h-full bg-black flex items-center justify-center p-6 relative overflow-hidden text-white font-sans min-h-screen">
    <DynamicAesthetic />
    <div className="absolute inset-0 bg-yellow-500/5 blur-[120px] rounded-full animate-pulse" />
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel max-w-sm w-full p-10 rounded-[3rem] text-center border-yellow-500/20 z-10"
    >
      <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500 mx-auto mb-6">
        <Lock size={32} />
      </div>
      <h2 className="text-xl font-display font-bold mb-4 uppercase tracking-[0.15em] text-white">Digital Purge Scheduled</h2>
      <p className="text-white/40 text-[11px] mb-8 leading-relaxed">
        Your Aeirmist profile is currently scheduled for permanent erasure. You are within the 30-day recovery grace period. Reactivate your account below to restore all feeds, messages, and followers instantly.
      </p>
      
      <div className="space-y-4">
        <button 
          onClick={onCancel}
          className="w-full py-4 rounded-xl bg-white text-black font-semibold uppercase text-[11px] tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] cursor-pointer"
        >
          Cancel Purge & Restore Account
        </button>
        <button 
          onClick={onLogout}
          className="w-full py-4 rounded-xl bg-white/5 text-white/40 font-semibold uppercase text-[11px] tracking-wider hover:text-white transition-all border border-white/5 hover:bg-white/10 cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </motion.div>
  </div>
);

export const DeactivatedScreen = ({ onReactivate, onLogout }: { onReactivate: () => void, onLogout: () => void }) => (
  <div className="h-full bg-black flex items-center justify-center p-6 relative overflow-hidden text-white font-sans">
    <DynamicAesthetic />
    <div className="absolute inset-0 bg-red-500/5 blur-[120px] rounded-full animate-pulse" />
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel max-w-md w-full p-10 rounded-[3rem] text-center border-red-500/20 z-10"
    >
      <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
        <AlertCircle size={32} />
      </div>
      <h2 className="text-xl font-display font-bold mb-4 uppercase tracking-[0.15em] text-white">Aeirmist User Deactivated</h2>
      <p className="text-white/40 text-xs mb-8 leading-relaxed">
        Your Aeirmist profile has been deactivated. All Message transmissions, follower graph syncs, and active messages are currently suspended pending identity reactivation.
      </p>
      
      <div className="space-y-4">
        <button 
          onClick={onReactivate}
          className="w-full py-4 rounded-full bg-gradient-to-r from-aeirmist-cyan to-aeirmist-magenta text-black font-black uppercase text-[10px] tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)] animate-pulse"
        >
          Re-materialize Account
        </button>
        <button 
          onClick={onLogout}
          className="w-full py-4 rounded-full bg-white/5 text-white/40 font-black uppercase text-[10px] tracking-widest hover:text-white transition-all border border-white/5 hover:bg-white/10"
        >
          Sign Out
        </button>
      </div>
    </motion.div>
  </div>
);
