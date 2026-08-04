import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { useAeirmist } from '../context/AeirmistContext';

export const useInboxData = (allowedAuthorIds?: string[]) => {
  const { db, user, profile, isFollowing, canWrite, addToast } = useAeirmist();
  const [notes, setNotes] = useState<any[]>([]);
  const [activeStories, setActiveStories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const allowedIdsStr = allowedAuthorIds?.join(',');
  const followingStr = profile?.social?.following?.join(',') || '';

  useEffect(() => {
    if (!db || !user || !profile?.id) {
      setNotes([]);
      setActiveStories(new Set());
      setLoading(false);
      return;
    }

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayTimestamp = Timestamp.fromDate(yesterday);
    
    // 1. Listen to Notes
    const following = followingStr ? followingStr.split(',') : [];
    const extraIds = allowedIdsStr ? allowedIdsStr.split(',').filter(Boolean) : [];
    const followingWithMe = Array.from(new Set([...following, profile.id, ...extraIds])).slice(0, 30); // Firestore 'in' limit is 30

    if (followingWithMe.length === 0) {
      setNotes([]);
      setLoading(false);
      return;
    }

    const notesQuery = query(
      collection(db, 'notes'),
      where('createdAt', '>', yesterdayTimestamp)
    );

    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      const fetchedNotes = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((note: any) => {
          // Exclude notes explicitly hidden from current user
          if (profile?.id && (note.hiddenFrom || []).includes(profile.id)) return false;

          // Check if author is in my following list or is me
          if (!followingWithMe.includes(note.authorId)) return false;
          
          // Privacy Filtering
          if (note.authorId === profile.id) return true;
          if (note.audience === 'public') return true;
          if (note.audience === 'followers') return true; // Since I follow them (checked above)
          if (note.audience === 'closeFriends') {
             return (note.visibleTo || []).includes(profile.id);
          }
          return false;
        })
        .sort((a: any, b: any) => {
          const tA = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
          const tB = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
          return tB - tA;
        })
        .slice(0, 20); // Increase limit slightly
      setNotes(fetchedNotes);
      setLoading(false);
    }, (error) => {
      console.warn("Notes sync delayed.", error);
    });

    // 2. Listen to Stories - Efficient sub-query
    const storiesQuery = query(
      collection(db, 'stories'),
      where('createdAt', '>', yesterdayTimestamp)
    );

    const unsubscribeStories = onSnapshot(storiesQuery, (snapshot) => {
      const activeSet = new Set<string>();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const authorId = data.authorId || data.userId;
        if (authorId && followingWithMe.includes(authorId)) {
          // Check story privacy if available
          const audience = data.audience || 'public';
          if (authorId === profile.id || audience === 'public' || audience === 'followers') {
            activeSet.add(authorId);
          } else if (audience === 'closeFriends') {
            const visibleTo = data.visibleTo || [];
            if (visibleTo.includes(profile.id)) {
              activeSet.add(authorId);
            }
          }
        }
      });
      setActiveStories(activeSet);
    }, (error) => {
      console.warn("Stories status sync delayed.", error);
    });

    return () => {
      unsubscribeNotes();
      unsubscribeStories();
    };
  }, [db, user?.uid, profile?.id, followingStr, allowedIdsStr]);

  const createNote = async (content: string, audience: 'public' | 'followers' | 'closeFriends' = 'public', music?: string, mediaUrl?: string, mediaType?: 'image' | 'video', hiddenFrom: string[] = []) => {
    if (!db || !user || !profile || !canWrite('createNote', 10000)) return;
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await addDoc(collection(db, 'notes'), {
        authorId: profile.id,
        authorUid: user.uid,
        userName: profile.displayName || profile.username,
        userAvatar: profile.photoURL,
        content,
        audience,
        visibleTo: audience === 'closeFriends' ? (profile.social?.closeFriends || []) : [],
        hiddenFrom: hiddenFrom || [],
        music: music || null,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        reactions: [],
        seenBy: []
      });
    } catch (e: any) { console.error("Failed to create note", e); addToast({ title: "Failed", message: e.message || "Failed to create note", type: "warning" }); }
  };

  const deleteNote = async (noteId: string) => {
    if (!db || !noteId) return;
    try {
      await deleteDoc(doc(db, 'notes', noteId));
    } catch (e: any) {
      console.error("Failed to delete note", e);
    }
  };

  return {
    notes,
    activeStories,
    createNote,
    deleteNote,
    loading
  };
};
