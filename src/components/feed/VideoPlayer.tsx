import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play, Pause, Maximize } from 'lucide-react';
import { mediaService } from '../../services/MediaService';

interface VideoPlayerProps {
  src: string;
  className?: string;
  useCache?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  src, 
  className = "w-full h-full object-cover",
  useCache = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    if (!useCache || !src) {
      setCurrentSrc(src);
      return;
    }

    let isMounted = true;
    const loadCachedVideo = async () => {
      try {
        const cachedUrl = await mediaService.getCachedMediaURL(src, 'video/mp4');
        if (isMounted) setCurrentSrc(cachedUrl);
      } catch (e) {
        if (isMounted) setCurrentSrc(src);
      }
    };
    loadCachedVideo();
    return () => { isMounted = false; };
  }, [src, useCache]);

  // AutoPlay on Scroll Intersection Observer
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play()
              .then(() => setIsPlaying(true))
              .catch((err) => console.log('Auto-play blocked by policy:', err));
          } else {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.25 } // Auto play when 25% is in view for smoother scroll feed experience
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log(err));
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const progressPct = (video.currentTime / video.duration) * 100;
    setProgress(isNaN(progressPct) ? 0 : progressPct);
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  };

  return (
    <div 
      ref={containerRef} 
      onClick={handlePlayPause}
      className="relative w-full h-full overflow-hidden group/video bg-black/40 flex items-center justify-center cursor-pointer"
    >
      <video
        ref={videoRef}
        src={currentSrc}
        className={className}
        loop
        muted={isMuted}
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Video Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/video:opacity-100 transition-all duration-300 pointer-events-none flex flex-col justify-end p-4">
        <div className="flex items-center justify-between pointer-events-auto w-full">
          {/* Play/Pause Button */}
          <button 
            onClick={handlePlayPause}
            className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-white hover:text-aeirmist-cyan transition-all"
          >
            {isPlaying ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current ml-0.5" />}
          </button>

          {/* Video Timeline Scrubber */}
          <div className="flex-1 mx-3 h-1 bg-white/20 rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-gradient-to-r from-aeirmist-cyan to-aeirmist-magenta cursor-pointer" 
              style={{ width: `${progress}%` }} 
            />
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Toggle */}
            <button 
              onClick={handleMuteToggle}
              className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-white hover:text-aeirmist-cyan transition-all"
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>

            {/* Fullscreen Button */}
            <button 
              onClick={handleFullscreen}
              className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-white hover:text-aeirmist-cyan transition-all"
            >
              <Maximize size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Large visual play indicator when paused and not hovered */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white group-hover/video:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <Play size={20} className="fill-current ml-1 text-aeirmist-cyan" />
          </div>
        </div>
      )}
    </div>
  );
};
