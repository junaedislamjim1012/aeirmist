import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Repeat2, MoreHorizontal, Share2, Sparkles, Eye, BarChart3, ShieldCheck } from 'lucide-react';
import { useAeirmist } from '../../context/AeirmistContext';
import { useReport } from '../reporting/ReportContext';
import { usePostAnalytics } from '../../hooks/usePostAnalytics';
import { postAnalytics } from '../../services/PostAnalyticsService';
import { InsightsDashboard } from '../analytics/InsightsDashboard';
import { PostMenu } from '../PostMenu';

interface QuartCardProps {
  post: {
    id: string;
    authorName: string;
    authorId?: string;
    userId?: string;
    authorPhoto: string;
    content: string;
    auraCount: number;
    viewsCount?: number;
    commentsCount?: number;
    repostsCount?: number;
    likedBy?: string[];
    savedBy?: string[];
    timestamp: string;
    isNgl?: boolean;
    isArchived?: boolean;
    author?: {
      displayName?: string;
      photoURL?: string;
      username?: string;
      isVerified?: boolean;
    };
    isVerified?: boolean;
  };
  onUserClick?: (user: any) => void;
  onCommentClick?: (post: any) => void;
}

export const QuartCard: React.FC<QuartCardProps> = ({ post, onUserClick, onCommentClick }) => {
  const { openReportModal } = useReport();
  const { profile, toggleLike, toggleBookmark, deletePost, archivePost, addToast, earnPoints } = useAeirmist();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isLiked = profile && post.likedBy?.includes(profile.id);
  const isSaved = profile && post.savedBy?.includes(profile.id);
  const postAuthorId = post.authorId || post.userId || (post as any).author?.id || (post as any).authorUid;
  const isOwnPost = Boolean(profile?.id && postAuthorId && (postAuthorId === profile.id || postAuthorId === profile.uid));
  const isVerified = post.isVerified || post.author?.isVerified;

  usePostAnalytics({ postId: post.id, type: 'text' });

  const charLimit = 280;
  const isLong = (post.content || '').length > charLimit;
  const displayContent = isExpanded || !isLong ? (post.content || '') : (post.content || '').slice(0, charLimit) + '...';

  const handleAuthorClick = () => {
    postAnalytics.trackProfileClick(post.id);
    const targetUid = post.authorId || post.userId;
    if (!targetUid) return;
    onUserClick?.({
      id: targetUid,
      displayName: (post.authorName && post.authorName !== 'Identity_Null' ? post.authorName : '') || post.author?.displayName || 'Aeirmist User',
      photoURL: post.authorPhoto || post.author?.photoURL || '',
      username: (post.authorName && post.authorName !== 'Identity_Null' ? post.authorName : (post.author?.displayName || 'identity')).toLowerCase().replace(/\s+/g, '_')
    });
  };

  const handleRepost = async () => {
    if (addToast) {
      addToast({
        title: 'SHARED',
        message: 'This transmission has been echoed to your Feed.',
        type: 'success'
      });
    }
    if (earnPoints) earnPoints(10);
  };

  const handleShare = async () => {
    const shareUrl = window.location.origin + `/post/${post.id}`;
    let shared = false;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Transmission by ${post.authorName}`,
          text: post.content,
          url: shareUrl,
        });
        shared = true;
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          console.warn("Share aborted, copying link:", e);
        } else {
          return;
        }
      }
    }
    if (!shared) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        if (addToast) {
          addToast({
            title: 'LINK ENCRYPTED',
            message: 'Transmission wave URL copied to clipboard.',
            type: 'success'
          });
        }
      } catch (err) {
        console.error("Clipboard copy failed:", err);
      }
    }
    if (earnPoints) earnPoints(5);
  };

  const handleToggleBookmark = async () => {
    if (!profile) return;
    try {
      await toggleBookmark(post.id, !!isSaved);
      if (!isSaved && addToast) {
        addToast({
          title: 'SAVED',
          message: 'Transmission successfully mapped to your memory logs.',
          type: 'success'
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!isOwnPost) return;
    try {
      await deletePost(post.id);
      if (addToast) {
        addToast({
          title: 'Delete Complete',
          message: 'The content has been removed.',
          type: 'success'
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleArchive = async () => {
    if (!isOwnPost) return;
    try {
      await archivePost(post.id, !post.isArchived);
      if (addToast) {
        addToast({
          title: post.isArchived ? 'RESTORATION INITIATED' : 'ARCHIVAL INITIATED',
          message: post.isArchived ? 'Transmission restored to active feed.' : 'Transmission archived.',
          type: 'success'
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div 
      id={`post-${post.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full border-b border-white/5 py-6 px-4 hover:bg-white/[0.02] transition-colors group relative font-sans"
    >
      <div className="flex gap-4">
        {/* Left Side: Avatar */}
        <div className="flex-shrink-0">
          <div 
            className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/5 cursor-pointer hover:border-aeirmist-cyan transition-all shadow-[0_0_15px_-5px_rgba(255,255,255,0.1)] hover:shadow-[0_0_15px_-5px_rgba(0,242,255,0.3)]"
            onClick={handleAuthorClick}
          >
            <img 
              src={post.authorPhoto || post.author?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorName || post.authorId || 'aura'}`} 
              alt={post.authorName} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="flex-grow min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 min-w-0" onClick={handleAuthorClick}>
              <span className="font-bold text-white text-[15px] hover:underline cursor-pointer truncate leading-none">
                {(post.authorName && post.authorName !== 'Identity_Null' ? post.authorName : '') || post.author?.displayName || 'Aeirmist User'}
              </span>
              {isVerified && (
                <ShieldCheck className="text-aeirmist-cyan shrink-0" size={14} />
              )}
              <span className="text-white/20 text-[13px] font-medium truncate leading-none">
                @{ post.author?.username || (post.authorName && post.authorName !== 'Identity_Null' ? post.authorName : (post.author?.displayName || 'identity')).toLowerCase().replace(/\s+/g, '_') }
              </span>
              <span className="text-white/20 text-[13px]">·</span>
              <span className="text-white/20 text-[11px] font-bold uppercase tracking-tighter leading-none pt-0.5">
                {post.timestamp || 'Recent'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isOwnPost && (
                <button 
                  onClick={() => setShowInsights(true)}
                  className="text-aeirmist-cyan/40 hover:text-aeirmist-cyan p-1 hover:bg-aeirmist-cyan/5 rounded transition-colors"
                  title="View Analytics"
                >
                  <BarChart3 size={16} />
                </button>
              )}
              <button 
                onClick={() => setIsMenuOpen(true)}
                className="text-white/20 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
              >
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>

          {/* Special Type Badge (e.g. NGL) */}
          {post.isNgl && (
            <div className="flex items-center gap-1 mb-2 px-2 py-0.5 rounded-md bg-aeirmist-magenta/10 border border-aeirmist-magenta/20 w-fit">
              <span className="text-[8px] font-black uppercase text-aeirmist-magenta tracking-[0.2em]">NGL REPLY</span>
            </div>
          )}

          {/* Content */}
          <div className="text-[16px] leading-[1.6] text-white/90 whitespace-pre-wrap break-words mb-4 pr-4 selection:bg-aeirmist-cyan/30">
            {displayContent}
            {isLong && !isExpanded && (
              <button 
                onClick={() => setIsExpanded(true)}
                className="text-aeirmist-cyan text-[14px] font-bold ml-1 hover:underline cursor-pointer"
              >
                Show More
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between max-w-md text-white/40">
            <button 
              onClick={() => toggleLike(post.id, !!isLiked)}
              className={`flex items-center gap-1.5 transition-all text-[12px] font-bold group/btn ${isLiked ? 'text-aeirmist-magenta' : 'hover:text-aeirmist-magenta'}`}
            >
              <div className={`p-2 rounded-full transition-colors ${isLiked ? 'bg-aeirmist-magenta/10' : 'group-hover/btn:bg-aeirmist-magenta/10'}`}>
                <Heart size={18} className={isLiked ? 'fill-aeirmist-magenta outline-none' : 'outline-none'} />
              </div>
              <span className="min-w-[12px] text-left">{post.auraCount || (post as any).likesCount || 0}</span>
            </button>

            <button 
              onClick={() => onCommentClick?.(post)}
              className="flex items-center gap-1.5 transition-all text-[12px] font-bold group/btn hover:text-aeirmist-cyan"
            >
              <div className="p-2 rounded-full group-hover/btn:bg-aeirmist-cyan/10 transition-colors">
                <MessageCircle size={18} />
              </div>
              <span className="min-w-[12px] text-left">{post.commentsCount || 0}</span>
            </button>

            <div className="flex items-center gap-1.5 text-[12px] font-bold transition-all text-white/20">
              <div className="p-2">
                <Eye size={18} />
              </div>
              <span className="min-w-[12px] text-left">{post.viewsCount || 0}</span>
            </div>

            <button 
              onClick={handleRepost}
              className="flex items-center gap-1.5 transition-all text-[12px] font-bold group/btn hover:text-aeirmist-lime"
            >
              <div className="p-2 rounded-full group-hover/btn:bg-aeirmist-lime/10 transition-colors">
                <Repeat2 size={18} />
              </div>
              <span className="min-w-[12px] text-left">{post.repostsCount || 0}</span>
            </button>

            <button 
              onClick={handleShare}
              className="flex items-center gap-1.5 transition-all text-[12px] font-bold group/btn hover:text-white/80"
            >
               <div className="p-2 rounded-full group-hover/btn:bg-white/10 transition-colors">
                <Share2 size={18} />
              </div>
            </button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showInsights && (
          <InsightsDashboard postId={post.id} onClose={() => setShowInsights(false)} />
        )}
      </AnimatePresence>

      <PostMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        postId={post.id}
        authorName={post.authorName}
        isOwnPost={!!isOwnPost}
        isSaved={isSaved}
        onSave={handleToggleBookmark}
        onViewInsights={() => setShowInsights(true)}
        onReport={() => openReportModal('post', post.id, postAuthorId)}
        onDelete={isOwnPost ? handleDelete : undefined}
        onArchive={isOwnPost ? handleArchive : undefined}
        isArchived={post.isArchived}
        onShare={handleShare}
      />
    </motion.div>
  );
};
