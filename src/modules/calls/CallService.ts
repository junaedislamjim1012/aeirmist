import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp,
  getDoc,
  addDoc,
  deleteDoc,
  query,
  limit,
  Timestamp,
  where,
  writeBatch,
  arrayUnion
} from 'firebase/firestore';

export type CallStatus = 'calling' | 'ringing' | 'accepted' | 'rejected' | 'ongoing' | 'ended' | 'missed' | 'busy' | 'reconnecting';

interface CallData {
  id: string;
  callerId: string;
  receiverId: string;
  callerUid: string;
  receiverUid: string;
  callerName?: string;
  callerPhoto?: string;
  receiverName?: string;
  receiverPhoto?: string;
  status: CallStatus;
  type: 'audio' | 'video';
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  duration?: number;
  conversationId?: string;
}

class CallService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callId: string | null = null;
  private role: 'caller' | 'receiver' | null = null;
  private isSafeMode: boolean = false;
  
  public setSafeMode(enabled: boolean) {
    this.isSafeMode = enabled;
  }
  private audioContext: AudioContext | null = null;
  private analyzer: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private remoteAnalyzer: AnalyserNode | null = null;
  private remoteDataArray: Uint8Array | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private candidateUnsub: (() => void) | null = null;
  private callUnsub: (() => void) | null = null;
  private outgoingCandidateBuffer: any[] = [];
  private candidateFlushTimer: any = null;

  async initLocalStream(type: 'audio' | 'video') {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media access (camera/microphone) is not supported in this browser or requires a secure HTTPS connection.");
      }
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: type === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false
      });
      return this.localStream;
    } catch (e) {
      console.error("Failed to get local stream", e);
      throw e;
    }
  }

  getAudioLevel(type: 'local' | 'remote' = 'local'): number {
    const analyzer = type === 'local' ? this.analyzer : this.remoteAnalyzer;
    const dataArray = type === 'local' ? this.dataArray : this.remoteDataArray;
    
    if (!analyzer || !dataArray) return 0;
    analyzer.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / dataArray.length;
  }

  setupAudioMonitoring(stream: MediaStream, type: 'local' | 'remote' = 'local') {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      const source = this.audioContext.createMediaStreamSource(stream);
      const analyzer = this.audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      if (type === 'local') {
        this.analyzer = analyzer;
        this.dataArray = dataArray;
      } else {
        this.remoteAnalyzer = analyzer;
        this.remoteDataArray = dataArray;
      }
    } catch (e) {
      console.warn(`Audio monitoring (${type}) failed to initialize`, e);
    }
  }

  private setupPeerConnection(db: any, iceServers: RTCIceServer[], onRemoteStream: (stream: MediaStream) => void) {
    this.peerConnection = new RTCPeerConnection({ iceServers });
    this.onRemoteStreamCallback = onRemoteStream;

    this.peerConnection.ontrack = (event) => {
      console.log("[WebRTC] Remote track received", event.streams[0]);
      this.remoteStream = event.streams[0];
      onRemoteStream(this.remoteStream);
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.callId) {
        this.outgoingCandidateBuffer.push(event.candidate.toJSON());
        // Aggressive batching: Wait for 12 candidates or 5 seconds to minimize writes
        if (this.outgoingCandidateBuffer.length >= 12) {
            this.flushCandidates(db);
        } else if (!this.candidateFlushTimer) {
            this.candidateFlushTimer = setTimeout(() => this.flushCandidates(db), 5000);
        }
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection state:", this.peerConnection?.connectionState);
      const state = this.peerConnection?.connectionState;
      if (state === 'connected' && this.callId && !this.isSafeMode) {
        updateDoc(doc(db, 'calls', this.callId), { status: 'ongoing' }).catch(() => {});
      } else if (state === 'failed' || state === 'disconnected') {
        console.warn("[WebRTC] Connection unstable or failed:", state);
        if (state === 'failed') {
          this.cleanup();
        } else {
          // If disconnected, give it a moment to reconnect
          if (this.callId) {
            updateDoc(doc(db, 'calls', this.callId), { status: 'reconnecting' }).catch(() => {});
          }
        }
      }
    };

    // Global network listener
    const handleNetworkChange = () => {
      if (!navigator.onLine) {
        console.warn("[WebRTC] Network went offline");
        if (this.callId && db) {
           this.updateStatus(db, this.callId, 'ended');
        }
        this.cleanup();
      }
    };
    window.addEventListener('offline', handleNetworkChange);
    // Note: We'd need to store this to remove it, but CallService is a singleton
    // For production, we'd manage this listener more carefully

    this.peerConnection.oniceconnectionstatechange = () => {
       console.log("[WebRTC] ICE Connection state:", this.peerConnection?.iceConnectionState);
    };
  }

  async createCall(db: any, callerProfile: any, receiverProfile: any, conversationId: string, type: 'audio' | 'video', onRemoteStream: (stream: MediaStream) => void) {
    this.cleanup();
    this.role = 'caller';
    this.callId = `call_${Date.now()}_${callerProfile.id}`;
    
    if (!this.localStream) {
      await this.initLocalStream(type);
    }

    if (!callerProfile?.ownerUid || !receiverProfile?.ownerUid) {
      console.error("[CallService] Identity sync failure:", { caller: callerProfile?.id, receiver: receiverProfile?.id });
      throw new Error("Could not connect to user. The Link could not be established.");
    }

    this.setupPeerConnection(db, [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
    ], onRemoteStream);

    this.localStream?.getTracks().forEach(track => {
      this.peerConnection?.addTrack(track, this.localStream!);
    });

    const offer = await this.peerConnection!.createOffer();
    await this.peerConnection!.setLocalDescription(offer);

    const callRef = doc(db, 'calls', this.callId);
    await setDoc(callRef, {
      id: this.callId,
      callerId: callerProfile.id,
      receiverId: receiverProfile.id,
      callerUid: callerProfile.ownerUid,
      receiverUid: receiverProfile.ownerUid,
      callerName: callerProfile.displayName || callerProfile.username || 'Unknown User',
      callerPhoto: callerProfile.photoURL || '',
      receiverName: receiverProfile.displayName || receiverProfile.username || 'Aeirmist User',
      receiverPhoto: receiverProfile.photoURL || '',
      participants: [callerProfile.ownerUid, receiverProfile.ownerUid].sort(),
      status: 'calling',
      type,
      offer: { type: offer.type, sdp: offer.sdp },
      conversationId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    this.startCandidateListener(db);
    this.startCallListener(db);

    return { callId: this.callId, stream: this.localStream };
  }

  async answerCall(db: any, callId: string, onRemoteStream: (stream: MediaStream) => void) {
    this.cleanup();
    this.role = 'receiver';
    this.callId = callId;
    
    const callRef = doc(db, 'calls', callId);
    const callSnap = await getDoc(callRef);
    if (!callSnap.exists()) throw new Error("Sync Error: Link not found.");
    
    const data = callSnap.data() as CallData;
    
    if (!this.localStream) {
      await this.initLocalStream(data.type);
    }

    this.setupPeerConnection(db, [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
    ], onRemoteStream);

    this.localStream?.getTracks().forEach(track => {
      this.peerConnection?.addTrack(track, this.localStream!);
    });

    await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(data.offer!));
    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);

    await updateDoc(callRef, {
      answer: { type: answer.type, sdp: answer.sdp },
      status: 'accepted',
      updatedAt: serverTimestamp()
    });

    this.startCandidateListener(db);
    this.startCallListener(db);

    return this.localStream;
  }

  private candidateBuffer: RTCIceCandidateInit[] = [];

  private startCandidateListener(db: any) {
    if (!this.callId) return;
    
    // OPTIMIZATION: Listen to a single document for all remote candidates
    const signalingDoc = doc(db, 'calls', this.callId, 'signaling', 'candidates');
    this.candidateUnsub = onSnapshot(signalingDoc, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const candidates = data.candidates || [];
      
      candidates.forEach(async (cand: any) => {
        // Skip if it's from us
        if (cand.from === this.role) return;
        
        // We need to avoid re-adding candidates we already processed
        // In a real app we'd track IDs, here we can just try/catch
        if (this.peerConnection?.remoteDescription) {
          try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {
            // Likely duplicate, ignore
          }
        } else {
          // Check if already in buffer
          const exists = this.candidateBuffer.some(c => c.candidate === cand.candidate && c.sdpMid === cand.sdpMid);
          if (!exists) this.candidateBuffer.push(cand);
        }
      });
    });
  }

  private async processBufferedCandidates() {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;
    while (this.candidateBuffer.length > 0) {
      const candidate = this.candidateBuffer.shift();
      if (candidate) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("Error adding buffered ICE candidate", e);
        }
      }
    }
  }

  private startCallListener(db: any) {
    if (!this.callId) return;
    this.callUnsub = onSnapshot(doc(db, 'calls', this.callId), async (snap) => {
      const data = snap.data() as CallData | undefined;
      if (!data) return;

      if (this.role === 'caller' && data.status === 'accepted' && data.answer && !this.peerConnection?.remoteDescription) {
        await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(data.answer));
        await this.processBufferedCandidates();
      }

      if (['ended', 'rejected', 'missed', 'busy'].includes(data.status)) {
        if (this.role === 'caller') {
          this.logHistory(db, data);
        }
        
        if (this.callId && this.role === 'caller') {
          // Delete signaling doc after a delay to ensure all peers see the status change
          const cid = this.callId;
          setTimeout(() => {
            deleteDoc(doc(db, 'calls', cid)).catch(() => {});
          }, 5000);
        }
        this.cleanup();
      }
    });
  }

  async updateStatus(db: any, callId: string, status: CallStatus) {
    if (this.isSafeMode && status !== 'ended') return; // Only allow ending calls in safe mode
    const callRef = doc(db, 'calls', callId);
    await updateDoc(callRef, { 
      status,
      updatedAt: serverTimestamp()
    });
  }

  private async flushCandidates(db: any) {
    if (!this.callId || this.outgoingCandidateBuffer.length === 0) return;
    const candidates = [...this.outgoingCandidateBuffer];
    this.outgoingCandidateBuffer = [];
    if (this.candidateFlushTimer) {
        clearTimeout(this.candidateFlushTimer);
        this.candidateFlushTimer = null;
    }
    
    // OPTIMIZATION: Update a single document with arrayUnion instead of creating N documents
    try {
      const signalingDoc = doc(db, 'calls', this.callId, 'signaling', 'candidates');
      const candidatesWithMetadata = candidates.map(c => ({
        ...c,
        from: this.role,
        sentAt: Date.now()
      }));
      
      await setDoc(signalingDoc, {
        candidates: arrayUnion(...candidatesWithMetadata)
      }, { merge: true });
    } catch (e) {
      console.warn("Failed to flush candidates", e);
    }
  }

  private async logHistory(db: any, data: CallData) {
    try {
      const historyCol = collection(db, 'callHistory');
      await addDoc(historyCol, {
        id: data.id,
        callerId: data.callerId,
        receiverId: data.receiverId,
        callerName: data.callerName,
        callerPhoto: data.callerPhoto,
        receiverName: data.receiverName,
        receiverPhoto: data.receiverPhoto,
        type: data.type,
        status: data.status,
        duration: data.duration || 0,
        participants: [data.callerUid, data.receiverUid],
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Failed to log call history", e);
    }
  }

  public cleanup() {
    this.candidateUnsub?.();
    this.callUnsub?.();
    this.candidateBuffer = [];
    
    if (this.candidateFlushTimer) {
        clearTimeout(this.candidateFlushTimer);
        this.candidateFlushTimer = null;
    }
    this.outgoingCandidateBuffer = [];
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.ontrack = null;
      this.peerConnection.onicecandidate = null;
      this.peerConnection.onconnectionstatechange = null;
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.remoteStream = null;
    this.callId = null;
    this.role = null;
    this.candidateUnsub = null;
    this.callUnsub = null;
    this.analyzer = null;
    this.remoteAnalyzer = null;
  }

  async switchCamera() {
    if (!this.localStream) return;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    const currentFacingMode = videoTrack.getSettings().facingMode;
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: newFacingMode }
    });

    const newVideoTrack = newStream.getVideoTracks()[0];
    const sender = this.peerConnection?.getSenders().find(s => s.track?.kind === 'video');
    
    if (sender) {
      sender.replaceTrack(newVideoTrack);
    }

    this.localStream.removeTrack(videoTrack);
    videoTrack.stop();
    this.localStream.addTrack(newVideoTrack);
    
    return this.localStream;
  }

  toggleVideo(enabled: boolean) {
    this.localStream?.getVideoTracks().forEach(t => t.enabled = enabled);
  }

  toggleAudio(enabled: boolean) {
    this.localStream?.getAudioTracks().forEach(t => t.enabled = enabled);
  }

  getStreams() {
    return { local: this.localStream, remote: this.remoteStream };
  }
}

export const aeirmistCall = new CallService();

