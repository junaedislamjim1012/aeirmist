import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface MediaPreviewProps {
  previews: { url: string; type: string }[];
  onRemove: (idx: number) => void;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({ previews, onRemove }) => {
  const [currentIdx, setCurrentIdx] = useState(0);

  const next = () => setCurrentIdx((prev) => (prev + 1) % previews.length);
  const prev = () => setCurrentIdx((prev) => (prev - 1 + previews.length) % previews.length);

  return (
    <div className="relative w-full aspect-square bg-black border border-white/10 rounded-2xl overflow-hidden group">
      <AnimatePresence mode="wait">
        <motion.div
          key={previews[currentIdx].url}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {previews[currentIdx].type.startsWith('video/') ? (
            <video src={previews[currentIdx].url} className="w-full h-full object-contain" controls />
          ) : (
            <img src={previews[currentIdx].url} className="w-full h-full object-contain" alt="Preview" />
          )}
        </motion.div>
      </AnimatePresence>

      <button 
        onClick={() => onRemove(currentIdx)}
        className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/80 text-white z-10"
      >
        <X size={16} />
      </button>

      {previews.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 rounded-full text-white z-10"><ChevronLeft /></button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 rounded-full text-white z-10"><ChevronRight /></button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/50 rounded-full text-white text-xs z-10">
            {currentIdx + 1} / {previews.length}
          </div>
        </>
      )}
    </div>
  );
};
