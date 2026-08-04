import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, Video as VideoIcon, X, Mic, MicOff, VideoOff, PhoneOff, 
  Check, RefreshCw, Volume2, VolumeX, MoreHorizontal, ShieldCheck, Wifi, Cpu
} from 'lucide-react';
import { useAeirmist } from '../context/AeirmistContext';
import { aeirmistRingtone } from '../modules/calls/RingtoneService';
import { aeirmistCall } from '../modules/calls/CallService';
import { LiveParticipantName } from './Messenger';

interface CallModalProps {
  chat?: {
    id: string;
    name: string;
    photo: string;
    participants?: string[];
    otherParticipantUid?: string;
  };
  type: 'audio' | 'video';
  onClose: () => void;
  isIncoming?: boolean;
}

export const CallModal: React.FC<CallModalProps> = ({ chat, type, onClose, isIncoming = false }) => {
  const { 
    activeCall, startCall, acceptCall, rejectCall, endCall, 
    profile, user, callStream, remoteStream, _requestPermission, db 
  } = useAeirmist();
  
  // Robustly determine if the call is incoming
  const isIncomingCall = activeCall 
    ? (activeCall.callerId !== profile?.id && activeCall.callerUid !== user?.uid)
    : isIncoming;

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'reconnecting' | 'ended' | 'error'>('ringing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Derive a robust safeChat fallback object to avoid any property access errors of undefined/null
  const safeChat = chat || {
    id: activeCall?.conversationId || '',
    name: activeCall?.callerName || (activeCall as any)?.participantDetails?.[activeCall?.callerId || '']?.displayName || 'Unknown Link',
    photo: activeCall?.callerPhoto || (activeCall as any)?.participantDetails?.[activeCall?.callerId || '']?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
    participants: activeCall?.callerId ? [activeCall.callerId, profile?.id].filter(Boolean) : [],
    otherParticipantUid: activeCall?.callerUid || ''
  };

  // Safely find the other participant's ID
  const participantId = safeChat.participants?.find((uid: string) => uid !== user?.uid) || safeChat.otherParticipantUid || '';

  // Synchronise toggle state with WebRTC streams
  useEffect(() => {
    aeirmistCall.toggleAudio(!isMuted);
  }, [isMuted]);

  useEffect(() => {
    aeirmistCall.toggleVideo(!isVideoOff);
  }, [isVideoOff]);

  // Handle speaker toggling by adjusting volume on any audio elements
  useEffect(() => {
    const remoteVideos = document.querySelectorAll('.aeirmist-remote-video') as NodeListOf<HTMLMediaElement>;
    remoteVideos.forEach(v => {
      // If speaker is on, we play at full volume. If off (earpiece mode), we reduce volume to simulate earpiece
      v.volume = isSpeaker ? 1.0 : 0.15;
    });
  }, [isSpeaker]);

  // Robustly bind WebRTC media streams directly to all rendering HTML tags via CSS selectors.
  // This bypasses any React duplicate ref collisions when rendering responsive blocks.
  useEffect(() => {
    const bindStreams = () => {
      const localVideos = document.querySelectorAll('.aeirmist-local-video') as NodeListOf<HTMLVideoElement>;
      localVideos.forEach(v => {
        if (callStream && v.srcObject !== callStream) {
          v.srcObject = callStream;
          aeirmistCall.setupAudioMonitoring(callStream, 'local');
        }
      });

      const remoteVideos = document.querySelectorAll('.aeirmist-remote-video') as NodeListOf<HTMLMediaElement>;
      remoteVideos.forEach(v => {
        if (remoteStream && v.srcObject !== remoteStream) {
          v.srcObject = remoteStream;
          aeirmistCall.setupAudioMonitoring(remoteStream, 'remote');
        }
      });
    };

    bindStreams();
    const interval = setInterval(bindStreams, 500);
    return () => clearInterval(interval);
  }, [callStream, remoteStream, callStatus, isVideoOff]);

  // Auto-hide controls timer for mobile video calls
  useEffect(() => {
    if (callStatus === 'connected' && (type === 'video' && !isVideoOff) && showControls) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [callStatus, isVideoOff, type, showControls]);

  const handleSwitchCamera = async () => {
    try {
      await aeirmistCall.switchCamera();
    } catch (e) {
      console.error("Camera switch failed", e);
    }
  };

  // Timer logic
  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Monitor audio levels
  useEffect(() => {
    const interval = setInterval(() => {
      if (callStatus === 'connected') {
        setAudioLevel(aeirmistCall.getAudioLevel('local'));
        setRemoteAudioLevel(aeirmistCall.getAudioLevel('remote'));
      }
    }, 100);
    return () => clearInterval(interval);
  }, [callStatus]);

  // Initialize call / permissions setup
  useEffect(() => {
    if (callStatus === 'error') return;
    
    const initCall = async () => {
      try {
        if (!isIncomingCall && safeChat.id) {
          const granted = await _requestPermission(type === 'video' ? 'camera' : 'microphone');
          if (!granted) {
            setCallStatus('error');
            setErrorMessage(`Please allow ${type === 'video' ? 'Camera' : 'Microphone'} access to start the call.`);
            return;
          }
          const targetUid = safeChat.participants?.find((uid: string) => uid !== user?.uid) || safeChat.otherParticipantUid;
          await startCall(safeChat.id, type, targetUid);
          aeirmistRingtone.playDialTone();
        }
      } catch (e: any) {
        setCallStatus('error');
        setErrorMessage(e.message || "Encrypted link failed to initialize.");
      }
    };

    initCall();
    
    if (isIncomingCall && callStatus === 'ringing') {
      aeirmistRingtone.playRingtone(type);
      if (window.navigator.vibrate) {
        window.navigator.vibrate([500, 300, 500, 300, 500]);
      }
    }

    return () => {
      aeirmistRingtone.stop();
      if (window.navigator.vibrate) window.navigator.vibrate(0);
    };
  }, [isIncomingCall]);

  // Sync state transitions from useAeirmist() context
  useEffect(() => {
    if (activeCall?.status === 'accepted' || activeCall?.status === 'ongoing') {
      setCallStatus('connected');
      aeirmistRingtone.stop();
    } else if (activeCall?.status === 'reconnecting') {
      setCallStatus('reconnecting');
    } else if (activeCall?.status === 'rejected' || activeCall?.status === 'busy' || activeCall?.status === 'missed') {
       aeirmistRingtone.stop();
       setCallStatus('ended');
       if (activeCall?.status === 'missed') {
         setErrorMessage("Call missed. No response from the other side.");
       }
       setTimeout(onClose, 2000);
    } else if (!activeCall && callStatus !== 'ringing') {
      onClose();
    }
  }, [activeCall, callStatus]);

  const handleEnd = () => {
    if (activeCall?.id) {
       aeirmistCall.updateStatus(db, activeCall.id, 'ended');
       endCall(activeCall.id, activeCall.conversationId);
    }
    aeirmistRingtone.stop();
    setCallStatus('ended');
    setTimeout(onClose, 1000);
  };

  const handleAccept = async (asAudio = false) => {
    if (!activeCall?.id) return;
    
    const requestedType = asAudio ? 'audio' : activeCall.type;
    const granted = await _requestPermission(requestedType === 'video' ? 'camera' : 'microphone');
    if (!granted) {
      setCallStatus('error');
      setErrorMessage(`Permissions required for Link.`);
      return;
    }

    acceptCall(activeCall.id, activeCall.conversationId);
    if (asAudio) setIsVideoOff(true);
    aeirmistRingtone.stop();
    setCallStatus('connected');
  };

  const handleReject = () => {
    if (activeCall?.id) rejectCall(activeCall.id, activeCall.conversationId);
    aeirmistRingtone.stop();
    onClose();
  };

  const displayPhoto = isIncomingCall ? (activeCall?.callerPhoto || safeChat.photo) : (activeCall?.receiverPhoto || safeChat.photo);
  const isVideoMode = type === 'video' && !isVideoOff;

  // Render main subviews
  const renderMoreOptionsPanel = () => {
    return (
      <AnimatePresence>
        {isMoreOpen && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-xl border-t border-white/10 rounded-t-[2rem] p-6 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]"
          >
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-[10px] font-black uppercase text-white/50 tracking-[0.25em]">Link Controls</h4>
              <button 
                onClick={() => setIsMoreOpen(false)}
                className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                <X size={12} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
              <button
                onClick={() => {
                  handleSwitchCamera();
                  setIsMoreOpen(false);
                }}
                className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-3 text-left group transition-all"
              >
                <RefreshCw size={18} className="text-emerald-400 group-hover:rotate-180 transition-transform duration-500" />
                <div>
                  <div className="text-[9px] font-black uppercase text-white tracking-widest">Flip Lens</div>
                  <div className="text-[7px] text-white/40 mt-0.5">Toggle active camera</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsSpeaker(!isSpeaker);
                  setIsMoreOpen(false);
                }}
                className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-3 text-left group transition-all"
              >
                {isSpeaker ? <VolumeX size={18} className="text-rose-400" /> : <Volume2 size={18} className="text-emerald-400" />}
                <div>
                  <div className="text-[9px] font-black uppercase text-white tracking-widest">
                    {isSpeaker ? "Disable Speaker" : "Enable Speaker"}
                  </div>
                  <div className="text-[7px] text-white/40 mt-0.5">Toggle audio output</div>
                </div>
              </button>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                <ShieldCheck className="text-emerald-400" size={18} />
                <div>
                  <div className="text-[9px] font-black uppercase text-white tracking-widest">Digital Crypt</div>
                  <div className="text-[7px] text-white/40 mt-0.5 font-mono">End-to-End Encrypted</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                <Wifi size={18} className="text-emerald-400" />
                <div>
                  <div className="text-[9px] font-black uppercase text-white tracking-widest font-mono">Low Latency</div>
                  <div className="text-[7px] text-white/40 mt-0.5">End-to-End Encrypted</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const handleScreenTap = () => {
    if ((callStatus === 'connected' || callStatus === 'reconnecting') && isVideoMode) {
      setShowControls(prev => !prev);
    }
  };

  function renderContent() {
    if (callStatus === 'error') {
      return (
        <div className="w-full h-full md:w-[420px] md:h-[580px] flex items-center justify-center bg-[#07090e] md:rounded-[2.5rem] md:border md:border-white/10 md:shadow-2xl overflow-hidden">
          <ErrorView message={errorMessage} onRetry={() => window.location.reload()} />
        </div>
      );
    }

    if (callStatus === 'ended') {
      return (
        <div className="w-full h-full md:w-[420px] md:h-[580px] flex flex-col items-center justify-center bg-[#07090e] md:rounded-[2.5rem] md:border md:border-white/10 md:shadow-2xl overflow-hidden text-center gap-6 p-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500"
          >
            <PhoneOff size={32} />
          </motion.div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-wider">Call Ended</h3>
            <p className="text-xs text-white/40 mt-1 uppercase tracking-widest">Feed terminated</p>
          </div>
        </div>
      );
    }

    if (callStatus === 'ringing') {
      return (
        <div className="w-full h-full flex flex-col justify-between bg-black relative overflow-hidden p-6 select-none">
          {/* Blurred Background */}
          <div className="absolute inset-0 z-0">
            <img src={displayPhoto} className="w-full h-full object-cover blur-[80px] brightness-[0.3] scale-125" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-black/40" />
          </div>

          <div className="relative z-10 flex flex-col h-full justify-between py-12 items-center">
            {/* Top Name and Status */}
            <div className="text-center pt-8">
              <span className="text-[10px] font-black uppercase text-white/60 tracking-[0.25em] block mb-3 animate-pulse">
                {isIncomingCall ? `Incoming ${type} Call...` : `Calling...`}
              </span>
              <LiveParticipantName
                participantId={participantId}
                fallbackName={safeChat.name}
                chatId={safeChat.id}
                className="text-3xl font-bold text-white tracking-tight drop-shadow-md"
              />
            </div>

            {/* Centered Avatar with pulsing rings */}
            <div className="flex justify-center items-center my-auto">
              <div className="relative flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute w-36 h-36 rounded-full border border-white/20 bg-white/5"
                />
                <motion.div
                  animate={{ scale: [1, 1.7, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="absolute w-36 h-36 rounded-full border border-white/10 bg-white/5"
                />
                <img src={displayPhoto} className="w-32 h-32 rounded-full object-cover border-2 border-white/20 relative z-10 shadow-2xl" referrerPolicy="no-referrer" />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="w-full flex flex-col items-center gap-6">
              <div className="flex items-center justify-center gap-1.5 text-white/40 mb-2">
                <ShieldCheck size={14} className="text-white/40" />
                <span className="text-[9px] font-black uppercase tracking-widest font-mono">End-to-End Encrypted</span>
              </div>

              {isIncomingCall ? (
                <div className="flex justify-center items-center gap-12 w-full max-w-xs">
                  {/* Decline */}
                  <div className="flex flex-col items-center gap-2">
                    <button 
                      onClick={handleReject}
                      className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 active:scale-90 flex items-center justify-center text-white shadow-lg transition-all"
                    >
                      <PhoneOff size={24} />
                    </button>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">Decline</span>
                  </div>

                  {/* Accept */}
                  <div className="flex flex-col items-center gap-2">
                    <button 
                      onClick={() => handleAccept(false)}
                      className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-90 flex items-center justify-center text-white shadow-lg transition-all"
                    >
                      {type === 'video' ? <VideoIcon size={24} /> : <Phone size={24} />}
                    </button>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">Accept</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <button 
                      onClick={handleEnd}
                      className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 active:scale-90 flex items-center justify-center text-white shadow-lg transition-all"
                    >
                      <PhoneOff size={24} />
                    </button>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">Cancel</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if ((callStatus === 'connected' || callStatus === 'reconnecting') && !isVideoMode) {
      return (
        <div className="w-full h-full flex flex-col justify-between bg-black relative overflow-hidden select-none p-6">
          {/* Play remote audio streams in a hidden media tag */}
          <audio className="aeirmist-remote-video hidden" autoPlay playsInline />

          {/* Blurred Background */}
          <div className="absolute inset-0 z-0">
            <img src={displayPhoto} className="w-full h-full object-cover blur-[80px] brightness-[0.25] scale-125" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-black/50" />
          </div>

          <div className="relative z-10 flex flex-col h-full justify-between py-12 items-center">
            {/* Top Title/Label */}
            <div className="text-center pt-8">
              <span className="text-[10px] font-black uppercase text-white/50 tracking-[0.25em] block mb-2">
                Voice Call
              </span>
              <LiveParticipantName
                participantId={participantId}
                fallbackName={safeChat.name}
                chatId={safeChat.id}
                className="text-3xl font-black text-white uppercase tracking-tight block"
              />
              <span className={`text-sm font-mono font-bold block mt-2 tracking-widest ${callStatus === 'reconnecting' ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                {callStatus === 'reconnecting' ? 'RECONNECTING...' : formatDuration(duration)}
              </span>
            </div>

            {/* Centered Pulsing Avatar */}
            <div className="flex flex-col items-center justify-center my-auto">
              <motion.div 
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative flex items-center justify-center"
              >
                {/* Audio pulse ring */}
                <div 
                  className="absolute w-40 h-40 rounded-full border border-white/20 bg-white/5 blur-sm transition-all duration-300"
                  style={{ transform: `scale(${1 + remoteAudioLevel / 100})` }}
                />
                <img src={displayPhoto} className="w-32 h-32 rounded-full object-cover border-[3px] border-white/20 relative z-10 shadow-2xl" referrerPolicy="no-referrer" />
              </motion.div>
            </div>

            {/* Bottom Controls scrim */}
            <div className="w-full flex flex-col items-center gap-6">
              <div className="flex items-center justify-center gap-1.5 text-white/30 mb-2">
                <ShieldCheck size={14} className="text-white/30" />
                <span className="text-[9px] font-black uppercase tracking-widest font-mono">Digital Crypto Secure</span>
              </div>

              {/* Controls row */}
              <div className="flex items-center justify-center gap-4 w-full max-w-sm px-4">
                {/* Mic Button */}
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isMuted 
                      ? 'bg-rose-600 text-white' 
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/5'
                  }`}
                >
                  {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                </button>

                {/* Speaker Toggle */}
                <button 
                  onClick={() => setIsSpeaker(!isSpeaker)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isSpeaker 
                      ? 'bg-white/30 text-white shadow-lg' 
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/5'
                  }`}
                >
                  {isSpeaker ? <Volume2 size={22} /> : <VolumeX size={22} />}
                </button>

                {/* End Call Button (Distinct, Red, slightly larger) */}
                <button 
                  onClick={handleEnd}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg transition-all"
                >
                  <PhoneOff size={26} />
                </button>

                {/* Video Toggle (to switch to video call) */}
                <button 
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isVideoOff 
                      ? 'bg-white/10 hover:bg-white/20 text-white/50 border border-white/5' 
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/5'
                  }`}
                >
                  {isVideoOff ? <VideoOff size={22} /> : <VideoIcon size={22} />}
                </button>

                {/* More Settings */}
                <button 
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isMoreOpen 
                      ? 'bg-white/30 text-white' 
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/5'
                  }`}
                >
                  <MoreHorizontal size={22} />
                </button>
              </div>
            </div>
          </div>

          {/* More options panel */}
          {renderMoreOptionsPanel()}
        </div>
      );
    }

    if ((callStatus === 'connected' || callStatus === 'reconnecting') && isVideoMode) {
      return (
        <div 
          onClick={handleScreenTap}
          className="w-full h-full flex flex-col justify-between bg-black relative overflow-hidden select-none"
        >
          {/* DESKTOP/TABLET VERTICAL SPLIT VIEW (md: and up) */}
          <div className="hidden md:flex flex-col h-full w-full bg-black relative">
            <div className="h-[60%] w-full relative">
              <video className="aeirmist-remote-video w-full h-full object-cover" autoPlay playsInline />
            </div>
            <div className="h-[40%] w-full relative border-t border-white/10">
              <video className="aeirmist-local-video w-full h-full object-cover scale-x-[-1]" autoPlay playsInline muted />
            </div>
          </div>

          {/* MOBILE FULL-BLEED + DRAGGABLE PiP VIEW (md:hidden) */}
          <div className="md:hidden h-full w-full bg-black relative">
            <video className="aeirmist-remote-video w-full h-full object-cover" autoPlay playsInline />
            
            {/* Draggable Local Preview */}
            <motion.div
              drag
              dragConstraints={{
                left: 16,
                right: typeof window !== 'undefined' ? window.innerWidth - 126 : 280,
                top: 16,
                bottom: typeof window !== 'undefined' ? window.innerHeight - 176 : 550
              }}
              dragElastic={0.15}
              className="absolute bottom-28 right-4 z-30 w-[110px] aspect-[3/4] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black cursor-grab active:cursor-grabbing touch-none"
            >
              <video className="aeirmist-local-video w-full h-full object-cover scale-x-[-1]" autoPlay playsInline muted />
            </motion.div>
          </div>

          {/* TOP SCRIM: Name & Status (Fade in/out with showControls) */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent pt-8 pb-12 px-6 z-40 pointer-events-none flex items-start justify-between"
              >
                <div className="flex flex-col pointer-events-auto">
                  <LiveParticipantName
                    participantId={participantId}
                    fallbackName={safeChat.name}
                    chatId={safeChat.id}
                    className="text-lg font-black text-white uppercase tracking-tight drop-shadow-md"
                  />
                <div className="flex items-center gap-1.5 mt-1 opacity-90">
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-sm ${callStatus === 'reconnecting' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  <span className="text-[9px] font-black uppercase text-white/80 tracking-widest font-mono">
                    {callStatus === 'reconnecting' ? 'Re-establishing Link...' : 'Feed Connected'}
                  </span>
                </div>
                </div>

                <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-black text-white font-mono tracking-widest drop-shadow-md pointer-events-auto">
                  {formatDuration(duration)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* BOTTOM SCRIM: Flat, minimal Instagram-style circular controls (Fade in/out with showControls) */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 pb-8 px-6 z-40 flex flex-col items-center gap-4"
              >
                <div className="flex items-center justify-center gap-4 w-full max-w-sm">
                  {/* Mic Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted(!isMuted);
                    }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                      isMuted 
                        ? 'bg-rose-600 text-white' 
                        : 'bg-white/15 hover:bg-white/25 text-white border border-white/5 backdrop-blur-md'
                    }`}
                  >
                    {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                  </button>

                  {/* Video Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsVideoOff(!isVideoOff);
                    }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                      isVideoOff 
                        ? 'bg-rose-600 text-white' 
                        : 'bg-white/15 hover:bg-white/25 text-white border border-white/5 backdrop-blur-md'
                    }`}
                  >
                    {isVideoOff ? <VideoOff size={22} /> : <VideoIcon size={22} />}
                  </button>

                  {/* End Call (Distinct, slightly larger, red) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEnd();
                    }}
                    className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-750 flex items-center justify-center text-white shadow-lg transition-all active:scale-95"
                  >
                    <PhoneOff size={26} />
                  </button>

                  {/* Speaker Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSpeaker(!isSpeaker);
                    }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                      isSpeaker 
                        ? 'bg-white/35 text-white shadow-lg backdrop-blur-md' 
                        : 'bg-white/15 hover:bg-white/25 text-white border border-white/5 backdrop-blur-md'
                    }`}
                  >
                    {isSpeaker ? <Volume2 size={22} /> : <VolumeX size={22} />}
                  </button>

                  {/* More settings toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMoreOpen(!isMoreOpen);
                    }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                      isMoreOpen 
                        ? 'bg-white/35 text-white backdrop-blur-md' 
                        : 'bg-white/15 hover:bg-white/25 text-white border border-white/5 backdrop-blur-md'
                    }`}
                  >
                    <MoreHorizontal size={22} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Slideup panel options */}
          {renderMoreOptionsPanel()}
        </div>
      );
    }
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-xl overflow-hidden flex items-center justify-center safe-top safe-bottom p-0 md:p-4"
      >
        {renderContent()}
      </motion.div>
    </AnimatePresence>
  );
};

// Internal utility view components to clean up rendering space

const ErrorView = ({ message, onRetry }: { message: string | null, onRetry: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center text-center gap-8 p-10 rounded-[3rem] bg-red-500/10 border border-red-500/20 backdrop-blur-2xl max-w-xs"
  >
    <div className="w-20 h-20 rounded-3xl bg-red-500/20 flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
      <VideoOff size={40} />
    </div>
    <div className="space-y-2">
      <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Call Failed</h3>
      <p className="text-[11px] text-white/50 leading-relaxed font-bold tracking-tight uppercase">
        {message || "Something went wrong starting the call. Please try again."}
      </p>
    </div>
    <button 
      onClick={onRetry}
      className="w-full py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all"
    >
      Try Again
    </button>
  </motion.div>
);
