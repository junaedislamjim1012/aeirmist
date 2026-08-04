import { useEffect, useRef, useState } from 'react';
import { postAnalytics, ViewMetadata } from '../services/PostAnalyticsService';

interface UsePostAnalyticsProps {
  postId: string;
  type: 'text' | 'photo' | 'video' | 'collage';
  source?: ViewMetadata['source'];
}

export function usePostAnalytics({ postId, type, source = 'feed' }: UsePostAnalyticsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const viewStartTime = useRef<number | null>(null);
  const trackTimeout = useRef<NodeJS.Timeout | null>(null);
  const hasTracked = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.6 } // 60% visible
    );

    const element = document.getElementById(`post-${postId}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
      if (trackTimeout.current) clearTimeout(trackTimeout.current);
    };
  }, [postId]);

  useEffect(() => {
    if (isVisible && !hasTracked.current) {
      viewStartTime.current = Date.now();
      
      const delay = type === 'video' ? 3000 : 2000;
      
      trackTimeout.current = setTimeout(() => {
        if (isVisible) {
          postAnalytics.trackView(postId, { source });
          hasTracked.current = true;
        }
      }, delay);
    } else if (!isVisible) {
      if (trackTimeout.current) {
        clearTimeout(trackTimeout.current);
        trackTimeout.current = null;
      }
      viewStartTime.current = null;
    }
  }, [isVisible, postId, type, source]);

  return { isVisible };
}
