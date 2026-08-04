import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Sliders, RotateCw, RefreshCw, ZoomIn, Crop as CropIcon, Maximize2,
  Sun, Contrast as ContrastIcon, Droplet, Sparkles, AlertCircle, 
  Play, Pause, Volume2, VolumeX, FastForward, Undo, Redo
} from 'lucide-react';

interface MediaFile {
  url: string;
  type: string;
  name: string;
  // Non-destructive edit state
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  blur: number;
  vignette: number;
  rotate: number;
  flipX: boolean;
  flipY: boolean;
  fitMode: 'contain' | 'cover';
  cropRatio: string; // 'original' | '1:1' | '4:5' | '16:9'
  // Video-specific states
  muted: boolean;
  volume: number;
  speed: number;
  loop: boolean;
  coverTime: number;
}

interface MediaEditorProps {
  file: MediaFile;
  onChange: (updated: MediaFile) => void;
}

export const MediaEditor = React.memo<MediaEditorProps>(({ file, onChange }) => {
  const [activeTab, setActiveTab] = useState<'adjust' | 'crop' | 'video'>('adjust');
  const [history, setHistory] = useState<Omit<MediaFile, 'url' | 'type' | 'name'>[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize history
  useEffect(() => {
    if (history.length === 0) {
      const state = { ...file };
      delete (state as any).url;
      delete (state as any).type;
      delete (state as any).name;
      setHistory([state]);
      setHistoryIndex(0);
    }
  }, []);

  const pushState = (newState: MediaFile) => {
    const minState = { ...newState };
    delete (minState as any).url;
    delete (minState as any).type;
    delete (minState as any).name;

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(minState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onChange(newState);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      const prevState = history[prevIdx];
      onChange({ ...file, ...prevState });
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      const nextState = history[nextIdx];
      onChange({ ...file, ...nextState });
    }
  };

  const resetEdits = () => {
    const defaultState: MediaFile = {
      ...file,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      warmth: 0,
      blur: 0,
      vignette: 0,
      rotate: 0,
      flipX: false,
      flipY: false,
      fitMode: 'contain',
      cropRatio: 'original',
      muted: false,
      volume: 80,
      speed: 1,
      loop: true,
      coverTime: 0
    };
    pushState(defaultState);
  };

  const isVideo = file.type.startsWith('video/');

  const handleSliderChange = (field: keyof MediaFile, val: any) => {
    const updated = { ...file, [field]: val };
    onChange(updated); // Live feedback in preview
  };

  const handleSliderRelease = () => {
    pushState(file); // Save checkpoint to history on release
  };

  // Build the CSS filter string
  const filterStyle = useMemo(() => {
    const b = file.brightness ?? 100;
    const c = file.contrast ?? 100;
    const s = file.saturation ?? 100;
    const bl = file.blur ?? 0;
    const w = file.warmth ?? 0;
    
    return {
      filter: `brightness(${b}%) contrast(${c}%) saturate(${s}%) blur(${bl}px) hue-rotate(${w}deg)`,
      transform: `rotate(${file.rotate ?? 0}deg) scaleX(${file.flipX ? -1 : 1}) scaleY(${file.flipY ? -1 : 1})`,
      transition: 'filter 0.1s ease-out'
    };
  }, [file.brightness, file.contrast, file.saturation, file.blur, file.warmth, file.rotate, file.flipX, file.flipY]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full bg-black/40 border border-white/5 rounded-3xl p-6">
      {/* LEFT: Live Interactive Preview */}
      <div className="flex-1 flex flex-col justify-between items-center gap-4 bg-black/50 border border-white/10 rounded-2xl p-4 min-h-[320px] relative overflow-hidden group">
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          <button 
            disabled={historyIndex <= 0}
            onClick={undo}
            className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg disabled:opacity-30 transition-all"
            title="Undo"
          >
            <Undo size={14} />
          </button>
          <button 
            disabled={historyIndex >= history.length - 1}
            onClick={redo}
            className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg disabled:opacity-30 transition-all"
            title="Redo"
          >
            <Redo size={14} />
          </button>
          <button 
            onClick={resetEdits}
            className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg hover:text-red-400 transition-all"
            title="Reset All Adjustments"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="w-full flex-1 flex items-center justify-center relative select-none overflow-hidden">
          {/* Crop Ratio Framer container */}
          <div 
            className="relative flex items-center justify-center overflow-hidden border border-white/10 max-h-[360px]"
            style={{
              aspectRatio: file.cropRatio === 'original' ? 'auto' : file.cropRatio === '1:1' ? '1/1' : file.cropRatio === '4:5' ? '4/5' : '16/9',
              width: file.cropRatio === 'original' ? '100%' : 'auto',
              height: file.cropRatio === 'original' ? 'auto' : '100%',
              maxWidth: '100%'
            }}
          >
            {isVideo ? (
              <video 
                src={file.url} 
                className={`max-h-[360px] w-full h-full ${file.fitMode === 'cover' ? 'object-cover' : 'object-contain'}`} 
                style={filterStyle}
                controls
                muted={file.muted}
                loop={file.loop}
                autoPlay
              />
            ) : (
              <img 
                src={file.url} 
                className={`max-h-[360px] w-full h-full ${file.fitMode === 'cover' ? 'object-cover' : 'object-contain'}`} 
                style={filterStyle} 
                alt="Preview Canvas" 
              />
            )}

            {/* Vignette Simulation Layer */}
            {file.vignette > 0 && (
              <div 
                className="absolute inset-0 pointer-events-none" 
                style={{
                  background: `radial-gradient(circle, transparent ${100 - file.vignette}%, rgba(0,0,0,${file.vignette / 100}) 100%)`
                }}
              />
            )}
          </div>
        </div>

        <div className="text-[10px] font-mono text-white/40 truncate w-full text-center">
          {file.name} • {isVideo ? 'VIDEO FORMAT' : 'PHOTO FORMAT'}
        </div>
      </div>

      {/* RIGHT: Editor Sliders and Toolboxes */}
      <div className="w-full lg:w-[320px] flex flex-col justify-start space-y-6">
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
          <button 
            onClick={() => setActiveTab('adjust')} 
            className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${activeTab === 'adjust' ? 'bg-[#00f3ff] text-black shadow-lg' : 'text-white/60 hover:text-white'}`}
          >
            Adjust
          </button>
          <button 
            onClick={() => setActiveTab('crop')} 
            className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${activeTab === 'crop' ? 'bg-[#00f3ff] text-black shadow-lg' : 'text-white/60 hover:text-white'}`}
          >
            Crop
          </button>
          {isVideo && (
            <button 
              onClick={() => setActiveTab('video')} 
              className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${activeTab === 'video' ? 'bg-[#00f3ff] text-black shadow-lg' : 'text-white/60 hover:text-white'}`}
            >
              Video
            </button>
          )}
        </div>

        {activeTab === 'adjust' && (
          <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
            {/* Brightness */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Sun size={12}/> Brightness</span>
                <span className="text-[#00f3ff] font-mono">{file.brightness ?? 100}%</span>
              </div>
              <input 
                type="range" 
                min={50} 
                max={150} 
                value={file.brightness ?? 100}
                onChange={(e) => handleSliderChange('brightness', Number(e.target.value))}
                onMouseUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
                className="w-full accent-[#00f3ff] bg-white/10 h-1.5 rounded-lg"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><ContrastIcon size={12}/> Contrast</span>
                <span className="text-[#00f3ff] font-mono">{file.contrast ?? 100}%</span>
              </div>
              <input 
                type="range" 
                min={50} 
                max={150} 
                value={file.contrast ?? 100}
                onChange={(e) => handleSliderChange('contrast', Number(e.target.value))}
                onMouseUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
                className="w-full accent-[#00f3ff] bg-white/10 h-1.5 rounded-lg"
              />
            </div>

            {/* Saturation */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Droplet size={12}/> Saturation</span>
                <span className="text-[#00f3ff] font-mono">{file.saturation ?? 100}%</span>
              </div>
              <input 
                type="range" 
                min={0} 
                max={200} 
                value={file.saturation ?? 100}
                onChange={(e) => handleSliderChange('saturation', Number(e.target.value))}
                onMouseUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
                className="w-full accent-[#00f3ff] bg-white/10 h-1.5 rounded-lg"
              />
            </div>

            {/* Warmth (hue-rotate) */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Sparkles size={12}/> Warmth</span>
                <span className="text-[#00f3ff] font-mono">{file.warmth ?? 0}°</span>
              </div>
              <input 
                type="range" 
                min={-90} 
                max={90} 
                value={file.warmth ?? 0}
                onChange={(e) => handleSliderChange('warmth', Number(e.target.value))}
                onMouseUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
                className="w-full accent-[#00f3ff] bg-white/10 h-1.5 rounded-lg"
              />
            </div>

            {/* Blur */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase tracking-widest">
                <span>Blur Intensity</span>
                <span className="text-[#00f3ff] font-mono">{file.blur ?? 0}px</span>
              </div>
              <input 
                type="range" 
                min={0} 
                max={20} 
                value={file.blur ?? 0}
                onChange={(e) => handleSliderChange('blur', Number(e.target.value))}
                onMouseUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
                className="w-full accent-[#00f3ff] bg-white/10 h-1.5 rounded-lg"
              />
            </div>

            {/* Vignette */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase tracking-widest">
                <span>Vignette Edge</span>
                <span className="text-[#00f3ff] font-mono">{file.vignette ?? 0}%</span>
              </div>
              <input 
                type="range" 
                min={0} 
                max={100} 
                value={file.vignette ?? 0}
                onChange={(e) => handleSliderChange('vignette', Number(e.target.value))}
                onMouseUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
                className="w-full accent-[#00f3ff] bg-white/10 h-1.5 rounded-lg"
              />
            </div>
          </div>
        )}

        {activeTab === 'crop' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Orientation & Transforms</label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => {
                    const rot = ((file.rotate ?? 0) + 90) % 360;
                    handleSliderChange('rotate', rot);
                    pushState({ ...file, rotate: rot });
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-white text-xs"
                >
                  <RotateCw size={16} className="text-[#00f3ff]" />
                  <span>90° Right</span>
                </button>
                <button 
                  onClick={() => {
                    handleSliderChange('flipX', !file.flipX);
                    pushState({ ...file, flipX: !file.flipX });
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-white text-xs"
                >
                  <Sliders size={16} className="text-[#00f3ff] rotate-90" />
                  <span>Flip Horiz</span>
                </button>
                <button 
                  onClick={() => {
                    handleSliderChange('flipY', !file.flipY);
                    pushState({ ...file, flipY: !file.flipY });
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-white text-xs"
                >
                  <Sliders size={16} className="text-[#00f3ff]" />
                  <span>Flip Vert</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Fit Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    handleSliderChange('fitMode', 'contain');
                    pushState({ ...file, fitMode: 'contain' });
                  }}
                  className={`p-3 rounded-xl border text-xs text-left font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${file.fitMode === 'contain' || !file.fitMode ? 'bg-[#00f3ff]/10 border-[#00f3ff] text-[#00f3ff]' : 'bg-white/5 border-white/5 hover:border-white/10 text-white/60'}`}
                >
                  <Maximize2 size={14} />
                  <span>Contain</span>
                </button>
                <button
                  onClick={() => {
                    handleSliderChange('fitMode', 'cover');
                    pushState({ ...file, fitMode: 'cover' });
                  }}
                  className={`p-3 rounded-xl border text-xs text-left font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${file.fitMode === 'cover' ? 'bg-[#00f3ff]/10 border-[#00f3ff] text-[#00f3ff]' : 'bg-white/5 border-white/5 hover:border-white/10 text-white/60'}`}
                >
                  <CropIcon size={14} />
                  <span>Cover</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Aspect Ratio Crop</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Original', ratio: 'original' },
                  { label: 'Square (1:1)', ratio: '1:1' },
                  { label: 'Portrait (4:5)', ratio: '4:5' },
                  { label: 'Widescreen (16:9)', ratio: '16:9' }
                ].map(item => (
                  <button
                    key={item.ratio}
                    onClick={() => {
                      handleSliderChange('cropRatio', item.ratio);
                      pushState({ ...file, cropRatio: item.ratio });
                    }}
                    className={`p-3 rounded-xl border text-xs text-left font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${file.cropRatio === item.ratio ? 'bg-[#00f3ff]/10 border-[#00f3ff] text-[#00f3ff]' : 'bg-white/5 border-white/5 hover:border-white/10 text-white/60'}`}
                  >
                    <CropIcon size={14} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'video' && isVideo && (
          <div className="space-y-5">
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
              <span className="text-xs text-white/80 font-bold flex items-center gap-2">
                {file.muted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} className="text-[#00f3ff]" />}
                <span>Volume controls</span>
              </span>
              <button 
                onClick={() => {
                  handleSliderChange('muted', !file.muted);
                  pushState({ ...file, muted: !file.muted });
                }}
                className={`px-3 py-1 rounded text-[10px] uppercase font-black tracking-widest ${file.muted ? 'bg-red-400 text-black' : 'bg-[#00f3ff] text-black'}`}
              >
                {file.muted ? 'Unmute' : 'Mute'}
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Playback Speed</label>
              <div className="grid grid-cols-4 gap-1">
                {[0.5, 1, 1.5, 2].map(speed => (
                  <button
                    key={speed}
                    onClick={() => {
                      handleSliderChange('speed', speed);
                      pushState({ ...file, speed });
                    }}
                    className={`py-2 rounded-lg border text-xs font-mono font-bold transition-all ${file.speed === speed ? 'bg-[#00f3ff]/10 border-[#00f3ff] text-[#00f3ff]' : 'bg-white/5 border-white/5 text-white/50'}`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
              <span className="text-xs text-white/80 font-bold">Auto Loop Preview</span>
              <button 
                onClick={() => {
                  handleSliderChange('loop', !file.loop);
                  pushState({ ...file, loop: !file.loop });
                }}
                className={`w-10 h-5 rounded-full p-1 transition-all ${file.loop ? 'bg-[#00f3ff]' : 'bg-white/10'}`}
              >
                <div className={`w-3 h-3 rounded-full bg-black transition-all ${file.loop ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
