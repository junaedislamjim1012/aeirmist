import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../context/ThemeContext';

export const DynamicAesthetic: React.FC = () => {
  const { activeTheme } = useTheme();

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTheme.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {renderAtmosphere(activeTheme.atmosphere, activeTheme.primary, activeTheme.secondary)}
        </motion.div>
      </AnimatePresence>
      
      {/* Global Grain/Noise Overlay */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* Global Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
    </div>
  );
};

function renderAtmosphere(type: string, primary: string, secondary: string) {
  switch (type) {
    case 'neural':
      return (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-20" style={{ backgroundColor: primary }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-20" style={{ backgroundColor: secondary }} />
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]" />
          <DigitalLines color={primary} />
        </>
      );
    case 'grid':
      return (
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 opacity-20"
            style={{ 
              backgroundImage: `linear-gradient(${primary}22 1px, transparent 1px), linear-gradient(90deg, ${primary}22 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
              perspective: '1000px',
              transform: 'rotateX(60deg) translateY(-200px)',
              height: '200%'
            }}
          />
          <div className="absolute top-0 w-full h-[50dvh] bg-gradient-to-b from-black to-transparent" />
          <div className="absolute bottom-0 w-full h-[50dvh] bg-gradient-to-t from-black to-transparent" />
        </div>
      );
    case 'particles':
      return <Particles color={primary} />;
    case 'fog':
      return (
        <div className="absolute inset-0">
          <motion.div 
            animate={{ 
              x: [-100, 100, -100],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 blur-[100px]"
            style={{ backgroundImage: `radial-gradient(circle at 30% 40%, ${primary}44, transparent 50%)` }}
          />
          <motion.div 
            animate={{ 
              x: [100, -100, 100],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 blur-[100px]"
            style={{ backgroundImage: `radial-gradient(circle at 70% 60%, ${secondary}44, transparent 50%)` }}
          />
        </div>
      );
    case 'matrix':
      return <MatrixStream color={primary} />;
    case 'flare':
      return (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black" />
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[200px]"
            style={{ backgroundImage: `radial-gradient(circle, ${primary}66, ${secondary}22, transparent 60%)` }}
          />
          <FloatingEmbers color={primary} />
        </div>
      );
    case 'void':
      return (
        <div className="absolute inset-0 bg-black">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `radial-gradient(circle at 50% 50%, ${primary}33, transparent 70%)` }} />
          <div className="absolute inset-0 backdrop-blur-[100px]" />
          <Nebula color={primary} />
        </div>
      );
    case 'stars':
      return (
        <div className="absolute inset-0 bg-black">
          <Stars />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[150px] opacity-20" style={{ backgroundColor: secondary }} />
        </div>
      );
    case 'bio':
      return (
        <div className="absolute inset-0 bg-black">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `repeating-linear-gradient(45deg, ${primary}11 0, ${primary}11 1px, transparent 1px, transparent 10px)` }} />
          <div className="absolute top-0 left-0 w-full h-full opacity-30 blur-[100px]" style={{ backgroundImage: `radial-gradient(circle at center, ${primary}33, transparent 70%)` }} />
          <MessageCircles color={primary} />
        </div>
      );
    case 'minimal':
      return (
        <div className="absolute inset-0 bg-black">
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `linear-gradient(to right, ${primary} 1px, transparent 1px), linear-gradient(to bottom, ${primary} 1px, transparent 1px)`, backgroundSize: '100px 100px' }} />
        </div>
      );
    default:
      return null;
  }
}

const DigitalLines: React.FC<{ color: string }> = ({ color }) => (
  <svg className="absolute inset-0 w-full h-full opacity-20">
    <motion.path
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      d="M-50,200 Q200,50 400,200 T800,200 T1200,200"
      fill="none"
      stroke={color}
      strokeWidth="0.5"
    />
    <motion.path
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 2 }}
      d="M2000,500 Q1500,800 1000,500 T500,500 T-500,500"
      fill="none"
      stroke={color}
      strokeWidth="0.3"
    />
  </svg>
);

const MatrixStream: React.FC<{ color: string }> = ({ color }) => (
  <div className="absolute inset-0 flex justify-between px-12 opacity-20 pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ y: ['-100%', '200%'] }}
        transition={{ duration: 5 + Math.random() * 10, repeat: Infinity, ease: "linear", delay: Math.random() * 5 }}
        className="text-[10px] font-mono leading-none flex flex-col items-center"
        style={{ color }}
      >
        {[...Array(30)].map((_, j) => (
          <span key={j} className="opacity-40">{Math.random() > 0.5 ? '1' : '0'}</span>
        ))}
      </motion.div>
    ))}
  </div>
);

const Stars: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none">
    {[...Array(100)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: Math.random() }}
        animate={{ opacity: [0.1, 1, 0.1] }}
        transition={{ duration: 2 + Math.random() * 4, repeat: Infinity }}
        className="absolute w-[1px] h-[1px] bg-white rounded-full"
        style={{
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
        }}
      />
    ))}
  </div>
);

const FloatingEmbers: React.FC<{ color: string }> = ({ color }) => (
  <div className="absolute inset-0 pointer-events-none">
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ 
          y: [-20, -100 - Math.random() * 200],
          x: [0, (Math.random() - 0.5) * 100],
          opacity: [0, 1, 0]
        }}
        transition={{ duration: 5 + Math.random() * 10, repeat: Infinity, ease: "easeOut", delay: Math.random() * 10 }}
        className="absolute w-1 h-1 rounded-full blur-[1px]"
        style={{
          backgroundColor: color,
          bottom: '0%',
          left: `${Math.random() * 100}%`,
        }}
      />
    ))}
  </div>
);

const MessageCircles: React.FC<{ color: string }> = ({ color }) => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ 
          scale: [0.5, 2.5],
          opacity: [0.2, 0]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeOut", delay: i * 1.3 }}
        className="absolute w-[40dvh] h-[40dvh] rounded-full border border-dashed"
        style={{ borderColor: color, opacity: 0.1 }}
      />
    ))}
  </div>
);

const Particles: React.FC<{ color: string }> = ({ color }) => (
  <div className="absolute inset-0 pointer-events-none">
    {[...Array(50)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ 
          x: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
          y: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
          opacity: [0.1, 0.3, 0.1]
        }}
        transition={{ duration: 10 + Math.random() * 20, repeat: Infinity, ease: "linear" }}
        className="absolute w-1.5 h-1.5 rounded-full blur-[2px]"
        style={{ backgroundColor: color }}
      />
    ))}
  </div>
);

const Nebula: React.FC<{ color: string }> = ({ color }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] opacity-20 blur-[100px]"
      style={{ backgroundImage: `conic-gradient(from 0deg, transparent, ${color}33, transparent, ${color}22, transparent)` }}
    />
  </div>
);
