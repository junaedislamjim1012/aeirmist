import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, Mic } from 'lucide-react';
import { aeirmistCache } from '../../services/CacheService';

interface VoicePlaybackProps {
  url: string;
  isMe: boolean;
}

export const VoicePlayback: React.FC<VoicePlaybackProps> = ({ url, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(url);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let currentUrl = url;
    let isMounted = true;

    async function loadAudio() {
      if (url.startsWith('blob:') || url.startsWith('http')) {
         const cached = await aeirmistCache.getMedia(url);
         if (cached && isMounted) {
            currentUrl = URL.createObjectURL(cached);
            setAudioUrl(currentUrl);
         } else {
            setAudioUrl(url);
         }
      }
    }
    
    loadAudio();

    return () => {
      isMounted = false;
      if (currentUrl.startsWith('blob:') && currentUrl !== url) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      if (audioRef.current) audioRef.current.currentTime = 0;
    };

    const handleError = (e: any) => {
      console.error("Audio playback error:", e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Simple static waveform representation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);
    const bars = 35;
    const barWidth = 2.5;
    const gap = 2;
    
    for (let i = 0; i < bars; i++) {
      const x = i * (barWidth + gap);
      const seed = Math.abs(Math.sin(i * 0.8)) * 0.6 + 0.2;
      const h = 4 + seed * 20;
      
      const currentProgress = (i / bars) * 100;
      const isPlayed = currentProgress < progress;
      
      if (isPlayed) {
        ctx.fillStyle = isMe ? '#FFFFFF' : '#00F2FF';
        ctx.shadowBlur = isPlaying ? 12 : 4;
        ctx.shadowColor = isMe ? 'white' : 'rgba(0, 242, 255, 0.6)';
      } else {
        ctx.fillStyle = isMe ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)';
        ctx.shadowBlur = 0;
      }
      
      // Rounded rects for bars
      const y = (rect.height - h) / 2;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, h, 1);
      ctx.fill();
    }
  }, [progress, isMe, isPlaying]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [playbackRate, setPlaybackRate] = useState(1);

  const togglePlaybackRate = () => {
    const rates = [1, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
        audioRef.current.playbackRate = nextRate;
    }
  };

  return (
    <div className={`flex items-center gap-3 py-1 min-w-[200px] ${isMe ? 'text-white' : 'text-aeirmist-cyan'}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="relative group">
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={togglePlay}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isMe ? 'bg-white/10 hover:bg-white/20' : 'bg-aeirmist-cyan/10 hover:bg-aeirmist-cyan/20'
            }`}
        >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
        </motion.button>
        
        <button 
           onClick={togglePlaybackRate}
           className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-[8px] font-black hover:bg-aeirmist-cyan hover:text-aeirmist-bg transition-colors"
        >
            {playbackRate}x
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-1">
        <div className="relative h-6 flex items-center">
            <canvas 
                ref={canvasRef} 
                width={160} 
                height={24} 
                className="w-full h-full cursor-pointer"
                onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const p = x / rect.width;
                    if (audioRef.current) {
                        audioRef.current.currentTime = p * audioRef.current.duration;
                    }
                }}
            />
        </div>
        <div className="flex justify-between items-center px-0.5">
            <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">
                {isPlaying ? formatTime(audioRef.current?.currentTime || 0) : formatTime(duration)}
            </span>
            <div className="flex items-center gap-1 opacity-20">
                <Mic size={8} />
                <span className="text-[8px] font-black uppercase tracking-[0.2em]">Voice Message</span>
            </div>
        </div>
      </div>
    </div>
  );
};
