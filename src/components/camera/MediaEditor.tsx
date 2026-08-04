import React, { useRef, useState, useEffect } from 'react';
import { X, Check, Type, Pencil, LayoutGrid, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { NGLSticker } from '../profile/NGLSystem';

interface MediaEditorProps {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  onClose: () => void;
  onSave: (finalMedia: Blob) => void;
}

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};

export const MediaEditor: React.FC<MediaEditorProps> = ({ mediaUrl, mediaType, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState('');
  const [drawing, setDrawing] = useState(false);
  const [pendingNGL, setPendingNGL] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check for pending NGL reply
    const pending = (window as any).__PENDING_NGL_REPLY;
    if (pending) {
      setPendingNGL(pending);
    }
  }, []);

  const drawSticker = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    if (!pendingNGL) return;

    // Center card design based on canvas size
    const cardWidth = Math.min(canvasWidth * 0.85, 450);
    
    const badgeFontSize = Math.max(12, Math.floor(cardWidth * 0.035));
    const messageFontSize = Math.max(16, Math.floor(cardWidth * 0.055));
    const footerFontSize = Math.max(11, Math.floor(cardWidth * 0.032));
    const subFooterFontSize = Math.max(9, Math.floor(cardWidth * 0.024));

    // Wrap message content to calculate total height
    ctx.font = `bold italic ${messageFontSize}px Inter, sans-serif`;
    const wrappedLines = wrapText(ctx, `"${pendingNGL.content}"`, cardWidth - cardWidth * 0.22);
    const messageLineHeight = messageFontSize * 1.45;
    const messageTotalHeight = wrappedLines.length * messageLineHeight;

    const contentBoxPadding = cardWidth * 0.06;
    const contentBoxHeight = messageTotalHeight + contentBoxPadding * 2;
    
    const topSpacer = cardWidth * 0.12;
    const contentYOffset = topSpacer;
    const footerYOffset = contentYOffset + contentBoxHeight + cardWidth * 0.08;
    const footerHeight = cardWidth * 0.18;
    const cardHeight = footerYOffset + footerHeight;

    const cardX = (canvasWidth - cardWidth) / 2;
    const cardY = (canvasHeight - cardHeight) / 2;

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    // Card shadow / ambient glow
    ctx.save();
    ctx.shadowColor = 'rgba(255, 0, 234, 0.45)';
    ctx.shadowBlur = cardWidth * 0.08;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = cardWidth * 0.04;
    
    // Draw Card Background
    roundRect(cardX, cardY, cardWidth, cardHeight, cardWidth * 0.08);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fill();
    ctx.restore();

    // Draw Card Border
    ctx.save();
    roundRect(cardX, cardY, cardWidth, cardHeight, cardWidth * 0.08);
    ctx.strokeStyle = 'rgba(255, 0, 234, 0.4)';
    ctx.lineWidth = Math.max(2, cardWidth * 0.007);
    ctx.stroke();
    ctx.restore();

    // Draw Content Box Background
    const boxX = cardX + cardWidth * 0.08;
    const boxY = cardY + contentYOffset;
    const boxW = cardWidth * 0.84;
    const boxH = contentBoxHeight;
    const boxR = cardWidth * 0.05;

    ctx.save();
    roundRect(boxX, boxY, boxW, boxH, boxR);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Draw wrapped lines of text
    ctx.save();
    ctx.font = `bold italic ${messageFontSize}px Inter, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    wrappedLines.forEach((line, index) => {
      const lineY = boxY + contentBoxPadding + (index + 0.5) * messageLineHeight;
      ctx.fillText(line, boxX + boxW / 2, lineY);
    });
    ctx.restore();

    // Draw Top Badge ("Anonymous Message")
    ctx.save();
    const badgeText = "Anonymous Message";
    ctx.font = `900 ${badgeFontSize}px Inter, sans-serif`;
    
    // @ts-ignore
    if (ctx.letterSpacing !== undefined) {
      // @ts-ignore
      ctx.letterSpacing = `${badgeFontSize * 0.25}px`;
    }
    
    const badgePaddingX = cardWidth * 0.06;
    const badgePaddingY = cardWidth * 0.022;
    const badgeW = ctx.measureText(badgeText).width + badgePaddingX * 2;
    const badgeH = badgeFontSize + badgePaddingY * 2;
    const badgeX = cardX + (cardWidth - badgeW) / 2;
    const badgeY = cardY - badgeH / 2;

    roundRect(badgeX, badgeY, badgeW, badgeH, badgeH / 2);
    ctx.fillStyle = '#ff00ea';
    ctx.shadowColor = 'rgba(255, 0, 234, 0.5)';
    ctx.shadowBlur = 15;
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2);
    ctx.restore();

    // Draw Footer (Sent via Aeirmist NGL)
    ctx.save();
    const footerX = cardX + cardWidth / 2;
    const footerY = cardY + footerYOffset;

    // @ts-ignore
    if (ctx.letterSpacing !== undefined) {
      // @ts-ignore
      ctx.letterSpacing = `${footerFontSize * 0.2}px`;
    }

    ctx.font = `900 ${footerFontSize}px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText("Sent via Aeirmist NGL", footerX, footerY);

    // @ts-ignore
    if (ctx.letterSpacing !== undefined) {
      // @ts-ignore
      ctx.letterSpacing = 'normal';
    }

    const nodeId = pendingNGL.id ? pendingNGL.id.slice(0, 8) : '00000000';
    ctx.font = `400 ${subFooterFontSize}px monospace`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillText(`Encrypted Message #${nodeId}`.toUpperCase(), footerX, footerY + footerFontSize + cardWidth * 0.04);
    ctx.restore();
  };

  const handleSave = () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const canvas = canvasRef.current;
    if (!canvas) {
      setIsProcessing(false);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    const proceedWithSave = () => {
      // Render the custom styled sticker overlay onto the canvas
      drawSticker(ctx, canvas.width, canvas.height);

      // Generate the final composite JPEG image
      canvas.toBlob(
        (blob) => {
          setIsProcessing(false);
          if (blob) {
            onSave(blob);
          } else {
            console.error("Failed to generate composite blob from canvas, falling back.");
            // Fallback: fetch original mediaUrl directly
            fetch(mediaUrl)
              .then(res => res.blob())
              .then(onSave)
              .catch(err => {
                console.error("Save fallback failed:", err);
                onSave(new Blob());
              });
          }
        },
        'image/jpeg',
        0.95
      );
    };

    if (mediaType === 'image') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = mediaUrl;
      img.onload = () => {
        canvas.width = img.naturalWidth || img.width || 1080;
        canvas.height = img.naturalHeight || img.height || 1920;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        proceedWithSave();
      };
      img.onerror = (err) => {
        console.error("Failed to load image on canvas, using dimensions:", err);
        canvas.width = 1080;
        canvas.height = 1920;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        proceedWithSave();
      };
    } else {
      // Load video frame as background
      const video = document.createElement('video');
      video.src = mediaUrl;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      video.currentTime = 0;
      video.onseeked = () => {
        canvas.width = video.videoWidth || 1080;
        canvas.height = video.videoHeight || 1920;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        proceedWithSave();
      };
      video.onerror = (err) => {
        console.error("Failed to load video seek on canvas:", err);
        canvas.width = 1080;
        canvas.height = 1920;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        proceedWithSave();
      };
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-black flex flex-col items-center justify-center">
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-[1210]">
        <button onClick={onClose} className="text-white hover:text-white/80 transition-colors disabled:opacity-50" disabled={isProcessing}>
          <X />
        </button>
        <h2 className="text-aeirmist-cyan uppercase tracking-widest font-black">Story Editor</h2>
        <button 
          onClick={handleSave} 
          className="text-aeirmist-cyan hover:text-aeirmist-cyan/80 transition-colors disabled:opacity-50"
          disabled={isProcessing}
        >
          {isProcessing ? <Loader2 className="animate-spin" /> : <Check />}
        </button>
      </header>

      <div className="relative w-full h-full flex items-center justify-center">
        {mediaType === 'image' ? (
          <img src={mediaUrl} className="max-w-full max-h-full object-contain" alt="edit" />
        ) : (
          <video src={mediaUrl} className="max-w-full max-h-full object-contain" autoPlay loop muted />
        )}
        <canvas ref={canvasRef} className="absolute inset-0 z-[1205] pointer-events-none opacity-0" />
        
        {pendingNGL && (
          <div className="absolute inset-0 z-[1208] flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <NGLSticker message={pendingNGL} />
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-6 flex gap-4">
        <button className="p-4 bg-white/10 rounded-full hover:bg-white/15 transition-all"><Pencil size={20}/></button>
        <button className="p-4 bg-white/10 rounded-full hover:bg-white/15 transition-all"><Type size={20}/></button>
        <button className="p-4 bg-white/10 rounded-full hover:bg-white/15 transition-all"><LayoutGrid size={20}/></button>
      </div>
    </div>
  );
};

