import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, FileText, Film, BookOpen, Video as VideoIcon, ListTodo, 
  Smile, Image as ImageIcon, MapPin, Users, Music as MusicIcon, 
  Link as LinkIcon, Sparkles, Trash2, Globe, Eye, MessageSquare, 
  Settings, Monitor, Smartphone, LayoutGrid, Check, Play, Pause, 
  AlertCircle, ChevronLeft, ChevronRight, X, Clock, HelpCircle, ArrowLeft, ShieldCheck
} from 'lucide-react';
import { useAeirmist } from '../../context/AeirmistContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { MediaEditor } from './MediaEditor';
import { PollComposer } from './PollComposer';
import { LocationSearch } from './LocationSearch';
import { TagPeople } from './TagPeople';
import { MusicSelector } from './MusicSelector';
import { GifPicker } from './GifPicker';

// Rich post gradients
const THEME_GRADIENTS = [
  { id: 'neon_cyber', label: 'Ocean Dark', css: 'linear-gradient(135deg, #050b14 0%, #0c203b 100%)', border: 'border-cyan-500/30' },
  { id: 'neon_sunset', label: 'Neon Sunset', css: 'linear-gradient(135deg, #2b0c1e 0%, #06080d 100%)', border: 'border-pink-500/30' },
  { id: 'holographic', label: 'Hologram', css: 'linear-gradient(135deg, #10051e 0%, #081a2e 100%)', border: 'border-purple-500/30' },
  { id: 'obsidian', label: 'Obsidian Void', css: 'linear-gradient(135deg, #020305 0%, #0b0c10 100%)', border: 'border-white/5' },
  { id: 'retro_grid', label: 'Synth Grid', css: 'linear-gradient(135deg, #11001c 0%, #001220 100%)', border: 'border-fuchsia-500/20' },
  { id: 'plain', label: 'Plain (No Canvas)', css: 'transparent', border: 'border-white/10' }
];

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

interface PostStudioProps {
  onClose: () => void;
  initialType?: string | null;
}

