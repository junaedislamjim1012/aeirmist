import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Terminal, 
  Cpu, 
  Activity, 
  Code2, 
  Database, 
  Globe, 
  ShieldAlert,
  Zap,
  Server,
  Monitor,
  HardDrive,
  RefreshCw,
  Box,
  Key
} from 'lucide-react';
import { useAeirmist } from '../../../context/AeirmistContext';
import { AeirmistAnalyticsDashboard } from '../AeirmistAnalyticsDashboard';

const DeveloperSettings = () => {
  const { addToast } = useAeirmist();
  const [debugMode, setDebugMode] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-20"
    >
      <div className="space-y-1">
        <h2 className="text-3xl font-display font-bold text-white">Developer Options</h2>
        <p className="text-xs text-aeirmist-cyan uppercase tracking-widest font-black">Advanced System Tools & Diagnostics</p>
      </div>

      {/* Warning Panel */}
      <div className="p-8 rounded-[3rem] bg-white/[0.02] border border-white/10 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldAlert size={80} className="text-aeirmist-cyan" />
        </div>
        <div className="relative z-10">
           <h3 className="text-sm font-bold uppercase tracking-widest text-aeirmist-cyan flex items-center gap-2">
             <ShieldAlert size={16} /> Advanced Area
           </h3>
           <p className="text-[11px] text-white/50 leading-relaxed max-w-2xl mt-2">
             Modifying these settings may alter your local storage synchronization or performance. Use caution when tweaking experimental developer preferences.
           </p>
        </div>
      </div>

      {/* System Status Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DevStat label="Memory Load" value="14%" icon={<Cpu size={14} />} color="text-aeirmist-cyan" />
        <DevStat label="Network Latency" value="24ms" icon={<Activity size={14} />} color="text-aeirmist-lime" />
        <DevStat label="Connection" value="Stable" icon={<Globe size={14} />} color="text-blue-400" />
        <DevStat label="Uptime" value="142h 12m" icon={<Server size={14} />} color="text-white/60" />
      </section>

      {/* Debug Controls */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
            <Terminal size={18} />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/80">Diagnostic Settings</h3>
        </div>

        <div className="space-y-4">
          <DevToggle 
            icon={<Code2 size={18} />}
            title="Verbose Logging"
            desc="Output detailed debugging information to console"
            enabled={debugMode}
            onChange={setDebugMode}
          />
          <DevToggle 
            icon={<Monitor size={18} />}
            title="Inspect Element IDs"
            desc="Display unique component identifiers on hover"
            enabled={false}
            onChange={() => {}}
          />
          <DevToggle 
            icon={<HardDrive size={18} />}
            title="Mock Persistence"
            desc="Use local browser memory for temporary tests"
            enabled={false}
            onChange={() => {}}
          />
        </div>
      </section>

      {/* Data Management */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
            <Database size={18} />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/80">Data Management</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => addToast({ title: 'Sync Started', message: 'Refreshing local user session data...', type: 'info' })}
            className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-aeirmist-cyan/40 transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-aeirmist-cyan transition-colors">
                  <RefreshCw size={18} />
               </div>
               <div className="text-left">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white">Full Data Re-Sync</div>
                  <div className="text-[9px] text-white/30 uppercase mt-0.5">Force refresh profile data</div>
               </div>
            </div>
          </button>

          <button 
            onClick={() => addToast({ title: 'Export Complete', message: 'JSON backup manifest downloaded.', type: 'success' })}
            className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-aeirmist-magenta/40 transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-aeirmist-magenta transition-colors">
                  <Box size={18} />
               </div>
               <div className="text-left">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white">Export Account JSON</div>
                  <div className="text-[9px] text-white/30 uppercase mt-0.5">Download account backup</div>
               </div>
            </div>
          </button>
        </div>
      </section>

      {/* API Configuration */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
            <Key size={18} />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/80">API Endpoints</h3>
        </div>

        <div className="p-8 rounded-[3rem] bg-white/[0.02] border border-white/10 space-y-4">
           <div className="space-y-2">
             <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Gateway Host</label>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 readOnly 
                 value="https://api.aeirmist.com/v2" 
                 className="flex-1 h-11 px-4 bg-white/[0.03] border border-white/10 rounded-xl text-xs font-mono text-white/60 outline-none" 
               />
               <button 
                 onClick={() => {
                   navigator.clipboard.writeText("https://api.aeirmist.com/v2");
                   addToast({ title: 'Copied', message: 'Endpoint URL copied to clipboard.', type: 'success' });
                 }}
                 className="px-4 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer"
               >
                 Copy
               </button>
             </div>
           </div>
        </div>
      </section>

      {/* Analytics Insights */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-aeirmist-cyan/10 flex items-center justify-center text-aeirmist-cyan">
            <Activity size={18} />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/80">Activity & Performance Index</h3>
        </div>

        <AeirmistAnalyticsDashboard />
      </section>
    </motion.div>
  );
};

const DevStat = ({ label, value, icon, color }: any) => (
  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
    <div className="flex items-center gap-2 text-white/20">
      {icon}
      <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <div className={`text-sm font-mono font-bold ${color}`}>{value}</div>
  </div>
);

const DevToggle = ({ icon, title, desc, enabled, onChange }: any) => (
  <button 
    onClick={() => onChange(!enabled)}
    className="w-full p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex items-center justify-between text-left group"
  >
    <div className="flex items-center gap-5">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
        enabled ? 'bg-aeirmist-magenta/10 text-aeirmist-magenta' : 'bg-white/5 text-white/40 group-hover:text-white/60'
      }`}>
        {icon}
      </div>
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-white">{title}</h4>
        <p className="text-[10px] text-white/30 mt-0.5">{desc}</p>
      </div>
    </div>
    <div className={`w-12 h-6 rounded-full relative transition-all border ${
      enabled ? 'bg-aeirmist-magenta/20 border-aeirmist-magenta/30' : 'bg-white/5 border-white/10'
    }`}>
      <div className={`absolute top-1 transition-all w-4 h-4 rounded-full ${
        enabled ? 'right-1 bg-aeirmist-magenta shadow-[0_0_8px_rgba(255,0,255,0.6)]' : 'left-1 bg-white/20'
      }`} />
    </div>
  </button>
);

export default DeveloperSettings;
