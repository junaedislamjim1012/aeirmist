import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, EyeOff, Loader2, Chrome, AlertCircle, Check, ArrowLeft, QrCode,
  Sparkles, ShieldCheck, Mail, User, Lock, Layers, ArrowRight, ShieldAlert,
  HelpCircle, WifiOff
} from 'lucide-react';
import { useAeirmist } from '../../context/AeirmistContext';
import { useTheme } from '../../context/ThemeContext';
import { analytics } from '../../services/AnalyticsService';
import { AeirmistLogo } from '../ui/AeirmistLogo';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, getDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { mapAuthError } from '../../utils/authErrorMapper';
import { SignupWizard } from './SignupWizard';

type AuthView = 'login' | 'signup' | 'forgot' | 'pairing' | 'reset' | 'saved_accounts' | 'saved_accounts_login' | 'two_factor';

const RuleIndicator = ({ active, label }: { active: boolean | number; label: string }) => (
  <div className="flex items-center gap-2 text-[11px] font-semibold">
    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${active ? 'bg-[var(--color-aeirmist-cyan)] shadow-[0_0_8px_var(--color-aeirmist-cyan)]' : 'bg-white/20'}`} />
    <span className={active ? 'text-white/80' : 'text-white/40'}>{label}</span>
  </div>
);

const FeatureItem = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <motion.div 
    whileHover={{ x: 5 }}
    className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
  >
    <div className="p-2.5 rounded-xl bg-[var(--color-aeirmist-cyan)]/10 text-[var(--color-aeirmist-cyan)]">
      <Icon size={18} />
    </div>
    <div className="space-y-1">
      <h4 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
        {title}
        {title === "Connection Security" && <ShieldCheck className="text-[var(--color-aeirmist-cyan)] shrink-0" size={14} />}
      </h4>
      <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

const DriftingBg = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
    <motion.div
      animate={{
        x: [0, 60, -40, 0],
        y: [0, -70, 50, 0],
        scale: [1, 1.15, 0.9, 1],
      }}
      transition={{
        duration: 30,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(0,242,255,0.06)_0%,transparent_65%)] blur-[80px]"
    />
    <motion.div
      animate={{
        x: [0, -50, 70, 0],
        y: [0, 60, -60, 0],
        scale: [1, 0.9, 1.2, 1],
      }}
      transition={{
        duration: 25,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,0,234,0.04)_0%,transparent_65%)] blur-[70px]"
    />
  </div>
);

export const AuthSystem: React.FC = () => {
  const { activeTheme } = useTheme();
  const { 
    user,
    profile,
    loginWithProvider, 
    loginWithEmail, 
    completeSignup, 
    resetPassword,
    checkUsernameAvailable, 
    loginAsGuestSandbox,
    consumePairingCode,
    connectionError,
    setConnectionError,
    db,
    logout,
    updateProfile
  } = useAeirmist();

  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [pendingUserUid, setPendingUserUid] = useState<string | null>(null);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  const trackLoginSession = async (userUid: string) => {
    try {
      const sessionKey = crypto.randomUUID();
      await addDoc(collection(db, 'login_sessions'), {
        userId: userUid,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        loginAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        revoked: false,
        sessionKey: sessionKey
      });
      localStorage.setItem('aeirmist_session_key', sessionKey);
    } catch (err) {
      console.warn("Failed to track login session:", err);
    }
  };

  interface SavedAccount {
    uid: string;
    username: string;
    displayName: string;
    photoURL: string;
    lastLoginAt: number;
  }

  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<SavedAccount | null>(null);
  const [view, setView] = useState<AuthView>('login');
  
  // Set initial view based on saved accounts in localStorage on mount
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem('aeirmist_saved_accounts');
      const savedList = savedRaw ? JSON.parse(savedRaw) : [];
      if (Array.isArray(savedList) && savedList.length > 0) {
        setSavedAccounts(savedList);
        setView('saved_accounts');
      } else {
        setView('login');
      }
    } catch {
      setView('login');
    }
  }, []);

  const removeSavedAccount = (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const savedRaw = localStorage.getItem('aeirmist_saved_accounts');
      let savedList = savedRaw ? JSON.parse(savedRaw) : [];
      if (Array.isArray(savedList)) {
        const filteredList = savedList.filter((acc: any) => acc.uid !== uid);
        localStorage.setItem('aeirmist_saved_accounts', JSON.stringify(filteredList));
        setSavedAccounts(filteredList);
        if (filteredList.length === 0) {
          setView('login');
        }
      }
    } catch (e) {
      console.warn("Failed to remove saved account:", e);
    }
  };

  const handleSavedAccountLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !selectedAccount) return;
    setError(null);
    setLoading(true);
    try {
      const userCredential = await loginWithEmail(selectedAccount.username, password, true);
      const userUid = (userCredential as any)?.user?.uid || (userCredential as any)?.uid;
      
      if (userUid) {
        const profileSnap = await getDoc(doc(db, 'profiles', `profile_${userUid}`));
        if (profileSnap.exists() && profileSnap.data().twoFactorEnabled) {
          setPendingUserUid(userUid);
          setView('two_factor');
          setLoading(false);
          return;
        }
        await trackLoginSession(userUid);
      }
      
      analytics.trackAuth('login', 'saved_account');
      
      setIsSuccess(true);
      if (navigator.vibrate) navigator.vibrate([30, 50]);
      await new Promise(resolve => setTimeout(resolve, 1200));
    } catch (err: any) {
      setError(getContextualError(err.message || err.code));
      setShakeActive(true);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      setTimeout(() => setShakeActive(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !pendingUserUid || !twoFactorCode) return;
    
    setError(null);
    setTwoFactorError(null);
    setLoading(true);
    
    try {
      // 1. Fetch user profile
      const profileSnap = await getDoc(doc(db, 'profiles', `profile_${pendingUserUid}`));
      if (!profileSnap.exists()) {
        throw new Error("Profile Sync failed.");
      }
      
      const profileData = profileSnap.data();
      const hashes = profileData.backupCodeHashes || [];
      const used = profileData.backupCodesUsed || [];
      
      // 2. Hash the entered code
      const msgUint8 = new TextEncoder().encode(twoFactorCode.trim().toUpperCase());
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // 3. Check validity
      if (hashes.includes(hashHex) && !used.includes(hashHex)) {
        // Valid code
        await updateDoc(doc(db, 'profiles', `profile_${pendingUserUid}`), {
          backupCodesUsed: arrayUnion(hashHex)
        });
        
        await trackLoginSession(pendingUserUid);
        setIsSuccess(true);
        if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
        await new Promise(resolve => setTimeout(resolve, 1200));
      } else {
        setTwoFactorError("Invalid or expired backup code.");
      }
    } catch (err: any) {
      console.error("2FA Verification Error:", err);
      setTwoFactorError(err.message || "Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Multi-step form controllers
  const [signupStep, setSignupStep] = useState(1);
  const [forgotStep, setForgotStep] = useState(1);
  const [resetStep, setResetStep] = useState(1);
  const [resetCode, setResetCode] = useState<string | null>(null);

  // Signup specific fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Remember Me support
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return localStorage.getItem('aeirmist_remember_me') === 'true';
    } catch {
      return false;
    }
  });

  // Security UI additions
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [shakeActive, setShakeActive] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Loading & success messages
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pairing inputs state
  const [pairingCodeArray, setPairingCodeArray] = useState<string[]>(Array(6).fill(''));

  const RESERVED_USERNAMES = ['admin', 'aeirmist', 'support', 'help', 'system', 'moderator', 'root', 'guest', 'sandbox'];

  // Restore remembered credentials on mount
  useEffect(() => {
    try {
      if (rememberMe) {
        const savedIdentifier = localStorage.getItem('aeirmist_saved_username');
        if (savedIdentifier) {
          setIdentifier(savedIdentifier);
        }
      }
    } catch {}
  }, []);

  // Sync internet status listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Parse action code on mount for direct reset flow redirects
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const oobCode = params.get('oobCode');
      const mode = params.get('mode');
      if (oobCode && mode === 'resetPassword') {
        setResetCode(oobCode);
        setView('reset');
        setResetStep(1);
      }
    } catch (e) {
      console.warn("Failed to parse reset credentials link:", e);
    }
  }, []);

  // Username validation debouncer
  useEffect(() => {
    if (view !== 'signup' || username.length < 3) {
      setUsernameStatus('idle');
      setUsernameError(null);
      return;
    }

    if (RESERVED_USERNAMES.includes(username)) {
      setUsernameStatus('taken');
      setUsernameError("This username is restricted by Security.");
      return;
    }

    if (!/^[a-z0-9_]*$/.test(username)) {
      setUsernameStatus('taken');
      setUsernameError("May only contain lowercase letters, numbers, and underscores.");
      return;
    }

    setUsernameError(null);
    const timer = setTimeout(async () => {
      setUsernameStatus('checking');
      try {
        const result = await checkUsernameAvailable(username);
        if (result.available) {
          setUsernameStatus('available');
        } else {
          setUsernameStatus('taken');
          setUsernameError("This username is already initialized.");
        }
      } catch (e) {
        setUsernameStatus('idle');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, checkUsernameAvailable, view]);

  // Real-time strength calculation for credentials
  const rules = {
    length: password.length >= 8 && password.length <= 64,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(password),
  };
  const strength = Object.values(rules).filter(Boolean).length;
  const isSignupValid = usernameStatus === 'available' && strength === 5 && identifier && fullName && password === confirmPassword;

  const getContextualError = (rawErr: string | null): string | null => {
    if (!rawErr) return null;
    return mapAuthError(rawErr);
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState('CapsLock')) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const userCredential = await loginWithEmail(identifier, password, true);
      const userUid = (userCredential as any)?.user?.uid || (userCredential as any)?.uid;
      
      if (userUid) {
        const profileSnap = await getDoc(doc(db, 'profiles', `profile_${userUid}`));
        if (profileSnap.exists() && profileSnap.data().twoFactorEnabled) {
          setPendingUserUid(userUid);
          setView('two_factor');
          setLoading(false);
          return;
        }
        await trackLoginSession(userUid);
      }

      analytics.trackAuth('login', 'email');
      
      // Save Remember Me parameters
      try {
        if (rememberMe) {
          localStorage.setItem('aeirmist_remember_me', 'true');
          localStorage.setItem('aeirmist_saved_username', identifier);
        } else {
          localStorage.removeItem('aeirmist_remember_me');
          localStorage.removeItem('aeirmist_saved_username');
        }
      } catch {}

      setIsSuccess(true);
      if (navigator.vibrate) navigator.vibrate([30, 50]);
      await new Promise(resolve => setTimeout(resolve, 1200));
    } catch (err: any) {
      setError(getContextualError(err.message || err.code));
      setShakeActive(true);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      setTimeout(() => setShakeActive(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !isSignupValid) return;
    setError(null);
    setLoading(true);
    try {
      const userCredential = await completeSignup(identifier, password, username, fullName, null, null);
      const userUid = (userCredential as any)?.uid || (userCredential as any)?.user?.uid;
      if (userUid) await trackLoginSession(userUid);

      analytics.trackAuth('signup', 'email');
      setIsSuccess(true);
      setSignupStep(3);
      if (navigator.vibrate) navigator.vibrate([30, 50, 80]);
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (err: any) {
      setError(getContextualError(err.message || err.code));
      setSignupStep(1); // Drop back to Step 1 to let them resolve errors
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !identifier) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await resetPassword(identifier);
      setForgotStep(2);
      analytics.trackEvent({ action: 'password_reset_request', category: 'Auth' });
    } catch (err: any) {
      setError(getContextualError(err.message || err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleDirectResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !resetCode || strength < 5 || password !== confirmPassword) return;
    setError(null);
    setLoading(true);
    try {
      await confirmPasswordReset(auth, resetCode, password);
      setResetStep(2);
      if (navigator.vibrate) navigator.vibrate([50, 100]);
    } catch (err: any) {
      setError(getContextualError(err.message || err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (providerName: 'google') => {
    setError(null);
    setLoading(true);
    try {
      const userCredential = await loginWithProvider(providerName);
      const userUid = (userCredential as any)?.user?.uid || (userCredential as any)?.uid;
      
      if (userUid) {
        const profileSnap = await getDoc(doc(db, 'profiles', `profile_${userUid}`));
        if (profileSnap.exists() && profileSnap.data().twoFactorEnabled) {
          setPendingUserUid(userUid);
          setView('two_factor');
          setLoading(false);
          return;
        }
        await trackLoginSession(userUid);
      }

      analytics.trackAuth('login', providerName);
      setIsSuccess(true);
      if (navigator.vibrate) navigator.vibrate([30, 50]);
      await new Promise(resolve => setTimeout(resolve, 1200));
    } catch (err: any) {
      setError(getContextualError(err.message || err.code));
    } finally {
      setLoading(false);
    }
  };

  const handlePairingCodeChange = (index: number, val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    if (!cleanVal) {
      const newArray = [...pairingCodeArray];
      newArray[index] = '';
      setPairingCodeArray(newArray);
      return;
    }
    const newArray = [...pairingCodeArray];
    newArray[index] = cleanVal[cleanVal.length - 1];
    setPairingCodeArray(newArray);
    if (index < 5) {
      document.getElementById(`pair-input-${index + 1}`)?.focus();
    }
  };

  const handleConsumePairingCode = async () => {
    const code = pairingCodeArray.join('');
    if (code.length < 6) return;
    setLoading(true);
    setError(null);
    try {
      await consumePairingCode(code);
      setSuccess("Direct connection established!");
      setIsSuccess(true);
      if (navigator.vibrate) navigator.vibrate([30, 50]);
    } catch (err: any) {
      setError(err.message || "Failed to register pairing link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative min-h-[100dvh] w-full flex overflow-x-hidden ${activeTheme.isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#050505] text-white'}`}>
      
      {/* Universal light animated drifting background */}
      <DriftingBg />

      {/* Dual Pane split-screen layout */}
      <div className="w-full min-h-[100dvh] flex flex-col lg:flex-row">
        
        {/* Left Side: Branding and Features (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 p-10 xl:p-16 flex-col justify-between relative border-r border-white/5 bg-gradient-to-br from-black/20 to-transparent">
          {/* subtle grid background overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,242,255,0.02),rgba(255,255,255,0))]" />
          
          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <AeirmistLogo className="w-12 h-12 drop-shadow-[0_0_20px_rgba(0,242,255,0.4)]" variant="compact" />
              <div className="h-6 w-px bg-white/10" />
              <span className="text-[10px] tracking-[0.2em] font-mono text-white/40 uppercase">Global Device</span>
            </div>
            
            <div className="space-y-1.5 pt-8">
              <h1 className="font-display font-black text-4xl xl:text-5xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-aeirmist-cyan)] to-[var(--color-aeirmist-magenta)] drop-shadow-[0_0_35px_rgba(0,242,255,0.25)]">
                AEIRMIST
              </h1>
              <p className="text-xs font-mono uppercase tracking-[0.3em] text-white/30">Communication Platform</p>
            </div>
          </div>

          <div className="relative space-y-4 xl:space-y-5 max-w-md my-auto">
            <FeatureItem 
              icon={Sparkles} 
              title="App Theme" 
              desc="Immerse in your saved Social Platform, crafted with dynamic themes, spatial audio, and smooth animations."
            />
            <FeatureItem 
              icon={Layers} 
              title="Decentralized Connections" 
              desc="Exchange rich media, audio tracks, and story boards with private, optimized private connections."
            />
            <FeatureItem 
              icon={Lock} 
              title="Connection Security" 
              desc="Establish hardware-level pairings and multi-device Sync with zero-trust local overrides."
            />
          </div>

          <div className="relative text-[10px] font-mono uppercase tracking-widest text-white/20">
            System Network: ACTIVE // LATENCY 12MS
          </div>
        </div>

        {/* Right Side: Interactive Auth Cards & Notices */}
        <div className="flex-1 flex flex-col items-center px-3.5 sm:px-6 lg:px-12 xl:px-16 py-6 sm:py-10 overflow-y-auto z-10 relative w-full min-h-[100dvh]">
          
          {/* Keyboard safe, responsive card container */}
          <div className="w-full max-w-[460px] flex flex-col items-center my-auto py-2">
            
            {/* Mobile Header Branding (Shown on small devices only) */}
            <div className="lg:hidden flex flex-col items-center text-center mb-4 sm:mb-6">
              <AeirmistLogo className="w-11 h-11 sm:w-14 sm:h-14 drop-shadow-[0_0_25px_rgba(0,242,255,0.55)] mb-2 sm:mb-3" variant="compact" />
              <h1 className="font-display font-black text-xl sm:text-2xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-aeirmist-cyan)] to-[var(--color-aeirmist-magenta)]">
                AEIRMIST
              </h1>
              <span className="text-[9px] tracking-widest font-mono text-white/30 uppercase mt-0.5">Aeirmist User Entry</span>
            </div>

            {/* Offline Alert */}
            {!isOnline && (
              <div className="w-full bg-amber-500/10 border border-amber-500/15 p-3 rounded-2xl flex items-center gap-2.5 text-amber-500 text-[11px] font-bold uppercase tracking-wider mb-3 sm:mb-4 animate-pulse">
                <WifiOff size={15} className="shrink-0" />
                <span>Connection interrupted. Running in offline mode.</span>
              </div>
            )}

            {/* Main Interactive Motion Card */}
            <motion.div 
              variants={{
                shake: { x: [0, -10, 10, -10, 10, -5, 5, 0], transition: { duration: 0.4 } },
                idle: { x: 0 }
              }}
              animate={shakeActive ? "shake" : "idle"}
              className={`w-full overflow-hidden rounded-[22px] sm:rounded-[28px] border ${
                activeTheme.isLight 
                  ? 'bg-white/80 border-slate-200/60 shadow-[0_20px_50px_rgba(15,23,42,0.08)]' 
                  : 'bg-[#0b0d12]/85 border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.65)]'
              } p-4 sm:p-7 backdrop-blur-2xl transition-all duration-300 relative`}
            >
              
              {/* Card Title Header */}
              {view === 'login' && (
                <div className="mb-4 sm:mb-6 flex flex-col items-start border-b border-white/5 pb-3 sm:pb-4">
                  <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider">Welcome Back</h2>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-aeirmist-cyan)]">Continue your Loop.</p>
                </div>
              )}

              {/* Status Notifications */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }} 
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs flex items-start gap-2.5"
                  >
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <p className="font-semibold leading-relaxed">{getContextualError(error)}</p>
                  </motion.div>
                )}

                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }} 
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-4 p-3.5 bg-[var(--color-aeirmist-cyan)]/15 border border-[var(--color-aeirmist-cyan)]/25 rounded-2xl text-[var(--color-aeirmist-cyan)] text-xs flex items-start gap-2.5 shadow-[0_0_15px_rgba(0,242,255,0.05)]"
                  >
                    <Check size={15} className="shrink-0 mt-0.5" />
                    <p className="font-semibold leading-relaxed">{success}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Master View Switches */}
              <AnimatePresence mode="wait">
                
                {/* SAVED ACCOUNTS VIEW */}
                {view === 'saved_accounts' && !isSuccess && (
                  <motion.div
                    key="saved_accounts"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex flex-col gap-5"
                  >
                    <div className="mb-2 flex flex-col items-start border-b border-white/5 pb-4">
                      <h2 className="text-xl font-black uppercase tracking-wider">Saved Users</h2>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-aeirmist-cyan)]">Select a node to establish connection</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 max-h-[280px] overflow-y-auto pr-1">
                      {savedAccounts.map((account) => (
                        <div
                          key={account.uid}
                          onClick={() => {
                            setSelectedAccount(account);
                            setView('saved_accounts_login');
                            setPassword('');
                            setError(null);
                          }}
                          className={`group relative flex items-center gap-3.5 p-3.5 rounded-2xl border ${
                            activeTheme.isLight
                              ? 'bg-white/60 border-slate-200/50 hover:bg-white/90 shadow-[0_4px_20px_rgba(15,23,42,0.02)]'
                              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)]'
                          } transition-all duration-300 cursor-pointer overflow-hidden`}
                        >
                          {/* Cyan glowing glow effect behind avatar */}
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[var(--color-aeirmist-cyan)]/25 blur-md scale-0 group-hover:scale-110 transition-transform duration-300" />
                          
                          <div className="relative shrink-0">
                            <img
                              src={account.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(account.username || 'Aeirmist')}`}
                              alt={account.displayName}
                              className="w-11 h-11 rounded-full object-cover border-2 border-[var(--color-aeirmist-cyan)] shadow-[0_0_12px_rgba(0,242,255,0.2)]"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          <div className="flex-1 min-w-0 space-y-0.5 pr-8">
                            <h4 className="text-sm font-black uppercase tracking-wider truncate text-white">{account.displayName}</h4>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-white/40 group-hover:text-white/60 transition-colors truncate">
                              @{account.username}
                            </p>
                          </div>

                          {/* Quick chevron indicator */}
                          <div className="text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all mr-6">
                            <ArrowRight size={16} />
                          </div>

                          {/* Remove button (X) */}
                          <button
                            type="button"
                            onClick={(e) => removeSavedAccount(account.uid, e)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/5 hover:bg-red-500/20 border border-white/5 hover:border-red-500/30 flex items-center justify-center text-white/40 hover:text-red-400 transition-all z-20 cursor-pointer"
                            title="Remove account"
                          >
                            <span className="text-sm font-semibold leading-none">×</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setView('login');
                        setError(null);
                        setSuccess(null);
                      }}
                      className="w-full py-3.5 text-[10px] font-extrabold uppercase tracking-widest text-white/55 hover:text-white bg-white/5 border border-white/5 hover:bg-white/10 rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      <User size={13} />
                      Use Another Account
                    </button>
                  </motion.div>
                )}

                {/* SAVED ACCOUNT LOGIN SCREEN (PASSWORD ONLY) */}
                {view === 'saved_accounts_login' && selectedAccount && !isSuccess && (
                  <motion.form
                    key="saved_accounts_login"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    onSubmit={handleSavedAccountLogin}
                    className="flex flex-col gap-4"
                  >
                    <div className="mb-2 flex flex-col items-center text-center border-b border-white/5 pb-4">
                      <div className="relative mb-3">
                        {/* Glow back-pulse */}
                        <div className="absolute inset-0 bg-[var(--color-aeirmist-cyan)]/25 rounded-full blur-xl scale-110 animate-pulse" />
                        <img
                          src={selectedAccount.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(selectedAccount.username || 'Aeirmist')}`}
                          alt={selectedAccount.displayName}
                          className="relative w-20 h-20 rounded-full object-cover border-2 border-[var(--color-aeirmist-cyan)] shadow-[0_0_20px_rgba(0,242,255,0.3)]"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <h2 className="text-lg font-black uppercase tracking-wider text-white">{selectedAccount.displayName}</h2>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-aeirmist-cyan)]">Connecting @{selectedAccount.username}</p>
                    </div>

                    <div className="space-y-1.5 relative">
                      <div className="flex justify-between items-center">
                        <label htmlFor="saved-pass-key" className="text-[10px] font-bold uppercase text-white/40 tracking-wider">Pass Key</label>
                        <button
                          type="button"
                          onClick={() => {
                            setView('forgot');
                            setForgotStep(1);
                            setIdentifier(selectedAccount.username); // prefill username/email for recovery
                            setError(null);
                            setSuccess(null);
                          }}
                          className="text-[10px] font-bold uppercase text-[var(--color-aeirmist-cyan)] hover:text-white transition-colors"
                        >
                          Forgot key?
                        </button>
                      </div>
                      
                      <div className="relative rounded-2xl bg-white/[0.03] border border-white/10 focus-within:border-[var(--color-aeirmist-cyan)]/40 transition-colors">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                        <input
                          id="saved-pass-key"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyDown={handlePasswordKeyDown}
                          className="w-full py-3.5 pl-12 pr-12 bg-transparent outline-none text-sm text-white placeholder-white/25"
                          autoFocus
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>

                        {capsLockActive && (
                          <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-amber-500 font-bold uppercase text-[9px] tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25">
                            <span>Caps Lock On</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !password}
                      className="w-full h-11 bg-white text-black font-black rounded-2xl text-xs uppercase tracking-widest transition-opacity hover:opacity-95 disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin text-black" /> : `Log In`}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setView('saved_accounts');
                        setError(null);
                        setSuccess(null);
                      }}
                      className="mt-1 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/50 hover:text-white transition-colors w-full py-3 bg-white/5 border border-white/5 hover:bg-white/10 rounded-2xl cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                      Back to Saved Accounts
                    </button>
                  </motion.form>
                )}
                
                {/* 1. LOGIN VIEW */}
                {view === 'login' && !isSuccess && (
                  <motion.form
                    key="login"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onSubmit={handleLogin}
                    className="flex flex-col gap-4"
                  >
                    <div className="space-y-1.5">
                      <label htmlFor="login-identity" className="text-[10px] font-bold uppercase text-white/40 tracking-wider">Username or Email</label>
                      <div className="relative rounded-2xl bg-white/[0.03] border border-white/10 focus-within:border-[var(--color-aeirmist-cyan)]/40 transition-colors">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                        <input
                          id="login-identity"
                          type="text"
                          name="username"
                          autoComplete="username"
                          autoFocus
                          placeholder="Phone number, username, or email"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          className="w-full py-3.5 pl-12 pr-4 bg-transparent outline-none text-sm text-white placeholder-white/25"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 relative">
                      <div className="flex justify-between items-center">
                        <label htmlFor="login-password" className="text-[10px] font-bold uppercase text-white/40 tracking-wider">Pass Key</label>
                        <button
                          type="button"
                          onClick={() => {
                            setView('forgot');
                            setForgotStep(1);
                            setError(null);
                            setSuccess(null);
                          }}
                          className="text-[10px] font-bold uppercase text-[var(--color-aeirmist-cyan)] hover:text-white transition-colors"
                        >
                          Forgot key?
                        </button>
                      </div>
                      
                      <div className="relative rounded-2xl bg-white/[0.03] border border-white/10 focus-within:border-[var(--color-aeirmist-cyan)]/40 transition-colors">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                        <input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          name="password"
                          autoComplete="current-password"
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyDown={handlePasswordKeyDown}
                          className="w-full py-3.5 pl-12 pr-12 bg-transparent outline-none text-sm text-white placeholder-white/25"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>

                        {/* Caps Lock Alert */}
                        {capsLockActive && (
                          <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-amber-500 font-bold uppercase text-[9px] tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25">
                            <span>Caps Lock On</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Remember Me and Device Pairing Button */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <input 
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded bg-white/5 border border-white/10 flex items-center justify-center transition-all group-hover:border-white/25 ${rememberMe ? 'border-[var(--color-aeirmist-cyan)] bg-[var(--color-aeirmist-cyan)]/10 text-[var(--color-aeirmist-cyan)]' : ''}`}>
                          {rememberMe && <Check size={10} className="stroke-[3]" />}
                        </div>
                        <span className="text-[10px] font-bold uppercase text-white/40 tracking-wider select-none">Remember Me</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setView('pairing');
                          setError(null);
                          setSuccess(null);
                        }}
                        className="text-[10px] font-bold uppercase text-white/40 hover:text-white flex items-center gap-1.5 transition-colors"
                      >
                        <QrCode size={13} />
                        <span>Pair Device</span>
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !identifier || !password}
                      className="w-full h-11 bg-white text-black font-black rounded-2xl text-xs uppercase tracking-widest transition-opacity hover:opacity-95 disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin text-black" /> : "Verify Identity"}
                    </button>

                    <div className="flex items-center my-3">
                      <div className="flex-1 h-px bg-white/5"></div>
                      <span className="px-4 text-[10px] font-bold text-white/20 uppercase tracking-widest">or</span>
                      <div className="flex-1 h-px bg-white/5"></div>
                    </div>

                    {/* Google Sign In Only */}
                    <button
                      type="button"
                      onClick={() => handleSocialLogin('google')}
                      disabled={loading}
                      className="w-full h-11 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-colors disabled:opacity-40 flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <Chrome size={15} />
                      Continue with Google
                    </button>
                  </motion.form>
                )}

                {/* 2. SIGNUP VIEW (Step-based) */}
                {view === 'two_factor' && !isSuccess && (
                  <motion.div
                    key="two_factor"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black uppercase tracking-widest text-white">Connection</h2>
                      <p className="text-xs text-white/40 uppercase tracking-[0.2em] font-bold">Multi-factor authorization required</p>
                    </div>

                    <form onSubmit={handleVerify2FA} className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-white/40 tracking-wider">Digital Backup Code</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-aeirmist-cyan transition-colors">
                              <ShieldCheck size={18} />
                            </div>
                            <input 
                              type="text"
                              required
                              value={twoFactorCode}
                              onChange={(e) => {
                                let val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                                if (val.length === 4 && !val.includes('-')) val = val + '-';
                                setTwoFactorCode(val);
                              }}
                              placeholder="XXXX-XXXX"
                              maxLength={9}
                              className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-aeirmist-cyan/40 transition-all font-mono tracking-widest text-center text-lg uppercase"
                            />
                          </div>
                          {twoFactorError && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-2 text-red-400 text-[10px] font-bold uppercase tracking-wider"
                            >
                              <ShieldAlert size={12} />
                              <span>{twoFactorError}</span>
                            </motion.div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <button 
                          type="submit"
                          disabled={loading || twoFactorCode.length < 9}
                          className="w-full h-14 rounded-2xl bg-aeirmist-cyan text-black font-black uppercase tracking-[0.2em] text-xs shadow-[0_0_20px_rgba(0,242,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
                        >
                          {loading ? <Loader2 className="animate-spin" size={18} /> : (
                            <>
                              <ShieldCheck size={18} />
                              <span>Authorize Access</span>
                            </>
                          )}
                        </button>
                        
                        <button 
                          type="button"
                          onClick={() => {
                            logout();
                            setView('login');
                          }}
                          className="w-full py-4 rounded-2xl border border-white/5 text-white/40 font-bold uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all"
                        >
                          Cancel Connection
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {view === 'signup' && !isSuccess && (
                  <SignupWizard
                    onGoToLogin={() => setView('login')}
                    onComplete={() => {
                      setIsSuccess(true);
                      setTimeout(() => {
                        window.location.reload();
                      }, 400);
                    }}
                  />
                )}

                {/* 3. FORGOT PASSWORD VIEW (Step-based) */}
                {view === 'forgot' && (
                  <motion.form
                    key="forgot"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onSubmit={handleForgot}
                    className="flex flex-col gap-4"
                  >
                    <div className="mb-4 border-b border-white/5 pb-3">
                      <h2 className="text-xl font-black uppercase tracking-wider">Trouble Logging In?</h2>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-aeirmist-cyan)]">Password Recovery</p>
                    </div>

                    <AnimatePresence mode="wait">
                      {forgotStep === 1 ? (
                        <motion.div key="recover-step-1" className="space-y-4">
                          <p className="text-xs text-white/50 leading-relaxed">
                            Enter the registered email, phone, or username. We will send you a link to reset your password.
                          </p>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-white/40 tracking-wider">Node ID / Email</label>
                            <div className="relative rounded-2xl bg-white/[0.03] border border-white/10 focus-within:border-[var(--color-aeirmist-cyan)]/40 transition-colors">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                              <input
                                type="text"
                                placeholder="Enter registered details"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="w-full py-3.5 pl-12 pr-4 bg-transparent outline-none text-sm text-white placeholder-white/25"
                                required
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={loading || !identifier}
                            className="w-full h-11 bg-white text-black font-black rounded-2xl text-xs uppercase tracking-widest hover:opacity-95 disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer mt-2"
                          >
                            {loading ? <Loader2 size={16} className="animate-spin text-black" /> : "Dispatch Reset Key"}
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div key="recover-step-2" className="space-y-4 text-center py-4">
                          <div className="w-14 h-14 rounded-full bg-[var(--color-aeirmist-cyan)]/15 border border-[var(--color-aeirmist-cyan)] flex items-center justify-center mx-auto text-[var(--color-aeirmist-cyan)] mb-2 shadow-[0_0_20px_rgba(0,242,255,0.15)] animate-pulse">
                            <Mail size={24} />
                          </div>
                          <h3 className="text-sm font-black uppercase tracking-wider text-white">Reset Handshake Dispatched</h3>
                          <p className="text-xs text-white/50 leading-relaxed max-w-[320px] mx-auto">
                            A secure, system-signed validation link was sent to your inbox. Click the link inside to Configure a new credentials settings.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="button"
                      onClick={() => {
                        setView('login');
                        setError(null);
                        setSuccess(null);
                      }}
                      className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/50 hover:text-white transition-colors w-full py-3.5 border border-white/5 hover:bg-white/5 rounded-2xl cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                      Back to Login
                    </button>
                  </motion.form>
                )}

                {/* 4. DEVICE PAIRING */}
                {view === 'pairing' && (
                  <motion.div
                    key="pairing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="w-full flex flex-col items-center gap-6"
                  >
                    <div className="text-center space-y-2 border-b border-white/5 pb-3 w-full">
                      <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2 text-white border border-white/10">
                        <QrCode size={26} />
                      </div>
                      <h2 className="text-lg font-black uppercase tracking-wider text-white">Pair Secure Node</h2>
                      <p className="text-xs text-white/50 leading-relaxed">Enter the 6-digit handshake sequence displayed on your primary screen.</p>
                    </div>

                    <div className="flex justify-center gap-1.5 sm:gap-2.5 max-w-full overflow-x-auto py-1">
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <input
                          key={idx}
                          id={`pair-input-${idx}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={pairingCodeArray[idx]}
                          onChange={(e) => handlePairingCodeChange(idx, e.target.value)}
                          className="w-9 sm:w-11 h-12 sm:h-14 text-center text-base sm:text-lg font-black bg-white/[0.03] border border-white/10 rounded-xl sm:rounded-2xl text-white focus:outline-none focus:border-[var(--color-aeirmist-cyan)] transition-colors font-mono shrink-0"
                        />
                      ))}
                    </div>

                    <div className="flex gap-3 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          setView('login');
                          setError(null);
                          setSuccess(null);
                        }}
                        className="flex-1 h-11 bg-white/5 border border-white/5 hover:bg-white/10 text-white font-bold rounded-2xl text-xs uppercase tracking-widest transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConsumePairingCode}
                        disabled={loading || pairingCodeArray.join('').length < 6}
                        className="flex-2 h-11 bg-[var(--color-aeirmist-cyan)] text-black font-black rounded-2xl text-xs uppercase tracking-widest transition-opacity hover:opacity-95 disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {loading ? <Loader2 size={16} className="animate-spin text-black" /> : "Verify Handshake"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 5. DIRECT RESET PASSWORD (URL oobCode Triggered Flow) */}
                {view === 'reset' && (
                  <motion.form
                    key="reset"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    onSubmit={handleDirectResetSubmit}
                    className="flex flex-col gap-4"
                  >
                    <div className="mb-4 border-b border-white/5 pb-3">
                      <h2 className="text-xl font-black uppercase tracking-wider">New Password</h2>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-aeirmist-cyan)]">
                        {resetStep === 1 ? "Secure your connection" : "Connection updated"}
                      </p>
                    </div>

                    <AnimatePresence mode="wait">
                      {resetStep === 1 ? (
                        <motion.div key="reset-input-panel" className="space-y-4 animate-fade-in">
                          <p className="text-xs text-white/50 leading-relaxed">
                            Please configure a high-entropy password credential to secure your network access point.
                          </p>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-white/40 tracking-wider">New Pass Key</label>
                            <div className="relative rounded-2xl bg-white/[0.03] border border-white/10 focus-within:border-[var(--color-aeirmist-cyan)]/40 transition-colors">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                              <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full py-3.5 pl-12 pr-12 bg-transparent outline-none text-sm text-white placeholder-white/25"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1"
                              >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-white/40 tracking-wider">Confirm Pass Key</label>
                            <div className="relative rounded-2xl bg-white/[0.03] border border-white/10 focus-within:border-[var(--color-aeirmist-cyan)]/40 transition-colors">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full py-3.5 pl-12 pr-12 bg-transparent outline-none text-sm text-white placeholder-white/25"
                                required
                              />
                            </div>
                          </div>

                          {password && (
                            <div className="space-y-3 p-1">
                              <div className="flex gap-1.5">
                                {[1, 2, 3, 4, 5].map((level) => (
                                  <div key={level} className={`h-1 rounded-full flex-1 transition-all duration-300 ${strength >= level ? 'bg-[var(--color-aeirmist-cyan)] shadow-[0_0_8px_var(--color-aeirmist-cyan)]' : 'bg-white/10'}`} />
                                ))}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/5">
                                <RuleIndicator active={rules.length} label="8 to 64 characters" />
                                <RuleIndicator active={rules.uppercase} label="Uppercase (A-Z)" />
                                <RuleIndicator active={rules.lowercase} label="Lowercase (a-z)" />
                                <RuleIndicator active={rules.number} label="At least one number" />
                                <RuleIndicator active={rules.special} label="Special symbol" />
                              </div>
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={loading || strength < 5 || password !== confirmPassword}
                            className="w-full h-11 bg-white text-black font-black rounded-2xl text-xs uppercase tracking-widest transition-opacity hover:opacity-95 disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer mt-2"
                          >
                            {loading ? <Loader2 size={16} className="animate-spin text-black" /> : "Confirm Reset Key"}
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div key="reset-success-panel" className="space-y-4 text-center py-4 animate-fade-in">
                          <div className="w-14 h-14 rounded-full bg-[var(--color-aeirmist-cyan)]/15 border border-[var(--color-aeirmist-cyan)] flex items-center justify-center mx-auto text-[var(--color-aeirmist-cyan)] mb-2 shadow-[0_0_20px_rgba(0,242,255,0.15)] animate-pulse">
                            <ShieldCheck className="text-[var(--color-aeirmist-cyan)] shrink-0" size={24} />
                          </div>
                          <h3 className="text-sm font-black uppercase tracking-wider text-white">Credentials Secure</h3>
                          <p className="text-xs text-white/50 leading-relaxed max-w-[320px] mx-auto">
                            Your password key has been updated and registered successfully across the neural cloud. You can now login with your new key.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="button"
                      onClick={() => {
                        setView('login');
                        setResetStep(1);
                        setError(null);
                        setSuccess(null);
                        // Clean oobCode from URL dynamically
                        try {
                          const url = new URL(window.location.href);
                          url.searchParams.delete('oobCode');
                          url.searchParams.delete('mode');
                          window.history.replaceState({}, document.title, url.toString());
                        } catch {}
                      }}
                      className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/50 hover:text-white transition-colors w-full py-3.5 border border-white/5 hover:bg-white/5 rounded-2xl cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                      Back to Login
                    </button>
                  </motion.form>
                )}

                {/* 6. GLOBAL SUCCESS REDIRECT OVERLAY */}
                {isSuccess && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center py-8 space-y-4"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-[var(--color-aeirmist-cyan)]/25 rounded-full blur-xl scale-125 animate-pulse" />
                      <div className="relative w-16 h-16 rounded-full bg-[var(--color-aeirmist-cyan)]/15 border border-[var(--color-aeirmist-cyan)] flex items-center justify-center text-[var(--color-aeirmist-cyan)] shadow-[0_0_25px_rgba(0,242,255,0.2)]">
                        <Sparkles size={28} className="animate-pulse" />
                      </div>
                    </div>

                    <div className="space-y-1 pt-2">
                      <h3 className="text-lg font-black uppercase tracking-wider">Node Verified</h3>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-aeirmist-cyan)]">Handshake Established</p>
                    </div>

                    <p className="text-xs text-white/40 leading-relaxed max-w-[280px]">
                      Loading your settings...
                    </p>

                    <div className="w-12 h-1 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-[var(--color-aeirmist-cyan)] animate-scan-fast w-full" />
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

            </motion.div>

            {/* Bottom Card View Switcher Bar */}
            {!isSuccess && view !== 'pairing' && view !== 'forgot' && view !== 'reset' && view !== 'saved_accounts' && view !== 'saved_accounts_login' && (
              <div className={`w-full mt-3 sm:mt-4 border ${
                activeTheme.isLight 
                  ? 'bg-white/70 border-slate-200/50 shadow-md' 
                  : 'bg-[#0b0d12]/75 border-white/5 shadow-md'
              } rounded-2xl p-3 sm:p-4 flex items-center justify-center`}>
                <p className="text-xs text-white/50 font-semibold uppercase tracking-wider text-center">
                  {view === 'login' ? "New to Aeirmist? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => {
                      setView(view === 'login' ? 'signup' : 'login');
                      setSignupStep(1);
                      setError(null);
                      setSuccess(null);
                    }}
                    className="font-black text-[var(--color-aeirmist-cyan)] hover:text-white transition-colors ml-1 uppercase"
                  >
                    {view === 'login' ? "Create Account" : "Log In"}
                  </button>
                </p>
              </div>
            )}

            {/* Sandboxed Demo fallback Link */}
            {!isSuccess && (
              <div className="w-full mt-3 sm:mt-5 text-center pb-4 sm:pb-2">
                <button
                  type="button"
                  onClick={loginAsGuestSandbox}
                  disabled={loading}
                  className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors py-1 cursor-pointer"
                >
                  Enter Local Sandbox Mode
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
