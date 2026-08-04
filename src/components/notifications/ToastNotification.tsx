import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useAeirmist } from '../../context/AeirmistContext';
import confetti from 'canvas-confetti';

export const ToastNotification: React.FC = () => {
  const { toasts, removeToast } = useAeirmist();

  useEffect(() => {
    // Check if there are any new success toasts to trigger a subtle confetti
    const newSuccessToast = toasts.find(t => t.type === 'success' && !t.confettiFired);
    if (newSuccessToast) {
      newSuccessToast.confettiFired = true;
      try {
        confetti({
          particleCount: 30,
          spread: 40,
          origin: { y: 0.1 },
          colors: ['#00f2ff', '#ffffff'],
          disableForReducedMotion: true,
          zIndex: 9999
        });
      } catch (e) {}
    }
  }, [toasts]);

  return (
    <div 
      className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-3 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';
          
          let DefaultIcon = Bell;
          let iconColor = "text-white/60";
          let glowClass = "from-white/20 to-white/5";

          if (isSuccess) {
            DefaultIcon = CheckCircle2;
            iconColor = "text-aeirmist-cyan";
            glowClass = "from-aeirmist-cyan to-aeirmist-cyan/20";
          } else if (isWarning) {
            DefaultIcon = AlertTriangle;
            iconColor = "text-aeirmist-magenta";
            glowClass = "from-aeirmist-magenta to-aeirmist-magenta/20";
          } else {
            DefaultIcon = Info;
            iconColor = "text-aeirmist-magenta";
            glowClass = "from-aeirmist-cyan to-aeirmist-magenta opacity-40 animate-pulse";
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              className="pointer-events-auto"
            >
              <div className="relative group">
                {/* Outer Glow */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${glowClass} rounded-2xl blur-md`} />
                
                <div className="relative glass-panel rounded-2xl border border-white/10 px-6 py-4 flex items-center gap-4 bg-black/80 backdrop-blur-3xl shadow-2xl min-w-[320px] max-w-[400px]">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {toast.icon || <DefaultIcon size={18} className={iconColor} />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-0.5">{toast.title}</h5>
                    <p className="text-xs font-bold text-white leading-tight">{toast.message}</p>
                  </div>

                  <button 
                    type="button"
                    aria-label="Dismiss notification"
                    onClick={() => removeToast?.(toast.id)}
                    className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aeirmist-cyan"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
