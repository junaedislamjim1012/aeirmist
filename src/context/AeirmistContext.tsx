import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  FacebookAuthProvider,
  OAuthProvider,
  linkWithCredential,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  sendPasswordResetEmail,
  updateProfile as updateAuthProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  deleteUser,
  EmailAuthProvider,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  collection,
  query,
  where,
  limit,
  serverTimestamp,
  getDocFromServer,
  getDocFromCache,
  writeBatch,
  updateDoc,
  deleteDoc,
  deleteField,
  addDoc,
  increment,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  orderBy,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

import { getCsrfToken } from '../lib/csrf';
import { trackUserSession } from '../utils/sessionTracker';
import { 
  auth as _auth, 
  db as _db, 
  storage as _storage, 
  isConfigValid,
  handleFirestoreError as libHandleFirestoreError,
  OperationType
} from '../lib/firebase';
import { usePermissions } from '../hooks/usePermissions';
import { aeirmistCache } from '../services/CacheService';
export { MediaQuality };
import { mediaService, MediaQuality } from '../services/MediaService';
import { aeirmistCall } from '../modules/calls/CallService';
import { messagingService } from '../modules/messaging/MessagingService';
import { voiceService } from '../services/VoiceService';
import { REWARDS, getRankInfo } from '../lib/aeirmistRanks';
import { analytics } from '../services/AnalyticsService';
import { followRecommService } from '../services/FollowRecommendationService';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DEACTIVATED' | 'DELETED' | 'UNDER_REVIEW';

export interface SuspensionInfo {
  reason: string;
  duration: string;
  expiresAt: string | null;
  notes?: string;
  referenceId: string;
  timestamp: string;
}

export const DEFAULT_FEATURE_FLAGS: Record<string, boolean> = {
  marketplace: true,
  videos: true,
  stories: true,
  liveStreaming: true,
  inbox: true,
  discover: true,
  aiFeatures: true,
  subscriptions: true,
  controlPanel: true,
  audioCalls: true,
  dashboard: true,
  games: true,
  notifications: true
};