export const PostStudio: React.FC<PostStudioProps> = React.memo(({ onClose, initialType = null }) => {
  const { user, profile, uploadMedia, addToast } = useAeirmist();

  // Active composer state
  const [selectedType, setSelectedType] = useState<string>(initialType || 'photo');
  const [caption, setCaption] = useState('');
  
  // Media Picker states
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [selectedMediaIdx, setSelectedMediaIdx] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  // Cleanup Object URLs on unmount
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    };
  }, []);

  const createStableUrl = (file: File) => {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.add(url);
    return url;
  };

  // Sub-feature states
  const [poll, setPoll] = useState<any>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [taggedPeople, setTaggedPeople] = useState<any[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<any>(null);
  const [attachedGif, setAttachedGif] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkPreview, setLinkPreview] = useState<any>(null);

  // Voice recording mock states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [recordDuration, setRecordDuration] = useState(0);
  const recordIntervalRef = useRef<any>(null);

  // Settings
  const [selectedGradient, setSelectedGradient] = useState(THEME_GRADIENTS[0]);
  const [audience, setAudience] = useState<'public' | 'followers' | 'close_friends' | 'only_me'>(() => {
    return (localStorage.getItem('aeirmist_post_audience') as any) || 'public';
  });
  const [allowComments, setAllowComments] = useState(true);
  const [hideLikes, setHideLikes] = useState(false);
  const [sensitiveWarning, setSensitiveWarning] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');

  // UI state
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [activeRightPanel, setActiveRightPanel] = useState<'details' | 'tag' | 'location' | 'music' | 'settings'>('details');

  // Text Formatter functions
  const insertFormatting = (syntaxStart: string, syntaxEnd: string = '') => {
    const textarea = document.getElementById('caption-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = syntaxStart + selected + (syntaxEnd || syntaxStart);
    setCaption(text.substring(0, start) + replacement + text.substring(end));
    
    // Focus back
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + syntaxStart.length, start + syntaxStart.length + selected.length);
    }, 10);
  };

  // Draft save & restore
  const handleSaveDraft = () => {
    const draftPayload = {
      selectedType,
      caption,
      mediaFiles,
      poll,
      location,
      taggedPeople,
      selectedMusic,
      attachedGif,
      linkUrl,
      linkPreview,
      audience,
      allowComments,
      hideLikes,
      sensitiveWarning
    };
    localStorage.setItem('aeirmist_studio_draft', JSON.stringify(draftPayload));
    addToast({
      title: 'Draft Saved',
      message: 'Your creative progress has been saved locally.',
      type: 'info'
    });
  };

  const handleRestoreDraft = () => {
    const raw = localStorage.getItem('aeirmist_studio_draft');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setSelectedType(parsed.selectedType || 'photo');
      setCaption(parsed.caption || '');
      
      // Fix: Restore media files and ensure URLs are usable
      const restoredMedia = (parsed.mediaFiles || []).map((item: any) => {
        // If it's a restored draft, the 'file' object is gone, 
        // we must use the dataUrl (base64) for preview if blob is dead.
        return {
          ...item,
          url: item.dataUrl || item.url // Prefer base64 if it exists for persistence
        };
      });
      
      setMediaFiles(restoredMedia);
      setPoll(parsed.poll || null);
      setLocation(parsed.location || null);
      setTaggedPeople(parsed.taggedPeople || []);
      setSelectedMusic(parsed.selectedMusic || null);
      setAttachedGif(parsed.attachedGif || null);
      setLinkUrl(parsed.linkUrl || '');
      setLinkPreview(parsed.linkPreview || null);
      setAudience(parsed.audience || 'public');
      setAllowComments(parsed.allowComments !== false);
      setHideLikes(!!parsed.hideLikes);
      setSensitiveWarning(!!parsed.sensitiveWarning);
      addToast({
        title: 'Draft Restored',
        message: 'Successfully reloaded your offline draft workspace.',
        type: 'info'
      });
    } catch (e: any) { console.error("Failed to restore draft", e); addToast({ title: "Draft Error", message: "Failed to restore offline draft", type: "warning" }); }
  };

  // Trigger file manager
  const handleAddMediaFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    // Format limits & validation
    const maxFiles = 10;
    if (mediaFiles.length + files.length > maxFiles) {
      addToast({
        title: 'Selection Overflow',
        message: 'Max 10 items allowed per carousel collage.',
        type: 'warning'
      });
      return;
    }

    const currentLength = mediaFiles.length;
    const formatted = files.map(file => {
      const url = createStableUrl(file);
      return {
        file,
        url,
        previewUrl: url,
        type: file.type,
        name: file.name,
        // Preset non-destructive edits
        brightness: 100,
        contrast: 100,
        saturation: 100,
        warmth: 0,
        blur: 0,
        vignette: 0,
        rotate: 0,
        flipX: false,
        flipY: false,
        cropRatio: 'original',
        muted: false,
        volume: 80,
        speed: 1,
        loop: true,
        coverTime: 0
      };
    });

    setMediaFiles(prev => [...prev, ...formatted]);
    setSelectedMediaIdx(currentLength);

    // Sequential base64 conversion to avoid CPU spikes and state jitter
    const processSequentially = async () => {
      for (let i = 0; i < files.length; i++) {
        try {
          const base64Url = await readFileAsDataURL(files[i]);
          setMediaFiles(prev => {
            const updated = [...prev];
            const targetIndex = currentLength + i;
            if (updated[targetIndex]) {
              updated[targetIndex] = {
                ...updated[targetIndex],
                dataUrl: base64Url
              };
            }
            return updated;
          });
        } catch (err: any) { console.error("Error reading file to data URL", err); addToast({ title: "Media Error", message: "Failed to read media file", type: "warning" }); }
      }
    };
    
    processSequentially();
  };

  // Paste / Drag-and-drop handles
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer.files) return;
    const files = Array.from(e.dataTransfer.files);
    
    // Format limits & validation
    const maxFiles = 10;
    if (mediaFiles.length + files.length > maxFiles) {
      addToast({
        title: 'Selection Overflow',
        message: 'Max 10 items allowed per carousel collage.',
        type: 'warning'
      });
      return;
    }

    const currentLength = mediaFiles.length;
    const formatted = files.map(file => {
      const url = createStableUrl(file);
      return {
        file,
        url,
        previewUrl: url,
        type: file.type,
        name: file.name,
        brightness: 100,
        contrast: 100,
        saturation: 100,
        warmth: 0,
        blur: 0,
        vignette: 0,
        rotate: 0,
        flipX: false,
        flipY: false,
        cropRatio: 'original',
        muted: false,
        volume: 80,
        speed: 1,
        loop: true,
        coverTime: 0
      };
    });

    setMediaFiles(prev => [...prev, ...formatted]);
    setSelectedMediaIdx(currentLength);

    const processSequentially = async () => {
      for (let i = 0; i < files.length; i++) {
        try {
          const base64Url = await readFileAsDataURL(files[i]);
          setMediaFiles(prev => {
            const updated = [...prev];
            const targetIndex = currentLength + i;
            if (updated[targetIndex]) {
              updated[targetIndex] = {
                ...updated[targetIndex],
                dataUrl: base64Url
              };
            }
            return updated;
          });
        } catch (err: any) { console.error("Error reading file to data URL", err); addToast({ title: "Media Error", message: "Failed to read media file", type: "warning" }); }
      }
    };
    
    processSequentially();
  };

  // Live URL validation for Link Post
  const handleLinkLookup = () => {
    if (!linkUrl) return;
    // Real card simulation matching standard OpenGraph outputs
    setLinkPreview({
      url: linkUrl,
      title: `${linkUrl.replace('https://', '').split('/')[0]} Hub`,
      description: 'Explore verified shared channels, stories, and live feed updates instantly on Aeirmist platform.',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80'
    });
  };

  // Voice recording mock
  const startRecordingVoice = () => {
    setIsRecording(true);
    setRecordDuration(0);
    recordIntervalRef.current = setInterval(() => {
      setRecordDuration(prev => prev + 1);
    }, 1000);
  };

  const stopRecordingVoice = () => {
    setIsRecording(false);
    clearInterval(recordIntervalRef.current);
    // Simulate audio wave file
    setRecordedAudio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
  };

  const handleMediaChange = React.useCallback((updated: any) => {
    setMediaFiles(prev => {
      const copy = [...prev];
      if (copy[selectedMediaIdx]) {
        copy[selectedMediaIdx] = updated;
      }
      return copy;
    });
  }, [selectedMediaIdx]);

  // Main Publish Action
  const handlePublish = async () => {
    if (isUploading) return;
    
    // Validation
    if (selectedType === 'text' && !caption) {
      addToast({ title: 'Empty Content', message: 'Please write a caption or choose other post types.', type: 'warning' });
      return;
    }
    if (selectedType === 'photo' && mediaFiles.length === 0) {
      addToast({ title: 'No Media Selected', message: 'Please upload at least one image or video for this type.', type: 'warning' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadStatus('Compressing & formatting assets...');

    try {
      setUploadStatus(`Uploading ${mediaFiles.length} media asset(s) in parallel...`);
      
      const progressArray = new Array(mediaFiles.length).fill(0);
      const uploadPromises = mediaFiles.map((item, idx) => {
        return uploadMedia(item.file, 'posts', (progress) => {
          progressArray[idx] = progress;
          const averageProgress = progressArray.reduce((sum, val) => sum + val, 0) / mediaFiles.length;
          // Scale progress from 10% to 90%
          const scaledProgress = 10 + (averageProgress * 0.8);
          setUploadProgress(Math.min(90, Math.floor(scaledProgress)));
        });
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      setUploadStatus('Publishing post...');
      setUploadProgress(92);

      // Create rich payload
      const payload: any = {
        content: caption,
        mediaUrls: uploadedUrls,
        type: selectedType,
        authorId: profile?.id || 'unknown',
        authorUid: user?.uid || 'unknown',
        author: {
          displayName: profile?.displayName || 'User',
          username: profile?.username || 'user',
          photoURL: profile?.photoURL || 'https://picsum.photos/seed/default/100',
          isVerified: profile?.isVerified || false
        },
        likesCount: 0,
        commentsCount: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Extra features
        audience,
        allowComments,
        hideLikes,
        sensitiveWarning,
      };

      if (poll) payload.poll = poll;
      if (location) payload.location = location;
      if (selectedMusic) payload.music = selectedMusic;
      if (attachedGif) payload.attachedGif = attachedGif;
      if (linkPreview) payload.linkPreview = linkPreview;
      if (recordedAudio) payload.voiceUrl = recordedAudio;
      if (selectedType === 'text') {
        payload.gradientId = selectedGradient.id;
      }

      // Add Doc directly in firestore
      await addDoc(collection(db, 'posts'), payload);

      setUploadProgress(100);
      setUploadStatus('Published successfully!');
      
      addToast({
        title: 'Post Published',
        message: 'Your post is now live.',
        type: 'success'
      });

      // Clear draft since published
      localStorage.removeItem('aeirmist_studio_draft');

      setTimeout(() => {
        onClose();
      }, 600);

    } catch (e: any) {
      console.error('Publishing failed', e);
      addToast({
        title: 'Could Not Publish',
        message: e.message || 'An error occurred while publishing your post. Please try again.',
        type: 'warning'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Remember audience selection
  useEffect(() => {
    localStorage.setItem('aeirmist_post_audience', audience);
  }, [audience]);

  return (
    <div className="flex flex-col h-full max-h-[92vh] text-white overflow-hidden font-sans">
      {/* INSTAGRAM-STYLE HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0 bg-[#06090e]">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-full transition-all cursor-pointer text-white/80 hover:text-white active:scale-95"
            aria-label="Close composer"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">Create New Post</h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {localStorage.getItem('aeirmist_studio_draft') && (
            <button
              onClick={handleRestoreDraft}
              className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold rounded-xl transition-all cursor-pointer hidden sm:block text-white/80"
            >
              Restore Draft
            </button>
          )}
          <button
            onClick={handleSaveDraft}
            className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold rounded-xl transition-all cursor-pointer hidden sm:block text-white/80"
          >
            Save Draft
          </button>
          <button
            disabled={isUploading}
            onClick={handlePublish}
            className="px-5 py-1.5 sm:py-2 bg-aeirmist-cyan text-black hover:brightness-110 active:scale-95 text-xs font-bold uppercase rounded-full transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)] disabled:opacity-40 flex items-center gap-1.5 justify-center cursor-pointer"
          >
            {isUploading ? (
              <Clock size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* WORKSPACE AREA: DESKTOP vs PHONE SPLIT LAYOUT */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-y-auto md:overflow-hidden bg-[#020509]">
        
        {/* LEFT / TOP STAGE: MEDIA & LIVE PREVIEW (60% width on Desktop, Full on Mobile) */}
        <div className="w-full md:w-[60%] flex flex-col bg-[#010307] border-b md:border-b-0 md:border-r border-white/10 p-4 sm:p-6 min-h-[340px] md:min-h-0 relative">
          
          {/* Post Type Selector Bar */}
          <div className="flex items-center justify-between gap-2 mb-4 shrink-0 overflow-x-auto scrollbar-none pb-1">
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full p-1">
              {[
                { id: 'photo', label: 'Media', icon: Camera },
                { id: 'text', label: 'Text', icon: FileText },
                { id: 'poll', label: 'Poll', icon: ListTodo },
                { id: 'gif', label: 'GIF', icon: Sparkles },
                { id: 'voice', label: 'Voice', icon: BookOpen },
                { id: 'link', label: 'Link', icon: LinkIcon }
              ].map(mode => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedType(mode.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${selectedType === mode.id ? 'bg-aeirmist-cyan text-black shadow-md shadow-aeirmist-cyan/20' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                >
                  <mode.icon size={14} />
                  <span>{mode.label}</span>
                </button>
              ))}
            </div>

            {/* Device mode toggle for preview */}
            <div className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 shrink-0">
              <button 
                type="button"
                onClick={() => setPreviewMode('desktop')}
                className={`p-1.5 rounded transition-all ${previewMode === 'desktop' ? 'bg-white/10 text-aeirmist-cyan' : 'text-white/40 hover:text-white'}`}
                title="Desktop View"
              >
                <Monitor size={14} />
              </button>
              <button 
                type="button"
                onClick={() => setPreviewMode('mobile')}
                className={`p-1.5 rounded transition-all ${previewMode === 'mobile' ? 'bg-white/10 text-aeirmist-cyan' : 'text-white/40 hover:text-white'}`}
                title="Mobile View"
              >
                <Smartphone size={14} />
              </button>
            </div>
          </div>

          {/* MAIN PREVIEW CANVAS */}
          <div className="flex-1 flex items-center justify-center min-h-[260px] md:min-h-0 relative rounded-2xl overflow-hidden bg-black/40 border border-white/5 p-4">
            
            {/* 1. MEDIA CAROUSEL & PHOTO / VIDEO STAGE */}
            {selectedType === 'photo' && (
              mediaFiles.length > 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center max-h-[500px]">
                  <MediaEditor 
                    key={`${selectedMediaIdx}_${mediaFiles[selectedMediaIdx]?.name || 'media'}`}
                    file={mediaFiles[selectedMediaIdx]} 
                    onChange={handleMediaChange}
                  />
                </div>
              ) : (
                <div 
                  className="w-full max-w-md p-8 border-2 border-dashed border-white/15 rounded-3xl bg-white/[0.01] text-center space-y-4 hover:border-aeirmist-cyan/50 transition-colors cursor-pointer select-none"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 rounded-full bg-aeirmist-cyan/10 border border-aeirmist-cyan/30 flex items-center justify-center mx-auto text-aeirmist-cyan">
                    <ImageIcon size={32} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Drag photos & videos here</h3>
                    <p className="text-xs text-white/50 mt-1">Supports JPG, PNG, WEBP, MP4 up to 10MB</p>
                  </div>
                  <button 
                    type="button"
                    className="px-5 py-2.5 bg-aeirmist-cyan text-black font-bold text-xs rounded-full hover:brightness-110 shadow-lg shadow-aeirmist-cyan/20 transition-all cursor-pointer"
                  >
                    Select From Device
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleAddMediaFiles} 
                    multiple 
                    accept="image/*,video/*" 
                    className="hidden" 
                  />
                </div>
              )
            )}

            {/* 2. TEXT POST STAGE (PLAIN TEXT MODE vs CANVAS CARD MODE) */}
            {selectedType === 'text' && (
              selectedGradient.id === 'plain' ? (
                /* PLAIN TEXT MODE (Canvas Chara) */
                <div className="w-full max-w-[calc(100vw-48px)] md:max-w-md rounded-2xl border border-white/10 bg-[#060a12] p-5 md:p-6 shadow-2xl space-y-4 text-left">
                  <div className="flex items-center gap-3">
                    <img 
                      src={profile?.photoURL || 'https://picsum.photos/seed/default/100'} 
                      className="w-10 h-10 rounded-full border border-white/20 object-cover" 
                      alt="" 
                    />
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{profile?.displayName || profile?.username || 'User'}</span>
                        {profile?.isVerified && <ShieldCheck size={12} className="text-aeirmist-cyan shrink-0" />}
                      </div>
                      <div className="text-[10px] text-white/40 font-mono uppercase tracking-wider">Plain Text Post</div>
                    </div>
                  </div>
                  
                  <textarea
                    id="caption-textarea"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write your text post here..."
                    aria-label="Text post content"
                    maxLength={3000}
                    rows={6}
                    className="w-full bg-transparent text-left text-sm text-white focus:outline-none focus:ring-0 resize-none leading-relaxed placeholder:text-white/30"
                  />
                  
                  <div className="flex justify-end items-center pt-3 border-t border-white/10 text-xs text-white/40 font-mono">
                    <span>{caption.length} / 3000</span>
                  </div>
                </div>
              ) : (
                /* CANVAS CARD MODE (Canvas Soho) */
                <div 
                  className="w-full max-w-[calc(100vw-48px)] md:max-w-md aspect-square rounded-3xl border p-6 md:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden text-center transition-all duration-300"
                  style={{ background: selectedGradient.css }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:16px_16px]" />
                  
                  <div className="flex items-center gap-3 z-10 text-left">
                    <img src={profile?.photoURL || 'https://picsum.photos/seed/default/100'} className="w-9 h-9 rounded-full border border-white/20 object-cover" alt="" />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        <span>@{profile?.username || 'user'}</span>
                        {profile?.isVerified && <ShieldCheck size={14} className="text-aeirmist-cyan shrink-0" />}
                      </div>
                      <div className="text-[9px] text-white/50 uppercase tracking-widest">Canvas Card</div>
                    </div>
                  </div>

                  <div className="my-auto z-10 w-full px-2">
                    <textarea
                      id="caption-textarea"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Type your story card text..."
                      aria-label="Canvas card content"
                      maxLength={3000}
                      rows={5}
                      className="w-full bg-transparent text-center text-lg font-bold text-white leading-relaxed tracking-wide placeholder:text-white/30 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex justify-end items-center text-[10px] text-white/40 tracking-wider font-mono z-10 pt-3 border-t border-white/10">
                    <span>{caption.length} / 3000</span>
                  </div>
                </div>
              )
            )}

            {/* 3. POLL STAGE */}
            {selectedType === 'poll' && (
              <div className="w-full max-w-sm bg-[#080d17] border border-white/10 p-6 rounded-3xl space-y-4 text-left shadow-2xl">
                <div className="flex items-center gap-2 text-aeirmist-cyan font-bold text-xs uppercase tracking-wider">
                  <ListTodo size={18} />
                  <span>Interactive Poll</span>
                </div>
                <div className="text-sm font-bold text-white">{poll?.question || 'Your Poll Question Here'}</div>
                <div className="space-y-2">
                  {(poll?.options || ['Option 1', 'Option 2']).map((opt: string, i: number) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-semibold flex justify-between items-center">
                      <span>{opt || `Option ${i + 1}`}</span>
                      <span className="text-white/40 font-mono text-[10px]">0%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. GIF STAGE */}
            {selectedType === 'gif' && (
              attachedGif ? (
                <div className="relative max-w-md rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                  <img src={attachedGif} className="w-full max-h-[380px] object-cover" alt="GIF" />
                  <button 
                    onClick={() => setAttachedGif(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="w-full max-w-md p-6 bg-white/[0.02] border border-white/10 rounded-3xl text-center">
                  <GifPicker onSelect={(gif) => setAttachedGif(gif)} />
                </div>
              )
            )}

            {/* 5. LINK STAGE */}
            {selectedType === 'link' && (
              <div className="w-full max-w-sm bg-[#080d17] border border-white/10 rounded-3xl overflow-hidden shadow-2xl text-left">
                {linkPreview ? (
                  <div>
                    <img src={linkPreview.image} className="w-full h-40 object-cover" alt="" />
                    <div className="p-4 space-y-2 border-t border-white/10">
                      <div className="text-xs text-aeirmist-cyan font-bold truncate">{linkPreview.url}</div>
                      <div className="text-xs font-bold text-white">{linkPreview.title}</div>
                      <div className="text-[10px] text-white/50 leading-relaxed line-clamp-2">{linkPreview.description}</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center space-y-3">
                    <LinkIcon size={36} className="mx-auto text-white/30" />
                    <h4 className="text-xs font-bold text-white">Enter Link URL</h4>
                    <p className="text-[10px] text-white/50">Enter a website URL in the right details panel to fetch preview card metadata.</p>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Carousel Slide Timeline Bar */}
          {selectedType === 'photo' && mediaFiles.length > 1 && (
            <div className="flex gap-2 bg-white/5 p-3 rounded-2xl border border-white/10 overflow-x-auto shrink-0 select-none">
              {mediaFiles.map((file, idx) => (
                <div 
                  key={idx}
                  onClick={() => setSelectedMediaIdx(idx)}
                  className={`relative w-12 h-12 rounded-xl overflow-hidden cursor-pointer border shrink-0 group transition-all ${selectedMediaIdx === idx ? 'border-aeirmist-cyan scale-105 shadow-md' : 'border-white/10 hover:border-white/30'}`}
                >
                  <img src={file.url} className="w-full h-full object-cover" alt="" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const filtered = mediaFiles.filter((_, i) => i !== idx);
                      setMediaFiles(filtered);
                      setSelectedMediaIdx(0);
                    }}
                    className="absolute top-0 right-0 bg-red-500 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-xl border border-dashed border-white/20 hover:border-aeirmist-cyan flex items-center justify-center text-white/40 hover:text-white transition-colors shrink-0"
              >
                <Trash2 size={16} className="rotate-45" />
              </button>
            </div>
          )}

        </div>

        {/* RIGHT / BOTTOM PANEL: INSTAGRAM-STYLE DETAILS & TOOLS (40% width on Desktop, Scrollable below on Phone) */}
        <div className="w-full md:w-[40%] flex flex-col bg-[#05080e] p-4 sm:p-6 space-y-5 overflow-y-auto shrink-0 border-t md:border-t-0 border-white/10">
          
          {/* User Profile Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img 
                src={profile?.photoURL || 'https://picsum.photos/seed/default/100'} 
                className="w-9 h-9 rounded-full border border-white/20 object-cover" 
                alt="" 
              />
              <div>
                <span className="text-xs font-bold text-white block">{profile?.displayName || profile?.username || 'User'}</span>
                <span className="text-[10px] text-white/40 block font-mono">@{profile?.username || 'username'}</span>
              </div>
            </div>

            {/* Audience Pill */}
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as any)}
              className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-[10px] font-bold text-white focus:outline-none focus:border-aeirmist-cyan cursor-pointer"
            >
              <option value="public" className="bg-[#05080e] text-white">Public</option>
              <option value="followers" className="bg-[#05080e] text-white">Followers</option>
              <option value="close_friends" className="bg-[#05080e] text-white">Close Friends</option>
              <option value="only_me" className="bg-[#05080e] text-white">Private</option>
            </select>
          </div>

          {/* MAIN CAPTION BOX (If not in Plain Text mode where caption is in preview) */}
          {selectedType !== 'text' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white/60">Caption</label>
              </div>
              <textarea
                id="caption-textarea"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                aria-label="Post caption"
                rows={4}
                maxLength={3000}
                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-aeirmist-cyan resize-none leading-relaxed"
              />
              <div className="flex justify-between items-center text-[10px] text-white/30 font-mono">
                <span>Formatting: **bold** *italic*</span>
                <span>{caption.length} / 3000</span>
              </div>
            </div>
          )}

          {/* TEXT CANVAS STYLE PICKER (For Text Posts) */}
          {selectedType === 'text' && (
            <div className="space-y-2.5 bg-white/[0.02] border border-white/10 p-4 rounded-2xl">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles size={14} className="text-aeirmist-cyan" />
                <span>Canvas Style</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {THEME_GRADIENTS.map(grad => (
                  <button
                    key={grad.id}
                    type="button"
                    onClick={() => setSelectedGradient(grad)}
                    className={`p-2.5 rounded-xl text-xs font-bold border text-left truncate transition-all cursor-pointer ${selectedGradient.id === grad.id ? 'border-aeirmist-cyan shadow-md shadow-aeirmist-cyan/10 text-white' : 'border-white/10 text-white/60 hover:text-white hover:bg-white/5'}`}
                    style={{ background: grad.css }}
                  >
                    {grad.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ORGANIZED TOOL ACCORDION SECTIONS */}
          <div className="space-y-2 pt-2">
            
            {/* Tool Nav Tabs */}
            <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 overflow-x-auto scrollbar-none">
              {[
                { id: 'details', label: 'Tools', icon: Settings },
                { id: 'tag', label: 'Tag People', icon: Users },
                { id: 'location', label: 'Location', icon: MapPin },
                { id: 'music', label: 'Music', icon: MusicIcon },
                { id: 'settings', label: 'Privacy', icon: Globe }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveRightPanel(tab.id as any)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1 ${activeRightPanel === tab.id ? 'bg-aeirmist-cyan text-black font-bold shadow' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                >
                  <tab.icon size={12} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Active Tool Panel Content */}
            <div className="pt-2">
              {activeRightPanel === 'details' && (
                <div className="space-y-3">
                  {selectedType === 'poll' && (
                    <PollComposer poll={poll} onChange={setPoll} />
                  )}
                  {selectedType === 'link' && (
                    <div className="space-y-2 bg-white/[0.02] border border-white/10 p-3 rounded-2xl">
                      <label className="text-xs font-bold text-white/80 block">Fetch Web Link</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-aeirmist-cyan"
                        />
                        <button 
                          onClick={handleLinkLookup}
                          className="px-4 bg-aeirmist-cyan text-black text-xs font-bold rounded-xl hover:brightness-110 transition-all"
                        >
                          Fetch
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedType === 'photo' && (
                    <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2">
                      <div className="text-xs font-bold text-white">Media Enhancements</div>
                      <p className="text-[10px] text-white/50">Click any attached photo in the preview stage to crop, adjust filters, or rotate.</p>
                    </div>
                  )}
                </div>
              )}

              {activeRightPanel === 'tag' && (
                <div className="bg-white/[0.02] border border-white/10 p-3 rounded-2xl">
                  <TagPeople taggedUsers={taggedPeople} onChange={setTaggedPeople} />
                </div>
              )}

              {activeRightPanel === 'location' && (
                <div className="bg-white/[0.02] border border-white/10 p-3 rounded-2xl">
                  <LocationSearch selectedLocation={location} onSelect={setLocation} />
                </div>
              )}

              {activeRightPanel === 'music' && (
                <div className="bg-white/[0.02] border border-white/10 p-3 rounded-2xl">
                  <MusicSelector selectedTrack={selectedMusic} onChange={setSelectedMusic} />
                </div>
              )}

              {activeRightPanel === 'settings' && (
                <div className="space-y-3 bg-white/[0.02] border border-white/10 p-4 rounded-2xl">
                  <div className="text-xs font-bold text-white mb-2">Advanced Settings</div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/80">Allow Comments</span>
                    <button onClick={() => setAllowComments(!allowComments)} className={`w-9 h-5 rounded-full p-0.5 transition-colors ${allowComments ? 'bg-aeirmist-cyan' : 'bg-white/10'}`}>
                      <div className={`w-4 h-4 rounded-full bg-black transition-transform ${allowComments ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/80">Hide Like Counts</span>
                    <button onClick={() => setHideLikes(!hideLikes)} className={`w-9 h-5 rounded-full p-0.5 transition-colors ${hideLikes ? 'bg-aeirmist-cyan' : 'bg-white/10'}`}>
                      <div className={`w-4 h-4 rounded-full bg-black transition-transform ${hideLikes ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/80">Sensitive Content Flag</span>
                    <button onClick={() => setSensitiveWarning(!sensitiveWarning)} className={`w-9 h-5 rounded-full p-0.5 transition-colors ${sensitiveWarning ? 'bg-red-500' : 'bg-white/10'}`}>
                      <div className={`w-4 h-4 rounded-full bg-black transition-transform ${sensitiveWarning ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* FAST PUBLISH OVERLAY */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-[#06090f] border border-white/10 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-aeirmist-cyan/10 border border-aeirmist-cyan/30 flex items-center justify-center mx-auto text-aeirmist-cyan">
              <Clock size={24} className="animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Publishing Post</h3>
              <p className="text-xs text-aeirmist-cyan font-semibold">{uploadStatus || 'Processing media...'}</p>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-aeirmist-cyan h-full rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="text-xs font-mono text-white/40">{uploadProgress}%</div>
          </div>
        </div>
      )}
    </div>
  );
});
