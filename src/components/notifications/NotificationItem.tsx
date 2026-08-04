import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Heart, 
  MessageSquare, 
  UserPlus, 
  TrendingUp, 
  ShieldAlert, 
  Bell, 
  Share2, 
  Bookmark, 
  Mail, 
  PhoneMissed, 
  Video, 
  Tv, 
  ShoppingBag,
  Trash2, 
  EyeOff, 
  VolumeX, 
  ExternalLink, 
  Check, 
  MoreVertical,
  Brain,
  Sparkles,
  MessageCircle,
  HelpCircle,
  X,
  ShieldCheck
} from 'lucide-react';
import { Notification } from '../../types/notifications';

interface NotificationItemProps {
  notification: any; // Using any for broader compatibility
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onHideType?: (type: string) => void;
  onMuteUser?: (username: string) => void;
  onViewSource?: (notification: any) => void;
  onAction?: (id: string, action: string) => void;
  isProcessing?: boolean;
  onUserClick?: (user: any) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onMarkRead,
  onDelete,
  onHideType,
  onMuteUser,
  onViewSource,
  onAction,
  isProcessing,
  onUserClick
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Time Formatter exactly matching: Just Now, 5s ago, 2m ago, 1h ago, Yesterday, 3d ago, 2w ago, etc.
  const formatAeirmistTime = (timestampMs: number): string => {
    if (!timestampMs) return 'Just Now';
    const now = Date.now();
    const diffSec = Math.floor((now - timestampMs) / 1000);
    
    if (diffSec < 5) return 'Just Now';
    if (diffSec < 60) return `${diffSec}s ago`;
    
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;
    
    const diffWk = Math.floor(diffDay / 7);
    if (diffWk < 4) return `${diffWk}w ago`;
    
    const diffMo = Math.floor(diffDay / 30);
    if (diffMo < 12) return `${diffMo}mo ago`;
    
    const diffYr = Math.floor(diffDay / 365);
    return `${diffYr}y ago`;
  };

  const getPriority = () => {
    if (notification.priority) return notification.priority;
    const t = String(notification.type).toLowerCase();
    const highPriorityTypes = [
      'follow_request', 
      'payment_received', 
      'order_status_change', 
      'security_alert', 
      'mention', 
      'story_mention',
      'system_verification'
    ];
    return highPriorityTypes.includes(t) ? 'high' : 'normal';
  };

  const getPriorityGlow = () => {
    const priority = getPriority();
    const isUnread = !(notification.read || notification.isRead);
    if (priority === 'critical') return 'border-red-500/30' + (isUnread ? ' shadow-[inset_0_0_12px_rgba(239,68,68,0.15)] bg-red-950/5' : '');
    if (priority === 'high') return 'border-aeirmist-magenta/30 shadow-[inset_0_0_12px_rgba(255,0,234,0.05)]' + (isUnread ? ' bg-aeirmist-magenta/5' : '');
    if (priority === 'medium') return 'border-aeirmist-cyan/20' + (isUnread ? ' shadow-[inset_0_0_12px_rgba(0,242,255,0.05)] bg-cyan-950/2' : '');
    return 'border-white/5';
  };

  const getIcon = () => {
    const type = String(notification.type).toLowerCase();
    
    // Social Group
    if (type === 'like' || type === 'comment_like' || type === 'product_like' || type === 'post_like') {
      return <Heart className="text-rose-500" size={12} fill="currentColor" />;
    }
    if (type === 'comment' || type === 'comment_reply' || type === 'product_comment') {
      return <MessageSquare className="text-aeirmist-cyan" size={12} />;
    }
    if (type === 'mention' || type === 'story_mention' || type === 'tag') {
      return <Sparkles className="text-aeirmist-lime" size={12} />;
    }
    if (type === 'follow' || type === 'follow_accept' || type === 'follow_back' || type === 'store_follow' || type === 'video_follower') {
      return <UserPlus className="text-emerald-400" size={12} />;
    }
    if (type === 'follow_request') {
      return <UserPlus className="text-amber-400" size={12} />;
    }

    // Messages Group
    if (type === 'message' || type === 'store_message' || type.includes('msg')) {
      return <Mail className="text-aeirmist-cyan" size={12} />;
    }
    if (type === 'message_media') {
      return <Tv className="text-aeirmist-cyan" size={12} />;
    }
    if (type === 'message_voice') {
      return <VolumeX className="text-aeirmist-cyan animate-pulse" size={12} />;
    }
    if (type === 'message_video') {
      return <Video className="text-aeirmist-cyan" size={12} />;
    }
    if (type === 'call_missed' || type === 'video_call_missed' || type.includes('call')) {
      return <PhoneMissed className="text-red-500" size={12} />;
    }

    // Stories Group
    if (type.includes('story')) {
      return <Tv className="text-aeirmist-magenta" size={12} />;
    }

    // Videos Group
    if (type.includes('video')) {
      return <Video className="text-aeirmist-cyan" size={12} />;
    }

    // Marketplace Group
    if (type.includes('product') || type.includes('store') || type.includes('review') || type.includes('stock')) {
      return <ShoppingBag className="text-amber-400" size={12} />;
    }

    // NGL Group
    if (type.includes('ngl')) {
      return <MessageCircle className="text-aeirmist-magenta" size={12} />;
    }

    // System Group
    if (type.includes('security') || type.includes('password') || type.includes('login')) {
      return <ShieldAlert className="text-red-500 animate-bounce" size={12} />;
    }
    if (type.includes('system') || type.includes('verification') || type.includes('username') || type.includes('profile')) {
      return <Bell className="text-aeirmist-cyan" size={12} />;
    }

    return <Bell className="text-white/40" size={12} />;
  };