interface AeirmistContextType {
  featureFlags: Record<string, boolean>;
  updateFeatureFlag: (key: string, enabled: boolean) => Promise<void>;
  user: any;
  profile: any;
  account: any;
  allProfiles: any[];
  activeProfileId: string | null;
  loading: boolean;
  db: any;
  auth: any;
  storage: any;
  lastAuthError: any;
  setLastAuthError: React.Dispatch<React.SetStateAction<any>>;
  login: () => Promise<void>;
  loginWithProvider: (providerName: 'google' | 'apple' | 'facebook' | 'yahoo') => Promise<any>;
  linkAccountMethod: (providerName: 'google' | 'apple' | 'facebook' | 'yahoo') => Promise<any>;
  unlinkAccountMethod: (providerId: string) => Promise<any>;
  requestDeleteAccount: () => Promise<void>;
  cancelDeleteAccount: () => Promise<void>;
  logActivity: (action: string, details?: string) => Promise<void>;
  pendingLinkEmail: string | null;
  setPendingLinkEmail: React.Dispatch<React.SetStateAction<string | null>>;
  pendingLinkCredential: any | null;
  setPendingLinkCredential: React.Dispatch<React.SetStateAction<any | null>>;
  isScheduledForPurge: boolean;
  loginWithEmail: (identifier: string, pass: string, remember?: boolean) => Promise<any>;
  loginAsGuestSandbox: () => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<any>;
  completeSignup: (email: string, pass: string, username: string, fullName: string, avatarFile: File | null, presetPhotoURL?: string | null) => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  refreshProfile: () => Promise<void>;
  reloadAuthUser: () => Promise<void>;
  updateUserStatus: (uid: string, status: AccountStatus) => Promise<void>;
  suspendUser: (uid: string, duration: string, reason: string, notes?: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  purgeUser: (uid: string) => Promise<void>;
  toggleUserBan: (uid: string, banStatus: boolean) => Promise<void>;
  toggleVerification: (profileId: string, verifiedStatus: boolean) => Promise<void>;
  checkUsernameAvailable: (username: string) => Promise<{ available: boolean, suggestions?: string[] }>;
  registerUsername: (username: string, additionalData?: any) => Promise<void>;
  switchProfile: (profileId: string) => Promise<void>;
  rejectFollowRequest: (requestId: string) => Promise<void>;
  acceptFollowRequest: (requestId: string, fromProfileId: string) => Promise<void>;
  toggleFollow: (targetUid: string, targetProfileData?: any) => Promise<void>;
  isFollowing: (targetUid: string) => boolean;
  isFollowPending: (targetUid: string) => boolean;
  getFollowers: (targetUid: string) => Promise<any[]>;
  getFollowing: (targetUid: string) => Promise<any[]>;
  searchUsers: (queryText: string) => Promise<any[]>;
  globalSearch: (text: string) => Promise<{
    users: any[];
    posts: any[];
    stories: any[];
    notes: any[];
    products: any[];
    videos: any[];
    groups: any[];
    pages: any[];
    shops: any[];
    messages: any[];
  }>;
  recentSearches: string[];
  saveRecentSearch: (text: string) => void;
  clearRecentSearches: () => void;
  deleteMessage: (conversationId: string, messageId: string, deleteType?: 'me' | 'everyone') => Promise<void>;
  editMessage: (conversationId: string, messageId: string, newText: string) => Promise<void>;
  clearChat: (conversationId: string, clearType: 'me' | 'both') => Promise<void>;
  togglePinMessage: (conversationId: string, messageId: string, messageText: string, isPinned: boolean) => Promise<void>;
  toggleLike: (postId: string, isCurrentlyLiked: boolean) => Promise<void>;
  toggleBookmark: (postId: string, isCurrentlyBookmarked: boolean) => Promise<void>;
  createPost: (content: string, mediaUrls?: string[]) => Promise<void>;
  editPost: (postId: string, content: string, mediaUrls?: string[]) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  archivePost: (postId: string, archive: boolean) => Promise<void>;
  editVideo: (videoId: string, caption: string) => Promise<void>;
  deleteVideo: (videoId: string, videoURL: string, thumbnailURL?: string) => Promise<void>;
  sendMessage: (conversationId: string, text: string, type?: 'text' | 'media' | 'video' | 'post' | 'voice' | 'image', mediaUrl?: string, metadata?: any) => Promise<string | undefined>;
  markAsRead: (conversationId: string) => Promise<void>;
  markAsUnread: (conversationId: string) => Promise<void>;
  updateSeenStatus: (conversationId: string) => Promise<void>;
  setTypingStatus: (conversationId: string, isTyping: boolean) => Promise<void>;
  goOnline: () => Promise<void>;
  goOffline: () => Promise<void>;
  onlineUsers: Set<string>;
  activeCall: any | null;
  callStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (conversationId: string, type: 'audio' | 'video', targetUid?: string) => Promise<void>;
  acceptCall: (callId: string, conversationId: string) => Promise<void>;
  rejectCall: (callId: string, conversationId: string) => Promise<void>;
  endCall: (callId: string, conversationId: string) => Promise<void>;
  createNotification: (targetUserId: string, type: any, message: string, metadata?: any) => Promise<void>;
  submitReport: (params: { targetType: 'post' | 'user' | 'comment' | 'message' | 'story' | 'conversation'; targetId: string; reason: string; description?: string; }) => Promise<boolean>;
  toggleNotification: (type: 'mute' | 'pin' | 'archive', targetId: string) => Promise<void>;
  toggleBlockUser: (targetId: string) => Promise<void>;
  toggleRestrictUser: (targetId: string) => Promise<void>;
  setConversationTheme: (conversationId: string, theme: string) => Promise<void>;
  updateConversationThemeSettings: (conversationId: string, settings: {
    theme?: string;
    wallpaperURL?: string;
    blurLevel?: number;
    brightness?: number;
    overlayColor?: string;
    neonIntensity?: number;
    bubbleStyle?: string;
    effectType?: string;
  }) => Promise<void>;
  toggleVanishMode: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  toggleCloseFriend: (targetUid: string) => Promise<void>;
  isCloseFriend: (targetUid: string) => boolean;
  isBlocked: (targetUid: string) => boolean;
  isRestricted: (targetUid: string) => boolean;
  addReaction: (conversationId: string, messageId: string, newEmoji: string, oldEmoji?: string) => Promise<void>;
  removeReaction: (conversationId: string, messageId: string, emoji: string) => Promise<void>;
  canWrite: (operation: string, throttleMs?: number) => boolean;
  isNavHidden: boolean;
  setIsNavHidden: (val: boolean) => void;
  suggestedUsers: any[];
  dismissSuggestion: (userId: string) => void;
  getUserInterests: () => string[];
  saveUserInterests: (interests: string[]) => void;
  needsUsername: boolean;
  setNeedsUsername: (val: boolean) => void;
  tempUsername: string;
  setTempUsername: (val: string) => void;
  localAvatarURL: string | null;
  localCoverURL: string | null;
  profileUploadProgress: number;
  coverUploadProgress: number;
  setLocalAvatarURL: (url: string | null) => void;
  setLocalCoverURL: (url: string | null) => void;
  setProfileUploadProgress: (p: number) => void;
  setCoverUploadProgress: (p: number) => void;
  uploadMedia: (file: File, folder: string, onProgress?: (p: number, status: string) => void, quality?: MediaQuality) => Promise<string>;
  mediaSettings: { quality: MediaQuality, autoDownload: boolean };
  setMediaSettings: (settings: { quality: MediaQuality, autoDownload: boolean }) => void;
  clearCache: () => Promise<void>;
  isSetup: boolean;
  isConnecting: boolean;
  earnPoints: (points: number) => Promise<void>;
  rank: any;
  connectionError: string | null;
  setConnectionError: React.Dispatch<React.SetStateAction<string | null>>;
  isOffline: boolean;
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
  toasts: any[];
  addToast: (toast: { title: string, message: string, type: 'info' | 'success' | 'warning', icon?: any }) => void;
  removeToast: (id: string) => void;
  stories: any[];
  deleteStory: (storyId: string) => Promise<void>;
  cameraConfig: { isOpen: boolean; mode: 'STORY' | 'VIDEO' | 'PHOTO'; onCapture?: (file: File) => void } | null;
  setCameraConfig: (config: { isOpen: boolean; mode: 'STORY' | 'VIDEO' | 'PHOTO'; onCapture?: (file: File) => void } | null) => void;
  storyUpload: { isUploading: boolean; progress: number; status: string; previewUrl: string | null } | null;
  setStoryUpload: (upload: { isUploading: boolean; progress: number; status: string; previewUrl: string | null } | null) => void;
  optimisticStories: any[];
  publishStory: (storyData: { 
    file?: File, 
    url?: string, 
    type: string, 
    mode: string,
    textLayers?: any[],
    stickerLayers?: any[],
    activeMusic?: any,
    currentFilter?: string,
    audience?: 'public' | 'followers' | 'closeFriends',
    rotation?: number,
    scale?: number,
    flipX?: boolean,
    brightness?: number,
    contrast?: number,
    isVideoMuted?: boolean,
    fitMode?: 'cover' | 'contain',
    boomerangFrames?: string[]
  }) => Promise<void>;
  analytics: any;
  permissions: any;
  requestPermission: (type: any) => Promise<boolean>;
  pendingPermission: any;
  setPendingPermission: (type: any) => void;
  _requestPermission: (type: any) => Promise<boolean>;
  deviceLinkingStatus: { loading: boolean; error: string | null; success: boolean };
  generateDeviceLink: () => Promise<{ token: string; link: string; pairCode: string }>;
  consumePairingCode: (code: string) => Promise<boolean>;
  isSafeMode: boolean;
  setIsSafeMode: React.Dispatch<React.SetStateAction<boolean>>;
  needsPasswordOnboarding: boolean;
  setNeedsPasswordOnboarding: React.Dispatch<React.SetStateAction<boolean>>;
}

const handleFirestoreError = (error: any, op: any, path: string | null) => {
  console.error(`[Firestore Error] Op: ${op}, Path: ${path}`, error);
  const errorStr = String(error) + " " + (error?.message || "") + " " + (error?.code || "");
  if (
    error?.code === 'resource-exhausted' ||
    errorStr.includes('quota-exceeded') ||
    errorStr.includes('Quota limit exceeded') ||
    errorStr.includes('resource-exhausted') ||
    errorStr.includes('Free daily write units per project')
  ) {
    if (typeof window !== 'undefined' && (window as any).__triggerSafeMode) {
      (window as any).__triggerSafeMode();
    }
  }
  try {
    return libHandleFirestoreError(error, op, path);
  } catch (e) {
    console.error("Firestore Error Logging Failed", e);
    throw error;
  }
};

const AeirmistContext = createContext<AeirmistContextType | undefined>(undefined);

export const AeirmistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>(DEFAULT_FEATURE_FLAGS);
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [localAvatarURL, setLocalAvatarURL] = useState<string | null>(null);
  const [localCoverURL, setLocalCoverURL] = useState<string | null>(null);
  const [profileUploadProgress, setProfileUploadProgress] = useState(0);
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);
  const [pendingLinkEmail, setPendingLinkEmail] = useState<string | null>(null);
  const [pendingLinkCredential, setPendingLinkCredential] = useState<any | null>(null);
  const [isScheduledForPurge, setIsScheduledForPurge] = useState(false);
  const [lastAuthError, setLastAuthError] = useState<any | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [deviceLinkingStatus, setDeviceLinkingStatus] = useState<{ loading: boolean; error: string | null; success: boolean }>({
    loading: false,
    error: null,
    success: false
  });

  useEffect(() => {
    if (!_db) return;
    const flagsRef = doc(_db, 'system_config', 'feature_flags');
    const unsub = onSnapshot(flagsRef, (snap) => {
      if (snap.exists()) {
        setFeatureFlags({ ...DEFAULT_FEATURE_FLAGS, ...snap.data() });
      } else {
        setDoc(flagsRef, DEFAULT_FEATURE_FLAGS, { merge: true }).catch(() => {});
      }
    }, (err) => {
      console.warn("Feature flags snapshot listener warning:", err);
    });
    return () => unsub();
  }, []);

  const updateFeatureFlag = useCallback(async (key: string, enabled: boolean) => {
    setFeatureFlags(prev => ({ ...prev, [key]: enabled }));
    try {
      const flagsRef = doc(_db, 'system_config', 'feature_flags');
      await setDoc(flagsRef, { [key]: enabled }, { merge: true });
    } catch (err) {
      console.error("Failed to update feature flag in Firestore:", err);
    }
  }, []);

  useEffect(() => {
    // Safety exit for loading state to prevent infinite spinners
    if (loading) {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = setTimeout(() => {
        if (loading) {
          console.warn("Aeirmist: Sync Timeout. Forcing interface activation.");
          setLoading(false);
          // If after 8s we have a user but still no profile, force onto onboarding
          if (user && !profile && !needsUsername) {
            console.log("[Diagnostics - Auth] Timeout reached with no profile. Forcing onboarding.");
            setNeedsUsername(true);
          }
        }
      }, 8000); 
    } else {
      // Stuck state resolver: if authenticated but no profile, not loading, and not in onboarding, force onboarding after a short delay
      if (user && !profile && !needsUsername) {
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
        console.log("[Diagnostics - Auth] Stuck state detected (authenticated without profile and not loading). Scheduling onboarding redirect...");
        loadingTimeoutRef.current = setTimeout(() => {
          if (user && !profile && !needsUsername && !loading) {
            console.warn("[Diagnostics - Auth] Still stuck. Forcing onboarding activation.");
            setNeedsUsername(true);
          }
        }, 3000);
      }
    }
    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [loading, user, profile, needsUsername]);
  const [db] = useState<any>(_db);
  const [auth] = useState<any>(_auth);
  const [storage] = useState<any>(_storage);
  const [isSetup, setIsSetup] = useState(isConfigValid);
  const [isConnecting, setIsConnecting] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem('aeirmist_auth_in_progress') === 'true';
      } catch (e) {
        console.warn("sessionStorage block detected in isConnecting initialization:", e);
      }
    }
    return false;
  });
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  // Instant Auto-Login Link Processing Hook
  useEffect(() => {
    const handleDeviceLinkParam = async () => {
      if (typeof window === 'undefined') return;
      const urlParams = new URLSearchParams(window.location.search);
      const linkToken = urlParams.get('link');
      if (!linkToken) return;

      console.log("Aeirmist Pairing Message Detected. Consuming Link Code...");
      setDeviceLinkingStatus({ loading: true, error: null, success: false });
      setLoading(true);

      try {
        const response = await fetch('/api/auth/device-link/consume', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: linkToken })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to consume pairing code.");
        }

        if (data.customToken) {
          console.log("Aeirmist Pairing Message: Successfully retrieved custom auth token, authenticating...");
          await signInWithCustomToken(auth, data.customToken);
          setDeviceLinkingStatus({ loading: false, error: null, success: true });
          
          // Clear query param so reload doesn't trigger again
          const newUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, newUrl);
        } else {
          throw new Error("Invalid custom token package received from server.");
        }
      } catch (err: any) {
        console.error("Aeirmist Pairing Handshake Exception:", err);
        setDeviceLinkingStatus({ loading: false, error: err.message || "Pairing Connection Failed.", success: false });
        // Clear params even on error to prevent looping
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      } finally {
        setLoading(false);
      }
    };

    handleDeviceLinkParam();
  }, [auth]);

  const generateDeviceLink = async () => {
    if (!user) throw new Error("Aeirmist Link: User authentication token unavailable.");
    
    // Request raw ID token for authentication
    const idToken = await user.getIdToken();
    
    const response = await fetch('/api/auth/device-link/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to generate pairing code.");
    }
    
    return await response.json(); // returns { token, link, pairCode }
  };

  const consumePairingCode = async (code: string) => {
    if (!code) throw new Error("Pairing code is empty.");
    setDeviceLinkingStatus({ loading: true, error: null, success: false });
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/device-link/consume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken()
        },
        body: JSON.stringify({ pairCode: code })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to consume pairing code.");
      }

      if (data.customToken) {
        console.log("Aeirmist Pairing Message: Successfully retrieved custom auth token via manual code, authenticating...");
        await signInWithCustomToken(auth, data.customToken);
        setDeviceLinkingStatus({ loading: false, error: null, success: true });
        return true;
      } else {
        throw new Error("Invalid custom token package received from server.");
      }
    } catch (err: any) {
      console.error("Aeirmist Pairing Code Exception:", err);
      setDeviceLinkingStatus({ loading: false, error: err.message || "Pairing Connection Failed.", success: false });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Recommendation Signals: Hydrate from Firestore on initial load
  useEffect(() => {
    if (profile?.recommendationSignals) {
      followRecommService.hydrateFromFirestoreIfEmpty(profile.recommendationSignals);
    }
  }, [profile?.id]);

  // Recommendation Signals: Periodic and Exit Sync
  useEffect(() => {
    if (!db || !profile?.id) return;

    const syncSignals = () => {
      followRecommService.syncSignalsToFirestore(db, profile.id);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        syncSignals();
      }
    };

    // Periodic sync every 5 minutes
    const interval = setInterval(syncSignals, 5 * 60 * 1000);
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [db, profile?.id]);

  const earnPoints = useCallback(async (points: number) => {
    if (!db || !profile?.id || !user?.uid || isOffline) return;
    
    // Simple throttle: don't update same profile more than once every 5 seconds for points
    const now = Date.now();
    const lastUpdate = (window as any)._last_points_update || 0;
    if (now - lastUpdate < 5000) return;
    (window as any)._last_points_update = now;

    try {
      const profileRef = doc(db, 'profiles', profile.id);
      await updateDoc(profileRef, {
        aeirmistLevel: increment(points)
      });
    } catch (e) {
      console.warn("Points sync failed", e);
    }
  }, [db, profile?.id, user?.uid, isOffline]);

  const rank = getRankInfo(profile?.aeirmistLevel || 0);

  const [isSafeMode, setIsSafeMode] = useState(false);
  const [needsPasswordOnboarding, setNeedsPasswordOnboarding] = useState(false);
  const [activeCall, setActiveCall] = useState<any | null>(null);
  const [callStream, setCallStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [cameraConfig, setCameraConfig] = useState<{ isOpen: boolean; mode: 'STORY' | 'VIDEO' | 'PHOTO'; onCapture?: (file: File) => void } | null>(null);
  const [storyUpload, setStoryUpload] = useState<{ isUploading: boolean; progress: number; status: string; previewUrl: string | null } | null>(null);
  const [optimisticStories, setOptimisticStories] = useState<any[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [toasts, setToasts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [searchCache, setSearchCache] = useState<Record<string, { results: any, timestamp: number }>>({});

  const addToast = useCallback((toast: { title: string, message: string, type: 'info' | 'success' | 'warning', icon?: any }) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // --- GLOBAL WRITE GATE & THROTTLING ---
  const lastWriteTime = useRef<{ [key: string]: number }>({});
  
  const canWrite = useCallback((operation: string, throttleMs: number = 5000): boolean => {
    if (profile?.isBanned) return false;
    const now = Date.now();
    const isCritical = ['sendMessage', 'createPost', 'createStory', 'createNote', 'deleteDoc', 'registerUsername'].includes(operation.split('_')[0]);
    if (isSafeMode && !isCritical) return false;

    const last = lastWriteTime.current[operation] || 0;
    const actualThrottle = isSafeMode ? Math.max(throttleMs, 60000) : throttleMs;
    const criticalThrottle = isSafeMode ? Math.max(10000, throttleMs) : throttleMs;
    const finalThrottle = isCritical ? criticalThrottle : actualThrottle;
    
    if (now - last < finalThrottle) return false;
    lastWriteTime.current[operation] = now;
    return true;
  }, [isSafeMode]);

  const createNotification = useCallback(async (targetId: string, type: any, message: string, metadata: any = {}) => {
    if (!db || !profile || !canWrite(`notify_${targetId}_${type}`, 5000)) return; 
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: targetId,
        fromUserId: profile.id,
        user: {
          name: profile.displayName,
          avatar: profile.photoURL,
          username: profile.username,
          isVerified: profile.isVerified || false
        },
        type,
        message,
        metadata,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Notification creation failed", e);
    }
  }, [db, profile, canWrite]);

  // Set up global Safe Mode / Sandbox trigger for Quota Exceeded errors
  useEffect(() => {
    if (user && profile && profile.hasPassword === false) {
      setNeedsPasswordOnboarding(true);
    }
  }, [user, profile]);

  // Track active device session and log activity
  useEffect(() => {
    if (db && user?.uid) {
      const isGoogle = user.providerData?.some((p: any) => p.providerId === 'google.com');
      trackUserSession(db, user.uid, isGoogle ? 'Google' : 'Email & Password').catch(err => {
        console.warn("Session tracking initialization warning:", err);
      });
    }
  }, [db, user?.uid]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__triggerSafeMode = () => {
        setIsSafeMode(true);
        addToast({
          title: "Cloud Linking Suspended",
          message: "Daily cloud quota limits reached. Operating in secure offline Sandbox Mode.",
          type: "warning"
        });
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__triggerSafeMode;
      }
    };
  }, [addToast]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
      audio.volume = 0.4;
      audio.play().catch(e => console.warn("Audio play blocked", e));
    } catch (e) {
      console.warn("Audio setup failed", e);
    }
  };

  const [mediaSettings, setMediaSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('aeirmist_media_settings');
      return saved ? JSON.parse(saved) : { quality: MediaQuality.AUTO, autoDownload: true };
    } catch (e) {
      console.warn("localStorage block detected in mediaSettings initialization:", e);
      return { quality: MediaQuality.AUTO, autoDownload: true };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('aeirmist_media_settings', JSON.stringify(mediaSettings));
    } catch (e) {
      console.warn("localStorage block detected in mediaSettings update:", e);
    }
  }, [mediaSettings]);

  // Upload Recovery
  useEffect(() => {
    const recoverUploads = async () => {
      const pending = await aeirmistCache.getPendingUploads();
      if (pending.length > 0) {
        console.log(`[AeirmistProvider] Found ${pending.length} pending uploads, attempting recovery...`);
        // We can't automatically restart `uploadBytesResumable` here easily without the task reference,
        // but this is where we would trigger the retry UI for the user.
      }
    };
    recoverUploads();
  }, []);

  // Notification permission request removed from mount to prevent startup popups.
  // Will be requested just-in-time when needed.
  useEffect(() => {
    // Permission sync logic can stay if non-intrusive, but we remove the request call.
    if (typeof window !== 'undefined' && 'Notification' in window) {
       // Just syncing state, not requesting
    }
  }, []);

  const { permissions, requestPermission: _requestPermission } = usePermissions();
  const [pendingPermission, setPendingPermission] = useState<any>(null);

  const uploadMedia = useCallback(async (file: File, folder: string, onProgress?: (p: number, status: string) => void, quality: MediaQuality = MediaQuality.AUTO) => {
    if (!storage) {
        console.error("[AeirmistContext] Storage not initialized");
        throw new Error("Storage not initialized");
    }

    // Digital Size Sentinel: Validate limits before processing
    const isProfile = folder.includes('profile');
    const isCover = folder.includes('cover');
    const isStory = folder.includes('stories') || folder.includes('story');
    const maxMB = isProfile ? 2 : (isCover ? 5 : 45);
    if (file.size > maxMB * 1024 * 1024) {
      const errorMsg = `File size too large. Max ${maxMB}MB allowed for ${isProfile ? 'profile' : (isCover ? 'cover' : 'story/media')} uploads.`;
      addToast({
        title: "Size Violation",
        message: errorMsg,
        type: "warning"
      });
      throw new Error(errorMsg);
    }
    
    const currentUser = user || auth.currentUser;
    console.log(`[MediaContext] Initiating, user state: ${user ? 'present' : 'null'}, auth.currentUser: ${auth.currentUser ? 'present' : 'null'}`);
    if (!currentUser) {
        console.error("[AeirmistContext] User not logged in, cannot upload. user:", user, "auth.currentUser:", auth.currentUser);
        throw new Error("User not logged in");
    }
    
    // Use currentUser.uid safely
    const uid = currentUser.uid;
    const timestamp = Date.now();
    const filePath = `${folder}/${timestamp}_${file.name}`;
    
    console.log(`[MediaContext] Queuing upload: ${file.name} to ${filePath} (Quality: ${quality})`);
    
    try {
      const url = await mediaService.uploadWithProgress(storage, file, filePath, (p, status) => {
        onProgress?.(p, status);
      }, quality);
      
      console.log(`[MediaContext] Upload task completed: ${url}`);
      return url;
    } catch (e: any) {
      console.error("[MediaContext] Storage upload failure:", e);
      
      addToast({
        title: "Transmission Failed",
        message: e.message || "Failed to upload media to the neural network.",
        type: "warning"
      });
      
      throw e;
    }
  }, [storage, addToast]);

  const publishStory = useCallback(async (storyData: { 
    file?: File, 
    url?: string, 
    type: string, 
    mode: string,
    textLayers: any[],
    stickerLayers: any[],
    activeMusic: any,
    currentFilter: string,
    audience?: 'public' | 'followers' | 'closeFriends',
    rotation?: number,
    scale?: number,
    flipX?: boolean,
    brightness?: number,
    contrast?: number,
    isVideoMuted?: boolean,
    fitMode?: 'cover' | 'contain',
    boomerangFrames?: string[]
  }) => {
    if (!user || !profile || !db) return;

    const previewUrl = storyData.url || (storyData.file ? URL.createObjectURL(storyData.file) : null);
    const audience = (storyData as any).audience || 'public';

    // Handle NGL Integration
    const pendingNGL = (window as any).__PENDING_NGL_REPLY;
    let nglData: any = {};
    if (pendingNGL) {
      nglData = {
        ngl_message_id: pendingNGL.id,
        ngl_content: pendingNGL.content
      };
      
      const nglRef = doc(db, 'ngl_messages', pendingNGL.id);
      updateDoc(nglRef, {
        status: 'replied',
        repliedAt: serverTimestamp()
      }).catch(console.error);

      (window as any).__PENDING_NGL_REPLY = null;
    }

    const storyDoc = {
      userId: user.uid,
      userName: profile.username || profile.displayName || 'Anonymous Voyager',
      userAvatar: profile.photoURL || '',
      mediaUrl: previewUrl || storyData.url || '',
      thumbnailUrl: previewUrl || '',
      mediaType: storyData.type || 'image',
      createdAt: new Date(),
      viewers: [],
      overlayText: storyData.textLayers?.map((l: any) => l.text).join(' | ') || '',
      textLayers: storyData.textLayers || [],
      stickerLayers: storyData.stickerLayers || [],
      hashtags: storyData.stickerLayers?.filter((s: any) => s.type === 'hashtag').map((s: any) => s.content.replace('#', '')) || [],
      musicId: storyData.activeMusic?.id || null,
      stickersCount: storyData.stickerLayers?.length || 0,
      filter: storyData.currentFilter || 'none',
      rotation: storyData.rotation || 0,
      scale: storyData.scale || 1,
      flipX: storyData.flipX || false,
      brightness: storyData.brightness || 100,
      contrast: storyData.contrast || 100,
      mode: storyData.mode || 'story',
      audience,
      visibleTo: audience === 'closeFriends' ? (profile.social?.closeFriends || []) : [],
      activeMusic: storyData.activeMusic || null,
      isVideoMuted: storyData.isVideoMuted ?? false,
      fitMode: storyData.fitMode || 'cover',
      boomerangFrames: storyData.boomerangFrames || null,
      ...nglData,
      isOptimistic: true,
      id: `opt_${Date.now()}`
    };

    // INSTANT FEEDBACK: Add to optimistic stories immediately (0ms delay)
    setOptimisticStories(prev => [storyDoc, ...prev]);
    
    setStoryUpload({
      isUploading: true,
      progress: 15,
      status: 'Sharing story...',
      previewUrl
    });

    // Background upload & Firestore sync (asynchronous, non-blocking)
    (async () => {
      try {
        let finalMediaUrl = storyData.url || '';

        // Generate thumbnail promise in parallel for videos
        const thumbnailPromise = (async () => {
          if (storyData.file && storyData.type === 'video') {
            try {
              const thumbData = await mediaService.generateThumbnail(storyData.file);
              if (!thumbData) return null;
              const blob = await (await fetch(thumbData)).blob();
              return await uploadMedia(new File([blob], 'thumb.webp', { type: 'image/webp' }), `users/${user.uid}/stories/thumbs`, () => {}, MediaQuality.THUMBNAIL);
            } catch (e) {
              return null;
            }
          }
          return null;
        })();

        if (storyData.file) {
          finalMediaUrl = await uploadMedia(storyData.file, `users/${user.uid}/stories`, (progress, status) => {
            const totalProgress = Math.min(90, 15 + Math.floor(progress * 0.75));
            let displayStatus = status;
            if (status === 'Uploading...') {
              displayStatus = `Uploading... ${Math.floor(progress)}%`;
            } else if (status === 'Sharing...') {
              displayStatus = 'Sharing...';
            }
            setStoryUpload(prev => prev ? { ...prev, progress: totalProgress, status: displayStatus } : null);
          }, MediaQuality.STORY);
        }

        setStoryUpload(prev => prev ? { ...prev, progress: 92, status: 'Finalizing...' } : null);

        const timeoutPromise = new Promise<null>(r => setTimeout(() => r(null), 3000));
        const thumbnailUrl = await Promise.race([thumbnailPromise, timeoutPromise]);
        
        const firebaseDoc = { 
          ...storyDoc, 
          mediaUrl: finalMediaUrl || storyDoc.mediaUrl,
          thumbnailUrl: thumbnailUrl || '',
          createdAt: serverTimestamp() 
        };
        delete (firebaseDoc as any).isOptimistic;
        delete (firebaseDoc as any).id;

        const docRef = await addDoc(collection(db, 'stories'), firebaseDoc);
        
        // Send notifications to mentioned users
        const mentions = storyData.stickerLayers?.filter((s: any) => s.type === 'mention' && s.mentionId) || [];
        for (const mention of mentions) {
          createNotification(
            mention.mentionId, 
            'mention', 
            `tagged you in a story`, 
            { storyId: docRef.id, storyUrl: finalMediaUrl || storyDoc.mediaUrl }
          ).catch(console.error);
        }
        
        setStoryUpload(prev => prev ? { ...prev, progress: 100, status: 'Shared!' } : null);
        setTimeout(() => setStoryUpload(null), 3000);
        
        analytics.trackEngagement('story_upload', { 
          mediaType: storyData.type || 'image',
          isNGLReply: !!nglData.ngl_message_id
        });
      } catch (error) {
        console.error("Background story upload failed:", error);
        setStoryUpload(prev => prev ? { ...prev, isUploading: false, status: 'Upload Failed' } : null);
        addToast({
          title: "Upload Error",
          message: "Story upload encountered an issue while syncing.",
          type: "warning"
        });
      }
    })();

    // Clear optimistic story after Firestore sync buffer
    setTimeout(() => {
      setOptimisticStories(prev => prev.filter(s => s.id !== storyDoc.id));
    }, 12000);
  }, [user, profile, db, uploadMedia, addToast, createNotification]);

  // Modular Services
  const sendMessage = useCallback(async (conversationId: string, text: string, type: any = 'text', mediaUrl?: string, metadata: any = {}) => {
    if (!db || !profile || !user || !canWrite(`send_${conversationId}_${Date.now()}`, 100)) return;
    
    // Determine if the receiver is online for notification optimization
    let isReceiverOnline = false;
    let targetProfile = metadata.targetProfile;
    let isFollowing = false;
    let isFollower = false;

    if (conversationId && !conversationId.startsWith('new_')) {
      isReceiverOnline = metadata.isReceiverOnline || false;
    } else if (conversationId.startsWith('new_')) {
      // It's a new conversation, check follow status
      const targetId = conversationId.replace('new_', '');
      isFollowing = (profile.social?.following || []).includes(targetId);
      isFollower = (profile.social?.followers || []).includes(targetId);
      
      if (!targetProfile) {
        try {
          const snap = await getDoc(doc(db, 'profiles', targetId));
          if (snap.exists()) {
            targetProfile = { id: snap.id, ...snap.data() };
          }
        } catch (e) {}
      }
    }

    console.log("SEND_MESSAGE_DEBUG:", {
      conversationId,
      profileId: profile.id,
      userUid: user.uid,
      isNewConversation: conversationId.startsWith('new_'),
      targetProfile: targetProfile || null
    });

    try {
      const msgId = await messagingService.sendMessage(db, profile, user, conversationId, text, type, mediaUrl, { 
        ...metadata, 
        isReceiverOnline,
        targetProfile,
        isFollowing,
        isFollower
      });
      analytics.trackEngagement('message', { type, conversationId });
      await earnPoints(REWARDS.MESSAGE);
      return msgId;
    } catch (e: any) {
      console.error("Message send failed", e);
      addToast({
        title: "Message Failed",
        message: "We couldn't send your message. Please check your connection.",
        type: "warning"
      });
      throw e;
    }
  }, [db, profile, user]);

  const startCall = useCallback(async (conversationId: string, type: 'audio' | 'video', targetUid?: string) => {
    if (!db || !profile || !user || isSafeMode || !canWrite('startCall', 15000)) return;
    try {
      let otherProfileId: string | undefined;
      let otherParticipantUid: string | undefined = targetUid;
      
      analytics.trackEngagement(type === 'video' ? 'video_call' : 'call', { conversationId });

      let existingConvRef = null;
      let existingData = null;

      if (conversationId.startsWith('new_')) {
        otherProfileId = conversationId.replace('new_', '');
      } else {
        const convRef = doc(db, 'conversations', conversationId);
        const convSnap = await getDoc(convRef);
        existingData = convSnap.data() as any;
        
        if (existingData) {
          existingConvRef = convRef;
          otherProfileId = existingData.profileIds?.find((id: string) => id !== profile.id);
          if (!otherParticipantUid) {
             otherParticipantUid = existingData.participants?.find((uid: string) => uid !== user?.uid);
          }
          if (!otherProfileId && otherParticipantUid) {
             otherProfileId = otherParticipantUid;
          }
        }
      }

      if (!otherProfileId) {
        throw new Error("Target user not found in this conversation.");
      }

      let otherProfileData: any = null;
      let finalOtherProfileId = otherProfileId;

      const otherProfileDoc = await getDoc(doc(db, 'profiles', otherProfileId));
      if (otherProfileDoc.exists()) {
        otherProfileData = otherProfileDoc.data();
        
        // Privacy Guard: Mutual Handshake Requirement
        const following = profile.social?.following || [];
        const targetFollowing = otherProfileData.social?.following || [];
        const isFollowingTarget = following.includes(otherProfileId);
        const isFollowedByTarget = targetFollowing.includes(profile.id);
        
        if (!isFollowingTarget || !isFollowedByTarget) {
           console.warn("[AeirmistContext] Call Connection Issue: Mutual connection handshake status incomplete. Connection might be unstable.");
           // We allow it but with a warning in logs, or we could add a toast.
        }
      } else {
        // Fallback: perhaps otherProfileId is actually a UID
        const qProfile = query(collection(db, 'profiles'), where('ownerUid', '==', otherProfileId), limit(1));
        const pSnap = await getDocs(qProfile);
        if (!pSnap.empty) {
           otherProfileData = pSnap.docs[0].data();
           finalOtherProfileId = pSnap.docs[0].id;
        } else if (otherParticipantUid) {
           // Fallback to uid
           const qUid = query(collection(db, 'profiles'), where('ownerUid', '==', otherParticipantUid), limit(1));
           const uSnap = await getDocs(qUid);
           if (!uSnap.empty) {
             otherProfileData = uSnap.docs[0].data();
             finalOtherProfileId = uSnap.docs[0].id;
           }
        }
      }

      if (!otherProfileData) {
        throw new Error("Could not connect to user. Profile not found.");
      }

      // Audit: Check if user is offline
      const isTargetOnline = onlineUsers.has(finalOtherProfileId);
      if (!isTargetOnline) {
         console.warn("[AeirmistContext] Target user appears to be offline. Call might not be received immediately.");
         // We could add a toast here, but for now let's just log it.
      }

      const otherProfile = { 
        id: finalOtherProfileId, 
        ...otherProfileData,
        ownerUid: otherProfileData?.ownerUid || otherProfileData?.uid || otherParticipantUid
      } as any;

      if (!otherProfile.ownerUid) {
        throw new Error("Target identity resolution failed. Missing Account identifier.");
      }

      const { callId, stream } = await aeirmistCall.createCall(
        db, 
        { ...profile, ownerUid: profile.ownerUid || user?.uid }, 
        otherProfile, 
        conversationId,
        type, 
        (rStream) => setRemoteStream(rStream)
      );
      
      setCallStream(stream);

      if (existingConvRef) {
        await updateDoc(existingConvRef, {
          activeCall: {
            id: callId,
            type,
            status: 'calling',
            initiatorId: profile.id,
            recipientId: otherProfileId,
            participants: existingData?.participants || [user?.uid, otherProfile.ownerUid].filter(Boolean).sort(),
            startTime: serverTimestamp(),
          },
          updatedAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.error("Call initiation failed", e);
    }
  }, [db, profile, user]);

  const acceptCall = useCallback(async (callId: string, conversationId: string) => {
    if (!db || !profile || isSafeMode || !canWrite(`accept_${callId}`, 5000)) return;
    try {
      const stream = await aeirmistCall.answerCall(db, callId, (rStream) => setRemoteStream(rStream));
      setCallStream(stream);

      // Update conversation state if possible
      if (conversationId) {
        const convRef = doc(db, 'conversations', conversationId);
        await updateDoc(convRef, {
          'activeCall.status': 'accepted',
          'activeCall.acceptedAt': serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.error("Accept call failed", e);
    }
  }, [db, profile]);

  const rejectCall = useCallback(async (callId: string, conversationId: string) => {
    if (!db || !profile || !canWrite(`reject_${callId}`, 5000)) return;
    try {
      await aeirmistCall.updateStatus(db, callId, 'rejected');
      if (conversationId) {
        await updateDoc(doc(db, 'conversations', conversationId), {
          'activeCall.status': 'ended',
          'activeCall.endedAt': serverTimestamp()
        });
      }
    } catch (e) {}
    setCallStream(null);
    setRemoteStream(null);
    setActiveCall(null);
  }, [db]);

  const endCall = useCallback(async (callId: string, conversationId: string) => {
    if (!db || !profile || !canWrite(`end_${callId}`, 3000)) return;
    try {
      if (callId) await aeirmistCall.updateStatus(db, callId, 'ended');
      if (conversationId) {
        await updateDoc(doc(db, 'conversations', conversationId), {
          activeCall: null
        });
      }
    } catch (e) {}
    setCallStream(null);
    setRemoteStream(null);
    setActiveCall(null);
  }, [db]);



  const lastTypingStatus = useRef<{ [key: string]: boolean }>({});
  const lastTypingUpdateTime = useRef<{ [key: string]: number }>({});

  const setTypingStatus = async (conversationId: string, isTyping: boolean) => {
    if (!db || !profile || isOffline) return;
    
    if (isTyping) {
      const opKey = `typing_${conversationId}_true`;
      const throttle = 2000; 
      if (!canWrite(opKey, throttle)) return;
    }

    try {
      // OPTIMIZATION: Use a dedicated 'indicators' collection to avoid updating main conversation doc
      const indicatorId = `${conversationId}_${profile.id}`;
      const indicatorRef = doc(db, 'typing_indicators', indicatorId);
      
      if (isTyping) {
        await setDoc(indicatorRef, {
          conversationId,
          profileId: profile.id,
          username: profile.username,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        await deleteDoc(indicatorRef);
      }
    } catch (e) {
      console.warn("Typing status update failed", e);
    }
  };

  const updateSeenStatus = useCallback(async (conversationId: string) => {
    if (!db || !profile || isOffline || !conversationId) return;
    
    // Respect Read Receipts setting
    if (profile.messagingSettings?.readReceipts === false) return;

    if (!canWrite(`read_${conversationId}`, 2000)) return;

    try {
      await messagingService.markAsRead(db, conversationId, profile.id);
    } catch (e) {
      console.warn("[AeirmistContext] Seen status update delayed", e);
    }
  }, [db, profile?.id, profile?.messagingSettings?.readReceipts, isOffline, canWrite]);

  const markAsRead = useCallback(async (conversationId: string) => {
    return updateSeenStatus(conversationId);
  }, [updateSeenStatus]);

  const markAsUnread = useCallback(async (conversationId: string) => {
    if (!profile?.id || !db || !conversationId) return;
    try {
      const convRef = doc(db, 'conversations', conversationId);
      await updateDoc(convRef, {
        [`unreadCount.${profile.id}`]: 1
      });
    } catch (e) {
      console.error("[AeirmistContext] markAsUnread error:", e);
    }
  }, [db, profile?.id]);

  const createPost = useCallback(async (content: string, mediaUrls: string[] = []) => {
    if (!db || !profile || !user || isSafeMode) return;
    try {
      const postData = {
        content,
        mediaUrls,
        authorId: profile.id,
        authorUid: user.uid,
        author: {
          displayName: profile.displayName,
          username: profile.username,
          photoURL: profile.photoURL,
          isVerified: profile.isVerified || false
        },
        likesCount: 0,
        commentsCount: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await addDoc(collection(db, 'posts'), postData);
      await earnPoints(REWARDS.POST_CREATED);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'posts');
    }
  }, [db, profile, isSafeMode]);

  const editPost = useCallback(async (postId: string, content: string, mediaUrls: string[] = []) => {
    if (!db || !profile || isSafeMode) return;
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        content,
        mediaUrls,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'posts');
    }
  }, [db, profile, isSafeMode]);

  const deletePost = useCallback(async (postId: string) => {
    if (!db || !profile || isSafeMode) return;
    try {
      const postRef = doc(db, 'posts', postId);
      
      // 1. Delete comments subcollection documents
      const commentsRef = collection(db, 'posts', postId, 'comments');
      const commentsSnap = await getDocs(commentsRef);
      const batch = writeBatch(db);
      commentsSnap.forEach((commentDoc) => {
        batch.delete(commentDoc.ref);
      });
      
      // 2. Delete notifications referencing this post
      const notificationsRef = collection(db, 'notifications');
      const notificationsQuery = query(notificationsRef, where('metadata.postId', '==', postId));
      const notificationsSnap = await getDocs(notificationsQuery);
      notificationsSnap.forEach((notifDoc) => {
        batch.delete(notifDoc.ref);
      });

      const notificationsQuery2 = query(notificationsRef, where('metadata.id', '==', postId));
      const notificationsSnap2 = await getDocs(notificationsQuery2);
      notificationsSnap2.forEach((notifDoc) => {
        batch.delete(notifDoc.ref);
      });
      
      await batch.commit();

      // 3. Delete the post document itself
      await deleteDoc(postRef);
      console.log(`[deletePost Success] Purged post: ${postId}, comments and notifications`);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `posts/${postId}`);
    }
  }, [db, profile, isSafeMode]);

  const editVideo = useCallback(async (videoId: string, caption: string) => {
    if (!db || !profile || isSafeMode) return;
    try {
      const videoRef = doc(db, 'videos', videoId);
      await updateDoc(videoRef, {
        caption,
        updatedAt: serverTimestamp()
      });
      addToast({
        title: 'Video Updated',
        message: 'Your video caption has been saved.',
        type: 'success'
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `videos/${videoId}`);
    }
  }, [db, profile, isSafeMode, addToast]);

  const deleteVideo = useCallback(async (videoId: string, videoURL: string, thumbnailURL?: string) => {
    if (!db || !profile || isSafeMode) return;
    try {
      // 1. Delete Firestore Document
      await deleteDoc(doc(db, 'videos', videoId));

      // 2. Delete Storage Objects
      const videoRef = ref(storage, videoURL);
      await deleteObject(videoRef).catch(err => console.warn('Failed to delete video file:', err));

      if (thumbnailURL && !thumbnailURL.includes('unsplash.com') && !thumbnailURL.includes('picsum.photos')) {
        const thumbRef = ref(storage, thumbnailURL);
        await deleteObject(thumbRef).catch(err => console.warn('Failed to delete thumbnail file:', err));
      }

      addToast({
        title: 'Video Deleted',
        message: 'The video has been successfully removed.',
        type: 'success'
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `videos/${videoId}`);
    }
  }, [db, profile, isSafeMode, storage, addToast]);

  const deleteStory = useCallback(async (storyId: string) => {
    if (!db || !profile || isSafeMode) return;
    try {
      await deleteDoc(doc(db, 'stories', storyId));
      addToast({
        title: 'Story Deleted',
        message: 'Your story has been removed.',
        type: 'success'
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `stories/${storyId}`);
    }
  }, [db, profile, isSafeMode, addToast]);

  useEffect(() => {
    if (!db || !user) return;
    const storiesRef = collection(db, 'stories');
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const q = query(
      storiesRef,
      where('createdAt', '>', yesterday),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const storyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStories(storyData);
    }, (error) => {
      console.warn("Global stories uplink busy.", error);
    });

    return () => unsubscribe();
  }, [db, user?.uid]);

  const archivePost = useCallback(async (postId: string, archive: boolean) => {
    if (!db || !profile || isSafeMode) return;
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        isArchived: archive,
        updatedAt: serverTimestamp()
      });
      console.log(`[archivePost Success] Updated archive state of post: ${postId} to ${archive}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `posts/${postId}`);
    }
  }, [db, profile, isSafeMode]);

  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const suggestionsFetched = useRef<string>("");

  const dismissSuggestion = useCallback((userId: string) => {
    followRecommService.dismissSuggestion(userId);
    setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

  const getUserInterests = useCallback(() => {
    return followRecommService.getUserInterests();
  }, []);

  const saveUserInterests = useCallback((interests: string[]) => {
    followRecommService.saveUserInterests(interests);
    // Trigger immediate recalculation of suggested users
    suggestionsFetched.current = ""; 
  }, []);

  const fetchSuggestions = useCallback(async () => {
    if (!db || !profile?.id) return;
    try {
      const q = query(collection(db, 'profiles'), limit(45));
      const snapshot = await getDocs(q);
      const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      const dismissed = followRecommService.getDismissedSuggestions();
      const following = profile.social?.following || [];

      // Calculate scores
      let scored = allUsers
        .filter(u => u.id !== profile.id && u.uid !== user?.uid && u.ownerUid !== user?.uid && !following.includes(u.id))
        .map(u => {
          const rating = followRecommService.calculateRecommendationScore(
            profile,
            u,
            new Set(),
            {},
            profile.joinedCommunities || []
          );
          return {
            ...u,
            recommScore: rating.score,
            recommReason: rating.reason,
            recommBreakdown: rating.breakdown,
            isDismissed: dismissed.includes(u.id)
          };
        });

      // Split into active recommendations (not dismissed) and fallback pool
      let activeSuggestions = scored.filter(u => !u.isDismissed);
      
      // Bootstrap: if list is empty or very limited, backfill with dismissed users if necessary to avoid dry states
      if (activeSuggestions.length < 3) {
        activeSuggestions = scored; // include all
      }

      // Sort with highest score first
      const sorted = activeSuggestions.sort((a, b) => b.recommScore - a.recommScore);
      setSuggestedUsers(sorted.slice(0, 10)); // return top 10 recommended
    } catch (e) {
       console.warn("Follow recommendation system failed", e);
    }
  }, [db, profile?.id, user?.uid]);

  // Reactive listener to refresh suggestions periodically or when following status changes
  useEffect(() => {
    if (!db || !profile?.id) return;
    const followingStr = JSON.stringify(profile.social?.following || []);
    const triggerId = `${profile.id}_${followingStr}_${suggestionsFetched.current === profile.id ? "done" : "init"}`;
    
    // De-dupe multiple firing of recommendations calculated in same render pass
    if (suggestionsFetched.current === triggerId) return;
    suggestionsFetched.current = triggerId;

    fetchSuggestions();
  }, [db, profile?.id, fetchSuggestions, JSON.stringify(profile?.social?.following || [])]);

  const toggleNotification = async (type: 'mute' | 'pin' | 'archive', targetId: string) => {
    if (type === 'archive') {
      console.log('[Archive Action Initiated]', { conversationId: targetId });
    } else {
      console.log(`[Notification ${type} Action Initiated]`, { conversationId: targetId });
    }

    if (!profile || !db || isSafeMode) return;

    try {
      const convRef = doc(db, 'conversations', targetId);
      const fieldKey = type === 'mute' ? 'isMuted' : (type === 'pin' ? 'isPinned' : 'isArchived');
      const chatDoc = await getDoc(convRef);
      const rawData = chatDoc.data();
      const rawVal = rawData?.[fieldKey];
      
      // Determine current value for the user
      let currentVal = false;
      if (typeof rawVal === 'boolean') {
        currentVal = rawVal;
      } else if (rawVal && typeof rawVal === 'object') {
        currentVal = !!rawVal[profile.id];
      }

      const nextVal = !currentVal;

      // Update safely. If it's currently a boolean, we should ideally convert it to an object 
      // or just keep it as a boolean if we want global. 
      // But per-user is better. 
      
      const updates: any = {};
      
      if (rawVal && typeof rawVal === 'object') {
        updates[`${fieldKey}.${profile.id}`] = nextVal;
      } else {
        // If it was a boolean or null, we start the object structure
        updates[fieldKey] = {
          [profile.id]: nextVal
        };
      }
      
      await updateDoc(convRef, updates);

      const actionLabel = type === 'mute' ? (nextVal ? 'Muted' : 'Unmuted') : 
                          type === 'pin' ? (nextVal ? 'Pinned' : 'Unpinned') : 
                          (nextVal ? 'Archived' : 'Restored');

      addToast({
        title: `${actionLabel}`,
        message: `Chat has been ${actionLabel.toLowerCase()} successfully.`,
        type: 'success'
      });

      if (type === 'archive') {
        console.log('[Archive Action Successful]', { conversationId: targetId, isArchived: nextVal });
      } else {
        console.log(`[Notification ${type} Action Successful]`, { conversationId: targetId, [fieldKey]: nextVal });
      }
    } catch (e) {
      if (type === 'archive') {
        console.error('[Archive Action Failed]', e);
      } else {
        console.error(`[Notification ${type} Action Failed]`, e);
      }
      handleFirestoreError(e, OperationType.UPDATE, `conversations/${targetId}`);
    }
  };

  const toggleVanishMode = async (conversationId: string) => {
    if (!db || !profile || !canWrite(`vanish_${conversationId}`, 1000)) return;
    try {
      const convRef = doc(db, 'conversations', conversationId);
      const chatDoc = await getDoc(convRef);
      const currentVal = chatDoc.data()?.isVanishMode || false;
      await updateDoc(convRef, {
        isVanishMode: !currentVal
      });
    } catch (e) {
      console.error("Vanish mode toggle failed", e);
    }
  };

  const setConversationTheme = async (conversationId: string, theme: string) => {
    if (!db || !profile || !canWrite(`theme_${conversationId}`, 1000)) return;
    try {
      const convRef = doc(db, 'conversations', conversationId);
      await updateDoc(convRef, {
        theme: theme
      });
    } catch (e) {
      console.error("Set theme failed", e);
    }
  };

  const updateConversationThemeSettings = async (conversationId: string, settings: any) => {
    if (!db || !profile) return;
    try {
      const convRef = doc(db, 'conversations', conversationId);
      // Clean undefined keys before saving
      const cleanSettings: any = {};
      Object.keys(settings).forEach(k => {
        if (settings[k] !== undefined) {
          cleanSettings[k] = settings[k];
        }
      });
      await updateDoc(convRef, {
        themeSettings: cleanSettings
      });
    } catch (e) {
      console.error("Update conversation themeSettings failed", e);
    }
  };

  const toggleBlockUser = async (targetId: string) => {
    if (!profile) return;
    const isCurrentlyBlocked = (profile.social?.blocked || []).includes(targetId);
    console.log('[Block Action Initiated]', { 
      targetId, 
      currentBlockedList: profile.social?.blocked || [], 
      action: isCurrentlyBlocked ? 'Unblock' : 'Block' 
    });
    try {
      const updatedBlocked = isCurrentlyBlocked
        ? (profile.social?.blocked || []).filter((id: string) => id !== targetId)
        : [...(profile.social?.blocked || []), targetId];

      setProfile((prev: any) => ({
        ...prev,
        social: {
          ...prev?.social,
          blocked: updatedBlocked
        }
      }));

      if (!db || isSafeMode) {
        console.log('[Block Action Sandbox Bypass / No DB]', { targetId, isBlocked: !isCurrentlyBlocked });
        return;
      }
      if (!canWrite(`block_${targetId}`, 1000)) {
        console.warn('[Block Action Throttled]', { targetId });
        return;
      }
      
      const profileRef = doc(db, 'profiles', profile.id);
      await updateDoc(profileRef, {
        'social.blocked': isCurrentlyBlocked ? arrayRemove(targetId) : arrayUnion(targetId)
      });
      console.log('[Block Action Successful]', { targetId, isBlocked: !isCurrentlyBlocked });
    } catch (e) {
      console.error('[Block Action Failed]', e);
      // Revert state on failure
      setProfile((prev: any) => ({
        ...prev,
        social: {
          ...prev?.social,
          blocked: profile.social?.blocked || []
        }
      }));
      addToast({
        title: "Block Operation Failed",
        message: `Failed to ${isCurrentlyBlocked ? 'unblock' : 'block'} user. Please check your connection.`,
        type: "warning"
      });
      handleFirestoreError(e, OperationType.UPDATE, `profiles/${profile.id}`);
    }
  };

  const toggleRestrictUser = async (targetId: string) => {
    if (!profile) return;
    const isCurrentlyRestricted = (profile.social?.restricted || []).includes(targetId);
    console.log('[Restrict Action Initiated]', { 
      targetId, 
      currentRestrictedList: profile.social?.restricted || [], 
      action: isCurrentlyRestricted ? 'Unrestrict' : 'Restrict' 
    });
    try {
      const updatedRestricted = isCurrentlyRestricted
        ? (profile.social?.restricted || []).filter((id: string) => id !== targetId)
        : [...(profile.social?.restricted || []), targetId];

      setProfile((prev: any) => ({
        ...prev,
        social: {
          ...prev?.social,
          restricted: updatedRestricted
        }
      }));

      if (!db || isSafeMode) {
        console.log('[Restrict Action Sandbox Bypass / No DB]', { targetId, isRestricted: !isCurrentlyRestricted });
        return;
      }
      if (!canWrite(`restrict_${targetId}`, 1000)) {
        console.warn('[Restrict Action Throttled]', { targetId });
        return;
      }

      const profileRef = doc(db, 'profiles', profile.id);
      await updateDoc(profileRef, {
        'social.restricted': isCurrentlyRestricted ? arrayRemove(targetId) : arrayUnion(targetId)
      });
      console.log('[Restrict Action Successful]', { targetId, isRestricted: !isCurrentlyRestricted });
    } catch (e) {
      console.error('[Restrict Action Failed]', e);
      // Revert state on failure
      setProfile((prev: any) => ({
        ...prev,
        social: {
          ...prev?.social,
          restricted: profile.social?.restricted || []
        }
      }));
      addToast({
        title: "Restriction Operation Failed",
        message: `Failed to ${isCurrentlyRestricted ? 'unrestrict' : 'restrict'} user. Please check your connection.`,
        type: "warning"
      });
      handleFirestoreError(e, OperationType.UPDATE, `profiles/${profile.id}`);
    }
  };

  const isBlocked = (targetUid: string) => profile?.social?.blocked?.includes(targetUid) || false;
  const isRestricted = (targetUid: string) => profile?.social?.restricted?.includes(targetUid) || false;

  const deleteConversation = async (conversationId: string) => {
    console.log('[Delete For Me - Conversation Initiated]', { conversationId });
    if (!db || !profile) return;
    if (isSafeMode) {
      console.log('[Delete For Me - Conversation Sandbox Bypass / No DB]', { conversationId });
      return;
    }
    if (!canWrite(`deleteConv_${conversationId}`, 2000)) {
      console.warn('[Delete For Me - Conversation Throttled]', { conversationId });
      return;
    }
    try {
      const convRef = doc(db, 'conversations', conversationId);
      // We don't actually delete the whole conversation for everyone
      // We just hide it for the current profile
      await updateDoc(convRef, {
        [`deletedFor.${profile.id}`]: Date.now(),
        [`unreadCount.${profile.id}`]: 0
      });
      console.log('[Delete For Me - Conversation Successful]', { conversationId });
    } catch (e) {
      console.error('[Delete For Me - Conversation Failed]', e);
      handleFirestoreError(e, OperationType.UPDATE, `conversations/${conversationId}`);
    }
  };

  const toggleCloseFriend = async (targetId: string) => {
    if (!profile) return;
    try {
      const currentList = Array.from(new Set([
        ...(profile.social?.closeFriends || []),
        ...(profile.closeFriends || [])
      ]));
      const isCurrentlyClose = currentList.includes(targetId);
      const updatedClose = isCurrentlyClose
        ? currentList.filter((id: string) => id !== targetId)
        : [...currentList, targetId];

      setProfile((prev: any) => ({
        ...prev,
        closeFriends: updatedClose,
        social: {
          ...prev?.social,
          closeFriends: updatedClose
        }
      }));

      if (!db || isSafeMode) return;

      await updateDoc(doc(db, 'profiles', profile.id), {
        closeFriends: updatedClose,
        'social.closeFriends': updatedClose
      });
    } catch (e) {
      console.warn("Toggle close friend failed", e);
    }
  };

  const isCloseFriend = (targetUid: string) => {
    if (!profile) return false;
    const list = Array.from(new Set([
      ...(profile.social?.closeFriends || []),
      ...(profile.closeFriends || [])
    ]));
    return list.includes(targetUid);
  };

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    // Handle Redirect Result with detailed diagnostics logging
    const handleRedirect = async () => {
      console.log("[Diagnostics - Auth] handleRedirect: Checking for pending redirect auth callback event...");
      
      const isIframe = window.self !== window.top;
      console.log("[Diagnostics - Auth] Environment Check - Iframe:", isIframe, "Domain:", window.location.hostname);
      
      setIsConnecting(true);
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('aeirmist_auth_in_progress', 'true');
        } catch (e) {
          console.warn("sessionStorage setItem blocked:", e);
        }
      }

      const redirectTimeout = setTimeout(() => {
        setIsConnecting(false);
        try {
          sessionStorage.removeItem('aeirmist_auth_in_progress');
        } catch (e) {}
      }, 5000);

      try {
        const result = await getRedirectResult(auth);
        clearTimeout(redirectTimeout);
        
        if (result?.user) {
          console.log("[Diagnostics - Auth] handleRedirect: Redirect sign-in success UID:", result.user.uid);
          let isLinking = false;
          try {
            isLinking = sessionStorage.getItem('aeirmist_pending_link') === 'true';
            sessionStorage.removeItem('aeirmist_pending_link');
          } catch (e) {
            console.warn("sessionStorage pending_link access blocked:", e);
          }

          if (isLinking && auth.currentUser) {
             try {
               await linkWithCredential(auth.currentUser, (result as any).credential);
               addToast({ title: "Link Successful", message: "Account synced via redirect.", type: "success" });
             } catch (linkErr: any) {
               console.error("Link redirect error", linkErr);
             }
          }
          setUser(result.user);
        } else {
          console.log("[Diagnostics - Auth] No pending redirect event detected.");
          try {
            sessionStorage.removeItem('aeirmist_pending_link');
          } catch (e) {}
        }
      } catch (err: any) {
        clearTimeout(redirectTimeout);
        console.error('[Diagnostics - Auth] Redirect failed:', {
          code: err?.code,
          message: err?.message,
          customData: err?.customData
        });
        setConnectionError(`Firebase redirect failed: ${err?.code || 'unknown'}`);
      } finally {
        setIsConnecting(false);
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.removeItem('aeirmist_auth_in_progress');
          } catch (e) {}
        }
      }
    };
    handleRedirect();

    const unsub = onAuthStateChanged(auth, async (user) => {
      console.log("[Diagnostics - Auth] onAuthStateChanged Message:", user?.uid);
      
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }
      
      if (user) {
        // Requirement: Reload user and refresh Firestore document immediately after login
        try {
          await user.reload();
          console.log("[Diagnostics - Auth] User reloaded successfully. Email:", user.email, "Verified:", user.emailVerified);
        } catch (e) {
          console.warn("[Diagnostics - Auth] User reload failed during initial detect:", e);
        }
        
        setUser(auth.currentUser); // Use fresh instance after reload
        setLoading(true);
        console.log("[Diagnostics - Auth] Loading Profile...");
        
        const q = query(collection(db, 'profiles'), where('ownerUid', '==', user.uid));
        
        try {
          // Speed entry: High priority one-shot (Get fresh from server)
          const initialSnap = await getDocs(q);
          if (!initialSnap.empty) {
            const profiles = initialSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
            setAllProfiles(profiles);
            const active = profiles.find(p => p.isActive) || profiles[0];
            setProfile(active);
            setActiveProfileId(active.id);
            setIsScheduledForPurge(active?.scheduledForPurge === true);
            setNeedsUsername(false);
            setLoading(false);
          } else {
            console.log("[Diagnostics - Auth] Initial sync empty. Prompting username selection...");
            setNeedsUsername(true);
            setLoading(false);
          }
        } catch (e) {
          console.warn("[Diagnostics - Auth] Initial hydration error:", e);
          setLoading(false);
          setNeedsUsername(true);
        }

        unsubProfile = onSnapshot(q, async (snap) => {
          console.log("[Diagnostics - Auth] Snapshot Message:", snap.size);
          const profiles = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          setAllProfiles(profiles);
          
          if (!snap.empty) {
            const active = profiles.find(p => p.isActive) || profiles[0];
            setProfile(active);
            setActiveProfileId(active.id);
            setNeedsUsername(false);
            setLoading(false);
          } else {
            console.log("[Diagnostics - Auth] Snapshot returned empty state. Prompting username selection...");
            setNeedsUsername(true);
            setLoading(false);
          }
        }, (err) => {
          console.error("[Diagnostics - Auth] Snapshot transmission interrupted.", err);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setAllProfiles([]);
        setIsScheduledForPurge(false);
        setNeedsUsername(false);
        setLoading(false);
      }
    });

    return () => {
      unsub();
      if (unsubProfile) unsubProfile();
    };
  }, [auth, db]);

  // Handle Online/Offline Status automatically when profile changes
  useEffect(() => {
    if (profile?.id && !isSafeMode) {
       goOnline();
       
       // Set up visibility change listener
       const handleVisibilityChange = () => {
         if (document.visibilityState === 'visible') {
           goOnline();
         } else {
           // Small delay to see if they come back quickly
           setTimeout(() => {
             if (document.visibilityState !== 'visible') {
               goOffline();
             }
           }, 5000);
         }
       };

       // Handle tab close / browser close
       const handleBeforeUnload = () => {
         // Attempt one last update
         // We use firestore directly to avoid possible React state issues during shutdown
         const profileRef = doc(db, 'profiles', profile.id);
         updateDoc(profileRef, {
           status: 'offline',
           lastSeen: serverTimestamp()
         });
       };
       
       // Keep alive interval
       const interval = setInterval(() => {
         if (document.visibilityState === 'visible') {
           const profileRef = doc(db, 'profiles', profile.id);
           updateDoc(profileRef, {
             status: 'online',
             lastSeen: serverTimestamp()
           }).catch(() => {});
         }
       }, 60000);

       document.addEventListener('visibilitychange', handleVisibilityChange);
       window.addEventListener('beforeunload', handleBeforeUnload);

       return () => {
         document.removeEventListener('visibilitychange', handleVisibilityChange);
         window.removeEventListener('beforeunload', handleBeforeUnload);
         clearInterval(interval);
       };
    }
  }, [profile?.id, isSafeMode]);

  // Track and save logged in account details in localStorage
  useEffect(() => {
    if (user && profile) {
      try {
        const savedRaw = localStorage.getItem('aeirmist_saved_accounts');
        let savedList = savedRaw ? JSON.parse(savedRaw) : [];
        if (!Array.isArray(savedList)) savedList = [];

        const currentAccount = {
          uid: user.uid,
          username: profile.username || '',
          displayName: profile.displayName || user.displayName || 'Anonymous',
          photoURL: profile.photoURL || user.photoURL || '',
          lastLoginAt: Date.now()
        };

        const filteredList = savedList.filter((acc: any) => acc.uid !== user.uid);
        const updatedList = [currentAccount, ...filteredList];
        const cappedList = updatedList.slice(0, 5);

        localStorage.setItem('aeirmist_saved_accounts', JSON.stringify(cappedList));
      } catch (e) {
        console.warn("Failed to update saved accounts in localStorage:", e);
      }
    }
  }, [user, profile]);

  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const onlineUsersMap = useRef<Map<string, number>>(new Map());

  // Listen for Unread Messages
  useEffect(() => {
    if (!db || !profile) return;

    const q = query(
      collection(db, 'conversations'),
      where('profileIds', 'array-contains', profile.id)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      let total = 0;
      snap.docs.forEach(doc => {
        const data = doc.data();
        // Skip requests in main count
        if (data.status === 'request') return;
        
        // Skip deleted chats
        const deletedAt = data.deletedFor?.[profile.id];
        const chatUpdatedAt = data.updatedAt?.toMillis?.() || Date.now();
        if (deletedAt === true) return;
        if (typeof deletedAt === 'number' && chatUpdatedAt <= deletedAt) return;
        
        const count = data.unreadCount?.[profile.id] || 0;
        total += count;
      });
      setUnreadMessagesCount(total);
    }, (error) => console.warn("Messages unread count sync failed", error));

    return () => unsubscribe();
  }, [db, profile?.id]);

  // Listen for Unread Notifications
  useEffect(() => {
    if (!db || !profile) return;

    const targetIds = Array.from(new Set([profile.id, user?.uid].filter(Boolean)));
    if (targetIds.length === 0) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', targetIds),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      // If count increased, play sound and show toast (or system/browser notification) for the new ones
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          // Avoid triggering on initial load of historical unread notifications
          const createdAt = data.createdAt?.toMillis() || Date.now();
          if (Date.now() - createdAt < 15000) {
            // Internal Toast Notification for all types
            addToast({
              title: data.type ? String(data.type).toUpperCase().replace('_', ' ') : 'Notification',
              message: data.message,
              type: 'info'
            });

            const type = String(data.type).toLowerCase();
            const isMessage = ['message', 'message_media', 'message_voice', 'message_video', 'store_message'].includes(type) || type.includes('msg') || type === 'store_message_received' || type.includes('call');

            if (isMessage) {
              // Standard native desktop/browser/device Notification API
              if (typeof window !== 'undefined' && 'Notification' in window) {
                const title = data.fromUser?.displayName ? `@${data.fromUser.displayName}` : 'New Aeirmist Message';
                const iconSeed = data.fromUser?.displayName || 'Aeirmist';
                const avatar = data.fromUser?.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(iconSeed)}`;
                
                if (Notification.permission === 'granted') {
                  try {
                    new Notification(title, {
                      body: data.message,
                      icon: avatar
                    });
                  } catch (e) {
                    console.warn("Direct native notification failed:", e);
                  }
                } else if (Notification.permission !== 'denied') {
                  Notification.requestPermission().then(perm => {
                    if (perm === 'granted') {
                      try {
                        new Notification(title, {
                          body: data.message,
                          icon: avatar
                        });
                      } catch (err) {
                        console.warn("Direct native notification failed after permission request:", err);
                      }
                    }
                  });
                }
              }
            } else {
              playNotificationSound();
              addToast({
                title: 'Alert',
                message: data.message,
                type: 'info'
              });
            }
          }
        }
      });

      // Filter messages out of the activity unread notifications count (they already have unreadMessagesCount)
      let nonMessageUnreadCount = 0;
      snap.docs.forEach(doc => {
        const d = doc.data();
        const type = String(d.type).toLowerCase();
        const isMessage = ['message', 'message_media', 'message_voice', 'message_video', 'store_message'].includes(type) || type.includes('msg') || type === 'store_message_received' || type.includes('call');
        if (!isMessage) {
          nonMessageUnreadCount++;
        }
      });

      setUnreadNotificationsCount(nonMessageUnreadCount);
    }, (error) => console.warn("Notifications unread count sync failed", error));

    return () => unsubscribe();
  }, [db, profile?.id]);

  // Listen for Message Requests (Sound & Toast)
  useEffect(() => {
    if (!db || !profile) return;

    const q = query(
      collection(db, 'conversations'),
      where('profileIds', 'array-contains', profile.id)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data.status !== 'request') return;
          // Only notify if we are NOT the sender
          if (data.lastMessage?.senderId !== profile.id) {
            const senderId = data.lastMessage?.senderId;
            const blocked = senderId ? (profile.social?.blocked || []).includes(senderId) : false;
            const restricted = senderId ? (profile.social?.restricted || []).includes(senderId) : false;

            if (!blocked && !restricted) {
              const createdAt = data.createdAt?.toMillis() || Date.now();
              // 20 second window to avoid history trigger
              if (Date.now() - createdAt < 20000) {
                playNotificationSound();
                const senderDetails = data.participantDetails?.[senderId];
                addToast({
                  title: 'Request Received',
                  message: `${senderDetails?.displayName || 'Someone'} sent a message request`,
                  type: 'info'
                });
              }
            }
          }
        }
      });
    }, (error) => console.warn("Requests sync failed", error));

    return () => unsubscribe();
  }, [db, profile?.id]);

  // Clean up any hardcoded/fallback/demo profiles from Firestore on initialization
  useEffect(() => {
    if (!db || !user || isSafeMode) return;
    
    const cleanUpDemoData = async () => {
      try {
        const demoIds = [
          'profile_luna_ahmed',
          'profile_zara_pulse',
          'profile_nexus_creator',
          'profile_quantum_shop',
          'profile_nova_stores',
          'profile_sakiba',
          'profile_kaisol'
        ];
        
        console.log("[AeirmistContext] Audit initiated: Purging residual hardcoded demo profiles from database...");
        const batch = writeBatch(db);
        
        for (const id of demoIds) {
          batch.delete(doc(db, 'profiles', id));
          const username = id.replace('profile_', '').toLowerCase();
          batch.delete(doc(db, 'usernames', username));
        }
        
        await batch.commit();
        console.log("[AeirmistContext] Audit complete: Any residual hardcoded demo profiles successfully purged.");
      } catch (err) {
        console.warn("[AeirmistContext] Purging residual demo profiles encountered errors:", err);
      }
    };
    
    const t = setTimeout(() => {
      cleanUpDemoData();
    }, 1500);
    return () => clearTimeout(t);
  }, [db, user]);

  useEffect(() => {
    if (!db || !user || !profile) return;
    
    // OPTIMIZATION: Only listen to online status of profiles the user follows
    // This dramatically reduces the number of documents watched and snapshot triggers
    const following = profile.social?.following || [];
    if (following.length === 0) {
      setOnlineUsers(new Set());
      return;
    }

    // Firestore 'in' query supports up to 30 items
    const chunks = [];
    for (let i = 0; i < following.length; i += 30) {
      chunks.push(following.slice(i, i + 30));
    }

    const unsubs = chunks.map(chunk => {
      const q = query(
        collection(db, 'profiles'), 
        where('id', 'in', chunk),
        where('status', '==', 'online')
      );
      return onSnapshot(q, (snap) => {
        chunk.forEach(id => onlineUsersMap.current.delete(id));
        snap.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (data.status === 'offline') {
             onlineUsersMap.current.delete(docSnap.id);
          } else {
             const lastSeen = data.lastSeen?.toMillis ? data.lastSeen.toMillis() : Date.now();
             onlineUsersMap.current.set(docSnap.id, lastSeen);
          }
        });
        
        const now = Date.now();
        const active = new Set<string>();
        onlineUsersMap.current.forEach((lastSeen, id) => {
          if (now - lastSeen < 120000) { // 2 minutes
            active.add(id);
          }
        });
        setOnlineUsers(active);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'online_profiles'));
    });

    const cleanupInterval = setInterval(() => {
      let changed = false;
      const now = Date.now();
      const active = new Set<string>();
      onlineUsersMap.current.forEach((lastSeen, id) => {
        if (now - lastSeen < 120000) {
          active.add(id);
        } else {
          changed = true;
        }
      });
      if (changed) {
        setOnlineUsers(active);
      }
    }, 30000);

    return () => {
      unsubs.forEach(unsub => unsub());
      clearInterval(cleanupInterval);
    };
  }, [db, user?.uid, profile?.id, JSON.stringify(profile?.social?.following || [])]);
  const lastPresenceUpdate = useRef<number>(0);
  const lastPresenceStatus = useRef<string>('');

  const goOnline = async () => {
    if (!db || !profile || !user || isSafeMode) return;
    
    const wantsOnline = profile.messagingSettings?.onlineStatus !== false;
    const status = wantsOnline ? 'online' : 'offline';

    // Optimization: Don't write if already in desired state
    if (lastPresenceStatus.current === status) return;

    // Minimal throttle to prevent spamming but allow accurate updates (e.g. 1 minute)
    if (!canWrite('presence', 60000)) return; 
    
    try {
      lastPresenceStatus.current = status;
      await updateDoc(doc(db, 'profiles', profile.id), {
        status: status,
        lastSeen: serverTimestamp()
      });
    } catch (e) {
      console.warn("Presence status update failed", e);
      lastPresenceStatus.current = '';
    }
  };

  const goOffline = async () => {
    if (!db || !profile || !user || isSafeMode) return;
    
    // Always allow going offline on logout/close
    try {
      lastPresenceStatus.current = 'offline';
      await updateDoc(doc(db, 'profiles', profile.id), {
        status: 'offline',
        lastSeen: serverTimestamp()
      });
    } catch (e) {
      console.warn("Offline status update failed", e);
    }
  };

  const notifiedCalls = useRef<Set<string>>(new Set());

  const activeCallRef = useRef<any>(null);
  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  // Call Signaling Listener
  useEffect(() => {
    if (!db || !profile) return;
    
    // 1. Listen for calls in conversations (Strict limit)
    const convQ = query(
      collection(db, 'conversations'), 
      where('participants', 'array-contains', user?.uid),
      limit(5)
    );

    const unsubConv = onSnapshot(convQ, () => {}, (err) => console.warn("Calls conv sync delayed", err));
    
    // 2. Listen for calls (Both Incoming & Outgoing)
    const callsQ = query(
      collection(db, 'calls'),
      where('participants', 'array-contains', user?.uid),
      limit(5)
    );

    const unsubCalls = onSnapshot(callsQ, (snap) => {
      const activeDocs = snap.docs.filter(d => ['calling', 'ongoing', 'reconnecting', 'accepted'].includes(d.data().status));
      if (activeDocs.length > 0) {
        const callDoc = activeDocs[0].data();
        const callId = activeDocs[0].id;

        // BUSY CHECK: If already in a call (different ID), mark new incoming as busy
        if (activeCallRef.current && activeCallRef.current.id !== callId && callDoc.status === 'calling' && (callDoc.receiverUid === user?.uid || callDoc.receiverId === profile?.id)) {
           aeirmistCall.updateStatus(db, callId, 'busy');
           return;
        }

        // TIMEOUT CHECK for calling status
        if (callDoc.status === 'calling' && callDoc.createdAt) {
           const createdAt = callDoc.createdAt.toMillis ? callDoc.createdAt.toMillis() : callDoc.createdAt;
           const now = Date.now();
           if (now - createdAt > 45000) { // 45 seconds timeout
             aeirmistCall.updateStatus(db, callId, 'missed');
             
             // Initiator logs the missed call message to the chat
             if (callDoc.callerUid === user?.uid && callDoc.conversationId) {
               sendMessage(callDoc.conversationId, `Missed ${callDoc.type} call`, 'system', undefined, { 
                 type: 'missed_call',
                 callType: callDoc.type,
                 callId: callId
               }).catch(e => console.error("Failed to log missed call message", e));
             }
             return;
           }
        }

        // Show background notification if app is hidden and it's an incoming call
        if (document.hidden && Notification.permission === 'granted' && callDoc.status === 'calling' && (callDoc.receiverUid === user?.uid || callDoc.receiverId === profile?.id) && !notifiedCalls.current.has(callId)) {
           notifiedCalls.current.add(callId);
           const notification = new Notification(`Incoming ${callDoc.type} call`, {
            body: `from ${callDoc.callerName || 'Aeirmist User'}`,
            icon: callDoc.callerPhoto || '/icon-192x192.png',
            tag: callId,
            requireInteraction: true
          });
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        }

        // Only set active call if we are a participant and it's for us
        const isTarget = callDoc.receiverUid === user?.uid || callDoc.receiverId === profile?.id || callDoc.callerUid === user?.uid || callDoc.callerId === profile?.id;
        
        if (isTarget) {
          setActiveCall((prev: any) => {
             // Only update if it's different to prevent unnecessary renders and flashing
             // We use a deep compare for critical fields
             if (prev && 
                 prev.id === callId && 
                 prev.status === callDoc.status && 
                 prev.type === callDoc.type &&
                 prev.initiatorId === callDoc.initiatorId) {
               return prev;
             }
             return {
               ...callDoc,
               id: callId
             };
          });
        }
      } else {
        setActiveCall(null);
      }
    });

    return () => {
      unsubConv();
      unsubCalls();
    };
  }, [db, profile, user?.uid]);


   const login = async () => {
    await loginWithProvider('google');
  };

  const loginWithProvider = async (providerName: 'google' | 'apple' | 'facebook' | 'yahoo') => {
    // Only Google is natively supported in AI Studio by default unless manually enabled
    const supportedProviders = ['google']; 
    if (!supportedProviders.includes(providerName)) {
      throw new Error(`Access Restricted: ${providerName.charAt(0).toUpperCase() + providerName.slice(1)} login is not configured in this environment.`);
    }

    let provider: any;
    if (providerName === 'google') {
      const google = new GoogleAuthProvider();
      google.addScope('profile');
      google.addScope('email');
      google.setCustomParameters({
        prompt: 'select_account'
      });
      provider = google;
    }

    if (!provider) {
      throw new Error(`Provider ${providerName} is not configured.`);
    }

    console.log(`[Diagnostics - Auth] loginWithProvider: Configuring auth with provider: ${providerName}`);
    setIsConnecting(true);
    await setPersistence(auth, browserLocalPersistence);

    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('aeirmist_auth_in_progress', 'true');
      }

      console.log(`[Diagnostics - Auth] loginWithProvider: Attempting signInWithPopup for ${providerName}...`);
      const result = await signInWithPopup(auth, provider);
      console.log(`[Diagnostics - Auth] loginWithProvider successfully completed! User UID:`, result.user.uid, "Email:", result.user.email);
      
      // Update activity log
      try {
        const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await setDoc(doc(db, 'activity_logs', logId), {
          id: logId,
          profileId: `profile_${result.user.uid}`,
          userId: result.user.uid,
          action: 'login',
          device: 'Browser Session',
          details: `Authenticated via flat social login of type: ${providerName}`,
          timestamp: serverTimestamp()
        });
      } catch (logErr) {
        console.warn("Could not log social auth:", logErr);
      }

      // Check if we have a pending credentials merge
      if (pendingLinkCredential) {
        try {
          await linkWithCredential(result.user, pendingLinkCredential);
          console.log("[Account Linking Success] Linked credential successfully!");
          addToast({ title: "Accounts Merged", message: `Successfully linked your ${providerName} login with matching email lock.`, type: "success" });
          setPendingLinkCredential(null);
          setPendingLinkEmail(null);
        } catch (linkErr) {
          console.error("Failed to link credential on login completion:", linkErr);
        }
      }
      setIsConnecting(false);
      return result;
    } catch (err: any) {
      console.error(`[Diagnostics - Auth] loginWithProvider: Popup failed. Code: ${err.code}. Checking for redirect fallback...`);
      
      const shouldRedirect =
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/cancelled-popup-request' ||
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/unauthorized-domain' ||
        err.code === 'auth/network-request-failed' ||
        err.code === 'auth/internal-error';

      if (shouldRedirect) {
        console.warn("[Diagnostics - Auth] Popup interface blocked or closed. Cascading to redirect flow...");
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr: any) {
          console.error("[Diagnostics - Auth] Redirect follow-up failed:", redirectErr);
          setIsConnecting(false);
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('aeirmist_auth_in_progress');
          }
          throw handleAuthError(redirectErr, 'loginWithProvider');
        }
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        const pendingCred = err.credential;
        const collisionEmail = err.customData?.email;
        console.log("[Collision Detected] Storing pending credentials for linking:", { collisionEmail });
        setPendingLinkCredential(pendingCred);
        setPendingLinkEmail(collisionEmail);
        addToast({ 
          title: "Account Collision Found", 
          message: `An account with ${collisionEmail} already exists. Please login using your existing method (or password) first to instantly link them.`, 
          type: "info" 
        });
        setIsConnecting(false);
        throw handleAuthError(err, 'loginWithProvider', true);
      } else {
        setIsConnecting(false);
        throw handleAuthError(err, 'loginWithProvider');
      }
    }
  };
  const handleAuthError = (err: any, method: string, silentPopup: boolean = false) => {
    const errorCode = err?.code || 'unknown';
    const errorMessage = err?.message || 'Verification failed.';
    console.error(`[Diagnostics - Auth] ${method} failed:`, { code: errorCode, message: errorMessage });
    
    // Store error for debugging tools
    setLastAuthError({
      code: errorCode,
      message: errorMessage,
      timestamp: Date.now(),
      stack: err?.stack || ''
    });

    if (errorCode === 'auth/operation-not-allowed') {
      return new Error(`Authentication Denied: This login method is not yet enabled in the Aeirmist Registry. Please use Google or Email instead.`);
    }

    if (errorCode === 'auth/popup-blocked' || errorCode === 'auth/popup-closed-by-user' || errorCode === 'auth/cancelled-popup-request') {
       if (silentPopup) return err;
       return new Error("Connecting via secure channel... Please wait.");
    }

    if (errorCode === 'auth/network-request-failed') {
      return new Error("Connection Lag: Connection timed out. Check your network connection.");
    }

    if (errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
      return new Error("Incorrect password. Please verify your credentials and try again.");
    }

    if (errorCode === 'auth/user-not-found') {
      return new Error("No account found with this email, username, or phone number.");
    }

    if (errorCode === 'auth/too-many-requests') {
      return new Error("Too many failed login attempts. Please wait a moment and try again.");
    }

    if (errorCode === 'auth/account-exists-with-different-credential') {
      return new Error("This account was created with Google Sign-In. Please sign in with Google or create a password in Settings.");
    }

    return err instanceof Error ? err : new Error(errorMessage);
  };

  const loginWithEmail = async (identifier: string, pass: string, remember: boolean = true) => {
    let email = identifier.trim();
    console.log("[Diagnostics - Auth] loginWithEmail: Started routine with identifier:", identifier, "remember persistence:", remember);
    
    if (!auth) {
      throw new Error("Authentication service is unavailable.");
    }

    // Resolve username or phone number to email if identifier lacks '@'
    if (!email.includes('@')) {
      const cleanId = email.startsWith('@') ? email.slice(1).trim().toLowerCase() : email.trim().toLowerCase();
      console.log("[Diagnostics - Auth] loginWithEmail: Target identifier lacks '@', performing Firestore lookup for:", cleanId);
      
      let resolvedEmail: string | null = null;

      try {
        // A. Primary Lookup in 'usernames' collection
        if (db) {
          const usernameDocRef = doc(db, 'usernames', cleanId);
          const snap = await getDoc(usernameDocRef);
          if (snap.exists()) {
            const uData = snap.data();
            if (uData.email) {
              resolvedEmail = uData.email;
              console.log("[Diagnostics - Auth] Resolved via usernames collection:", resolvedEmail);
            } else if (uData.ownerUid) {
              const uDoc = await getDoc(doc(db, 'users', uData.ownerUid));
              if (uDoc.exists() && uDoc.data().email) {
                resolvedEmail = uDoc.data().email;
                console.log("[Diagnostics - Auth] Resolved via usernames->users doc:", resolvedEmail);
              }
            }
          }
        }

        // B. Secondary Lookup in 'profiles' collection by username, phone, or personalEmail
        if (!resolvedEmail && db) {
          // Check username match
          const qUsername = query(collection(db, 'profiles'), where('username', '==', cleanId), limit(1));
          const pSnap1 = await getDocs(qUsername);
          
          let profileDocData: any = null;
          if (!pSnap1.empty) {
            profileDocData = pSnap1.docs[0].data();
          } else {
            // Check phoneNumber or phone or recoveryPhone
            const qPhone1 = query(collection(db, 'profiles'), where('phoneNumber', '==', email), limit(1));
            const pSnap2 = await getDocs(qPhone1);
            if (!pSnap2.empty) {
              profileDocData = pSnap2.docs[0].data();
            } else {
              const qPhone2 = query(collection(db, 'profiles'), where('phone', '==', email), limit(1));
              const pSnap3 = await getDocs(qPhone2);
              if (!pSnap3.empty) {
                profileDocData = pSnap3.docs[0].data();
              }
            }
          }

          if (profileDocData) {
            if (profileDocData.personalEmail) {
              resolvedEmail = profileDocData.personalEmail;
            } else if (profileDocData.ownerUid) {
              const uDoc = await getDoc(doc(db, 'users', profileDocData.ownerUid));
              if (uDoc.exists() && uDoc.data().email) {
                resolvedEmail = uDoc.data().email;
              }
            }
          }
        }
      } catch (lookupErr) {
        console.warn("[Diagnostics - Auth] Identifier resolution query warning:", lookupErr);
      }

      if (resolvedEmail) {
        email = resolvedEmail;
      } else {
        console.warn("[Diagnostics - Auth] Could not resolve identifier to an email:", email);
        throw new Error("No account found matching this username, email, or phone number.");
      }
    }

    const persistenceMode = remember ? browserLocalPersistence : browserSessionPersistence;
    console.log("[Diagnostics - Auth] loginWithEmail: Applying Firebase auth persistence mode:", persistenceMode);
    try {
      await setPersistence(auth, persistenceMode);
    } catch (pErr) {
      console.warn("[Diagnostics - Auth] Persistence configuration warning:", pErr);
    }
    
    console.log("[Diagnostics - Auth] loginWithEmail: Executing signInWithEmailAndPassword for:", email);
    try {
      const credentials = await signInWithEmailAndPassword(auth, email, pass);
      console.log("[Diagnostics - Auth] loginWithEmail: Successfully authenticated via Email/Password! User UID:", credentials.user.uid);
      
      if (credentials.user) {
        try {
          await trackUserSession(credentials.user, 'Email & Password');
        } catch (sErr) {
          console.warn("Could not track login session:", sErr);
        }
      }

      try {
        await logActivity('login', 'User logged in via email and password.');
      } catch (logErr) {
        console.warn("Could not log email login:", logErr);
      }

      return credentials;
    } catch (err: any) {
      // Secondary fallback if personalEmail is used but primary Auth email differs
      if ((err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') && db && identifier.includes('@')) {
        try {
          const qPersonal = query(collection(db, 'profiles'), where('personalEmail', '==', identifier.trim().toLowerCase()), limit(1));
          const pSnap = await getDocs(qPersonal);
          if (!pSnap.empty) {
            const pData = pSnap.docs[0].data();
            if (pData.ownerUid) {
              const uDoc = await getDoc(doc(db, 'users', pData.ownerUid));
              if (uDoc.exists() && uDoc.data().email && uDoc.data().email !== identifier) {
                const altEmail = uDoc.data().email;
                console.log("[Diagnostics - Auth] Retrying sign-in with primary user email:", altEmail);
                const credentials = await signInWithEmailAndPassword(auth, altEmail, pass);
                if (credentials.user) {
                  try {
                    await trackUserSession(credentials.user, 'Email & Password');
                  } catch (sErr) {}
                }
                return credentials;
              }
            }
          }
        } catch (fallbackErr) {
          console.warn("[Diagnostics - Auth] Secondary personalEmail resolution failed:", fallbackErr);
        }
      }

      throw handleAuthError(err, 'loginWithEmail');
    }
  };

  const loginAsGuestSandbox = async () => {
    setLoading(true);
    // Use a unique guest email per session to avoid profile collisions in the shared sandbox
    const sessionGuestId = Math.random().toString(36).substring(2, 10);
    const guestEmail = `guest_${sessionGuestId}@aeirmist.social`;
    const guestPass = "AeirmistGuest123!";
    
    try {
      await setPersistence(auth, browserLocalPersistence);
      
      // Try to create a NEW guest for this specific session
      const userCredential = await createUserWithEmailAndPassword(auth, guestEmail, guestPass);
      const newUser = userCredential.user;
      
      // Seed base user ref
      const userRef = doc(db, 'users', newUser.uid);
      await setDoc(userRef, {
        uid: newUser.uid,
        username: `guest_${sessionGuestId}`,
        email: guestEmail,
        displayName: `Guest Account ${sessionGuestId}`,
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sessionGuestId}`,
        createdAt: serverTimestamp(),
        provider: 'email'
      }, { merge: true });

      const profileId = `profile_${newUser.uid}`;
      const profileData = {
        id: profileId,
        uid: newUser.uid,
        ownerUid: newUser.uid,
        username: `guest_${sessionGuestId}`,
        displayName: `Guest Account ${sessionGuestId}`,
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sessionGuestId}`,
        bio: "Ephemeral Guest Account initialized.",
        tagline: "Temporary State",
        followersCount: 0,
        followingCount: 0,
        aeirmistLevel: 50,
        createdAt: serverTimestamp(),
        isActive: true,
        socialLinks: { instagram: '', twitter: '', github: '', discord: '', website: '', youtube: '', tiktok: '', facebook: '' },
        privacySettings: { privateProfile: false, showActivity: true, allowMessages: 'everyone', hideFollowers: false },
        themeSettings: { accentColor: '#00f2ff', glowIntensity: 0.8, noiseEffect: true }
      };

      await setDoc(doc(db, 'profiles', profileId), profileData);
      
      // Update state locally for instant entry
      setUser(newUser as any);
      setProfile(profileData);
      setNeedsUsername(false);
      setLoading(false);
    } catch (firebaseErr: any) {
      console.warn("Firebase Auth guest login failed, entering Local Sandbox Mode: ", firebaseErr.code);
      
      // Fallback to purely local state user & profile bypass so they can ALWAYS log in!
      const mockUid = `local_${Date.now()}`;
      const mockUser = {
        uid: mockUid,
        email: "sandbox@aeirmist.local",
        displayName: "Sandbox Account",
        photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=sandbox",
        providerData: [{ providerId: 'local' }]
      };
      
      const mockProfile = {
        id: `profile_${mockUid}`,
        uid: mockUid,
        ownerUid: mockUid,
        username: "sandbox_account",
        displayName: "Sandbox Guest",
        photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=sandbox",
        bio: "Local Sandbox Account. Exploring Aeirmist safely without backend restrictions.",
        tagline: "Local Sandbox Mode Active",
        followersCount: 0,
        followingCount: 0,
        aeirmistLevel: 100,
        createdAt: new Date(),
        isActive: true,
        socialLinks: { instagram: '', twitter: '', github: '', discord: '', website: '', youtube: '', tiktok: '', facebook: '' },
        privacySettings: { privateProfile: false, showActivity: true, allowMessages: 'everyone', hideFollowers: false },
        themeSettings: { accentColor: '#00f2ff', glowIntensity: 0.8, noiseEffect: true }
      };
      
      setUser(mockUser as any);
      setProfile(mockProfile as any);
      setAllProfiles([mockProfile]);
      setActiveProfileId(mockProfile.id);
      setNeedsUsername(false);
      setIsSafeMode(true);
      setLoading(false);
    }
  };

  const signupWithEmail = async (email: string, pass: string) => {
    return await createUserWithEmailAndPassword(auth, email, pass);
  };

  const completeSignup = async (email: string, pass: string, username: string, fullName: string, avatarFile: File | null, presetPhotoURL?: string | null) => {
    if (!auth || !db) throw new Error("Connection failed: Aeirmist Logic not initialized.");
    
    // Check if username is already taken first
    const usernameResult = await checkUsernameAvailable(username);
    if (!usernameResult.available) {
      throw new Error("Username already taken");
    }

    // 1. Auth Creation, Linking, or Sign In
    let newUser;
    try {
      if (auth.currentUser && auth.currentUser.isAnonymous === false && (auth.currentUser.providerData.length > 0)) {
        // If user is already signed in (e.g. from Google), link credential instead of creating a new user
        const credential = EmailAuthProvider.credential(email, pass);
        const userCredential = await linkWithCredential(auth.currentUser, credential);
        newUser = userCredential.user;
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        newUser = userCredential.user;
      }
    } catch (authErr: any) {
      const errCode = authErr?.code || '';
      const errMsg = authErr?.message || '';
      if (errCode === 'auth/email-already-in-use' || errMsg.includes('email-already-in-use')) {
        // Attempt login if password matches existing account
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, pass);
          newUser = userCredential.user;
        } catch (signInErr) {
          throw new Error("An account with this email/mobile already exists.");
        }
      } else {
        throw authErr;
      }
    }
    
    try {
      // 2. Avatar Process (optional)
      let photoURL = presetPhotoURL || null;
      if (avatarFile) {
        photoURL = await uploadMedia(avatarFile, `profiles/${newUser.uid}`, undefined, MediaQuality.PROFILE);
      }
      
      // 3. Register Identity
      await registerUsername(
        username,
        {
          photoURL,
          displayName: fullName,
          onboardingStep: 2,
          onboardingCompleted: false
        },
        newUser
      );
      
      return newUser;
    } catch (error) {
      console.error("Post-Auth registration failed", error);
      // Even if profile fails, user was created. 
      // The global state will eventually show UsernameSelection if profile is missing.
      return newUser;
    }
  };

  const resetPassword = async (identifier: string) => {
    let email = identifier.trim();
    if (!email.includes('@') && db) {
      const cleanId = email.toLowerCase().replace(/^@/, '');
      let resolvedEmail = '';
      try {
        const usernameDocRef = doc(db, 'usernames', cleanId);
        const snap = await getDoc(usernameDocRef);
        if (snap.exists()) {
          const uData = snap.data();
          if (uData.email) {
            resolvedEmail = uData.email;
          } else if (uData.ownerUid) {
            const uDoc = await getDoc(doc(db, 'users', uData.ownerUid));
            if (uDoc.exists() && uDoc.data().email) {
              resolvedEmail = uDoc.data().email;
            }
          }
        }
        if (!resolvedEmail) {
          const qUsername = query(collection(db, 'profiles'), where('username', '==', cleanId), limit(1));
          const pSnap = await getDocs(qUsername);
          if (!pSnap.empty) {
            const pData = pSnap.docs[0].data();
            if (pData.personalEmail) {
              resolvedEmail = pData.personalEmail;
            } else if (pData.ownerUid) {
              const uDoc = await getDoc(doc(db, 'users', pData.ownerUid));
              if (uDoc.exists() && uDoc.data().email) {
                resolvedEmail = uDoc.data().email;
              }
            }
          }
        }
      } catch (err) {
        console.warn("[ResetPassword] Identifier lookup warning:", err);
      }
      if (resolvedEmail) {
        email = resolvedEmail;
      } else {
        throw new Error("No account found matching this username or email.");
      }
    }
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    try {
      await logActivity('logout', 'User logged out and system link severed.').catch(() => {});
    } catch (e) {
      console.warn("Could not log logout activity:", e);
    }
    try {
      await goOffline().catch(() => {});
    } catch (e) {}
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("SignOut auth warning:", e);
    }
    setProfile(null);
    setUser(null);
    setActiveProfileId(null);
    setAllProfiles([]);
    try {
      localStorage.removeItem('aeirmist_active_profile_id');
      localStorage.removeItem('aeirmist_session');
    } catch (e) {}
  };

  const refreshProfile = async () => {
    if (!user || !db) return;
    try {
      const q = query(collection(db, 'profiles'), where('ownerUid', '==', user.uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const profiles = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setAllProfiles(profiles);
        const active = profiles.find(p => p.isActive) || profiles[0];
        setProfile(active);
        setActiveProfileId(active.id);
      }
    } catch (e) {
      console.warn("[AeirmistContext] Manual profile refresh failed:", e);
    }
  };

  const reloadAuthUser = async () => {
    if (!auth.currentUser) return;
    try {
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;
      setUser({ ...updatedUser }); // Trigger re-render with fresh reference
      console.log("[AeirmistContext] Auth user reloaded:", updatedUser.email, "Verified:", updatedUser.emailVerified);
    } catch (e) {
      console.warn("[AeirmistContext] Auth user reload failed:", e);
    }
  };

  const updateProfile = async (data: any) => {
    if (!db || !user) {
      console.error("[AeirmistContext] Update aborted: Missing base requirements", { db: !!db, user: !!user });
      return;
    }
    
    const targetProfileId = profile?.id || `profile_${user.uid}`;
    
    // Construct keys to identify update type
    const keys = Object.keys(data).filter(k => data[k] !== undefined);
    
    // Basic fields sync faster/without strict regulation for better UX
    const isBasicUpdate = keys.every(k => ['photoURL', 'coverURL', 'bannerURL', 'bio', 'displayName', 'tagline', 'relationshipStatus', 'relationshipStatusVisibility', 'locationData', 'onboardingStep', 'onboardingCompleted', 'gender', 'dateOfBirth', 'personalEmail', 'phoneNumber', 'isPrivate'].includes(k));
    
    // Appearance settings have their own throttle key to avoid blocking unrelated profile updates
    const isAppearanceUpdate = keys.length === 1 && keys[0] === 'appearanceSettings';
    const throttleKey = isAppearanceUpdate ? 'updateAppearanceSettings' : 'updateProfile';
    
    console.log(`[AeirmistContext] Profile Update Triggered. Basic: ${isBasicUpdate}. Appearance: ${isAppearanceUpdate}. Fields:`, keys);

    if (!isBasicUpdate && !canWrite(throttleKey, 2000)) {
      console.warn(`[AeirmistContext] Update regulated by throttle: ${throttleKey}`);
      throw new Error("Updates are regulated. Please wait 2 seconds.");
    }
    
    const allowedFields = [
      'displayName', 'username', 'bio', 'description', 'tagline', 'relationshipStatus', 'relationshipStatusVisibility', 'photoURL', 'coverURL', 'bannerURL', 
      'location', 'locationData', 'website', 'pronouns', 'socialLinks', 'category',
      'privacySettings', 'themeSettings', 'aeirmistLevel', 'notificationSettings', 'messagingSettings', 'appearanceSettings',
      'isDeactivated', 'isProfileLocked', 'isProfessional', 'isPrivate', 'isCreatorSetup',
      'fullName', 'phoneNumber', 'phoneCountryCode', 'phoneVerified', 'personalEmail', 'pendingEmailChange', 'gender', 'dateOfBirth',
      'hasPassword', 'passwordCreatedAt', 'lastPasswordChangedAt', 'twoFactorEnabled', 'recoveryEmail', 'recoveryPhone', 'securityQuestions', 'trustedDevices',
      'lastReactivatedAt', 'deletionRequestedAt', 'deletionScheduledFor', 'deactivatedAt', 'deactivationDuration', 'deactivationReturnDate', 'deactivationReason',
      'onboardingStep', 'onboardingCompleted'
    ];
    
    const updateData: any = {
      updatedAt: serverTimestamp(),
      id: targetProfileId,
      uid: user.uid,
      ownerUid: user.uid,
      isActive: true
    };
    
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    try {
      const batch = writeBatch(db);
      
      // OPTIMISTIC UPDATE: Update local state immediately for snappy feel
      // We do this BEFORE the batch commit to ensure the UI feels instant
      setProfile((prev: any) => ({
        id: targetProfileId,
        uid: user.uid,
        ownerUid: user.uid,
        isActive: true,
        ...(prev || {}),
        ...updateData
      }));

      // 1. Handle Username Change & Lock System
      if (data.username && data.username.toLowerCase() !== profile?.username?.toLowerCase()) {
        const newUsername = data.username.toLowerCase();
        console.log(`[AeirmistContext] Handle swap detected: ${profile?.username} -> ${newUsername}`);
        
        const userLockRef = doc(db, 'usernames', newUsername);
        const lockSnap = await getDoc(userLockRef);
        if (lockSnap.exists() && lockSnap.data().ownerUid !== user.uid) {
           throw new Error("Username already saved to another user.");
        }
        
        if (profile?.username) {
          batch.delete(doc(db, 'usernames', profile.username.toLowerCase()));
        }
        
        batch.set(userLockRef, {
          ownerUid: user.uid,
          profileId: targetProfileId,
          email: user.email
        });
      }

      // 2. Update/Set Profile Doc (merge: true ensures doc creation if not existing)
      const profileRef = doc(db, 'profiles', targetProfileId);
      batch.set(profileRef, updateData, { merge: true });
      
      // 3. Sync core fields back to User record under users/{uid} for global lookup reliability
      const userRef = doc(db, 'users', user.uid);
      const userUpdate: any = {
        email: user.email || '',
        emailVerified: user.emailVerified || false,
        updatedAt: serverTimestamp()
      };
      if (data.displayName !== undefined) userUpdate.displayName = data.displayName;
      if (data.photoURL !== undefined) userUpdate.photoURL = data.photoURL;
      if (data.username !== undefined) userUpdate.username = data.username;
      if (data.phoneNumber !== undefined) userUpdate.phone = data.phoneNumber;
      if (data.recoveryEmail !== undefined) userUpdate.recoveryEmail = data.recoveryEmail;
      if (data.recoveryPhone !== undefined) userUpdate.recoveryPhone = data.recoveryPhone;
      if (data.phoneVerified !== undefined) userUpdate.phoneVerified = data.phoneVerified;

      console.log("[AeirmistContext] Syncing user record under users/{uid}...", userUpdate);
      batch.set(userRef, userUpdate, { merge: true });
      
      // ALSO update Firebase Auth profile for immediate consistency in SDK-based UI
      if (data.displayName !== undefined || data.photoURL !== undefined) {
        try {
          const authPhotoURL = (data.photoURL && typeof data.photoURL === 'string' && !data.photoURL.startsWith('data:') && data.photoURL.length < 2000) 
            ? data.photoURL 
            : auth.currentUser!.photoURL;
            
          const authTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Auth update timeout")), 1500));
          await Promise.race([
            updateAuthProfile(auth.currentUser!, {
              displayName: data.displayName !== undefined ? data.displayName : auth.currentUser!.displayName,
              photoURL: authPhotoURL
            }),
            authTimeout
          ]);
          console.log("[AeirmistContext] Auth profile saved.");
        } catch (authErr) {
          console.warn("[AeirmistContext] Auth profile sync failed or timed out (non-critical):", authErr);
        }
      }
      
      try {
        const commitTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Batch commit timeout")), 3000));
        await Promise.race([
          batch.commit(),
          commitTimeout
        ]);
        console.log("[AeirmistContext] Profile Update Success committed to chain.");
      } catch (e: any) {
        const errStr = String(e);
        if (errStr.includes('exceeds the maximum allowed size') || errStr.includes('size')) {
          console.error("[AeirmistContext] CRITICAL: Profile document size limit exceeded. Initiating Storage Cleanup...");
          
          addToast({
            title: "Storage Full",
            message: "Profile document size limit exceeded. Initiating automated pruning to restore sync.",
            type: "warning"
          });

          // Storage Cleanup Strategy: Remove heavy non-essential data
          try {
            const pruningData: any = {
              recommendationSignals: deleteField(),
              searchHistory: deleteField(),
              recentInteractions: deleteField(),
              activityLogs: deleteField(),
              lastPrunedAt: serverTimestamp(),
              pruningReason: 'SIZE_LIMIT_EXCEEDED'
            };

            // Only prune images if they are the likely culprits (Base64)
            // We try to keep them if possible, but if the doc is stuck, we must clear them.
            const hasLargeBase64 = 
              (profile.photoURL?.startsWith('data:image') && profile.photoURL.length > 250000) ||
              (profile.coverURL?.startsWith('data:image') && profile.coverURL.length > 500000) ||
              (profile.bannerURL?.startsWith('data:image') && profile.bannerURL.length > 500000) ||
              (profile.appearanceSettings?.globalBgValue?.startsWith('data:image') && profile.appearanceSettings.globalBgValue.length > 800000) ||
              (profile.appearanceSettings?.globalBgList?.some((url: string) => url.startsWith('data:image')) && JSON.stringify(profile.appearanceSettings.globalBgList).length > 800000);

            if (hasLargeBase64) {
              console.log("[AeirmistContext] Large Base64 detected. Clearing images to restore app functionality.");
              if (profile.photoURL?.startsWith('data:image')) pruningData.photoURL = 'https://picsum.photos/seed/default/100';
              if (profile.coverURL?.startsWith('data:image')) pruningData.coverURL = '';
              if (profile.bannerURL?.startsWith('data:image')) pruningData.bannerURL = '';
              
              if (profile.appearanceSettings) {
                const newAppearance = { ...profile.appearanceSettings };
                let modified = false;

                if (profile.appearanceSettings.globalBgValue?.startsWith('data:image')) {
                  newAppearance.globalBgValue = '';
                  newAppearance.globalBgType = 'none';
                  modified = true;
                }

                if (profile.appearanceSettings.globalBgList?.some((url: string) => url.startsWith('data:image'))) {
                  // Keep only remote URLs in the list
                  newAppearance.globalBgList = profile.appearanceSettings.globalBgList.filter((url: string) => !url.startsWith('data:image'));
                  modified = true;
                }

                if (modified) {
                  pruningData.appearanceSettings = newAppearance;
                }
              }
              
              addToast({
                title: "Media Purged",
                message: "Profile images or wallpapers were too large and have been cleared to prevent account lock.",
                type: "warning"
              });
            } else {
              addToast({
                title: "Metadata Pruned",
                message: "Internal logs cleared to reduce profile weight.",
                type: "info"
              });
            }

            // Use updateDoc directly for pruning to avoid batch overhead during recovery
            await updateDoc(profileRef, pruningData);
            
            addToast({
              title: "Pruning Complete",
              message: "Heaviest profile segments cleared. Service should resume shortly.",
              type: "info"
            });
            
            // Re-attempt original update if it wasn't the pruned fields that caused the issue
            if (!data.photoURL && !data.coverURL && !data.bannerURL && !data.recommendationSignals && !data.searchHistory) {
              const retryBatch = writeBatch(db);
              retryBatch.update(profileRef, updateData);
              await retryBatch.commit();
              console.log("[AeirmistContext] Profile update successful after pruning.");
            }
          } catch (pruningErr) {
            console.error("[AeirmistContext] Storage Cleanup failed. Manual intervention required.", pruningErr);
          }
        }
        handleFirestoreError(e, 'updateProfile', `profiles/${profile.id}`);
        throw e;
      }
    } catch (error) {
      console.error("[AeirmistContext] Profile Update CRITICAL FAILURE:", error);
      // Revert optimistic update on failure
      if (profile) {
        setProfile((prev: any) => ({ ...prev }));
      }
      handleFirestoreError(error, OperationType.UPDATE, `profiles/${profile.id}`);
      throw error;
    }
  };

  const deleteAccount = async () => {
    if (!db) return;
    const currentUid = user?.uid || auth.currentUser?.uid;
    if (!currentUid) return;

    try {
      console.log(`[deleteAccount] Initiating account purge for UID: ${currentUid}`);
      await purgeUser(currentUid);
    } catch (e) {
      console.error("[deleteAccount] Purge error:", e);
    }

    // Delete user from Firebase Authentication
    if (auth.currentUser) {
      try {
        await deleteUser(auth.currentUser);
        console.log("[deleteAccount] Firebase Auth user deleted successfully.");
      } catch (authErr: any) {
        console.warn("[deleteAccount] Firebase Auth deleteUser notice (may require recent login):", authErr);
      }
    }

    // Clear local storage and state
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}

    setProfile(null);
    setUser(null);
    await logout();
  };

  const purgeUser = async (uid: string) => {
    if (!db) return;
    try {
      console.log(`[purgeUser] Comprehensive clean-up initiated for UID: ${uid}`);

      // 1. Gather ALL associated Profile IDs and Usernames
      const profileIdsSet = new Set<string>();
      const usernamesSet = new Set<string>();

      profileIdsSet.add(uid);
      profileIdsSet.add(`profile_${uid}`);
      if (profile?.id) profileIdsSet.add(profile.id);

      // Query profiles by ownerUid
      try {
        const qOwner = query(collection(db, 'profiles'), where('ownerUid', '==', uid));
        const ownerSnap = await getDocs(qOwner);
        ownerSnap.forEach(p => {
          profileIdsSet.add(p.id);
          const d = p.data();
          if (d.username) usernamesSet.add(d.username.toLowerCase());
        });
      } catch (e) {}

      // Query profiles by uid
      try {
        const qUid = query(collection(db, 'profiles'), where('uid', '==', uid));
        const uidSnap = await getDocs(qUid);
        uidSnap.forEach(p => {
          profileIdsSet.add(p.id);
          const d = p.data();
          if (d.username) usernamesSet.add(d.username.toLowerCase());
        });
      } catch (e) {}

      // Direct lookup for profile documents
      for (const pId of Array.from(profileIdsSet)) {
        try {
          const pDoc = await getDoc(doc(db, 'profiles', pId));
          if (pDoc.exists()) {
            const d = pDoc.data();
            if (d.username) usernamesSet.add(d.username.toLowerCase());
          }
        } catch (e) {}
      }

      if (profile?.username) usernamesSet.add(profile.username.toLowerCase());

      const profileIds = Array.from(profileIdsSet);
      const usernames = Array.from(usernamesSet);

      // Collect doc IDs for batch deletion across all collections
      const deleteDocsMap = new Map<string, Set<string>>();

      const addDocsToDelete = (collName: string, snapDocs: any[]) => {
        if (!deleteDocsMap.has(collName)) deleteDocsMap.set(collName, new Set());
        const set = deleteDocsMap.get(collName)!;
        snapDocs.forEach(d => set.add(d.id));
      };

      // Query Posts
      try {
        const qP1 = await getDocs(query(collection(db, 'posts'), where('userId', '==', uid)));
        addDocsToDelete('posts', qP1.docs);
        const qP2 = await getDocs(query(collection(db, 'posts'), where('authorUid', '==', uid)));
        addDocsToDelete('posts', qP2.docs);
        for (const pid of profileIds) {
          const qP3 = await getDocs(query(collection(db, 'posts'), where('authorId', '==', pid)));
          addDocsToDelete('posts', qP3.docs);
        }
      } catch (e) {}

      // Query Stories
      try {
        const qS1 = await getDocs(query(collection(db, 'stories'), where('userId', '==', uid)));
        addDocsToDelete('stories', qS1.docs);
        const qS2 = await getDocs(query(collection(db, 'stories'), where('authorUid', '==', uid)));
        addDocsToDelete('stories', qS2.docs);
        for (const pid of profileIds) {
          const qS3 = await getDocs(query(collection(db, 'stories'), where('authorId', '==', pid)));
          addDocsToDelete('stories', qS3.docs);
        }
      } catch (e) {}

      // Query Comments
      try {
        const qC1 = await getDocs(query(collection(db, 'feed_comments'), where('userId', '==', uid)));
        addDocsToDelete('feed_comments', qC1.docs);
        const qC2 = await getDocs(query(collection(db, 'feed_comments'), where('authorUid', '==', uid)));
        addDocsToDelete('feed_comments', qC2.docs);
        for (const pid of profileIds) {
          const qC3 = await getDocs(query(collection(db, 'feed_comments'), where('authorId', '==', pid)));
          addDocsToDelete('feed_comments', qC3.docs);
        }
      } catch (e) {}

      // Query Notifications
      try {
        for (const field of ['userId', 'fromUserId', 'toUid', 'fromUid']) {
          const qN = await getDocs(query(collection(db, 'notifications'), where(field, '==', uid)));
          addDocsToDelete('notifications', qN.docs);
        }
        for (const pid of profileIds) {
          for (const field of ['targetProfileId', 'fromProfileId', 'userId']) {
            const qN = await getDocs(query(collection(db, 'notifications'), where(field, '==', pid)));
            addDocsToDelete('notifications', qN.docs);
          }
        }
      } catch (e) {}

      // Query Activities
      try {
        const qA = await getDocs(query(collection(db, 'activities'), where('userId', '==', uid)));
        addDocsToDelete('activities', qA.docs);
        for (const pid of profileIds) {
          const qA2 = await getDocs(query(collection(db, 'activities'), where('profileId', '==', pid)));
          addDocsToDelete('activities', qA2.docs);
        }
      } catch (e) {}

      // Query Reports & Appeals
      try {
        const qR1 = await getDocs(query(collection(db, 'reports'), where('reporterId', '==', uid)));
        addDocsToDelete('reports', qR1.docs);
        const qR2 = await getDocs(query(collection(db, 'reports'), where('reportedUserId', '==', uid)));
        addDocsToDelete('reports', qR2.docs);
        const qAp = await getDocs(query(collection(db, 'appeals'), where('userId', '==', uid)));
        addDocsToDelete('appeals', qAp.docs);
      } catch (e) {}

      // Query Videos, Notes, Saved items
      try {
        const qV1 = await getDocs(query(collection(db, 'videos'), where('userId', '==', uid)));
        addDocsToDelete('videos', qV1.docs);
        const qV2 = await getDocs(query(collection(db, 'videos'), where('authorUid', '==', uid)));
        addDocsToDelete('videos', qV2.docs);

        const qNt = await getDocs(query(collection(db, 'notes'), where('userId', '==', uid)));
        addDocsToDelete('notes', qNt.docs);

        const qSv = await getDocs(query(collection(db, 'saved_items'), where('userId', '==', uid)));
        addDocsToDelete('saved_items', qSv.docs);
      } catch (e) {}

      // Conversations
      try {
        const qConvs = await getDocs(query(collection(db, 'conversations'), where('participants', 'array-contains', uid)));
        qConvs.docs.forEach(c => {
          const cData = c.data();
          const otherP = (cData.participants || []).filter((pUid: string) => pUid !== uid && !profileIds.includes(pUid));
          if (otherP.length === 0) {
            addDocsToDelete('conversations', [c]);
          }
        });
      } catch (e) {}

      // Perform Batched Deletions
      let batch = writeBatch(db);
      let opCount = 0;

      const commitBatchIfNeeded = async () => {
        if (opCount >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      };

      for (const [collName, docIdsSet] of deleteDocsMap.entries()) {
        for (const docId of Array.from(docIdsSet)) {
          batch.delete(doc(db, collName, docId));
          opCount++;
          await commitBatchIfNeeded();
        }
      }

      // Delete Profiles
      for (const pid of profileIds) {
        batch.delete(doc(db, 'profiles', pid));
        opCount++;
        await commitBatchIfNeeded();
      }

      // Delete Username Locks
      for (const un of usernames) {
        batch.delete(doc(db, 'usernames', un.toLowerCase()));
        opCount++;
        await commitBatchIfNeeded();
      }

      // Delete User Docs
      batch.delete(doc(db, 'users', uid));
      opCount++;
      await commitBatchIfNeeded();

      batch.delete(doc(db, 'users', `user_${uid}`));
      opCount++;
      await commitBatchIfNeeded();

      try {
        batch.delete(doc(db, 'admins', uid));
        opCount++;
        await commitBatchIfNeeded();
      } catch (e) {}

      if (opCount > 0) {
        await batch.commit();
      }

      console.log(`[purgeUser] Successfully purged all Firestore data for user ${uid}.`);
    } catch (error) {
      console.error("[purgeUser] failed:", error);
      throw error;
    }
  };

  const toggleUserBan = async (uid: string, banStatus: boolean) => {
    if (!db) return;
    try {
      const profilesRef = collection(db, 'profiles');
      const q = query(profilesRef, where('ownerUid', '==', uid));
      const snap = await getDocs(q);
      
      const batch = writeBatch(db);
      snap.forEach(p => {
        batch.update(doc(db, 'profiles', p.id), { 
          isBanned: banStatus,
          status: banStatus ? 'BANNED' : 'ACTIVE'
        });
      });

      // Also check if uid itself is a profileId
      const directRef = doc(db, 'profiles', uid);
      const directSnap = await getDoc(directRef);
      if (directSnap.exists()) {
        batch.update(directRef, { 
          isBanned: banStatus,
          status: banStatus ? 'BANNED' : 'ACTIVE'
        });
      }

      await batch.commit();
      
      // Also update main user doc if it exists
      try {
        await updateDoc(doc(db, 'users', uid), { 
          isBanned: banStatus,
          status: banStatus ? 'BANNED' : 'ACTIVE'
        });
      } catch (e) {}

      addToast({ 
        title: banStatus ? 'Identity Restricted' : 'Access Restored', 
        message: `Node access has been ${banStatus ? 'suspended' : 're-enabled'}.`, 
        type: banStatus ? 'warning' : 'success' 
      });
    } catch (e) {
      console.error("Ban toggle failed:", e);
      throw e;
    }
  };

  const toggleVerification = async (profileId: string, verifiedStatus: boolean) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'profiles', profileId), { isVerified: verifiedStatus });
      addToast({ 
        title: verifiedStatus ? 'Node Verified' : 'Badge Removed', 
        message: `Verification status updated for this identity.`, 
        type: 'success' 
      });
    } catch (e) {
      console.error("Verification toggle failed:", e);
      throw e;
    }
  };

  const updateUserStatus = async (uid: string, status: AccountStatus) => {
    if (!db) return;
    try {
      const isRestricted = ['SUSPENDED', 'BANNED', 'DEACTIVATED', 'DELETED', 'UNDER_REVIEW'].includes(status);
      const profilesRef = collection(db, 'profiles');
      const q = query(profilesRef, where('ownerUid', '==', uid));
      const snap = await getDocs(q);
      
      const batch = writeBatch(db);
      snap.forEach(p => {
        batch.update(doc(db, 'profiles', p.id), { 
          status,
          isBanned: isRestricted
        });
      });

      const directRef = doc(db, 'profiles', uid);
      const directSnap = await getDoc(directRef);
      if (directSnap.exists()) {
        batch.update(directRef, { 
          status,
          isBanned: isRestricted
        });
      }

      await batch.commit();

      try {
        await updateDoc(doc(db, 'users', uid), { 
          status,
          isBanned: isRestricted
        });
      } catch (e) {}

      addToast({
        title: 'Status Updated',
        message: `Account status updated to ${status}.`,
        type: 'success'
      });
    } catch (e) {
      console.error("Update user status failed:", e);
      addToast({ title: 'Error', message: 'Failed to update account status.', type: 'warning' });
      throw e;
    }
  };

  const suspendUser = async (uid: string, duration: string, reason: string, notes?: string) => {
    if (!db) return;
    try {
      let expiresAt: number | null = Date.now();
      if (duration === '24 Hours') expiresAt += 24 * 60 * 60 * 1000;
      else if (duration === '3 Days') expiresAt += 3 * 24 * 60 * 60 * 1000;
      else if (duration === '7 Days') expiresAt += 7 * 24 * 60 * 60 * 1000;
      else if (duration === '14 Days') expiresAt += 14 * 24 * 60 * 60 * 1000;
      else if (duration === '30 Days') expiresAt += 30 * 24 * 60 * 60 * 1000;
      else if (duration === 'Permanent Suspension' || duration === 'Permanent') expiresAt = null;
      else expiresAt += 7 * 24 * 60 * 60 * 1000;

      const referenceId = `AEIRMIST-SUSP-${uid.slice(0, 8).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const suspensionInfo: SuspensionInfo = {
        reason,
        duration,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        notes: notes || '',
        referenceId,
        timestamp: new Date().toISOString()
      };

      const profilesRef = collection(db, 'profiles');
      const q = query(profilesRef, where('ownerUid', '==', uid));
      const snap = await getDocs(q);

      const batch = writeBatch(db);
      snap.forEach(p => {
        batch.update(doc(db, 'profiles', p.id), {
          status: 'SUSPENDED',
          isBanned: true,
          suspensionInfo
        });
      });

      const directRef = doc(db, 'profiles', uid);
      const directSnap = await getDoc(directRef);
      if (directSnap.exists()) {
        batch.update(directRef, {
          status: 'SUSPENDED',
          isBanned: true,
          suspensionInfo
        });
      }

      await batch.commit();

      try {
        await updateDoc(doc(db, 'users', uid), {
          status: 'SUSPENDED',
          isBanned: true,
          suspensionInfo
        });
      } catch (e) {}

      addToast({
        title: 'Account Suspended',
        message: `User suspended for ${duration} (${reason}).`,
        type: 'warning'
      });
    } catch (e) {
      console.error("Suspend user failed:", e);
      addToast({ title: 'Suspension Failed', message: 'Could not suspend user.', type: 'warning' });
      throw e;
    }
  };

  const logActivity = async (action: string, details?: string) => {
    if (!db || !profile || !user || isOffline) return;
    try {
      const activityRef = collection(db, 'activities');
      await addDoc(activityRef, {
        userId: user.uid,
        profileId: profile.id,
        action,
        details: details || '',
        timestamp: serverTimestamp(),
        device: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        }
      });
    } catch (e) {
      console.warn("Activity logging failed", e);
    }
  };


  const linkAccountMethod = async (providerName: 'google' | 'apple' | 'facebook' | 'yahoo') => {
    if (!auth.currentUser) throw new Error("A user must be logged in to link accounts.");
    
    const supportedProviders = ['google'];
    if (!supportedProviders.includes(providerName)) {
       throw new Error(`Action Denied: ${providerName.charAt(0).toUpperCase() + providerName.slice(1)} linking is not enabled. Please use Google for secondary verification.`);
    }

    let provider: any;
    if (providerName === 'google') {
      provider = new GoogleAuthProvider();
    } else if (providerName === 'facebook') {
      provider = new FacebookAuthProvider();
    } else if (providerName === 'apple') {
      provider = new OAuthProvider('apple.com');
    } else if (providerName === 'yahoo') {
      provider = new OAuthProvider('yahoo.com');
    }

    if (!provider) throw new Error(`Provider not configured: ${providerName}`);
    
    try {
      const result = await signInWithPopup(auth, provider);
      await linkWithCredential(auth.currentUser, (result as any).credential);
      console.log(`[Account Linked] Successfully linked ${providerName}!`);
      await logActivity('linked_account_added', `Connected standard ${providerName} connection method to account security.`);
      addToast({ title: `Link Successful`, message: `Successfully connected ${providerName} connection method.`, type: "success" });
    } catch (err: any) {
      const handled = handleAuthError(err, 'linkAccountMethod', true);

      if (
        err.code === 'auth/popup-blocked' || 
        err.code === 'auth/popup-closed-by-user' || 
        err.code === 'auth/cancelled-popup-request'
      ) {
        console.warn("[Diagnostics - Auth] Linking popup blocked or canceled, cascading to signInWithRedirect...");
        try {
          sessionStorage.setItem('aeirmist_pending_link', 'true');
          await signInWithRedirect(auth, provider);
        } catch (redirectErr) {
          sessionStorage.removeItem('aeirmist_pending_link');
          throw handleAuthError(redirectErr, 'linkAccountRedirect');
        }
      } else {
        throw handled;
      }
    }
  };

  const unlinkAccountMethod = async (providerId: string) => {
    if (!auth.currentUser) throw new Error("A user must be logged in to unlink accounts.");
    if (auth.currentUser.providerData.length <= 1) {
      addToast({ title: "Unlink Terminated", message: "You cannot unlink your only verification method.", type: "warning" });
      return;
    }
    try {
      const { unlink } = await import('firebase/auth');
      await unlink(auth.currentUser, providerId);
      console.log(`[Account Unlinked] Successfully unlinked ${providerId}!`);
      await logActivity('linked_account_added', `Severed ${providerId} credential connection.`);
      addToast({ title: `Unlink Successful`, message: `Successfully disconnected ${providerId} connection method.`, type: "success" });
    } catch (err: any) {
      console.error("[Account Unlinking failed]", err);
      addToast({ title: `Unlink Failed`, message: err.message || `Failed to disconnect ${providerId} method.`, type: "warning" });
      throw err;
    }
  };

  const requestDeleteAccount = async () => {
    if (!db || !profile || !user) return;
    try {
      const profileRef = doc(db, 'profiles', profile.id);
      const purgeDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await updateDoc(profileRef, {
        scheduledForPurge: true,
        purgeDate: purgeDate.toISOString()
      });
      await logActivity('account_deleted_request', `Scheduled account for deletion.`);
      addToast({ title: "Deletion process established", message: "Your account data is scheduled for permanent purge in 30 days. You have been disconnected safely.", type: "warning" });
      await logout();
    } catch (error) {
      console.error("[requestDeleteAccount] failed:", error);
      throw error;
    }
  };

  const cancelDeleteAccount = async () => {
    if (!db || !profile || !user) return;
    try {
      const profileRef = doc(db, 'profiles', profile.id);
      await updateDoc(profileRef, {
        scheduledForPurge: false,
        purgeDate: null
      });
      setIsScheduledForPurge(false);
      await logActivity('linked_account_added', `Reactivated system link. Deletion process aborted.`);
      addToast({ title: "Aeirmist Link Restored", message: "Account deletion aborted. Welcome back, entity.", type: "success" });
    } catch (error) {
      console.error("[cancelDeleteAccount] failed:", error);
      throw error;
    }
  };

  const switchProfile = async (profileId: string) => {
    if (!db || !user || !canWrite(`switchProfile_${profileId}`, 60000)) return;
    const batch = writeBatch(db);
    allProfiles.forEach(p => {
      batch.update(doc(db, 'profiles', p.id), { isActive: p.id === profileId });
    });
    await batch.commit();
  };

  const checkUsernameAvailable = async (username: string) => {
    if (isSafeMode || !db) {
      return { available: true };
    }
    try {
      const usernameDocRef = doc(db, 'usernames', username.toLowerCase());
      const usernameDocSnap = await getDoc(usernameDocRef);
      return { available: !usernameDocSnap.exists() };
    } catch (error) {
      console.warn("Direct usernames doc check failed, falling back to profiles query:", error);
      try {
        const q = query(collection(db, 'profiles'), where('username', '==', username.toLowerCase()));
        const snap = await getDocs(q);
        return { available: snap.empty };
      } catch (fallbackError) {
        console.error("Profiles query fallback also failed:", fallbackError);
        return { available: true };
      }
    }
  };

  const registerUsername = async (username: string, data: any = {}, targetUser?: User) => {
    const activeUser = targetUser || user;
    if (isSafeMode || !db || !activeUser) {
      // Offline/Sandbox Bypass - completely operate locally to bypass database restrictions
      const profileId = `profile_${activeUser?.uid || 'guest'}_local`;
      const localProfileObj = {
        ...data,
        id: profileId,
        uid: activeUser?.uid || 'guest', 
        ownerUid: activeUser?.uid || 'guest',
        username: username.toLowerCase(),
        displayName: data.displayName || activeUser?.displayName || username,
        photoURL: data.photoURL || activeUser?.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256",
        bio: data.bio || "Account created (Local Sandbox).",
        tagline: data.tagline || "Sandbox active",
        followersCount: 0,
        followingCount: 0,
        aeirmistLevel: 100,
        socialLinks: data.socialLinks || { instagram: '', twitter: '', github: '', discord: '', website: '', youtube: '', tiktok: '', facebook: '' },
        privacySettings: data.privacySettings || { privateProfile: false, showActivity: true, allowMessages: 'everyone', hideFollowers: false },
        themeSettings: data.themeSettings || { accentColor: '#00f2ff', glowIntensity: 0.8, noiseEffect: true },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setProfile(localProfileObj);
      setAllProfiles([localProfileObj]);
      setActiveProfileId(profileId);
      setNeedsUsername(false);
      return;
    }
    const profileId = `profile_${activeUser.uid}_${Date.now()}`;
    const batch = writeBatch(db);
    
    // Check if username is already taken again inside batch (can't really do easily, but usually handled by UI)
    
    // 1. Core User Record
    const userRef = doc(db, 'users', activeUser.uid);
    batch.set(userRef, {
      uid: activeUser.uid,
      username: username.toLowerCase(),
      email: activeUser.email,
      displayName: data.displayName || activeUser.displayName || username,
      photoURL: data.photoURL || activeUser.photoURL || "",
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      provider: activeUser.providerData[0]?.providerId || 'email'
    }, { merge: true });

    // 2. Profile Record
    const profileRef = doc(db, 'profiles', profileId);
    batch.set(profileRef, {
      ...data,
      id: profileId,
      uid: activeUser.uid, 
      ownerUid: activeUser.uid,
      username: username.toLowerCase(),
      displayName: data.displayName || activeUser.displayName || username,
      photoURL: data.photoURL || activeUser.photoURL || "",
      bio: data.bio || "Account created.",
      tagline: data.tagline || "",
      relationshipStatus: data.relationshipStatus || null,
      relationshipStatusVisibility: data.relationshipStatusVisibility || 'public',
      location: data.location || "",
      website: data.website || "",
      pronouns: data.pronouns || "",
      bannerURL: data.bannerURL || "",
      fullName: data.fullName || "",
      phoneNumber: data.phoneNumber || "",
      personalEmail: data.personalEmail || "",
      gender: data.gender || "",
      dateOfBirth: data.dateOfBirth || "",
      socialLinks: data.socialLinks || {
        instagram: '', twitter: '', github: '', discord: '', website: '', youtube: '', tiktok: '', facebook: ''
      },
      privacySettings: data.privacySettings || {
        privateProfile: false,
        showActivity: true,
        allowMessages: 'everyone',
        hideFollowers: false
      },
      themeSettings: data.themeSettings || {
        accentColor: '#00f2ff',
        glowIntensity: 0.8,
        noiseEffect: true
      },
      followersCount: 0,
      followingCount: 0,
      onboardingStep: data.onboardingStep || 2,
      onboardingCompleted: data.onboardingCompleted ?? false,
      isPrivate: false,
      isActive: true,
      status: 'online',
      social: {
        followers: [],
        following: [],
        pendingFollowing: [],
        pendingFollowers: [],
        blocked: [],
        restricted: [],
        closeFriends: []
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 3. Username Lock (Enforced by rules)
    batch.set(doc(db, 'usernames', username.toLowerCase()), {
      ownerUid: activeUser.uid,
      profileId: profileId,
      email: activeUser.email
    });

    console.error(`DIAGNOSTIC LOG - BEFORE BATCH COMMIT:
Profile ID: ${profileId}
Document paths being written:
- Users: users/${activeUser.uid}
- Profiles: profiles/${profileId}
- Usernames: usernames/${username.toLowerCase()}
Current User UID: ${activeUser.uid}`);

    try {
      await batch.commit();
      setNeedsUsername(false);
      setProfile((prev: any) => ({
        ...(prev || {}),
        id: profileId,
        uid: activeUser.uid,
        ownerUid: activeUser.uid,
        username: username.toLowerCase(),
        displayName: data.displayName || activeUser.displayName || username,
        photoURL: data.photoURL || activeUser.photoURL || "",
        onboardingStep: data.onboardingStep || 2,
        onboardingCompleted: data.onboardingCompleted ?? false
      }));
    } catch (e) {
      console.warn("Batch commit failed", e);
      throw e;
    }
  };

  const getFollowers = async (targetId: string) => {
    if (!db) return [];
    try {
      const q = query(collection(db, 'profiles'), where('social.following', 'array-contains', targetId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id }));
    } catch (e) {
      console.error("Fetch followers failed", e);
      return [];
    }
  };

  const getFollowing = async (targetId: string) => {
    if (!db) return [];
    try {
      // Need to fetch profiles whose IDs are in targetId's following array
      // Because we don't have the target profile here, we should fetch it first if we don't know it,
      // but if we do, it's easier to just pass the array or fetch the doc.
      const targetDoc = await getDoc(doc(db, 'profiles', targetId));
      if (!targetDoc.exists()) return [];
      const followingIds = targetDoc.data()?.social?.following || [];
      if (followingIds.length === 0) return [];
      
      const chunks = [];
      for (let i = 0; i < followingIds.length; i += 10) {
        chunks.push(followingIds.slice(i, i + 10));
      }
      
      const allFollowing = [];
      for (const chunk of chunks) {
        const q = query(collection(db, 'profiles'), where('id', 'in', chunk));
        const snap = await getDocs(q);
        allFollowing.push(...snap.docs.map(d => ({ ...d.data(), id: d.id })));
      }
      return allFollowing;
    } catch (e) {
      console.error("Fetch following failed", e);
      return [];
    }
  };

  const isFollowPending = (targetId: string) => profile?.social?.pendingFollowing?.includes(targetId) || false;
  
  const isFollowing = (targetId: string) => profile?.social?.following?.includes(targetId) || false;

  const toggleFollow = async (targetId: string, targetProfileData?: any) => {
    console.log("Toggle follow called:", { targetId, profileId: profile?.id });
    if (!db || !profile || !user) {
      console.log("Toggle follow aborted: Missing db, profile, or user", { db: !!db, profile: !!profile, user: !!user });
      return;
    }
    
    if (!canWrite(`follow_${targetId}`, 2000)) {
      console.log("Toggle follow aborted: Throttled");
      return;
    }
    
    const isFollowing = (profile.social?.following || []).includes(targetId);
    const isPending = (profile.social?.pendingFollowing || []).includes(targetId);
    console.log("Toggle follow state:", { isFollowing, isPending });                
    
    try {
      if (isFollowing) {
        // Optimistic Unfollow
        setProfile((prev: any) => ({
          ...prev,
          social: {
            ...prev?.social,
            following: (prev?.social?.following || []).filter((id: string) => id !== targetId)
          },
          followingCount: Math.max(0, (prev?.followingCount || 1) - 1)
        }));

        const batch = writeBatch(db);
        batch.update(doc(db, 'profiles', profile.id), {
          'social.following': arrayRemove(targetId),
          followingCount: increment(-1)
        });
        batch.update(doc(db, 'profiles', targetId), {
          'social.followers': arrayRemove(profile.id),
          followersCount: increment(-1)
        });
        await batch.commit();
        return;
      }

      // Check if target follows me (for follow back notification)
      const targetFollowsMe = (profile.social?.followers || []).includes(targetId);

      // 2. Already pending -> Cancel request
      if (isPending) {
        // Optimistic Cancel Pending
        setProfile((prev: any) => ({
          ...prev,
          social: {
            ...prev?.social,
            pendingFollowing: (prev?.social?.pendingFollowing || []).filter((id: string) => id !== targetId)
          }
        }));

        const batch = writeBatch(db);
        batch.update(doc(db, 'profiles', profile.id), {
          'social.pendingFollowing': arrayRemove(targetId)
        });
        const requestId = `req_${profile.id}_${targetId}`;
        batch.delete(doc(db, 'follow_requests', requestId));
        await batch.commit();
        return;
      }

      // 3. New Follow -> Check privacy
      let snap = await getDoc(doc(db, 'profiles', targetId));
      const targetInfo = snap.exists() ? snap.data() : (targetProfileData || {});

      // requiresApproval should be true if either isPrivate, isProfileLocked, or privacySettings.privateProfile is set
      const requiresApproval = targetInfo?.isPrivate || targetInfo?.isProfileLocked || targetInfo?.privacySettings?.privateProfile;

      if (requiresApproval) {
        // Optimistic Pending Request
        setProfile((prev: any) => ({
          ...prev,
          social: {
            ...prev?.social,
            pendingFollowing: [...(prev?.social?.pendingFollowing || []), targetId]
          }
        }));

        const batch = writeBatch(db);
        batch.update(doc(db, 'profiles', profile.id), {
          'social.pendingFollowing': arrayUnion(targetId)
        });
        
        const requestId = `req_${profile.id}_${targetId}`;
        batch.set(doc(db, 'follow_requests', requestId), {
          fromId: profile.id,
          toId: targetId,
          user: {
            name: profile.displayName || profile.username || 'User',
            avatar: profile.photoURL || '',
            username: profile.username || '',
            isVerified: profile.isVerified || false
          },
          status: 'pending',
          createdAt: serverTimestamp()
        });

        await batch.commit();
        await createNotification(targetId, 'follow_request', `${profile.displayName || 'Someone'} requested to follow you.`, { profileId: profile.id, requestId });
      } else {
        // Optimistic Instant Follow
        setProfile((prev: any) => ({
          ...prev,
          social: {
            ...prev?.social,
            following: [...(prev?.social?.following || []), targetId]
          },
          followingCount: (prev?.followingCount || 0) + 1
        }));

        const batch = writeBatch(db);
        batch.update(doc(db, 'profiles', profile.id), {
          'social.following': arrayUnion(targetId),
          followingCount: increment(1),
          aeirmistLevel: increment(REWARDS.FOLLOW_GIVEN)
        });
        
        batch.update(doc(db, 'profiles', targetId), {
          'social.followers': arrayUnion(profile.id),
          followersCount: increment(1)
        });

        await batch.commit();
        if (targetFollowsMe) {
          await createNotification(targetId, 'follow_back', `${profile.displayName || 'Someone'} followed you back! Link established.`, { profileId: profile.id });
        } else {
          await createNotification(targetId, 'follow', `${profile.displayName || 'Someone'} started following you.`, { profileId: profile.id });
        }
      }
    } catch (e) {
      console.error("Follow system update failed:", { targetId, error: e });
      addToast({
        title: "Connection Error",
        message: "Failed to update follow status — please check your connection and try again",
        type: "warning"
      });
      console.warn("Quota error in follow system", e);
    }
  };

  const acceptFollowRequest = async (requestId: string, fromProfileId: string) => {
    if (!db || !profile) return;
    try {
      const batch = writeBatch(db);
      
      // 1. Add follow relationship
      batch.update(doc(db, 'profiles', profile.id), {
        'social.followers': arrayUnion(fromProfileId),
        followersCount: increment(1)
      });
      batch.update(doc(db, 'profiles', fromProfileId), {
        'social.following': arrayUnion(profile.id),
        'social.pendingFollowing': arrayRemove(profile.id),
        followingCount: increment(1),
        aeirmistLevel: increment(REWARDS.FOLLOW_GIVEN)
      });

      // 2. Mark request as accepted/delete
      batch.delete(doc(db, 'follow_requests', requestId));
      
      await batch.commit();
      await createNotification(fromProfileId, 'follow_accept', `${profile.displayName} accepted your follow request.`, { profileId: profile.id });
    } catch (e) {
      console.error("Accept follow request failed", e);
      addToast({
        title: "Connection Error",
        message: "Failed to accept follow request — please check your connection and try again",
        type: "warning"
      });
    }
  };

  const rejectFollowRequest = async (requestId: string) => {
    if (!db || !profile) return;
    try {
      const batch = writeBatch(db);
      // We don't have the fromProfileId easily without fetching the request, 
      // but we can just delete the request doc.
      const reqDoc = await getDoc(doc(db, 'follow_requests', requestId));
      if (reqDoc.exists()) {
        const fromProfileId = reqDoc.data().fromId;
        batch.update(doc(db, 'profiles', fromProfileId), {
          'social.pendingFollowing': arrayRemove(profile.id)
        });
      }
      batch.delete(doc(db, 'follow_requests', requestId));
      await batch.commit();
    } catch (e) {
      console.error("Reject follow request failed", e);
      addToast({
        title: "Connection Error",
        message: "Failed to reject follow request — please check your connection and try again",
        type: "warning"
      });
    }
  };

  const searchUsers = async (text: string) => {
    if (!db) return [];
    const trimmed = text.trim();
    if (!trimmed) return [];
    
    const resultsMap = new Map<string, any>();

    // 1. Check if it's a direct document ID match
    try {
      const directDocRef = doc(db, 'profiles', trimmed);
      const directSnap = await getDoc(directDocRef);
      if (directSnap.exists()) {
        resultsMap.set(directSnap.id, { id: directSnap.id, ...directSnap.data() });
      }
    } catch (e) {
      console.warn("Direct ID lookup bypassed:", e);
    }

    // 2. Query by username prefix
    try {
      const q1 = query(
        collection(db, 'profiles'),
        where('username', '>=', trimmed.toLowerCase()),
        where('username', '<=', trimmed.toLowerCase() + '\uf8ff'),
        limit(20)
      );
      const snap1 = await getDocs(q1);
      snap1.forEach(doc => {
        resultsMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
    } catch (e) {
      console.warn("Username query bypassed:", e);
    }

    // 3. Query by displayName prefix
    try {
      const q2 = query(
        collection(db, 'profiles'),
        where('displayName', '>=', trimmed),
        where('displayName', '<=', trimmed + '\uf8ff'),
        limit(20)
      );
      const snap2 = await getDocs(q2);
      snap2.forEach(doc => {
        resultsMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
    } catch (e) {
      console.warn("Display name query bypassed:", e);
    }

    // Filter out items with undefined/missing fields
    return Array.from(resultsMap.values());
  };

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('aeirmist_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const saveRecentSearch = useCallback((text: string) => {
    if (!text.trim()) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== text.toLowerCase());
      const next = [text, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('aeirmist_recent_searches', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('aeirmist_recent_searches');
    } catch (e) {}
  }, []);

  const globalSearch = async (text: string) => {
    if (!db) return { users: [], posts: [], stories: [], notes: [], products: [], videos: [], groups: [], pages: [], shops: [], messages: [] };
    const trimmed = text.trim();
    if (!trimmed) return { users: [], posts: [], stories: [], notes: [], products: [], videos: [], groups: [], pages: [], shops: [], messages: [] };

    // Check Cache
    const cached = searchCache[trimmed.toLowerCase()];
    if (cached && (Date.now() - cached.timestamp < 300000)) { // 5 minute cache
      return cached.results;
    }

    const queries = [
      // Users
      (async () => {
        try {
          return await searchUsers(trimmed);
        } catch (e) {
          console.warn("Global Search: Users failed", e);
          return [];
        }
      })(),
      // Posts (Tags)
      (async () => {
        try {
          const q = query(collection(db, 'posts'), where('tags', 'array-contains', trimmed.toLowerCase()), limit(10));
          const snap = await getDocs(q);
          return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e: any) {
          return [];
        }
      })(),
      // Posts (Location)
      (async () => {
        try {
          const q = query(
            collection(db, 'posts'),
            where('location', '>=', trimmed),
            where('location', '<=', trimmed + '\uf8ff'),
            limit(10)
          );
          const snap = await getDocs(q);
          return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e: any) {
          return [];
        }
      })(),
      // Stories
      (async () => {
        try {
          const q = query(
            collection(db, 'stories'),
            where('content', '>=', trimmed),
            where('content', '<=', trimmed + '\uf8ff'),
            limit(10)
          );
          const snap = await getDocs(q);
          return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((s: any) => s.audience === 'public');
        } catch (e: any) {
          return [];
        }
      })(),
      // Notes
      (async () => {
        try {
          const q = query(
            collection(db, 'notes'),
            where('content', '>=', trimmed),
            where('content', '<=', trimmed + '\uf8ff'),
            limit(10)
          );
          const snap = await getDocs(q);
          return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((n: any) => n.audience === 'public');
        } catch (e: any) {
          return [];
        }
      })(),
      // Products (Name)
      (async () => {
        try {
          const q = query(
            collection(db, 'products'),
            where('name', '>=', trimmed),
            where('name', '<=', trimmed + '\uf8ff'),
            limit(10)
          );
          const snap = await getDocs(q);
          return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e: any) {
          return [];
        }
      })(),
      // Videos
      (async () => {
        try {
          const q = query(
            collection(db, 'videos'),
            where('caption', '>=', trimmed),
            where('caption', '<=', trimmed + '\uf8ff'),
            limit(10)
          );
          const snap = await getDocs(q);
          return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e: any) {
          return [];
        }
      })(),
      // Groups / Clusters
      (async () => {
        try {
          const q = query(
            collection(db, 'groups'),
            where('name', '>=', trimmed),
            where('name', '<=', trimmed + '\uf8ff'),
            limit(10)
          );
          const snap = await getDocs(q);
          return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e: any) {
          return [];
        }
      })(),
      // Pages
      (async () => {
        try {
          const q = query(
            collection(db, 'pages'),
            where('name', '>=', trimmed),
            where('name', '<=', trimmed + '\uf8ff'),
            limit(10)
          );
          const snap = await getDocs(q);
          return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e: any) {
          return [];
        }
      })(),
      // Shops / Stores
      (async () => {
        try {
          const q = query(
            collection(db, 'stores'),
            where('name', '>=', trimmed),
            where('name', '<=', trimmed + '\uf8ff'),
            limit(10)
          );
          const snap = await getDocs(q);
          return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e: any) {
          return [];
        }
      })(),
      // Messages (Conversations)
      (async () => {
        if (!profile) return [];
        try {
          const q = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', profile.id),
            orderBy('updatedAt', 'desc'),
            limit(50)
          );
          const snap = await getDocs(q);
          return snap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((c: any) => {
              const lastMsg = (c.lastMessage || '').toLowerCase();
              const otherName = (c.otherParticipantName || '').toLowerCase();
              const term = trimmed.toLowerCase();
              return lastMsg.includes(term) || otherName.includes(term);
            })
            .slice(0, 10);
        } catch (e: any) {
          console.warn("Global Search: Messages failed", e);
          return [];
        }
      })()
    ];

    const [
      users,
      postsByTag,
      postsByLoc,
      stories,
      notes,
      products,
      videos,
      groups,
      pages,
      shops,
      messages
    ] = await Promise.all(queries);

    const postMap = new Map();
    [...postsByTag, ...postsByLoc].forEach(p => postMap.set(p.id, p));

    const results = {
      users,
      posts: Array.from(postMap.values()),
      stories,
      notes,
      products,
      videos,
      groups,
      pages,
      shops,
      messages
    };

    setSearchCache(prev => ({
      ...prev,
      [trimmed.toLowerCase()]: { results, timestamp: Date.now() }
    }));

    return results;
  };

  const deleteMessage = useCallback(async (conversationId: string, messageId: string, deleteType: 'me' | 'everyone' = 'everyone') => {
    if (!db || !profile) return;
    if (!canWrite(`deleteMsg_${messageId}`, 1000)) return;

    try {
      await messagingService.deleteMessage(db, conversationId, messageId, profile.id, deleteType);
      console.log(`[Delete Message Successful] Type: ${deleteType}`, { conversationId, messageId });
    } catch (e) {
      console.error('[Delete Message Failed]', e);
      addToast({
        title: "Operation Failed",
        message: `Failed to delete message. Please check your connection.`,
        type: "warning"
      });
      handleFirestoreError(e, OperationType.UPDATE, `conversations/${conversationId}/messages/${messageId}`);
    }
  }, [db, profile?.id, canWrite, addToast]);

  const editMessage = useCallback(async (conversationId: string, messageId: string, newText: string) => {
    if (!db || !canWrite(`editMsg_${messageId}`, 1000)) return;
    try {
      await messagingService.editMessage(db, conversationId, messageId, newText);
    } catch (e) {
      console.error("Edit message failed", e);
      addToast({
        title: "Edit Failed",
        message: "Failed to update message.",
        type: "warning"
      });
    }
  }, [db, canWrite, addToast]);

  const clearChat = async (conversationId: string, clearType: 'me' | 'both') => {
    console.log(`[Clear Chat Initiated] Type: ${clearType}`, { conversationId });
    if (!db || !profile) return;
    if (isSafeMode) {
      console.log(`[Clear Chat Sandbox Bypass / No DB] Type: ${clearType}`, { conversationId });
      return;
    }
    if (!canWrite(`clearChat_${conversationId}`, 1000)) {
      console.warn(`[Clear Chat Throttled]`, { conversationId });
      return;
    }
    try {
      if (clearType === 'me') {
        await updateDoc(doc(db, 'conversations', conversationId), {
          [`clearedAt.${profile.id}`]: serverTimestamp(),
          [`unreadCount.${profile.id}`]: 0
        });
        console.log(`[Clear Chat Successful] Type: ${clearType}`, { conversationId });
      } else {
        const msgCol = collection(db, 'conversations', conversationId, 'messages');
        const snap = await getDocs(msgCol);
        const batch = writeBatch(db);
        snap.docs.forEach((d) => {
          batch.delete(d.ref);
        });
        batch.update(doc(db, 'conversations', conversationId), {
          lastMessage: {
            text: 'Buffer cleared.',
            senderId: profile.id,
            timestamp: serverTimestamp(),
            type: 'text'
          }
        });
        await batch.commit();
        console.log(`[Clear Chat Successful] Type: ${clearType} (All messages deleted, metadata updated)`, { conversationId });
      }
    } catch (e) {
      console.error(`[Clear Chat Failed] Type: ${clearType}`, e);
      handleFirestoreError(e, OperationType.UPDATE, `conversations/${conversationId}`);
    }
  };

  const togglePinMessage = async (conversationId: string, messageId: string, messageText: string, isPinned: boolean) => {
    if (!db || !canWrite(`pinMsg_${conversationId}`, 1000)) return;
    try {
      const convRef = doc(db, 'conversations', conversationId);
      await updateDoc(convRef, {
        pinnedMessage: isPinned ? deleteField() : { id: messageId, text: messageText, senderId: profile?.id }
      });
    } catch (e) {
      console.error("Toggle pin message failed", e);
    }
  };

  const toggleLike = async (postId: string, isLiked: boolean, postAuthorId?: string) => {
    if (!db || !profile || !canWrite(`like_${postId}`, 5000)) return;
    try {
      await updateDoc(doc(db, 'posts', postId), {
        likesCount: increment(isLiked ? -1 : 1),
        likedBy: isLiked ? arrayRemove(profile.id) : arrayUnion(profile.id),
        updatedAt: serverTimestamp()
      });
      if (!isLiked) {
        await earnPoints(REWARDS.LIKE_GIVEN);
        
        // Notify post author
        let targetAuthorId = postAuthorId;
        if (!targetAuthorId) {
          try {
            const postDoc = await getDoc(doc(db, 'posts', postId));
            if (postDoc.exists()) {
              const d = postDoc.data();
              targetAuthorId = d.authorId || d.userId || d.author?.id || d.author?.uid;
            }
          } catch (e) {}
        }

        if (targetAuthorId && targetAuthorId !== profile.id) {
          await createNotification(
            targetAuthorId,
            'like',
            `${profile.displayName || profile.username || 'Someone'} liked your post.`,
            { postId }
          );
        }
      }
    } catch (e) {
      console.warn("Like toggle failed", e);
    }
  };

  const toggleBookmark = async (postId: string, isBookmarked: boolean) => {
    if (!db || !profile || !canWrite(`bookmark_${postId}`, 5000)) return;
    try {
      await updateDoc(doc(db, 'posts', postId), {
        savedBy: isBookmarked ? arrayRemove(profile.id) : arrayUnion(profile.id),
        updatedAt: serverTimestamp()
      });
      if (!isBookmarked) {
        await earnPoints(5);
      }
    } catch (e) {
      console.warn("Bookmark toggle failed", e);
    }
  };

  const submitReport = async (params: {
    targetType: 'post' | 'user' | 'comment' | 'message' | 'story' | 'conversation';
    targetId: string;
    reason: string;
    description?: string;
  }): Promise<boolean> => {
    if (!db || !user || !profile) {
      addToast({ title: 'Not signed in', message: 'You need to be signed in to report content.', type: 'warning' });
      return false;
    }
    if (!canWrite(`report_${params.targetType}_${params.targetId}`, 10000)) {
      addToast({ title: 'Already reported', message: "You've already reported this recently.", type: 'info' });
      return false;
    }
    try {
      await addDoc(collection(db, 'reports'), {
        reporterId: user.uid,
        targetType: params.targetType,
        targetId: params.targetId,
        reason: params.reason,
        description: params.description || '',
        status: 'pending',
        timestamp: serverTimestamp()
      });
      addToast({ title: 'Report submitted', message: "Thanks — our team will review this.", type: 'success' });
      return true;
    } catch (e) {
      console.warn("Report submission failed", e);
      addToast({ title: 'Report failed', message: "Couldn't submit your report. Please try again.", type: 'warning' });
      return false;
    }
  };

  const clearCache = async () => {
    await aeirmistCache.clearAll();
  };

  const requestPermission = async (type: any) => {
    const granted = await _requestPermission(type);
    if (!granted) {
      addToast({
        title: "Permission Denied",
        message: `Please allow ${type} access in your browser, or open the app in a new tab if you are using an iframe.`,
        type: "warning"
      });
    }
    return granted;
  };

  const addReaction = async (conversationId: string, messageId: string, newEmoji: string, oldEmoji?: string) => {
    if (!db || !profile || !canWrite(`reaction_${messageId}_${newEmoji}`, 5000)) return;
    try {
      const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
      const updates: any = {
        [`userReactions.${profile.uid}`]: newEmoji,
        [`reactions.${newEmoji}`]: increment(1)
      };
      if (oldEmoji) {
        updates[`reactions.${oldEmoji}`] = increment(-1);
      }
      await updateDoc(msgRef, updates);
    } catch (e) {
      console.warn("Reaction addition failed", e);
    }
  };

  const removeReaction = async (conversationId: string, messageId: string, emoji: string) => {
    if (!db || !profile || !canWrite(`reaction_remove_${messageId}_${emoji}`, 5000)) return;
    try {
      const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
      await updateDoc(msgRef, {
        [`reactions.${emoji}`]: increment(-1),
        [`userReactions.${profile.uid}`]: ""
      });
    } catch (e) {
      console.warn("Reaction removal failed", e);
    }
  };

  const value = React.useMemo(() => {
    // TEMPORARY: Full Feature Unlock Override (Sandbox Mode)
    // This forces premium and verified flags to true so all UI features remain open.
    // Real Stripe data will take precedence if these flags were already in the profile,
    // but here we ensure they are at least true for the UI.
    return {
      user,
      account,
      profile,
      allProfiles,
    activeProfileId,
    loading, 
    db, 
    auth, 
    storage,
    lastAuthError,
    setLastAuthError,
    login, 
    loginWithProvider,
    linkAccountMethod,
    unlinkAccountMethod,
    requestDeleteAccount,
    cancelDeleteAccount,
    logActivity,
    pendingLinkEmail,
    setPendingLinkEmail,
    pendingLinkCredential,
    setPendingLinkCredential,
    isScheduledForPurge,
    loginWithEmail,
    loginAsGuestSandbox,
    signupWithEmail,
    completeSignup,
    resetPassword,
    logout,
    updateProfile,
    refreshProfile,
    reloadAuthUser,
    updateUserStatus,
    suspendUser,
    deleteAccount,
    purgeUser,
    toggleUserBan,
    toggleVerification,
    checkUsernameAvailable,
    registerUsername,
    switchProfile,
    toggleFollow,
    isFollowing,
    isFollowPending,
    acceptFollowRequest,
    rejectFollowRequest,
    getFollowers,
    getFollowing,
    searchUsers,
    globalSearch,
    recentSearches,
    saveRecentSearch,
    clearRecentSearches,
    toggleLike,
    toggleBookmark,
    createPost,
    editPost,
    deletePost,
    archivePost,
    editVideo,
    deleteVideo,
    sendMessage,
    markAsRead,
    markAsUnread,
    updateSeenStatus,
    setTypingStatus,
    goOnline,
    goOffline,
    onlineUsers,
    activeCall,
    callStream,
    remoteStream,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    createNotification,
    submitReport,
    toggleNotification,
    setConversationTheme,
    updateConversationThemeSettings,
    toggleVanishMode,
    toggleBlockUser,
    toggleRestrictUser,
    deleteConversation,
    toggleCloseFriend,
    isCloseFriend,
    isBlocked,
    isRestricted,
    isNavHidden,
    setIsNavHidden,
    suggestedUsers,
    dismissSuggestion,
    getUserInterests,
    saveUserInterests,
    needsUsername,
    setNeedsUsername,
    tempUsername,
    setTempUsername,
    localAvatarURL,
    localCoverURL,
    profileUploadProgress,
    coverUploadProgress,
    setLocalAvatarURL,
    setLocalCoverURL,
    setProfileUploadProgress,
    setCoverUploadProgress,
    uploadMedia,
    mediaSettings,
    setMediaSettings,
    clearCache,
    isSetup,
    isConnecting,
    connectionError,
    setConnectionError,
    canWrite,
    isOffline,
    earnPoints,
    rank,
    cameraConfig,
    setCameraConfig,
    storyUpload,
    setStoryUpload,
    optimisticStories,
    stories,
    publishStory,
    deleteStory,
    analytics,
    unreadMessagesCount,
    unreadNotificationsCount,
    toasts,
    addToast,
    removeToast,
    permissions,
    requestPermission,
    pendingPermission,
    setPendingPermission,
    _requestPermission,
    addReaction,
    removeReaction,
    deleteMessage,
    editMessage,
    clearChat,
    togglePinMessage,
    deviceLinkingStatus,
    generateDeviceLink,
    consumePairingCode,
    isSafeMode,
    setIsSafeMode,
    needsPasswordOnboarding,
    setNeedsPasswordOnboarding,
    featureFlags,
    updateFeatureFlag
    };
  }, [
    user, account, profile, allProfiles, activeProfileId, loading, db, auth, storage, lastAuthError,
    featureFlags, updateFeatureFlag,
    login, loginWithProvider, linkAccountMethod, unlinkAccountMethod, requestDeleteAccount, cancelDeleteAccount, logActivity, pendingLinkEmail, pendingLinkCredential, isScheduledForPurge, loginWithEmail, loginAsGuestSandbox, signupWithEmail, completeSignup, resetPassword, logout,
    refreshProfile, reloadAuthUser,
    updateProfile, deleteAccount, purgeUser, toggleUserBan, toggleVerification, checkUsernameAvailable, registerUsername, switchProfile, toggleFollow,
    isFollowing, searchUsers, globalSearch, toggleLike, toggleBookmark, createPost, editPost, deletePost, archivePost, sendMessage,
    markAsRead, updateSeenStatus, setTypingStatus, goOnline, goOffline,
    onlineUsers, activeCall, callStream, remoteStream, startCall, acceptCall, rejectCall, endCall, createNotification, submitReport, toggleNotification, setConversationTheme, updateConversationThemeSettings, toggleVanishMode, toggleBlockUser, toggleRestrictUser, deleteConversation, toggleCloseFriend, isCloseFriend, isBlocked, isRestricted,
    suggestedUsers, needsUsername, setNeedsUsername, isSetup, isConnecting, connectionError, setConnectionError, isOffline, canWrite,
    cameraConfig, setCameraConfig,
    storyUpload, setStoryUpload,
    optimisticStories,
    stories,
    publishStory,
    deleteStory,
    analytics,
    unreadMessagesCount, unreadNotificationsCount, toasts, addToast, removeToast,
    permissions, requestPermission, pendingPermission, setPendingPermission, _requestPermission,
    uploadMedia, mediaSettings, setMediaSettings, clearCache, addReaction, removeReaction,
    clearChat, togglePinMessage, deleteMessage, editMessage,
    deviceLinkingStatus, generateDeviceLink, consumePairingCode,
    localAvatarURL, localCoverURL, profileUploadProgress, coverUploadProgress,
    isSafeMode, setIsSafeMode, needsPasswordOnboarding, setNeedsPasswordOnboarding
  ]);

  return (
    <AeirmistContext.Provider value={value}>
      {children}
    </AeirmistContext.Provider>
  );
};

export const useAeirmist = () => {
  const context = useContext(AeirmistContext);
  if (context === undefined) {
    throw new Error('useAeirmist must be used within an AeirmistProvider');
  }
  return context;
};
