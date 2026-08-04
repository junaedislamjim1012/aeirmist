import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppearance } from '../../context/AppearanceContext';
import { StoriesSystem } from './StoriesSystem';
import { PremiumPostCard } from './PremiumPostCard';
import { 
  Loader2,
  Plus,
  Bell,
  Camera,
  ShoppingBag,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import { useAeirmist } from '../../context/AeirmistContext';
import { collection, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore';
import { AeirmistLogo } from '../ui/AeirmistLogo';
import { getAvatarUrl } from '../../lib/avatar';
import { Skeleton } from '../ui/Skeleton';

export const HomeFeedSystem: React.FC<{ onUserClick?: (user: any) => void, onPostClick?: (postId: string) => void, onCreate?: () => void, onNavigate?: (tab: string) => void }> = React.memo(({ onUserClick, onPostClick, onCreate, onNavigate }) => {
  const [posts, setPosts] = useState<any[]>(() => {
    // Attempt instant hydration from local cache
    try {
      const cached = localStorage.getItem('aeirmist_home_feed_cache');
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn("Feed hydration failed", e);
    }
    return [];
  });
  const [loading, setLoading] = useState(posts.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; details: string; link?: string } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const isInitialLoad = React.useRef(true);
  const { db, user, profile, permissions, requestPermission, setCameraConfig, addToast, unreadNotificationsCount } = useAeirmist();
  const { settings } = useAppearance(); 
  const isGlobalBgActive = settings.globalBgType !== 'none' && !!settings.globalBgValue;

  const showNotificationPrompt = permissions.notifications?.status === 'prompt';

  const openQuickCamera = () => {
    setCameraConfig({
      isOpen: true,
      mode: 'STORY',
      onCapture: (file) => {
        // Just capture for now, could auto-upload to story
        console.log("Feed camera capture:", file);
      }
    });
  };

  const processedPosts = React.useMemo(() => {
    // Sort and deduplicate posts by ID to prevent UI glitches
    const uniquePostsMap = new Map();
    posts.forEach(p => {
      if (p && p.id && !uniquePostsMap.has(p.id)) {
        uniquePostsMap.set(p.id, p);
      }
    });

    return Array.from(uniquePostsMap.values()).sort((a, b) => {
      const getTime = (p: any) => {
        try {
          if (p.createdAt?.toDate) return p.createdAt.toDate().getTime();
          if (p.createdAt instanceof Date) return p.createdAt.getTime();
          if (p.createdAt?.seconds) return p.createdAt.seconds * 1000;
          if (typeof p.createdAt === 'number') return p.createdAt;
        } catch (e) { return 0; }
        return 0;
      };
      return getTime(b) - getTime(a);
    });
  }, [posts]);

  // Persistent Cache Sync
  useEffect(() => {
    if (processedPosts.length > 0) {
      try {
        // Store only the first 20 for fast cold-start hydration
        localStorage.setItem('aeirmist_home_feed_cache', JSON.stringify(processedPosts.slice(0, 20)));
      } catch (e) {
        console.warn("Feed cache sync failed", e);
      }
    }
  }, [processedPosts]);

  // Memoize stable query parameters to prevent infinite snapshot listener recreation.
  // NOTE: no longer sliced to 30 here — Firestore's 'in' operator caps at 30 values per
  // query, so instead of silently dropping anyone past the 30th followed account, we
  // build the FULL list here and split it into <=30-sized batches below, running one
  // listener per batch and merging the results.
  const uidsToQueryString = React.useMemo(() => {
    if (!user || !profile) return '[]';
    const following = profile.social?.following || [];
    const uids = Array.from(new Set([...following, profile.id])).sort();
    return JSON.stringify(uids);
  }, [user?.uid, profile?.id, JSON.stringify(profile?.social?.following || [])]);

  const [postLimit, setPostLimit] = useState(20);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  const handleManualRetry = () => {
    setLoading(true);
    setError(null);
    setRetryCount(prev => prev + 1);
  };

  useEffect(() => {
    if (!db || !user || !profile) return;
    
    const uidsToQuery: string[] = JSON.parse(uidsToQueryString);
    if (uidsToQuery.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }
    
    if (!isInitialLoad.current) setIsRefreshing(true);

    // Firestore's `where(field, 'in', array)` caps at 30 values. Users can easily
    // follow more than 30 accounts, so we split into <=30-sized batches and run one
    // listener per batch, then merge + re-sort the combined results client-side.
    // To handle potential ID mismatches, we include both profile IDs and UIDs in the batch
    // and query against both authorId and authorUid fields.
    const BATCH_SIZE = 30;
    const batches: string[][] = [];
    for (let i = 0; i < uidsToQuery.length; i += BATCH_SIZE) {
      batches.push(uidsToQuery.slice(i, i + BATCH_SIZE));
    }

    const resultsByBatch = new Map<string, any[]>();

    const applyFilterAndCommit = () => {
      const merged = Array.from(resultsByBatch.values()).flat();
      const seen = new Set<string>();
      const deduped = merged.filter(p => {
        if (!p || !p.id || seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });

      // SORT IN JAVASCRIPT: This removes the need for composite indices in Firestore
      // which are prone to failing in development and shared environments.
      deduped.sort((a, b) => (b.__sortTime || 0) - (a.__sortTime || 0));

      const filtered = deduped.slice(0, postLimit).filter(p => {
        if (p.isArchived) return false;
        if (p.authorId === profile.id || p.authorUid === user.uid) return true;
        if (p.audience === 'only_me') return false;
        if (p.audience === 'close_friends') {
          return (p.closeFriends || []).includes(profile.id);
        }
        return true;
      });

      setPosts(filtered);
      setLoading(false);
      setIsRefreshing(false);
      setError(null);
      isInitialLoad.current = false;
    };

    const handleError = (err: any) => {
      console.error("Feed listener error:", err);
      setLoading(false);
      setIsRefreshing(false);

      if (err.message?.includes('index') || err.code === 'failed-precondition') {
        const indexLink = err.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0];
        setError({
          message: 'QUERY OPTIMIZATION REQUIRED',
          details: 'This feed view requires a composite index in Firestore to save correctly.',
          link: indexLink
        });
      } else {
        setError({
          message: 'Sync INTERRUPTED',
          details: err.message || 'The Feed could not be established.'
        });
      }
    };

    const unsubscribes = batches.flatMap((batch, batchIndex) => {
      // Create two separate queries per batch: one for authorId and one for authorUid
      // This ensures we catch posts even if the ID system changed
      const q1 = query(
        collection(db, 'posts'),
        where('authorId', 'in', batch),
        limit(postLimit)
      );

      const q2 = query(
        collection(db, 'posts'),
        where('authorUid', 'in', batch),
        limit(postLimit)
      );

      const processSnapshot = (snapshot: any, key: string) => {
        const dbPosts = snapshot.docs.map((doc: any) => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            ...data,
            author: {
              name: data.author?.displayName || data.author?.username || 'Anonymous User',
              avatar: getAvatarUrl(data.author?.photoURL || data.userAvatar || data.authorAvatar),
              isVerified: data.author?.isVerified || false
            },
            likesCount: data.likesCount || 0,
            commentsCount: data.commentsCount || 0,
            timestamp: data.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now',
            __sortTime: data.createdAt?.toMillis?.() || data.createdAt?.seconds * 1000 || 0,
          };
        });
        resultsByBatch.set(key, dbPosts);
        applyFilterAndCommit();
      };

      return [
        onSnapshot(q1, (s) => processSnapshot(s, `batch_${batchIndex}_id`), handleError),
        onSnapshot(q2, (s) => processSnapshot(s, `batch_${batchIndex}_uid`), handleError)
      ];
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [db, user?.uid, profile?.id, uidsToQueryString, retryCount, postLimit]);

  // Infinite Scroll Trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !isRefreshing && processedPosts.length >= postLimit) {
          // Add a small buffer delay to prevent rapid-fire limit increments
          setPostLimit(prev => prev + 20);
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px' // Start loading before reaching the very end
      }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loading, isRefreshing, processedPosts.length, postLimit]);

  return (
    <div className={`w-full min-h-full relative flex flex-col ${isGlobalBgActive ? 'bg-black/20 backdrop-blur-sm' : ''}`}>
      <div className="w-full pb-32">
        {/* Mobile Header with Marketplace Link */}
        <div 
          role="banner"
          className={`sticky top-0 z-[100] ${isGlobalBgActive ? 'bg-transparent' : 'bg-[#050505]/95'} backdrop-blur-xl flex md:hidden items-center justify-between pb-2.5 pt-[calc(0.875rem+env(safe-area-inset-top,0px))] mb-1 px-4 border-b border-white/5`}
        >
           <div className="flex items-center w-24 shrink-0">
             <button 
              type="button"
              aria-label="Go to Marketplace"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('aeirmist-navigate', { detail: 'discover' }));
              }}
              className="w-10 h-10 rounded-xl bg-[#00f2ff]/10 border border-[#00f2ff]/30 flex items-center justify-center text-aeirmist-cyan shadow-lg active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aeirmist-cyan"
              title="Marketplace"
           >
             <ShoppingBag size={18} className="drop-shadow-[0_0_6px_rgba(0,242,255,0.4)]" aria-hidden="true" />
           </button>
           </div>
           <div className="flex-1 flex items-center justify-center z-0 pointer-events-none min-w-0 px-2">
             <h1 className="text-xl font-display font-black uppercase tracking-[0.2em] flex items-center gap-2 relative group">
              <div className="relative pt-1 flex items-center">
                <AeirmistLogo variant="text-only" className="scale-[0.85]" glow={true} glowStrength="normal" colorClass="text-aeirmist-cyan" />
                {/* Decorative holographic underlines */}
                <div className="absolute -bottom-1 left-0 w-full h-[1.5px] bg-gradient-to-r from-aeirmist-cyan/0 via-aeirmist-cyan/50 to-aeirmist-cyan/0" />
                 <motion.div 
                   animate={{ x: [-20, 100], opacity: [0, 1, 0] }}
                   transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                   className="absolute -bottom-1 left-0 w-1/3 h-[1.5px] bg-white blur-sm"
                 />
               </div>
             </h1>
           </div>
           <div className="flex items-center justify-end gap-2 w-24 shrink-0">
             <button 
              type="button"
              aria-label="Create new post"
              onClick={onCreate}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-aeirmist-cyan transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aeirmist-cyan"
             >
               <Plus size={16} aria-hidden="true" />
             </button>
             <button 
              type="button"
              aria-label="Open notifications"
              onClick={() => {
                const navEvent = new CustomEvent('aeirmist-navigate', { detail: 'notifications' });
                window.dispatchEvent(navEvent);
              }}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-aeirmist-cyan transition-all relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aeirmist-cyan"
             >
               <Bell size={16} aria-hidden="true" />
               {unreadNotificationsCount > 0 && (
                 <span className="absolute -top-1 -right-1 z-10 min-w-[18px] h-[18px] px-1 bg-aeirmist-cyan text-black text-[9px] font-black rounded-full border border-black flex items-center justify-center shadow-[0_0_10px_rgba(0,242,255,0.8)] animate-pulse">
                   {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                 </span>
               )}
             </button>
           </div>
        </div>
        
        <div className="w-full flex justify-center">
          
          {/* MAIN FEED COLUMN */}
          <div className="w-full max-w-[700px]">
            {/* NOTES & STORIES RESTORED */}
            <div className="mb-3">
              <StoriesSystem />
            </div>

            {showNotificationPrompt && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="glass-panel p-8 rounded-[2.5rem] border-aeirmist-cyan/30 bg-aeirmist-cyan/5 mb-8 flex flex-col md:flex-row items-center gap-6"
              >
                 <div className="w-16 h-16 rounded-2xl bg-aeirmist-cyan/20 flex items-center justify-center text-aeirmist-cyan shrink-0">
                    <Bell size={32} className="animate-bounce" />
                 </div>
                 <div className="flex-1 text-center md:text-left">
                    <h3 className="text-lg font-display font-bold mb-1">Stay Saved</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest leading-loose">Enable high-priority neural alerts to receive activity updates in real-time.</p>
                 </div>
                 <button 
                   onClick={() => requestPermission('notifications')}
                   className="px-8 py-3 bg-aeirmist-cyan text-aeirmist-bg rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)] shrink-0"
                 >
                   Grant Access
                 </button>
              </motion.div>
            )}

            {/* FEED ITEMS */}
            <div className="relative rounded-[2.5rem] backdrop-blur-2xl bg-black/15 py-2">
              <div className="space-y-1.5">
                <AnimatePresence mode="popLayout">
                  {error ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      role="alert"
                      className="glass-panel p-12 rounded-[2.5rem] border-aeirmist-magenta/30 bg-aeirmist-magenta/5 text-center flex flex-col items-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-aeirmist-magenta/10 flex items-center justify-center mb-6 text-aeirmist-magenta">
                        <AlertTriangle size={32} />
                      </div>
                      <h3 className="text-xl font-display font-bold mb-2 text-white">{error.message}</h3>
                      <p className="text-xs text-white/40 uppercase tracking-widest leading-loose max-w-sm mx-auto mb-8">
                        {error.details}
                      </p>
                      
                      {error.link ? (
                        <div className="flex flex-col items-center gap-4">
                          <p className="text-[10px] text-aeirmist-magenta/60 font-bold uppercase tracking-wider">Manual Database Optimization Required</p>
                          <a 
                            href={error.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-8 py-5 bg-aeirmist-magenta/20 border border-aeirmist-magenta/40 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white hover:bg-aeirmist-magenta/30 hover:border-aeirmist-magenta transition-all group shadow-[0_0_30px_rgba(255,0,255,0.1)]"
                          >
                            Create Database Index
                            <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </a>
                          <p className="text-[9px] text-white/20 max-w-[280px] leading-relaxed">
                            Firestore requires a composite index for this saved view. Click the button above to authorize the Index creation.
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={handleManualRetry}
                          className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all active:scale-95"
                        >
                          Retry Synchronization
                        </button>
                      )}
                    </motion.div>
                  ) : loading && processedPosts.length === 0 ? (
                    <div className="space-y-6" aria-busy="true" aria-label="Syncing Feed coordinates">
                      {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="glass-panel p-5 rounded-[2.5rem] bg-white/[0.02]" aria-hidden="true">
                          <div className="flex items-center gap-3 mb-5">
                            <Skeleton className="w-10 h-10 rounded-xl" />
                            <div className="space-y-1.5 flex-1">
                              <Skeleton className="w-32 h-3" />
                              <Skeleton className="w-20 h-2 opacity-50" />
                            </div>
                            <Skeleton className="w-8 h-8 rounded-lg" />
                          </div>
                          <Skeleton className="w-full aspect-[4/3] rounded-3xl mb-4" />
                          <div className="flex items-center gap-4">
                            <Skeleton className="w-12 h-4 rounded-full" />
                            <Skeleton className="w-12 h-4 rounded-full" />
                            <Skeleton className="w-12 h-4 rounded-full ml-auto" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : processedPosts.length === 0 ? (
                    <div className="ui-card p-12 text-center flex flex-col items-center justify-center my-6">
                      <div className="w-16 h-16 rounded-2xl bg-aeirmist-cyan/10 border border-aeirmist-cyan/20 flex items-center justify-center mb-4 text-aeirmist-cyan">
                        <Plus size={28} />
                      </div>
                      <h3 className="ui-heading-2 mb-2">Welcome to your feed</h3>
                      <p className="ui-body-text text-white/50 max-w-sm mx-auto mb-6">
                        No posts yet. Start by sharing your first post with your connections or explore stores in the Marketplace.
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={onCreate}
                          className="ui-btn-primary"
                        >
                          <Plus className="ui-icon-sm" /> Create Post
                        </button>
                      </div>
                    </div>
                  ) : (
                    <motion.div key="feed-posts-container">
                      {isRefreshing && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-center mb-4"
                        >
                          <div className="px-4 py-1.5 bg-aeirmist-cyan/10 border border-aeirmist-cyan/20 rounded-full flex items-center gap-2">
                            <Loader2 size={10} className="text-aeirmist-cyan animate-spin" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-aeirmist-cyan">Refreshing Timeline</span>
                          </div>
                        </motion.div>
                      )}
                      {processedPosts.map((post) => (
                        <PremiumPostCard key={post.id} post={post} onUserClick={onUserClick} onPostClick={onPostClick} onNavigate={onNavigate} />
                      ))}
                      
                      {/* Infinite Scroll Anchor */}
                      <div ref={loadMoreRef} className="py-8 flex justify-center">
                        {posts.length >= postLimit && (
                           <div className="flex items-center gap-3">
                             <Loader2 size={24} className="text-aeirmist-cyan animate-spin" />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Syncing Frequencies...</span>
                           </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
