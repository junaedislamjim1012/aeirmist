import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAeirmist } from '../../context/AeirmistContext';
import { getAvatarUrl } from '../../lib/avatar';

// Real-time custom hook to determine user's story status
export function useUserStoryState(userId: string | undefined) {
  const { db, user } = useAeirmist();
  const [state, setState] = useState<'active' | 'seen' | 'none'>('none');

  useEffect(() => {
    if (!db || !userId || !user) {
      setState('none');
      return;
    }

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const storiesRef = collection(db, 'stories');
    const q = query(
      storiesRef,
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const yesterdayMs = yesterday.getTime();
      
      const docs = snapshot.docs
        .map(doc => doc.data())
        .filter(story => {
          const created = story.createdAt;
          if (!created) return false;
          const ms = typeof created.toMillis === 'function' ? created.toMillis() : new Date(created).getTime();
          return ms >= yesterdayMs;
        });

      if (docs.length === 0) {
        setState('none');
        return;
      }

      const allSeen = docs.every(story => {
        const viewers = story.viewers || [];
        return viewers.includes(user.uid);
      });

      setState(allSeen ? 'seen' : 'active');
    }, (error) => {
      console.error("[useUserStoryState] Error watching user stories:", error);
      setState('none');
    });

    return () => unsubscribe();
  }, [db, userId, user?.uid]);

  return state;
}

interface AvatarProps {
  src: string | undefined | null;
  alt?: string;
  sizeClassName?: string; // e.g. "w-14 h-14 md:w-16 md:h-16"
  roundedClassName?: string; // e.g. "rounded-[18px]"
  innerRoundedClassName?: string; // e.g. "rounded-[16px]"
  showStoryRing?: boolean;
  userId?: string; // If passed, auto-determines story ring state
  storyRingState?: 'active' | 'seen' | 'none'; // Overrides auto-detection if passed explicitly
  className?: string; // Custom classes for outermost wrapper
  imgClassName?: string; // Custom classes for image
  onClick?: () => void;
  children?: React.ReactNode;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  sizeClassName = 'w-10 h-10',
  roundedClassName = 'rounded-xl',
  innerRoundedClassName = 'rounded-lg',
  showStoryRing = false,
  userId,
  storyRingState,
  className = '',
  imgClassName = '',
  onClick,
  children
}) => {
  const autoStoryState = useUserStoryState(userId);
  const resolvedState = storyRingState !== undefined ? storyRingState : (userId ? autoStoryState : 'none');

  // Determine ring container classes
  let ringStyle = 'p-0 bg-transparent shadow-none';
  if (showStoryRing) {
    if (resolvedState === 'active') {
      ringStyle = 'p-[2px] bg-gradient-to-tr from-aeirmist-cyan via-aeirmist-magenta to-aeirmist-cyan shadow-[0_0_12px_rgba(0,242,255,0.18)]';
    } else if (resolvedState === 'seen') {
      ringStyle = 'p-[2px] bg-white/[0.12] shadow-none';
    }
  }

  const finalAvatarUrl = getAvatarUrl(src);

  return (
    <div 
      onClick={onClick}
      className={`relative select-none flex items-center justify-center transition-all duration-300 ${sizeClassName} ${roundedClassName} ${ringStyle} ${className} ${onClick ? 'cursor-pointer active:scale-95' : ''}`}
    >
      <div className={`w-full h-full ${innerRoundedClassName} bg-black overflow-hidden relative ${showStoryRing && resolvedState !== 'none' ? 'border-[2px] border-[#080808]' : 'border border-white/10'}`}>
        <img 
          src={finalAvatarUrl} 
          alt={alt}
          loading="lazy"
          className={`w-full h-full object-cover ${imgClassName}`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = getAvatarUrl(null);
          }}
          referrerPolicy="no-referrer"
        />
        {children}
      </div>
    </div>
  );
};
