import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAeirmist } from '../../context/AeirmistContext';
import { AtSign, Check, X, Loader2, Sparkles, Camera, ArrowRight, ArrowLeft } from 'lucide-react';
import { mediaService, MediaQuality } from '../../services/MediaService';
import { updateProfile } from 'firebase/auth';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';

export const UsernameSelection: React.FC = () => {
  const { registerUsername, checkUsernameAvailable, user, db, storage, auth, uploadMedia, setProfileUploadProgress } = useAeirmist();
  
  // UI State
  const [step, setStep] = useState<'username' | 'profile'>('username');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Screen 1: Username
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Screen 2: Profile
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photoURL || null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced Username Check
  useEffect(() => {
    if (username.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    
    const timer = setTimeout(async () => {
      if (!/^[a-z0-9_.]+$/.test(username)) {
        setUsernameStatus('invalid');
        return;
      }
      setUsernameStatus('checking');
      try {
        const result = await checkUsernameAvailable(username);
        if (result.available) {
          setUsernameStatus('available');
        } else {
          setUsernameStatus('taken');
          setSuggestions(result.suggestions || []);
        }
      } catch {
        setUsernameStatus('idle');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username, checkUsernameAvailable]);

  // Back Button History Integration
  useEffect(() => {
    const handlePopState = () => {
      if (step === 'profile') setStep('username');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [step]);

  const handleNext = () => {
    if (usernameStatus === 'available') {
      window.history.pushState(null, '', '');
      setStep('profile');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      let finalPhotoURL = photoPreview;

      // Upload if a new file is selected
      if (photoFile) {
        setIsUploading(true);
        finalPhotoURL = await uploadMedia(
            photoFile, 
            `profiles/${user!.uid}/avatar`, 
            (progress, status) => {
                setProfileUploadProgress(progress);
            }, 
            MediaQuality.PROFILE
        );
        setIsUploading(false);
      }

      // Single Batch/Transaction
      const batch = writeBatch(db);
      
      const usernameRef = doc(db, 'usernames', username.toLowerCase());
      batch.set(usernameRef, { uid: user!.uid, createdAt: serverTimestamp() });

      const profileRef = doc(db, 'profiles', `profile_${user!.uid}`);
      batch.set(profileRef, { 
        id: `profile_${user!.uid}`,
        ownerUid: user!.uid,
        username: username.toLowerCase(),
        displayName: displayName || username,
        photoURL: finalPhotoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        createdAt: serverTimestamp(),
        social: { followers: [], following: [] },
        followersCount: 0,
        followingCount: 0
      });

      await batch.commit();
      
      // Sync Auth
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { 
            displayName: displayName || username,
            photoURL: finalPhotoURL
        });
      }

      // Mark onboarding complete (assuming this applet uses a context flag)
      window.location.reload(); // Refresh to trigger auth check logic and finish onboarding
      
    } catch (err: any) {
      setError(err.message || 'Failed to initialize profile.');
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-aeirmist-bg flex justify-center items-start pt-10 sm:pt-20 px-4">
      <div className="glass-panel w-full max-w-sm p-6 rounded-3xl border border-white/10 shadow-2xl space-y-8">
        <AnimatePresence mode="wait">
          {step === 'username' ? (
            <motion.div key="username" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-black text-white">Choose a username</h2>
                <p className="text-xs text-white/50 mt-1">You can always change this later.</p>
              </div>

              <div className="relative group">
                <div className="absolute left-4 top-4 text-white/30"><AtSign size={20} /></div>
                <input
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().trim().replace(/[^a-z0-9_.]/g, ''))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-10 text-white placeholder:text-white/20 focus:border-aeirmist-cyan outline-none transition"
                />
                <div className="absolute right-4 top-4">
                  {usernameStatus === 'checking' && <Loader2 size={20} className="text-aeirmist-cyan animate-spin" />}
                  {usernameStatus === 'available' && <Check size={20} className="text-aeirmist-lime" />}
                  {usernameStatus === 'taken' && <X size={20} className="text-aeirmist-magenta" />}
                </div>
              </div>

              {usernameStatus === 'taken' && suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map(s => (
                    <button key={s} onClick={() => setUsername(s)} className="text-[10px] bg-white/5 px-3 py-1 rounded-full text-aeirmist-cyan border border-white/10">{s}</button>
                  ))}
                </div>
              )}

              <button 
                onClick={handleNext}
                disabled={usernameStatus !== 'available'}
                className="w-full py-4 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-30 transition"
              >
                Next <ArrowRight size={16} />
              </button>
            </motion.div>
          ) : (
            <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <button onClick={() => setStep('username')} className="text-white/30 text-xs flex items-center gap-1"><ArrowLeft size={14} /> Back</button>
              
              <div className="text-center">
                <h2 className="text-xl font-black text-white">Add your name</h2>
                <p className="text-xs text-white/50 mt-1">This is how people will know you. You can change it later.</p>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                    <div 
                        className="w-24 h-24 rounded-xl border-2 border-white/10 overflow-hidden cursor-pointer bg-white/5 flex items-center justify-center"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <Camera size={32} className="text-white/20" />}
                        {isUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}
                    </div>
                    <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="text-xs text-aeirmist-cyan">Change Photo</button>
                <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="text-[10px] text-white/30">Skip for now</button>
              </div>

              <input
                type="text"
                placeholder="Full name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/20 focus:border-aeirmist-magenta outline-none transition"
              />

              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || !displayName}
                className="w-full py-4 bg-aeirmist-cyan text-aeirmist-bg rounded-xl font-bold hover:opacity-90 disabled:opacity-30 transition"
              >
                {isSubmitting ? 'Initializing...' : 'Done'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
      </div>
    </div>
  );
};
