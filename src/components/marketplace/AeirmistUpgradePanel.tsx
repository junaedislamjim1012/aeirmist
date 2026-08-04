import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Loader2, 
  Lock,
  Globe,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { aeirmistPaymentProvider } from '../../modules/marketplace/AeirmistPaymentProvider';
import { useAeirmist } from '../../context/AeirmistContext';

interface UpgradeOption {
  id: 'premium' | 'verified';
  title: string;
  price: string;
  desc: string;
  features: string[];
  icon: any;
  color: string;
  glow: string;
}

const OPTIONS: UpgradeOption[] = [
  {
    id: 'verified',
    title: 'Profile Verified',
    price: '$4.99',
    desc: 'Verify your account across the platform.',
    features: [
      'Digital Blue Checkmark',
      'Priority in Search Messages',
      'Enhanced Trust Score',
      'Anti-Impersonation Guard'
    ],
    icon: ShieldCheck,
    color: 'text-aeirmist-cyan',
    glow: 'shadow-[0_0_30px_rgba(0,242,255,0.2)]'
  },
  {
    id: 'premium',
    title: 'Aeirmist Premium Upgrade',
    price: '$19.99',
    desc: 'Unlock the full potential of your synaptic interface.',
    features: [
      'Infinite Storage for Stories',
      'Ultra-HD Media Transmission',
      'Custom Interface Themes',
      'Exclusive Premium Badge',
      'Developer API Access'
    ],
    icon: Sparkles,
    color: 'text-aeirmist-magenta',
    glow: 'shadow-[0_0_30px_rgba(255,0,229,0.2)]'
  }
];

export const AeirmistUpgradePanel: React.FC = () => {
  const { user, addToast } = useAeirmist();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleUpgrade = async (type: 'premium' | 'verified') => {
    if (!user) return;
    
    if (!navigator.onLine) {
      addToast({ title: 'Connection lost', message: 'Please check your network connection and try again.', type: 'warning' });
      return;
    }

    if (!user) {
      addToast({ title: 'Authentication required', message: 'Please log in to upgrade.', type: 'warning' });
      return;
    }

    setLoadingId(type);
    try {
      await aeirmistPaymentProvider.startCheckout(user.uid, type);
    } catch (e) {
      console.error(e);
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Hero Section */}
      <div className="text-center space-y-4 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/40"
        >
          <Fingerprint size={12} />
          Synaptic Enhancement Center
        </motion.div>
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight">
          Evolve Your <span className="text-aeirmist-cyan">Digital Presence</span>
        </h2>
        <p className="text-white/40 text-sm font-medium max-w-lg mx-auto">
          Scale your interaction boundaries beyond the standard limits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto px-4">
        {OPTIONS.map((opt, i) => (
          <motion.div
            key={opt.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-panel p-8 rounded-[3rem] border-white/5 relative overflow-hidden group hover:border-${opt.id === 'premium' ? 'aeirmist-magenta' : 'aeirmist-cyan'}/30 transition-all duration-700`}
          >
            {/* Background Aesthetics */}
            <div className={`absolute top-0 right-0 p-12 opacity-5 scale-150 blur-3xl ${opt.id === 'premium' ? 'bg-aeirmist-magenta' : 'bg-aeirmist-cyan'} w-64 h-64 rounded-full`} />
            
            <div className="relative z-10 space-y-8">
              <div className="flex items-start justify-between">
                <div className={`p-4 rounded-2xl bg-white/5 ${opt.color}`}>
                  <opt.icon size={24} />
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-white">{opt.price}</span>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">One-time sync</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">{opt.title}</h3>
                <p className="text-xs text-white/40 font-medium leading-relaxed mt-2">{opt.desc}</p>
              </div>

              <div className="space-y-4">
                {opt.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full bg-white/5 flex items-center justify-center ${opt.color}`}>
                      <Check size={10} />
                    </div>
                    <span className="text-[11px] font-bold text-white/60 tracking-wide">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(opt.id)}
                disabled={loadingId !== null}
                className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 overflow-hidden relative group/btn ${
                  opt.id === 'premium' 
                    ? 'bg-aeirmist-magenta text-white shadow-[0_0_40px_rgba(255,0,229,0.3)]' 
                    : 'bg-aeirmist-cyan text-black shadow-[0_0_40px_rgba(0,242,255,0.3)] hover:scale-[1.02]'
                } ${loadingId === opt.id ? 'opacity-80' : ''}`}
              >
                <AnimatePresence mode="wait">
                  {loadingId === opt.id ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, rotate: 0 }}
                      animate={{ opacity: 1, rotate: 360 }}
                      exit={{ opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    >
                      <Loader2 size={16} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="label"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3"
                    >
                      Initialize Upgrade
                      <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Safety Guidelines */}
      <div className="max-w-xl mx-auto glass-panel p-6 rounded-2xl border-white/5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20">
          <Sparkles size={18} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Beta Phase Active</p>
          <p className="text-[9px] text-white/20 font-medium uppercase tracking-[0.05em] mt-0.5">Premium features are currently unlocked for all users during our neural expansion phase.</p>
        </div>
      </div>
    </div>
  );
};
