import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Maximize2,
  ShieldCheck,
  MoreHorizontal,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { formatAeirmistTimestamp } from '../../lib/date';
import { Video } from '../../types/videos';
import { getAvatarUrl } from '../../lib/avatar';
import { useAeirmist } from '../../context/AeirmistContext';
import { VideoMenu } from './VideoMenu';
import { ForwardModal } from '../messenger/ForwardModal';
import { collection, query, onSnapshot, where, limit, doc, updateDoc, increment } from 'firebase/firestore';

interface VideoCardProps {
  video: Video;
  onUserClick: (userData: any) => void;
  onCommentClick: (video: Video) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onUserClick, onCommentClick }) => {
  const { addToast, profile, db, publishStory, deleteVideo, editVideo, sendMessage } = useAeirmist();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewCountedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(() => profile?.id ? (video.likedBy || []).includes(profile.id) : false);
  const [isSaved, setIsSaved] = useState(() => profile?.id ? (video.savedBy || []).includes(profile.id) : false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [isCaptionModalOpen, setIsCaptionModalOpen] = useState(false);
  const [captionDraft, setCaptionDraft] = useState(video.caption || '');
  const [chats, setChats] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.id) {
      setIsLiked((video.likedBy || []).includes(profile.id));
      setIsSaved((video.savedBy || []).includes(profile.id));
    }
  }, [profile?.id, video.likedBy, video.savedBy]);

  const isOwner = profile?.id === video.creatorId;

  // Load chats for forwarding
  useEffect(() => {
    if (!db || !profile) return;
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', profile.id),
      limit(20)
    );
    return onSnapshot(q, (snap) => {
      const chatList = snap.docs.map(doc => {
        const data = doc.data();
        const otherParticipant = data.participants.find((p: string) => p !== profile.id);
        // This is a simplification, ideally we fetch the profile for the other participant
        return {
          id: doc.id,
          name: data.title || 'Direct Signal',
          photo: data.photoURL || 'https://picsum.photos/seed/chat/200/200'
        };
      });
      setChats(chatList);
    });
  }, [db, profile]);

  // Intersection Observer for autoplay
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.25 // Trigger when 25% is visible for smoother scrolling autoplay
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          videoRef.current?.play().then(() => {
            incrementViewCount();
          }).catch(e => console.log('Autoplay prevented', e));
          setIsPlaying(true);
        } else {
          videoRef.current?.pause();
          setIsPlaying(false);
        }
      });
    }, options);

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().then(() => {
          incrementViewCount();
        }).catch(e => console.log('Play prevented', e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleShare = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsForwardModalOpen(true);
  };

  const handleForward = async (conversationId: string) => {
    try {
      await sendMessage(
        conversationId,
        `Shared a video: ${video.caption}`,
        'video',
        video.videoURL,
        { videoId: video.id, thumbnailURL: video.thumbnailURL }
      );
      setIsForwardModalOpen(false);
      addToast({
        title: 'VIDEO FORWARDED',
        message: 'Message successfully sent.',
        type: 'success'
      });
    } catch (err) {
      addToast({
        title: 'FORWARD ERROR',
        message: 'Failed to send message.',
        type: 'warning'
      });
    }
  };

  const handleShareToStory = async () => {
    try {
      await publishStory({
        url: video.videoURL,
        type: 'video',
        mode: 'VIDEO_SHARE',
        textLayers: [{ text: 'Check this out!' }]
      });
      addToast({
        title: 'STORY SHARED',
        message: 'Video mirrored to your story stream.',
        type: 'success'
      });
    } catch (err) {
      addToast({
        title: 'STORY ERROR',
        message: 'Failed to broadcast mirror.',
        type: 'warning'
      });
    }
  };

  const handleEdit = () => {
    setCaptionDraft(video.caption || '');
    setIsCaptionModalOpen(true);
  };

  const handleSubmitCaption = async () => {
    if (captionDraft !== video.caption) {
      await editVideo(video.id, captionDraft);
    }
    setIsCaptionModalOpen(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this video? This action is irreversible.')) {
      await deleteVideo(video.id, video.videoURL, video.thumbnailURL);
    }
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  const incrementViewCount = async () => {
    if (!viewCountedRef.current && db && video.id) {
      viewCountedRef.current = true;
      try {
        await updateDoc(doc(db, 'videos', video.id), {
          viewCount: increment(1)
        });
      } catch (err) {
        console.error('Failed to increment view count:', err);
      }
    }
  };

  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isLiked;
    setIsLiked(nextState);

    if (!profile?.id || !db) {
      if (nextState) {
        addToast({ title: 'SYNC SUCCESS', message: 'Video liked.', type: 'success' });
      }
      return;
    }

    try {
      const likedByList = video.likedBy || [];
      const updatedList = nextState
        ? Array.from(new Set([...likedByList, profile.id]))
        : likedByList.filter(id => id !== profile.id);

      await updateDoc(doc(db, 'videos', video.id), {
        likedBy: updatedList,
        likeCount: updatedList.length
      });

      if (nextState) {
        addToast({
          title: 'SYNC SUCCESS',
          message: 'Video liked.',
          type: 'success'
        });
      }
    } catch (err) {
      console.error('Failed to update like status:', err);
      setIsLiked(!nextState);
    }
  };

  const toggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isSaved;
    setIsSaved(nextState);

    if (!profile?.id || !db) {
      addToast({
        title: nextState ? 'STREAM ARCHIVED' : 'REMOVED FROM ARCHIVE',
        message: nextState ? 'Added to your permanent storage.' : 'Removed from your local memory bank.',
        type: nextState ? 'success' : 'info'
      });
      return;
    }

    try {
      const savedByList = video.savedBy || [];
      const updatedList = nextState
        ? Array.from(new Set([...savedByList, profile.id]))
        : savedByList.filter(id => id !== profile.id);

      await updateDoc(doc(db, 'videos', video.id), {
        savedBy: updatedList,
        saveCount: updatedList.length
      });

      addToast({
        title: nextState ? 'STREAM ARCHIVED' : 'REMOVED FROM ARCHIVE',
        message: nextState ? 'Added to your permanent storage.' : 'Removed from your local memory bank.',
        type: nextState ? 'success' : 'info'
      });
    } catch (err) {
      console.error('Failed to update save status:', err);
      setIsSaved(!nextState);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p || 0);
    }
  };

  const [playbackRate, setPlaybackRate] = useState(1);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const lastTapRef = useRef<number>(0);

  const handleVideoAreaClick = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap detected
      if (!isLiked) {
        toggleLike(e);
      }
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 800);
    } else {
      togglePlay();
    }
    lastTapRef.current = now;
  };

  const togglePlaybackRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rates = [1, 1.25, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
    addToast({
      title: 'Playback Speed Updated',
      message: `Speed set to ${nextRate}x.`,
      type: 'info'
    });
  };

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="w-full max-w-2xl mx-auto mb-4 sm:mb-8 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-3xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl"
    >
      {/* Header */}
      <div className="p-3.5 sm:p-5 flex items-center justify-between border-b border-white/5">
        <div 
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
          onClick={() => onUserClick({ uid: video.creatorId, username: video.creatorName, displayName: video.creatorName, photoURL: video.creatorAvatar })}
        >
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl overflow-hidden border border-aeirmist-cyan/30">
            <img src={video.creatorAvatar} alt={video.creatorName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-white group-hover:text-aeirmist-cyan transition-colors">{video.creatorName}</span>
              {video.isVerified && <ShieldCheck size={10} className="text-aeirmist-cyan shrink-0 sm:w-3 sm:h-3" />}
            </div>
            <p className="text-[8px] sm:text-[10px] font-mono text-white/40 uppercase tracking-widest">
              {formatAeirmistTimestamp(video.createdAt)} • Node Signal
            </p>
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsMenuOpen(true); }}
          className="p-1.5 sm:p-2 text-white/30 hover:text-white transition-colors"
        >
          <MoreHorizontal size={16} className="sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Video Player Section */}
      <div className="relative aspect-video bg-black flex items-center justify-center group cursor-pointer" onClick={handleVideoAreaClick}>
        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-aeirmist-magenta mb-4">Signal Transmission Failure</p>
            <button 
              onClick={handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
            >
              <RotateCcw size={12} /> Retry Uplink
            </button>
          </div>
        ) : (
          <video 
            ref={videoRef}
            src={video.videoURL}
            poster={video.thumbnailURL || video.videoURL}
            className={`w-full h-full object-contain transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            loop
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onLoadedData={() => setIsLoading(false)}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
            playsInline
          />
        )}

        {/* Double-tap Heart Burst Animation */}
        <AnimatePresence>
          {showHeartAnim && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.4, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute pointer-events-none z-30"
            >
              <Heart size={80} className="text-aeirmist-magenta fill-aeirmist-magenta drop-shadow-[0_0_20px_rgba(255,0,128,0.8)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Spinner */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <Loader2 className="w-10 h-10 text-aeirmist-cyan animate-spin" />
          </div>
        )}

        {/* Overlay Controls */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
           {!isPlaying && (
             <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
               <Play size={32} className="text-white fill-white ml-1" />
             </div>
           )}
        </div>

        {/* Corner Controls */}
        <div className="absolute bottom-2.5 right-2.5 sm:bottom-4 sm:right-4 flex gap-1.5 sm:gap-2 z-20">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={togglePlaybackRate}
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white font-mono text-[10px] sm:text-xs font-bold transition-all hover:bg-white/10"
          >
            {playbackRate}x
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMute}
            className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white transition-all hover:bg-white/10"
          >
            {isMuted ? <VolumeX size={15} className="sm:w-[18px] sm:h-[18px]" /> : <Volume2 size={15} className="sm:w-[18px] sm:h-[18px]" />}
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleFullscreen}
            className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white transition-all hover:bg-white/10"
          >
            <Maximize2 size={15} className="sm:w-[18px] sm:h-[18px]" />
          </motion.button>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div 
            className="h-full bg-aeirmist-cyan shadow-[0_0_10px_rgba(0,242,255,0.8)] transition-all duration-100" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      {/* Caption & Metadata */}
      <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        <p className="text-xs sm:text-[13px] text-white/90 leading-relaxed font-medium">
          {video.caption}
        </p>

        <div className="flex items-center justify-between pt-1 sm:pt-2">
           <div className="flex items-center gap-3 sm:gap-6">
              <button 
                onClick={toggleLike}
                className="flex items-center gap-1.5 sm:gap-2 group"
              >
                <div className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition-all ${isLiked ? 'bg-aeirmist-magenta/20 text-aeirmist-magenta' : 'bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-aeirmist-magenta'}`}>
                  <Heart size={16} className={`${isLiked ? 'fill-current' : ''} sm:w-[18px] sm:h-[18px]`} />
                </div>
                <div className="flex flex-col">
                  <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${isLiked ? 'text-aeirmist-magenta' : 'text-white/40'}`}>
                    {(video.likeCount + (isLiked ? 1 : 0)).toLocaleString()}
                  </span>
                </div>
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); onCommentClick(video); }}
                className="flex items-center gap-1.5 sm:gap-2 group"
              >
                <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-aeirmist-cyan transition-all">
                  <MessageCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-aeirmist-cyan transition-colors">
                  {video.commentCount.toLocaleString()}
                </span>
              </button>

              <button 
                onClick={handleShare}
                className="flex items-center gap-1.5 sm:gap-2 group"
              >
                <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white transition-all">
                  <Share2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
              </button>
           </div>

           <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex flex-col items-end mr-1 sm:mr-2">
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white/20">Syncs</span>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-white/40">{video.viewCount.toLocaleString()}</span>
              </div>
              <button 
                onClick={toggleSave}
                className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition-all ${isSaved ? 'bg-aeirmist-lime/20 text-aeirmist-lime' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}
              >
                <Bookmark size={16} className={`${isSaved ? 'fill-current' : ''} sm:w-[18px] sm:h-[18px]`} />
              </button>
           </div>
        </div>
      </div>

      <VideoMenu 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        video={video}
        isOwner={isOwner}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onShareToInbox={() => setIsForwardModalOpen(true)}
        onShareToStory={handleShareToStory}
      />

      <AnimatePresence>
        {isForwardModalOpen && (
          <ForwardModal 
            onClose={() => setIsForwardModalOpen(false)}
            onForward={handleForward}
            chats={chats}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCaptionModalOpen && (
          <div
            className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setIsCaptionModalOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm p-6 rounded-3xl bg-[#0a0c10] border border-white/10"
            >
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Edit Caption</h3>
              <textarea
                autoFocus
                value={captionDraft}
                onChange={(e) => setCaptionDraft(e.target.value)}
                rows={4}
                placeholder="Write a caption..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-aeirmist-cyan/50 resize-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setIsCaptionModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-white/50 text-[10px] font-black uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitCaption}
                  className="flex-1 py-3 rounded-xl bg-aeirmist-cyan text-black text-[10px] font-black uppercase tracking-widest"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
