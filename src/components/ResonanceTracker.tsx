import React, { useEffect, useRef } from 'react';
import { useAeirmist } from '../context/AeirmistContext';
import { REWARDS } from '../lib/aeirmistRanks';

/**
 * ResonanceTracker handles the background accumulation of Aeirmist points based on
 * user engagement such as scrolling and active screen time.
 */
export const ResonanceTracker: React.FC = () => {
  const { earnPoints, profile } = useAeirmist();
  const lastScrollY = useRef(0);
  const scrollAcc = useRef(0);
  const activeTimeAcc = useRef(0);
  const lastActiveTime = useRef(Date.now());

  useEffect(() => {
    if (!profile) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = Math.abs(currentScrollY - lastScrollY.current);
      scrollAcc.current += diff;
      lastScrollY.current = currentScrollY;

      // Every 3000px of movement rewards a chunk
      if (scrollAcc.current >= 3000) {
        earnPoints(REWARDS.SCROLL_CHUNK);
        scrollAcc.current = 0;
      }
    };

    // Reward active time every minute
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        earnPoints(REWARDS.SCREEN_MINUTE);
      }
    }, 60000);

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, [profile?.id, earnPoints]);

  return null; // Background component
};
