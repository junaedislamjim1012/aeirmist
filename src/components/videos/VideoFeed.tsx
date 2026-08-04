import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  TrendingUp, 
  Clock, 
  Bookmark, 
  Grid, 
  List,
  Search,
  Zap,
  ArrowLeft,
  ChevronRight,
  X,
  Send,
  Smile,
  MessageCircle,
  UploadCloud,
  Sliders,
  Sparkles,
  Heart,
  Pin
} from 'lucide-react';
import { VideoCard } from './VideoCard';
import { Video } from '../../types/videos';
import { useAeirmist } from '../../context/AeirmistContext';
import { useAppearance } from '../../context/AppearanceContext';
import { collection, onSnapshot, query, getDocs, doc, setDoc, updateDoc, addDoc } from 'firebase/firestore';
import { AeirmistVideoUploader } from './AeirmistVideoUploader';
import { AeirmistCreatorStudio } from './AeirmistCreatorStudio';

interface VideoFeedProps {
  onBack: () => void;
  onUserClick: (userData: any) => void;
  initialVideoId?: string | null;
  onVideoClick?: (id: string | null) => void;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({ 
  onBack, 
  onUserClick,
  initialVideoId,
  onVideoClick
}) => {
  const { settings } = useAppearance();
  const isGlobalBgActive = settings.globalBgType !== 'none' && !!settings.globalBgValue;
  const { profile, addToast, db } = useAeirmist();
  const [activeFilter, setActiveFilter] = useState<'following' | 'trending' | 'recommended' | 'saved'>('trending');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Real DB state + fallback combinations
  const [dbVideos, setDbVideos] = useState<Video[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  // Modal displays
  const [showUploader, setShowUploader] = useState(false);
  const [showStudio, setShowStudio] = useState(false);

  // Listen to the 'videos' collection in real-time
  useEffect(() => {
    if (!db) {
      setDbVideos([]);
      return;
    }
    const q = collection(db, 'videos');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as Video);
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setDbVideos(list);
    }, (error) => {
      console.error('[VideoFeed] Real-time snap error:', error);
    });

    return () => unsubscribe();
  }, []);

  // Handle deep link loading
  useEffect(() => {
    if (initialVideoId && !selectedVideo && videos.length > 0) {
      const match = videos.find(v => v.id === initialVideoId);
      if (match) setSelectedVideo(match);
    }
  }, [initialVideoId, videos]);

  // Sync selection back for URL sync
  useEffect(() => {
    if (selectedVideo?.id !== initialVideoId) {
      onVideoClick?.(selectedVideo?.id || null);
    }
  }, [selectedVideo?.id]);
  // Filter and Search Combiner of Live DB
  useEffect(() => {
    // Only use live uploads to ensure rich data
    const allCombined = [...dbVideos];
    
    // De-duplicate items by ID
    const seen = new Set();
    let filtered = allCombined.filter(v => {
      const isDuplicate = seen.has(v.id);
      seen.add(v.id);
      return !isDuplicate;
    });

    if (searchTerm) {
      filtered = filtered.filter(v => 
        v.caption.toLowerCase().includes(searchTerm.toLowerCase()) || 
        v.creatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.tags && v.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (v.category && v.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Sort logic and custom filters
    if (activeFilter === 'saved') {
      // Show videos that are locally saved by the profile ID
      if (profile?.id) {
        filtered = filtered.filter(v => v.savedBy && v.savedBy.includes(profile.id));
      } else {
        filtered = [];
      }
    } else if (activeFilter === 'following') {
      if (profile?.social?.following) {
        filtered = filtered.filter(v => profile.social.following.includes(v.creatorId) || profile.social.following.includes(`profile_${v.creatorId}`));
      } else {
        filtered = [];
      }
    } else if (activeFilter === 'recommended') {
      // Sorting priority: views
      filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    } else {
      // Trending sorting combined likes & views
      filtered.sort((a, b) => ((b.likeCount || 0) + (b.viewCount || 0)) - ((a.likeCount || 0) + (a.viewCount || 0)));
    }

    setVideos(filtered);
  }, [activeFilter, searchTerm, dbVideos, profile?.id]);

  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'grid' : 'list');
    addToast({
      title: 'VIEW PORTAL UPDATED',
      message: `Switched to ${viewMode === 'list' ? 'Grid' : 'Sequential Stream'}.`,
      type: 'info'
    });
  };

  const handleUploadSuccess = (newVideo: any) => {
    setShowUploader(false);
    // Realtime snap handles state insertion automatically
  };

  const isCreatorAccount = profile?.accountType === 'professional' || profile?.accountType === 'business';

  return (
    <div className={`flex flex-col h-full ${isGlobalBgActive ? 'bg-[#050505]/40 backdrop-blur-xl' : 'bg-[#050505]'} relative overflow-hidden font-sans`}>
      
      {/* Background Aesthetic */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-aeirmist-cyan/5 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-aeirmist-magenta/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header / Sub-Nav */}
      <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-3xl border-b border-white/5 px-4 py-3 sm:px-6 sm:py-4 flex flex-row items-center justify-between gap-3 md:gap-6">
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <motion.button 
            whileHover={{ x: -4 }}
            onClick={onBack}
            className="p-1.5 rounded-full bg-white/5 border border-white/10 text-white/44 hover:text-white shrink-0"
          >
            <ArrowLeft size={16} className="sm:size-[18px]" />
          </motion.button>
          
          <div className="flex items-center gap-2 sm:gap-3">
             <div className="hidden sm:flex w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-aeirmist-cyan/10 items-center justify-center border border-aeirmist-cyan/30 text-aeirmist-cyan shadow-[0_0_12px_rgba(0,242,255,0.15)] sm:shadow-[0_0_15px_rgba(0,242,255,0.2)] shrink-0">
               <Play size={14} className="fill-current sm:scale-125 text-aeirmist-cyan" />
             </div>
             <div className="min-w-0">
                <h1 className="text-sm sm:text-xl font-bold tracking-tight text-white uppercase tracking-[0.1em] truncate">Video Feed</h1>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                    <span className="text-[7.5px] sm:text-[9px] font-black uppercase tracking-widest text-white/40 truncate">Broadcasting Active Node</span>
                </div>
             </div>
          </div>
        </div>

        {/* Global Search for Videos */}
        <div className="flex-1 max-w-sm mx-auto hidden md:block">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-aeirmist-cyan transition-colors" size={16} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search streams or categories..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-12 pr-6 text-xs text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-aeirmist-cyan/30 focus:border-aeirmist-cyan/40 transition-all font-bold"
              />
           </div>
        </div>

        {/* Action Controls: Broadcast + Creator Dashboard */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* Studio Upgrade notice helper if personal */}
          {!isCreatorAccount && (
            <button
              onClick={() => {
                addToast({
                  title: 'CREATOR DISCOVERY',
                  message: 'Shift your account tier inside Studio Settings (gear icon) to unlock Professional Creator Dashboard tools.',
                  type: 'info'
                });
                setShowStudio(true); // Open settings inside studio directly
              }}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 border border-aeirmist-magenta/20 bg-aeirmist-magenta/10 hover:bg-aeirmist-magenta/20 text-[8px] sm:text-[9.5px] text-white/80 font-black uppercase tracking-widest rounded-lg sm:rounded-xl transition-all shrink-0 shadow-[0_0_8px_rgba(251,0,122,0.1)] hover:shadow-[0_0_15px_rgba(251,0,122,0.2)]"
            >
              Get Studio
            </button>
          )}

          {/* Broadcast upload node button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowUploader(true)}
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-aeirmist-cyan hover:bg-opacity-90 text-black text-[8px] sm:text-[9.5px] font-black uppercase tracking-widest rounded-lg sm:rounded-xl transition-all shadow-[0_0_12px_rgba(0,242,255,0.25)] flex items-center gap-1 sm:gap-1.5 shrink-0"
          >
            <UploadCloud size={11} className="sm:size-[13px]" /> Broadcast
          </motion.button>

          {/* Creator studio button (Only Professional or Business accounts see this as required) */}
          {isCreatorAccount && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowStudio(true)}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[8px] sm:text-[9.5px] font-black uppercase tracking-widest rounded-lg sm:rounded-xl transition-all flex items-center gap-1 sm:gap-1.5 shrink-0"
            >
              <Sliders size={11} className="text-aeirmist-cyan sm:size-[13px]" /> Studio
            </motion.button>
          )}

          <div className="w-px h-6 bg-white/10 hidden md:block" />
          <button 
            type="button"
            onClick={toggleViewMode}
            className="hidden md:flex p-2.5 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white transition-all"
          >
            {viewMode === 'list' ? <Grid size={18} /> : <List size={18} />}
          </button>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="px-2.5 py-2 sm:px-6 sm:py-3 flex items-center justify-between sm:justify-start gap-1 sm:gap-3 border-b border-white/5 overflow-x-auto no-scrollbar scroll-smooth">
          <FilterTab 
            id="trending" 
            label="Trending" 
            icon={<TrendingUp size={13} />} 
            active={activeFilter === 'trending'} 
            onClick={() => setActiveFilter('trending')} 
          />
          <FilterTab 
            id="following" 
            label="Following" 
            icon={<Zap size={13} />} 
            active={activeFilter === 'following'} 
            onClick={() => setActiveFilter('following')} 
          />
          <FilterTab 
            id="recommended" 
            label="Featured" 
            icon={<Clock size={13} />} 
            active={activeFilter === 'recommended'} 
            onClick={() => setActiveFilter('recommended')} 
          />
          <FilterTab 
            id="saved" 
            label="Saved" 
            icon={<Bookmark size={13} />} 
            active={activeFilter === 'saved'} 
            onClick={() => setActiveFilter('saved')} 
          />
      </div>

      {/* Scrollable Feed Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar scroll-smooth p-4 sm:p-6 pb-24 sm:pb-32">
        <div className={`max-w-6xl mx-auto ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
           <AnimatePresence mode="popLayout">
             {videos.length > 0 ? (
               videos.map((video) => (
                 <div key={video.id} className={viewMode === 'grid' ? 'h-fit' : ''}>
                   <VideoCard 
                    video={video} 
                    onUserClick={onUserClick} 
                    onCommentClick={setSelectedVideo}
                   />
                 </div>
               ))
             ) : (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="flex flex-col items-center justify-center pt-20 text-center col-span-full font-mono"
               >
                 <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-white/10 mb-6">
                    {searchTerm ? <Search size={40} /> : <Play size={40} />}
                 </div>
                 <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">
                   {searchTerm ? 'No results' : 'Loading videos...'}
                 </h2>
                 <p className="text-sm text-white/20 max-w-[240px] font-medium leading-relaxed uppercase tracking-widest text-[9px]">
                   {searchTerm ? 'No video streams found matching your query.' : 'Loading videos....'}
                 </p>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* Comment Drawer (Facebook Threaded comment layout) */}
      <AnimatePresence>
        {selectedVideo && (
          <VideoCommentDrawer 
            video={selectedVideo} 
            onClose={() => setSelectedVideo(null)} 
          />
        )}
      </AnimatePresence>

      {/* Broadcast Uplink Uploader modal */}
      <AnimatePresence>
        {showUploader && (
          <AeirmistVideoUploader 
            onClose={() => setShowUploader(false)} 
            onUploadSuccess={handleUploadSuccess} 
          />
        )}
      </AnimatePresence>

      {/* Professional Creator Studio Suite dashboard */}
      <AnimatePresence>
        {showStudio && (
          <AeirmistCreatorStudio 
            onClose={() => setShowStudio(false)} 
            onNavigateToVideo={(vId) => {
              setShowStudio(false);
              const elementVid = videos.find(v => v.id === vId);
              if (elementVid) {
                setSelectedVideo(elementVid);
              }
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

// Thread component
interface CommentDoc {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
  likeCount: number;
  likedBy: string[];
  isPinned: boolean;
  isHearted: boolean;
  replies?: any[];
}

const VideoCommentDrawer = ({ video, onClose }: { video: Video; onClose: () => void }) => {
  const { profile, addToast, db } = useAeirmist();
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState<CommentDoc[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyInputText, setReplyInputText] = useState('');
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [visibleRepliesMap, setVisibleRepliesMap] = useState<Record<string, boolean>>({});

  // Fetch comments for selection
  useEffect(() => {
    if (!db || !video?.id) return;
    const q = collection(db, 'videos', video.id, 'comments');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as CommentDoc);
      // Sort pinned first, then newest
      list.sort((a,b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setCommentsList(list);
    });

    return () => unsubscribe();
  }, [video?.id]);

  const handlePostComment = async () => {
    if (!commentText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const id = 'com_' + Date.now().toString(36);
      const newComment = {
        userId: profile?.id || 'guest_user',
        userName: profile?.displayName || profile?.username || 'Guest Viewer',
        userAvatar: profile?.photoURL || 'https://picsum.photos/seed/comment/100/100',
        text: commentText,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        likedBy: [],
        isPinned: false,
        isHearted: false,
        replies: []
      };

      if (db) {
        await setDoc(doc(db, 'videos', video.id, 'comments', id), newComment);
        // Increment video commentCount counter
        await updateDoc(doc(db, 'videos', video.id), {
          commentCount: (video.commentCount || 0) + 1
        });
      }
      setCommentText('');
      addToast({
        title: 'COMMENT DISPATCHED',
        message: 'Video saved to your profile.',
        type: 'success'
      });
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (com: CommentDoc) => {
    if (!profile?.id || !db) return;
    try {
      const isLiked = com.likedBy && com.likedBy.includes(profile.id);
      const newLikesList = isLiked 
        ? com.likedBy.filter(id => id !== profile.id)
        : [...(com.likedBy || []), profile.id];

      await updateDoc(doc(db, 'videos', video.id, 'comments', com.id), {
        likedBy: newLikesList,
        likeCount: newLikesList.length
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleHeartComment = async (com: CommentDoc) => {
    // Only creator of the video can heart comments
    if (profile?.id !== video.creatorId || !db) return;
    try {
      await updateDoc(doc(db, 'videos', video.id, 'comments', com.id), {
        isHearted: !com.isHearted
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handlePinComment = async (com: CommentDoc) => {
    // Only creator of video can pin comments
    if (profile?.id !== video.creatorId || !db) return;
    try {
      await updateDoc(doc(db, 'videos', video.id, 'comments', com.id), {
        isPinned: !com.isPinned
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostReply = async (com: CommentDoc) => {
    if (!replyInputText.trim() || !db) return;
    try {
      const replyItem = {
        id: 'rep_' + Date.now().toString(36),
        userId: profile?.id || 'guest_user',
        userName: profile?.displayName || profile?.username || 'Guest Viewer',
        userAvatar: profile?.photoURL || 'https://picsum.photos/seed/rep/100/100',
        text: replyInputText,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        likedBy: []
      };

      const updatedReplies = [...(com.replies || []), replyItem];
      await updateDoc(doc(db, 'videos', video.id, 'comments', com.id), {
        replies: updatedReplies
      });

      setReplyInputText('');
      setReplyingCommentId(null);
      // Ensure replies are visible
      setVisibleRepliesMap(prev => ({ ...prev, [com.id]: true }));
      addToast({
        title: 'REPLY TRANSMITTED',
        message: 'Reply posted.',
        type: 'success'
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col h-[85vh] shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Head */}
        <div className="p-6 flex items-center justify-between border-b border-white/5 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-xl z-20">
          <div className="flex items-center gap-3 text-left">
             <div className="w-8 h-8 rounded-xl bg-aeirmist-cyan/10 flex items-center justify-center text-aeirmist-cyan">
               <MessageCircle size={16} />
             </div>
             <div>
               <h3 className="font-black text-[11px] uppercase tracking-[0.2em] text-white">Transmissions Lab</h3>
               <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">{video.caption.substring(0, 30)}...</span>
             </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Comment log tree */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
           {commentsList.length > 0 ? (
             commentsList.map((com) => {
               const hasLiked = profile?.id ? com.likedBy && com.likedBy.includes(profile.id) : false;
               const showReplies = !!visibleRepliesMap[com.id];

               return (
                 <div key={com.id} className="flex gap-4 select-none mr-1 select-none text-left">
                   <img src={com.userAvatar} className="w-10 h-10 rounded-xl object-cover border border-white/5 shrink-0" />
                   
                   <div className="flex-1 space-y-1.5 min-w-0 font-sans">
                     
                     <div className="flex items-start justify-between">
                       <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#00f225]">{com.userName}</span>
                          <span className="text-[8px] font-bold text-white/20 font-mono uppercase">
                            {new Date(com.createdAt).toLocaleDateString()}
                          </span>
                       </div>

                       <div className="flex items-center gap-1">
                         {/* Pin display */}
                         {com.isPinned && (
                           <span className="px-1.5 py-0.5 bg-yellow-500/15 border border-yellow-500/25 rounded text-[7px] text-yellow-500 uppercase font-black uppercase tracking-widest flex items-center gap-0.5 font-mono">
                             <Pin size={8} /> Pin
                           </span>
                         )}

                         {/* Heart display */}
                         {com.isHearted && (
                           <span className="w-3.5 h-3.5 rounded bg-aeirmist-magenta/10 border border-aeirmist-magenta/25 text-aeirmist-magenta flex items-center justify-center text-[7px]" title="Hearted by creator">
                             ❤
                           </span>
                         )}
                       </div>
                     </div>

                     <p className="text-xs sm:text-[13px] text-white/80 leading-relaxed font-semibold">{com.text}</p>
                     
                     {/* Interaction tools */}
                     <div className="flex flex-wrap items-center gap-4 pt-1">
                       
                       <button 
                         onClick={() => handleLikeComment(com)}
                         className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${hasLiked ? 'text-aeirmist-magenta' : 'text-white/30 hover:text-white'} transition-colors`}
                       >
                         {hasLiked ? 'Liked' : 'Like'} ({com.likeCount || 0})
                       </button>

                       <button 
                         onClick={() => setReplyingCommentId(replyingCommentId === com.id ? null : com.id)}
                         className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-aeirmist-cyan transition-colors"
                       >
                         Reply
                       </button>

                       {/* Creator specific interaction panel: Pin / Heart */}
                       {profile?.id === video.creatorId && (
                         <>
                           <button 
                             onClick={() => handlePinComment(com)}
                             className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-0.5 ${com.isPinned ? 'text-yellow-400' : 'text-white/20 hover:text-white'}`}
                           >
                             Pin
                           </button>
                           <button 
                             onClick={() => handleHeartComment(com)}
                             className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-0.5 ${com.isHearted ? 'text-aeirmist-magenta' : 'text-white/20 hover:text-white'}`}
                           >
                             Heart
                           </button>
                         </>
                       )}

                     </div>

                     {/* Reply Input block */}
                     {replyingCommentId === com.id && (
                       <div className="flex gap-2 items-center max-w-sm mt-3 pt-2 pl-4 border-l border-white/10">
                         <input 
                           type="text"
                           value={replyInputText}
                           onChange={(e) => setReplyInputText(e.target.value)}
                           placeholder="Type a nested reply..."
                           className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 flex-1 text-xs text-white placeholder:text-white/20 focus:border-aeirmist-cyan/40 outline-none"
                         />
                         <button
                           onClick={() => handlePostReply(com)}
                           className="w-8 h-8 rounded-xl bg-aeirmist-cyan text-black flex items-center justify-center hover:brightness-110 shadow-[0_0_10px_rgba(0,242,255,0.3)] transition-all"
                         >
                           <Send size={11} />
                         </button>
                       </div>
                     )}

                     {/* Thread replies display */}
                     {com.replies && com.replies.length > 0 && (
                       <div className="space-y-3 mt-4 pt-1">
                         <button
                           onClick={() => setVisibleRepliesMap(prev => ({ ...prev, [com.id]: !prev[com.id] }))}
                           className="text-[8px] font-black uppercase tracking-widest text-aeirmist-cyan flex items-center gap-1 focus:outline-none"
                         >
                           {showReplies ? 'Hide replies' : `View replies (${com.replies.length})`}
                         </button>

                         {showReplies && (
                           <div className="pl-4 border-l border-white/5 space-y-3 mt-2">
                             {com.replies.map((reply: any) => (
                               <div key={reply.id} className="flex gap-2.5 pt-1.5 text-left">
                                 <img src={reply.userAvatar} className="w-6 h-6 rounded-lg object-cover" />
                                 <div className="flex-1 min-w-0">
                                   <div className="flex items-center gap-1.5 flex-wrap">
                                     <span className="text-[9px] font-black uppercase text-aeirmist-cyan">{reply.userName}</span>
                                     <span className="text-[7px] text-white/20 font-mono">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                   </div>
                                   <p className="text-xs text-white/70 mt-0.5 leading-relaxed font-semibold">{reply.text}</p>
                                 </div>
                               </div>
                             ))}
                           </div>
                         )}
                       </div>
                     )}

                   </div>
                 </div>
               );
             })
           ) : (
             <div className="py-20 text-center font-mono opacity-25 flex flex-col items-center justify-center uppercase tracking-widest text-[9px] gap-2">
               <MessageCircle size={28} />
               <span>No streams recorded inside comments yet.</span>
             </div>
           )}
        </div>

        {/* Base Input */}
        <div className="p-6 border-t border-white/5 bg-white/[0.01] backdrop-blur-2xl">
           <div className="relative flex items-center gap-3">
              <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 group focus-within:border-aeirmist-cyan/40 transition-all">
                 <Smile size={18} className="text-white/20 group-focus-within:text-aeirmist-cyan transition-colors" />
                 <input 
                   type="text" 
                   value={commentText}
                   disabled={isSubmitting}
                   onChange={(e) => setCommentText(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') handlePostComment();
                   }}
                   placeholder="Inject response into Feed..." 
                   className="bg-transparent border-none focus:ring-0 text-xs text-white placeholder:text-white/20 w-full font-bold outline-none"
                 />
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!commentText.trim() || isSubmitting}
                onClick={handlePostComment}
                className="w-12 h-12 rounded-2xl bg-aeirmist-cyan flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,242,255,0.4)] disabled:opacity-50 disabled:shadow-none"
              >
                <Send size={18} className="fill-current text-black" />
              </motion.button>
           </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const FilterTab = ({ id, label, icon, active, onClick }: { id: string; label: string; icon: any; active: boolean; onClick: () => void }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`px-2 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl border flex items-center justify-center gap-1 sm:gap-2 transition-all whitespace-nowrap shrink-0 sm:shrink flex-1 sm:flex-initial ${
      active 
        ? 'bg-aeirmist-cyan text-black border-aeirmist-cyan shadow-[0_0_12px_rgba(0,242,255,0.25)] font-black' 
        : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white font-bold'
    }`}
  >
    <div className={`scale-85 sm:scale-100 ${active ? 'text-black' : 'text-white'}`}>{icon}</div>
    <span className="text-[8px] sm:text-[9.5px] uppercase tracking-wider">{label}</span>
  </motion.button>
);
