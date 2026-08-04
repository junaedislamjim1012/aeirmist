import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Music, Users, Shield, X, Globe, Camera, Loader2, Trash2, Heart, Eye, 
  MessageCircle, Volume2, Search, CheckCircle2, MoreHorizontal, UserPlus, UserMinus,
  EyeOff, ShieldCheck, Check, Sparkles
} from 'lucide-react';
import { doc, deleteDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { formatAeirmistTimestamp, formatActiveStatus } from '../../lib/date';
import { useAeirmist } from '../../context/AeirmistContext';
import { useInboxData } from '../../hooks/useInboxData';
import { getAvatarUrl } from '../../lib/avatar';
import { MusicSearchModal } from '../music/MusicSearchModal';

const REACTIONS = ['❤️', '😂', '😮', '😢', '🔥', '👍'];

const getRelativeTime = (timestamp: any) => {
  if (!timestamp) return 'now';
  const time = timestamp?.toMillis ? timestamp.toMillis() : timestamp?.seconds ? timestamp.seconds * 1000 : Date.now();
  const diff = Math.floor((Date.now() - time) / 60000);
  if (diff < 1) return 'now';
  if (diff < 60) return `${diff}m`;
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

export const NotesSystem = ({ chats, onChatSelect, onReplyNote }: { chats: any[], onChatSelect?: (chatId: string) => void, onReplyNote?: (chatId: string, noteText: string, authorName: string) => void }) => {
  const { user, profile, onlineUsers, setCameraConfig, uploadMedia, db, addToast, toggleCloseFriend, isCloseFriend, searchUsers } = useAeirmist();
  
  // Extract participant IDs to sync notes for active chat members
  const chatOtherParticipantIds = chats.map(chat => {
    return chat.profileIds?.find((id: string) => id !== profile?.id) || 
           chat.participants?.find((id: string) => id !== profile?.id) || 
           chat.id.replace(profile?.id || '', '').replace('_', '');
  }).filter(Boolean);

  const { notes, createNote, deleteNote, activeStories, loading: notesLoading } = useInboxData(chatOtherParticipantIds);
  
  // Note Creator State
  const [isCreating, setIsCreating] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (noteTextareaRef.current) {
      noteTextareaRef.current.style.height = 'auto';
      noteTextareaRef.current.style.height = `${Math.min(Math.max(48, noteTextareaRef.current.scrollHeight), 120)}px`;
    }
  }, [noteContent, isCreating]);
  const [audience, setAudience] = useState<'public' | 'followers' | 'closeFriends'>('public');
  const [selectedMusic, setSelectedMusic] = useState<any>(null);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [media, setMedia] = useState<{ url: string, file: File, type: 'image' | 'video' } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Close Friends & Hide Note Privacy States
  const [isCloseFriendsModalOpen, setIsCloseFriendsModalOpen] = useState(false);
  const [isHideNotesModalOpen, setIsHideNotesModalOpen] = useState(false);
  const [hiddenFromUserIds, setHiddenFromUserIds] = useState<string[]>([]);
  const [closeFriendsSearch, setCloseFriendsSearch] = useState('');
  const [hideNotesSearch, setHideNotesSearch] = useState('');
  const [remoteSearchResults, setRemoteSearchResults] = useState<any[]>([]);

  // Viewing State
  const [selectedFriendNote, setSelectedFriendNote] = useState<{note: any, chat: any} | null>(null);
  const [viewingMyNote, setViewingMyNote] = useState(false);
  const [activeSheet, setActiveSheet] = useState<'seen' | 'reactions' | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const myNote = notes.find(n => n.authorId === profile?.id);

  const closeFriendsList = React.useMemo(() => {
    return Array.from(new Set([
      ...(profile?.social?.closeFriends || []),
      ...(profile?.closeFriends || [])
    ]));
  }, [profile?.social?.closeFriends, profile?.closeFriends]);

  // Candidate users from active chats
  const candidateUsers = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; photo?: string; username?: string }>();
    
    chats.forEach(chat => {
      const otherId = chat.otherParticipantId || 
                      chat.profileIds?.find((id: string) => id !== profile?.id) || 
                      chat.participants?.find((id: string) => id !== profile?.id) || 
                      chat.id.replace(profile?.id || '', '').replace('_', '');
      if (otherId && otherId !== profile?.id) {
        map.set(otherId, {
          id: otherId,
          name: chat.name || chat.displayName || 'User',
          photo: chat.photo || chat.photoURL,
          username: chat.username || ''
        });
      }
    });

    return Array.from(map.values());
  }, [chats, profile?.id]);

  // Remote search logic for Close Friends / Hide Notes modals
  useEffect(() => {
    const query = closeFriendsSearch || hideNotesSearch;
    if (!query || query.length < 2) {
      setRemoteSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        if (searchUsers) {
          const res = await searchUsers(query);
          setRemoteSearchResults(res || []);
        }
      } catch (e) {}
    }, 300);
    return () => clearTimeout(timer);
  }, [closeFriendsSearch, hideNotesSearch, searchUsers]);

  const filteredCloseFriendsCandidates = React.useMemo(() => {
    const query = closeFriendsSearch.toLowerCase().trim();
    const baseMap = new Map<string, any>();

    candidateUsers.forEach(u => baseMap.set(u.id, u));
    remoteSearchResults.forEach(u => {
      if (u.id && u.id !== profile?.id) {
        baseMap.set(u.id, {
          id: u.id,
          name: u.displayName || u.username || 'User',
          photo: u.photoURL,
          username: u.username
        });
      }
    });

    const all = Array.from(baseMap.values());
    if (!query) return all;
    return all.filter(u => 
      u.name.toLowerCase().includes(query) || 
      (u.username && u.username.toLowerCase().includes(query))
    );
  }, [candidateUsers, remoteSearchResults, closeFriendsSearch, profile?.id]);

  const filteredHideNotesCandidates = React.useMemo(() => {
    const query = hideNotesSearch.toLowerCase().trim();
    const baseMap = new Map<string, any>();

    candidateUsers.forEach(u => baseMap.set(u.id, u));
    remoteSearchResults.forEach(u => {
      if (u.id && u.id !== profile?.id) {
        baseMap.set(u.id, {
          id: u.id,
          name: u.displayName || u.username || 'User',
          photo: u.photoURL,
          username: u.username
        });
      }
    });

    const all = Array.from(baseMap.values());
    if (!query) return all;
    return all.filter(u => 
      u.name.toLowerCase().includes(query) || 
      (u.username && u.username.toLowerCase().includes(query))
    );
  }, [candidateUsers, remoteSearchResults, hideNotesSearch, profile?.id]);

  // Handle ESC to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedFriendNote(null);
        setViewingMyNote(false);
        setActiveSheet(null);
        setIsCreating(false);
        setIsMusicModalOpen(false);
        setIsCloseFriendsModalOpen(false);
        setIsHideNotesModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openCamera = () => {
    setCameraConfig({
      isOpen: true,
      mode: 'PHOTO',
      onCapture: (file) => {
        setMedia({
          url: URL.createObjectURL(file),
          file,
          type: file.type.startsWith('video') ? 'video' : 'image'
        });
      }
    });
  };

  const handleOpenCreator = () => {
    if (myNote) {
      setViewingMyNote(true);
    } else {
      setNoteContent('');
      setSelectedMusic(null);
      setAudience('public');
      setMedia(null);
      setHiddenFromUserIds([]);
      setIsCreating(true);
    }
  };

  const handleDeleteNote = async () => {
    if (!myNote?.id) return;
    try {
      await deleteNote(myNote.id);
      setViewingMyNote(false);
      addToast?.({ title: "Note Deleted", message: "Your note has been removed.", type: "success" });
    } catch (e: any) { 
      console.error("Failed to delete note:", e); 
      addToast?.({ title: "Failed", message: e.message || "Failed to delete note", type: "warning" }); 
    }
  };

  const handleCreate = async () => {
    if (!noteContent.trim() && !media && !selectedMusic) return;
    
    let mediaUrl = media ? media.url : '';
    let mediaType: 'image' | 'video' | undefined = media ? media.type : undefined;

    if (media && media.file) {
      setIsUploading(true);
      try {
        mediaUrl = await uploadMedia(media.file, `notes/${user?.uid}`);
        mediaType = media.type;
      } catch (error: any) { 
        console.error("Note media upload failed:", error); 
        addToast?.({ title: "Failed", message: error.message || "Upload failed", type: "warning" }); 
      } finally {
        setIsUploading(false);
      }
    }

    const musicString = selectedMusic ? `${selectedMusic.title} - ${selectedMusic.artist}` : '';

    if (myNote && db) {
      try {
        await updateDoc(doc(db, 'notes', myNote.id), {
          content: noteContent,
          music: musicString || null,
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || null,
          audience,
          visibleTo: audience === 'closeFriends' ? (profile?.social?.closeFriends || []) : [],
          hiddenFrom: hiddenFromUserIds,
          createdAt: serverTimestamp()
        });
      } catch (err) {}
    } else {
      await createNote(noteContent, audience, musicString, mediaUrl, mediaType, hiddenFromUserIds);
    }
    
    setNoteContent('');
    setSelectedMusic(null);
    setMedia(null);
    setHiddenFromUserIds([]);
    setIsCreating(false);
    addToast?.({ title: "Note Shared", message: "Your note is now visible to others.", type: "success" });
  };

  const handleReact = async (noteId: string, emoji: string) => {
    if (!db || !profile) return;
    try {
      const noteRef = doc(db, 'notes', noteId);
      const currentNote = notes.find(n => n.id === noteId);
      if (!currentNote) return;
      
      const existingReactions = currentNote.reactions || [];
      const newReaction = { userId: profile.id, emoji, timestamp: Date.now(), userName: profile.displayName, userAvatar: profile.photoURL };
      
      const alreadyReacted = existingReactions.find((r: any) => r.userId === profile.id && r.emoji === emoji);
      if (alreadyReacted) {
        await updateDoc(noteRef, {
          reactions: existingReactions.filter((r: any) => !(r.userId === profile.id && r.emoji === emoji))
        });
      } else {
        await updateDoc(noteRef, {
          reactions: [...existingReactions, newReaction]
        });
      }
    } catch (err) {}
  };

  const handleNoteSeen = async (noteId: string) => {
    if (!db || !profile) return;
    try {
      const noteRef = doc(db, 'notes', noteId);
      const currentNote = notes.find(n => n.id === noteId);
      if (!currentNote) return;
      
      // If it's my own note, don't mark as seen
      if (currentNote.authorId === profile.id) return;

      const existingSeenBy = currentNote.seenBy || [];
      if (!existingSeenBy.find((s: any) => s.userId === profile.id)) {
        await updateDoc(noteRef, {
          seenBy: [...existingSeenBy, { userId: profile.id, timestamp: Date.now(), userName: profile.displayName, userAvatar: profile.photoURL }]
        });
      }
    } catch(err) {}
  };

  useEffect(() => {
    if (selectedFriendNote?.note?.id) {
      handleNoteSeen(selectedFriendNote.note.id);
    }
  }, [selectedFriendNote?.note?.id]);

  return (
    <div className="relative select-none bg-black/20">
      <div className="absolute inset-0 bg-gradient-to-r from-aeirmist-cyan/5 via-transparent to-aeirmist-magenta/5 pointer-events-none" />
      
      <motion.div 
        ref={scrollRef}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
        }}
        className="px-4 pt-2 pb-3.5 flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory relative z-10"
      >
        {/* My Note / Add Note */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, scale: 0.8, y: 10 },
            visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } }
          }}
          className="flex flex-col items-center flex-shrink-0 w-16 relative snap-start"
        >
          <div 
            className="relative cursor-pointer group flex flex-col items-center w-full" 
            onClick={handleOpenCreator}
          >
            <div className="h-9 relative w-full flex items-center justify-center">
              <AnimatePresence mode="wait">
                {myNote && (
                  <motion.div 
                    key="my-note-bubble"
                    initial={{ scale: 0.5, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.5, opacity: 0, y: 10 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="absolute bottom-1 bg-[#121217] border border-aeirmist-cyan/40 px-2.5 py-1.5 rounded-2xl text-center max-w-[90px] shadow-[0_8px_20px_rgba(0,242,255,0.15)] z-20 group-hover:scale-110 transition-transform"
                  >
                    <p className="text-[10px] text-white font-bold truncate max-w-[75px] select-none leading-none whitespace-nowrap">{myNote.content}</p>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#121217] border-r border-b border-aeirmist-cyan/40 rotate-45 shadow-sm" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className={`relative w-15 h-15 rounded-[22px] p-[2px] border-2 transition-all duration-300 ${myNote ? 'border-aeirmist-cyan shadow-[0_0_15px_rgba(0,242,255,0.2)]' : 'border-white/10 group-hover:border-white/30'}`}>
              <div className="w-full h-full rounded-[19px] overflow-hidden bg-[#0c0c0f]">
                <img src={getAvatarUrl(profile?.photoURL || user?.photoURL)} alt="Me" className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white text-black rounded-lg border-2 border-[#0a0a0d] flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                <Plus size={11} strokeWidth={3} />
              </div>
            </div>
            
            <span className="text-[10px] text-white/50 font-black uppercase tracking-[0.15em] w-full text-center mt-2 group-hover:text-white transition-colors">
              You
            </span>
          </div>
        </motion.div>

        {/* Friends' Notes */}
        {chats.map(chat => {
          const otherId = chat.profileIds?.find((id: string) => id !== profile?.id) || chat.participants?.find((id: string) => id !== profile?.id) || chat.id.replace(profile?.id || '', '').replace('_', '');
          const friendNote = notes.find(n => n.authorId === otherId);
          if (!friendNote) return null;
          
          const isOnline = onlineUsers.has(otherId);
          const hasSeen = friendNote.seenBy?.some((s: any) => s.userId === profile?.id);

          return (
            <motion.div 
              key={chat.id} 
              variants={{
                hidden: { opacity: 0, scale: 0.8, y: 10 },
                visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } }
              }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="flex flex-col items-center flex-shrink-0 w-16 relative snap-start"
            >
              <div 
                onClick={() => setSelectedFriendNote({ note: friendNote, chat })}
                className="relative cursor-pointer group flex flex-col items-center w-full"
              >
                <div className="h-9 relative w-full flex items-center justify-center">
                  <AnimatePresence>
                    <motion.div 
                      key={`friend-note-bubble-${otherId}`}
                      initial={{ scale: 0.5, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.5, opacity: 0, y: 10 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      className={`absolute bottom-1 px-2.5 py-1.5 rounded-2xl text-center max-w-[90px] shadow-lg z-20 transition-all ${
                        hasSeen 
                          ? 'bg-[#1a1a20]/80 backdrop-blur-md border border-white/10' 
                          : 'bg-[#121217] border border-aeirmist-magenta/40 shadow-[0_8px_20px_rgba(255,0,234,0.15)]'
                      }`}
                    >
                      <p className={`text-[10px] font-bold truncate max-w-[75px] select-none leading-none whitespace-nowrap ${hasSeen ? 'text-white/40' : 'text-white'}`}>
                        {friendNote.content}
                      </p>
                      <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${
                        hasSeen ? 'bg-[#1a1a20]/80 border-r border-b border-white/10' : 'bg-[#121217] border-r border-b border-aeirmist-magenta/40'
                      }`} />
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className={`relative w-15 h-15 rounded-[22px] p-[2px] border-2 transition-all duration-300 ${hasSeen ? 'border-white/5' : 'border-aeirmist-magenta shadow-[0_0_15px_rgba(255,0,234,0.15)]'}`}>
                  <div className="w-full h-full rounded-[19px] overflow-hidden bg-black">
                    <img src={getAvatarUrl(chat.photo)} alt={chat.name || 'User'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  {isOnline && chat.messagingSettings?.onlineStatus !== false && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-aeirmist-lime rounded-lg border-[3px] border-[#0a0a0d] shadow-sm animate-pulse" />
                  )}
                </div>

                <span className="text-[10px] text-white/50 font-black uppercase tracking-[0.1em] truncate w-full text-center mt-2">
                  {(chat.name || 'User').split(' ')[0]}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Note Creation Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 sm:p-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
              onClick={() => setIsCreating(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 30, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#0a0a0e] border border-white/10 p-8 rounded-[2.5rem] shadow-[0_32px_80px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <button onClick={() => setIsCreating(false)} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all">
                  <X size={18} />
                </button>
                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/20">New Note</h3>
                <div className="w-10 h-10" /> {/* Spacer */}
              </div>

              {/* Profile & Input Area */}
              <div className="flex flex-col items-center mb-10">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-[2rem] border-2 border-white/5 p-1 relative z-10 bg-black">
                     <img src={getAvatarUrl(profile?.photoURL)} alt="" className="w-full h-full rounded-[1.8rem] object-cover" />
                  </div>
                  {/* Floating Bubbles */}
                  <div className="absolute -top-3 -right-2 w-8 h-8 rounded-full bg-aeirmist-cyan/20 blur-md animate-pulse" />
                  <div className="absolute -bottom-2 -left-3 w-6 h-6 rounded-full bg-aeirmist-magenta/20 blur-md animate-pulse [animation-delay:1s]" />
                </div>
                
                <div className="w-full relative group">
                  <textarea 
                    ref={noteTextareaRef}
                    rows={1}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Share a frequency..."
                    maxLength={60}
                    className="w-full bg-white/[0.03] border-2 border-white/[0.08] focus:border-aeirmist-cyan/50 rounded-2xl px-5 py-3 pr-14 text-sm text-white placeholder:text-white/20 outline-none focus:bg-white/[0.06] transition-all resize-none min-h-[48px] max-h-[120px] text-center font-bold tracking-tight leading-normal overflow-hidden"
                  />
                  <div className="absolute bottom-3 right-4 text-[8px] font-black tracking-widest text-white/30 uppercase pointer-events-none">
                    {noteContent.length} / 60
                  </div>
                </div>
              </div>

              {/* Quick Actions (Music, Camera) */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                <button 
                  onClick={() => setIsMusicModalOpen(true)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl transition-all border ${
                    selectedMusic 
                      ? 'bg-aeirmist-cyan/10 border-aeirmist-cyan text-aeirmist-cyan' 
                      : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <Music size={14} className={selectedMusic ? 'animate-spin-slow' : ''} />
                  <span className="text-[9px] font-black uppercase tracking-wider truncate max-w-[100px]">
                    {selectedMusic ? selectedMusic.title : 'Add Music'}
                  </span>
                </button>
                <button 
                  onClick={openCamera}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl transition-all border ${
                    media 
                      ? 'bg-aeirmist-magenta/10 border-aeirmist-magenta text-aeirmist-magenta' 
                      : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <Camera size={14} />
                  <span className="text-[9px] font-black uppercase tracking-wider">
                    {media ? 'Media Added' : 'Capture'}
                  </span>
                </button>
              </div>

              {/* Audience Selector & Privacy Options */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20">Who can see this?</span>
                  {audience === 'closeFriends' && (
                    <button 
                      onClick={() => setIsCloseFriendsModalOpen(true)}
                      className="text-[9px] font-bold text-aeirmist-cyan hover:underline flex items-center gap-1 transition-all"
                    >
                      <UserPlus size={10} />
                      <span>Edit List ({closeFriendsList.length})</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
                  {(['public', 'followers', 'closeFriends'] as const).map(aud => (
                    <button 
                      key={aud}
                      onClick={() => {
                        setAudience(aud);
                      }}
                      className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-1 border ${
                        audience === aud 
                          ? 'bg-white text-black border-white shadow-[0_8px_20px_rgba(255,255,255,0.1)]' 
                          : 'text-white/30 border-transparent hover:text-white'
                      }`}
                    >
                      {aud === 'public' && <Globe size={10} />}
                      {aud === 'followers' && <Users size={10} />}
                      {aud === 'closeFriends' && <Shield size={10} />}
                      {aud === 'public' ? 'Public' : aud === 'followers' ? 'Network' : 'Close'}
                    </button>
                  ))}
                </div>

                {/* Sub-actions for Close List & Hide Note */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button 
                    onClick={() => setIsCloseFriendsModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-all text-[9px] font-bold text-white/70 hover:text-white"
                  >
                    <Shield className="text-aeirmist-cyan" size={12} />
                    <span>Close List ({closeFriendsList.length})</span>
                  </button>

                  <button 
                    onClick={() => setIsHideNotesModalOpen(true)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border transition-all text-[9px] font-bold ${
                      hiddenFromUserIds.length > 0
                        ? 'bg-aeirmist-magenta/15 border-aeirmist-magenta/40 text-aeirmist-magenta'
                        : 'bg-white/[0.04] border-white/10 text-white/70 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    <EyeOff size={12} />
                    <span>Hide Note {hiddenFromUserIds.length > 0 ? `(${hiddenFromUserIds.length})` : ''}</span>
                  </button>
                </div>
              </div>

              <button 
                onClick={handleCreate}
                disabled={(!noteContent.trim() && !selectedMusic && !media) || isUploading}
                className="w-full py-5 rounded-[1.8rem] bg-gradient-to-tr from-aeirmist-cyan to-aeirmist-magenta text-white font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-2"
              >
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : 'Share Note'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Selected Friend Note Modal */}
      <AnimatePresence>
        {selectedFriendNote && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              onClick={() => setSelectedFriendNote(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-[#0c0c0f] border border-white/10 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.9)] p-8 flex flex-col items-center overflow-hidden"
            >
              {/* Close Button */}
              <button onClick={() => setSelectedFriendNote(null)} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors p-2">
                <X size={20} />
              </button>

              {/* Profile & Name */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 rounded-[2.5rem] border-2 border-aeirmist-magenta p-1.5 mb-4 group cursor-pointer relative">
                  <div className="w-full h-full rounded-[2.2rem] overflow-hidden bg-black">
                    <img src={getAvatarUrl(selectedFriendNote.chat.photo)} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  {onlineUsers.has(selectedFriendNote.note.authorId) && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-aeirmist-lime rounded-xl border-[4px] border-[#0c0c0f] shadow-lg" />
                  )}
                </div>
                <h2 className="text-xl font-display font-black text-white tracking-tight">{selectedFriendNote.chat.name || 'User'}</h2>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-[9px] text-white/30 font-black uppercase tracking-widest">{formatAeirmistTimestamp(selectedFriendNote.note.createdAt)}</span>
                   <span className="w-1 h-1 rounded-full bg-white/10" />
                   <span className={`text-[9px] font-black uppercase tracking-widest ${onlineUsers.has(selectedFriendNote.note.authorId) && selectedFriendNote.chat?.messagingSettings?.onlineStatus !== false ? 'text-aeirmist-lime' : 'text-white/20'}`}>
                    {formatActiveStatus(
                      onlineUsers.has(selectedFriendNote.note.authorId), 
                      selectedFriendNote.chat?.lastSeen,
                      selectedFriendNote.chat?.messagingSettings?.onlineStatus === false
                    )}
                   </span>
                </div>
              </div>
              
              {/* Note Content Bubble */}
              <div className="bg-white/[0.03] rounded-[2rem] p-8 w-full text-center border border-white/5 mb-8 relative">
                <div className="absolute -top-3 left-10 text-aeirmist-magenta opacity-50"><MessageCircle size={24} fill="currentColor" /></div>
                <p className="text-2xl font-bold text-white leading-snug tracking-tight">{selectedFriendNote.note.content}</p>
                
                {selectedFriendNote.note.music && (
                  <div className="flex items-center justify-center gap-2 mt-6 py-2 px-4 bg-white/5 rounded-full text-aeirmist-cyan text-[10px] font-black tracking-[0.15em] uppercase w-fit mx-auto border border-aeirmist-cyan/20">
                    <Volume2 size={12} className="animate-pulse" />
                    {selectedFriendNote.note.music}
                  </div>
                )}
              </div>

              {/* Reactions Bar */}
              <div className="flex w-full gap-2 mb-8 bg-white/5 p-2 rounded-[1.8rem] border border-white/5">
                {REACTIONS.map(emoji => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.2, y: -5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleReact(selectedFriendNote.note.id, emoji)}
                    className="flex-1 h-12 rounded-2xl hover:bg-white/10 flex items-center justify-center text-2xl transition-all"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
              
               <button 
                onClick={() => {
                  onReplyNote?.(selectedFriendNote.chat.id, selectedFriendNote.note.content, selectedFriendNote.chat.name || 'User');
                  setSelectedFriendNote(null);
                }}
                className="w-full py-5 rounded-[1.8rem] bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] hover:bg-aeirmist-cyan transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 mb-3"
              >
                <MessageCircle size={16} />
                Reply
              </button>

              <button 
                onClick={async () => {
                  if (!profile || !selectedFriendNote) return;
                  const shareText = `Check out @${selectedFriendNote.chat.username || 'user'}'s note on Aeirmist: "${selectedFriendNote.note.content}"`;
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: 'Aeirmist Note',
                        text: shareText,
                        url: window.location.origin
                      });
                    } catch (err) {}
                  } else {
                    await navigator.clipboard.writeText(shareText);
                    addToast({ title: 'Link Copied', message: 'Note content copied to clipboard.', type: 'success' });
                  }
                  setSelectedFriendNote(null);
                }}
                className="w-full py-5 rounded-[1.8rem] bg-white/5 border border-white/10 text-white/40 font-black uppercase tracking-[0.3em] text-[10px] hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                Share
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* My Note Analytics Modal */}
      <AnimatePresence>
        {viewingMyNote && myNote && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              onClick={() => setViewingMyNote(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-[440px] bg-[#0c0c0f] border border-white/10 rounded-[3rem] shadow-[0_40px_120px_rgba(0,0,0,0.9)] p-10 flex flex-col items-center"
            >
              <button onClick={() => setViewingMyNote(false)} className="absolute top-8 right-8 text-white/30 hover:text-white transition-colors p-2">
                <X size={20} />
              </button>
              
              <div className="w-20 h-20 rounded-[2rem] border-2 border-aeirmist-cyan p-1.5 mb-6 relative">
                <img src={getAvatarUrl(profile?.photoURL)} alt="" className="w-full h-full rounded-[1.7rem] object-cover" />
                <div className="absolute -top-2 -right-2 bg-aeirmist-cyan text-black p-1 rounded-lg border-2 border-[#0c0c0f] shadow-lg">
                   <Globe size={10} />
                </div>
              </div>
              
              <h2 className="text-xl font-display font-black text-white tracking-widest uppercase mb-1">Live Activity</h2>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-8">Visible for 24h • Posted {getRelativeTime(myNote.createdAt)} ago</p>
              
              <div className="bg-white/[0.03] rounded-[2.2rem] p-8 w-full text-center border border-white/5 mb-8">
                <p className="text-2xl font-bold text-white leading-tight tracking-tight">{myNote.content}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full mb-10">
                <button 
                  onClick={() => setActiveSheet('seen')}
                  className="flex flex-col items-center justify-center p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-aeirmist-cyan/20 transition-all group"
                >
                  <Eye size={22} className="text-aeirmist-cyan mb-3 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Views</span>
                  <span className="text-2xl font-display font-black text-white">{myNote.seenBy?.length || 0}</span>
                </button>
                <button 
                  onClick={() => setActiveSheet('reactions')}
                  className="flex flex-col items-center justify-center p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-aeirmist-magenta/20 transition-all group"
                >
                  <Heart size={22} className="text-aeirmist-magenta mb-3 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Reactions</span>
                  <span className="text-2xl font-display font-black text-white">{myNote.reactions?.length || 0}</span>
                </button>
              </div>
              
              <div className="flex w-full gap-4">
                <button 
                  onClick={handleDeleteNote}
                  className="flex-1 py-4.5 rounded-[1.8rem] bg-rose-500/10 border border-rose-500/20 text-rose-500 font-black uppercase tracking-widest text-[9px] hover:bg-rose-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
                <button 
                  onClick={() => { setViewingMyNote(false); setIsCreating(true); }}
                  className="flex-[2] py-4.5 rounded-[1.8rem] bg-white text-black font-black uppercase tracking-widest text-[9px] hover:bg-aeirmist-cyan transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus size={14} />
                  New Note
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sheets for Seen/Reactions */}
      <AnimatePresence>
        {activeSheet && myNote && (
          <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
              onClick={() => setActiveSheet(null)}
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0, transition: { type: 'spring', stiffness: 350, damping: 30 } }}
              exit={{ y: '100%', transition: { duration: 0.2, ease: "easeInOut" } }}
              className="relative w-full max-w-md h-[80vh] sm:h-[600px] bg-[#0c0c10] sm:rounded-[3rem] rounded-t-[3rem] shadow-[0_-20px_60px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border-t sm:border border-white/10"
            >
              {/* Sheet Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-[#0a0a0d]">
                <div className="flex items-center gap-3">
                   <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeSheet === 'seen' ? 'bg-aeirmist-cyan/10 text-aeirmist-cyan' : 'bg-aeirmist-magenta/10 text-aeirmist-magenta'}`}>
                      {activeSheet === 'seen' ? <Eye size={16} /> : <Heart size={16} />}
                   </div>
                   <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">
                     {activeSheet === 'seen' ? 'Seen By' : 'Reactions'}
                   </h3>
                </div>
                <button onClick={() => setActiveSheet(null)} className="text-white/20 hover:text-white transition-colors bg-white/5 p-2 rounded-xl">
                  <X size={18} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeSheet === 'seen' ? (
                  myNote.seenBy && myNote.seenBy.length > 0 ? (
                    <div className="space-y-2">
                      {myNote.seenBy.map((s: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-[1.8rem] transition-all group border border-transparent hover:border-white/5">
                          <div className="relative">
                            <img src={getAvatarUrl(s.userAvatar)} className="w-12 h-12 rounded-[1.1rem] object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-aeirmist-cyan rounded-lg border-2 border-[#0c0c10] flex items-center justify-center">
                               <CheckCircle2 size={8} className="text-black" strokeWidth={4} />
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col">
                            <span className="text-sm font-bold text-white group-hover:text-aeirmist-cyan transition-colors">{s.userName}</span>
                            <span className="text-[10px] text-white/30 font-black uppercase tracking-wider">{getRelativeTime(s.timestamp)} ago</span>
                          </div>
                          <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 opacity-0 group-hover:opacity-100 transition-all">
                             <MoreHorizontal size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white/20 py-20">
                      <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-dashed border-white/10 flex items-center justify-center mb-6">
                        <Eye size={32} className="opacity-20" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center max-w-[180px] leading-relaxed">No data detected on this frequency yet.</p>
                    </div>
                  )
                ) : (
                  myNote.reactions && myNote.reactions.length > 0 ? (
                    <div className="flex flex-col h-full">
                      <div className="flex flex-wrap gap-2 px-4 pb-6 mb-4">
                        {Array.from(new Set(myNote.reactions.map((r: any) => r.emoji))).map((emoji: any) => (
                           <button key={emoji} className="px-5 py-2 rounded-full bg-white/5 text-white text-xs font-bold border border-white/5 flex items-center gap-2 hover:bg-white/10 transition-all">
                             <span className="text-lg">{emoji}</span>
                             <span className="text-white/40 font-black tracking-widest">{myNote.reactions.filter((r: any) => r.emoji === emoji).length}</span>
                           </button>
                        ))}
                      </div>
                      <div className="flex-1 space-y-2">
                        {myNote.reactions.map((r: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-[1.8rem] transition-all group border border-transparent hover:border-white/5">
                            <div className="relative">
                              <img src={getAvatarUrl(r.userAvatar)} className="w-12 h-12 rounded-[1.1rem] object-cover group-hover:scale-105 transition-transform" />
                              <span className="absolute -bottom-2 -right-2 text-2xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] transform group-hover:scale-125 transition-transform">{r.emoji}</span>
                            </div>
                            <div className="flex-1 flex flex-col">
                              <span className="text-sm font-bold text-white group-hover:text-aeirmist-magenta transition-colors">{r.userName}</span>
                              <span className="text-[10px] text-white/30 font-black uppercase tracking-wider">{getRelativeTime(r.timestamp)} ago</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white/20 py-20">
                      <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-dashed border-white/10 flex items-center justify-center mb-6">
                        <Heart size={32} className="opacity-20" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center max-w-[180px] leading-relaxed">No reactions yet.</p>
                    </div>
                  )
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MUSIC SEARCH MODAL INTEGRATION */}
      <AnimatePresence>
        {isMusicModalOpen && (
          <MusicSearchModal 
            onClose={() => setIsMusicModalOpen(false)}
            onSelect={(song) => {
              setSelectedMusic(song);
              setIsMusicModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* CLOSE FRIENDS LIST MANAGER MODAL */}
      <AnimatePresence>
        {isCloseFriendsModalOpen && (
          <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-2xl"
              onClick={() => setIsCloseFriendsModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#0d0d12] border border-white/10 rounded-[2.5rem] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-aeirmist-cyan/15 border border-aeirmist-cyan/30 flex items-center justify-center text-aeirmist-cyan">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">Close Friends List</h3>
                    <p className="text-[10px] text-white/40 font-medium">{closeFriendsList.length} member{closeFriendsList.length === 1 ? '' : 's'} in your network</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCloseFriendsModalOpen(false)}
                  className="w-9 h-9 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search Input */}
              <div className="relative mb-4">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input 
                  type="text"
                  value={closeFriendsSearch}
                  onChange={(e) => setCloseFriendsSearch(e.target.value)}
                  placeholder="Search connections or username..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-9 pr-4 py-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-aeirmist-cyan/40 transition-all"
                />
                {closeFriendsSearch && (
                  <button onClick={() => setCloseFriendsSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white text-xs">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Candidates List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                {filteredCloseFriendsCandidates.length > 0 ? (
                  filteredCloseFriendsCandidates.map(user => {
                    const isCF = (isCloseFriend && isCloseFriend(user.id)) || closeFriendsList.includes(user.id);
                    return (
                      <div key={user.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all">
                        <div className="flex items-center gap-3">
                          <img src={getAvatarUrl(user.photo)} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                          <div>
                            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                              {user.name}
                              {isCF && <Sparkles className="text-aeirmist-cyan shrink-0" size={14} />}
                            </h4>
                            {user.username && <p className="text-[10px] text-white/40">@{user.username}</p>}
                          </div>
                        </div>
                        <button 
                          onClick={async () => {
                            const currentlyIsCF = (isCloseFriend && isCloseFriend(user.id)) || closeFriendsList.includes(user.id);
                            await toggleCloseFriend(user.id);
                            addToast?.({
                              title: currentlyIsCF ? "Removed" : "Added",
                              message: currentlyIsCF ? `Removed ${user.name} from Close Friends` : `Added ${user.name} to Close Friends`,
                              type: "success"
                            });
                          }}
                          className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                            isCF
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                              : 'bg-aeirmist-cyan/15 border-aeirmist-cyan/40 text-aeirmist-cyan hover:bg-aeirmist-cyan/25'
                          }`}
                        >
                          {isCF ? (
                            <>
                              <UserMinus size={12} />
                              <span>Remove</span>
                            </>
                          ) : (
                            <>
                              <UserPlus size={12} />
                              <span>Add</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-white/30 text-xs">
                    No connections found.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-white/10 mt-4 flex justify-end">
                <button 
                  onClick={() => setIsCloseFriendsModalOpen(false)}
                  className="w-full py-3.5 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-aeirmist-cyan transition-all shadow-lg active:scale-95"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HIDE NOTE FROM USERS MODAL */}
      <AnimatePresence>
        {isHideNotesModalOpen && (
          <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-2xl"
              onClick={() => setIsHideNotesModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#0d0d12] border border-white/10 rounded-[2.5rem] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-aeirmist-magenta/15 border border-aeirmist-magenta/30 flex items-center justify-center text-aeirmist-magenta">
                    <EyeOff size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">Hide Note From Users</h3>
                    <p className="text-[10px] text-white/40 font-medium">Selected users won't see your note</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsHideNotesModalOpen(false)}
                  className="w-9 h-9 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search Input */}
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input 
                  type="text"
                  value={hideNotesSearch}
                  onChange={(e) => setHideNotesSearch(e.target.value)}
                  placeholder="Search users to hide note from..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-9 pr-4 py-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-aeirmist-magenta/40 transition-all"
                />
              </div>

              {/* Counter / Clear All Bar */}
              {hiddenFromUserIds.length > 0 && (
                <div className="flex items-center justify-between bg-aeirmist-magenta/10 border border-aeirmist-magenta/20 px-3.5 py-2.5 rounded-2xl mb-3 text-xs text-aeirmist-magenta">
                  <span className="font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                    <EyeOff size={12} />
                    Hidden from {hiddenFromUserIds.length} user{hiddenFromUserIds.length === 1 ? '' : 's'}
                  </span>
                  <button 
                    onClick={() => setHiddenFromUserIds([])}
                    className="text-[9px] font-black uppercase tracking-widest underline hover:opacity-80"
                  >
                    Clear All
                  </button>
                </div>
              )}

              {/* User List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                {filteredHideNotesCandidates.length > 0 ? (
                  filteredHideNotesCandidates.map(user => {
                    const isHidden = hiddenFromUserIds.includes(user.id);
                    return (
                      <div key={user.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all">
                        <div className="flex items-center gap-3">
                          <img src={getAvatarUrl(user.photo)} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                          <div>
                            <h4 className="text-xs font-bold text-white">{user.name}</h4>
                            {user.username && <p className="text-[10px] text-white/40">@{user.username}</p>}
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setHiddenFromUserIds(prev => 
                              isHidden ? prev.filter(id => id !== user.id) : [...prev, user.id]
                            );
                          }}
                          className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                            isHidden
                              ? 'bg-aeirmist-magenta/20 border-aeirmist-magenta text-aeirmist-magenta'
                              : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                          }`}
                        >
                          {isHidden ? (
                            <>
                              <EyeOff size={12} />
                              <span>Hidden</span>
                            </>
                          ) : (
                            <>
                              <Eye size={12} />
                              <span>Hide Note</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-white/30 text-xs">
                    No connections found.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-white/10 mt-4 flex justify-end">
                <button 
                  onClick={() => setIsHideNotesModalOpen(false)}
                  className="w-full py-3.5 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-aeirmist-cyan transition-all shadow-lg active:scale-95"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
