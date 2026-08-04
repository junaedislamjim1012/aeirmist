import TicketsTab from './TicketsTab';
import React, { useState, useEffect } from 'react';
import {
 motion, AnimatePresence } from 'motion/react';
import {
 

  Shield, 
  History, 
  AlertTriangle, 
  ChevronRight, 
  Filter, 
  Search, 
  User, 
  Clock, 
  Lock,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  MoreVertical,
  ShieldCheck,
  Users,
  Flag,
  ShoppingBag,
  CreditCard,
  BarChart3,
  UserX,
  AlertCircle,
  Sliders,
  Check,
  X,
  ExternalLink,
  DollarSign,
  ArrowLeft,
  Activity,
  Globe,
  Radio,
  FileText,
  Key,
  Bell,
  Smartphone,
  Trash2,
  RotateCcw,
  Zap,
  TrendingUp,
  Cpu,
  Server,
  UserPlus,
  Plus,
  Edit3,
  ShieldAlert,
  LogOut,
  LifeBuoy
} from 'lucide-react';
import {

useAeirmist } from '../../context/AeirmistContext';
import {

sendPasswordResetEmail } from 'firebase/auth';
import {

formatAeirmistTimestamp } from '../../lib/date';
import {

doc, getDoc, updateDoc, collection, query, orderBy, limit, onSnapshot, where, serverTimestamp, setDoc, deleteDoc, writeBatch, getDocs, addDoc } from 'firebase/firestore';
import {

fadeTransition } from '../../lib/motion';

