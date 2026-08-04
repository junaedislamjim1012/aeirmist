import React from 'react';
import { motion } from 'motion/react';
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  HardDrive, 
  Cloud, 
  Shield, 
  Download,
  AlertTriangle,
  Clock,
  Settings
} from 'lucide-react';
import { useAeirmist } from '../../../context/AeirmistContext';
import { DigitalModule } from '../../ui/DigitalComponents';

const StorageSettings = () => {
  const { addToast, mediaSettings, setMediaSettings } = useAeirmist();

  const handlePurgeCache = () => {
    addToast?.({
      title: 'CACHE CLEARED',
      message: 'Local identity cache has been cleared.',
      type: 'success'
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      <div className="space-y-1">
        <h2 className="text-3xl font-display font-bold text-white">Data Allocation</h2>
        <p className="text-xs text-white/45 uppercase tracking-widest font-medium">Manage your digital footprint and storage vectors</p>
      </div>

      {/* Storage Overview */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StorageMetric label="Local Cache" value="142.8 MB" color="text-aeirmist-cyan" icon={<HardDrive size={14} />} />
        <StorageMetric label="Cloud Sync" value="2.4 GB" color="text-aeirmist-magenta" icon={<Cloud size={14} />} />
        <StorageMetric label="Artifacts" value="842 KB" color="text-aeirmist-lime" icon={<Database size={14} />} />
      </section>

      {/* Media Management */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-aeirmist-cyan/10 flex items-center justify-center text-aeirmist-cyan">
            <Settings size={18} />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/80">Sync Preferences</h3>
        </div>

        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/90">Asset Resolution</h4>
              <p className="text-[10px] text-white/40 mt-1">Control the fidelity of incoming media artifacts</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['LOW', 'MEDIUM', 'HIGH', 'ULTRA'].map((quality) => (
                <button
                  key={quality}
                  onClick={() => setMediaSettings({ ...mediaSettings, quality: quality as any })}
                  className={`py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                    mediaSettings.quality === quality
                      ? 'bg-aeirmist-cyan/10 border-aeirmist-cyan text-aeirmist-cyan shadow-[0_0_12px_rgba(0,242,255,0.15)]'
                      : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'
                  }`}
                >
                  {quality}
                </button>
              ))}
            </div>
          </div>

          <ToggleItem 
            icon={<Download size={18} />}
            title="Auto-Download Artifacts"
            desc="Automatically synchronize incoming media streams"
            enabled={mediaSettings.autoDownload}
            onChange={(v) => setMediaSettings({ ...mediaSettings, autoDownload: v })}
          />
        </div>
      </section>

      {/* Cache & Maintenance */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-aeirmist-magenta/10 flex items-center justify-center text-aeirmist-magenta">
            <RefreshCw size={18} />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/80">Maintenance</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/90">Identity Cache</h4>
              <p className="text-[10px] text-white/40 mt-1 leading-relaxed">Temporary assets stored to accelerate interface navigation</p>
            </div>
            <button 
              onClick={handlePurgeCache}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={12} />
              Purge Local Cache
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/90">Download Management</h4>
              <p className="text-[10px] text-white/40 mt-1 leading-relaxed">Review and manage artifacts stored on the host device</p>
            </div>
            <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
              Manage Downloads
            </button>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="pt-8 border-t border-white/5">
        <div className="p-8 rounded-[2.5rem] bg-aeirmist-magenta/5 border border-aeirmist-magenta/20 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-aeirmist-magenta/10 flex items-center justify-center text-aeirmist-magenta">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-aeirmist-magenta">System Termination</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mt-0.5">Danger Sector</p>
            </div>
          </div>
          
          <p className="text-[11px] text-white/50 leading-relaxed max-w-xl">
            Initiating a system termination will permanently erase your identity from the network. All links, assets, and encrypted histories will be deleted beyond recovery.
          </p>

          <button className="px-8 py-3 rounded-xl bg-aeirmist-magenta/20 border border-aeirmist-magenta/40 text-aeirmist-magenta text-[10px] font-black uppercase tracking-widest hover:bg-aeirmist-magenta hover:text-white transition-all">
            Terminate Sequence
          </button>
        </div>
      </section>
    </motion.div>
  );
};

const StorageMetric = ({ label, value, color, icon }: any) => (
  <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 space-y-2">
    <div className="flex items-center gap-2 opacity-40">
      {icon}
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <div className={`text-lg font-mono font-bold ${color}`}>{value}</div>
  </div>
);

const ToggleItem = ({ icon, title, desc, enabled, onChange }: any) => (
  <button 
    onClick={() => onChange(!enabled)}
    className="w-full p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex items-center justify-between text-left group"
  >
    <div className="flex items-center gap-5">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
        enabled ? 'bg-aeirmist-cyan/10 text-aeirmist-cyan' : 'bg-white/5 text-white/40 group-hover:text-white/60'
      }`}>
        {icon}
      </div>
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-white">{title}</h4>
        <p className="text-[10px] text-white/30 mt-0.5">{desc}</p>
      </div>
    </div>
    <div className={`w-12 h-6 rounded-full relative transition-all border ${
      enabled ? 'bg-aeirmist-cyan/20 border-aeirmist-cyan/30' : 'bg-white/5 border-white/10'
    }`}>
      <div className={`absolute top-1 transition-all w-4 h-4 rounded-full ${
        enabled ? 'right-1 bg-aeirmist-cyan shadow-[0_0_8px_rgba(0,242,255,0.6)]' : 'left-1 bg-white/20'
      }`} />
    </div>
  </button>
);

export default StorageSettings;
