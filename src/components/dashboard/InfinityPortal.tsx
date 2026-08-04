import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Target, 
  Users, 
  Calendar, 
  BarChart3, 
  ChevronRight, 
  Crown, 
  CheckCircle2, 
  Award,
  ShieldCheck,
  TrendingUp,
  Star,
  Infinity as InfinityIcon,
  Play
} from 'lucide-react';
import { useAeirmist } from '../../context/AeirmistContext';
import { CreatorTier, TIER_CONFIG, TIER_THRESHOLDS } from '../../types/economy';

export const InfinityPortal: React.FC = () => {
  const { profile, account } = useAeirmist();

  // Mocking some stats if they don't exist in profile yet
  const stats = useMemo(() => {
    if (!profile) return null;
    
    // Calculate account age in days
    const createdDate = profile.createdAt ? new Date(profile.createdAt.seconds * 1000) : new Date();
    const ageDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      aeirmistPoints: profile.aeirmistLevel || profile.aeirmistPoints || 0,
      followers: Array.isArray(profile?.social?.followers) ? profile.social.followers.length : Math.max(0, profile?.followersCount || 0),
      accountAgeDays: ageDays,
      originalPosts: profile.postsCount || 0,
      contentViews: profile.totalViews || 0
    };
  }, [profile]);

  const currentTier = useMemo(() => {
    if (!stats) return CreatorTier.EXPLORER;
    
    // Check from highest to lowest
    if (stats.aeirmistPoints >= TIER_CONFIG[CreatorTier.INFINITY_ELITE].aeirmistPoints && 
        stats.followers >= TIER_CONFIG[CreatorTier.INFINITY_ELITE].followers && 
        stats.accountAgeDays >= TIER_CONFIG[CreatorTier.INFINITY_ELITE].accountAgeDays) {
      return CreatorTier.INFINITY_ELITE;
    }
    
    if (stats.aeirmistPoints >= TIER_CONFIG[CreatorTier.INFINITY_MEMBER].aeirmistPoints && 
        stats.followers >= TIER_CONFIG[CreatorTier.INFINITY_MEMBER].followers && 
        stats.accountAgeDays >= TIER_CONFIG[CreatorTier.INFINITY_MEMBER].accountAgeDays &&
        stats.originalPosts >= TIER_CONFIG[CreatorTier.INFINITY_MEMBER].originalPosts &&
        (stats.contentViews || 0) >= (TIER_CONFIG[CreatorTier.INFINITY_MEMBER].contentViews || 0)) {
      return CreatorTier.INFINITY_MEMBER;
    }

    if (stats.aeirmistPoints >= TIER_CONFIG[CreatorTier.VERIFIED_CREATOR].aeirmistPoints && 
        stats.followers >= TIER_CONFIG[CreatorTier.VERIFIED_CREATOR].followers) {
      return CreatorTier.VERIFIED_CREATOR;
    }

    if (stats.aeirmistPoints >= TIER_CONFIG[CreatorTier.CREATOR].aeirmistPoints && 
        stats.followers >= TIER_CONFIG[CreatorTier.CREATOR].followers) {
      return CreatorTier.CREATOR;
    }

    return CreatorTier.EXPLORER;
  }, [stats]);

  const nextTier = useMemo(() => {
    const tiers = [
      CreatorTier.EXPLORER,
      CreatorTier.CREATOR,
      CreatorTier.VERIFIED_CREATOR,
      CreatorTier.INFINITY_MEMBER,
      CreatorTier.INFINITY_ELITE
    ];
    const currentIndex = tiers.indexOf(currentTier);
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
  }, [currentTier]);

  if (!profile || !stats) return null;

  const isSetup = profile.isCreatorSetup || false;

  return (
    <div className={`flex-1 h-full overflow-y-auto no-scrollbar ${isSetup ? 'bg-[#01050a]' : 'bg-transparent'} text-white`}>
      {!isSetup ? (
        <div className="max-w-4xl mx-auto py-12 px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-[2.5rem] p-12 text-center space-y-8 backdrop-blur-3xl overflow-hidden relative"
          >
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-aeirmist-cyan/20 rounded-full blur-[100px]" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-aeirmist-magenta/20 rounded-full blur-[100px]" />
            
            <div className="relative z-10 flex flex-col items-center gap-6">
               <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-aeirmist-cyan to-aeirmist-magenta flex items-center justify-center text-white shadow-[0_0_40px_rgba(0,242,255,0.3)] anim-pulse">
                  <InfinityIcon size={40} />
               </div>
               <div className="space-y-2">
                  <h2 className="text-3xl font-black uppercase tracking-tight">Creator Matrix Setup</h2>
                  <p className="text-white/40 text-xs font-black uppercase tracking-[0.3em]">Initialize your professional activity</p>
               </div>
               
               <div className="max-w-md text-white/50 text-sm leading-relaxed">
                  Join the elite cluster of Aeirmist creators. Setting up your creator profile unlocks monetization frequency, advanced Analytics, and priority distribution across the platform.
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                     <ShieldCheck className="text-aeirmist-cyan" size={24} />
                     <h3 className="text-xs font-black uppercase text-white/80">Identity Shield</h3>
                     <p className="text-[10px] text-white/40">Verified activity badge and protected content handling across the subnets.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                     <TrendingUp className="text-aeirmist-magenta" size={24} />
                     <h3 className="text-xs font-black uppercase text-white/80">Alpha Revenue</h3>
                     <p className="text-[10px] text-white/40">Earn AEIRMIST tokens from frequency tips, ad activity, and premium subscriptions.</p>
                  </div>
               </div>

               <motion.button
                 whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0, 242, 255, 0.4)' }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => {
                   // Simulate setup completion
                   useAeirmist().updateProfile({ isCreatorSetup: true });
                 }}
                 className="mt-8 px-12 py-5 bg-aeirmist-cyan text-black font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl text-xs"
               >
                 Initialize Program
               </motion.button>
               
               <p className="text-[9px] text-white/20 uppercase tracking-widest pt-4">
                  By initializing, you agree to the Community guidelines & guidelines.
               </p>
            </div>
          </motion.div>
        </div>
      ) : (
        <>
          {/* Hero Header */}
          <div className="relative h-80 flex flex-col items-center justify-center p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-aeirmist-cyan/10 to-transparent pointer-events-none" />
            
            {/* Animated Background Elements */}
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute w-[600px] h-[600px] bg-aeirmist-magenta/5 rounded-full blur-[120px] -top-1/2" 
            />

            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="relative z-10 text-center space-y-4"
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <InfinityIcon className="text-aeirmist-cyan w-10 h-10" />
                <h1 className="text-4xl font-black uppercase tracking-tight">Infinity Portal</h1>
              </div>
              <p className="text-white/40 font-mono text-xs uppercase tracking-[0.4em]">Subnet Creator Economy Management</p>
              
              <div className="flex items-center justify-center gap-4 pt-6">
                <TierCard tier={currentTier} isCurrent />
                {nextTier && <TierCard tier={nextTier} isNext requirements={TIER_CONFIG[nextTier]} currentStats={stats} />}
              </div>
            </motion.div>
          </div>

          <div className="max-w-6xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-32">
            {/* Left Column: Progress & Stats */}
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                       <Target className="text-aeirmist-magenta" />
                       <h2 className="text-xl font-bold uppercase tracking-widest">Growth Metrics</h2>
                    </div>
                    <div className="px-4 py-1.5 bg-aeirmist-cyan/20 border border-aeirmist-cyan/40 rounded-full">
                       <span className="text-[10px] font-black text-aeirmist-cyan uppercase tracking-widest">Active Sync</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <StatProgress 
                      icon={<Zap size={18} />} 
                      label="Aeirmist Points" 
                      current={stats.aeirmistPoints} 
                      target={nextTier ? TIER_CONFIG[nextTier].aeirmistPoints : 1000000} 
                      color="aeirmist-cyan"
                    />
                    <StatProgress 
                      icon={<Users size={18} />} 
                      label="Followers" 
                      current={stats.followers} 
                      target={nextTier ? TIER_CONFIG[nextTier].followers : 100000} 
                      color="aeirmist-magenta"
                    />
                    <StatProgress 
                      icon={<BarChart3 size={18} />} 
                      label="Original Posts" 
                      current={stats.originalPosts} 
                      target={nextTier ? TIER_CONFIG[nextTier].originalPosts : 500} 
                      color="aeirmist-lime"
                    />
                    <StatProgress 
                      icon={<Calendar size={18} />} 
                      label="Account Age (Days)" 
                      current={stats.accountAgeDays} 
                      target={nextTier ? TIER_CONFIG[nextTier].accountAgeDays : 730} 
                      color="white"
                    />
                 </div>
              </section>

              <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
                 <div className="flex items-center gap-3 mb-8">
                    <Award className="text-aeirmist-cyan" />
                    <h2 className="text-xl font-bold uppercase tracking-widest">Tier Benefits</h2>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {TIER_THRESHOLDS.find(t => t.tier === currentTier)?.benefits.map((benefit, i) => (
                     <motion.div 
                       key={benefit}
                       initial={{ opacity: 0, x: -10 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: i * 0.1 }}
                       className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl"
                     >
                       <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-500">
                          <CheckCircle2 size={16} />
                       </div>
                       <span className="text-sm font-medium text-white/80">{benefit}</span>
                     </motion.div>
                   ))}
                 </div>
              </section>
            </div>

            {/* Right Column: Earnings & Tips */}
            <div className="space-y-8">
              <section className="bg-gradient-to-br from-aeirmist-magenta/10 to-transparent border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl">
                 <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="text-aeirmist-magenta" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Revenue Alpha</h3>
                 </div>
                 <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                       <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Unclaimed Tips</p>
                       <div className="flex items-center justify-between">
                          <span className="text-2xl font-black text-white">0.00 <span className="text-xs text-aeirmist-magenta">AEIRMIST</span></span>
                          <button className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase hover:bg-white/20 transition-all opacity-50 cursor-not-allowed">Sync Wait</button>
                       </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                       <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Ad Rev Share</p>
                       <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-white/20">LOCKED</span>
                          <ShieldCheck size={16} className="text-white/20" />
                       </div>
                    </div>
                 </div>
              </section>

              <section className="bg-white/5 border border-white/10 rounded-[2rem] p-6">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">Upcoming Challenges</h3>
                 <div className="space-y-3">
                    <ChallengeItem icon={<Play size={14} />} title="Viral Video" desc="Reach 10k views on a video" points="+2000" />
                    <ChallengeItem icon={<Star size={14} />} title="Elite Recruiter" desc="Get 10 followers" points="+1000" />
                 </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const TierCard = ({ tier, isCurrent, isNext, requirements, currentStats }: { tier: CreatorTier, isCurrent?: boolean, isNext?: boolean, requirements?: any, currentStats?: any }) => {
  const config = TIER_THRESHOLDS.find(t => t.tier === tier);
  if (!config) return null;

  return (
    <div className={`p-6 rounded-[2rem] border transition-all ${isCurrent ? 'bg-white/10 border-aeirmist-cyan shadow-[0_0_30px_rgba(0,242,255,0.2)]' : 'bg-black/40 border-white/10 opacity-60'}`}>
       <div className="flex items-center gap-3 mb-2">
          <Award className={isCurrent ? 'text-aeirmist-cyan' : 'text-white/40'} size={18} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${isCurrent ? 'text-aeirmist-cyan' : 'text-white/40'}`}>
            {isCurrent ? 'Current Status' : 'Next Milestone'}
          </span>
       </div>
       <h3 className="text-lg font-black uppercase tracking-tight mb-1">{tier}</h3>
       {isCurrent && <div className="text-[9px] font-bold text-green-500 uppercase flex items-center gap-1"><CheckCircle2 size={10} /> Active Member</div>}
    </div>
  );
};

const StatProgress = ({ icon, label, current, target, color }: { icon: any, label: string, current: number, target: number, color: string }) => {
  const progress = Math.min(100, (current / target) * 100);
  
  return (
    <div className="space-y-3">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/60">
             {icon}
             <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
          </div>
          <span className="text-[10px] font-mono text-white/40">{current.toLocaleString()} / {target.toLocaleString()}</span>
       </div>
       <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={`h-full relative overflow-hidden`}
            style={{ backgroundColor: color === 'aeirmist-cyan' ? '#00f2ff' : color === 'aeirmist-magenta' ? '#ff00ea' : color === 'aeirmist-lime' ? '#00ffaa' : '#ffffff' }}
          >
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </motion.div>
       </div>
    </div>
  );
};

const ChallengeItem = ({ icon, title, desc, points }: { icon: any, title: string, desc: string, points: string }) => (
  <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all cursor-pointer">
     <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-aeirmist-cyan">
           {icon}
        </div>
        <div>
           <h4 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h4>
           <p className="text-[10px] text-white/40">{desc}</p>
        </div>
     </div>
     <span className="text-[9px] font-black text-aeirmist-lime">{points}</span>
  </div>
);
