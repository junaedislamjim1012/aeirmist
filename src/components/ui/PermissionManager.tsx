import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Mic, 
  Image as ImageIcon, 
  Bell, 
  MapPin, 
  Users, 
  Bluetooth, 
  Settings,
  Shield, 
  X,
  ChevronRight
} from 'lucide-react';
import { PermissionType } from '../../hooks/usePermissions';
import { useAeirmist } from '../../context/AeirmistContext';

interface PermissionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  type: PermissionType;
  onConfirm: () => void;
  status?: 'prompt' | 'granted' | 'denied' | 'unavailable' | 'checking';
}

const PERMISSION_METADATA: Record<PermissionType, {
  title: string;
  description: string;
  icon: React.ReactNode;
  benefits: string[];
  color: string;
}> = {
  camera: {
    title: 'Camera Access',
    description: 'Capture the moment and share your vibe with the world.',
    icon: <Camera size={32} />,
    benefits: ['Create Stories & Reels', 'Send photo messages', 'Update profile photo'],
    color: 'aeirmist-cyan'
  },
  microphone: {
    title: 'Microphone Access',
    description: 'Let your voice be heard across the Networkwork.',
    icon: <Mic size={32} />,
    benefits: ['Send voice notes', 'Crystal clear calls', 'Record videos with sound'],
    color: 'aeirmist-magenta'
  },
  photos: {
    title: 'Media Gallery',
    description: 'Share your favorite memories from your local storage.',
    icon: <ImageIcon size={32} />,
    benefits: ['Upload from gallery', 'Save neural captures', 'Share high-res media'],
    color: 'aeirmist-lime'
  },
  notifications: {
    title: 'Notifications',
    description: 'Stay synced with your circle in real-time.',
    icon: <Bell size={32} />,
    benefits: ['Instant message alerts', 'Call notifications', 'Like & follow updates'],
    color: 'aeirmist-cyan'
  },
  location: {
    title: 'Geospatial Sync',
    description: 'Discover nearby nodes and tag your locations.',
    icon: <MapPin size={32} />,
    benefits: ['Location tagging', 'Find local creators', 'Regional trends'],
    color: 'aeirmist-magenta'
  },
  contacts: {
    title: 'Links',
    description: 'Find your real-world tribe in the digital sanctuary.',
    icon: <Users size={32} />,
    benefits: ['Sync contacts', 'Find friends easily', 'Personalized suggestions'],
    color: 'white'
  },
  bluetooth: {
    title: 'Bluetooth Audio',
    description: 'Connect your peripheral audio hardware for full immersion.',
    icon: <Bluetooth size={32} />,
    benefits: ['External microphones', 'Immersive earphones', 'Wireless controls'],
    color: 'aeirmist-cyan'
  }
};

export const PermissionManager: React.FC<PermissionManagerProps> = ({ 
  isOpen, 
  onClose, 
  type, 
  onConfirm,
  status = 'prompt'
}) => {
  const { addToast } = useAeirmist();
  const meta = PERMISSION_METADATA[type];

  if (!meta) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-aeirmist-bg/80 backdrop-blur-xl"
          />

          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-aeirmist-bg border-t md:border border-white/10 rounded-t-[40px] md:rounded-[40px] overflow-hidden shadow-2xl"
          >
            {/* Header Glow */}
            <div className={`absolute top-0 inset-x-0 h-1 bg-${meta.color} blur-[40px] opacity-20`} />
            
            <div className="p-8 pb-12 md:pb-8">
              <div className="flex justify-between items-start mb-8">
                <div className={`w-16 h-16 rounded-2xl bg-${meta.color}/10 border border-${meta.color}/20 flex items-center justify-center text-${meta.color}`}>
                  {meta.icon}
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2 mb-8">
                <h2 className="text-3xl font-black tracking-tighter text-white">
                  {meta.title}
                </h2>
                <p className="text-white/60 text-lg leading-relaxed">
                  {meta.description}
                </p>
              </div>

              <div className="space-y-4 mb-10">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  Benefits of Sync
                </h4>
                <div className="grid gap-3">
                  {meta.benefits.map((benefit, i) => (
                    <motion.div 
                      key={i}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 + i * 0.1 }}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full bg-${meta.color} shadow-[0_0_10px_#00f2ff]`} />
                      <span className="text-sm font-medium text-white/80">{benefit}</span>
                    </motion.div>
                  )) as any}
                </div>
              </div>

              {status === 'denied' ? (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-aeirmist-magenta/10 border border-aeirmist-magenta/20 flex gap-4">
                    <Shield className="text-aeirmist-magenta shrink-0" size={24} />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-aeirmist-magenta">Access denied</p>
                      <p className="text-xs text-white/60 leading-relaxed">
                        Permissions are blocked by your device security. Please enable them in your system settings to continue.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                        window.location.href = 'app-settings:';
                      } else {
                        // For web, we can't open settings directly, so we show a hint
                        addToast({ title: 'Enable Access', message: 'Tap the lock or settings icon in your browser address bar to allow permissions.', type: 'info' });
                      }
                    }}
                    className="w-full py-5 rounded-2xl bg-white text-aeirmist-bg font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Settings size={18} />
                    Open Device Settings
                  </button>
                  <p className="text-[10px] text-white/30 text-center uppercase tracking-widest leading-loose">
                    Alternatively, tap the lock icon in your browser address bar and toggle {meta.title} access.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={onConfirm}
                    disabled={status === 'checking'}
                    className={`w-full py-5 rounded-2x ${status === 'checking' ? 'bg-white/20' : `bg-${meta.color}`} text-aeirmist-bg font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center group`}
                  >
                    {status === 'checking' ? 'Establishing link...' : 'Allow Access'}
                    {status !== 'checking' && <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />}
                  </button>
                  <button 
                    onClick={onClose}
                    className="w-full py-5 rounded-2xl bg-white/5 text-white/40 font-black uppercase tracking-widest text-[10px] hover:text-white transition-all"
                  >
                    Maybe later
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Security Badge */}
            <div className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-center gap-2">
              <Shield size={12} className="text-white/20" />
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20">
                End-to-End Encryption Active
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
