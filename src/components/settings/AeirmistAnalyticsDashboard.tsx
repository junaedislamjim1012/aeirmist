import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Zap, 
  Brain, 
  Activity, 
  Clock, 
  MousePointer2,
  Lock,
  ChevronRight,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { analytics } from '../../services/AnalyticsService';

export const AeirmistAnalyticsDashboard: React.FC = () => {
  const [insights, setInsights] = useState<any[]>([]);
  const [isOptedIn, setIsOptedIn] = useState(() => {
    const saved = localStorage.getItem('aeirmist_privacy_analytics');
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('aeirmist_neural_insights');
      const logs = saved ? JSON.parse(saved) : [];
      setInsights(Array.isArray(logs) ? logs : []);
    } catch (e) {
      console.warn("Could not load neural insights logs:", e);
      setInsights([]);
    }
  }, []);

  const handleToggleOptIn = () => {
    const newVal = !isOptedIn;
    setIsOptedIn(newVal);
    analytics.setOptIn(newVal);
  };

  const getEventCounts = () => {
    const counts: Record<string, number> = {};
    insights.forEach(item => {
      counts[item.action] = (counts[item.action] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Header Panel */}
      <div className="glass-panel p-8 rounded-[2.5rem] relative overflow-hidden border-aeirmist-cyan/20">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Brain size={120} />
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 text-aeirmist-cyan">
            <Activity size={20} />
            <h2 className="text-sm font-black uppercase tracking-[0.3em]">Connections Insights</h2>
          </div>
          <p className="text-white/40 text-xs font-medium leading-relaxed max-w-sm">
            Real-time telemetry from your local node. This data helps optimize your activity with the global Aeirmist stream.
          </p>
          
          <div className="flex items-center gap-6 pt-4">
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-white/30 tracking-widest mb-1">Active Messages</span>
              <span className="text-xl font-black text-white">{insights.length}</span>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-white/30 tracking-widest mb-1">Privacy Status</span>
              <span className={`text-xs font-black uppercase tracking-widest ${isOptedIn ? 'text-aeirmist-cyan' : 'text-aeirmist-magenta'}`}>
                {isOptedIn ? 'Saved' : 'Isolated'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="glass-panel p-6 rounded-[2rem] border-white/5 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isOptedIn ? 'bg-aeirmist-cyan/10 text-aeirmist-cyan' : 'bg-aeirmist-magenta/10 text-aeirmist-magenta'}`}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Digital Telemetry</h3>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Control data sharing</p>
            </div>
          </div>
          <button 
            onClick={handleToggleOptIn}
            className={`w-12 h-6 rounded-full relative transition-colors duration-500 ${isOptedIn ? 'bg-aeirmist-cyan' : 'bg-white/10'}`}
          >
            <motion.div 
              animate={{ x: isOptedIn ? 24 : 4 }}
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg"
            />
          </button>
        </div>
        {!isOptedIn && (
          <div className="p-4 rounded-2xl bg-aeirmist-magenta/5 border border-aeirmist-magenta/20 flex items-start gap-3">
            <Lock size={14} className="text-aeirmist-magenta shrink-0 mt-0.5" />
            <p className="text-[9px] text-aeirmist-magenta/80 font-bold uppercase tracking-widest leading-relaxed">
              Analytics collection is disabled.
            </p>
          </div>
        )}
      </div>

      {/* Realtime Event Stream */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 pl-2">Top Data</h4>
          <div className="space-y-3">
            {getEventCounts().map(([action, count], i) => (
              <div key={i} className="glass-panel p-4 rounded-2xl border-white/5 flex items-center justify-between group hover:border-aeirmist-cyan/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-aeirmist-cyan text-[10px] font-black">
                    #{i + 1}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{action.replace('_', ' ')}</span>
                </div>
                <div className="text-[10px] font-black text-aeirmist-cyan">{count} RESONANCE</div>
              </div>
            ))}
            {insights.length === 0 && (
              <div className="p-12 text-center text-[10px] font-black uppercase tracking-widest text-white/10">No Messages Detected</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 pl-2">Recent transmissions</h4>
          <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
            {insights.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 opacity-60">
                <div className="p-2 rounded-lg bg-white/5">
                  <Zap size={12} className="text-white/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white truncate">{item.action.replace('_', ' ')}</p>
                  <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{new Date(item.timestamp).toLocaleTimeString()}</p>
                </div>
                <div className="text-[8px] font-black uppercase tracking-widest text-aeirmist-cyan opacity-40">{item.category}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
