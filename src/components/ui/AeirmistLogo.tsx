import React from 'react';

interface AeirmistLogoProps {
  className?: string;
  glow?: boolean;
  glowStrength?: 'weak' | 'normal' | 'strong';
  variant?: 'compact' | 'full' | 'text-only';
  colorClass?: string;
}

export const AeirmistSymbol: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <defs>
      <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur1" />
        <feGaussianBlur stdDeviation="6" result="blur2" />
        <feMerge>
          <feMergeNode in="blur2" />
          <feMergeNode in="blur1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <linearGradient id="cyber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00BFFF" />
        <stop offset="50%" stopColor="#1E90FF" />
        <stop offset="100%" stopColor="#4169E1" />
      </linearGradient>
      <linearGradient id="inner-grad" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#00BFFF" />
      </linearGradient>
    </defs>
    
    {/* Outer Hexagon/Diamond structure */}
    <path d="M 50 10 L 85 30 L 85 70 L 50 90 L 15 70 L 15 30 Z" fill="none" stroke="url(#cyber-grad)" strokeWidth="4" strokeLinejoin="round" filter="url(#neon-glow)" />
    
    {/* Inner abstract 'A' */}
    <path d="M 50 25 L 70 75 M 50 25 L 30 75" fill="none" stroke="url(#inner-grad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" filter="url(#neon-glow)" />
    <path d="M 38 60 L 62 60" fill="none" stroke="url(#inner-grad)" strokeWidth="5" strokeLinecap="round" filter="url(#neon-glow)" />
    
    {/* Core dot */}
    <circle cx="50" cy="42" r="4" fill="#FFFFFF" filter="url(#neon-glow)" />
  </svg>
);

export const AeirmistLogo: React.FC<AeirmistLogoProps> = ({
  className = "w-auto h-[40px]",
  glow = true,
  glowStrength = 'normal',
  variant = 'full',
  colorClass = ""
}) => {
  const glowStyles = glow 
    ? glowStrength === 'strong'
      ? { filter: 'drop-shadow(0 0 15px rgba(0, 191, 255, 0.8))' }
      : glowStrength === 'weak'
        ? { filter: 'drop-shadow(0 0 5px rgba(0, 191, 255, 0.3))' }
        : { filter: 'drop-shadow(0 0 10px rgba(0, 191, 255, 0.5))' }
    : undefined;

  const textGlowStyles = glow 
    ? glowStrength === 'strong'
      ? { textShadow: '0 0 15px rgba(0, 191, 255, 0.9), 0 0 30px rgba(0, 191, 255, 0.4)' }
      : glowStrength === 'weak'
        ? { textShadow: '0 0 5px rgba(0, 191, 255, 0.4)' }
        : { textShadow: '0 0 8px rgba(0, 191, 255, 0.7), 0 0 15px rgba(0, 191, 255, 0.2)' }
    : undefined;

  const AeirmistText = (style: React.CSSProperties) => (
    <span
        className={`font-display tracking-[0.25em] font-normal text-base sm:text-lg uppercase whitespace-nowrap text-[#ccebff] ${colorClass}`}
        style={{ ...style, ...textGlowStyles }}
    >
      ΛEIRMIST
    </span>
  );

  if (variant === 'compact') {
    return (
      <AeirmistSymbol 
        className={`${className} transition-all duration-700 ease-in-out`}
        style={glowStyles}
      />
    );
  }

  if (variant === 'text-only') {
    return (
      <div className={`${className} flex items-center justify-center`}>
        {AeirmistText(glowStyles || {})}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <AeirmistSymbol 
        className="h-full w-auto select-none pointer-events-none shrink-0 transition-transform duration-500 hover:scale-110 hover:rotate-3"
        style={glowStyles}
      />
      <div className="flex items-center">
        {AeirmistText(glowStyles || {})}
      </div>
    </div>
  );
};
