import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Infinity as InfinityIcon, 
  Crown, 
  Award, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { CreatorTier } from '../../types/economy';
import { getRankInfo } from '../../lib/aeirmistRanks';

interface AeirmistRankBadgeProps {
  score: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

export const AeirmistRankBadge: React.FC<AeirmistRankBadgeProps> = ({ score, size = 'md', showLabel = false }) => {
  const rankInfo = getRankInfo(score);
  
  // Custom design specs based on Rank
  const getBadgeConfig = (rankName: string) => {
    switch (rankName) {
      case CreatorTier.INFINITY_ELITE:
        return {
          icon: Crown,
          borderStyle: 'border-double border-4 border-t-aeirmist-magenta border-r-aeirmist-cyan border-b-aeirmist-magenta border-l-aeirmist-cyan animate-[spin_10s_linear_infinite]',
          shape: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', // Hexagon
          glowStyle: 'shadow-[0_0_20px_#ff00ea]',
          crestName: 'Aeirmist Infinity Elite',
          desc: 'Top Contributor'
        };
      case CreatorTier.INFINITY_MEMBER:
        return {
          icon: InfinityIcon,
          borderStyle: 'border-2 border-aeirmist-cyan animate-[pulse_3s_infinite]',
          shape: 'polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)', // Heptagon
          glowStyle: 'shadow-[0_0_15px_#00f2ff]',
          crestName: 'Aeirmist Infinity',
          desc: 'Infinite Cycle'
        };
      case CreatorTier.VERIFIED_CREATOR:
        return {
          icon: ShieldCheck,
          borderStyle: 'border border-aeirmist-lime animate-[pulse_5s_infinite]',
          shape: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)', // Octagon
          glowStyle: 'shadow-[0_0_12px_#00ffaa]',
          crestName: 'Verified Creator',
          desc: 'Authenticated Creative Node'
        };
      case CreatorTier.CREATOR:
        return {
          icon: Award,
          borderStyle: 'border border-purple-500',
          shape: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
          glowStyle: 'shadow-[0_0_10px_#aa00ff]',
          crestName: 'Verified Creator',
          desc: 'Active Content Architect'
        };
      case CreatorTier.EXPLORER:
      default:
        return {
          icon: Zap,
          borderStyle: 'border border-white/20',
          shape: 'polygon(50% 0%, 100% 100%, 0% 100%)', // Triangle
          glowStyle: 'shadow-none',
          crestName: 'Aeirmist Explorer',
          desc: 'Baseline Grid Navigator'
        };
    }
  };

  const badge = getBadgeConfig(rankInfo.rank);
  const IconComponent = badge.icon;

  // Sizes conversion
  const dims = {
    xs: { container: 'w-6 h-6', icon: 10, text: 'text-[6px]' },
    sm: { container: 'w-8 h-8', icon: 12, text: 'text-[7px]' },
    md: { container: 'w-12 h-12', icon: 18, text: 'text-[9px]' },
    lg: { container: 'w-16 h-16', icon: 24, text: 'text-[11px]' },
    xl: { container: 'w-24 h-24', icon: 34, text: 'text-[13px]' }
  }[size];

  return (
    <div className="flex flex-col items-center gap-1.5 font-sans select-none">
      <div 
        className={`relative ${dims.container} flex items-center justify-center`}
        title={`${rankInfo.rank}: ${badge.crestName}`}
      >
        {/* Glowing holographic back-shield (upgrade visual) */}
        <div 
          className="absolute inset-0 rounded-full blur-xl opacity-35 transition-opacity"
          style={{ 
            backgroundColor: rankInfo.color,
            filter: 'blur(10px)'
          }}
        />

        {/* Dynamic customized physical crest outline shape with animation */}
        <div 
          className={`absolute inset-0 ${badge.borderStyle}`} 
          style={{ 
            clipPath: badge.shape,
            borderColor: rankInfo.color,
            boxShadow: `0 0 15px ${rankInfo.color}33`
          }}
        />

        {/* Dynamic icon within crest */}
        <motion.div 
          whileHover={{ scale: 1.12, rotate: 10 }}
          className="relative z-10 flex items-center justify-center"
        >
          <IconComponent 
            size={dims.icon} 
            style={{ color: rankInfo.color }} 
            className="drop-shadow-[0_0_8px_currentColor]"
          />
        </motion.div>

        {/* Floating sparkles animation for high elements */}
        {score >= 15000 && (
          <div className="absolute -top-1 -right-1 z-20 text-yellow-400 animate-pulse">
            <Sparkles size={10} />
          </div>
        )}
      </div>

      {showLabel && (
        <div className="text-center">
          <p className="font-mono text-[8px] font-black tracking-widest uppercase text-white/40">NODE CLASS</p>
          <p className="text-[10px] font-black tracking-wider uppercase mt-0.5" style={{ color: rankInfo.color }}>
            {rankInfo.rank}
          </p>
        </div>
      )}
    </div>
  );
};
