/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation, Tab } from './components/Navigation';
import { CreatePost } from './components/CreatePost';
import { AeirmistProvider, useAeirmist } from './context/AeirmistContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AppearanceProvider, useAppearance } from './context/AppearanceContext';
import { DynamicAesthetic } from './components/ui/DynamicAesthetic';
import { GlobalAppBackground } from './components/ui/GlobalAppBackground';
import { AdaptiveEngine } from './components/ui/AdaptiveEngine';
import { EmotionalEngine } from './components/ui/EmotionalEngine';
import { AuthSystem } from './components/auth/AuthSystem';
import { SignupWizard } from './components/auth/SignupWizard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Sparkles, Zap, Lock, AlertCircle, Clock } from 'lucide-react';
import { AeirmistLogo } from './components/ui/AeirmistLogo';
import { ReportProvider } from './components/reporting/ReportContext';

// Aeirmist Core Component Architecture
function toMathBoldScript(text: string): string {
  return text.split('').map(char => {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) { // A-Z
      return String.fromCodePoint(0x1D4D0 + (code - 65));
    }
    if (code >= 97 && code <= 122) { // a-z
      return String.fromCodePoint(0x1D4EA + (code - 97));
    }
    return char;
  }).join('');
}

const lazyWithRetry = <T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T } | any>,
  retries = 3,
  interval = 300
): React.LazyExoticComponent<T> => {
  return lazy(() =>
    new Promise<{ default: T }>((resolve, reject) => {
      const attempt = (retriesLeft: number) => {
        factory()
          .then((module) => {
            const component = module && module.default ? module.default : module;
            resolve({ default: component });
          })
          .catch((error) => {
            if (retriesLeft <= 1) {
              const key = 'chunk_reload_retry';
              if (!sessionStorage.getItem(key)) {
                sessionStorage.setItem(key, 'true');
                window.location.reload();
                return;
              }
              reject(error);
            } else {
              setTimeout(() => attempt(retriesLeft - 1), interval);
            }
          });
      };
      attempt(retries);
    })
  );
};

const HomeFeedSystem = lazyWithRetry(() => import('./components/feed/HomeFeedSystem').then(m => ({ default: m.HomeFeedSystem })));
const Sidebar = lazyWithRetry(() => import('./components/Sidebar').then(m => ({ default: m.Sidebar })));
const Messenger = lazyWithRetry(() => import('./components/Messenger'));
const ExploreSystem = lazyWithRetry(() => import('./components/discover/ExploreSystem').then(m => ({ default: m.ExploreSystem })));
const AeirmistDashboard = lazyWithRetry(() => import('./components/dashboard/AeirmistDashboard').then(m => ({ default: m.AeirmistDashboard })));
const SettingsSystem = lazyWithRetry(() => import('./components/settings/SettingsSystem'));
const NotificationCenter = lazyWithRetry(() => import('./components/notifications/NotificationCenter'));
const ProfileSystem = lazyWithRetry(() => import('./components/profile/ProfileSystem'));
const VideoFeed = lazyWithRetry(() => import('./components/videos/VideoFeed').then(m => ({ default: m.VideoFeed })));
const AdminPanel = lazyWithRetry(() => import('./components/admin/AdminPanel').then(m => ({ default: m.AdminPanel })));
const CommunityGuidelines = lazyWithRetry(() => import('./components/legal/CommunityGuidelines'));

const CallModal = lazyWithRetry(() => import('./components/CallModal').then(m => ({ default: m.CallModal })));
const AeirmistCamera = lazyWithRetry(() => import('./components/ui/AeirmistCamera').then(m => ({ default: m.AeirmistCamera })));
const PaymentResult = lazyWithRetry(() => import('./components/marketplace/PaymentResult').then(m => ({ default: m.PaymentResult })));
const AccountSwitcher = lazyWithRetry(() => import('./components/auth/AccountSwitcher').then(m => ({ default: m.AccountSwitcher })));
const CompleteYourAccountScreen = lazyWithRetry(() => import('./components/auth/CompleteYourAccountScreen').then(m => ({ default: m.CompleteYourAccountScreen })));
const PasswordOnboardingModal = lazyWithRetry(() => import('./components/auth/PasswordOnboardingModal').then(m => ({ default: m.PasswordOnboardingModal })));
const SetupRequiredScreen = lazyWithRetry(() => import('./components/auth/SetupScreens').then(m => ({ default: m.SetupRequiredScreen })));
const PairingFailedScreen = lazyWithRetry(() => import('./components/auth/SetupScreens').then(m => ({ default: m.PairingFailedScreen })));
const PurgeScreen = lazyWithRetry(() => import('./components/auth/SetupScreens').then(m => ({ default: m.PurgeScreen })));
const DeactivatedScreen = lazyWithRetry(() => import('./components/auth/SetupScreens').then(m => ({ default: m.DeactivatedScreen })));
const BannedScreen = lazyWithRetry(() => import('./components/auth/BannedScreen').then(m => ({ default: m.BannedScreen })));
import { ToastNotification } from './components/notifications/ToastNotification';

type PreloadComponent = 'feed' | 'messenger' | 'discover' | 'profile' | 'settings' | 'videos' | 'dashboard' | 'notifications' | 'admin';

const preload = (comp: PreloadComponent) => {
  switch (comp) {
    case 'feed': import('./components/feed/HomeFeedSystem'); import('./components/Sidebar'); break;
    case 'messenger': import('./components/Messenger'); break;
    case 'discover': import('./components/discover/ExploreSystem'); break;
    case 'profile': import('./components/profile/ProfileSystem'); break;
    case 'settings': import('./components/settings/SettingsSystem'); break;
    case 'videos': import('./components/videos/VideoFeed'); break;
    case 'dashboard': import('./components/dashboard/AeirmistDashboard'); break;
    case 'notifications': import('./components/notifications/NotificationCenter'); break;
    case 'admin': import('./components/admin/AdminPanel'); break;
  }
};

const LazyFallback = () => (
  <div className="w-full h-full flex flex-col items-center justify-center p-20 gap-4 opacity-40">
    <div className="w-8 h-8 rounded-full border-2 border-aeirmist-cyan/20 border-t-aeirmist-cyan animate-spin" />
    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-aeirmist-cyan">Syncing...</span>
  </div>
);

