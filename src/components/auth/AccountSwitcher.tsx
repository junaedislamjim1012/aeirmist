import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAeirmist } from '../../context/AeirmistContext';
import { UserPlus, Check, AtSign, Loader2, LogOut, Shield } from 'lucide-react';

interface AccountSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: () => void;
}

export const AccountSwitcher: React.FC<AccountSwitcherProps> = ({ isOpen, onClose, onAddAccount }) => {
  const { allProfiles, activeProfileId, switchProfile, logout, user } = useAeirmist();
  const [switchingId, setSwitchingId] = React.useState<string | null>(null);

  const handleSwitch = async (profileId: string) => {
    if (profileId === activeProfileId) return;
    setSwitchingId(profileId);
    try {
      await switchProfile(profileId);
      // Brief delay for visual transition
      setTimeout(() => {
        setSwitchingId(null);
        onClose();
      }, 500);
    } catch (e) {
      setSwitchingId(null);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out of all accounts?")) {
      await logout();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div key="account-switcher-wrapper">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed bottom-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full max-w-sm bg-aeirmist-bg border border-white/10 rounded-t-[3rem] md:rounded-[3rem] p-8 z-[101] shadow-[0_-20px_60px_rgba(0,0,0,0.5)] md:shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* HUD Decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-white/10 rounded-full mt-3 md:hidden" />
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Shield size={120} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-display font-black uppercase tracking-[0.2em] text-white">Switch Accounts</h2>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-aeirmist-cyan/10 flex items-center justify-center text-aeirmist-cyan">
                  <AtSign size={20} />
                </div>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                {allProfiles.map((p) => (
                  <motion.div
                    key={p.id}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSwitch(p.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                      activeProfileId === p.id 
                        ? 'bg-aeirmist-cyan/10 border-aeirmist-cyan/40 text-white' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-2xl p-0.5 bg-gradient-to-tr from-white/10 to-white/20">
                        <img 
                          src={p.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`} 
                          alt={p.username} 
                          className="w-full h-full rounded-xl object-cover"
                        />
                        {activeProfileId === p.id && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-aeirmist-cyan rounded-lg flex items-center justify-center border-2 border-aeirmist-bg">
                            <Check size={10} className="text-black font-bold" strokeWidth={4} />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest">{p.displayName || p.username}</div>
                        <div className="text-[9px] text-white/30 font-medium">@{p.username}</div>
                      </div>
                    </div>
                    {switchingId === p.id && (
                      <Loader2 size={16} className="text-aeirmist-cyan animate-spin" />
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 space-y-3">
                <button
                  onClick={onAddAccount}
                  className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.2em] text-[9px] flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-[0.98]"
                >
                  <UserPlus size={16} className="text-aeirmist-cyan" />
                  Add an Existing Account
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full py-5 rounded-2xl bg-white/0 border border-transparent text-white/20 font-black uppercase tracking-[0.2em] text-[9px] flex items-center justify-center gap-3 hover:text-aeirmist-magenta transition-all"
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
