import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { fadeTransition } from '../../lib/motion';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fadeTransition}
      className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-sm mx-auto"
    >
      <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.02)]">
        <div className="text-white/40 scale-150">
          {icon}
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
        {title}
      </h3>
      
      <p className="text-sm text-white/50 mb-8 leading-relaxed">
        {description}
      </p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 rounded-full bg-aeirmist-cyan text-black text-xs font-black uppercase tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,242,255,0.3)]"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
};