const HUDStat = ({ icon, label, value, color }: any) => (
  <div className="flex items-center gap-3">
    <div className={`text-${color} opacity-60`}>{icon}</div>
    <div>
      <div className="text-[8px] font-black uppercase tracking-widest text-white/30">{label}</div>
      <div className={`text-[10px] font-black uppercase tracking-widest text-${color}`}>{value}</div>
    </div>
  </div>
);

const HUDMiniStat = ({ icon, label }: any) => (
  <div className="flex flex-col items-center gap-2">
    <div className="text-aeirmist-cyan drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]">{icon}</div>
    <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20">{label}</div>
  </div>
);

const AlertsTabRedirect = ({ onComplete }: { onComplete: () => void }) => {
  React.useEffect(() => {
    onComplete();
  }, [onComplete]);
  return null;
};

import { PermissionManager } from './components/ui/PermissionManager';
import { ResonanceTracker } from './components/ResonanceTracker';
import { SEO } from './components/ui/SEO';
import { analytics } from './services/AnalyticsService';
import { followRecommService } from './services/FollowRecommendationService';
import { NetworkStatusProvider } from './context/NetworkStatusContext';
import { NetworkBanner } from './components/ui/NetworkBanner';

const ComingSoonScreen = ({ sectorName, onHomeClick }: { sectorName: string; onHomeClick: () => void }) => {
  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#09090d] to-[#040406]">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full p-8 rounded-3xl border border-amber-500/20 bg-amber-500/[0.02] backdrop-blur-2xl space-y-5 flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <Clock size={32} />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
            Sector Locked • Coming Soon
          </span>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">
            {sectorName}
          </h2>
          <p className="text-xs font-mono text-white/50 leading-relaxed">
            This platform feature is currently set to Coming Soon in system settings.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-[10px] font-mono text-white/40 text-left w-full space-y-1">
          <p className="font-bold text-white/60 uppercase">Admin Control Note:</p>
          <p>To unlock this feature, open <span className="text-aeirmist-cyan font-bold">Control Panel → Feature Flags</span> and toggle this sector to <span className="text-emerald-400 font-bold">ACTIVE</span>.</p>
        </div>

        <button
          onClick={onHomeClick}
          className="w-full h-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
        >
          Return to Home Feed
        </button>
      </motion.div>
    </div>
  );
};

import { PostDetailView } from './components/feed/PostDetailView';

