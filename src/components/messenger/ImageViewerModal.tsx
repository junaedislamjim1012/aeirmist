import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, Download, RefreshCw, Heart, MessageCircle, Repeat } from 'lucide-react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ isOpen, onClose, imageUrl }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl"
          onClick={onClose}
        >
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={8}
            centerZoomedOut={true}
            wheel={{ step: 0.1 }}
          >
            {({ zoomIn, zoomOut, resetTransform, state }) => (
              <>
                {/* Action Bar (After view) */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50 bg-black/80 p-2 rounded-full backdrop-blur-xl border border-white/10"
                >
                   <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-full text-white text-xs font-bold">
                       <Heart size={16} /> React
                   </button>
                   <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-full text-white text-xs font-bold">
                       <MessageCircle size={16} /> Reply
                   </button>
                   <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-full text-white text-xs font-bold">
                       <Repeat size={16} /> Quote
                   </button>
                </motion.div>

                {/* Controls */}
                <div 
                  className="absolute top-4 right-4 md:right-8 flex items-center gap-2 z-50 bg-black/60 p-2 rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl"
                  onClick={e => e.stopPropagation()}
                >
                  <button onClick={() => zoomOut()} className="p-2.5 bg-white/5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors active:scale-95">
                    <ZoomOut size={18} />
                  </button>
                  <span className="text-[10px] font-black text-aeirmist-cyan w-10 text-center tracking-widest">{Math.round(state.scale * 100)}%</span>
                  <button onClick={() => zoomIn()} className="p-2.5 bg-white/5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors active:scale-95">
                    <ZoomIn size={18} />
                  </button>
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  <button onClick={() => resetTransform()} className="p-2.5 bg-white/5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors active:scale-95" title="Reset View">
                    <RefreshCw size={18} />
                  </button>
                  <a 
                    href={imageUrl} 
                    download 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2.5 bg-white/5 rounded-xl text-white/70 hover:text-aeirmist-cyan hover:bg-white/10 transition-colors active:scale-95"
                  >
                    <Download size={18} />
                  </a>
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  <button onClick={onClose} className="p-2.5 bg-red-500/20 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/30 transition-colors active:scale-95">
                    <X size={18} />
                  </button>
                </div>

                {/* Viewer Area */}
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden" onClick={e => e.stopPropagation()}>
                  <TransformComponent wrapperClass="w-full h-full !flex !items-center !justify-center" contentClass="!flex !items-center !justify-center min-w-full min-h-full">
                    <motion.img
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      src={imageUrl}
                      alt="Expanded format"
                      className="max-w-full max-h-[100dvh] object-contain select-none pointer-events-auto rounded-md md:rounded-xl shadow-2xl"
                      draggable={false}
                      onDoubleClick={() => resetTransform()}
                    />
                  </TransformComponent>
                </div>
              </>
            )}
          </TransformWrapper>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
