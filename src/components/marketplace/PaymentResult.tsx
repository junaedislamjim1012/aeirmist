import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, Zap, ShieldCheck, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

export const PaymentResult = ({ status }: { status: 'success' | 'failure' }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get('type') || 'upgrade';
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const isVerified = type === 'verified';
  const title = status === 'success' 
    ? (isVerified ? 'Identity Verified' : 'Premium Activated') 
    : 'Sync Interrupted';
  const desc = status === 'success'
    ? `Your user has been upgraded to ${type === 'verified' ? 'verified' : 'premium'} status. All benefits are now active on your account.`
    : 'The Connection with the payment gateway was severed. No charges were processed.';

  return (
    <div className="h-full bg-aeirmist-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Aesthetics */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] ${status === 'success' ? 'bg-aeirmist-cyan/10' : 'bg-aeirmist-magenta/10'} rounded-full blur-[120px] opacity-40`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] ${status === 'success' ? 'bg-aeirmist-cyan/5' : 'bg-aeirmist-magenta/5'} rounded-full blur-[120px] opacity-40`} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg glass-panel p-10 md:p-12 rounded-[3.5rem] border-white/5 relative z-10 text-center space-y-8"
      >
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
            className={`w-24 h-24 rounded-[2rem] flex items-center justify-center ${
              status === 'success' 
                ? 'bg-aeirmist-cyan/20 text-aeirmist-cyan shadow-[0_0_50px_rgba(0,242,255,0.2)]' 
                : 'bg-aeirmist-magenta/20 text-aeirmist-magenta shadow-[0_0_50px_rgba(255,0,234,0.2)]'
            }`}
          >
            {status === 'success' ? (
              isVerified ? <ShieldCheck size={48} /> : <Zap size={48} />
            ) : (
              <XCircle size={48} />
            )}
          </motion.div>
        </div>

        <div className="space-y-3">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-black text-white uppercase tracking-tighter"
          >
            {title}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-white/40 font-medium leading-relaxed"
          >
            {desc}
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col gap-4"
        >
          <button 
            onClick={() => navigate('/dashboard')}
            className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
              status === 'success'
                ? 'bg-aeirmist-cyan text-black shadow-[0_0_30px_rgba(0,242,255,0.3)]'
                : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {status === 'success' ? 'Enter Dashboard' : 'Return Home'}
            <ArrowRight size={16} />
          </button>

          {status === 'failure' && (
            <button 
              onClick={() => navigate('/settings')}
              className="w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all bg-aeirmist-magenta/10 border border-aeirmist-magenta/20 text-aeirmist-magenta hover:bg-aeirmist-magenta/20"
            >
              <RefreshCw size={14} />
              Retry Upgrade
            </button>
          )}
        </motion.div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-2">
          <Loader2 size={12} className="text-white/20 animate-spin" />
          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">
            Redirecting in {countdown} cycles...
          </p>
        </div>
      </motion.div>
    </div>
  );
};
