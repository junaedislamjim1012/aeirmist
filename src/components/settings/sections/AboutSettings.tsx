import React from 'react';
import { motion } from 'motion/react';
import { 
  Info, 
  Shield, 
  Github, 
  Twitter, 
  Globe, 
  Heart, 
  Code2, 
  Fingerprint, 
  Server,
  Zap,
  Layers
} from 'lucide-react';
import { useAeirmist } from '../../../context/AeirmistContext';

const AboutSettings = () => {
  const version = "2.8.4";
  const build = "Production";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      <div className="space-y-1">
        <h2 className="text-3xl font-display font-bold text-white">About System</h2>
        <p className="text-xs text-white/45 uppercase tracking-widest font-medium">Platform architecture, vision, and legal frameworks</p>
      </div>

      {/* Hero Brand Section */}
      <div className="flex flex-col items-center justify-center p-12 rounded-[3rem] bg-white/[0.02] border border-white/10 text-center space-y-6 relative overflow-hidden">
        <div className="w-24 h-24 rounded-[2.5rem] bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl relative z-10">
          <Zap size={48} className="text-aeirmist-cyan" />
        </div>
        <div className="space-y-2 relative z-10">
          <h1 className="text-4xl font-display font-black text-white uppercase tracking-tighter">Aeirmist</h1>
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.5em]">Global Social & Workspace Ecosystem</p>
        </div>
      </div>

      {/* Version Info */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <Layers size={18} className="text-aeirmist-cyan" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">App Version</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-mono font-bold text-white">{version}</span>
            <span className="text-[9px] font-mono text-white/20 uppercase">{build}</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <Server size={18} className="text-aeirmist-magenta" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">Server Status</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-aeirmist-lime animate-pulse" />
            <span className="text-lg font-mono font-bold text-aeirmist-lime uppercase tracking-widest">Operational</span>
          </div>
        </div>
      </section>

      {/* Legal & Compliance */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
            <Shield size={18} />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/80">Legal & Policies</h3>
        </div>

        <div className="space-y-3">
          <LegalLink title="Terms of Service" desc="Rights and responsibilities for platform users" />
          <LegalLink title="Privacy Policy" desc="How we protect and handle your personal data" />
          <LegalLink title="Cookie Policy" desc="Local storage and session caching details" />
          <LegalLink title="Content Licensing" desc="Intellectual property and digital asset guidelines" />
        </div>
      </section>

      {/* Credits & Mission */}
      <section className="space-y-8">
        <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6">
          <div className="flex items-center gap-3">
            <Heart size={20} className="text-aeirmist-magenta" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Our Vision</h3>
          </div>
          <p className="text-xs text-white/50 leading-relaxed max-w-2xl italic">
            "Aeirmist was designed to bring people together through elegant communication, seamless media sharing, and modern workspace tools built with privacy and simplicity at the core."
          </p>
          <div className="flex items-center gap-4 pt-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/65 hover:text-aeirmist-cyan transition-colors cursor-pointer"><Github size={18} /></div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/65 hover:text-white transition-colors cursor-pointer"><Twitter size={18} /></div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/65 hover:text-aeirmist-lime transition-colors cursor-pointer"><Globe size={18} /></div>
          </div>
        </div>
      </section>

      <div className="text-center pt-8">
        <p className="text-[10px] text-white/10 uppercase tracking-[0.5em] font-bold">Aeirmist Global • 2026</p>
      </div>
    </motion.div>
  );
};

const LegalLink = ({ title, desc }: any) => (
  <button className="w-full p-5 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 flex items-center justify-between transition-all group text-left">
    <div>
      <div className="text-xs font-bold text-white group-hover:text-aeirmist-cyan transition-colors">{title}</div>
      <div className="text-[10px] text-white/30 mt-0.5">{desc}</div>
    </div>
    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white/60 transition-all">
      <Info size={14} />
    </div>
  </button>
);

export default AboutSettings;
