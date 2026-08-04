import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 inset-x-0 z-[9998] flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/95 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-widest shadow-lg"
          style={{ paddingTop: 'calc(0.625rem + env(safe-area-inset-top))' }}
        >
          <WifiOff size={14} />
          <span>No internet connection</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
