import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface VoiceVisualizerProps {
  isRecording: boolean;
  stream: MediaStream | null;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ isRecording, stream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRecording && stream) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const draw = () => {
        if (!canvasRef.current || !analyserRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = 3;
        const gap = 2;
        const barCount = Math.floor(canvas.width / (barWidth + gap));
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Center vertically
        const centerY = canvas.height / 2;
        
        for (let i = 0; i < barCount; i++) {
          const dataIndex = Math.floor((i / barCount) * bufferLength);
          const value = dataArray[dataIndex];
          const percent = value / 255;
          const height = Math.max(4, percent * canvas.height * 0.8);
          
          const x = i * (barWidth + gap);
          const y = centerY - (height / 2);
          
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, height, 4);
          
          const gradient = ctx.createLinearGradient(x, y, x, y + height);
          gradient.addColorStop(0, '#00F2FF');
          gradient.addColorStop(0.5, '#FFFFFF');
          gradient.addColorStop(1, '#FF00EA');
          
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(0, 242, 255, 0.5)';
          
          ctx.fillStyle = gradient;
          ctx.fill();
        }
        
        animationFrameRef.current = requestAnimationFrame(draw);
      };
      
      draw();
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    }
    
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [isRecording, stream]);

  return (
    <div className="flex-1 flex items-center h-8 px-4 overflow-hidden">
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={32} 
        className="w-full h-full opacity-60"
      />
    </div>
  );
};
