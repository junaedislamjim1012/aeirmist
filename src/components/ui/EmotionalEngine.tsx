import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAeirmist } from '../../context/AeirmistContext';
import { Sparkles, Trophy, Star, Award, Heart, PartyPopper } from 'lucide-react';
import confetti from 'canvas-confetti';

interface EmotionalEvent {
  id: string;
  type: 'milestone' | 'welcome_back' | 'first_time';
  title: string;
  message: string;
  icon: React.ReactNode;
}

export const EmotionalEngine: React.FC = () => {
  const { profile, activeProfileId, user, db, addToast } = useAeirmist();
  const [activeEvent, setActiveEvent] = useState<EmotionalEvent | null>(null);

  useEffect(() => {
    if (!profile || !user || !activeProfileId) return;

    const checkEmotionalMoments = () => {
      try {
        const historyKey = `aeirmist_emotional_${activeProfileId}`;
        const rawHistory = localStorage.getItem(historyKey);
        const history = rawHistory ? JSON.parse(rawHistory) : {};

        const now = Date.now();
        const eventsToTrigger: EmotionalEvent[] = [];

        // 1. Welcome Back (if away for > 3 days)
        const lastLogin = history.lastLogin || now;
        const daysAway = (now - lastLogin) / (1000 * 60 * 60 * 24);
        if (daysAway > 3 && !history.welcomedBackRecently) {
          eventsToTrigger.push({
            id: `welcome_back_${now}`,
            type: 'welcome_back',
            title: `Welcome back, ${profile.displayName?.split(' ')[0] || profile.username}!`,
            message: "It's been a while. Catch up on what you've missed.",
            icon: <Sparkles className="text-aeirmist-cyan" size={24} />
          });
          history.welcomedBackRecently = now;
        }
        
        // Reset welcome back tracker if they log in consistently
        if (daysAway < 1) {
           delete history.welcomedBackRecently;
        }
        history.lastLogin = now;

        // 2. First Time Moments
        const accountAgeDays = (now - (profile.createdAt?.toMillis ? profile.createdAt.toMillis() : (profile.createdAt || now))) / (1000 * 60 * 60 * 24);
        if (accountAgeDays < 1 && !history.celebrated_first_login) {
          eventsToTrigger.push({
            id: 'first_login',
            type: 'first_time',
            title: 'Welcome to Aeirmist',
            message: 'Your journey begins here. Explore, connect, and create.',
            icon: <Star className="text-aeirmist-magenta" size={24} />
          });
          history.celebrated_first_login = true;
        }

        // 3. Milestones (Followers)
        const followers = profile.social?.followers?.length || 0;
        const followerMilestones = [10, 50, 100, 500, 1000];
        for (const m of followerMilestones) {
          if (followers >= m && !history[`celebrated_followers_${m}`]) {
            eventsToTrigger.push({
              id: `milestone_followers_${m}`,
              type: 'milestone',
              title: `${m} Followers! 🎉`,
              message: `Your community is growing. You've reached ${m} followers.`,
              icon: <PartyPopper className="text-aeirmist-cyan" size={24} />
            });
            history[`celebrated_followers_${m}`] = true;
            break; // Only trigger one follower milestone at a time
          }
        }

        // 4. Account Anniversary
        if (profile.createdAt) {
          const createdTime = profile.createdAt?.toMillis ? profile.createdAt.toMillis() : profile.createdAt;
          const accountAgeYears = Math.floor((now - createdTime) / (1000 * 60 * 60 * 24 * 365.25));
          if (accountAgeYears > 0 && !history[`celebrated_anniversary_${accountAgeYears}`]) {
            eventsToTrigger.push({
              id: `anniversary_${accountAgeYears}`,
              type: 'milestone',
              title: 'Happy Anniversary!',
              message: `You've been with Aeirmist for ${accountAgeYears} ${accountAgeYears === 1 ? 'Year' : 'Years'} 🎉`,
              icon: <Heart className="text-aeirmist-magenta" size={24} />
            });
            history[`celebrated_anniversary_${accountAgeYears}`] = true;
          }
        }

        // Save history
        localStorage.setItem(historyKey, JSON.stringify(history));

        // Queue the first event if any
        if (eventsToTrigger.length > 0 && !activeEvent) {
          setActiveEvent(eventsToTrigger[0]);
          triggerSubtleConfetti();
        }

      } catch (e) {
        console.warn("Emotional Engine blocked by local storage limitations", e);
      }
    };

    // Delay checking slightly to not interrupt initial load
    const timer = setTimeout(checkEmotionalMoments, 4000);
    return () => clearTimeout(timer);
  }, [profile, activeProfileId, user, activeEvent]);

  const triggerSubtleConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#00f2ff', '#ff0055', '#ffffff'],
        disableForReducedMotion: true,
        zIndex: 9999
      });
    } catch (e) {}
  };

  const dismissEvent = () => {
    setActiveEvent(null);
  };

  return (
    <AnimatePresence>
      {activeEvent && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] sm:w-[400px] pointer-events-auto"
        >
          <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex items-start gap-4">
            {/* Soft background glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-aeirmist-cyan/10 blur-3xl rounded-full pointer-events-none" />
            
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner relative z-10">
              {activeEvent.icon}
            </div>
            
            <div className="flex-1 relative z-10 pt-1">
              <h4 className="text-white font-bold text-sm tracking-tight mb-1">{activeEvent.title}</h4>
              <p className="text-white/60 text-xs leading-relaxed mb-3">{activeEvent.message}</p>
              <button 
                onClick={dismissEvent}
                className="text-xs font-black uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full transition-colors"
              >
                Amazing
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
