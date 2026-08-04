import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Share2, Link, Edit3, Trash2, X, Send, Film
} from 'lucide-react';
import { useAeirmist } from '../../context/AeirmistContext';
import { Video } from '../../types/videos';

interface VideoMenuProps {
  isOpen: boolean;
  onClose: () => void;
  video: Video;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onShareToInbox: () => void;
  onShareToStory: () => void;
}

interface MenuOption {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

export const VideoMenu: React.FC<VideoMenuProps> = ({ 
  isOpen, 
  onClose,
  video,
  isOwner,
  onEdit,
  onDelete,
  onShareToInbox,
  onShareToStory
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { addToast } = useAeirmist();

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleCopyLink = () => {
    try {
      const shareUrl = `${window.location.origin}/video/${video.id}`;
      navigator.clipboard.writeText(shareUrl);
      addToast({
        title: 'LINK COPIED',
        message: 'Video link successfully mirrored to your tactical interface cache.',
        type: 'success'
      });
    } catch (e) {
      console.error(e);
    }
  };

  const sections: { title?: string; options: MenuOption[] }[] = [
    {
      options: [
        { 
          icon: <Send size={18} />, 
          label: 'Share to Inbox', 
          onClick: onShareToInbox 
        },
        { 
          icon: <Film size={18} />, 
          label: 'Share to Story', 
          onClick: onShareToStory 
        },
        { 
          icon: <Link size={18} />, 
          label: 'Copy Link', 
          onClick: handleCopyLink 
        },
      ]
    }
  ];

  if (isOwner) {
    sections.push({
      title: 'Creator Controls',
      options: [
        { 
          icon: <Edit3 size={18} />, 
          label: 'Edit Caption', 
          onClick: onEdit 
        },
        { 
          icon: <Trash2 size={18} />, 
          label: 'Delete Video', 
          onClick: onDelete,
          variant: 'danger'
        },
      ]
    });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div key="video-menu-wrapper">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] transition-all duration-300"
          />

          <div className="fixed inset-0 flex items-center justify-center z-[160] p-4 pointer-events-none">
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-[320px] bg-[#0d0d12] border border-white/10 rounded-[2rem] overflow-hidden pointer-events-auto shadow-2xl flex flex-col"
            >
              <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Video Matrix</h2>
                <button 
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="py-2">
                {sections.map((section, sIdx) => (
                  <div key={sIdx} className={sIdx !== 0 ? 'mt-1 pt-1 border-t border-white/5' : ''}>
                    {section.title && (
                      <p className="px-6 py-2 text-[8px] font-black uppercase tracking-[0.25em] text-aeirmist-cyan/60">
                        {section.title}
                      </p>
                    )}
                    {section.options.map((option, oIdx) => (
                      <button
                        key={oIdx}
                        onClick={() => {
                          option.onClick();
                          onClose();
                        }}
                        className={`w-full flex items-center gap-4 px-6 py-3.5 text-sm transition-colors group
                          ${option.variant === 'danger' ? 'text-aeirmist-magenta hover:bg-aeirmist-magenta/5' : 'text-white/80 hover:bg-white/5'}
                        `}
                      >
                        <span className={`transition-transform duration-300 group-hover:scale-110
                          ${option.variant === 'danger' ? 'text-aeirmist-magenta/70' : 'text-aeirmist-cyan/70'}
                        `}>
                          {option.icon}
                        </span>
                        <span className="font-bold tracking-tight">{option.label}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
