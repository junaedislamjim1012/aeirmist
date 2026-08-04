import React, { useState, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
const EmojiPicker = React.lazy(() => import('emoji-picker-react'));
import { Reply, Forward, Edit2, Trash2, Heart, Copy, Smile, Loader2, Sparkles, Zap, MoreVertical, Pin, Bookmark, Languages, Info } from 'lucide-react';
import { Message } from '../../types/messenger';
import { VoicePlayback } from './VoicePlayback';
import { Check, CheckCheck, Eye, EyeOff } from 'lucide-react';
import { useAeirmist } from '../../context/AeirmistContext';
import { formatShortTimestamp, formatTimeOnly } from '../../lib/date';
import { SafeImage } from '../ui/SafeImage';

const moods = {
  ecstatic: '⚡',
  chill: '🌊',
  intense: '🔥',
  melancholy: '🌑',
};

export const MessageItem = React.memo<{ 
  message: Message, 
  isMe: boolean, 
  theme?: string, 
  onRetry?: () => void, 
  senderPhoto?: string, 
  conversationId?: string, 
  onImageClick?: (url: string) => void,
  onUserClick?: (user: any) => void,
  onReply?: (message: Message) => void,
  onForward?: (message: Message) => void,
  onEdit?: (message: Message) => void,
  isPinned?: boolean,
  onPin?: (message: Message) => void,
  otherUserRestricted?: boolean,
  seenAt?: any,
  otherParticipantName?: string,
  isFirstInSequence?: boolean,
  isLastInSequence?: boolean
}>(({ 
  message, 
  isMe, 
  theme = 'neural', 
  onRetry, 
  senderPhoto, 
  conversationId, 
  onImageClick,
  onUserClick,
  onReply,
  onForward,
  onEdit,
  isPinned = false,
  onPin,
  otherUserRestricted = false,
  seenAt,
  otherParticipantName,
  isFirstInSequence,
  isLastInSequence
}) => {
  const { addReaction: syncReaction, deleteMessage, removeReaction, profile } = useAeirmist();
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<'top' | 'bottom'>('top');

  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);
  const SWIPE_REPLY_THRESHOLD = 56;
  const LONG_PRESS_MS = 450;

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    longPressFiredRef.current = false;
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      if (navigator.vibrate) navigator.vibrate(10);
      setShowMenu(true);
    }, LONG_PRESS_MS);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      clearLongPressTimer();
    }
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
      setIsSwiping(true);
      const allowedDirection = isMe ? dx > 0 : dx < 0;
      const clamped = allowedDirection ? Math.max(-72, Math.min(72, dx)) : 0;
      setSwipeX(clamped);
    }
  };

  const handleTouchEnd = () => {
    clearLongPressTimer();
    if (Math.abs(swipeX) >= SWIPE_REPLY_THRESHOLD && onReply) {
      if (navigator.vibrate) navigator.vibrate(10);
      onReply(message);
    }
    setSwipeX(0);
    setIsSwiping(false);
    touchStartRef.current = null;
  };

  const lastTap = useRef<number>(0);
  const [showHeartPop, setShowHeartPop] = useState(false);

  const handleBubbleClick = (e: React.MouseEvent) => {
    if (message.metadata?.removed) return;

    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
      e.preventDefault();
      e.stopPropagation();
      
      // Trigger/Toggle reaction
      addReaction('❤️');
      
      // Vibration feedback
      if (navigator.vibrate) navigator.vibrate(15);
      
      // Visual feedback
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 800);
    }
    lastTap.current = now;
  };

  useLayoutEffect(() => {
    if (showMenu && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      if (rect.top < 0) {
        setMenuPosition('bottom');
      } else {
        setMenuPosition('top');
      }
    }
  }, [showMenu]);

  const [reactions, setReactions] = useState<{ [emoji: string]: number }>(message.reactions || {});
  const [activeUserReaction, setActiveUserReaction] = useState<string | undefined>(
    profile?.uid ? message.userReactions?.[profile.uid] : undefined
  );

  React.useEffect(() => {
    setReactions(message.reactions || {});
  }, [message.reactions]);

  React.useEffect(() => {
    if (profile?.uid) {
      setActiveUserReaction(message.userReactions?.[profile.uid]);
    }
  }, [message.userReactions, profile?.uid]);

  const removeMyReaction = (emoji: string) => {
    if (profile?.uid && message.userReactions?.[profile.uid] !== emoji && activeUserReaction !== emoji) {
      return;
    }
    const finalConvId = conversationId || (message as any).conversationId;
    if (message.id && finalConvId) {
       removeReaction(finalConvId, message.id, emoji);
    }
    setReactions(prev => {
        const next = { ...prev };
        if (next[emoji] > 1) {
            next[emoji] -= 1;
        } else {
            delete next[emoji];
        }
        return next;
    });
    setActiveUserReaction(undefined);
  };

  const handleAvatarClick = () => {
    if (!isMe && onUserClick) {
      onUserClick({
        id: message.senderId,
        photoURL: avatarUrl,
        displayName: 'Aeirmist User' // Name might need to be resolved better but we have it in chat
      });
    }
  };

  const themeColors = {
    neural: isMe ? 'bg-[#3390EC] border-transparent' : 'bg-[#202C33] border-transparent',
    crimson: isMe ? 'bg-[#3390EC] border-transparent' : 'bg-[#202C33] border-transparent',
    emerald: isMe ? 'bg-[#3390EC] border-transparent' : 'bg-[#202C33] border-transparent',
    monolith: isMe ? 'bg-[#3390EC] border-transparent' : 'bg-[#202C33] border-transparent',
  };

  const bubbleClass = themeColors[theme as keyof typeof themeColors] || themeColors.neural;

  const addReaction = (emoji: string) => {
    const finalConvId = conversationId || (message as any).conversationId;
    const oldEmoji = activeUserReaction;

    if (oldEmoji === emoji) {
      removeMyReaction(emoji);
      return;
    }

    if (message.id && finalConvId) {
      syncReaction(finalConvId, message.id, emoji, oldEmoji);
    }

    setReactions(prev => {
      const next = { ...prev };
      if (oldEmoji) {
        next[oldEmoji] = Math.max(0, (next[oldEmoji] || 1) - 1);
        if (next[oldEmoji] === 0) delete next[oldEmoji];
      }
      next[emoji] = (next[emoji] || 0) + 1;
      return next;
    });

    if (profile?.uid) {
      setActiveUserReaction(emoji);
    }
    setShowMenu(false);
    setShowEmojiPicker(false);
  };

  // Profile photo fallback
  const avatarUrl = React.useMemo(() => 
    senderPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderId || 'anon'}`,
    [message.senderId, senderPhoto]
  );

  const sequenceRadiusClass = isFirstInSequence === undefined ? 'rounded-[18px]' : (
    isMe
      ? `rounded-l-[18px] ${isFirstInSequence ? 'rounded-tr-[18px]' : 'rounded-tr-[4px]'} ${isLastInSequence ? 'rounded-br-[18px]' : 'rounded-br-[4px]'}`
      : `rounded-r-[18px] ${isFirstInSequence ? 'rounded-tl-[18px]' : 'rounded-tl-[4px]'} ${isLastInSequence ? 'rounded-bl-[18px]' : 'rounded-bl-[4px]'}`
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
      className={`group flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-[2px] ${
        message.metadata?.isNewSender ? 'mt-[12px]' : ''
      } px-4 md:px-8 ${isMe ? 'md:pr-12' : 'md:pl-8'} relative`}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowMenu(true);
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{ WebkitTouchCallout: 'none' }}
    >
      {isSwiping && Math.abs(swipeX) > 4 && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 ${isMe ? 'right-2' : 'left-2'} pointer-events-none flex items-center justify-center w-8 h-8 rounded-full bg-white/10`}
          style={{ opacity: Math.min(1, Math.abs(swipeX) / SWIPE_REPLY_THRESHOLD) }}
        >
          <Reply size={16} className="text-[#00F2FF]" />
        </div>
      )}
      <div
        className={`relative flex items-end gap-3 max-w-full ${isMe ? 'flex-row-reverse' : 'flex-row'} min-w-0`}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: isSwiping ? 'none' : 'transform 200ms ease-out',
        }}
      >
        {!isMe && message.metadata?.isNewSender && (
          <div 
            className="w-8 h-8 rounded-xl overflow-hidden border border-white/10 mb-1 flex-shrink-0 cursor-pointer hover:border-aeirmist-cyan transition-colors"
            onClick={handleAvatarClick}
          >
            <img src={avatarUrl} alt="user" className="w-full h-full object-cover bg-white/5" />
          </div>
        )}
        {!isMe && !message.metadata?.isNewSender && <div className="w-8 h-8 flex-shrink-0" />}
        
        <div className={`relative group/bubble ${isMe ? 'items-end' : 'items-start'} min-w-0`}>
          <motion.div 
            whileHover={{ y: -1, scale: 1.01 }}
            onClick={handleBubbleClick}
            className={`${(!message.text && (message.type === 'image' || message.type === 'media' || message.type === 'video')) ? 'p-1' : 'px-3.5 py-2.5'} ${sequenceRadiusClass} backdrop-blur-xl border ${
              isMe 
                ? 'bg-gradient-to-br from-[#6E7BF2]/50 via-[#8B5FBF]/45 to-[#5B6EE8]/50 border-white/15 shadow-[0_4px_20px_rgba(80,90,240,0.25)] text-white' 
                : 'bg-white/10 border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.2)] text-white/95'
            } transition-all duration-300 relative overflow-hidden w-fit min-w-[64px] max-w-[85vw] md:max-w-[420px]`}
          >
            {/* glassmorphism: semi-transparent gradient + backdrop-blur-xl creates frosted glass effect over background media/photos */}
            
            <AnimatePresence>
              {showHeartPop && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.3, y: 10 }}
                  animate={{ opacity: 1, scale: 1.6, y: -10 }}
                  exit={{ opacity: 0, scale: 0.5, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="absolute inset-0 m-auto w-12 h-12 flex items-center justify-center text-3xl pointer-events-none z-50 select-none drop-shadow-[0_4px_12px_rgba(239,68,68,0.5)]"
                >
                  ❤️
                </motion.div>
              )}
            </AnimatePresence>
            
            {message.metadata?.vanish && (
              <div className="absolute top-1 right-2 animate-pulse">
                <EyeOff size={10} className="text-white/20" />
              </div>
            )}
            
            {message.type === 'text' && (
              <div className="relative">
                {message.metadata?.removed ? (
                  <p className="text-[11px] leading-relaxed font-medium italic tracking-tight text-white/40">Message Removed</p>
                ) : (
                  <div className="relative">
                    {message.metadata?.replyTo && (
                      <div className="mb-2 p-2 bg-white/5 rounded-xl border-l-2 border-[#00F2FF]/70 text-left text-[11px] leading-normal opacity-90 select-none max-w-[320px] min-w-[140px]">
                        <p className="font-semibold text-[#00F2FF] text-[10px] mb-0.5">
                          {message.metadata.replyTo.senderName || (message.metadata.replyTo.senderId === profile?.id ? "You" : (otherParticipantName || "User"))}
                        </p>
                        <p className="truncate text-white/50 text-[10.5px] font-medium">{message.metadata.replyTo.text}</p>
                      </div>
                    )}
                    <div className="relative flex flex-wrap gap-x-1.5 items-end">
                      <p className="text-[14.5px] leading-[1.4] font-normal tracking-normal whitespace-pre-wrap break-words text-white" style={{ fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 400 }}>
                        {message.text}
                      </p>
                    <div className="flex items-center gap-1 text-[10px] opacity-60 flex-shrink-0">
                      {message.metadata?.edited && (
                        <span className="text-[9px] font-bold">Edited</span>
                      )}
                      <span className="font-medium tracking-tight whitespace-nowrap">
                        {formatTimeOnly(message.timestampMs || message.timestamp)}
                      </span>
                      {isMe && !message.isFailed && (
                        <span className="flex items-center ml-0.5">
                          {message.isOptimistic ? (
                            <Loader2 size={10} className="animate-spin text-white/30" />
                          ) : (message.isSeen && !otherUserRestricted && profile?.messagingSettings?.readReceipts !== false) ? (
                            <CheckCheck size={12} className="text-aeirmist-cyan" />
                          ) : message.isDelivered ? (
                            <CheckCheck size={12} className="text-white/40" />
                          ) : (
                            <Check size={12} className="text-white/20" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  </div>
                )}
                {Object.entries(reactions).length > 0 && (
                  <div className="flex gap-1 mt-1 -ml-1">
                    {Object.entries(reactions).map(([emoji, count]) => (
                      <span key={emoji} className="text-xs bg-white/10 rounded-full px-1.5 py-0.5">
                        {emoji} {count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {message.type === 'voice' && message.mediaUrl && (
              <VoicePlayback url={message.mediaUrl} isMe={isMe} />
            )}

            {(message.type === 'image' || message.type === 'media' || message.type === 'video') && message.mediaUrl && (
              <div className="rounded-[18px] overflow-hidden my-1 relative group/media shadow-2xl">
                {message.type === 'video' || (message as any).mediaType === 'video' || message.metadata?.mediaType === 'video' || (message.type === 'media' && message.mediaUrl.includes('.mp4')) ? (
                  <video src={message.mediaUrl} className={`w-full h-auto object-cover max-h-[400px] transition-all duration-700 ${message.isOptimistic ? 'blur-md grayscale' : ''}`} controls={!message.isOptimistic} />
                ) : (
                  <SafeImage 
                    src={message.mediaUrl} 
                    alt="shared" 
                    blurThumbnail={message.thumbnail}
                    onClick={() => onImageClick && onImageClick(message.mediaUrl || '')}
                    className={`w-full h-auto object-cover hover:scale-105 transition-all duration-1000 max-h-[400px] sm:max-h-[500px] cursor-pointer ${message.isOptimistic ? 'blur-lg scale-110 grayscale' : ''} ${message.isFailed ? 'blur-sm opacity-50' : ''}`} 
                  />
                )}
              </div>
            )}



            {message.isFailed && isMe && (
               <button 
                 onClick={(e) => { e.stopPropagation(); onRetry?.(); }}
                 className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10 text-white hover:text-aeirmist-cyan transition-colors cursor-pointer w-full"
               >
                 <Zap size={10} className="animate-pulse" />
                 <span className="text-[8px] font-black uppercase tracking-widest">Signal Dropped - Tap to Retry</span>
               </button>
            )}

            {message.metadata?.expired && (
               <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10 text-white/50">
                   <button className="flex items-center gap-1 hover:text-white transition-colors" onClick={() => onReply?.(message)}>
                       <Heart size={14} /> React
                   </button>
                   <button className="flex items-center gap-1 hover:text-white transition-colors" onClick={() => onReply?.(message)}>
                       <Smile size={14} /> Reply
                   </button>
                   <button className="flex items-center gap-1 hover:text-white transition-colors" onClick={() => onForward?.(message)}>
                       <Reply size={14} /> Quote
                   </button>
               </div>
            )}
          </motion.div>

          {/* Quick Actions (Desktop hover) */}
          <div className={`absolute top-1/2 -translate-y-1/2 hidden md:flex items-center gap-0.5 p-1 transition-all opacity-0 group-hover/bubble:opacity-100 bg-[#181A20]/90 backdrop-blur-md border border-white/10 rounded-full shadow-lg ${isMe ? 'right-[calc(100%+12px)]' : 'left-[calc(100%+12px)]'}`}>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(true); }}                
              className="w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform duration-200 text-white/40 hover:text-white"
            >
              <Smile size={16} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMenu(true); }}                
              className="w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform duration-200 text-white/40 hover:text-white"
            >
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div key="emoji-picker-wrapper">
            <div className="fixed inset-0 z-[110]" onClick={() => setShowEmojiPicker(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute z-[111] -top-2 left-10 mb-2 overflow-hidden rounded-2xl shadow-2xl"
            >
              <React.Suspense fallback={null}>
                <EmojiPicker 
                  onEmojiClick={(e: any) => {
                    addReaction(e.emoji);
                  }}
                  theme={'dark' as any}
                  emojiStyle={'native' as any}
                />
              </React.Suspense>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMenu && (
          <motion.div key="message-menu-wrapper">
            <div className="fixed inset-0 z-[110]" onClick={() => setShowMenu(false)} />
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: menuPosition === 'top' ? 10 : -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: menuPosition === 'top' ? 10 : -10 }}
              className={`absolute z-[111] bg-[#141519]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2.5 min-w-[260px]`}
              style={{ 
                [menuPosition === 'top' ? 'bottom' : 'top']: '100%', 
                [menuPosition === 'top' ? 'marginBottom' : 'marginTop']: '12px',
                left: isMe ? 'auto' : '0', 
                right: isMe ? '0' : 'auto' 
              }}
            >
              <div className="flex items-center justify-between gap-1 px-1.5 pb-2 mb-2 border-b border-white/10">
                {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => { addReaction(emoji); setShowMenu(false); }}
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-lg transition-transform hover:scale-125 active:scale-95 ${
                      activeUserReaction === emoji ? 'bg-[#00F2FF]/20 ring-2 ring-[#00F2FF]' : 'hover:bg-white/10'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  onClick={() => { setShowMenu(false); setShowEmojiPicker(true); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Smile size={16} />
                </button>
              </div>

              <div className="space-y-1">
                <OptionItem icon={<Reply />} label="Reply" onClick={() => { setShowMenu(false); onReply?.(message); }} />
                <OptionItem icon={<Copy />} label="Copy Text" onClick={() => { setShowMenu(false); navigator.clipboard.writeText(message.text || ''); }} />
                <OptionItem icon={<Forward />} label="Forward" onClick={() => { setShowMenu(false); onForward?.(message); }} />
                <OptionItem icon={<Bookmark />} label="Bookmark" onClick={() => setShowMenu(false)} />
                <OptionItem icon={<Languages />} label="Translate" onClick={() => setShowMenu(false)} />
                {isMe && message.type === 'text' && !message.metadata?.removed && (
                  <OptionItem icon={<Edit2 />} label="Edit Message" onClick={() => { setShowMenu(false); onEdit?.(message); }} />
                )}
                <OptionItem icon={<Pin />} label={isPinned ? "Unpin Message" : "Pin Message"} onClick={() => { setShowMenu(false); onPin?.(message); }} />
                <OptionItem icon={<Info />} label="Message Info" onClick={() => setShowMenu(false)} />
                <div className="h-px bg-white/5 my-2" />
                <OptionItem icon={<Trash2 />} label="Delete for Me" variant="danger" onClick={() => { 
                    setShowMenu(false); 
                    const finalConvId = conversationId || (message as any).conversationId;
                    if(finalConvId && confirm("Delete this message for yourself?")) deleteMessage(finalConvId, message.id, 'me'); 
                }} />
                {isMe && !message.metadata?.removed && (
                  <OptionItem icon={<Trash2 />} label="Delete for Everyone" variant="danger-pill" onClick={() => { 
                      setShowMenu(false); 
                      const finalConvId = conversationId || (message as any).conversationId;
                      if(finalConvId && confirm("Delete this message for everyone?")) deleteMessage(finalConvId, message.id, 'everyone'); 
                  }} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

const OptionItem = ({ icon, label, onClick, variant = 'default' }: { icon: React.ReactNode, label: string, onClick?: () => void, variant?: 'default' | 'danger' | 'danger-pill' }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.1em] transition-all ${
      variant === 'danger' || variant === 'danger-pill'
        ? 'text-[#FF00EA] hover:bg-[#FF00EA]/10'
        : 'text-white/60 hover:text-white hover:bg-white/5'
    }`}
  >
    <div>
      {React.cloneElement(icon as any, { size: 16 })}
    </div>
    {label}
  </button>
);
