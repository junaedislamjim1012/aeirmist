import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft } from 'lucide-react';

export const ComposerModal = ({ children, onClose, title }: { children: React.ReactNode, onClose: () => void, title: string }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#06080d] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
            <button onClick={onClose} className="text-white/60 hover:text-white text-xs font-bold uppercase">Cancel</button>
            <h2 className="text-white font-black text-sm uppercase">{title}</h2>
            <div className="flex gap-4">
              <button className="text-white/40 hover:text-white text-xs font-bold uppercase">Draft</button>
              <button className="text-[#00f3ff] font-bold text-xs uppercase">Next</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
