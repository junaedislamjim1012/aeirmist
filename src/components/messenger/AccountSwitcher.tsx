import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  Settings, 
  LogOut, 
  Check, 
  ChevronRight, 
  ShieldCheck, 
  Fingerprint,
  Zap,
  Globe,
  Bell,
  Cpu
} from 'lucide-react';
import { useAeirmist } from '../../context/AeirmistContext';

interface AccountSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSwitcher: React.FC<AccountSwitcherProps> = ({ isOpen, onClose }) => {
  const { account, profile, allProfiles, switchProfile, logout, addToast } = useAeirmist();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg glass-panel overflow-hidden rounded-[3rem] border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,1)]"
          >
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-aeirmist-cyan/10 to-transparent" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-aeirmist-magenta/5 blur-[100px]" />
            </div>

            <div className="relative z-10 p-8 md:p-10 space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-display font-black tracking-[0.2em] uppercase text-white">Identity Hub</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-aeirmist-cyan shadow-[0_0_8px_rgba(0,242,255,0.5)] animate-pulse" />
                    <p className="text-[10px] text-aeirmist-cyan uppercase tracking-[0.4em] font-black italic">Active Session Secured</p>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                  <Fingerprint size={24} />
                </div>
              </div>

              {/* Profiles List */}
              <div className="space-y-4">
                <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-black italic px-2">Saved Users</p>
                <div className="space-y-3 max-h-[40vh] overflow-y-auto no-scrollbar px-1">
                  {allProfiles.map((p) => {
                    const isActive = p.id === profile?.id;
                    return (
                      <motion.button
                        key={p.id}
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={async () => {
                          if (!isActive) {
                            await switchProfile(p.id);
                            onClose();
                          }
                        }}
                        className={`w-full group flex items-center gap-4 p-4 rounded-3xl border transition-all duration-500 relative overflow-hidden ${
                          isActive 
                            ? 'bg-aeirmist-cyan/10 border-aeirmist-cyan shadow-[0_0_30px_rgba(0,242,255,0.15)]' 
                            : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.08]'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute top-0 left-0 w-1 h-full bg-aeirmist-cyan shadow-[0_0_15px_rgba(0,242,255,1)]" />
                        )}
                        <div className="relative flex-shrink-0">
                          <div className={`w-14 h-14 rounded-2xl border-2 overflow-hidden transition-all duration-500 ${
                            isActive ? 'border-aeirmist-cyan scale-105' : 'border-white/10 group-hover:border-white/20'
                          }`}>
                            <img src={p.photoURL} alt={p.displayName} className="w-full h-full object-cover" />
                          </div>
                          {isActive && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-aeirmist-cyan rounded-lg border-2 border-aeirmist-bg flex items-center justify-center">
                              <Check size={12} className="text-aeirmist-bg" strokeWidth={4} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <h4 className={`text-sm font-black uppercase tracking-widest truncate ${isActive ? 'text-aeirmist-cyan' : 'text-white'}`}>
                            {p.displayName || p.username}
                          </h4>
                          <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-0.5 truncate">
                            @{p.username}
                          </p>
                        </div>
                        <ChevronRight size={16} className={`transition-all duration-300 ${isActive ? 'text-aeirmist-cyan' : 'text-white/10 group-hover:text-white group-hover:translate-x-1'}`} />
                      </motion.button>
                    );
                  })}
                </div>

                {/* Account Actions */}
                <div className="pt-2 space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        addToast({ title: 'Handshake Initiated', message: 'Initiating Connection for new account...', type: 'info' });
                        onClose();
                    }}
                    className="w-full flex items-center justify-center gap-3 py-5 rounded-3xl bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:bg-aeirmist-cyan transition-all group"
                  >
                    <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
                    Add Account
                  </motion.button>

                  <div className="grid grid-cols-2 gap-3">
                    <button className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:border-white/20 transition-all">
                      <Settings size={14} />
                      Settings
                    </button>
                    <button 
                      onClick={logout}
                      className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-aeirmist-magenta/5 border border-aeirmist-magenta/10 text-[9px] font-black uppercase tracking-widest text-aeirmist-magenta/60 hover:text-aeirmist-magenta hover:bg-aeirmist-magenta/10 hover:border-aeirmist-magenta/30 transition-all"
                    >
                      <LogOut size={14} />
                      Log Out
                    </button>
                  </div>
                </div>
              </div>

              {/* Secure Footer Info */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-aeirmist-lime" />
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">AES-512 Level</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Globe size={12} className="text-aeirmist-cyan" />
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Edge Node: Tokyo-01</span>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.2em]">Digital Engine v4.2.9</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
