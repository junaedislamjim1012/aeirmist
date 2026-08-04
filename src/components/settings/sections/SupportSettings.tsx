import React from 'react';
import { motion } from 'motion/react';
import { 
  LifeBuoy, 
  MessageCircle, 
  BookOpen, 
  Search, 
  FileText, 
  Shield, 
  Terminal,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { useAeirmist } from '../../../context/AeirmistContext';

const SupportSettings = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      <div className="space-y-1">
        <h2 className="text-3xl font-display font-bold text-white">System Support</h2>
        <p className="text-xs text-white/45 uppercase tracking-widest font-medium">Access technical documentation and human intervention channels</p>
      </div>

      {/* Help Search */}
      <div className="relative">
        <input 
          type="text" 
          placeholder="Search documentation, guides, or protocols..." 
          className="w-full h-14 pl-12 pr-6 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-mono text-white placeholder:text-white/20 focus:border-aeirmist-cyan/40 focus:bg-white/[0.05] outline-none transition-all shadow-2xl"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
      </div>

      {/* Support Channels */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SupportChannel 
          icon={<MessageCircle className="text-aeirmist-cyan" />}
          title="Direct Intervention"
          desc="Initiate a secure chat link with a support node"
          action="Start Chat"
        />
        <SupportChannel 
          icon={<BookOpen className="text-aeirmist-magenta" />}
          title="Knowledge Matrix"
          desc="Browse comprehensive technical documentation"
          action="Open Guides"
        />
      </section>

      {/* Common Topics */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
            <HelpCircle size={18} />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/80">Calibration Topics</h3>
        </div>

        <div className="space-y-2">
          <HelpTopic title="Resetting your encryption keys" category="Security" />
          <HelpTopic title="Calibrating haptic feedback" category="Interface" />
          <HelpTopic title="Account ownership transfer protocols" category="Legal" />
          <HelpTopic title="Optimizing sonic transmission quality" category="Technical" />
        </div>
      </section>

      {/* Community & Status */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-aeirmist-cyan/10 flex items-center justify-center text-aeirmist-cyan">
              <Terminal size={20} />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">System Status</h4>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-aeirmist-lime animate-pulse shadow-[0_0_8px_rgba(181,255,0,0.6)]" />
            <span className="text-[10px] font-bold text-aeirmist-lime uppercase tracking-widest">All Cores Nominal</span>
          </div>
          <p className="text-[10px] text-white/30 leading-relaxed">
            Global network latency is 24ms. All encryption modules are operating within safety parameters.
          </p>
        </div>

        <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-aeirmist-magenta/10 flex items-center justify-center text-aeirmist-magenta">
              <MessageSquare size={20} />
            </div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Node Community</h4>
          </div>
          <p className="text-[10px] text-white/30 leading-relaxed">
            Join the conversation with other nodes in the developer and community channels.
          </p>
          <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-aeirmist-magenta hover:text-white transition-colors">
            Discord Server <ExternalLink size={12} />
          </button>
        </div>
      </section>
    </motion.div>
  );
};

const SupportChannel = ({ icon, title, desc, action }: any) => (
  <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between h-48 group">
    <div>
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 transition-all group-hover:scale-110">
        {icon}
      </div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-white">{title}</h4>
      <p className="text-[10px] text-white/30 mt-1 leading-relaxed">{desc}</p>
    </div>
    <button className="text-[10px] font-black uppercase tracking-widest text-aeirmist-cyan flex items-center gap-2 mt-4">
      {action} <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
    </button>
  </div>
);

const HelpTopic = ({ title, category }: any) => (
  <button className="w-full p-4 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 flex items-center justify-between transition-all group text-left">
    <div className="flex items-center gap-4">
      <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
        <span className="text-[8px] font-bold text-white/40 uppercase tracking-tighter">{category}</span>
      </div>
      <span className="text-xs font-bold text-white/70 group-hover:text-white transition-colors">{title}</span>
    </div>
    <ChevronRight size={14} className="text-white/20 group-hover:text-white transition-all" />
  </button>
);

export default SupportSettings;
