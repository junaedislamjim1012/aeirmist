import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Settings, 
  Search, 
  Sparkles, 
  X, 
  LayoutGrid, 
  Clock, 
  ShieldCheck,
  Zap,
  Filter,
  CheckCircle2,
  Brain,
  Mail,
  ShoppingBag,
  Video,
  Tv,
  UserPlus,
  Trash2,
  VolumeX,
  Play,
  RotateCcw,
  Check,
  AlertTriangle,
  Compass
} from 'lucide-react';
import { NotificationItem } from './NotificationItem';
import type { Notification } from '../../types/notifications';
import { useAeirmist } from '../../context/AeirmistContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  getDoc,
  updateDoc, 
  doc, 
  writeBatch, 
  limit, 
  onSnapshot,
  addDoc,
  serverTimestamp,
  deleteDoc,
  setDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

interface NotificationCenterProps {
  onClose: () => void;
  onDashboardClick?: () => void;
  onSettingsClick?: () => void;
  onNavigate?: (tab: 'feed' | 'discover' | 'messenger' | 'profile' | 'settings' | 'videos' | 'dashboard') => void;
  onUserClick?: (user: any) => void;
}

// Priority classifier
const getPriority = (type: string): 'high' | 'normal' => {
  const t = String(type).toLowerCase();
  const highPriorityTypes = [
    'follow_request', 
    'payment_received', 
    'order_status_change', 
    'security_alert', 
    'mention', 
    'story_mention',
    'system_verification'
  ];
  return highPriorityTypes.includes(t) ? 'high' : 'normal';
};

// Map database notification types into correct visual categories
const getCategoryForType = (type: string): 'social' | 'messages' | 'marketplace' | 'videos' | 'stories' | 'system' => {
  const typeStr = String(type).toLowerCase();
  
  // Messages Category
  if ([
    'message', 'message_media', 'message_voice', 'message_video', 
    'call', 'call_missed', 'video_call_missed', 'store_message', 'message_received'
  ].includes(typeStr) || typeStr.includes('msg') || typeStr.includes('call')) {
    return 'messages';
  }
  
  // Marketplace Category
  if ([
    'store_follow', 'review_new', 'store_review', 'product_like', 'product_save', 
    'product_report', 'stock_low', 'product_comment', 'marketplace'
  ].some(x => typeStr.includes(x)) || typeStr.includes('store') || typeStr.includes('product') || typeStr.includes('marketplace')) {
    return 'marketplace';
  }
  
  // Videos Category
  if ([
    'video_milestone', 'video_comment', 'video_comment_reply', 
    'video_share', 'video_save', 'video_follower'
  ].includes(typeStr) || typeStr.includes('video') || typeStr.includes('milestone')) {
    return 'videos';
  }
  
  // Stories Category
  if ([
    'story_reply', 'story_react', 'story_mention', 'story_share', 
    'ngl_story_reply', 'ngl_reply', 'story'
  ].some(x => typeStr.includes(x))) {
    return 'stories';
  }
  
  // System Category
  if ([
    'security', 'system', 'verification', 'system_verification', 
    'username_change', 'password_change', 'security_login', 'profile_update', 
    'ngl_message', 'ngl'
  ].some(x => typeStr.includes(x)) || typeStr.includes('security') || typeStr.includes('system') || typeStr.includes('ngl') || typeStr.includes('pass') || typeStr.includes('user')) {
    return 'system';
  }
  
  // Social Category
  return 'social';
};

const tabsConfig = [
  { id: 'all', label: 'All', icon: <LayoutGrid size={11} /> },
  { id: 'social', label: 'Social', icon: <UserPlus size={11} /> },
  { id: 'marketplace', label: 'Market', icon: <ShoppingBag size={11} /> },
  { id: 'videos', label: 'Videos', icon: <Video size={11} /> },
  { id: 'stories', label: 'Stories', icon: <Tv size={11} /> },
  { id: 'system', label: 'System', icon: <ShieldCheck size={11} /> }
] as const;

