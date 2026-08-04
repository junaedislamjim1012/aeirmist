import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  writeBatch,
  getDoc,
  getDocs,
  increment,
  DocumentData,
  QuerySnapshot,
  Firestore,
  deleteField
} from 'firebase/firestore';
import { Message, Chat } from '../../types/messenger';
import { aeirmistCache } from '../../services/CacheService';
import { handleFirestoreError, OperationType } from '../../lib/firebase';

class MessagingService {
  private listeners: Map<string, () => void> = new Map();
  private lastMetadataUpdate: Map<string, number> = new Map();
  private lastDeliveryUpdate: Map<string, number> = new Map();
  private isSafeMode: boolean = false;

  public setSafeMode(enabled: boolean) {
    this.isSafeMode = enabled;
  }

  public async markAsRead(db: Firestore, conversationId: string, profileId: string) {
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      [`lastRead.${profileId}`]: serverTimestamp(),
      [`unreadCount.${profileId}`]: 0
    }).catch(err => console.warn("Read confirmation rejected by core:", err));
  }

  public async deleteMessage(db: Firestore, conversationId: string, messageId: string, profileId: string, deleteType: 'me' | 'everyone' = 'everyone') {
    const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    
    if (deleteType === 'me') {
      await updateDoc(msgRef, {
        [`deletedFor.${profileId}`]: true
      });
    } else {
      // Unsend: Delete for everyone
      const batch = writeBatch(db);
      batch.update(msgRef, {
        text: 'Message Removed',
        type: 'text',
        mediaUrl: null,
        attachmentUrl: null,
        'metadata.removed': true,
        'metadata.removedBy': profileId
      });

      // Update conversation if it's the last message
      const convRef = doc(db, 'conversations', conversationId);
      const convSnap = await getDoc(convRef);
      if (convSnap.exists()) {
        const convData = convSnap.data();
        if (convData.lastMessage?.messageId === messageId || !convData.lastMessage?.messageId) {
          batch.update(convRef, {
            'lastMessage.text': 'Message Removed',
            'lastMessage.type': 'text',
            'lastMessage.mediaUrl': null,
            'lastMessage.metadata.removed': true
          });
        }
      }
      await batch.commit();
    }
  }

  public async editMessage(db: Firestore, conversationId: string, messageId: string, newText: string) {
    const batch = writeBatch(db);
    const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    
    batch.update(msgRef, {
      text: newText,
      'metadata.edited': true,
      'metadata.editedAt': serverTimestamp()
    });

    const convRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(convRef);
    if (convSnap.exists()) {
      const convData = convSnap.data();
      if (convData.lastMessage?.messageId === messageId || !convData.lastMessage?.messageId) {
        batch.update(convRef, {
          'lastMessage.text': newText,
          'lastMessage.metadata.edited': true
        });
      }
    }
    await batch.commit();
  }

  async sendMessage(
    db: Firestore,
    profile: any,
    user: any,
    conversationId: string, 
    text: string, 
    type: string = 'text', 
    mediaUrl?: string, 
    metadata: any = {}
  ): Promise<string> {
    if (!user || !user.uid || !profile || !profile.id) {
      throw new Error("Authentication required to send messages.");
    }

    console.log(`[MessagingService] sending message to ${conversationId}...`);
    let finalConvId = conversationId;
    const isNew = conversationId.startsWith('new_');
    
    try {
      console.log(`[MessagingService] Preparing batch for ${finalConvId}. Sender: ${profile.id}, User: ${user.uid}`);
      const batch = writeBatch(db);
      
      // 1. Initial resolution from inputs
      let targetProfileId = isNew ? conversationId.replace('new_', '') : (metadata.recipientId || null);
      let targetOwnerUid = metadata.receiverUid || metadata.targetProfile?.uid || metadata.targetProfile?.ownerUid || null;

      // 2. Deterministic ID resolution for 1v1
      if (isNew && targetProfileId) {
        finalConvId = [profile.id, targetProfileId].sort().join('_');
      }

      const convRef = doc(db, 'conversations', finalConvId);
      const convSnap = await getDoc(convRef);
      const exists = convSnap.exists();

      // 3. Robust parsing of finalConvId to extract missing identifiers if needed
      if (!exists) {
        if (finalConvId.includes('_profile_')) {
          const parts = finalConvId.split('_profile_');
          const p1 = parts[0];
          const p2 = 'profile_' + parts[1];
          if (!targetProfileId) {
            targetProfileId = p1 === profile.id ? p2 : p1;
          }
        } else if (finalConvId.includes('_')) {
          const parts = finalConvId.split('_');
          const otherUid = parts.find(p => p !== user.uid && !p.startsWith('profile'));
          if (otherUid && !targetOwnerUid) {
            targetOwnerUid = otherUid;
          }
        }

        // Fetch profile from Firestore if we only have the recipient UID
        if (targetOwnerUid && !targetProfileId) {
          try {
            const q = query(collection(db, 'profiles'), where('ownerUid', '==', targetOwnerUid), limit(1));
            const snap = await getDocs(q);
            if (!snap.empty) {
              targetProfileId = snap.docs[0].id;
              if (!metadata.targetProfile) {
                metadata.targetProfile = { id: snap.docs[0].id, ...snap.docs[0].data() };
              }
            }
          } catch (e) {
            console.error("[MessagingService] Failed to resolve target profile by UID:", e);
          }
        }

        // Parse owner UID from profileId if missing
        if (targetProfileId && !targetOwnerUid) {
          if (targetProfileId.startsWith('profile_')) {
            const parts = targetProfileId.split('_');
            if (parts.length >= 2) {
              targetOwnerUid = parts[1];
            }
          }
        }

        // Absolute fallback to avoid crashes
        if (!targetProfileId) {
          targetProfileId = 'unknown_profile';
        }
        if (!targetOwnerUid) {
          targetOwnerUid = targetProfileId;
        }
      }

      const isSelfChat = targetProfileId === profile.id;
      const isSelfUid = targetOwnerUid === user.uid;
      
      const profileIds = isSelfChat ? [profile.id] : [profile.id, targetProfileId].filter(Boolean).sort();
      const participants = isSelfUid ? [user.uid] : [user.uid, targetOwnerUid].filter(Boolean).sort();

      console.log(`[MessagingService] Target Profile ID: ${targetProfileId}, Owner UID: ${targetOwnerUid}, Final ID: ${finalConvId}`);

      const messageId = doc(collection(db, 'conversations', finalConvId, 'messages')).id;

      const messageData: any = {
        senderId: profile.id,
        senderUid: user.uid,
        text,
        type,
        attachmentUrl: mediaUrl || null,
        mediaUrl: mediaUrl || null,
        metadata: {
           ...metadata,
           optimisticId: metadata.optimisticId || null,
           isOffline: metadata.isOffline || false
        },
        createdAt: serverTimestamp(),
        deliveredTo: [profile.id], 
        seenBy: [profile.id],
        status: 'sent', 
        timestamp: serverTimestamp(),
        timestampMs: Date.now()
      };

      if (metadata.mood) {
        messageData.mood = metadata.mood;
      }
      
      if (!exists) {
        console.log(`[MessagingService] Initialising new activity: ${finalConvId}`);
        
        // Social Graph Check: Determine if it starts as a request
        const isFollower = metadata.isFollower || false;
        
        let initialStatus = 'request';
        if (targetProfileId === profile.id || isFollower) {
          initialStatus = 'active';
        }

        batch.set(convRef, {
          participants, 
          profileIds,   
          participantDetails: {
            [profile.id]: { 
              displayName: profile.displayName || profile.username, 
              photoURL: profile.photoURL, 
              username: profile.username, 
              uid: user.uid 
            },
            [targetProfileId!]: metadata.targetProfile || { 
              displayName: 'Aeirmist User', 
              photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetProfileId}`, 
              username: targetProfileId, 
              uid: targetOwnerUid || targetProfileId
            }
          },
          lastMessage: {
            text,
            senderId: profile.id,
            timestamp: serverTimestamp(),
            type,
            mediaUrl: mediaUrl || null,
            mood: metadata.mood || null,
            messageId: messageId
          },
          unreadCount: {
            [targetProfileId!]: 1,
            [profile.id]: 0
          },
          lastRead: { [profile.id]: serverTimestamp() },
          lastDelivered: { [profile.id]: serverTimestamp() },
          status: initialStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Trigger initial notification
        const notifRef = doc(collection(db, 'notifications'));
        if (targetOwnerUid && !this.isSafeMode && !isSelfUid) {
          batch.set(notifRef, {
            userId: targetProfileId || targetOwnerUid,
            fromUserId: profile.id,
            fromUser: {
              displayName: profile.displayName || profile.username,
              photoURL: profile.photoURL
            },
            type: 'message',
            message: type === 'text' ? (text.substring(0, 50) + (text.length > 50 ? '...' : '')) : `Sent a ${type}`,
            metadata: { conversationId: finalConvId },
            read: false,
            createdAt: serverTimestamp()
          });
        }
      } else {
        console.log(`[MessagingService] Updating existing chat: ${finalConvId}`);
        const receiverId = targetProfileId || metadata.recipientId || (convSnap.data()?.profileIds?.find((id: string) => id !== profile.id)) || null;
        const receiverUid = targetOwnerUid || metadata.receiverUid || (convSnap.data()?.participants?.find((uid: string) => uid !== user.uid)) || null;
        
        // OPTIMIZATION: Only send notification if receiver is NOT online 
        // or if explicitly requested (e.g. mention)
        const shouldNotify = !metadata.isReceiverOnline || metadata.forceNotify;
        
        this.updateExistingConversation(batch, db, finalConvId, profile.id, receiverId, receiverUid, text, type, mediaUrl, { ...metadata, shouldNotify, senderUid: user.uid, messageId });
      }
      
      const msgRef = doc(db, 'conversations', finalConvId, 'messages', messageId);
      batch.set(msgRef, messageData);
      
      console.log("[MessagingService] Committing neural batch...");
      await batch.commit();
      console.log("[MessagingService] Batch committed successfully.");
      return finalConvId;
    } catch (e: any) {
      console.error("[MessagingService] ATOMIC FAILURE:", e);
      if (e.code === 'permission-denied') {
        console.error("[MessagingService] Permissions check failed - verify security rules.");
      }
      throw e;
    }
  }

  private updateExistingConversation(
    batch: any, 
    db: Firestore, 
    convId: string, 
    senderId: string, 
    receiverId: string | null, 
    receiverUid: string | null,
    text: string, 
    type: string, 
    mediaUrl?: string, 
    metadata: any = {}
  ) {
    const convRef = doc(db, 'conversations', convId);
    
    // OPTIMIZATION: Throttle conversation metadata updates to save write quota
    const now = Date.now();
    const lastUpdate = this.lastMetadataUpdate.get(convId) || 0;
    const isMajorUpdate = now - lastUpdate > 30000; // 30 seconds frequency for heavy metadata

    const updates: any = {};

    // ALWAYS update updatedAt and lastMessage so the UI reflects the real-time chat state
    updates.updatedAt = serverTimestamp();
    updates.lastMessage = {
      text,
      senderId,
      timestamp: serverTimestamp(),
      type,
      mediaUrl: mediaUrl || null,
      mood: metadata.mood || null,
      messageId: metadata.messageId || null
    };

    if (isMajorUpdate) {
      this.lastMetadataUpdate.set(convId, now);
      updates[`lastRead.${senderId}`] = serverTimestamp();
      updates[`lastDelivered.${senderId}`] = serverTimestamp();
      updates[`isArchived.${senderId}`] = false;
    }

    // Ensure participants array is ALWAYS present for security rules
    if (metadata.receiverUid && metadata.senderUid) {
       updates.participants = metadata.senderUid === metadata.receiverUid ? [metadata.senderUid] : [metadata.senderUid, metadata.receiverUid].sort();
    }
    
    // Ensure profileIds is present for logic
    if (metadata.recipientId) {
      updates.profileIds = senderId === metadata.recipientId ? [senderId] : [senderId, metadata.recipientId].sort();
    }

    if (metadata.targetProfile && metadata.recipientId) {
      updates[`participantDetails.${metadata.recipientId}`] = metadata.targetProfile;
    }
    if (metadata.senderName || metadata.senderPhoto || metadata.senderUid) {
      updates[`participantDetails.${senderId}`] = {
        displayName: metadata.senderName || 'Unknown',
        photoURL: metadata.senderPhoto || '',
        uid: metadata.senderUid || '',
        username: senderId
      };
    }

    // Reset deletedFor flags so the conversation reappears upon new signals/messages
    updates[`deletedFor.${senderId}`] = null;
    if (receiverId) {
      updates[`deletedFor.${receiverId}`] = null;
      if (receiverId !== senderId) {
        updates[`unreadCount.${receiverId}`] = increment(1);
      }
      updates[`isArchived.${receiverId}`] = false;
    }

    batch.update(convRef, updates);

    // Skip non-essential notifications in Safe Mode to save writes
    if (receiverUid && metadata.shouldNotify && !this.isSafeMode && metadata.senderUid !== receiverUid) {
      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        userId: receiverId || receiverUid, // Use Profile ID if available, else Auth UID
        fromUserId: senderId,
        fromUser: {
          displayName: metadata.senderName || 'Unknown',
          photoURL: metadata.senderPhoto || ''
        },
        type: 'message',
        message: type === 'text' ? (text.substring(0, 50) + (text.length > 50 ? '...' : '')) : `Sent a ${type}`,
        metadata: { conversationId: convId },
        read: false,
        createdAt: serverTimestamp()
      });
    }
  }

  subscribeToMessages(
    db: Firestore, 
    conversationId: string, 
    currentProfileId: string,
    chatData: any,
    callback: (messages: Message[]) => void,
    limitCount: number = 50
  ) {
    console.log(`[MessagingService] Subscribed to messages for ${conversationId}`);
    
    // 1. Instant Cache Load
    try {
      aeirmistCache.getMessages(conversationId).then(cached => {
        if (cached && cached.length > 0) {
          console.log(`[MessagingService] Instant Cache Hit: ${cached.length} messages for ${conversationId}`);
          const formatted = cached.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestampMs: m.timestamp
          })).sort((a, b) => a.timestampMs - b.timestampMs);
          callback(formatted as any);
        }
      }).catch(err => console.warn("[MessagingService] Cache retrieval failure:", err));
    } catch (e) {
      console.warn("[MessagingService] Cache logic error:", e);
    }

    const key = `messages_${conversationId}`;
    if (this.listeners.has(key)) {
      this.listeners.get(key)!();
    }

    const otherParticipantId = chatData.otherParticipantId ||
                             chatData.profileIds?.find((id: string) => id !== currentProfileId) || 
                             chatData.participants?.find((uid: string) => uid !== currentProfileId); // Fallback uid

    const parseTimestampMs = (val: any): number => {
      if (!val) return 0;
      if (typeof val.toMillis === 'function') return val.toMillis();
      if (typeof val.seconds === 'number') return val.seconds * 1000;
      if (typeof val === 'number') return val;
      if (val instanceof Date) return val.getTime();
      try {
        const d = new Date(val);
        return isNaN(d.getTime()) ? 0 : d.getTime();
      } catch (e) {
        return 0;
      }
    };

    const otherLastRead = parseTimestampMs(chatData?.lastRead?.[otherParticipantId || '']);
    const otherLastDelivered = parseTimestampMs(chatData?.lastDelivered?.[otherParticipantId || '']);

    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const myClearedAtMs = chatData?.clearedAt?.[currentProfileId]?.toMillis?.() || 0;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`[MessagingService] Incoming messages for ${conversationId}: ${snapshot.size} items.`);
      const messages = snapshot.docs
        .map(doc => {
          const data = doc.data({ serverTimestamps: 'estimate' });
          const date = data.createdAt?.toDate?.() || data.timestamp?.toDate?.() || new Date();
          const timestampMs = data.createdAt?.toMillis?.() || data.timestamp?.toMillis?.() || Date.now();
          
          const isSeenVal = data.isSeen || (data.senderId === currentProfileId && timestampMs <= otherLastRead);
          console.log(`[MessagingService DEBUG] isSeen computation:`, {
            messageId: doc.id,
            timestampMs,
            otherLastRead,
            otherParticipantId,
            isSeen: isSeenVal,
            text: data.text
          });

          return {
            ...data,
            id: doc.id,
            timestamp: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestampMs,
            isSeen: isSeenVal,
            isDelivered: data.isDelivered || (data.senderId === currentProfileId && timestampMs <= otherLastDelivered),
            status: data.status || (data.timestamp ? 'sent' : 'sending')
          } as Message;
        })
        .filter(m => {
          if ((m as any).deletedFor?.[currentProfileId] === true) return false;
          // Skip myClearedAtMs filter if the message is pending/optimistic/sending
          const isPendingOrOptimistic = (m.status as string) === 'sending' || (m.status as string) === 'pending' || m.id?.startsWith('opt_') || !m.timestampMs || m.timestampMs === 0;
          if (isPendingOrOptimistic) return true;
          if (m.timestampMs <= myClearedAtMs) return false;
          
          const deletedAtConv = chatData?.deletedFor?.[currentProfileId];
          if (typeof deletedAtConv === 'number' && m.timestampMs <= deletedAtConv) return false;

          return true;
        });
      
      const reversed = messages.reverse();

      // 2. Persist to Cache (Async)
      try {
        reversed.forEach(m => {
          // Prepare for cache storage (ensure timestamp is number)
          const cacheItem = { ...m, timestamp: m.timestampMs };
          aeirmistCache.saveMessage(cacheItem).catch(() => {});
        });
      } catch (e) {}

      // Update my delivered status if I've received messages from others
      const myLastDeliveredMs = chatData?.lastDelivered?.[currentProfileId]?.toMillis?.() || 0;
      const unconfirmed = messages.filter(m => 
        m.senderId !== currentProfileId && 
        m.timestampMs > myLastDeliveredMs 
        
      );

      if (unconfirmed.length > 0 && !this.isSafeMode) {
        const lastUpdate = this.lastDeliveryUpdate.get(conversationId) || 0;
        if (Date.now() - lastUpdate > 5000) { // 5 seconds
          this.lastDeliveryUpdate.set(conversationId, Date.now());
          console.log(`[MessagingService] Confirming delivery for ${unconfirmed.length} messages.`);
          const convRef = doc(db, 'conversations', conversationId);
          updateDoc(convRef, {
            [`lastDelivered.${currentProfileId}`]: serverTimestamp()
          }).catch(() => {});
        }
      }

      callback(reversed);
    }, (error) => {
      console.error(`[MessagingService] Snapshot error for ${conversationId}:`, error);
      handleFirestoreError(error, OperationType.LIST, `conversations/${conversationId}/messages`);
    });

    this.listeners.set(key, unsubscribe);
    return unsubscribe;
  }

  subscribeToChats(db: Firestore, userUid: string, profileId: string, callback: (chats: Chat[]) => void) {
    console.log(`[MessagingService] Subscribing to inbox for UID: ${userUid}`);

    // 1. Instant Cache Load
    try {
      aeirmistCache.getConversations().then(cached => {
        if (cached && cached.length > 0) {
          const currentProfileChats = cached.filter(chat => 
            !chat.profileIds || chat.profileIds.includes(profileId) || chat.participants?.includes(userUid)
          );
          
          currentProfileChats.sort((a, b) => {
            const getMs = (val: any) => {
              if (!val) return 0;
              if (typeof val.toMillis === 'function') return val.toMillis();
              if (val instanceof Date) return val.getTime();
              if (typeof val === 'number') return val;
              if (val.seconds) return val.seconds * 1000;
              return 0;
            };
            return getMs(b.updatedAt) - getMs(a.updatedAt);
          });

          if (currentProfileChats.length > 0) {
            console.log(`[MessagingService] Instant Cache Hit: ${currentProfileChats.length} conversations.`);
            callback(currentProfileChats);
          }
        }
      }).catch(err => console.warn("[MessagingService] Inbox cache retrieval failure:", err));
    } catch (e) {}

    const key = `chats_${userUid}`;
    if (this.listeners.has(key)) {
      this.listeners.get(key)!();
    }

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userUid),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`[MessagingService] Inbox snapshot: ${snapshot.size} total active frequencies.`);
      const chats = snapshot.docs.map(doc => ({ 
        ...doc.data(), 
        id: doc.id 
      } as Chat));

      // Sort client-side by updatedAt descending to bypass composite index requirements
      chats.sort((a, b) => {
        const getMs = (val: any) => {
          if (!val) return 0;
          if (typeof val.toMillis === 'function') return val.toMillis();
          if (val instanceof Date) return val.getTime();
          if (typeof val === 'number') return val;
          if (val.seconds) return val.seconds * 1000;
          return 0;
        };
        return getMs(b.updatedAt) - getMs(a.updatedAt);
      });
      
      // Filter by profileId if possible, but fallback to all chats if profileIds is missing (legacy support)
      const currentProfileChats = chats.filter(chat => 
        !chat.profileIds || chat.profileIds.includes(profileId) || chat.participants?.includes(userUid)
      );

      // 2. Persist to Cache (Async)
      try {
        currentProfileChats.forEach(chat => {
          aeirmistCache.saveConversation(chat).catch(() => {});
        });
      } catch (e) {}

      callback(currentProfileChats);
    }, (error) => {
      console.error(`[MessagingService] Inbox sync failure:`, error);
      handleFirestoreError(error, OperationType.LIST, 'conversations_sync');
    });

    this.listeners.set(key, unsubscribe);
    return unsubscribe;
  }

  // Group Chat Functions

  public async createGroupConversation(db: Firestore, creatorId: string, memberIds: string[], groupName: string, groupPhotoURL?: string) {
    const convRef = doc(collection(db, 'conversations'));
    const participants = [creatorId, ...memberIds].sort();
    
    await setDoc(convRef, {
      isGroup: true,
      groupName,
      groupPhotoURL: groupPhotoURL || null,
      participants,
      admins: [creatorId],
      createdBy: creatorId,
      isDiscoverable: false,
      pendingJoinRequests: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return convRef.id;
  }

  public async addGroupMembers(db: Firestore, conversationId: string, requesterId: string, newMemberIds: string[]) {
    const convRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(convRef);
    if (!convSnap.exists() || !convSnap.data().participants.includes(requesterId)) {
        throw new Error("Unauthorized to add members");
    }
    
    await updateDoc(convRef, {
        participants: Array.from(new Set([...convSnap.data().participants, ...newMemberIds]))
    });
  }

  public async removeGroupMember(db: Firestore, conversationId: string, adminId: string, memberIdToRemove: string) {
    const convRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(convRef);
    if (!convSnap.exists() || !convSnap.data().admins.includes(adminId)) {
        throw new Error("Unauthorized to remove members");
    }
    
    await updateDoc(convRef, {
        participants: convSnap.data().participants.filter((id: string) => id !== memberIdToRemove),
        admins: convSnap.data().admins.filter((id: string) => id !== memberIdToRemove)
    });
  }

  public async promoteToAdmin(db: Firestore, conversationId: string, adminId: string, memberIdToPromote: string) {
    const convRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(convRef);
    if (!convSnap.exists() || !convSnap.data().admins.includes(adminId)) {
        throw new Error("Unauthorized to promote");
    }

    await updateDoc(convRef, {
        admins: Array.from(new Set([...convSnap.data().admins, memberIdToPromote]))
    });
  }

  public async demoteAdmin(db: Firestore, conversationId: string, adminId: string, memberIdToDemote: string) {
    const convRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(convRef);
    if (!convSnap.exists() || !convSnap.data().admins.includes(adminId)) {
        throw new Error("Unauthorized to demote");
    }

    await updateDoc(convRef, {
        admins: convSnap.data().admins.filter((id: string) => id !== memberIdToDemote)
    });
  }

  public async requestToJoinGroup(db: Firestore, conversationId: string, requesterId: string) {
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
        pendingJoinRequests: Array.from(new Set([requesterId])) 
    });
  }

  public async approveJoinRequest(db: Firestore, conversationId: string, adminId: string, requesterId: string) {
    const batch = writeBatch(db);
    const convRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(convRef);
    if (!convSnap.exists() || !convSnap.data().admins.includes(adminId)) {
        throw new Error("Unauthorized to approve join request");
    }

    batch.update(convRef, {
        pendingJoinRequests: convSnap.data().pendingJoinRequests.filter((id: string) => id !== requesterId),
        participants: Array.from(new Set([...convSnap.data().participants, requesterId]))
    });
    await batch.commit();
  }

  public async rejectJoinRequest(db: Firestore, conversationId: string, adminId: string, requesterId: string) {
    const convRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(convRef);
    if (!convSnap.exists() || !convSnap.data().admins.includes(adminId)) {
        throw new Error("Unauthorized to reject join request");
    }

    await updateDoc(convRef, {
        pendingJoinRequests: convSnap.data().pendingJoinRequests.filter((id: string) => id !== requesterId)
    });
  }

  cleanup(key?: string) {
    if (key) {
      if (this.listeners.has(key)) {
        this.listeners.get(key)!();
        this.listeners.delete(key);
      }
    } else {
      this.listeners.forEach(unsub => unsub());
      this.listeners.clear();
    }
  }
}

export const messagingService = new MessagingService();
