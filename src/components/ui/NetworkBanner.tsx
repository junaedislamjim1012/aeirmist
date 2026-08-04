import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNetworkStatus } from '../../context/NetworkStatusContext';
import { WifiOff, Wifi, X } from 'lucide-react';
import { fadeTransition } from '../../lib/motion';

export const NetworkBanner: React.FC = () => {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowBackOnline(true);
      const timer = setTimeout(() => {
        setShowBackOnline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  return (
    <AnimatePresence>
      {!isOnline ? (
        <motion.div
          key="offline-banner"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={fadeTransition}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md"
        >
          <div className="glass-panel py-3 px-5 rounded-2xl bg-red-500/10 border border-red-500/20 backdrop-blur-xl flex items-center justify-between shadow-[0_10px_30px_rgba(239,68,68,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                <WifiOff size={16} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-white">Digital Disconnect</p>
                <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Syncing paused — check connection</p>
              </div>
            </div>
          </div>
        </motion.div>
      ) : showBackOnline ? (
        <motion.div
          key="online-banner"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={fadeTransition}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md"
        >
          <div className="glass-panel py-3 px-5 rounded-2xl bg-aeirmist-cyan/10 border border-aeirmist-cyan/20 backdrop-blur-xl flex items-center justify-between shadow-[0_10px_30px_rgba(0,242,255,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-aeirmist-cyan/20 flex items-center justify-center text-aeirmist-cyan">
                <Wifi size={16} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-white">Back Online</p>
                <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Connections restored</p>
              </div>
            </div>
            <button onClick={() => setShowBackOnline(false)} className="text-white/20 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
