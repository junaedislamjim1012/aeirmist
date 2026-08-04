import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  RotateCcw, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Check, 
  Maximize, 
  Minimize,
  RefreshCw,
  Crop as CropIcon,
  Eraser,
  Undo,
  Redo
} from 'lucide-react';

interface DigitalImageEditorProps {
  imageSrc: string;
  onSave: (editedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

export const DigitalImageEditor: React.FC<DigitalImageEditorProps> = ({ 
  imageSrc, 
  onSave, 
  onCancel,
  aspectRatio = 1 
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(Math.max(0.5, prev + delta), 3));
  };

  const handleRotate = (deg: number) => {
    setRotation(prev => (prev + deg) % 360);
  };

  const handleSave = async () => {
    if (!imageRef.current || !canvasRef.current) return;
    setIsProcessing(true);

    const canvas = canvasRef.current;
    const img = imageRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed output size for profiles
    const outputSize = 1024;
    canvas.width = outputSize;
    canvas.height = outputSize / aspectRatio;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    
    // Draw image centered
    const drawWidth = canvas.width;
    const drawHeight = (img.naturalHeight / img.naturalWidth) * drawWidth;
    ctx.drawImage(img, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
    
    ctx.restore();

    canvas.toBlob((blob) => {
      if (blob) {
        onSave(blob);
      }
      setIsProcessing(false);
    }, 'image/jpeg', 0.9);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1100] bg-black/95 backdrop-blur-2xl flex flex-col font-sans"
    >
      {/* Header */}
      <header className="p-6 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={onCancel} className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/60">
          <X size={24} />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-aeirmist-cyan">Image Editor</h2>
          <div className="flex items-center gap-1.5 mt-1">
             <div className="w-1 h-1 rounded-full bg-aeirmist-cyan animate-pulse" />
             <span className="text-[8px] font-bold text-aeirmist-cyan/60 uppercase">Processing Frequency...</span>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={isProcessing}
          className="px-6 py-2 rounded-xl bg-aeirmist-cyan text-black font-black uppercase tracking-widest text-[10px] hover:bg-white transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)] flex items-center gap-2"
        >
          {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
          Save
        </button>
      </header>

      {/* Workspace */}
      <div className="flex-1 relative flex items-center justify-center p-12 overflow-hidden" ref={containerRef}>
         <div className="relative w-full max-w-2xl aspect-square border-2 border-aeirmist-cyan/20 rounded-[3rem] overflow-hidden bg-white/[0.02] shadow-[0_0_100px_rgba(0,242,255,0.1)]">
            {/* Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20 flex">
               <div className="flex-1 border-r border-aeirmist-cyan/30" />
               <div className="flex-1 border-r border-aeirmist-cyan/30" />
            </div>
            <div className="absolute inset-0 pointer-events-none opacity-20 flex flex-col">
               <div className="flex-1 border-b border-aeirmist-cyan/30" />
               <div className="flex-1 border-b border-aeirmist-cyan/30" />
            </div>

            <motion.div 
              style={{ x: position.x, y: position.y, scale: zoom, rotate: rotation }}
              className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
            >
              <img 
                ref={imageRef}
                src={imageSrc} 
                className="max-w-full max-h-full object-contain" 
                alt="reconstruct" 
                draggable={false}
              />
            </motion.div>
         </div>

         {/* Corner Accents */}
         <div className="absolute top-20 left-20 w-8 h-8 border-t-2 border-l-2 border-aeirmist-cyan/40 rounded-tl-xl" />
         <div className="absolute top-20 right-20 w-8 h-8 border-t-2 border-r-2 border-aeirmist-cyan/40 rounded-tr-xl" />
         <div className="absolute bottom-20 left-20 w-8 h-8 border-b-2 border-l-2 border-aeirmist-cyan/40 rounded-bl-xl" />
         <div className="absolute bottom-20 right-20 w-8 h-8 border-b-2 border-r-2 border-aeirmist-cyan/40 rounded-br-xl" />
      </div>

      {/* Controls Bar */}
      <footer className="p-8 pb-[calc(2rem+var(--spacing-safe-bottom))] bg-gradient-to-t from-black/80 to-transparent">
         <div className="max-w-2xl mx-auto space-y-8">
            {/* Zoom Slider */}
            <div className="flex items-center gap-6">
               <button onClick={() => handleZoom(-0.1)} className="text-white/40 hover:text-aeirmist-cyan"><ZoomOut size={20}/></button>
               <div className="flex-1 h-1 bg-white/10 rounded-full relative">
                  <div className="absolute h-full bg-aeirmist-cyan rounded-full" style={{ width: `${((zoom - 0.5) / 2.5) * 100}%` }} />
                  <input 
                    type="range" 
                    min="0.5" 
                    max="3" 
                    step="0.01" 
                    value={zoom} 
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
               </div>
               <button onClick={() => handleZoom(0.1)} className="text-white/40 hover:text-aeirmist-cyan"><ZoomIn size={20}/></button>
            </div>

            {/* Actions Row */}
            <div className="flex justify-center items-center gap-8">
               <EditorAction icon={<RotateCcw />} label="L-90" onClick={() => handleRotate(-90)} />
               <EditorAction icon={<RotateCw />} label="R-90" onClick={() => handleRotate(90)} />
               <div className="w-px h-8 bg-white/10 mx-2" />
               <EditorAction icon={<Maximize />} label="Scale Up" onClick={() => handleZoom(0.2)} />
               <EditorAction icon={<Minimize />} label="Scale Down" onClick={() => handleZoom(-0.2)} />
               <div className="w-px h-8 bg-white/10 mx-2" />
               <EditorAction icon={<Undo />} label="Reset" onClick={() => { setZoom(1); setRotation(0); setPosition({x:0, y:0}); }} />
            </div>
         </div>
      </footer>

      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
};

const EditorAction = ({ icon, label, onClick }: any) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center gap-2 group"
  >
    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-white/40 group-hover:bg-aeirmist-cyan/10 group-hover:text-aeirmist-cyan group-hover:border-aeirmist-cyan/30 transition-all">
       {React.cloneElement(icon, { size: 20 })}
    </div>
    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-aeirmist-cyan transition-colors">{label}</span>
  </button>
);
