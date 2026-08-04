import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  HelpCircle,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
  Camera,
  Upload,
  ShieldCheck,
  Globe,
  Sparkles,
  ChevronDown,
  Edit3,
  CheckCircle2
} from 'lucide-react';
import { useAeirmist } from '../../context/AeirmistContext';
import { MediaQuality } from '../../services/MediaService';

interface SignupWizardProps {
  onGoToLogin: () => void;
  onComplete: () => void;
  initialStep?: number;
}

const DRAFT_KEY = 'aeirmist_signup_wizard_draft';
const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256";
const DEFAULT_COVER = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

const RELATIONSHIP_OPTIONS = [
  "Single",
  "In a relationship",
  "Engaged",
  "Married",
  "In a civil union",
  "In a domestic partnership",
  "In an open relationship",
  "It's complicated",
  "Separated",
  "Divorced",
  "Widowed"
];

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

const RuleIndicator = ({ active, label }: { active: boolean; label: string }) => (
  <div className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide">
    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${active ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/20'}`}>
      {active ? <Check size={10} /> : <div className="w-1 h-1 rounded-full bg-white/20" />}
    </div>
    <span className={active ? 'text-white/80' : 'text-white/30'}>{label}</span>
  </div>
);

export const SignupWizard: React.FC<SignupWizardProps> = ({
  onGoToLogin,
  onComplete,
  initialStep = 1
}) => {
  const {
    completeSignup,
    registerUsername,
    checkUsernameAvailable,
    uploadMedia,
    updateProfile,
    profile,
    user
  } = useAeirmist();

  // Load saved local draft if available
  const savedDraft = useMemo(() => {
    try {
      const item = localStorage.getItem(DRAFT_KEY);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }, []);

  // Wizard Step Control (Steps 1 to 5)
  const [step, setStep] = useState<number>(() => {
    if (initialStep > 1) return initialStep;
    if (savedDraft?.step && savedDraft.step >= 1 && savedDraft.step <= 5) {
      return savedDraft.step;
    }
    return 1;
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // STEP 1 FIELDS
  const [identifier, setIdentifier] = useState<string>(savedDraft?.identifier || profile?.personalEmail || '');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>(savedDraft?.fullName || profile?.displayName || '');
  const [username, setUsername] = useState<string>(savedDraft?.username || profile?.username || '');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>(
    profile?.username ? 'available' : 'idle'
  );
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Birthday Dropdowns
  const [birthMonth, setBirthMonth] = useState<string>(savedDraft?.birthMonth || '01');
  const [birthDay, setBirthDay] = useState<string>(savedDraft?.birthDay || '01');
  const [birthYear, setBirthYear] = useState<string>(savedDraft?.birthYear || '2000');
  const [showBirthdayInfo, setShowBirthdayInfo] = useState<boolean>(false);

  // Days array (1-31)
  const daysArray = useMemo(() => Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')), []);
  
  // Years array (2026 down to 1920)
  const yearsArray = useMemo(() => Array.from({ length: 107 }, (_, i) => String(2026 - i)), []);

  // STEP 2 FIELDS (Photos)
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.photoURL || DEFAULT_AVATAR);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(profile?.coverURL || profile?.bannerURL || DEFAULT_COVER);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // STEP 3 FIELDS (Identity & Privacy)
  const [gender, setGender] = useState<string>(savedDraft?.gender || profile?.gender || 'Custom / Prefer not to say');
  const [relationshipStatus, setRelationshipStatus] = useState<string>(savedDraft?.relationshipStatus || profile?.relationshipStatus || 'Single');
  const [accountPrivacy, setAccountPrivacy] = useState<'public' | 'private'>(
    savedDraft?.accountPrivacy || (profile?.isPrivate ? 'private' : 'public')
  );

  // Auto-persist local draft
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        step,
        identifier,
        fullName,
        username,
        birthMonth,
        birthDay,
        birthYear,
        gender,
        relationshipStatus,
        accountPrivacy
      }));
    } catch {
      // Ignore localStorage errors
    }
  }, [step, identifier, fullName, username, birthMonth, birthDay, birthYear, gender, relationshipStatus, accountPrivacy]);

  // Sync initial step if profile exists and user reloads mid-wizard
  useEffect(() => {
    if (user && profile && profile.onboardingStep && !profile.onboardingCompleted) {
      if (profile.onboardingStep > step) {
        setStep(profile.onboardingStep);
      }
    }
  }, [user, profile]);

  // Password Rules Check
  const rules = useMemo(() => ({
    length: password.length >= 6 && password.length <= 64,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  }), [password]);

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (rules.length) score += 1;
    if (rules.uppercase) score += 1;
    if (rules.lowercase) score += 1;
    if (rules.number) score += 1;
    if (rules.special) score += 1;
    return score;
  }, [rules]);

  // Username Live Availability Check
  useEffect(() => {
    if (step !== 1) return;
    if (!username) {
      setUsernameStatus('idle');
      setUsernameError(null);
      return;
    }

    if (username === profile?.username) {
      setUsernameStatus('available');
      setUsernameError(null);
      return;
    }

    if (username.length < 3) {
      setUsernameStatus('invalid');
      setUsernameError('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      setUsernameStatus('invalid');
      setUsernameError('Letters, numbers, and underscores only');
      return;
    }

    setUsernameStatus('checking');
    setUsernameError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await checkUsernameAvailable(username);
        if (res.available) {
          setUsernameStatus('available');
          setUsernameError(null);
        } else {
          setUsernameStatus('taken');
          setUsernameError('Username is already taken');
        }
      } catch (err: any) {
        setUsernameStatus('taken');
        setUsernameError(err.message || 'Error checking username');
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username, checkUsernameAvailable, step, profile?.username]);

  // Handlers for Photo Selection
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file for profile picture.');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError('Profile picture size must be under 10MB.');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file for cover photo.');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError('Cover photo size must be under 10MB.');
        return;
      }
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCoverPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate Step 1
  const isStep1Valid = useMemo(() => {
    const isEmailOrPhoneValid = identifier.trim().length >= 3;
    const isNameValid = fullName.trim().length >= 2;
    const isPassValid = user ? true : password.length >= 6;
    const isUserValid = usernameStatus === 'available';
    return isEmailOrPhoneValid && isNameValid && isPassValid && isUserValid;
  }, [identifier, fullName, password, usernameStatus, user]);

  // Handle Step 1 Submit
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[SignupWizard] Continue clicked");

    if (loading) return;

    setError(null);

    // Explicit validation messages
    if (identifier.trim().length < 3) {
      setError('Please enter a valid mobile number or email address.');
      return;
    }
    if (fullName.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }

    // Age requirement check
    const selectedDOB = new Date(parseInt(birthYear, 10), parseInt(birthMonth, 10) - 1, parseInt(birthDay, 10));
    const today = new Date();
    let age = today.getFullYear() - selectedDOB.getFullYear();
    const monthDiff = today.getMonth() - selectedDOB.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < selectedDOB.getDate())) {
      age--;
    }
    if (age < 13) {
      setError('You must be at least 13 years old to create an Aeirmist account.');
      return;
    }

    if (!user && password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!username || username.length < 3) {
      setError('Please enter a valid username (at least 3 characters).');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores.');
      return;
    }

    // Auto-check username if status is idle or checking
    let currentUsernameStatus = usernameStatus;
    if (username !== profile?.username && (currentUsernameStatus === 'idle' || currentUsernameStatus === 'checking')) {
      console.log("[SignupWizard] Automatically checking username availability...");
      try {
        const res = await checkUsernameAvailable(username);
        if (res.available) {
          setUsernameStatus('available');
          currentUsernameStatus = 'available';
        } else {
          setUsernameStatus('taken');
          setUsernameError('Username is already taken');
          setError('That username is already taken. Please pick another.');
          return;
        }
      } catch (err: any) {
        setError('Error checking username availability. Please try again.');
        return;
      }
    }

    if (currentUsernameStatus !== 'available') {
      if (currentUsernameStatus === 'taken') {
        setError('That username is already taken. Please pick another.');
        return;
      } else if (currentUsernameStatus === 'invalid') {
        setError(usernameError || 'Please enter a valid username (at least 3 characters).');
        return;
      } else {
        setError('Please enter a valid and available username.');
        return;
      }
    }

    console.log("[SignupWizard] Validation passed");
    setLoading(true);

    try {
      const emailToUse = identifier.includes('@')
        ? identifier.trim().toLowerCase()
        : `${identifier.replace(/[^0-9]/g, '')}@aeirmist.social`;

      const formattedDOB = `${birthYear}-${birthMonth}-${birthDay}`;

      // Call REAL completeSignup or registerUsername if user already logged in
      if (user) {
        await registerUsername(username, {
          displayName: fullName,
          personalEmail: identifier.includes('@') ? identifier : '',
          phoneNumber: !identifier.includes('@') ? identifier : ''
        });
      } else {
        await completeSignup(
          emailToUse,
          password,
          username,
          fullName,
          null,
          null
        );
      }

      console.log("[SignupWizard] Signup success");

      // Store initial DOB and contact details on profile safely
      try {
        await updateProfile({
          dateOfBirth: formattedDOB,
          personalEmail: identifier.includes('@') ? identifier : '',
          phoneNumber: !identifier.includes('@') ? identifier : '',
          onboardingStep: 2,
          onboardingCompleted: false
        });
        console.log("[SignupWizard] Profile updated");
      } catch (profErr) {
        console.warn("[SignupWizard] updateProfile warning:", profErr);
      }

      console.log("[SignupWizard] Step changed to 2");
      setStep(2);
    } catch (err: any) {
      console.error("[SignupWizard] Step 1 Error:", err);
      let errorMsg = err.message || 'Account creation failed';
      if (errorMsg.includes('auth/email-already-in-use')) {
        errorMsg = 'An account with this email/mobile already exists.';
      } else if (errorMsg.includes('auth/weak-password')) {
        errorMsg = 'Password is too weak. Please use at least 6 characters.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2 Submit (Photos)
  const handleStep2Submit = async (skip: boolean = false) => {
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      let photoURLToSave = avatarPreview || profile?.photoURL || DEFAULT_AVATAR;
      let coverURLToSave = coverPreview || profile?.coverURL || profile?.bannerURL || DEFAULT_COVER;

      if (skip) {
        if (!avatarPreview) {
          setAvatarPreview(DEFAULT_AVATAR);
          photoURLToSave = DEFAULT_AVATAR;
        }
        if (!coverPreview) {
          setCoverPreview(DEFAULT_COVER);
          coverURLToSave = DEFAULT_COVER;
        }
      }

      await updateProfile({
        photoURL: photoURLToSave,
        coverURL: coverURLToSave,
        bannerURL: coverURLToSave,
        onboardingStep: 3
      });

      // Non-blocking background upload to Firebase Storage if files were selected
      if (user) {
        if (avatarFile) {
          uploadMedia(avatarFile, `profiles/${user.uid}/avatars`, undefined, MediaQuality.PROFILE)
            .then(url => {
              if (url) {
                setAvatarPreview(url);
                updateProfile({ photoURL: url });
              }
            })
            .catch(err => console.warn("[SignupWizard] Step 2 background avatar upload warning:", err));
        }
        if (coverFile) {
          uploadMedia(coverFile, `profiles/${user.uid}/covers`, undefined, MediaQuality.HD)
            .then(url => {
              if (url) {
                setCoverPreview(url);
                updateProfile({ coverURL: url, bannerURL: url });
              }
            })
            .catch(err => console.warn("[SignupWizard] Step 2 background cover upload warning:", err));
        }
      }

      setStep(3);
    } catch (err: any) {
      console.error("[SignupWizard] Step 2 Error:", err);
      setError(err.message || 'Failed to update photos.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 3 Submit (Identity & Privacy)
  const handleStep3Submit = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      if (!gender) {
        setError('Please select a gender option.');
        setLoading(false);
        return;
      }

      const isPrivateChoice = accountPrivacy === 'private';

      await updateProfile({
        gender,
        relationshipStatus: relationshipStatus || 'Single',
        isPrivate: isPrivateChoice,
        privacySettings: {
          ...(profile?.privacySettings || {}),
          privateProfile: isPrivateChoice
        },
        onboardingStep: 4
      });

      setStep(4);
    } catch (err: any) {
      console.error("[SignupWizard] Step 3 Error:", err);
      setError(err.message || 'Failed to update preferences.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 4 Confirmation (Finalize Account & Upload Images)
  const handleStep4Confirm = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      let finalPhotoURL = avatarPreview || profile?.photoURL || DEFAULT_AVATAR;
      let finalCoverURL = coverPreview || profile?.coverURL || profile?.bannerURL || DEFAULT_COVER;

      if (user) {
        // Fast upload with fallback to base64 Data URL if storage times out or fails
        const uploadWithTimeout = async (file: File, path: string, quality: MediaQuality, fallback: string) => {
          try {
            const timeoutPromise = new Promise<string>((_, reject) =>
              setTimeout(() => reject(new Error("Storage upload timeout")), 3500)
            );
            return await Promise.race([
              uploadMedia(file, path, undefined, quality),
              timeoutPromise
            ]);
          } catch (err) {
            console.warn(`[SignupWizard] Upload timeout/failed for ${path}, using preview Data URL:`, err);
            return fallback;
          }
        };

        if (avatarFile && (avatarPreview?.startsWith('data:') || !profile?.photoURL)) {
          finalPhotoURL = await uploadWithTimeout(
            avatarFile,
            `profiles/${user.uid}/avatars`,
            MediaQuality.PROFILE,
            avatarPreview || DEFAULT_AVATAR
          );
        }

        if (coverFile && (coverPreview?.startsWith('data:') || !profile?.coverURL)) {
          finalCoverURL = await uploadWithTimeout(
            coverFile,
            `profiles/${user.uid}/covers`,
            MediaQuality.HD,
            coverPreview || DEFAULT_COVER
          );
        }

        const formattedDOB = `${birthYear}-${birthMonth}-${birthDay}`;
        const isPrivateChoice = accountPrivacy === 'private';

        await updateProfile({
          displayName: fullName || profile?.displayName || username,
          username: username || profile?.username,
          photoURL: finalPhotoURL,
          coverURL: finalCoverURL,
          bannerURL: finalCoverURL,
          gender,
          relationshipStatus: relationshipStatus || 'Single',
          isPrivate: isPrivateChoice,
          privacySettings: {
            ...(profile?.privacySettings || {}),
            privateProfile: isPrivateChoice
          },
          dateOfBirth: formattedDOB,
          onboardingStep: 5,
          onboardingCompleted: true
        });
      }

      localStorage.removeItem(DRAFT_KEY);
      // Log directly into main app
      onComplete();
    } catch (err: any) {
      console.error("[SignupWizard] Step 4 Confirmation Error:", err);
      try {
        if (user) {
          await updateProfile({
            photoURL: avatarPreview || profile?.photoURL || DEFAULT_AVATAR,
            coverURL: coverPreview || profile?.coverURL || DEFAULT_COVER,
            bannerURL: coverPreview || profile?.coverURL || DEFAULT_COVER,
            onboardingCompleted: true,
            onboardingStep: 5
          });
        }
      } catch (e) {}
      localStorage.removeItem(DRAFT_KEY);
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 5 "Start Exploring"
  const handleStartExploring = async () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      if (user) {
        await updateProfile({ onboardingCompleted: true, onboardingStep: 5 });
      }
    } catch (e) {
      console.error(e);
    }
    onComplete();
  };

  // Display Username or Name on Welcome Screen
  const welcomeDisplayName = useMemo(() => {
    return profile?.username || username || fullName || user?.displayName || 'User';
  }, [profile, username, fullName, user]);

  return (
    <div className="w-full max-w-md mx-auto relative select-none my-auto">
      {/* STEP PROGRESS INDICATOR FOR STEPS 1-4 */}
      {step < 5 && (
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-aeirmist-cyan)] font-black">
              Step {step} of 4
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
              {step === 1 ? 'Basic Info' : step === 2 ? 'Profile Setup' : step === 3 ? 'Preferences' : 'Review & Confirm'}
            </span>
          </div>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden flex gap-1">
            <div className={`h-full flex-1 transition-all duration-500 ${step >= 1 ? 'bg-[var(--color-aeirmist-cyan)]' : 'bg-white/10'}`} />
            <div className={`h-full flex-1 transition-all duration-500 ${step >= 2 ? 'bg-[var(--color-aeirmist-cyan)]' : 'bg-white/10'}`} />
            <div className={`h-full flex-1 transition-all duration-500 ${step >= 3 ? 'bg-[var(--color-aeirmist-cyan)]' : 'bg-white/10'}`} />
            <div className={`h-full flex-1 transition-all duration-500 ${step >= 4 ? 'bg-[var(--color-aeirmist-cyan)]' : 'bg-white/10'}`} />
          </div>
        </div>
      )}

      {/* ERROR ALERT BANNER */}
      {error && step < 5 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs flex items-start justify-between gap-2.5"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">{error}</p>
          </div>
          {(error.includes('already exists') || error.includes('email-already-in-use')) && (
            <button
              type="button"
              onClick={onGoToLogin}
              className="shrink-0 px-3 py-1 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-white text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              Log In
            </button>
          )}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* ======================================================== */}
        {/* STEP 1: BASIC INFORMATION                                */}
        {/* ======================================================== */}
        {step === 1 && (
          <motion.form
            key="wizard-step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onSubmit={handleStep1Submit}
            className="space-y-4"
          >
            {/* Header */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Get started on Aeirmist
              </h2>
              <p className="text-xs text-white/50 leading-relaxed font-normal">
                Create an account to access Aeirmist, easily and securely.
              </p>
            </div>

            {/* Field 1: Mobile number or email */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-white/70 tracking-wide uppercase">
                Mobile number or email
              </label>
              <div className="relative rounded-2xl bg-white/[0.03] border border-white/10 focus-within:border-[var(--color-aeirmist-cyan)]/50 transition-all">
                <input
                  type="text"
                  required
                  placeholder="Mobile number or email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full py-3 pl-4 pr-4 bg-transparent outline-none text-sm text-white placeholder-white/25"
                />
              </div>
              <p className="text-[10.5px] text-white/40 leading-snug">
                You may receive notifications from us.{' '}
                <span className="text-white/60 underline decoration-white/20 cursor-pointer">
                  Learn why we ask for your contact information
                </span>
              </p>
            </div>

            {/* Field 2: Password (If user not authenticated yet) */}
            {!user && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/70 tracking-wide uppercase">
                  Password
                </label>
                <div className="relative rounded-2xl bg-white/[0.03] border border-white/10 focus-within:border-[var(--color-aeirmist-cyan)]/50 transition-all">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full py-3 pl-4 pr-11 bg-transparent outline-none text-sm text-white placeholder-white/25"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Real-time Password Rules */}
                {password && (
                  <div className="space-y-2 pt-1 p-2 bg-white/[0.02] border border-white/5 rounded-xl">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            passwordStrength >= lvl
                              ? 'bg-[var(--color-aeirmist-cyan)] shadow-[0_0_8px_rgba(0,242,255,0.4)]'
                              : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <RuleIndicator active={rules.length} label="8 to 64 chars" />
                      <RuleIndicator active={rules.uppercase} label="Uppercase (A-Z)" />
                      <RuleIndicator active={rules.lowercase} label="Lowercase (a-z)" />
                      <RuleIndicator active={rules.number} label="At least 1 number" />
                      <RuleIndicator active={rules.special} label="Special symbol" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Field 3: Birthday with dropdowns */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-bold text-white/70 tracking-wide uppercase">
                  Birthday
                </label>
                <button
                  type="button"
                  onClick={() => setShowBirthdayInfo(!showBirthdayInfo)}
                  className="text-white/40 hover:text-white/80 transition-colors p-0.5 cursor-pointer relative"
                  title="Why we ask for birthday"
                >
                  <HelpCircle size={14} />
                </button>
              </div>

              {/* Info Tooltip */}
              {showBirthdayInfo && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2.5 bg-white/10 border border-white/15 rounded-xl text-[11px] text-white/80 leading-relaxed shadow-lg"
                >
                  Providing your birthday helps make sure you get the right experience for your age on Aeirmist.
                </motion.div>
              )}

              {/* 3 Dropdowns side-by-side */}
              <div className="grid grid-cols-3 gap-2">
                {/* Month Dropdown */}
                <div className="relative">
                  <select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-900 border border-white/10 rounded-2xl text-xs text-white outline-none focus:border-[var(--color-aeirmist-cyan)]/50 appearance-none cursor-pointer"
                  >
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value} className="bg-slate-900 text-white">
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                </div>

                {/* Day Dropdown */}
                <div className="relative">
                  <select
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-900 border border-white/10 rounded-2xl text-xs text-white outline-none focus:border-[var(--color-aeirmist-cyan)]/50 appearance-none cursor-pointer"
                  >
                    {daysArray.map((d) => (
                      <option key={d} value={d} className="bg-slate-900 text-white">
                        {parseInt(d, 10)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                </div>

                {/* Year Dropdown */}
                <div className="relative">
                  <select
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-900 border border-white/10 rounded-2xl text-xs text-white outline-none focus:border-[var(--color-aeirmist-cyan)]/50 appearance-none cursor-pointer"
                  >
                    {yearsArray.map((y) => (
                      <option key={y} value={y} className="bg-slate-900 text-white">
                        {y}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Field 4: Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-white/70 tracking-wide uppercase">
                Name
              </label>
              <div className="relative rounded-2xl bg-white/[0.03] border border-white/10 focus-within:border-[var(--color-aeirmist-cyan)]/50 transition-all">
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full py-3 pl-4 pr-4 bg-transparent outline-none text-sm text-white placeholder-white/25"
                />
              </div>
            </div>

            {/* Field 5: Username */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-white/70 tracking-wide uppercase">
                Username
              </label>
              <div className="relative rounded-2xl bg-white/[0.03] border border-white/10 focus-within:border-[var(--color-aeirmist-cyan)]/50 transition-all">
                <input
                  type="text"
                  required
                  maxLength={20}
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().trim().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full py-3 pl-4 pr-11 bg-transparent outline-none text-sm text-white placeholder-white/25"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
                  {usernameStatus === 'checking' && <Loader2 size={16} className="animate-spin text-white/40" />}
                  {usernameStatus === 'available' && <Check size={16} className="text-green-400" />}
                  {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <AlertCircle size={16} className="text-red-400" />}
                </div>
              </div>
              {usernameError && (
                <p className="text-[10px] text-red-400 font-medium">{usernameError}</p>
              )}
            </div>

            {/* Legal text block */}
            <p className="text-[10.5px] text-white/35 leading-relaxed pt-1">
              By tapping Continue, you agree to create an account and to Aeirmist's{' '}
              <span className="text-white/50 underline decoration-white/20 cursor-pointer">Terms</span>,{' '}
              <span className="text-white/50 underline decoration-white/20 cursor-pointer">Privacy Policy</span> and{' '}
              <span className="text-white/50 underline decoration-white/20 cursor-pointer">Cookies Policy</span>.
            </p>

            {/* Large primary button: Continue */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[var(--color-aeirmist-cyan)] text-black font-black uppercase tracking-widest text-xs hover:opacity-95 disabled:opacity-40 shadow-[0_0_20px_rgba(0,242,255,0.25)] flex items-center justify-center gap-2 cursor-pointer transition-all mt-2"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin text-black" />
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Secondary button: I already have an account */}
            <button
              type="button"
              onClick={onGoToLogin}
              className="w-full py-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer mt-1"
            >
              I already have an account
            </button>
          </motion.form>
        )}

        {/* ======================================================== */}
        {/* STEP 2: PROFILE SETUP (Photos)                           */}
        {/* ======================================================== */}
        {step === 2 && (
          <motion.div
            key="wizard-step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="space-y-1 text-center">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Profile Setup
              </h2>
              <p className="text-xs text-white/50 leading-relaxed">
                Upload a profile picture and cover banner. Both are optional.
              </p>
            </div>

            {/* Photo Upload Area */}
            <div className="relative rounded-3xl bg-white/[0.02] border border-white/10 overflow-hidden p-4 flex flex-col items-center gap-4">
              
              {/* Cover Photo Zone (Rectangular) */}
              <div
                onClick={() => coverInputRef.current?.click()}
                className="w-full h-32 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900 border border-white/10 relative overflow-hidden flex items-center justify-center group cursor-pointer"
              >
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-white/40 group-hover:text-white/80 transition-colors">
                    <Upload size={22} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Upload Cover Picture</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={24} className="text-white drop-shadow-md" />
                </div>
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverSelect}
                className="hidden"
              />

              {/* Avatar Zone (Centered Square) */}
              <div
                onClick={() => avatarInputRef.current?.click()}
                className="relative -mt-12 w-24 h-24 rounded-2xl border-4 border-slate-950 bg-slate-900 overflow-hidden group cursor-pointer shadow-xl flex items-center justify-center shrink-0"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-white/40 group-hover:text-white/80 transition-colors">
                    <User size={32} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={20} className="text-white drop-shadow-md" />
                </div>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
              />

              <p className="text-[11px] text-white/40 text-center font-medium">
                Tap on either area to select an image (max 10MB).
              </p>
            </div>

            {/* Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleStep2Submit(false)}
                className="w-full py-3.5 rounded-2xl bg-[var(--color-aeirmist-cyan)] text-black font-black uppercase tracking-widest text-xs hover:opacity-95 disabled:opacity-40 shadow-[0_0_20px_rgba(0,242,255,0.25)] flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin text-black" />
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-bold text-white/50 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleStep2Submit(true)}
                  className="px-4 py-2 text-xs font-bold text-white/40 hover:text-white/80 cursor-pointer transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: PROFILE PREFERENCES                              */}
        {/* ======================================================== */}
        {step === 3 && (
          <motion.div
            key="wizard-step-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-5"
          >
            <div className="space-y-1 text-center">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Profile Preferences
              </h2>
              <p className="text-xs text-white/50 leading-relaxed">
                Set your gender, relationship status, and account privacy.
              </p>
            </div>

            {/* Gender Selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                Gender <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Male', 'Female', 'Custom / Prefer not to say'].map((gOpt) => {
                  const isSel = gender === gOpt;
                  return (
                    <button
                      key={gOpt}
                      type="button"
                      onClick={() => setGender(gOpt)}
                      className={`py-2.5 px-2 rounded-2xl text-[11px] font-bold transition-all border text-center cursor-pointer ${
                        isSel
                          ? 'bg-[var(--color-aeirmist-cyan)]/20 border-[var(--color-aeirmist-cyan)] text-[var(--color-aeirmist-cyan)] shadow-[0_0_12px_rgba(0,242,255,0.15)]'
                          : 'bg-white/[0.03] border-white/10 text-white/60 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {gOpt === 'Custom / Prefer not to say' ? 'Custom' : gOpt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Relationship Status */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                Relationship Status
              </label>
              <div className="relative">
                <select
                  value={relationshipStatus}
                  onChange={(e) => setRelationshipStatus(e.target.value)}
                  className="w-full h-11 px-4 bg-slate-900 border border-white/10 rounded-2xl text-xs text-white outline-none focus:border-[var(--color-aeirmist-cyan)]/50 appearance-none cursor-pointer"
                >
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="bg-slate-900 text-white">
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
              </div>
            </div>

            {/* Account Type / Privacy Cards */}
            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                Account Privacy
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Public Card */}
                <div
                  onClick={() => setAccountPrivacy('public')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 relative ${
                    accountPrivacy === 'public'
                      ? 'bg-[var(--color-aeirmist-cyan)]/10 border-[var(--color-aeirmist-cyan)] text-white shadow-[0_0_15px_rgba(0,242,255,0.15)]'
                      : 'bg-white/[0.02] border-white/10 text-white/50 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe size={16} className={accountPrivacy === 'public' ? 'text-[var(--color-aeirmist-cyan)]' : 'text-white/40'} />
                      <span className="text-xs font-bold uppercase tracking-wide">Public Account</span>
                    </div>
                    {accountPrivacy === 'public' && <ShieldCheck className="text-[var(--color-aeirmist-cyan)] shrink-0" size={16} />}
                  </div>
                  <p className="text-[10px] text-white/50 leading-relaxed">
                    Anyone on Aeirmist can view your posts and follow you instantly.
                  </p>
                </div>

                {/* Private Card */}
                <div
                  onClick={() => setAccountPrivacy('private')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 relative ${
                    accountPrivacy === 'private'
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'bg-white/[0.02] border-white/10 text-white/50 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock size={16} className={accountPrivacy === 'private' ? 'text-amber-400' : 'text-white/40'} />
                      <span className="text-xs font-bold uppercase tracking-wide">Private Account</span>
                    </div>
                    {accountPrivacy === 'private' && <ShieldCheck className="text-amber-400 shrink-0" size={16} />}
                  </div>
                  <p className="text-[10px] text-white/50 leading-relaxed">
                    People must send a follow request to see your posts and activity.
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleStep3Submit}
                className="w-full py-3.5 rounded-2xl bg-[var(--color-aeirmist-cyan)] text-black font-black uppercase tracking-widest text-xs hover:opacity-95 disabled:opacity-40 shadow-[0_0_20px_rgba(0,242,255,0.25)] flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin text-black" />
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-bold text-white/50 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* STEP 4: REVIEW & CONFIRMATION                            */}
        {/* ======================================================== */}
        {step === 4 && (
          <motion.div
            key="wizard-step-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-5"
          >
            <div className="space-y-1 text-center">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Review & Confirm
              </h2>
              <p className="text-xs text-white/50 leading-relaxed">
                Review your profile details before finalizing your node initialization.
              </p>
            </div>

            {/* Summary Card */}
            <div className="rounded-3xl bg-white/[0.02] border border-white/10 overflow-hidden divide-y divide-white/5">
              
              {/* Header Cover & Avatar Preview */}
              <div className="relative p-4 pb-12 bg-gradient-to-r from-slate-900 to-zinc-900 flex items-end justify-between">
                {coverPreview && (
                  <img src={coverPreview} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl border-2 border-[var(--color-aeirmist-cyan)] overflow-hidden shadow-lg bg-slate-900">
                    <img src={avatarPreview || DEFAULT_AVATAR} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{fullName || 'Your Name'}</h3>
                    <p className="text-xs font-mono text-[var(--color-aeirmist-cyan)]">@{username || 'username'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="relative z-10 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-md cursor-pointer transition-colors"
                >
                  <Edit3 size={12} />
                  <span>Edit Photos</span>
                </button>
              </div>

              {/* Basic Info Summary */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-white/40">Basic Info</span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[10px] font-bold text-[var(--color-aeirmist-cyan)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 size={11} />
                    <span>Edit</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-white/40 block">Contact</span>
                    <span className="text-white font-medium truncate block">{identifier || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block">Birthday</span>
                    <span className="text-white font-medium block">{birthMonth}/{birthDay}/{birthYear}</span>
                  </div>
                </div>
              </div>

              {/* Preferences Summary */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-white/40">Preferences</span>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-[10px] font-bold text-[var(--color-aeirmist-cyan)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 size={11} />
                    <span>Edit</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-white/40 block">Gender</span>
                    <span className="text-white font-medium block truncate">{gender}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block">Status</span>
                    <span className="text-white font-medium block truncate">{relationshipStatus}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block">Privacy</span>
                    <span className="text-white font-medium block capitalize">{accountPrivacy}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleStep4Confirm}
                className="w-full py-3.5 rounded-2xl bg-[var(--color-aeirmist-cyan)] text-black font-black uppercase tracking-widest text-xs hover:opacity-95 disabled:opacity-40 shadow-[0_0_20px_rgba(0,242,255,0.25)] flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin text-black" />
                ) : (
                  <>
                    <span>Confirm & Create Account</span>
                    <CheckCircle2 size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 text-xs font-bold text-white/50 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* STEP 5: WELCOME SCREEN                                   */}
        {/* ======================================================== */}
        {step === 5 && (
          <motion.div
            key="wizard-step-5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center text-center py-6 space-y-6"
          >
            {/* Avatar Badge */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl border-4 border-[var(--color-aeirmist-cyan)] p-1 shadow-[0_0_30px_rgba(0,242,255,0.4)] overflow-hidden bg-slate-900 mx-auto">
                <img src={avatarPreview || DEFAULT_AVATAR} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[var(--color-aeirmist-cyan)] text-black p-1.5 rounded-xl shadow-lg">
                <ShieldCheck size={16} />
              </div>
            </div>

            {/* Cinematic Letter-by-Letter Animated Text Reveal */}
            <div className="flex flex-col items-center justify-center gap-y-2 px-4">
              <motion.span
                initial={{ opacity: 0, y: 12, filter: 'blur(10px)' }}
                animate={{ opacity: 0.6, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                className="text-xs sm:text-sm font-black tracking-[0.4em] text-zinc-400 uppercase"
              >
                WELCOME TO AEIRMIST
              </motion.span>

              <span className="text-2xl sm:text-4xl font-normal tracking-tight text-white flex flex-nowrap whitespace-nowrap justify-center gap-[1px] sm:gap-1 max-w-[95vw]">
                {Array.from(toMathBoldScript(welcomeDisplayName)).map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 22, filter: 'blur(12px)', scale: 0.88 }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
                    transition={{
                      delay: 0.3 + i * 0.05,
                      duration: 0.55,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="inline-block text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-zinc-300 drop-shadow-[0_0_22px_rgba(0,242,255,0.45)]"
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </span>

              <p className="text-xs text-white/60 leading-relaxed max-w-xs pt-1">
                Your profile is initialized and ready. Welcome to the future of social connection.
              </p>
            </div>

            {/* Neon Cyan & Ash Divider Line */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.7, ease: "easeInOut" }}
              className="h-[1.5px] w-48 bg-gradient-to-r from-transparent via-[var(--color-aeirmist-cyan)] to-transparent shadow-[0_0_14px_rgba(0,242,255,0.7)]"
            />

            {/* Button: Start Exploring */}
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              onClick={handleStartExploring}
              className="w-full py-4 rounded-2xl bg-[var(--color-aeirmist-cyan)] text-black font-black uppercase tracking-widest text-xs hover:opacity-95 shadow-[0_0_25px_rgba(0,242,255,0.4)] flex items-center justify-center gap-2.5 cursor-pointer transition-all"
            >
              <span>Start Exploring</span>
              <Sparkles size={18} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