function AppContent() {
  const { settings } = useAppearance();
  const location = useLocation();
  const isGuidelinesPage = location.pathname === '/community-guidelines';
  const { 
    loading, 
    user, 
    isSetup, 
    isConnecting, 
    connectionError, 
    needsUsername, 
    profile, 
    setNeedsUsername, 
    activeCall, 
    endCall, 
    cameraConfig, 
    setCameraConfig,
    permissions,
    pendingPermission,
    setPendingPermission,
    _requestPermission,
    updateProfile,
    logout,
    deviceLinkingStatus,
    isScheduledForPurge,
    cancelDeleteAccount,
    storyUpload,
    needsPasswordOnboarding,
    featureFlags
  } = useAeirmist();
  const { isLoading: isThemeLoading } = useTheme();

  const [isPosting, setIsPosting] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const isGlobalBgActive = settings?.globalBgType && settings.globalBgType !== 'none' && activeTab !== 'messenger';
  const [viewingPostId, setViewingPostId] = useState<string | null>(null);
  const [viewingStoreId, setViewingStoreId] = useState<string | null>(null);
  const [viewingProductId, setViewingProductId] = useState<string | null>(null);
  const [viewingVideoId, setViewingVideoId] = useState<string | null>(null);
  const [viewingProfile, setViewingProfile] = useState<any>(null);
  const [messageRecipient, setMessageRecipient] = useState<any>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  useEffect(() => {
    if (settings?.desktopSidebarMode) {
      setIsSidebarExpanded(settings.desktopSidebarMode === 'pinned');
    }
  }, [settings?.desktopSidebarMode]);
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);
  const [lastMainTab, setLastMainTab] = useState<Tab>('feed');
  const [showSafeExit, setShowSafeExit] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    if (user && loading) {
      setShowSplash(true);
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 4200);
      return () => clearTimeout(timer);
    } else {
      setShowSplash(false);
    }
  }, [user?.uid, loading]);

  useEffect(() => {
    if (loading || (user && !profile && !needsUsername)) {
      const timer = setTimeout(() => setShowSafeExit(true), 6000);
      return () => clearTimeout(timer);
    } else {
      setShowSafeExit(false);
    }
  }, [loading, user, profile, needsUsername]);

  React.useEffect(() => {
    const handleNavigate = (e: any) => {
      const targetTab = e.detail;
      if (targetTab) {
        handleTabChange(targetTab);
      }
    };
    window.addEventListener('aeirmist-navigate', handleNavigate);
    return () => window.removeEventListener('aeirmist-navigate', handleNavigate);
  }, []);

  useEffect(() => {
    if (isGlobalBgActive) {
      document.documentElement.classList.add('global-bg-active');
    } else {
      document.documentElement.classList.remove('global-bg-active');
    }
    return () => {
      document.documentElement.classList.remove('global-bg-active');
    };
  }, [settings?.globalBgType, activeTab, isGlobalBgActive]);

  // Derive call chat info for the modal
  const callChatInfo = activeCall ? {
    id: activeCall.conversationId,
    name: activeCall.callerName || 'Incoming Link',
    photo: activeCall.callerPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeCall.callerId}`,
    participants: [activeCall.callerId, profile?.id].filter(Boolean),
    otherParticipantUid: activeCall.callerUid,
  } : null;

  const handleUserClick = React.useCallback((userData: any) => {
    setMessageRecipient(null);
    setViewingPostId(null);
    setViewingProfile(userData);
    setActiveTab('profile');
    analytics.trackEngagement('profile_visit', { targetUid: userData.id || userData.uid });
    if (userData.id || userData.uid) {
      followRecommService.recordProfileVisit(userData.id || userData.uid);
    }
  }, []);

  const handlePostClick = React.useCallback((postId: string) => {
    setViewingPostId(postId);
    analytics.trackEngagement('post_view', { postId });
  }, []);

  const handleMessageClick = React.useCallback((userData: any) => {
    setViewingProfile(null);
    setMessageRecipient(userData);
    setLastMainTab('messenger');
    setActiveTab('messenger');
  }, []);

  const handleCreatePostClick = React.useCallback(() => {
    setIsPosting(true);
  }, []);

  const handleEditProfileClick = React.useCallback(() => {
    setActiveTab('settings');
  }, []);

  const handleTabChange = (tab: Tab) => {
    if (tab === 'notifications') {
      setIsNotificationsOpen(true);
      return;
    }

    if (tab === 'profile' && activeTab === 'profile' && !viewingProfile) {
      // If already on profile, toggle account switcher
      setIsAccountSwitcherOpen(true);
      return;
    }

    if (tab === 'profile' && viewingProfile) {
      // If clicking profile while viewing someone else, go to own profile
      setViewingProfile(null);
    } else if (tab !== 'profile') {
      setViewingProfile(null);
      setLastMainTab(tab);
    }
    
    if (tab !== 'messenger') {
      setMessageRecipient(null);
    }
    setActiveTab(tab);
  };

  // --- BROWSER HISTORY INTEGRATION FOR NAVIGATION ---
  const [storyState, setStoryState] = useState<{
    activeStoryGroup: any | null;
    isStudioOpen: boolean;
    isCreatingNote: boolean;
  }>({
    activeStoryGroup: null,
    isStudioOpen: false,
    isCreatingNote: false,
  });

  const isPoppingRef = React.useRef(false);

  useEffect(() => {
    const handleStoryChange = (e: any) => {
      setStoryState(e.detail);
    };
    window.addEventListener('aeirmist-story-state-change', handleStoryChange);
    return () => window.removeEventListener('aeirmist-story-state-change', handleStoryChange);
  }, []);

  // Helper functions for URL sync across tabs and pages
  const getPathForAppState = (
    tab: Tab,
    vProfile: any,
    isNotifsOpen: boolean,
    vPostId: string | null,
    vVideoId: string | null,
    vStoreId: string | null,
    vProductId: string | null,
    vChatUid: string | null
  ): string => {
    if (vPostId) return `/p/${vPostId}`;
    if (vVideoId) return `/v/${vVideoId}`;
    if (vStoreId) return `/store/${vStoreId}`;
    if (vProductId) return `/product/${vProductId}`;
    if (isNotifsOpen) return '/notifications';
    if (tab === 'profile') {
      if (vProfile?.username) return `/@${vProfile.username}`;
      if (vProfile?.id) return `/u/${vProfile.id}`;
      return '/profile';
    }
    switch (tab) {
      case 'feed': return '/';
      case 'discover': return '/explore';
      case 'videos': return '/reels';
      case 'messenger': 
        if (vChatUid) return `/messages/${vChatUid}`;
        return '/messages';
      case 'settings': return '/settings';
      case 'admin': return '/admin-panel';
      case 'dashboard': return '/dashboard';
      default: return `/${tab}`;
    }
  };

  const getInitialStateFromPath = (path: string) => {
    const cleanPath = path.trim().toLowerCase();
    if (cleanPath.startsWith('/p/')) {
      const postId = cleanPath.split('/p/')[1]?.split('?')[0];
      return { tab: 'feed' as Tab, notifs: false, postId: postId || null };
    }
    if (cleanPath.startsWith('/v/')) {
      const videoId = cleanPath.split('/v/')[1]?.split('?')[0];
      return { tab: 'videos' as Tab, notifs: false, videoId: videoId || null };
    }
    if (cleanPath.startsWith('/store/')) {
      const storeId = cleanPath.split('/store/')[1]?.split('?')[0];
      return { tab: 'discover' as Tab, notifs: false, storeId: storeId || null };
    }
    if (cleanPath.startsWith('/product/')) {
      const productId = cleanPath.split('/product/')[1]?.split('?')[0];
      return { tab: 'discover' as Tab, notifs: false, productId: productId || null };
    }
    if (cleanPath === '/admin-panel' || cleanPath === '/admin') {
      return { tab: 'admin' as Tab, notifs: false };
    }
    if (cleanPath === '/notifications') {
      return { tab: 'feed' as Tab, notifs: true };
    }
    if (cleanPath === '/explore' || cleanPath === '/discover') {
      return { tab: 'discover' as Tab, notifs: false };
    }
    if (cleanPath === '/reels' || cleanPath === '/videos' || cleanPath === '/shorts') {
      return { tab: 'videos' as Tab, notifs: false };
    }
    if (cleanPath.startsWith('/messages/')) {
      const chatUid = cleanPath.split('/messages/')[1]?.split('?')[0];
      return { tab: 'messenger' as Tab, notifs: false, chatUid };
    }
    if (cleanPath === '/messages' || cleanPath === '/messenger') {
      return { tab: 'messenger' as Tab, notifs: false };
    }
    if (cleanPath === '/settings') {
      return { tab: 'settings' as Tab, notifs: false };
    }
    if (cleanPath === '/profile' || cleanPath.startsWith('/@') || cleanPath.startsWith('/u/')) {
      let username = null;
      let userId = null;
      if (cleanPath.startsWith('/@')) username = cleanPath.split('/@')[1]?.split('?')[0];
      if (cleanPath.startsWith('/u/')) userId = cleanPath.split('/u/')[1]?.split('?')[0];
      return { tab: 'profile' as Tab, notifs: false, username, userId };
    }
    if (cleanPath === '/dashboard' || cleanPath === '/stats') {
      return { tab: 'dashboard' as Tab, notifs: false };
    }
    return { tab: 'feed' as Tab, notifs: false };
  };

  // Initialize history state on mount
  useEffect(() => {
    const currentPath = window.location.pathname;
    const pathInit = getInitialStateFromPath(currentPath);

    const initialState = {
      activeTab: pathInit.tab,
      viewingProfile: null,
      viewingPostId: (pathInit as any).postId || null,
      viewingVideoId: (pathInit as any).videoId || null,
      viewingStoreId: (pathInit as any).storeId || null,
      viewingProductId: (pathInit as any).productId || null,
      messageRecipient: (pathInit as any).chatUid ? { id: (pathInit as any).chatUid } : null,
      isPosting: false,
      isNotificationsOpen: pathInit.notifs,
      isAccountSwitcherOpen: false,
      storyState: {
        activeStoryGroup: null,
        isStudioOpen: false,
        isCreatingNote: false,
      },
      _appNav: true
    };

    setActiveTab(pathInit.tab);
    if ((pathInit as any).postId) {
      setViewingPostId((pathInit as any).postId);
    }
    if ((pathInit as any).videoId) {
      setViewingVideoId((pathInit as any).videoId);
    }
    if ((pathInit as any).storeId) {
      setViewingStoreId((pathInit as any).storeId);
    }
    if ((pathInit as any).productId) {
      setViewingProductId((pathInit as any).productId);
    }
    if ((pathInit as any).chatUid) {
      setMessageRecipient({ id: (pathInit as any).chatUid });
    }
    if ((pathInit as any).username || (pathInit as any).userId) {
      setViewingProfile({ 
        username: (pathInit as any).username, 
        id: (pathInit as any).userId 
      });
    }
    if (pathInit.notifs) {
      setIsNotificationsOpen(true);
    }

    if (!window.history.state || !window.history.state._appNav) {
      const targetUrl = getPathForAppState(
        pathInit.tab, 
        null, 
        pathInit.notifs, 
        (pathInit as any).postId || null, 
        (pathInit as any).videoId || null,
        (pathInit as any).storeId || null, 
        (pathInit as any).productId || null,
        (pathInit as any).chatUid || null
      );
      window.history.replaceState(initialState, '', targetUrl);
    } else {
      // Restore state on reload/mount if history exists
      const s = window.history.state;
      const restoredTab = s.activeTab || pathInit.tab;
      setActiveTab(restoredTab);
      setViewingProfile(s.viewingProfile || null);
      setViewingPostId(s.viewingPostId || null);
      setViewingVideoId(s.viewingVideoId || null);
      setViewingStoreId(s.viewingStoreId || null);
      setViewingProductId(s.viewingProductId || null);
      setMessageRecipient(s.messageRecipient || null);
      setIsPosting(!!s.isPosting);
      setIsNotificationsOpen(typeof s.isNotificationsOpen === 'boolean' ? s.isNotificationsOpen : pathInit.notifs);
      setIsAccountSwitcherOpen(!!s.isAccountSwitcherOpen);
      if (s.storyState) {
        setStoryState(s.storyState);
        // Let StoriesSystem know
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('aeirmist-story-state-restore', { detail: s.storyState }));
        }, 100);
      }
      const targetUrl = getPathForAppState(
        restoredTab, 
        s.viewingProfile, 
        s.isNotificationsOpen, 
        s.viewingPostId || null, 
        s.viewingVideoId || null,
        s.viewingStoreId || null, 
        s.viewingProductId || null,
        s.messageRecipient?.id || null
      );
      window.history.replaceState(s, '', targetUrl);
    }
  }, []);

  // Sync state changes to window.history and browser URL
  useEffect(() => {
    if (isPoppingRef.current) {
      isPoppingRef.current = false;
      return;
    }

    const stateToPush = {
      activeTab,
      viewingProfile,
      viewingPostId,
      viewingVideoId,
      viewingStoreId,
      viewingProductId,
      messageRecipient,
      isPosting,
      isNotificationsOpen,
      isAccountSwitcherOpen,
      storyState,
      _appNav: true
    };

    const targetUrl = getPathForAppState(
      activeTab, 
      viewingProfile, 
      isNotificationsOpen, 
      viewingPostId, 
      viewingVideoId,
      viewingStoreId, 
      viewingProductId,
      messageRecipient?.id || null
    );

    const hState = window.history.state;
    if (!hState || !hState._appNav) {
      window.history.replaceState(stateToPush, '', targetUrl);
      return;
    }

    const isDiff = !hState || 
      hState.activeTab !== activeTab ||
      JSON.stringify(hState.viewingProfile) !== JSON.stringify(viewingProfile) ||
      hState.viewingPostId !== viewingPostId ||
      hState.viewingVideoId !== viewingVideoId ||
      hState.viewingStoreId !== viewingStoreId ||
      hState.viewingProductId !== viewingProductId ||
      JSON.stringify(hState.messageRecipient) !== JSON.stringify(messageRecipient) ||
      hState.isPosting !== isPosting ||
      hState.isNotificationsOpen !== isNotificationsOpen ||
      hState.isAccountSwitcherOpen !== isAccountSwitcherOpen ||
      JSON.stringify(hState.storyState) !== JSON.stringify(storyState);

    if (isDiff) {
      window.history.pushState(stateToPush, '', targetUrl);
    } else if (window.location.pathname !== targetUrl) {
      window.history.replaceState(stateToPush, '', targetUrl);
    }
  }, [activeTab, viewingProfile, viewingPostId, messageRecipient, isPosting, isNotificationsOpen, isAccountSwitcherOpen, storyState]);

  // Listen to popstate event (back/forward button)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const poppedState = event.state;
      if (poppedState && poppedState._appNav) {
        isPoppingRef.current = true;
        
        setActiveTab(poppedState.activeTab === 'notifications' ? 'feed' : poppedState.activeTab);
        setViewingProfile(poppedState.viewingProfile);
        setViewingPostId(poppedState.viewingPostId || null);
        setViewingVideoId(poppedState.viewingVideoId || null);
        setViewingStoreId(poppedState.viewingStoreId || null);
        setViewingProductId(poppedState.viewingProductId || null);
        setMessageRecipient(poppedState.messageRecipient);
        setIsPosting(poppedState.isPosting);
        setIsNotificationsOpen(poppedState.isNotificationsOpen);
        setIsAccountSwitcherOpen(poppedState.isAccountSwitcherOpen);
        if (poppedState.storyState) {
          setStoryState(poppedState.storyState);
          window.dispatchEvent(new CustomEvent('aeirmist-story-state-restore', { detail: poppedState.storyState }));
        }
        
        // Reset popping state asynchronously to accommodate React state update scheduling
        setTimeout(() => {
          isPoppingRef.current = false;
        }, 0);
      } else {
        // Fallback popstate if state doesn't have _appNav (e.g. direct url change)
        const pathInit = getInitialStateFromPath(window.location.pathname);
        setActiveTab(pathInit.tab);
        setIsNotificationsOpen(pathInit.notifs);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  React.useEffect(() => {
    analytics.init();
  }, []);

  React.useEffect(() => {
    analytics.trackPageView(`/${activeTab}`);
  }, [activeTab]);

  const getSEOTitle = () => {
    switch (activeTab) {
      case 'feed': return 'Home';
      case 'discover': return 'Discover';
      case 'videos': return 'Videos';
      case 'messenger': return 'Direct Messages';
      case 'profile': return viewingProfile ? `${viewingProfile.displayName || viewingProfile.username} | Profile` : 'Your Profile';
      case 'settings': return 'Settings';
      case 'dashboard': return 'Stats';
      case 'notifications': return 'Notifications | Activity';
      case 'admin': return 'Enterprise Control Center';
      default: return 'Aeirmist';
    }
  };

  const getSEODescription = () => {
    if (activeTab === 'profile' && viewingProfile) {
      return `View ${viewingProfile.displayName || viewingProfile.username}'s Profile on Aeirmist.`;
    }
    return undefined;
  };

  if (isGuidelinesPage) {
    return (
      <div className="flex-1 w-full relative overflow-hidden flex flex-col min-h-0 bg-aeirmist-bg">
        <GlobalAppBackground />
        <Suspense fallback={<LazyFallback />}>
          <Routes>
            <Route path="/community-guidelines" element={<CommunityGuidelines />} />
          </Routes>
        </Suspense>
      </div>
    );
  }

  if (!isSetup && !loading && !user) {
    return (
      <Suspense fallback={null}>
        <SetupRequiredScreen connectionError={connectionError} isConnecting={isConnecting} />
      </Suspense>
    );
  }

  // Show dedicated failure screen if device link pairing failed
  if (deviceLinkingStatus.error) {
    return (
      <Suspense fallback={null}>
        <PairingFailedScreen error={deviceLinkingStatus.error} onRetry={() => window.location.href = window.location.origin} />
      </Suspense>
    );
  }

  // Show premium loader for BOTH initial load and post-login profile sync
  if (loading || (user && showSplash && !needsUsername)) {
    const isSuccessRedirect = !!user && !needsUsername;
    
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[100] overflow-hidden select-none">
        <div className="relative flex flex-col items-center max-w-xl px-6">
          <AnimatePresence mode="wait">
            {isSuccessRedirect ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center space-y-7 text-center"
              >
                {/* 0.5s - 2.4s: Welcome + Letter-by-Letter Script Name Reveal */}
                <div className="flex flex-col items-center justify-center gap-y-3 px-4">
                  <motion.span
                    initial={{ opacity: 0, y: 12, filter: 'blur(10px)' }}
                    animate={{ opacity: 0.5, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
                    className="text-xs sm:text-sm font-black tracking-[0.4em] text-zinc-500 uppercase"
                  >
                    WELCOME
                  </motion.span>
                  <span className="text-[32px] sm:text-6xl font-normal tracking-tight text-white flex flex-nowrap whitespace-nowrap justify-center gap-[1px] sm:gap-1 max-w-[95vw]">
                    {Array.from(toMathBoldScript(user.displayName || user.email?.split('@')[0] || 'User')).map((char, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, y: 22, filter: 'blur(12px)', scale: 0.88 }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
                        transition={{
                          delay: 0.85 + i * 0.05,
                          duration: 0.55,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="inline-block text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-zinc-300 drop-shadow-[0_0_22px_rgba(0,242,255,0.45)]"
                      >
                        {char === ' ' ? '\u00A0' : char}
                      </motion.span>
                    ))}
                  </span>
                </div>

                {/* 2.3s - 3.0s: Neon Cyan & Ash Divider Line */}
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: 2.2, duration: 0.8, ease: "easeInOut" }}
                  className="h-[1.5px] w-48 bg-gradient-to-r from-transparent via-aeirmist-cyan to-transparent shadow-[0_0_14px_rgba(0,242,255,0.7)]"
                />

                {/* 2.8s - 4.0s: Dynamic Loader Progress Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.7, duration: 0.6 }}
                  className="flex flex-col items-center gap-2.5"
                >
                  <p className="text-[9px] font-mono tracking-[0.35em] text-zinc-400 uppercase flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-aeirmist-cyan animate-ping" />
                    <span className="text-zinc-400">Loading your feed...</span>
                  </p>

                  <div className="w-36 h-1 rounded-full bg-zinc-900 border border-zinc-800/80 overflow-hidden relative shadow-[0_0_10px_rgba(0,0,0,0.8)]">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 2.8, duration: 1.2, ease: "easeInOut" }}
                      className="h-full bg-gradient-to-r from-zinc-600 via-aeirmist-cyan to-white shadow-[0_0_12px_rgba(0,242,255,0.9)] rounded-full"
                    />
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div 
                key="loader"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center text-center space-y-6"
              >
                <div className="relative mb-6">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="w-24 h-24 rounded-full border border-aeirmist-cyan/20 border-t-aeirmist-cyan shadow-[0_0_35px_rgba(0,242,255,0.15)]"
                  />
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 w-24 h-24 rounded-full border border-aeirmist-magenta/20 border-b-aeirmist-magenta opacity-50"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="hidden sm:block">
                      <AeirmistLogo className="w-24 h-24 animate-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" variant="compact" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-sm font-black uppercase tracking-[0.45em] text-white">
                    {deviceLinkingStatus.loading ? 'Handshaking...' : 'Connecting...'}
                  </h2>
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/20">
                    {deviceLinkingStatus.loading ? 'Linking device...' : 'Initializing This Device v4.8'}
                  </p>
                </div>

                {showSafeExit && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="pt-4 flex flex-col gap-3 w-full"
                  >
                    <div className="flex items-center gap-2 text-aeirmist-magenta/60 justify-center">
                      <AlertCircle size={13} />
                      <span className="text-[8px] font-bold uppercase tracking-widest">Network Sluggish</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => window.location.reload()}
                      className="w-full py-3.5 rounded-[18px] bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.20em] text-[9px] hover:bg-white/10 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aeirmist-cyan"
                    >
                      Reload Interface
                    </button>
                    <button 
                      type="button"
                      onClick={() => logout()}
                      className="w-full py-3.5 rounded-[18px] bg-white/5 border border-white/10 text-white/40 font-black uppercase tracking-[0.20em] text-[9px] hover:text-white transition-all underline decoration-white/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aeirmist-magenta"
                    >
                      Try Different Account
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* HUD Data Streams */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02] overflow-hidden">
          <div className="absolute top-0 left-10 w-px h-full bg-gradient-to-b from-transparent via-aeirmist-cyan to-transparent animate-scan-slow" />
          <div className="absolute top-0 right-20 w-px h-full bg-gradient-to-b from-transparent via-aeirmist-magenta to-transparent animate-scan-fast" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthSystem />;
  }

  // If user is authenticated but profile document is still hydrating
  if (!profile && !needsUsername) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-4 z-50">
        <div className="w-12 h-12 border-2 border-aeirmist-cyan/30 border-t-aeirmist-cyan rounded-full animate-spin mb-4" />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-white/60 animate-pulse">
          Initializing Account...
        </p>
      </div>
    );
  }

  // Onboarding guard: Check if user needs to complete onboarding
  const isOnboardingIncomplete = Boolean(
    profile && (
      profile.onboardingCompleted === false ||
      (profile.onboardingStep && profile.onboardingStep >= 2 && profile.onboardingStep <= 5 && profile.onboardingCompleted !== true)
    )
  );

  if (isOnboardingIncomplete || needsUsername) {
    const activeStep = profile?.onboardingStep || (needsUsername ? 1 : 2);
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <SignupWizard
          initialStep={activeStep}
          onGoToLogin={logout}
          onComplete={async () => {
            try {
              await updateProfile({ onboardingCompleted: true, onboardingStep: 5 });
            } catch (err) {
              console.warn("[App] Final onboarding update non-critical warning:", err);
            }
            setNeedsUsername(false);
            window.location.reload();
          }}
        />
      </div>
    );
  }

  if (needsPasswordOnboarding) {
    return (
      <Suspense fallback={null}>
        <CompleteYourAccountScreen />
      </Suspense>
    );
  }

  if (isScheduledForPurge) {
    return (
      <Suspense fallback={null}>
        <PurgeScreen onCancel={async () => {
          try {
            await cancelDeleteAccount();
          } catch (e) {
            console.error("Purge cancellation failure:", e);
          }
        }} onLogout={logout} />
      </Suspense>
    );
  }

  if (profile?.isDeactivated) {
    return (
      <Suspense fallback={null}>
        <DeactivatedScreen onReactivate={async () => {
          try {
            await updateProfile({ isDeactivated: false });
          } catch (e) {
            console.error("Reactivation failure:", e);
          }
        }} onLogout={logout} />
      </Suspense>
    );
  }

  if (profile?.isBanned || profile?.status === 'BANNED' || profile?.status === 'SUSPENDED') {
    return (
      <Suspense fallback={null}>
        <BannedScreen />
      </Suspense>
    );
  }

  return (
    <div className={`flex-1 w-full relative overflow-hidden flex flex-col min-h-0 ${isGlobalBgActive ? 'bg-transparent' : 'bg-aeirmist-bg'}`}>
      {/* Skip to Main Content Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[10000] focus:px-6 focus:py-3 focus:bg-aeirmist-cyan focus:text-black focus:font-black focus:rounded-2xl focus:shadow-2xl focus:outline-none focus:ring-4 focus:ring-aeirmist-cyan/40"
      >
        Skip to Main Content
      </a>
      <GlobalAppBackground />
      {/* Subtle Background Elements */}
      <div className={`fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-aeirmist-cyan/10 rounded-full blur-[120px] pointer-events-none ${isGlobalBgActive ? 'opacity-0' : 'opacity-100'}`} style={{ zIndex: -15 }} />
      <div className={`fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-aeirmist-magenta/10 rounded-full blur-[120px] pointer-events-none ${isGlobalBgActive ? 'opacity-0' : 'opacity-100'}`} style={{ zIndex: -15 }} />

      <SEO 
        title={getSEOTitle()} 
        description={getSEODescription()}
        ogType={activeTab === 'profile' ? 'profile' : 'website'}
      />
      <DynamicAesthetic />
      <AdaptiveEngine />
      <EmotionalEngine />
      <ResonanceTracker />
      
      {/* GLOBAL STORY UPLOAD FEEDBACK */}
      <AnimatePresence>
        {(storyUpload) && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-4 inset-x-4 md:left-auto md:right-8 md:w-80 z-[3000] pointer-events-auto"
          >
            <div className="glass-panel p-4 rounded-3xl border-aeirmist-cyan/30 flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
                {storyUpload?.previewUrl ? (
                  <img src={storyUpload?.previewUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Clock size={16} className="text-aeirmist-cyan animate-pulse" />
                  </div>
                )}
                {/* Micro progress ring on the thumbnail */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <svg className="w-8 h-8 -rotate-90">
                    <circle cx="16" cy="16" r="14" className="stroke-white/10 fill-none" strokeWidth="2" />
                    <motion.circle 
                      cx="16" cy="16" r="14" 
                      className="stroke-aeirmist-cyan fill-none" 
                      strokeWidth="2" 
                      strokeDasharray="88"
                      animate={{ strokeDashoffset: 88 - (88 * (storyUpload?.progress || 0) / 100) }}
                    />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-aeirmist-cyan mb-1">
                  {storyUpload?.status || 'Processing upload...'}
                </p>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${storyUpload?.progress}%` }}
                    className="h-full bg-aeirmist-cyan"
                  />
                </div>
              </div>
              {storyUpload?.progress === 100 && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full bg-aeirmist-cyan flex items-center justify-center text-black"
                >
                  <Sparkles size={12} fill="black" />
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(loading || isThemeLoading) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none"
          >
            {/* Immersive Distortion Field */}
            <motion.div 
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              className="absolute inset-0 bg-aeirmist-bg/80 backdrop-blur-[32px] pointer-events-auto"
            />
            
            <div className="relative flex flex-col items-center gap-12 pointer-events-none">
              {/* Navigation Ring */}
              <div className="relative w-48 h-48">
                {/* Orbital Rings */}
                {[...Array(3)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.05, 1],
                      opacity: [0.1, 0.4, 0.1]
                    }}
                    transition={{ 
                      duration: 4 + i * 2, 
                      repeat: Infinity, 
                      ease: "linear" 
                    }}
                    className="absolute inset-0 rounded-full border border-aeirmist-cyan/20"
                    style={{ padding: `${i * 12}px` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-aeirmist-cyan shadow-[0_0_15px_rgba(0,242,255,1)]" />
                  </motion.div>
                ))}

                {/* Core Prism */}
                <div className="absolute inset-8 rounded-full bg-aeirmist-cyan/5 border border-aeirmist-cyan/10 flex items-center justify-center overflow-hidden">
                   <motion.div 
                     animate={{ 
                       rotate: [0, 90, 180, 270, 360],
                       filter: ['hue-rotate(0deg)', 'hue-rotate(90deg)', 'hue-rotate(0deg)']
                     }}
                     transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                     className="absolute inset-0 bg-gradient-to-br from-aeirmist-cyan/40 via-transparent to-aeirmist-magenta/40 opacity-30"
                   />
                   <Zap className="text-white w-12 h-12 relative z-10 drop-shadow-[0_0_20px_rgba(255,255,255,1)]" />
                </div>

                {/* Message Field */}
                <motion.div 
                  animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-4 border-2 border-aeirmist-cyan rounded-full"
                />
              </div>

              {/* Status Modules */}
              <div className="flex flex-col items-center gap-4">
                <motion.div 
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="px-4 py-1.5 border border-aeirmist-cyan/20 bg-aeirmist-cyan/5 rounded-full"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.6em] text-aeirmist-cyan">
                    {isThemeLoading ? 'LOADING THEME' : 'LOADING'}
                  </span>
                </motion.div>
                
                <div className="flex gap-2">
                  {[...Array(5)].map((_, i) => (
                    <motion.div 
                      key={i}
                      animate={{ scaleY: [1, 2, 1], opacity: [0.2, 0.6, 0.2] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1 h-3 bg-aeirmist-cyan/40 rounded-full"
                    />
                  ))}
                </div>
              </div>

              {/* HUD Perimeter Lines */}
              <div className="absolute -inset-x-64 top-[50%] h-[1px] bg-gradient-to-r from-transparent via-aeirmist-cyan/20 to-transparent" />
            </div>

            {/* Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div 
          key="main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`layout-shell flex flex-1 min-h-0 ${isGlobalBgActive ? 'bg-transparent!' : ''}`}
        >
          <Navigation 
            onCreate={() => setIsPosting(true)} 
            activeTab={viewingProfile ? lastMainTab : activeTab} 
            onTabChange={handleTabChange}
            isExpanded={isSidebarExpanded}
            setIsExpanded={setIsSidebarExpanded}
            onNotificationsClick={() => setIsNotificationsOpen(true)}
            onPreload={preload}
            isRemoteView={!!viewingProfile}
          />

          <main id="main-content" className="flex-1 min-w-0 h-full relative overflow-hidden flex flex-col">
            <Suspense fallback={<LazyFallback />}>
              <Routes>
                <Route path="/payment-success" element={<Suspense fallback={null}><PaymentResult status="success" /></Suspense>} />
                <Route path="/payment-failure" element={<Suspense fallback={null}><PaymentResult status="failure" /></Suspense>} />
                <Route path="/admin-panel" element={<AdminPanel />} />
                <Route path="/community-guidelines" element={<CommunityGuidelines />} />
                <Route path="*" element={
                  <AnimatePresence mode="wait">
                    {activeTab === 'feed' ? (
                  <motion.div
                    key="feed"
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.01 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="h-full flex overflow-hidden lg:grid lg:grid-cols-[1fr_var(--right-panel-w)]"
                  >
                    <div className="flex-1 h-full overflow-y-auto overflow-x-hidden scroll-smooth relative min-w-0">
                      <div className="fluid-container pt-0 md:pt-0">
                        <HomeFeedSystem 
                          onUserClick={handleUserClick} 
                          onPostClick={handlePostClick}
                          onCreate={handleCreatePostClick} 
                          onNavigate={(tab) => setActiveTab(tab as any)} 
                        />
                      </div>
                    </div>
                    <Sidebar onUserClick={handleUserClick} />
                  </motion.div>
                ) : activeTab === 'messenger' ? (
                  <motion.div
                    key="messenger"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="flex-1 overflow-hidden h-full flex flex-col min-h-0"
                  >
                    {featureFlags?.inbox === false ? (
                      <ComingSoonScreen sectorName="Direct Messaging & Inbox" onHomeClick={() => setActiveTab('feed')} />
                    ) : (
                      <Messenger initialRecipient={messageRecipient} onUserClick={handleUserClick} />
                    )}
                  </motion.div>
                ) : activeTab === 'discover' ? (
                  <motion.div
                    key="discover"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="flex-1 h-full overflow-y-auto overflow-x-hidden scroll-container flex flex-col"
                  >
                    {featureFlags?.marketplace === false ? (
                      <ComingSoonScreen sectorName="Marketplace & E-Commerce" onHomeClick={() => setActiveTab('feed')} />
                    ) : (
                      <ExploreSystem 
                        onUserClick={handleUserClick} 
                        onPostClick={handlePostClick} 
                        initialStoreId={viewingStoreId}
                        initialProductId={viewingProductId}
                        onStoreChange={setViewingStoreId}
                        onProductChange={setViewingProductId}
                      />
                    )}
                  </motion.div>
                ) : activeTab === 'dashboard' ? (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="flex-1 h-full overflow-y-auto overflow-x-hidden scroll-container flex flex-col"
                  >
                    {featureFlags?.discover === false ? (
                      <ComingSoonScreen sectorName="Explore & Connections Hub" onHomeClick={() => setActiveTab('feed')} />
                    ) : (
                      <div className="w-full h-full">
                        <AeirmistDashboard onUserClick={handleUserClick} onMessageClick={handleMessageClick} />
                      </div>
                    )}
                  </motion.div>
                ) : activeTab === 'profile' ? (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="flex-1 h-full overflow-y-auto overflow-x-hidden touch-pan-y"
                  >
                    <div className="fluid-container pt-0 pb-0">
                      <ProfileSystem 
                        targetProfile={viewingProfile} 
                        onMessageClick={handleMessageClick} 
                        onEditProfile={handleEditProfileClick} 
                        onUserClick={handleUserClick}
                        onPostClick={handlePostClick}
                        onCreate={handleCreatePostClick}
                      />
                    </div>
                  </motion.div>
                ) : activeTab === 'settings' ? (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="flex-1 h-full overflow-y-auto overflow-x-hidden scroll-container"
                  >
                    <div className="w-full min-h-full">
                      <SettingsSystem />
                    </div>
                  </motion.div>
                ) : activeTab === 'admin' ? (
                  <motion.div
                    key="admin"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="flex-1 h-full overflow-y-auto scroll-container"
                  >
                    <div className="w-full min-h-full">
                      <AdminPanel />
                    </div>
                  </motion.div>
                ) : activeTab === 'videos' ? (
                  <motion.div
                    key="videos"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="flex-1 h-full overflow-hidden flex flex-col"
                  >
                    {featureFlags?.videos === false ? (
                      <ComingSoonScreen sectorName="Reels & Short Videos Feed" onHomeClick={() => setActiveTab('feed')} />
                    ) : (
                      <VideoFeed 
                        onBack={() => setActiveTab('feed')} 
                        onUserClick={handleUserClick} 
                        initialVideoId={viewingVideoId}
                        onVideoClick={(id) => setViewingVideoId(id)}
                      />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="notification-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="flex-1 h-full overflow-y-auto touch-pan-y"
                  >
                    <div className="fluid-container py-8 md:py-12">
                      <h1 className="text-4xl font-display font-bold mb-8 text-fluid-4xl">Alerts</h1>
                      <AlertsTabRedirect onComplete={() => {
                        setIsNotificationsOpen(true);
                        setActiveTab('feed');
                      }} />
                    </div>
                  </motion.div>
                    )}
                  </AnimatePresence>
                } />
              </Routes>
            </Suspense>
          </main>
          
          <AnimatePresence>
            {isPosting && <CreatePost onOpenChange={setIsPosting} />}
          </AnimatePresence>

          <AnimatePresence>
            {viewingPostId && (
              <PostDetailView 
                postId={viewingPostId} 
                onClose={() => setViewingPostId(null)} 
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isNotificationsOpen && (
              <Suspense fallback={<LazyFallback />}>
                <NotificationCenter 
                  onClose={() => setIsNotificationsOpen(false)} 
                  onDashboardClick={() => {
                    setActiveTab('dashboard');
                    setIsNotificationsOpen(false);
                  }}
                  onSettingsClick={() => {
                    setActiveTab('settings');
                    setIsNotificationsOpen(false);
                  }}
                  onNavigate={(tab) => {
                    setActiveTab(tab);
                    setIsNotificationsOpen(false);
                  }}
                  onUserClick={handleUserClick}
                />
              </Suspense>
            )}
          </AnimatePresence>

          <Suspense fallback={null}>
            <AccountSwitcher 
              isOpen={isAccountSwitcherOpen} 
              onClose={() => setIsAccountSwitcherOpen(false)} 
              onAddAccount={() => {
                setIsAccountSwitcherOpen(false);
                // Instead of logging out, we just trigger the "needsUsername" state
                // because the logic in AeirmistContext handles multi-profile under same auth
                // but we need to ensure registerUsername works for adding second profile
                // I'll add a boolean to context to force onboarding view
                setNeedsUsername(true);
              }} 
            />
          </Suspense>

          <ToastNotification />
          <NetworkBanner />
          
          <AnimatePresence>
            {cameraConfig?.isOpen && (
              <Suspense fallback={null}>
                <AeirmistCamera 
                  initialMode={cameraConfig.mode}
                  onClose={() => setCameraConfig({ ...cameraConfig, isOpen: false })}
                  onCapture={(file, mode) => {
                    if (cameraConfig.onCapture) {
                      cameraConfig.onCapture(file);
                    }
                    setCameraConfig({ ...cameraConfig, isOpen: false });
                  }}
                />
              </Suspense>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {activeCall && activeCall.status !== 'ended' && callChatInfo && activeCall.callerId !== profile?.id && activeCall.callerUid !== user?.uid && (
              <Suspense fallback={null}>
                <CallModal 
                  chat={callChatInfo}
                  type={activeCall.type}
                  onClose={() => endCall(activeCall.id, activeCall.conversationId)}
                  isIncoming={true}
                />
              </Suspense>
            )}
          </AnimatePresence>

          
          <PermissionManager
            isOpen={!!pendingPermission}
            type={pendingPermission}
            onClose={() => setPendingPermission(null)}
            status={permissions[pendingPermission]?.status}
            onConfirm={async () => {
              const success = await _requestPermission(pendingPermission);
              if (success) {
                setPendingPermission(null);
              }
            }}
          />

          {/* Development / Debugging UI */}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <NetworkStatusProvider>
        <BrowserRouter>
          <ThemeProvider>
            <AeirmistProvider>
              <ReportProvider>
                <AppearanceProvider>
                  <AppContent />
                </AppearanceProvider>
              </ReportProvider>
            </AeirmistProvider>
          </ThemeProvider>
        </BrowserRouter>
      </NetworkStatusProvider>
    </ErrorBoundary>
  );
}