type ActiveTabsType = 'all' | 'social' | 'marketplace' | 'videos' | 'stories' | 'system';

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  onClose, 
  onDashboardClick, 
  onSettingsClick,
  onNavigate,
  onUserClick
}) => {
  const centerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<ActiveTabsType>('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const { db, user, profile, suggestedUsers, canWrite, acceptFollowRequest, rejectFollowRequest, addToast } = useAeirmist();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState(false);

  // Load custom user mute rules from Firestore
  const [mutedUsernames, setMutedUsernames] = useState<string[]>([]);

  useEffect(() => {
    if (!db || !profile?.id) return;
    const fetchMuted = async () => {
      try {
        const d = await getDoc(doc(db, 'profiles', profile.id, 'settings', 'mutedUsers'));
        if (d.exists()) {
          setMutedUsernames(d.data().mutedUsernames || []);
        }
      } catch (err) {
        console.warn("Mute sync unavailable", err);
      }
    };
    fetchMuted();
  }, [db, profile?.id]);

  const [hiddenTypes, setHiddenTypes] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('aeirmist_hidden_notification_types') || '[]');
    } catch {
      return [];
    }
  });

  // Calculate unread categories count count for pills
  const getUnreadCounts = () => {
    const counts = {
      all: 0,
      social: 0,
      messages: 0,
      marketplace: 0,
      videos: 0,
      stories: 0,
      system: 0
    };
    notifications.forEach(n => {
      if (!n.isRead && !n.read) {
        counts.all++;
        const cat = getCategoryForType(n.type);
        counts[cat]++;
      }
    });
    return counts;
  };

  const unreadCounts = getUnreadCounts();

  const handleAction = async (notifId: string, action: string) => {
    const notif = notifications.find(n => n.id === notifId);
    if (!notif) return;

    if (processingIds.has(notifId)) return;

    setProcessingIds(prev => {
      const copy = new Set(prev);
      copy.add(notifId);
      return copy;
    });

    try {
      if (action === 'accept_follow') {
        const requestId = notif.metadata?.requestId;
        const fromId = notif.fromUserId;
        if (requestId && fromId) {
          await acceptFollowRequest(requestId, fromId);
          await markRead(notifId);
          addToast?.({
            title: "Request Accepted",
            message: `You accepted the follow request from @${notif.user?.username || 'user'}.`,
            type: "success"
          });
        }
      } else if (action === 'reject_follow') {
        const requestId = notif.metadata?.requestId;
        if (requestId) {
          await rejectFollowRequest(requestId);
          await markRead(notifId);
          addToast?.({
            title: "Request Declined",
            message: `You declined the follow request from @${notif.user?.username || 'user'}.`,
            type: "info"
          });
        }
      }
    } catch (e) {
      console.error("Action execution failed", e);
    } finally {
      setProcessingIds(prev => {
        const copy = new Set(prev);
        copy.delete(notifId);
        return copy;
      });
    }
  };

  // Real-time Firestore sync listener
  useEffect(() => {
    if (!db || !user) return;
    
    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', [profile?.id, user.uid].filter(Boolean)),
      orderBy('createdAt', 'desc'),
      limit(40)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mapped = snapshot.docs
        .map(doc => {
          const d = doc.data();
          const type = String(d.type).toLowerCase();
          const isMessage = ['message', 'message_media', 'message_voice', 'message_video', 'store_message'].includes(type) || type.includes('msg') || type === 'store_message_received' || type.includes('call');
          
          if (isMessage) return null;

          return {
            id: doc.id,
            ...d,
            isRead: d.read,
            timestampMs: d.createdAt?.toMillis() || Date.now(),
            user: {
              name: d.user?.name || d.fromUser?.displayName || 'Aeirmist Citizen',
              avatar: d.user?.avatar || d.fromUser?.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${doc.id}`,
              username: d.user?.username || (d.fromUser?.displayName ? d.fromUser.displayName.toLowerCase().replace(/\s+/g, '') : 'aeirmist_network'),
              isVerified: d.user?.isVerified || false
            }
          };
        })
        .filter(Boolean) as any[];

      setNotifications(mapped);
    }, (error) => {
      console.warn("Notification center synced with offline mesh", error);
    });

    return () => unsubscribe();
  }, [db, user?.uid]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(e => console.warn("Error requesting notification permission:", e));
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (centerRef.current && !centerRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (target.closest('[id="alerts-nav-item"]') || target.closest('button[onClick*="setIsNotificationsOpen"]')) {
          return;
        }
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Filter logic including query strings, muted users, and hidden categories
  const getFilteredNotifications = () => {
    let list = notifications.filter(n => {
      // 1. Muted users check
      const username = n.user?.username || n.user?.name || '';
      if (mutedUsernames.includes(username)) return false;

      // 2. Hidden type rules check
      if (hiddenTypes.includes(n.type)) return false;

      // 3. Tab matching check
      if (activeTab !== 'all') {
        const cat = getCategoryForType(n.type);
        if (cat !== activeTab) return false;
      }

      // 4. Priority filter
      if (priorityFilter) {
        if (getPriority(n.type) !== 'high') return false;
      }

      // 5. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const content = (n.message || n.content || '').toLowerCase();
        const name = username.toLowerCase();
        return content.includes(q) || name.includes(q);
      }

      return true;
    });

    // 6. Grouping Logic
    const grouped: any[] = [];
    const handled = new Set<string>();
    const groupableTypes = ['like', 'comment', 'follow', 'post_like', 'comment_like', 'product_like'];

    for (let i = 0; i < list.length; i++) {
      const n = list[i];
      if (handled.has(n.id)) continue;

      const type = String(n.type).toLowerCase();
      const targetId = n.metadata?.postId || n.targetId || (type === 'follow' ? 'global_follow' : null);

      if (groupableTypes.includes(type) && targetId) {
        const window24h = 24 * 60 * 60 * 1000;
        const group = [n];
        handled.add(n.id);

        for (let j = i + 1; j < list.length; j++) {
          const next = list[j];
          if (handled.has(next.id)) break;

          const nextType = String(next.type).toLowerCase();
          const nextTargetId = next.metadata?.postId || next.targetId || (nextType === 'follow' ? 'global_follow' : null);

          if (nextType === type && nextTargetId === targetId) {
            const timeDiff = Math.abs(n.timestampMs - next.timestampMs);
            if (timeDiff <= window24h) {
              group.push(next);
              handled.add(next.id);
            } else {
              break;
            }
          } else {
            break;
          }
        }

        if (group.length > 1) {
          grouped.push({
            ...n,
            groupedCount: group.length
          });
        } else {
          grouped.push(n);
        }
      } else {
        grouped.push(n);
        handled.add(n.id);
      }
    }

    return grouped;
  };

  const filteredNotifications = getFilteredNotifications();

  // Automatically mark unread notifications as read when NotificationCenter is open and viewed
  useEffect(() => {
    if (!db || !user) return;

    const unreadItems = notifications.filter(n => !(n.read || n.isRead));
    if (unreadItems.length === 0) return;

    const timer = setTimeout(async () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
      try {
        const batch = writeBatch(db);
        unreadItems.forEach(item => {
          batch.update(doc(db, 'notifications', item.id), { read: true });
        });
        await batch.commit();
      } catch (e) {
        console.warn("Auto mark read failed:", e);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [notifications.length, db, user]);

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
    if (!db || !user || !canWrite('mark_all_read', 10000)) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        if (!n.read && !n.isRead) {
          batch.update(doc(db, 'notifications', n.id), { read: true });
        }
      });
      await batch.commit();
    } catch (e) {
      console.error("Mark all read failed:", e);
    }
  };

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, isRead: true } : n));
    if (!db || !canWrite(`mark_read_${id}`, 2000)) return;
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      console.error("Mark read failed:", e);
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {
      console.error("Delete notification failed:", e);
    }
  };

  const handleMuteUser = async (username: string) => {
    if (!db || !profile?.id) return;
    const list = [...mutedUsernames, username];
    setMutedUsernames(list);
    try {
      await setDoc(doc(db, 'profiles', profile.id, 'settings', 'mutedUsers'), {
        mutedUsernames: arrayUnion(username)
      }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleHideType = (type: string) => {
    const list = [...hiddenTypes, type];
    setHiddenTypes(list);
    localStorage.setItem('aeirmist_hidden_notification_types', JSON.stringify(list));
  };

  const clearFilters = async () => {
    setHiddenTypes([]);
    localStorage.removeItem('aeirmist_hidden_notification_types');
    
    if (db && profile?.id) {
      setMutedUsernames([]);
      try {
        await updateDoc(doc(db, 'profiles', profile.id, 'settings', 'mutedUsers'), {
          mutedUsernames: []
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Navigates directly based on notification source mapping
  const handleViewSource = (notif: any) => {
    if (!onNavigate) return;
    
    const cat = getCategoryForType(notif.type);
    if (cat === 'messages') {
      onNavigate('messenger');
    } else if (cat === 'videos') {
      onNavigate('videos');
    } else if (cat === 'marketplace') {
      onNavigate('discover'); // Marketplace feed fits under activity discovery
    } else if (cat === 'stories' || cat === 'social') {
      onNavigate('feed');
    } else if (cat === 'system') {
      onNavigate('settings');
    } else {
      onNavigate('feed');
    }
    onClose();
  };

  return (
    <motion.div 
      ref={centerRef}
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed inset-y-0 right-0 w-full md:w-[465px] z-[100] bg-neutral-950/95 backdrop-blur-3xl border-l border-white/15 shadow-[-25px_0_75px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col"
    >
      {/* Header Panel */}
      <header className="p-3.5 sm:p-5 border-b border-white/15 bg-black/60 backdrop-blur-3xl relative z-10">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-aeirmist-cyan/20 flex items-center justify-center text-aeirmist-cyan border border-aeirmist-cyan/40 shadow-[0_0_15px_rgba(0,242,255,0.3)] shrink-0">
              <Bell size={17} className="animate-pulse" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-base font-black tracking-wider sm:tracking-widest text-white uppercase leading-none truncate">Notifications</h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button 
              onClick={markAllRead} 
              className="px-2 sm:px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white hover:text-aeirmist-cyan hover:bg-white/20 transition-all shrink-0 cursor-pointer whitespace-nowrap"
            >
              Mark<span className="hidden sm:inline"> All</span> Read
            </button>
            <button 
              onClick={onSettingsClick}
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 border border-white/15 text-white/70 hover:text-white hover:bg-white/20 transition-all cursor-pointer shrink-0"
              title="System Configuration"
            >
              <Settings size={15} />
            </button>
            <button 
              onClick={onClose} 
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 border border-white/15 text-white/70 hover:text-aeirmist-magenta hover:border-aeirmist-magenta/40 transition-all cursor-pointer shrink-0"
              title="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Categories Horizontal Scrolling Pill Navigation Container */}
      <div className="px-2 sm:px-3 border-b border-white/15 bg-black/40 overflow-x-auto no-scrollbar flex items-center shrink-0">
        <div className="flex items-center gap-1 sm:gap-1.5 py-2.5 pr-2">
          <button 
            onClick={() => setPriorityFilter(!priorityFilter)}
            className={`py-1 px-2 sm:px-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-wider relative transition-all duration-300 flex items-center gap-1 shrink-0 cursor-pointer ${
              priorityFilter 
                ? 'bg-aeirmist-cyan text-black border border-aeirmist-cyan shadow-[0_0_12px_rgba(0,242,255,0.4)] font-black' 
                : 'bg-white/10 border border-white/15 text-white/80 hover:text-white hover:bg-white/20'
            }`}
          >
            <Zap size={11} className={priorityFilter ? 'animate-pulse' : ''} />
            Priority
          </button>
          <div className="w-px h-3.5 bg-white/20 mx-0.5 shrink-0" />
          {tabsConfig.map(tab => {
            const count = unreadCounts[tab.id];
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-1 px-2 sm:px-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-wider relative transition-all duration-300 flex items-center gap-1 shrink-0 cursor-pointer ${
                  isActive 
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.3)]' 
                    : 'bg-white/10 border border-white/15 text-white/80 hover:text-white hover:bg-white/20'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className="w-3.5 h-3.5 ml-0.5 rounded-full bg-blue-500 text-white text-[8px] font-bold flex items-center justify-center shadow-[0_0_8px_rgba(59,130,246,0.6)] shrink-0">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notification Logs List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-3.5 bg-neutral-950/80">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
            {activeTab === 'all' ? 'Unified Feeds logs' : `${activeTab} category`}
          </span>

          <div className="flex items-center gap-2">
            {(mutedUsernames.length > 0 || hiddenTypes.length > 0) && (
              <button 
                onClick={clearFilters}
                className="text-[9px] font-black uppercase tracking-wider text-rose-400 hover:underline flex items-center gap-1"
                title="Reset active filters"
              >
                <RotateCcw size={9} />
                Reset Rules ({mutedUsernames.length + hiddenTypes.length})
              </button>
            )}
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
          </div>
        </div>
        
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => (
            <NotificationItem 
              key={notif.id} 
              notification={notif} 
              onMarkRead={() => markRead(notif.id)} 
              onDelete={deleteNotification}
              onHideType={handleHideType}
              onMuteUser={handleMuteUser}
              onViewSource={handleViewSource}
              onAction={handleAction}
              isProcessing={processingIds.has(notif.id)}
              onUserClick={onUserClick}
            />
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-20 px-6">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mb-4 text-aeirmist-cyan">
              <Bell size={24} />
            </div>
            <p className="text-sm font-bold text-white mb-1">No Notifications Yet</p>
            <p className="text-xs text-white/60 max-w-xs leading-relaxed">
              When you receive likes, comments, or direct messages, they will appear here.
            </p>
          </div>
        )}

        {/* Dynamic footer visual tag */}
        <div className="pt-6 pb-2 text-center select-none opacity-40">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[9px] font-black tracking-widest uppercase text-white/70">
            <Brain size={10} />
            Connection Secure
          </div>
        </div>
      </div>


    </motion.div>
  );
};

// Compact Simulator Pills
const SimulatorPill = ({ label, color, onClick }: { label: string; color: string; onClick: () => void }) => {
  return (
    <button 
      onClick={onClick}
      className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-lg border border-white/5 transition-all active:scale-95 cursor-pointer shrink-0 ${color}`}
    >
      {label}
    </button>
  );
};

const InsightCard = ({ label, value, color }: { label: string; value: string; color: 'magenta' | 'cyan' | 'lime' }) => {
  const colorClass = {
    'magenta': 'text-aeirmist-magenta drop-shadow-[0_0_8px_rgba(255,0,234,0.4)]',
    'cyan': 'text-aeirmist-cyan drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]',
    'lime': 'text-aeirmist-lime drop-shadow-[0_0_8px_rgba(178,255,0,0.4)]'
  }[color];

  return (
    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center flex flex-col justify-center shadow-lg">
      <div className={`text-xs font-black ${colorClass}`}>{value}</div>
      <div className="text-[8px] font-black uppercase tracking-wider text-white/30 mt-1">{label}</div>
    </div>
  );
};

export default NotificationCenter;