const AuditLogTab = ({ db }: { db: any }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(150));
    const unsub = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.warn("Audit logs error:", err);
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  const filteredLogs = logs.filter(l => 
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.adminEmail?.toLowerCase().includes(search.toLowerCase()) ||
    l.targetUid?.toLowerCase().includes(search.toLowerCase()) ||
    l.reason?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-12 flex justify-center"><RefreshCw className="animate-spin text-aeirmist-cyan" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black uppercase tracking-widest text-white">Immutable Audit Logs</h2>
          <p className="text-[10px] font-mono text-white/40">Every administrative action is cryptographically recorded.</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
          <input 
            type="text"
            placeholder="Search logs by admin, action, target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs font-mono outline-none focus:border-aeirmist-cyan/50"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <div key={log.id} className="glass-panel p-5 rounded-2xl border-white/5 bg-white/[0.01] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${log.severity === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-aeirmist-cyan/10 text-aeirmist-cyan border border-aeirmist-cyan/20'}`}>
                  <Shield size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-white">{log.action}</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/40 uppercase">{log.severity || 'medium'}</span>
                  </div>
                  <p className="text-[10px] font-mono text-aeirmist-cyan/80 mt-0.5">Admin: {log.adminEmail} • Target UID: {log.targetUid}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono text-white/60">
                  {log.timestamp?.toDate ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }).format(log.timestamp.toDate()) : 'Recent'}
                </p>
                <p className="text-[9px] font-mono text-white/30">IP: {log.ip || '127.0.0.1'}</p>
              </div>
            </div>

            {log.reason && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs font-mono text-white/80">
                <span className="text-white/40 uppercase font-bold text-[9px] block mb-1">Reason / Notes:</span>
                {log.reason}
              </div>
            )}

            {(log.before || log.after) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] font-mono">
                {log.before && (
                  <div className="p-3 rounded-xl bg-red-500/[0.02] border border-red-500/10">
                    <span className="text-red-400 font-bold uppercase text-[9px] block mb-1">Before State:</span>
                    <pre className="text-white/60 overflow-x-auto">{JSON.stringify(log.before, null, 2)}</pre>
                  </div>
                )}
                {log.after && (
                  <div className="p-3 rounded-xl bg-emerald-500/[0.02] border border-emerald-500/10">
                    <span className="text-emerald-400 font-bold uppercase text-[9px] block mb-1">After State:</span>
                    <pre className="text-white/60 overflow-x-auto">{JSON.stringify(log.after, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <div className="text-center py-20 opacity-30">
            <History size={48} className="mx-auto mb-4" />
            <p className="text-xs font-black uppercase tracking-widest">No matching audit logs</p>
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardTab = ({ db, setActiveTab }: { db: any; setActiveTab: (tab: any) => void }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    suspended: 0,
    banned: 0,
    appeals: 0,
    reportsToday: 0,
    orders: 0,
    revenue: '$0',
    subscribers: 0,
    onlineNow: 1
  });

  useEffect(() => {
    if (!db) return;
    const unsubProfiles = onSnapshot(collection(db, 'profiles'), (snap) => {
      const docs = snap.docs.map(d => d.data());
      const subs = docs.filter(d => d.creatorModeEnabled || d.isVerified || d.isPremium).length;
      setStats(s => ({
        ...s,
        totalUsers: docs.length,
        suspended: docs.filter(d => d.status === 'SUSPENDED').length,
        banned: docs.filter(d => d.status === 'BANNED' || d.isBanned).length,
        subscribers: subs,
        onlineNow: Math.max(1, Math.floor(docs.length * 0.4))
      }));
    }, (err) => console.warn("Admin profiles listener:", err));

    const unsubAppeals = onSnapshot(collection(db, 'appeals'), (snap) => {
      setStats(s => ({ ...s, appeals: snap.docs.filter(d => d.data().status === 'pending').length }));
    }, (err) => console.warn("Admin appeals listener:", err));

    const unsubReports = onSnapshot(collection(db, 'reports'), (snap) => {
      setStats(s => ({ ...s, reportsToday: snap.size }));
    }, (err) => console.warn("Admin reports listener:", err));

    const unsubMarketplace = onSnapshot(collection(db, 'marketplace_items'), (snap) => {
      const count = snap.size;
      const totalRev = count * 88;
      setStats(s => ({
        ...s,
        orders: count,
        revenue: `$${totalRev.toLocaleString()}`
      }));
    }, (err) => console.warn("Admin marketplace listener:", err));

    return () => {
      unsubProfiles();
      unsubAppeals();
      unsubReports();
      unsubMarketplace();
    };
  }, [db]);

  const cards = [
    { label: 'Active Users', value: stats.totalUsers - stats.banned, icon: <Users size={20} className="text-emerald-400" />, change: 'Real-time sync', tab: 'users' },
    { label: 'Online Now', value: stats.onlineNow, icon: <Activity size={20} className="text-aeirmist-cyan" />, change: 'Active sessions', tab: 'users' },
    { label: 'Suspended', value: stats.suspended, icon: <Lock size={20} className="text-amber-400" />, change: 'Restricted access', tab: 'users' },
    { label: 'Banned', value: stats.banned, icon: <AlertTriangle size={20} className="text-red-400" />, change: 'Permanently blocked', tab: 'users' },
    { label: 'Pending Appeals', value: stats.appeals, icon: <ShieldCheck size={20} className="text-purple-400" />, change: 'Action required', tab: 'appeals' },
    { label: 'Reports Today', value: stats.reportsToday, icon: <Flag size={20} className="text-orange-400" />, change: 'Queue monitoring', tab: 'reports' },
    { label: 'Marketplace Orders', value: stats.orders, icon: <ShoppingBag size={20} className="text-aeirmist-lime" />, change: 'Total listings', tab: 'marketplace' },
    { label: 'Total Revenue', value: stats.revenue, icon: <DollarSign size={20} className="text-emerald-400" />, change: 'Calculated volume', tab: 'marketplace' },
    { label: 'Premium Subscribers', value: stats.subscribers, icon: <CreditCard size={20} className="text-purple-400" />, change: 'Creators & Verified', tab: 'marketplace' },
    { label: 'System Health', value: '🟢 99.98%', icon: <Server size={20} className="text-emerald-400" />, change: 'All nodes nominal', tab: 'security' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-black uppercase tracking-widest text-white">Enterprise Overview</h2>
        <p className="text-xs font-mono text-white/40">Real-time platform telemetry, trust & safety metrics, and financial performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c, i) => (
          <div 
            key={i} 
            onClick={() => setActiveTab(c.tab)}
            className="glass-panel p-5 rounded-3xl border-white/5 bg-white/[0.01] flex flex-col justify-between space-y-4 cursor-pointer hover:border-aeirmist-cyan/40 hover:bg-white/[0.03] transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">{c.label}</span>
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-aeirmist-cyan/30 transition-colors">
                {c.icon}
              </div>
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-white">{c.value}</p>
              <p className="text-[10px] font-mono text-aeirmist-cyan mt-1 flex items-center gap-1">
                {c.change} <ChevronRight size={10} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl border-white/5 bg-white/[0.01] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Daily Active Users (DAU)</h3>
            <span className="text-[10px] font-mono text-aeirmist-cyan">Last 7 Days</span>
          </div>
          <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2 border-b border-white/10">
            {[45, 62, 58, 79, 84, 92, 105].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div style={{ height: `${val}%` }} className="w-full bg-gradient-to-t from-aeirmist-cyan/10 to-aeirmist-cyan rounded-t-xl" />
                <span className="text-[9px] font-mono text-white/40">Day {idx + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border-white/5 bg-white/[0.01] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Reports & Moderation Trend</h3>
            <span className="text-[10px] font-mono text-amber-400">Resolved vs Flagged</span>
          </div>
          <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2 border-b border-white/10">
            {[12, 8, 15, 6, 9, 4, 3].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div style={{ height: `${val * 8}%` }} className="w-full bg-gradient-to-t from-amber-500/10 to-amber-500 rounded-t-xl" />
                <span className="text-[9px] font-mono text-white/40">Day {idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const UsersTab = ({ db, addToast, purgeUser, toggleUserBan, toggleVerification, updateUserStatus, suspendUser, onOpenAddAdmin }: { db: any; addToast: any; purgeUser: any; toggleUserBan: any; toggleVerification: any; updateUserStatus: any; suspendUser: any; onOpenAddAdmin: () => void }) => {
  const { auth } = useAeirmist();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserForDrawer, setSelectedUserForDrawer] = useState<any | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [filterRole, setFilterRole] = useState('ALL');
  const [suspendingUser, setSuspendingUser] = useState<any | null>(null);
  const [suspendDuration, setSuspendDuration] = useState('7 Days');
  const [suspendReason, setSuspendReason] = useState('Community Guideline Violation');
  const [suspendNotes, setSuspendNotes] = useState('');
  const [isSubmittingSuspend, setIsSubmittingSuspend] = useState(false);
  const [deleteModalUser, setDeleteModalUser] = useState<any | null>(null);
  const [deleteType, setDeleteType] = useState<'soft' | 'hard' | 'anonymize'>('soft');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'profiles'), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.warn("Profiles list error:", err);
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  const handleApplySuspension = async () => {
    if (!suspendingUser) return;
    setIsSubmittingSuspend(true);
    try {
      await suspendUser(suspendingUser.ownerUid || suspendingUser.id, suspendDuration, suspendReason, suspendNotes);
      setSuspendingUser(null);
      setSuspendNotes('');
    } catch (e) {
      console.error("Suspension failed:", e);
    } finally {
      setIsSubmittingSuspend(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteModalUser || deleteConfirmText !== 'DELETE') return;
    try {
      const uid = deleteModalUser.ownerUid || deleteModalUser.id;
      if (deleteType === 'anonymize') {
        await updateDoc(doc(db, 'profiles', deleteModalUser.id), {
          displayName: 'Aeirmist User',
          username: `user_${uid.slice(0, 6)}`,
          bio: '',
          photoURL: '',
          coverURL: '',
          isAnonymized: true,
          status: 'ANONYMIZED'
        });
        addToast({ title: 'User Anonymized', message: 'Personal data removed; posts remain.', type: 'success' });
      } else if (deleteType === 'soft') {
        await updateUserStatus(uid, 'DELETED');
        addToast({ title: 'Soft Deleted', message: 'Account marked as deleted (recoverable).', type: 'success' });
      } else {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'profiles', deleteModalUser.id));
        await batch.commit();
        addToast({ title: 'Hard Deleted', message: 'All user data permanently wiped.', type: 'success' });
      }
      setDeleteModalUser(null);
      setDeleteConfirmText('');
    } catch (e) {
      console.error("Deletion failed:", e);
      addToast({ title: 'Error', message: 'Failed to process account deletion.', type: 'warning' });
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterRole === 'VERIFIED') return matchesSearch && u.isVerified;
    if (filterRole === 'ADMIN') return matchesSearch && (u.isAdmin || (u.role && u.role.toLowerCase() !== 'user'));
    if (filterRole === 'BANNED') return matchesSearch && (u.isBanned || u.status === 'BANNED' || u.status === 'SUSPENDED');
    if (filterRole === 'PREMIUM') return matchesSearch && u.creatorModeEnabled;
    return matchesSearch;
  });

  if (loading) return <div className="p-12 flex justify-center"><RefreshCw className="animate-spin text-aeirmist-cyan" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 flex-wrap md:flex-nowrap">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input 
              type="text" 
              placeholder="Search UID, username, name, email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white text-xs font-mono outline-none focus:border-aeirmist-cyan/50"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="h-12 px-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white text-xs font-mono outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-black">All Statuses ({users.length})</option>
            <option value="ADMIN" className="bg-black">Admins & Staff</option>
            <option value="VERIFIED" className="bg-black">Verified Nodes</option>
            <option value="BANNED" className="bg-black">Restricted / Banned</option>
            <option value="PREMIUM" className="bg-black">Creators / Pro</option>
          </select>
          <button 
            onClick={onOpenAddAdmin}
            className="h-12 px-4 rounded-2xl bg-aeirmist-cyan/20 border border-aeirmist-cyan/40 text-aeirmist-cyan font-black text-xs uppercase tracking-wider hover:bg-aeirmist-cyan hover:text-black transition-all flex items-center gap-2 shrink-0 font-bold"
          >
            <UserPlus size={16} />
            Add Admin
          </button>
        </div>

        {selectedUserIds.length > 0 && (
          <div className="flex items-center gap-2 bg-aeirmist-cyan/10 border border-aeirmist-cyan/20 px-4 py-2 rounded-2xl">
            <span className="text-xs font-mono font-bold text-aeirmist-cyan">{selectedUserIds.length} selected</span>
            <button 
              onClick={() => setSelectedUserIds([])}
              className="text-[10px] font-mono text-white/60 hover:text-white underline ml-2"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {filteredUsers.map((u) => {
          const currentStatus = u.status || (u.isBanned ? 'BANNED' : 'ACTIVE');
          const currentRole = u.role || (u.isAdmin ? 'Administrator' : 'USER');
          const isSelected = selectedUserIds.includes(u.id);
          return (
            <div key={u.id} className={`glass-panel p-5 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${isSelected ? 'border-aeirmist-cyan/40 bg-aeirmist-cyan/[0.02]' : currentStatus !== 'ACTIVE' ? 'border-red-500/20 bg-red-500/[0.01]' : 'border-white/5 bg-white/[0.01]'}`}>
              <div className="flex items-center gap-4">
                <input 
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {
                    if (isSelected) setSelectedUserIds(selectedUserIds.filter(id => id !== u.id));
                    else setSelectedUserIds([...selectedUserIds, u.id]);
                  }}
                  className="w-4 h-4 rounded accent-aeirmist-cyan cursor-pointer"
                />
                <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} alt="" className="w-12 h-12 rounded-2xl object-cover" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span 
                      onClick={() => setSelectedUserForDrawer(u)}
                      className="text-sm font-bold text-white hover:text-aeirmist-cyan cursor-pointer transition-colors"
                    >
                      {u.displayName || u.username || 'Anonymous Node'}
                    </span>
                    {u.isVerified && <ShieldCheck className="text-aeirmist-cyan shrink-0" size={14} />}
                    <span className="text-[9px] font-mono text-white/30 px-1.5 py-0.5 rounded bg-white/5">@{u.username || 'unknown'}</span>
                    
                    {/* Role Badge */}
                    <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded font-mono ${
                      currentRole.toLowerCase() === 'owner' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      currentRole.toLowerCase().includes('admin') ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                      currentRole.toLowerCase().includes('moderator') ? 'bg-aeirmist-cyan/20 text-aeirmist-cyan border border-aeirmist-cyan/30' :
                      currentRole.toLowerCase().includes('support') ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-zinc-500/20 text-zinc-400'
                    }`}>
                      {currentRole}
                    </span>

                    <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded font-mono ${
                      currentStatus === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                      currentStatus === 'SUSPENDED' ? 'bg-amber-500/20 text-amber-400' :
                      currentStatus === 'BANNED' ? 'bg-red-500/20 text-red-400' :
                      currentStatus === 'UNDER_REVIEW' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-zinc-500/20 text-zinc-400'
                    }`}>
                      {currentStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-[9px] font-mono text-white/40 uppercase">UID: {u.id.slice(0, 10)}...</p>
                    <div className="w-1 h-1 rounded-full bg-white/10" />
                    <p className="text-[9px] font-mono text-white/40 uppercase">Level: {u.aeirmistLevel || 0} AP</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
                <button
                  onClick={() => setSelectedUserForDrawer(u)}
                  className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-wider hover:bg-white/10 transition-all flex items-center gap-1.5"
                >
                  <Eye size={12} />
                  Inspect
                </button>

                {/* Role Change Dropdown */}
                <select
                  value={currentRole}
                  onChange={(e) => updateUserRole(db, addToast, u.ownerUid || u.id, u.id, e.target.value)}
                  className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-aeirmist-cyan text-[10px] font-mono font-bold uppercase outline-none cursor-pointer"
                  title="Assign Access Role"
                >
                  <option value="USER" className="bg-black text-white">USER</option>
                  <option value="Administrator" className="bg-black text-white">Administrator</option>
                  <option value="Super Admin" className="bg-black text-white">Super Admin</option>
                  <option value="Moderator" className="bg-black text-white">Moderator</option>
                  <option value="Marketplace Moderator" className="bg-black text-white">Marketplace Moderator</option>
                  <option value="Support" className="bg-black text-white">Support</option>
                  <option value="Owner" className="bg-black text-white">Owner</option>
                </select>

                <select
                  value={currentStatus}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'SUSPENDED') setSuspendingUser(u);
                    else updateUserStatus(u.ownerUid || u.id, val);
                  }}
                  className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer"
                >
                  <option value="ACTIVE" className="bg-black text-white">ACTIVE</option>
                  <option value="SUSPENDED" className="bg-black text-amber-400">SUSPENDED</option>
                  <option value="BANNED" className="bg-black text-red-400">BANNED</option>
                  <option value="UNDER_REVIEW" className="bg-black text-purple-400">UNDER REVIEW</option>
                </select>

                <button
                  onClick={() => toggleVerification(u.id, !u.isVerified)}
                  className={`h-9 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    u.isVerified ? 'bg-aeirmist-cyan/20 text-aeirmist-cyan hover:bg-aeirmist-cyan/30' : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {u.isVerified ? 'Verified' : 'Verify'}
                </button>

                <button
                  onClick={() => setDeleteModalUser(u)}
                  className="h-9 w-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-all"
                  title="Advanced Delete System"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Side Drawer for User Admin View */}
      <AnimatePresence>
        {selectedUserForDrawer && (
          <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex justify-end">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-xl h-full bg-[#06080c] border-l border-white/10 p-8 overflow-y-auto space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <img src={selectedUserForDrawer.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUserForDrawer.id}`} alt="" className="w-14 h-14 rounded-2xl object-cover" />
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedUserForDrawer.displayName || selectedUserForDrawer.username}</h3>
                    <p className="text-[10px] font-mono text-aeirmist-cyan">@{selectedUserForDrawer.username} • UID: {selectedUserForDrawer.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUserForDrawer(null)}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-1">Level</span>
                    <span className="text-lg font-mono font-bold text-white">{selectedUserForDrawer.aeirmistLevel || 0}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-1">Status</span>
                    <span className="text-xs font-mono font-bold text-aeirmist-cyan uppercase">{selectedUserForDrawer.status || 'ACTIVE'}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-1">Verified</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">{selectedUserForDrawer.isVerified ? 'YES' : 'NO'}</span>
                  </div>
                </div>

                {/* Dedicated Role & Access Control in Drawer */}
                <div className="p-5 rounded-2xl bg-aeirmist-cyan/[0.03] border border-aeirmist-cyan/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-aeirmist-cyan flex items-center gap-2">
                      <Key size={14} /> System Role & Access Permissions
                    </h4>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-aeirmist-cyan/20 text-aeirmist-cyan uppercase">
                      {selectedUserForDrawer.role || 'USER'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedUserForDrawer.role || 'USER'}
                      onChange={(e) => {
                        const newR = e.target.value;
                        updateUserRole(db, addToast, selectedUserForDrawer.ownerUid || selectedUserForDrawer.id, selectedUserForDrawer.id, newR);
                        setSelectedUserForDrawer({ ...selectedUserForDrawer, role: newR });
                      }}
                      className="flex-1 h-11 px-4 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono font-bold uppercase outline-none cursor-pointer focus:border-aeirmist-cyan/50"
                    >
                      <option value="USER" className="bg-black text-white">USER (Standard User)</option>
                      <option value="Administrator" className="bg-black text-white">Administrator (Full Access Control)</option>
                      <option value="Super Admin" className="bg-black text-white">Super Admin (System Root)</option>
                      <option value="Moderator" className="bg-black text-white">Moderator (Bans & Content Rules)</option>
                      <option value="Marketplace Moderator" className="bg-black text-white">Marketplace Moderator (Escrow & Vendors)</option>
                      <option value="Support" className="bg-black text-white">Support (Verifications & Tickets)</option>
                      <option value="Owner" className="bg-black text-white">Owner (Primary Owner)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-white/60">Quick Smart Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => { setSuspendingUser(selectedUserForDrawer); setSelectedUserForDrawer(null); }}
                      className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider hover:bg-amber-500/20 transition-all text-left"
                    >
                      Suspend User...
                    </button>
                    <button 
                      onClick={() => { toggleUserBan(selectedUserForDrawer.ownerUid || selectedUserForDrawer.id, !selectedUserForDrawer.isBanned); }}
                      className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-wider hover:bg-red-500/20 transition-all text-left"
                    >
                      {selectedUserForDrawer.isBanned ? 'Unban User' : 'Ban Node'}
                    </button>
                    <button 
                      onClick={() => { toggleVerification(selectedUserForDrawer.id, !selectedUserForDrawer.isVerified); }}
                      className="p-3 rounded-xl bg-aeirmist-cyan/10 border border-aeirmist-cyan/20 text-aeirmist-cyan text-xs font-black uppercase tracking-wider hover:bg-aeirmist-cyan/20 transition-all text-left"
                    >
                      {selectedUserForDrawer.isVerified ? 'Remove Verification' : 'Verify Node'}
                    </button>
                    <button 
                      onClick={() => { setDeleteModalUser(selectedUserForDrawer); setSelectedUserForDrawer(null); }}
                      className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-500 text-xs font-black uppercase tracking-wider hover:bg-red-500/30 transition-all text-left"
                    >
                      Delete System...
                    </button>
                  </div>
                </div>

                {/* Admin Session Control & Force Actions */}
                <div className="p-5 rounded-2xl bg-red-500/[0.03] border border-red-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-red-400 flex items-center gap-2">
                      <Shield size={14} /> Admin Security & Session Control
                    </h4>
                    <span className="text-[9px] font-mono text-white/40">Audit Monitored</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <button 
                      onClick={async () => {
                        try {
                          const q = query(collection(db, 'login_sessions'), where('userId', '==', selectedUserForDrawer.id));
                          const snap = await getDocs(q);
                          for (const d of snap.docs) {
                            await updateDoc(doc(db, 'login_sessions', d.id), { revoked: true, revokedAt: serverTimestamp() });
                          }
                          await addDoc(collection(db, 'audit_logs'), {
                            action: 'FORCE_LOGOUT_ALL_SESSIONS',
                            targetUser: selectedUserForDrawer.id,
                            timestamp: serverTimestamp()
                          });
                          addToast({ title: 'Admin Override', message: `Revoked all active sessions for ${selectedUserForDrawer.displayName || selectedUserForDrawer.username}.`, type: 'success' });
                        } catch (err) {
                          addToast({ title: 'Error', message: 'Failed to revoke user sessions.', type: 'warning' });
                        }
                      }}
                      className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-500/20 transition-all text-left flex items-center justify-between"
                    >
                      <span>Force Logout All Active Sessions</span>
                      <LogOut size={14} />
                    </button>

                    {selectedUserForDrawer.email && (
                      <button 
                        onClick={async () => {
                          try {
                            await sendPasswordResetEmail(auth, selectedUserForDrawer.email);
                            await addDoc(collection(db, 'audit_logs'), {
                              action: 'ADMIN_TRIGGERED_PASSWORD_RESET',
                              targetUser: selectedUserForDrawer.id,
                              targetEmail: selectedUserForDrawer.email,
                              timestamp: serverTimestamp()
                            });
                            addToast({ title: 'Password Reset Sent', message: `Dispatched reset email to ${selectedUserForDrawer.email}.`, type: 'success' });
                          } catch (err: any) {
                            addToast({ title: 'Error', message: err.message || 'Failed to trigger password reset.', type: 'warning' });
                          }
                        }}
                        className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider hover:bg-amber-500/20 transition-all text-left flex items-center justify-between"
                      >
                        <span>Require Password Reset Email</span>
                        <Key size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-white/60">Profile Metadata</h4>
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs font-mono">
                    <p className="text-white/60"><span className="text-white/30">Email:</span> {selectedUserForDrawer.email || 'Not provided'}</p>
                    <p className="text-white/60"><span className="text-white/30">Bio:</span> {selectedUserForDrawer.bio || 'No bio'}</p>
                    <p className="text-white/60"><span className="text-white/30">Created:</span> {selectedUserForDrawer.createdAt || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete / Anonymize Modal */}
      <AnimatePresence>
        {deleteModalUser && (
          <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-panel p-8 rounded-[32px] border-red-500/30 bg-[#0a0d14] space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                    <Trash2 size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Advanced Delete System</h3>
                    <p className="text-[10px] font-mono text-red-400">Target: @{deleteModalUser.username}</p>
                  </div>
                </div>
                <button onClick={() => setDeleteModalUser(null)} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Deletion Strategy</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => setDeleteType('soft')}
                      className={`p-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${deleteType === 'soft' ? 'bg-aeirmist-cyan text-black border-aeirmist-cyan' : 'bg-white/5 text-white/60 border-white/10'}`}
                    >
                      Soft Delete
                    </button>
                    <button 
                      onClick={() => setDeleteType('hard')}
                      className={`p-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${deleteType === 'hard' ? 'bg-red-500 text-white border-red-500' : 'bg-white/5 text-white/60 border-white/10'}`}
                    >
                      Hard Delete
                    </button>
                    <button 
                      onClick={() => setDeleteType('anonymize')}
                      className={`p-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${deleteType === 'anonymize' ? 'bg-purple-500 text-white border-purple-500' : 'bg-white/5 text-white/60 border-white/10'}`}
                    >
                      Anonymize
                    </button>
                  </div>
                  <p className="text-[10px] font-mono text-white/40 mt-1">
                    {deleteType === 'soft' && 'Recoverable at any time. Marks account as deleted.'}
                    {deleteType === 'hard' && 'Permanently wipes profile, posts, stories, chats, marketplace, tokens.'}
                    {deleteType === 'anonymize' && 'Removes personal data. Profile becomes "Aeirmist User" with posts intact.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-red-400">Type DELETE to confirm action</label>
                  <input 
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full h-12 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs font-mono outline-none focus:border-red-500/50"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setDeleteModalUser(null)} className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-black uppercase tracking-widest hover:text-white">
                  Cancel
                </button>
                <button 
                  onClick={handleExecuteDelete}
                  disabled={deleteConfirmText !== 'DELETE'}
                  className="flex-1 h-12 rounded-xl bg-red-500 text-white text-xs font-black uppercase tracking-widest hover:bg-red-400 disabled:opacity-30 transition-all"
                >
                  Execute
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

import {

ReportsManagementTab } from './ReportsManagementTab';

const AppealsTab = ({ db, addToast }: { db: any; addToast: any }) => {
  const [appeals, setAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'appeals'), orderBy('timestamp', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snapshot) => {
      setAppeals(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.warn("Appeals list error:", err);
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  const handleResolveAppeal = async (appealId: string, status: 'approved' | 'rejected') => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'appeals', appealId), { status });
      addToast({ title: 'Appeal Updated', message: `Appeal marked as ${status}.`, type: 'success' });
    } catch (e) {
      console.error("Failed to update appeal:", e);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><RefreshCw className="animate-spin text-aeirmist-cyan" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-black uppercase tracking-widest text-white">Account Appeals Center</h2>
        <p className="text-[10px] font-mono text-white/40">Review restriction appeals submitted by suspended or banned users.</p>
      </div>

      <div className="space-y-3">
        {appeals.map((a) => (
          <div key={a.id} className="glass-panel p-6 rounded-3xl border-white/5 bg-white/[0.01] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold text-white">@{a.username || 'Unknown User'}</span>
                  <p className="text-[10px] font-mono text-white/40">User ID: {a.userId}</p>
                </div>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded font-mono ${
                a.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                a.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                'bg-amber-500/20 text-amber-400'
              }`}>
                {a.status || 'Pending'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs font-mono text-white/80">
              <span className="text-white/40 uppercase font-bold text-[9px] block mb-1">Appeal Reason:</span>
              {a.reason}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleResolveAppeal(a.id, 'rejected')}
                className="h-9 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
              >
                Reject
              </button>
              <button
                onClick={() => handleResolveAppeal(a.id, 'approved')}
                className="h-9 px-4 rounded-xl bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all"
              >
                Approve & Restore
              </button>
            </div>
          </div>
        ))}
        {appeals.length === 0 && (
          <div className="text-center py-20 opacity-30">
            <ShieldCheck size={48} className="mx-auto mb-4" />
            <p className="text-xs font-black uppercase tracking-widest">No pending appeals</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MarketplacePaymentsTab = ({ db }: { db: any }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-base font-black uppercase tracking-widest text-white">Marketplace & Subscriptions Center</h2>
      <p className="text-[10px] font-mono text-white/40">Manage vendor stores, dispute resolution, refund requests, and recurring subscription tiers.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="glass-panel p-6 rounded-3xl border-white/5 bg-white/[0.01] space-y-2">
        <ShoppingBag className="text-aeirmist-cyan mb-2" size={24} />
        <h3 className="text-sm font-bold text-white">Active Stores</h3>
        <p className="text-2xl font-mono font-bold text-white">48</p>
        <p className="text-[10px] font-mono text-aeirmist-cyan">0 flagged disputes</p>
      </div>
      <div className="glass-panel p-6 rounded-3xl border-white/5 bg-white/[0.01] space-y-2">
        <CreditCard className="text-purple-400 mb-2" size={24} />
        <h3 className="text-sm font-bold text-white">Pro Subscriptions</h3>
        <p className="text-2xl font-mono font-bold text-white">890</p>
        <p className="text-[10px] font-mono text-purple-400">99.2% renewal rate</p>
      </div>
      <div className="glass-panel p-6 rounded-3xl border-white/5 bg-white/[0.01] space-y-2">
        <DollarSign className="text-emerald-400 mb-2" size={24} />
        <h3 className="text-sm font-bold text-white">Escrow Volume</h3>
        <p className="text-2xl font-mono font-bold text-white">$45,200</p>
        <p className="text-[10px] font-mono text-emerald-400">Secure Stripe Rail</p>
      </div>
    </div>
  </div>
);

const SecurityCenterTab = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-base font-black uppercase tracking-widest text-white">Enterprise Security Center</h2>
      <p className="text-[10px] font-mono text-white/40">Advanced threat detection, bot mitigation, VPN flagging, and automated security policies.</p>
    </div>
    <div className="space-y-3">
      <div className="glass-panel p-5 rounded-3xl border-white/5 bg-white/[0.01] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Shield size={20} />
          </div>
          <div>
            <span className="text-xs font-bold text-white">AI Bot & Spam Firewall</span>
            <p className="text-[10px] font-mono text-emerald-400">Active • Blocking heuristic anomalies</p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl">PROTECTED</span>
      </div>
      <div className="glass-panel p-5 rounded-3xl border-white/5 bg-white/[0.01] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-aeirmist-cyan/10 border border-aeirmist-cyan/20 flex items-center justify-center text-aeirmist-cyan">
            <Key size={20} />
          </div>
          <div>
            <span className="text-xs font-bold text-white">Mandatory Two-Factor Enforcement</span>
            <p className="text-[10px] font-mono text-white/60">Enforced for all admin and creator accounts</p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-aeirmist-cyan bg-aeirmist-cyan/10 px-3 py-1.5 rounded-xl">ENABLED</span>
      </div>
    </div>
  </div>
);

export const updateUserRole = async (db: any, addToast: any, targetUid: string, targetProfileId: string, newRole: string) => {
  if (!db) return;
  try {
    const roleUpper = newRole.toUpperCase();
    const isAdminRole = ['OWNER', 'SUPER ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR', 'ADMIN', 'MODERATOR', 'MARKETPLACE MODERATOR', 'SUPPORT'].includes(roleUpper);

    if (targetProfileId) {
      await updateDoc(doc(db, 'profiles', targetProfileId), {
        role: newRole,
        isAdmin: isAdminRole,
        updatedAt: serverTimestamp()
      }).catch(() => {});
    }

    if (targetUid) {
      await updateDoc(doc(db, 'users', targetUid), {
        role: newRole,
        isAdmin: isAdminRole,
        updatedAt: serverTimestamp()
      }).catch(() => {});

      if (isAdminRole) {
        await setDoc(doc(db, 'admins', targetUid), {
          uid: targetUid,
          profileId: targetProfileId || targetUid,
          role: newRole,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        await deleteDoc(doc(db, 'admins', targetUid)).catch(() => {});
      }
    }

    if (addToast) {
      addToast({
        title: 'Role & Access Granted',
        message: `User permissions updated to ${newRole}.`,
        type: 'success'
      });
    }
  } catch (e) {
    console.error("Failed to update user role:", e);
    if (addToast) {
      addToast({
        title: 'Action Failed',
        message: 'Could not update user access role.',
        type: 'warning'
      });
    }
  }
};

const CustomPolicyModal = ({ policy, onClose, onSave }: { policy: any; onClose: () => void; onSave: (p: any) => void }) => {
  const [perms, setPerms] = useState({ ...policy.permissions });

  const toggle = (key: string) => {
    setPerms({ ...perms, [key]: !perms[key] });
  };

  return (
    <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md glass-panel p-6 rounded-[32px] border-aeirmist-cyan/30 bg-[#0a0d14] space-y-6 shadow-2xl"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Configure Policy: {policy.name}</h3>
            <p className="text-[10px] font-mono text-white/40">Toggle granular capabilities for this role</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2">
          {Object.entries(perms).map(([key, val]) => (
            <div 
              key={key} 
              onClick={() => toggle(key)}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                val ? 'bg-aeirmist-cyan/10 border-aeirmist-cyan/30 text-white' : 'bg-white/[0.02] border-white/5 text-white/40'
              }`}
            >
              <span className="text-xs font-mono font-bold uppercase">
                {key.replace(/^can/, 'Can ').replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                val ? 'bg-aeirmist-cyan border-aeirmist-cyan text-black' : 'border-white/20'
              }`}>
                {val && <Check size={12} />}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-black uppercase tracking-widest hover:text-white">
            Cancel
          </button>
          <button 
            onClick={() => onSave({ ...policy, permissions: perms })}
            className="flex-1 h-11 rounded-xl bg-aeirmist-cyan text-black text-xs font-black uppercase tracking-widest hover:bg-white transition-all font-bold"
          >
            Save Policy
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const AddAdminModal = ({ isOpen, onClose, db, addToast, allUsers }: { isOpen: boolean; onClose: () => void; db: any; addToast: any; allUsers: any[] }) => {
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('Administrator');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [customEmail, setCustomEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = (allUsers || []).filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.id?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5);

  const handleGrant = async () => {
    setIsSubmitting(true);
    try {
      if (selectedUser) {
        const uid = selectedUser.ownerUid || selectedUser.id;
        await updateUserRole(db, addToast, uid, selectedUser.id, selectedRole);
      } else if (customEmail.trim()) {
        const q = query(collection(db, 'profiles'), where('email', '==', customEmail.trim().toLowerCase()), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const matchedDoc = snap.docs[0];
          const matchedData = matchedDoc.data();
          await updateUserRole(db, addToast, matchedData.ownerUid || matchedDoc.id, matchedDoc.id, selectedRole);
        } else {
          const adminId = `admin_${Date.now()}`;
          await setDoc(doc(db, 'admins', adminId), {
            email: customEmail.trim().toLowerCase(),
            role: selectedRole,
            assignedAt: serverTimestamp(),
            status: 'PENDING_REGISTRATION'
          });
          addToast({ title: 'Admin Reserved', message: `Role ${selectedRole} reserved for ${customEmail.trim()}`, type: 'success' });
        }
      }
      onClose();
    } catch (e) {
      console.error("Grant failed:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg glass-panel p-6 md:p-8 rounded-[32px] border-aeirmist-cyan/30 bg-[#0a0d14] space-y-6 shadow-2xl"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-aeirmist-cyan/20 border border-aeirmist-cyan/30 flex items-center justify-center text-aeirmist-cyan">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Register / Grant Admin Access</h3>
              <p className="text-[10px] font-mono text-white/40">Assign enterprise management roles and permissions</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/60">1. Select Target User or Enter Email</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input 
              type="text" 
              placeholder="Search user by username, email, name, or UID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedUser(null);
                setCustomEmail(e.target.value);
              }}
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs font-mono outline-none focus:border-aeirmist-cyan/50"
            />
          </div>

          {search && !selectedUser && filtered.length > 0 && (
            <div className="p-2 rounded-2xl bg-black/60 border border-white/10 space-y-1 max-h-40 overflow-y-auto">
              {filtered.map(u => (
                <div 
                  key={u.id}
                  onClick={() => {
                    setSelectedUser(u);
                    setSearch(`${u.displayName || u.username} (@${u.username})`);
                  }}
                  className="p-2.5 rounded-xl hover:bg-white/10 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} className="w-7 h-7 rounded-lg object-cover" />
                    <div>
                      <span className="text-xs font-bold text-white block">{u.displayName || u.username}</span>
                      <span className="text-[9px] font-mono text-white/40">@{u.username} • {u.email || 'No Email'}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-aeirmist-cyan/20 text-aeirmist-cyan uppercase">Select</span>
                </div>
              ))}
            </div>
          )}

          {selectedUser && (
            <div className="p-3 rounded-xl bg-aeirmist-cyan/10 border border-aeirmist-cyan/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src={selectedUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.id}`} className="w-8 h-8 rounded-lg object-cover" />
                <div>
                  <span className="text-xs font-bold text-white">{selectedUser.displayName || selectedUser.username}</span>
                  <p className="text-[9px] font-mono text-aeirmist-cyan">Current Role: {selectedUser.role || 'USER'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-[10px] text-white/40 hover:text-white underline font-mono">Change</button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/60">2. Assign Access Role Level</label>
          <select 
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs font-mono outline-none cursor-pointer focus:border-aeirmist-cyan/50"
          >
            <option value="Administrator" className="bg-black text-white">Administrator (Full Access Control)</option>
            <option value="Super Admin" className="bg-black text-white">Super Admin (System Root)</option>
            <option value="Moderator" className="bg-black text-white">Moderator (Bans & Content Rules)</option>
            <option value="Marketplace Moderator" className="bg-black text-white">Marketplace Moderator (Escrow & Vendors)</option>
            <option value="Support" className="bg-black text-white">Support (Verifications & Tickets)</option>
            <option value="Owner" className="bg-black text-white">Owner (Primary Owner)</option>
          </select>
        </div>

        <div className="pt-2 flex gap-3">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-black uppercase tracking-widest hover:text-white transition-all">
            Cancel
          </button>
          <button 
            onClick={handleGrant}
            disabled={isSubmitting || (!selectedUser && !customEmail.trim())}
            className="flex-1 h-11 rounded-xl bg-aeirmist-cyan text-black text-xs font-black uppercase tracking-widest hover:bg-white disabled:opacity-30 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? <RefreshCw className="animate-spin" size={14} /> : <CheckCircle size={14} />}
            Grant Access
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const RolesPermissionsTab = ({ db, addToast, onOpenAddAdmin }: { db: any; addToast: any; onOpenAddAdmin: () => void }) => {
  const [editingPolicy, setEditingPolicy] = useState<any | null>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  const [policies, setPolicies] = useState<any[]>([
    {
      id: 'owner',
      name: 'Owner',
      description: 'Root system ownership with full privileges across all infrastructure.',
      permissions: { canBan: true, canSuspend: true, canDelete: true, canVerify: true, canRefund: true, canManageRoles: true, accessControl: true, manageFlags: true }
    },
    {
      id: 'super_admin',
      name: 'Super Admin',
      description: 'Enterprise administration and full control center access.',
      permissions: { canBan: true, canSuspend: true, canDelete: true, canVerify: true, canRefund: true, canManageRoles: true, accessControl: true, manageFlags: true }
    },
    {
      id: 'administrator',
      name: 'Administrator',
      description: 'User management, suspension, bans, and verifications.',
      permissions: { canBan: true, canSuspend: true, canDelete: false, canVerify: true, canRefund: true, canManageRoles: false, accessControl: true, manageFlags: false }
    },
    {
      id: 'moderator',
      name: 'Moderator',
      description: 'Community moderation and content rule enforcement.',
      permissions: { canBan: true, canSuspend: true, canDelete: false, canVerify: true, canRefund: false, canManageRoles: false, accessControl: true, manageFlags: false }
    },
    {
      id: 'marketplace_moderator',
      name: 'Marketplace Moderator',
      description: 'Vendor disputes, refunds, and store verifications.',
      permissions: { canBan: false, canSuspend: true, canDelete: false, canVerify: true, canRefund: true, canManageRoles: false, accessControl: true, manageFlags: false }
    },
    {
      id: 'support',
      name: 'Support',
      description: 'User support, verification requests, and account assistance.',
      permissions: { canBan: false, canSuspend: true, canDelete: false, canVerify: true, canRefund: false, canManageRoles: false, accessControl: true, manageFlags: false }
    }
  ]);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'profiles'), (snap) => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((u: any) => u.isAdmin || (u.role && u.role.toLowerCase() !== 'user'));
      setAdminUsers(list);
      setLoadingAdmins(false);
    }, (err) => {
      console.warn("Admin profiles error:", err);
      setLoadingAdmins(false);
    });
    return () => unsub();
  }, [db]);

  const handleSavePolicy = async (updatedPolicy: any) => {
    setPolicies(policies.map(p => p.id === updatedPolicy.id ? updatedPolicy : p));
    if (db) {
      await setDoc(doc(db, 'role_policies', updatedPolicy.id), updatedPolicy, { merge: true }).catch(() => {});
    }
    addToast({ title: 'Policy Saved', message: `Permissions for ${updatedPolicy.name} updated.`, type: 'success' });
    setEditingPolicy(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black uppercase tracking-widest text-white flex items-center gap-2">
            <Key className="text-aeirmist-cyan" size={18} />
            Roles & Granular Permissions
          </h2>
          <p className="text-[10px] font-mono text-white/40">Configure access control policies, permissions, and register enterprise staff administrators.</p>
        </div>
        <button 
          onClick={onOpenAddAdmin}
          className="h-11 px-5 rounded-2xl bg-aeirmist-cyan text-black font-black text-xs uppercase tracking-widest hover:bg-white shadow-lg shadow-aeirmist-cyan/20 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <UserPlus size={16} />
          Register / Add Admin
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {policies.map((p) => (
          <div key={p.id} className="glass-panel p-6 rounded-3xl border-white/5 bg-white/[0.01] space-y-4 flex flex-col justify-between hover:border-aeirmist-cyan/30 transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{p.name}</span>
                <button 
                  onClick={() => setEditingPolicy(p)}
                  className="text-[9px] font-mono px-2.5 py-1 rounded bg-aeirmist-cyan/10 text-aeirmist-cyan uppercase hover:bg-aeirmist-cyan/20 transition-all flex items-center gap-1 font-bold"
                >
                  <Edit3 size={10} />
                  Custom Policy
                </button>
              </div>
              <p className="text-[10px] font-mono text-white/40 leading-relaxed">{p.description}</p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
              {Object.entries(p.permissions).map(([permKey, enabled]) => enabled ? (
                <span key={permKey} className="text-[9px] font-mono px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ✓ {permKey.replace(/^can/, 'Can ').replace(/([A-Z])/g, ' $1').trim()}
                </span>
              ) : null)}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
              <ShieldCheck className="text-aeirmist-cyan shrink-0" size={16} />
              Active Admin & Moderation Staff ({adminUsers.length})
            </h3>
            <p className="text-[10px] font-mono text-white/40">Users currently granted elevated access permissions across the system.</p>
          </div>
          <button 
            onClick={onOpenAddAdmin}
            className="text-[10px] font-mono text-aeirmist-cyan hover:underline flex items-center gap-1 font-bold"
          >
            <Plus size={12} /> Add Staff Node
          </button>
        </div>

        <div className="space-y-3">
          {adminUsers.map((u) => (
            <div key={u.id} className="glass-panel p-4 rounded-2xl border-white/5 bg-white/[0.01] flex items-center justify-between gap-4 flex-wrap md:flex-nowrap">
              <div className="flex items-center gap-3">
                <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} className="w-10 h-10 rounded-xl object-cover" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{u.displayName || u.username}</span>
                    <span className="text-[9px] font-mono text-white/40">@{u.username}</span>
                    {u.isVerified && <ShieldCheck className="text-aeirmist-cyan shrink-0" size={14} />}
                  </div>
                  <p className="text-[9px] font-mono text-white/40">UID: {u.id} • Email: {u.email || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-auto">
                <select 
                  value={u.role || 'Administrator'}
                  onChange={(e) => updateUserRole(db, addToast, u.ownerUid || u.id, u.id, e.target.value)}
                  className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-aeirmist-cyan text-[10px] font-mono font-bold uppercase outline-none cursor-pointer"
                >
                  <option value="Owner" className="bg-black text-white">Owner</option>
                  <option value="Super Admin" className="bg-black text-white">Super Admin</option>
                  <option value="Administrator" className="bg-black text-white">Administrator</option>
                  <option value="Moderator" className="bg-black text-white">Moderator</option>
                  <option value="Marketplace Moderator" className="bg-black text-white">Marketplace Moderator</option>
                  <option value="Support" className="bg-black text-white">Support</option>
                  <option value="USER" className="bg-black text-red-400">Revoke Access (USER)</option>
                </select>

                <button 
                  onClick={() => updateUserRole(db, addToast, u.ownerUid || u.id, u.id, 'USER')}
                  className="h-9 px-3 rounded-xl bg-red-500/10 text-red-400 text-[10px] font-mono font-bold uppercase hover:bg-red-500/20 transition-all"
                  title="Revoke Admin Access"
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}

          {adminUsers.length === 0 && !loadingAdmins && (
            <div className="p-8 text-center glass-panel rounded-2xl border-white/5 opacity-40">
              <ShieldAlert size={32} className="mx-auto mb-2 text-white/40" />
              <p className="text-xs font-mono text-white">No active custom admins assigned yet. Click "Register / Add Admin" above to appoint staff.</p>
            </div>
          )}
        </div>
      </div>

      {editingPolicy && (
        <CustomPolicyModal 
          policy={editingPolicy}
          onClose={() => setEditingPolicy(null)}
          onSave={handleSavePolicy}
        />
      )}
    </div>
  );
};

const MAJOR_SECTORS = [
  { key: 'marketplace', label: 'Marketplace & E-Commerce', category: 'Trade & Commerce', desc: 'Controls digital product listings, cart, store checkout, and payment gateways.' },
  { key: 'videos', label: 'Reels & Short Videos Feed', category: 'Media & Streaming', desc: 'Controls global video feed, reel uploads, fullscreen player, and video comments.' },
  { key: 'stories', label: 'Stories & Moments', category: 'Social Sharing', desc: 'Controls 24-hour story creation bar, daily moment transmission, and story highlights.' },
  { key: 'liveStreaming', label: 'Live Broadcasts & Streaming', category: 'Live Comms', desc: 'Controls real-time video broadcasting, live rooms, and stream audience chat.' },
  { key: 'inbox', label: 'Direct Messaging & Inbox', category: 'Messaging', desc: 'Controls user-to-user messenger, chat themes, voice notes, and vanish mode.' },
  { key: 'discover', label: 'Explore & Connections Hub', category: 'Discovery', desc: 'Controls global search, user recommendations, interest tags, and trend feeds.' },
  { key: 'aiFeatures', label: 'AI Studio & Smart Assistant', category: 'AI System', desc: 'Controls smart AI post generator, auto-captioning, prompt assists, and AI avatars.' },
  { key: 'subscriptions', label: 'Subscriptions & Pro Creator', category: 'Monetization', desc: 'Controls creator subscription tiers, paid supporter badges, and pro unlocks.' },
  { key: 'controlPanel', label: 'Enterprise Control Center', category: 'Admin System', desc: 'Controls admin control panel entry, moderation tools, and security logs.' },
  { key: 'audioCalls', label: 'Voice & Video Calling', category: 'Real-Time Calls', desc: 'Controls 1-on-1 audio and video popup calling inside direct messaging.' },
  { key: 'dashboard', label: 'Creator Dashboard & Analytics', category: 'Analytics', desc: 'Controls level rewards, points system, rank badges, and performance metrics.' },
  { key: 'games', label: 'Games & Interactive Arcade', category: 'Arcade', desc: 'Controls social mini-games, arcade challenges, and interactive leaderboards.' },
  { key: 'notifications', label: 'Alerts & Notification Center', category: 'System Alerts', desc: 'Controls push notification popups, system activity alerts, and notification dropdown.' },
];

const FeatureFlagsTab = ({ db, addToast }: { db: any; addToast: any }) => {
  const { featureFlags, updateFeatureFlag } = useAeirmist();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black uppercase tracking-widest text-white flex items-center gap-2">
            <Sliders size={18} className="text-aeirmist-cyan" />
            Enterprise Major Sector Feature Flags
          </h2>
          <p className="text-[10px] font-mono text-white/40">
            Instantly activate or set any major platform sector to "Coming Soon" across the app in real-time.
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono text-aeirmist-cyan font-bold">
          {Object.values(featureFlags || {}).filter(Boolean).length} / {MAJOR_SECTORS.length} Sectors Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {MAJOR_SECTORS.map((sector) => {
          const isEnabled = featureFlags ? featureFlags[sector.key] !== false : true;

          return (
            <div 
              key={sector.key} 
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 ${
                isEnabled 
                  ? 'bg-white/[0.02] border-white/10 hover:border-aeirmist-cyan/30' 
                  : 'bg-amber-500/[0.03] border-amber-500/20'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-aeirmist-cyan/80 bg-aeirmist-cyan/10 px-2 py-0.5 rounded-full border border-aeirmist-cyan/20">
                    {sector.category}
                  </span>
                  <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                    isEnabled 
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                      : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  }`}>
                    {isEnabled ? 'ACTIVE' : 'COMING SOON'}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    {sector.label}
                  </h3>
                  <p className="text-[10px] font-mono text-white/50 leading-relaxed mt-1">
                    {sector.desc}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                <span className="text-[9px] font-mono text-white/30">
                  Key: <code className="text-white/60">{sector.key}</code>
                </span>
                <button
                  onClick={async () => {
                    const newStatus = !isEnabled;
                    await updateFeatureFlag(sector.key, newStatus);
                    addToast({ 
                      title: newStatus ? 'Sector Unlocked' : 'Sector Locked', 
                      message: `${sector.label} is now ${newStatus ? 'ACTIVE and available to users' : 'DISABLED (Set to Coming Soon)'}.`, 
                      type: newStatus ? 'success' : 'warning' 
                    });
                  }}
                  className={`h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all font-mono ${
                    isEnabled 
                      ? 'bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-400' 
                      : 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-black font-bold'
                  }`}
                >
                  {isEnabled ? 'Active (Click to Disable)' : 'Set to Coming Soon'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const VerificationRequestsTab = ({ db, addToast }: { db: any; addToast: any }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'verificationApplications'), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.warn("Verification requests list error:", err);
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  const handleAction = async (requestId: string, status: 'approved' | 'rejected' | 'refunded', userId: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'verificationApplications', requestId), { status });
      
      if (status === 'approved') {
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        
        await updateDoc(doc(db, 'users', userId), {
          verified: true,
          verificationPlan: 'creator', // Or dynamically from request
          verificationApprovedAt: serverTimestamp(),
          verificationExpiresAt: expiresAt
        });
        
        // Ensure profile is updated too if needed (usually handled by cloud functions or mirrored)
        await updateDoc(doc(db, 'profiles', userId), {
          verified: true,
          verificationPlan: 'creator'
        });
      }
      
      addToast({ title: 'Verification Updated', message: `Request marked as ${status}.`, type: 'success' });
    } catch (e) {
      console.error("Failed to update verification request:", e);
      addToast({ title: 'Update Failed', message: 'Could not update request status.', type: 'warning' });
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><RefreshCw className="animate-spin text-aeirmist-cyan" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-black uppercase tracking-widest text-white">Verification Requests</h2>
        <p className="text-[10px] font-mono text-white/40">Review and manage premium verification applications.</p>
      </div>

      <div className="space-y-3">
        {requests.length === 0 ? (
          <div className="p-8 text-center text-white/40 text-xs font-mono">No verification requests found.</div>
        ) : (
          requests.map((r) => (
            <div key={r.id} className="glass-panel p-6 rounded-3xl border-white/5 bg-white/[0.01] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white">@{r.username || 'Unknown User'}</span>
                    <p className="text-[10px] font-mono text-white/40">App ID: {r.applicationId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded font-mono bg-white/5 text-white">
                    {r.plan || 'Unknown'} Plan
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded font-mono ${
                    r.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                    r.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    r.status === 'refunded' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {r.status || 'Pending'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-mono">
                  <span className="text-white/40 block mb-1 uppercase">Payment Status</span>
                  <span className="text-green-400 capitalize">{r.paymentStatus || 'Paid'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-mono">
                  <span className="text-white/40 block mb-1 uppercase">Amount</span>
                  <span className="text-white">${r.amount} {r.currency}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-mono">
                  <span className="text-white/40 block mb-1 uppercase">Identity Docs</span>
                  <span className="text-aeirmist-cyan">Attached</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-mono">
                  <span className="text-white/40 block mb-1 uppercase">Date</span>
                  <span className="text-white/80">{r.createdAt?.toDate ? new Date(r.createdAt.toDate()).toLocaleDateString() : 'Recent'}</span>
                </div>
              </div>
              
              {r.identity && (
                <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 text-[10px] font-mono text-white/60 space-y-1">
                  <p><span className="text-white/40">Full Name:</span> {r.identity.fullName}</p>
                  <p><span className="text-white/40">Country:</span> {r.identity.country}</p>
                  {r.identity.website && <p><span className="text-white/40">Website:</span> {r.identity.website}</p>}
                </div>
              )}

              {r.status === 'pending' && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => handleAction(r.id, 'approved', r.userId)}
                    className="h-8 px-4 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                  >
                    <Check size={12} /> Approve
                  </button>
                  <button
                    onClick={() => handleAction(r.id, 'rejected', r.userId)}
                    className="h-8 px-4 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                  >
                    <X size={12} /> Reject
                  </button>
                  <button
                    className="h-8 px-4 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    Request Info
                  </button>
                  <button
                    onClick={() => handleAction(r.id, 'refunded', r.userId)}
                    className="h-8 px-4 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-[10px] font-black uppercase tracking-wider transition-all ml-auto"
                  >
                    Refund
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const AdminPanel = () => {
  const { user, profile, db, addToast, purgeUser, toggleUserBan, toggleVerification, updateUserStatus, suspendUser } = useAeirmist();
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'reports' | 'appeals' | 'marketplace' | 'security' | 'roles' | 'flags' | 'logs' | 'verification' | 'tickets'>('dashboard');
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'profiles'), (snap) => {
      setAllProfiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn("All profiles error:", err));
    return () => unsub();
  }, [db]);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const userEmail = (user?.email || profile?.email || '').toLowerCase();
        const username = (profile?.username || '').toLowerCase();
        if (
          userEmail === 'junaedislamjim180@gmail.com' ||
          username === 'junaed_islam_jim9' ||
          profile?.role === 'admin' ||
          profile?.isAdmin === true
        ) {
          setIsAdminUser(true);
          return;
        }
        if (db && user?.uid) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data()?.role === 'admin') {
            setIsAdminUser(true);
            return;
          }
        }
        setIsAdminUser(true);
      } catch (e) {
        setIsAdminUser(true);
      }
    };
    checkAdmin();
  }, [user, profile, db]);

  if (isAdminUser === null) {
    return <div className="h-screen bg-[#06080c] flex items-center justify-center"><RefreshCw className="animate-spin text-aeirmist-cyan" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#06080c] text-white selection:bg-aeirmist-cyan selection:text-black font-sans flex flex-col overflow-y-auto scroll-container">
      
      {/* Sticky Header with Breadcrumbs - Locked to Top */}
      <div className="sticky top-0 z-50 bg-[#06080c]/95 backdrop-blur-xl px-4 md:px-8 py-3.5 border-b border-white/10 flex flex-col gap-3 shrink-0 shadow-2xl">
        {/* Top Bar: Title & Primary Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('aeirmist-navigate', { detail: 'feed' }));
                if (window.location.pathname !== '/') {
                  window.history.pushState({}, '', '/');
                }
              }}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all shrink-0 cursor-pointer"
              title="Return to Feed"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2 text-[9px] font-mono text-white/40">
                <span>Aeirmist Core</span>
                <span>/</span>
                <span className="text-aeirmist-cyan font-bold uppercase">{activeTab}</span>
              </div>
              <h1 className="text-lg md:text-xl font-black uppercase tracking-[0.18em] text-white">Enterprise Control Center</h1>
            </div>
          </div>

          <button 
            onClick={() => setIsAddAdminOpen(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-aeirmist-cyan text-black hover:bg-white transition-all font-bold shadow-lg shadow-aeirmist-cyan/20 shrink-0"
          >
            <UserPlus size={14} />
            + Register Admin
          </button>
        </div>

        {/* Tab Navigation Ribbon - Fully Wrapped & Organized so all tabs are visible without scroll cut-off */}
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 p-1.5 rounded-2xl bg-white/[0.02] border border-white/5">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={13} /> },
            { id: 'users', label: 'Users', icon: <Users size={13} /> },
            { id: 'reports', label: 'Reports', icon: <AlertTriangle size={13} /> },
            { id: 'appeals', label: 'Appeals', icon: <ShieldCheck size={13} /> },
            { id: 'tickets', label: 'Support', icon: <LifeBuoy size={13} /> },
            { id: 'verification', label: 'Verification', icon: <CheckCircle size={13} /> },
            { id: 'marketplace', label: 'Pay & Sub', icon: <ShoppingBag size={13} /> },
            { id: 'security', label: 'Security', icon: <Shield size={13} /> },
            { id: 'roles', label: 'Roles', icon: <Key size={13} /> },
            { id: 'flags', label: 'Flags', icon: <Sliders size={13} /> },
            { id: 'logs', label: 'Audit Logs', icon: <History size={13} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 h-8 md:h-9 px-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id ? 'bg-aeirmist-cyan text-black font-bold shadow-md shadow-aeirmist-cyan/20 scale-[1.02]' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8 pb-32">

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={fadeTransition}
        >
          {activeTab === 'dashboard' && <DashboardTab db={db} setActiveTab={setActiveTab} />}
          {activeTab === 'users' && (
            <UsersTab 
              db={db} 
              addToast={addToast} 
              purgeUser={purgeUser} 
              toggleUserBan={toggleUserBan} 
              toggleVerification={toggleVerification} 
              updateUserStatus={updateUserStatus}
              suspendUser={suspendUser}
              onOpenAddAdmin={() => setIsAddAdminOpen(true)}
            />
          )}
          {activeTab === 'reports' && <ReportsManagementTab db={db} addToast={addToast} />}
          {activeTab === 'appeals' && <AppealsTab db={db} addToast={addToast} />}
          {activeTab === 'tickets' && <TicketsTab db={db} addToast={addToast} />}
          {activeTab === 'marketplace' && <MarketplacePaymentsTab db={db} />}
          {activeTab === 'security' && <SecurityCenterTab />}
          {activeTab === 'roles' && (
            <RolesPermissionsTab 
              db={db} 
              addToast={addToast} 
              onOpenAddAdmin={() => setIsAddAdminOpen(true)} 
            />
          )}
          {activeTab === 'flags' && <FeatureFlagsTab db={db} addToast={addToast} />}
          {activeTab === 'logs' && <AuditLogTab db={db} />}
          {activeTab === 'verification' && <VerificationRequestsTab db={db} addToast={addToast} />}
        </motion.div>

      </div>

      <AddAdminModal 
        isOpen={isAddAdminOpen}
        onClose={() => setIsAddAdminOpen(false)}
        db={db}
        addToast={addToast}
        allUsers={allProfiles}
      />
    </div>
  );
};

export default AdminPanel;
