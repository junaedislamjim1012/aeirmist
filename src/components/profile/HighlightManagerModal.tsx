import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAeirmist } from '../../context/AeirmistContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { X, Check, Loader2, AlertTriangle } from 'lucide-react';

interface HighlightManagerModalProps {
  mode: 'create' | 'edit';
  existingHighlight?: { id: string; label: string; coverUrl: string; stories: string[] };
  onClose: () => void;
  onSaved: () => void;
}

export const HighlightManagerModal: React.FC<HighlightManagerModalProps> = ({
  mode,
  existingHighlight,
  onClose,
  onSaved
}) => {
  const { db, user, addToast } = useAeirmist();

  // Local state
  const [label, setLabel] = useState(existingHighlight?.label || '');
  const [userStories, setUserStories] = useState<any[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>(existingHighlight?.stories || []);
  const [coverStoryId, setCoverStoryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch the current user's own stories (expired or not, ordered by createdAt desc)
  useEffect(() => {
    if (!db || !user?.uid) return;

    setLoadingStories(true);
    const storiesRef = collection(db, 'stories');
    const q = query(storiesRef, where('userId', '==', user.uid));

    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      // Sort client-side by createdAt descending to avoid composite index requirements
      fetched.sort((a: any, b: any) => {
        const getMs = (val: any) => {
          if (!val) return 0;
          if (typeof val.toMillis === 'function') return val.toMillis();
          if (val instanceof Date) return val.getTime();
          if (typeof val === 'number') return val;
          if (val.seconds) return val.seconds * 1000;
          return 0;
        };
        return getMs(b.createdAt) - getMs(a.createdAt);
      });

      setUserStories(fetched);
      setLoadingStories(false);
    }, (error) => {
      console.error("Error fetching stories in HighlightManagerModal", error);
      setLoadingStories(false);
    });

    return () => unsub();
  }, [db, user?.uid]);

  // Set initial cover story based on existingHighlight.coverUrl if editing
  useEffect(() => {
    if (mode === 'edit' && existingHighlight && userStories.length > 0) {
      const match = userStories.find(s => s.mediaUrl === existingHighlight.coverUrl);
      if (match) {
        setCoverStoryId(match.id);
      } else if (existingHighlight.stories.length > 0) {
        setCoverStoryId(existingHighlight.stories[0]);
      }
    }
  }, [mode, existingHighlight, userStories]);

  // If coverStoryId is no longer in selectedStoryIds, reset it to the first selected story ID
  useEffect(() => {
    if (selectedStoryIds.length > 0) {
      if (!coverStoryId || !selectedStoryIds.includes(coverStoryId)) {
        setCoverStoryId(selectedStoryIds[0]);
      }
    } else {
      setCoverStoryId(null);
    }
  }, [selectedStoryIds, coverStoryId]);

  // Map selectedStoryIds to actual story objects
  const selectedStories = useMemo(() => {
    return userStories.filter(s => selectedStoryIds.includes(s.id));
  }, [userStories, selectedStoryIds]);

  // Toggle selected story
  const toggleStory = (storyId: string) => {
    setSelectedStoryIds(prev => {
      if (prev.includes(storyId)) {
        return prev.filter(id => id !== storyId);
      } else {
        return [...prev, storyId];
      }
    });
  };

  // Determine chosen cover URL
  const chosenCoverUrl = useMemo(() => {
    if (!coverStoryId) {
      return selectedStories[0]?.mediaUrl || '';
    }
    const match = selectedStories.find(s => s.id === coverStoryId);
    return match?.mediaUrl || selectedStories[0]?.mediaUrl || '';
  }, [coverStoryId, selectedStories]);

  // Create or edit handler
  const handleSave = async () => {
    if (!db || !user?.uid) return;
    if (!label.trim()) {
      addToast?.({ title: "Validation Error", message: "Please enter a highlight name.", type: "warning" });
      return;
    }
    if (selectedStoryIds.length === 0) {
      addToast?.({ title: "Validation Error", message: "Please select at least 1 story.", type: "warning" });
      return;
    }

    setIsSaving(true);
    try {
      if (mode === 'create') {
        await addDoc(collection(db, 'highlights'), {
          userId: user.uid,
          label: label.trim(),
          coverUrl: chosenCoverUrl,
          stories: selectedStoryIds,
          isHighlight: true, // Tag as highlight
          createdAt: serverTimestamp()
        });
        addToast?.({ title: "Highlight Created", message: "Your new highlight has been published.", type: "success" });
      } else {
        if (!existingHighlight?.id) throw new Error("Missing highlight ID");
        await updateDoc(doc(db, 'highlights', existingHighlight.id), {
          label: label.trim(),
          coverUrl: chosenCoverUrl,
          stories: selectedStoryIds,
          updatedAt: serverTimestamp()
        });
        addToast?.({ title: "Highlight Updated", message: "Changes saved successfully.", type: "success" });
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error("Failed to save highlight:", error);
      addToast?.({ title: "Operation Failed", message: "Error writing database updates.", type: "warning" });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!db || !existingHighlight?.id) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'highlights', existingHighlight.id));
      addToast?.({ title: "Highlight Deleted", message: "Highlight container removed.", type: "success" });
      onSaved();
      onClose();
    } catch (error) {
      console.error("Failed to delete highlight:", error);
      addToast?.({ title: "Operation Failed", message: "Error deleting from database.", type: "warning" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col justify-end font-sans">
      {/* Dark backdrop overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Main Bottom Sheet Container */}
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative bg-[#090a0f] rounded-t-[2.5rem] border-t border-white/10 p-6 flex flex-col max-h-[90vh] overflow-hidden z-10 w-full max-w-lg mx-auto shadow-2xl"
      >
        {/* Drag handle line */}
        <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-4 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4 shrink-0">
          <h4 className="text-xs font-black uppercase tracking-[0.22em] text-aeirmist-cyan">
            {mode === 'create' ? 'Create New Highlight' : 'Edit Highlight'}
          </h4>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/5 text-white/50 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6">
          
          {/* Label Input */}
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40 block">
              Highlight Name
            </label>
            <input 
              type="text"
              maxLength={15}
              placeholder="e.g. Vibe, Memories..."
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-aeirmist-cyan focus:ring-1 focus:ring-aeirmist-cyan/30 transition-all tracking-wider font-semibold placeholder:text-white/20"
            />
          </div>

          {/* Stories Grid Picker */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40 block">
                Select Stories ({selectedStoryIds.length} Selected)
              </label>
              {selectedStoryIds.length > 0 && (
                <button 
                  onClick={() => setSelectedStoryIds([])}
                  className="text-[8px] font-black uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {loadingStories ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="animate-spin text-aeirmist-cyan" size={20} />
                <span className="text-[8px] font-black uppercase tracking-[0.18em] text-white/30">Loading Storyboard...</span>
              </div>
            ) : userStories.length === 0 ? (
              <div className="py-12 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-black/20">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">No Stories Archive Found</span>
                <p className="text-[10px] text-white/45 max-w-xs">You need to upload at least one story first to create a custom highlight container.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 max-h-[32vh] overflow-y-auto pr-1">
                {userStories.map(story => {
                  const isSelected = selectedStoryIds.includes(story.id);
                  return (
                    <div 
                      key={story.id}
                      onClick={() => toggleStory(story.id)}
                      className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer border transition-all group ${
                        isSelected ? 'border-aeirmist-cyan scale-[0.98]' : 'border-white/5 hover:border-white/20'
                      }`}
                    >
                      <img 
                        src={story.mediaUrl} 
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                          isSelected ? 'opacity-80' : 'opacity-55 group-hover:opacity-75'
                        }`} 
                        alt="" 
                      />
                      
                      {/* Selection overlay */}
                      <div className={`absolute inset-0 transition-opacity ${isSelected ? 'bg-aeirmist-cyan/10' : 'bg-black/20 opacity-0 group-hover:opacity-100'}`} />

                      {/* Checkmark Indicator */}
                      <div className={`absolute top-2 right-2 w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-aeirmist-cyan border-aeirmist-cyan text-black shadow-[0_0_8px_rgba(0,242,255,0.5)]' 
                          : 'bg-black/40 border-white/20 text-transparent'
                      }`}>
                        <Check size={12} className="stroke-[3]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cover Selector Row (only visible if 2+ selected) */}
          {selectedStoryIds.length >= 2 && (
            <div className="space-y-3 animate-fade-in pt-2 border-t border-white/5">
              <label className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40 block">
                Choose Cover Image
              </label>
              <div className="flex items-center gap-3 overflow-x-auto py-1 pr-2 scrollbar-thin">
                {selectedStories.map(story => {
                  const isCover = coverStoryId === story.id;
                  return (
                    <div 
                      key={story.id}
                      onClick={() => setCoverStoryId(story.id)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden cursor-pointer border transition-all shrink-0 p-[2px] ${
                        isCover ? 'border-aeirmist-cyan scale-105 bg-aeirmist-cyan/20 shadow-[0_0_8px_rgba(0,242,255,0.3)]' : 'border-white/10 hover:border-white/35'
                      }`}
                    >
                      <img src={story.mediaUrl} className="w-full h-full object-cover rounded-[10px]" alt="" />
                      
                      {isCover && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-md bg-aeirmist-cyan text-black flex items-center justify-center">
                          <Check size={10} className="stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Actions Footer */}
        <div className="pt-4 border-t border-white/5 mt-4 flex flex-col gap-2 shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !label.trim() || selectedStoryIds.length === 0}
              className={`flex-1 py-3 rounded-2xl text-black text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                !label.trim() || selectedStoryIds.length === 0
                  ? 'bg-neutral-800 text-white/30 cursor-not-allowed border border-white/5'
                  : 'bg-aeirmist-cyan hover:opacity-90 shadow-[0_0_15px_rgba(0,242,255,0.3)]'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{mode === 'create' ? 'Create' : 'Save Changes'}</span>
              )}
            </button>
          </div>

          {/* Delete Highlight Button (Edit mode only) */}
          {mode === 'edit' && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 mt-1 bg-red-950/20 border border-red-500/15 hover:bg-red-500/10 hover:border-red-500/30 text-red-400 hover:text-red-300 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              Terminate Highlight
            </button>
          )}
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 font-sans">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm rounded-[2rem] bg-[#0c0d12] border border-white/10 p-6 flex flex-col items-center text-center shadow-2xl z-10"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 animate-pulse">
                <AlertTriangle size={24} />
              </div>
              
              <h4 className="text-sm font-black uppercase tracking-[0.2em] text-red-400 mb-2">Delete Highlight</h4>
              <p className="text-xs text-white/60 mb-6 leading-relaxed">
                Are you sure you want to permanently delete this highlight container? This action is irreversible.
              </p>
              
              <div className="flex flex-col gap-2 w-full">
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_12px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 size={12} className="animate-spin" /> : 'Yes, Delete Highlight'}
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