  const getPriorityLabel = () => {
    const priority = getPriority();
    if (priority === 'critical') return <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-red-500/15 text-red-400 border border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]">CRITICAL</span>;
    if (priority === 'high') return <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-aeirmist-magenta/15 text-aeirmist-magenta border border-aeirmist-magenta/20">HIGH PRIORITY</span>;
    if (priority === 'medium') return <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-aeirmist-cyan/15 text-aeirmist-cyan border border-aeirmist-cyan/20">MEDIUM</span>;
    return null;
  };

  // Extract avatar URL
  const getAvatarUrl = () => {
    if (notification.user?.avatar) return notification.user.avatar;
    if (notification.user?.photoURL) return notification.user.photoURL;
    const seed = notification.user?.name || notification.user?.username || 'Aeirmist';
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(seed)}`;
  };

  const getUsername = () => {
    return notification.user?.username || notification.user?.name || 'Aeirmist Node';
  };

  const displayTime = formatAeirmistTime(notification.timestampMs || (notification.createdAt?.toMillis ? notification.createdAt.toMillis() : Date.now()));

  // Smart single-tap behavior for Changes 1 & 4
  const handleCardClick = (e: React.MouseEvent) => {
    onMarkRead?.(notification.id);

    const isProfileType = [
      'follow', 'follow_accept', 'follow_back', 'store_follow', 'video_follower',
      'like', 'comment_like', 'post_like', 'comment', 'comment_reply', 'mention', 'story_mention'
    ].includes(String(notification.type).toLowerCase());

    if (isProfileType && onUserClick && (notification.user || notification.fromUserId)) {
      const targetUser = {
        ...notification.user,
        id: notification.fromUserId || notification.user?.id || notification.user?.uid,
        uid: notification.fromUserId || notification.user?.uid || notification.user?.id,
        displayName: notification.user?.name || notification.user?.displayName || 'Aeirmist Citizen',
        photoURL: notification.user?.avatar || notification.user?.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${notification.id}`,
        username: notification.user?.username || 'aeirmist_network'
      };
      onUserClick(targetUser);
    } else {
      onViewSource?.(notification);
    }
  };

  const isUnread = !(notification.read || notification.isRead);

  return (
    <motion.div
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      transition={{ duration: 0.2 }}
      className={`relative group rounded-xl border transition-all duration-300 ${getPriorityGlow()} ${
        isUnread 
          ? 'bg-neutral-900 border-blue-500/40 shadow-lg opacity-100' 
          : 'bg-neutral-900/80 border-white/15 hover:border-white/30 opacity-100'
      } cursor-pointer overflow-hidden`}
      onClick={handleCardClick}
    >
      {/* Left blue bar for unread notifications */}
      {isUnread && (
        <div className="absolute top-0 bottom-0 left-0 w-[4px] bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] z-10" />
      )}

      {/* Main Grid View - padded generously (p-4) */}
      <div className="p-4 flex gap-3.5 items-start">
        {/* Left Side: Avatar with floating action indicator and unread cyan ring */}
        <div className="relative shrink-0">
          <div className="relative p-0.5 rounded-2xl bg-gradient-to-tr from-white/20 to-white/10 group-hover:scale-105 transition-transform duration-300">
            <img 
              src={getAvatarUrl()} 
              alt={getUsername()} 
              referrerPolicy="no-referrer"
              className={`w-11 h-11 rounded-xl border object-cover bg-black ${
                isUnread 
                  ? 'border-aeirmist-cyan ring-2 ring-aeirmist-cyan/40' 
                  : 'border-white/20'
              }`} 
            />
            {/* Action Icon overlay */}
            <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 rounded-lg bg-black border border-white/30 flex items-center justify-center shadow-lg">
              {getIcon()}
            </div>
          </div>
        </div>

        {/* Center Section: Message Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-xs font-black text-white truncate flex items-center gap-1">
              <span className="hover:text-aeirmist-cyan transition-colors">
                @{getUsername()}
              </span>
              {notification.user?.isVerified && (
                <ShieldCheck className="text-aeirmist-cyan shrink-0" size={12} />
              )}
              {getPriorityLabel()}
            </h4>
            <div className="flex items-center gap-1.5 shrink-0 relative">
              <span className="text-[10px] font-mono tracking-wider text-white/60 whitespace-nowrap">
                {displayTime}
              </span>
              
              {/* Direct One-Tap Cross (Delete) Button */}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notification.id);
                  }}
                  className="p-1 hover:bg-rose-500/20 text-white/70 hover:text-rose-400 rounded-lg transition-all active:scale-90 cursor-pointer"
                  title="Remove notification"
                >
                  <X size={14} />
                </button>
              )}

              {/* Compact Dropdown Options Trigger */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="p-1 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-all active:scale-90 cursor-pointer"
                title="Options"
              >
                <MoreVertical size={14} />
              </button>

              {/* Compact Options Dropdown */}
              {isMenuOpen && (
                <div 
                  ref={menuRef}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-neutral-950 backdrop-blur-md border border-white/20 p-1.5 shadow-[0_10px_25px_rgba(0,0,0,0.8)] z-50 flex flex-col gap-1 text-left font-sans"
                >
                  {isUnread && onMarkRead && (
                    <button
                      type="button"
                      onClick={() => {
                        onMarkRead(notification.id);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white/80 hover:text-white hover:bg-white/10 transition-all text-left"
                    >
                      <Check size={12} className="text-aeirmist-cyan" />
                      Mark Read
                    </button>
                  )}
                  {onHideType && (
                    <button
                      type="button"
                      onClick={() => {
                        onHideType(notification.type);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white/80 hover:text-white hover:bg-white/10 transition-all text-left"
                    >
                      <EyeOff size={12} className="text-amber-400" />
                      Hide Similar
                    </button>
                  )}
                  {onMuteUser && notification.user && (
                    <button
                      type="button"
                      onClick={() => {
                        onMuteUser(getUsername());
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white/80 hover:text-white hover:bg-white/10 transition-all text-left"
                    >
                      <VolumeX size={12} className="text-purple-400" />
                      Mute User
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(notification.id);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all text-left border-t border-white/10 mt-1 pt-1.5"
                    >
                      <Trash2 size={12} />
                      Delete Alert
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-white/95 font-medium leading-relaxed truncate pr-2">
            {notification.groupedCount && notification.groupedCount > 1 ? (
              <>
                <span className="text-white font-bold">{notification.user?.name || 'Someone'}</span>
                {' and '}
                <span className="text-white font-bold">{notification.groupedCount - 1} other{notification.groupedCount > 2 ? 's' : ''}</span>
                {` ${
                  String(notification.type).toLowerCase().includes('like') ? 'liked your post' : 
                  String(notification.type).toLowerCase().includes('comment') ? 'commented on your post' : 
                  String(notification.type).toLowerCase().includes('follow') ? 'followed you' : 
                  'interacted with you'
                }`}
              </>
            ) : (
              notification.message || notification.content || 'Notification received'
            )}
          </p>

          {/* Relocated Always-Visible Accept/Decline Follow Request Buttons */}
          {notification.type === 'follow_request' && onAction && (
            <div className="flex gap-2 mt-2.5" onClick={(e) => e.stopPropagation()}>
              <button 
                type="button"
                onClick={() => onAction(notification.id, 'accept_follow')}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 font-black uppercase text-[9px] tracking-wider rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isProcessing ? 'Processing...' : 'Accept'}
              </button>
              <button 
                type="button"
                onClick={() => onAction(notification.id, 'reject_follow')}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 font-black uppercase text-[9px] tracking-wider rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isProcessing ? 'Processing...' : 'Decline'}
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Post Preview Image when available */}
        {notification.metadata?.postImage && (
          <div className="shrink-0 w-11 h-11 rounded-xl overflow-hidden border border-white/10 bg-black/40">
            <img src={notification.metadata.postImage} className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </motion.div>
  );
};
