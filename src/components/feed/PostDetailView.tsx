import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { useAeirmist } from '../../context/AeirmistContext';
import { PremiumPostCard } from '../feed/PremiumPostCard';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { getAvatarUrl } from '../../lib/avatar';

export const PostDetailView: React.FC<{ postId: string; onClose: () => void }> = ({ postId, onClose }) => {
  const { db } = useAeirmist();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !postId) return;

    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const postDoc = await getDoc(doc(db, 'posts', postId));
        if (postDoc.exists()) {
          const data = postDoc.data();
          setPost({
            id: postDoc.id,
            ...data,
            author: {
              name: data.author?.displayName || data.author?.username || 'User',
              avatar: getAvatarUrl(data.author?.photoURL || data.userAvatar || data.authorAvatar),
              isVerified: data.author?.isVerified || false
            },
            likesCount: data.likesCount || 0,
            commentsCount: data.commentsCount || 0,
            timestamp: data.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now',
          });
        } else {
          setError('Post not found');
        }
      } catch (err: any) {
        console.error("Error fetching post:", err);
        setError(err.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [db, postId]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[5000] flex items-center justify-center p-0 sm:p-4 md:p-8"
    >
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-2xl" 
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] bg-[#0a0a0a] sm:rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md z-10">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <ArrowLeft size={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Back</span>
          </button>
          
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-aeirmist-cyan">Post Orbit</h2>
          
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4 text-aeirmist-cyan">
              <Loader2 size={32} className="animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Syncing Feed Coordinate...</span>
            </div>
          ) : error ? (
            <div className="h-64 flex flex-col items-center justify-center gap-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-aeirmist-magenta/10 flex items-center justify-center text-aeirmist-magenta">
                <AlertCircle size={32} />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider text-white mb-2">{error}</h3>
                <p className="text-xs text-white/40 uppercase tracking-widest">This content may have been archived or deleted.</p>
              </div>
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
              >
                Return Home
              </button>
            </div>
          ) : post ? (
            <div className="max-w-2xl mx-auto">
              <PremiumPostCard post={post} />
            </div>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
};
