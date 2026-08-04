import React, { useState, useEffect } from 'react';
import { Play, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { motion, AnimatePresence } from 'motion/react';
import { SafeImage } from '../ui/SafeImage';

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

interface CollageProps {
  items: MediaItem[];
  fitMode?: 'contain' | 'cover';
  aspectRatioClassName?: string;
  onItemClick?: (idx: number) => void;
  renderLightboxSidebar?: () => React.ReactNode;
}

export const Collage: React.FC<CollageProps> = ({ items, fitMode = 'cover', onItemClick, renderLightboxSidebar }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isFirstImageLandscape, setIsFirstImageLandscape] = useState<boolean | null>(true);
  const hasSidebar = !!renderLightboxSidebar;

  useEffect(() => {
    if (items?.[0]?.url && items[0].type !== 'video') {
      const img = new Image();
      img.src = items[0].url;
      img.onload = () => {
        setIsFirstImageLandscape(img.width >= img.height);
      };
      img.onerror = () => {
        setIsFirstImageLandscape(true);
      };
    } else {
      setIsFirstImageLandscape(true);
    }
  }, [items?.[0]?.url, items?.[0]?.type]);

  useEffect(() => {
    if (!modalOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalOpen(false);
      } else if (e.key === 'ArrowLeft' && items.length > 1) {
        setActiveIdx(prev => (prev === 0 ? items.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight' && items.length > 1) {
        setActiveIdx(prev => (prev === items.length - 1 ? 0 : prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, items.length]);

  if (!items || items.length === 0) return null;

  const count = items.length;

  const handleThumbnailClick = (idx: number) => {
    setActiveIdx(idx);
    setModalOpen(true);
    if (onItemClick) onItemClick(idx);
  };

  const renderMediaCell = (item: MediaItem, idx: number, customClass: string = `w-full h-full ${fitMode === 'contain' ? 'object-contain bg-black/40' : 'object-cover object-center'}`) => {
    const isVideo = item.type === 'video';

    return (
      <div 
        key={idx} 
        onClick={() => handleThumbnailClick(idx)}
        className="relative w-full h-full overflow-hidden hover:opacity-95 transition-opacity cursor-pointer group bg-black/30"
      >
        {isVideo ? (
          <VideoPlayer src={item.url} className={customClass} useCache />
        ) : (
          <SafeImage 
            src={item.url} 
            alt="Media Cell" 
            className={`${customClass} transition-transform duration-[1.5s] group-hover:scale-105`} 
            referrerPolicy="no-referrer"
            useCache
          />
        )}
      </div>
    );
  };

  return (
    <div className="w-full relative overflow-hidden bg-black/20">
      {count === 1 ? (
        <div className="w-full h-full min-h-[280px] max-h-[580px] flex items-center justify-center bg-black/30">
          {renderMediaCell(items[0], 0, "w-full h-full object-contain bg-black/30 max-h-[580px]")}
        </div>
      ) : count === 2 ? (
        <div className="grid grid-cols-2 gap-1.5 h-[320px] sm:h-[400px]">
          {renderMediaCell(items[0], 0)}
          {renderMediaCell(items[1], 1)}
        </div>
      ) : count === 3 ? (
        isFirstImageLandscape !== false ? (
          /* Landscape 1st image: Top row full-width + Bottom row 2 columns */
          <div className="grid grid-rows-[1.25fr_1fr] gap-1.5 h-[380px] sm:h-[480px]">
            <div className="w-full h-full overflow-hidden">
              {renderMediaCell(items[0], 0)}
            </div>
            <div className="grid grid-cols-2 gap-1.5 h-full overflow-hidden">
              {renderMediaCell(items[1], 1)}
              {renderMediaCell(items[2], 2)}
            </div>
          </div>
        ) : (
          /* Portrait 1st image: Left column 1 photo + Right column 2 stacked rows */
          <div className="grid grid-cols-[1.1fr_1fr] gap-1.5 h-[360px] sm:h-[440px]">
            <div className="w-full h-full overflow-hidden">
              {renderMediaCell(items[0], 0)}
            </div>
            <div className="grid grid-rows-2 gap-1.5 h-full overflow-hidden">
              {renderMediaCell(items[1], 1)}
              {renderMediaCell(items[2], 2)}
            </div>
          </div>
        )
      ) : count === 4 ? (
        <div className="grid grid-cols-2 gap-1.5 h-[360px] sm:h-[440px]">
          {renderMediaCell(items[0], 0)}
          {renderMediaCell(items[1], 1)}
          {renderMediaCell(items[2], 2)}
          {renderMediaCell(items[3], 3)}
        </div>
      ) : (
        // 5 or more items
        <div className="grid grid-cols-6 gap-1.5 h-[360px] sm:h-[440px]">
          <div className="col-span-3 h-full">
            {renderMediaCell(items[0], 0)}
          </div>
          <div className="col-span-3 h-full">
            {renderMediaCell(items[1], 1)}
          </div>
          <div className="col-span-2 h-full">
            {renderMediaCell(items[2], 2)}
          </div>
          <div className="col-span-2 h-full">
            {renderMediaCell(items[3], 3)}
          </div>
          <div 
            onClick={() => handleThumbnailClick(4)}
            className="col-span-2 h-full relative cursor-pointer overflow-hidden group border border-white/5 bg-black/20"
          >
            {items[4].type === 'video' ? (
              <video src={items[4].url} className="w-full h-full object-cover object-center opacity-40 group-hover:scale-105 duration-[1s]" />
            ) : (
              <SafeImage 
                src={items[4].url} 
                alt="More preview" 
                className="w-full h-full object-cover object-center opacity-40 group-hover:scale-105 duration-[1s]" 
                useCache 
              />
            )}
            <div className="absolute inset-0 bg-[#020712]/75 flex flex-col items-center justify-center border-l border-white/5 backdrop-blur-[2px] shadow-inner">
              <span className="text-xl sm:text-2xl font-black font-display text-aeirmist-cyan drop-shadow-[0_0_12px_rgba(0,242,255,1)]">+{count - 4}</span>
              <span className="text-[7.5px] sm:text-[9px] font-black uppercase tracking-[0.25em] text-white/50 group-hover:text-white mt-1">More Items</span>
            </div>
          </div>
        </div>
      )}

      {/* Immersive Photo/Video Lightbox Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div 
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 select-none"
            onClick={() => setModalOpen(false)}
          >
            {/* Navigation Controls Layer - Highest Z-index */}
            <div className="absolute inset-0 z-[150] pointer-events-none">
              {/* Close Button - Top Right (as requested/standard) */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setModalOpen(false);
                }}
                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all shadow-2xl cursor-pointer active:scale-90 pointer-events-auto"
                title="Close"
              >
                <X size={28} strokeWidth={2.5} />
              </button>

              {/* Left Arrow Navigation - Screen Edge */}
              {items.length > 1 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIdx(prev => (prev === 0 ? items.length - 1 : prev - 1));
                  }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-black/40 hover:bg-black/80 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all shadow-xl cursor-pointer active:scale-95 group pointer-events-auto"
                  title="Previous"
                >
                  <ChevronLeft size={42} className="group-hover:-translate-x-1 transition-transform" />
                </button>
              )}

              {/* Right Arrow Navigation - Screen Edge */}
              {items.length > 1 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIdx(prev => (prev === items.length - 1 ? 0 : prev + 1));
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-black/40 hover:bg-black/80 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all shadow-xl cursor-pointer active:scale-95 group pointer-events-auto"
                  title="Next"
                >
                  <ChevronRight size={42} className="group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              {/* Dot Indicators */}
              {items.length > 1 && (
                <div 
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2.5 p-2.5 bg-black/40 backdrop-blur-md rounded-full border border-white/5 shadow-2xl pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {items.map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => setActiveIdx(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${i === activeIdx ? 'bg-aeirmist-cyan w-6' : 'bg-white/20 hover:bg-white/40 w-2'}`} 
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Main Content Layout */}
            <div className="w-full h-full relative flex items-center justify-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
              
              {/* Media Section - Truly Centered */}
              <div className="w-full h-full flex items-center justify-center bg-transparent overflow-hidden">
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={activeIdx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="w-full h-full flex items-center justify-center p-4 sm:p-20"
                  >
                    {items[activeIdx].type === 'video' ? (
                      <VideoPlayer 
                        src={items[activeIdx].url} 
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" 
                        useCache
                      />
                    ) : (
                      <SafeImage 
                        src={items[activeIdx].url} 
                        className="max-w-full max-h-full object-contain shadow-2xl select-none rounded-lg" 
                        alt={`Full View ${activeIdx + 1}`} 
                        referrerPolicy="no-referrer" 
                        useCache
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Sidebar Section - Modern Overlay Drawer (Only on Desktop) */}
              {hasSidebar && (
                <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[400px] xl:w-[450px] h-full bg-black/80 backdrop-blur-3xl border-l border-white/5 flex-col shadow-2xl z-[140] transform transition-transform duration-500 overflow-y-auto no-scrollbar">
                  {renderLightboxSidebar()}
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
