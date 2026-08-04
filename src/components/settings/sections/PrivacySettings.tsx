import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  UserX, 
  ShieldAlert, 
  Search, 
  Check, 
  ChevronRight, 
  KeyRound, 
  Archive, 
  MessageSquare, 
  ShieldCheck, 
  Ghost, 
  UserCheck, 
  Loader2,
  Sparkles,
  Heart,
  AtSign,
  Trash2
} from 'lucide-react';
import { useAeirmist } from '../../../context/AeirmistContext';

export default function PrivacySettings() {
  const { 
    profile, 
    updateProfile, 
    addToast, 
    toggleBlockUser, 
    toggleRestrictUser, 
    isBlocked, 
    isRestricted, 
    allProfiles = [] 
  } = useAeirmist();

  const [activeSubTab, setActiveSubTab] = useState<'controls' | 'blocked' | 'restricted' | 'vault'>('controls');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const { logActivity } = useAeirmist();

  // Vault state
  const [vaultPin, setVaultPin] = useState('');
  const [confirmVaultPin, setConfirmVaultPin] = useState('');
  const [showVaultPinModal, setShowVaultPinModal] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);

  // Sync privacy field updates
  const handleToggleSetting = async (key: string, currentValue: boolean) => {
    setIsUpdating(key);
    try {
      const nextValue = !currentValue;
      if (key.startsWith('messagingSettings.')) {
        const fieldName = key.replace('messagingSettings.', '');
        await updateProfile({
          messagingSettings: {
            ...(profile?.messagingSettings || {}),
            [fieldName]: nextValue
          }
        });
      } else {
        await updateProfile({ [key]: nextValue });
      }
      addToast({
        title: 'Privacy Setting Updated',
        message: `${key.replace(/([A-[Z])/g, ' $1')} has been updated.`,
        type: 'success'
      });
    } catch (err: any) {
      addToast({ title: 'Update Failed', message: err.message || 'Could not update privacy setting.', type: 'warning' });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleSelectSetting = async (key: string, value: string) => {
    setIsUpdating(key);
    try {
      if (key.startsWith('messagingSettings.')) {
        const fieldName = key.replace('messagingSettings.', '');
        await updateProfile({
          messagingSettings: {
            ...(profile?.messagingSettings || {}),
            [fieldName]: value
          }
        });
      } else {
        await updateProfile({ [key]: value });
      }
      addToast({
        title: 'Privacy Setting Updated',
        message: 'Your preferences have been saved.',
        type: 'success'
      });
    } catch (err: any) {
      addToast({ title: 'Update Failed', message: err.message || 'Could not update setting.', type: 'warning' });
    } finally {
      setIsUpdating(null);
    }
  };

  // Blocked & Restricted users arrays
  const blockedUserIds: string[] = profile?.social?.blocked || [];
  const restrictedUserIds: string[] = profile?.social?.restricted || [];

  const blockedProfiles = allProfiles.filter(p => blockedUserIds.includes(p.id))
    .filter(p => p.username?.toLowerCase().includes(searchQuery.toLowerCase()) || p.displayName?.toLowerCase().includes(searchQuery.toLowerCase()));

  const restrictedProfiles = allProfiles.filter(p => restrictedUserIds.includes(p.id))
    .filter(p => p.username?.toLowerCase().includes(searchQuery.toLowerCase()) || p.displayName?.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleUnblock = async (targetId: string, handle: string) => {
    try {
      await toggleBlockUser(targetId);
      addToast({
        title: 'Neutral Status Restored',
        message: `@${handle} has been removed from your blocked list. Interaction is now permitted.`,
        type: 'success',
        icon: <UserCheck size={18} />
      });
      await logActivity('user_unblock', `Restored access for user: @${handle}`);
    } catch (err: any) {
      addToast({ title: 'Action Failed', message: 'Could not restore user status.', type: 'warning' });
    }
  };

  const handleUnrestrict = async (targetId: string, handle: string) => {
    try {
      await toggleRestrictUser(targetId);
      addToast({
        title: 'Restriction Lifted',
        message: `Restrictions removed for @${handle}. Mutual interaction status normalized.`,
        type: 'success',
        icon: <ShieldCheck size={18} />
      });
      await logActivity('user_unrestrict', `Lifted interaction restriction for user: @${handle}`);
    } catch (err: any) {
      addToast({ title: 'Action Failed', message: 'Could not lift restriction.', type: 'warning' });
    }
  };

  const handleSaveVaultPin = async () => {
    if (vaultPin.length < 4) {
      addToast({ title: 'Validation Error', message: 'Vault passcode must be at least 4 digits.', type: 'warning' });
      return;
    }
    if (vaultPin !== confirmVaultPin) {
      addToast({ title: 'Validation Error', message: 'Passcodes do not match.', type: 'warning' });
      return;
    }

    setIsSavingPin(true);
    try {
      await updateProfile({
        vaultPinCode: vaultPin,
        vaultEnabled: true,
        vaultUpdatedAt: new Date().toISOString()
      });
      addToast({
        title: 'Vault Security Updated',
        message: 'Your Vault PIN code is configured and active.',
        type: 'success'
      });
      setShowVaultPinModal(false);
      setVaultPin('');
      setConfirmVaultPin('');
    } catch (err: any) {
      addToast({ title: 'Error', message: 'Failed to update Vault PIN.', type: 'warning' });
    } finally {
      setIsSavingPin(false);
    }
  };

  const Toggle = ({ enabled, onToggle, loading }: { enabled: boolean; onToggle: () => void; loading?: boolean }) => (
    <button
      onClick={onToggle}
      disabled={loading}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${enabled ? 'bg-aeirmist-cyan shadow-[0_0_12px_rgba(0,242,255,0.3)]' : 'bg-white/10'}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out flex items-center justify-center ${enabled ? 'translate-x-5' : 'translate-x-0'}`}>
        {loading && <Loader2 size={10} className="animate-spin text-black" />}
      </span>
    </button>
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-24">
      {/* Sub-navigation Header */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white/[0.02] border border-white/5">
        <button
          onClick={() => { setActiveSubTab('controls'); setSearchQuery(''); }}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${activeSubTab === 'controls' ? 'bg-aeirmist-cyan text-black shadow-[0_0_20px_rgba(0,242,255,0.3)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
        >
          <Shield size={14} />
          <span>Privacy Controls</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('blocked'); setSearchQuery(''); }}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${activeSubTab === 'blocked' ? 'bg-aeirmist-cyan text-black shadow-[0_0_20px_rgba(0,242,255,0.3)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
        >
          <UserX size={14} />
          <span>Blocked ({blockedUserIds.length})</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('restricted'); setSearchQuery(''); }}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${activeSubTab === 'restricted' ? 'bg-aeirmist-cyan text-black shadow-[0_0_20px_rgba(0,242,255,0.3)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
        >
          <ShieldAlert size={14} />
          <span>Restricted ({restrictedUserIds.length})</span>
        </button>

        <button
          onClick={() => { setActiveSubTab('vault'); setSearchQuery(''); }}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${activeSubTab === 'vault' ? 'bg-aeirmist-cyan text-black shadow-[0_0_20px_rgba(0,242,255,0.3)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
        >
          <KeyRound size={14} />
          <span>Vault & Hidden</span>
        </button>
      </div>

      {/* SUB-TAB 1: Privacy Controls */}
      {activeSubTab === 'controls' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-aeirmist-cyan/10 text-aeirmist-cyan">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Stealth & Profile Visibility</h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Control who can discover and view your profile data</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">Private Profile</h4>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-tight mt-0.5">Only confirmed followers can view your posts, stories, and activity</p>
                </div>
                <Toggle 
                  enabled={!!profile?.isPrivate} 
                  onToggle={() => handleToggleSetting('isPrivate', !!profile?.isPrivate)} 
                  loading={isUpdating === 'isPrivate'} 
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">Activity Status</h4>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-tight mt-0.5">Broadcast active online status across the network</p>
                </div>
                <Toggle 
                  enabled={profile?.showOnlineStatus !== false} 
                  onToggle={() => handleToggleSetting('showOnlineStatus', profile?.showOnlineStatus !== false)} 
                  loading={isUpdating === 'showOnlineStatus'} 
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">Hide Followers & Following List</h4>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-tight mt-0.5">Conceal your social connections graph from public view</p>
                </div>
                <Toggle 
                  enabled={!!profile?.hideFollowers} 
                  onToggle={() => handleToggleSetting('hideFollowers', !!profile?.hideFollowers)} 
                  loading={isUpdating === 'hideFollowers'} 
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">Hide Likes & Views Count</h4>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-tight mt-0.5">Conceal total likes and view counts on your posts</p>
                </div>
                <Toggle 
                  enabled={!!profile?.hideLikes} 
                  onToggle={() => handleToggleSetting('hideLikes', !!profile?.hideLikes)} 
                  loading={isUpdating === 'hideLikes'} 
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-aeirmist-magenta/10 text-aeirmist-magenta">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Interactions & Direct Messages</h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Manage transmission rules for direct chats and mentions</p>
              </div>
            </div>

            <div className="space-y-5 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white">Direct Message Requests</label>
                <select
                  value={profile?.messagingSettings?.whoCanMessageMe || 'followers'}
                  onChange={(e) => handleSelectSetting('messagingSettings.whoCanMessageMe', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-white focus:border-aeirmist-cyan outline-none transition-all cursor-pointer"
                >
                  <option value="everyone" className="bg-zinc-900 text-white">Open to Everyone</option>
                  <option value="followers" className="bg-zinc-900 text-white">Followers Only (Recommended)</option>
                  <option value="mutual" className="bg-zinc-900 text-white">Mutual Connections Only</option>
                  <option value="nobody" className="bg-zinc-900 text-white">Total Silence (Nobody)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white">Mentions & Tagging Permissions</label>
                <select
                  value={profile?.allowTagging || 'everyone'}
                  onChange={(e) => handleSelectSetting('allowTagging', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-white focus:border-aeirmist-cyan outline-none transition-all cursor-pointer"
                >
                  <option value="everyone" className="bg-zinc-900 text-white">Allow Mentions from Everyone</option>
                  <option value="followers" className="bg-zinc-900 text-white">Followers Only</option>
                  <option value="nobody" className="bg-zinc-900 text-white">Disable All Tags & Mentions</option>
                </select>
              </div>
            </div>
          </div>

          {/* TELEGRAM STYLE: Delete my account (If away for...) */}
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-400">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Delete my account</h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Account auto-destruction timer if away</p>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                <div>
                  <h4 className="text-xs font-extrabold text-white">If away for...</h4>
                  <p className="text-[10px] text-white/40 mt-0.5">If you do not log in at least once within this period, your account will be self-destructed.</p>
                </div>
                <select
                  value={profile?.deleteAccountIfAwayFor || '24 months'}
                  onChange={(e) => handleSelectSetting('deleteAccountIfAwayFor', e.target.value)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs font-semibold text-aeirmist-cyan focus:border-aeirmist-cyan outline-none transition-all cursor-pointer shrink-0 ml-4"
                >
                  <option value="1 month">1 month</option>
                  <option value="3 months">3 months</option>
                  <option value="6 months">6 months</option>
                  <option value="12 months">12 months</option>
                  <option value="24 months">24 months</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* SUB-TAB 2: Blocked Users */}
      {activeSubTab === 'blocked' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <UserX size={18} className="text-red-400" />
                  <span>Blocked Users</span>
                </h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">
                  Blocked users cannot message, tag, or view your profile and content
                </p>
              </div>

              <div className="relative min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search blocked..."
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-red-400/50"
                />
              </div>
            </div>

            {blockedProfiles.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {blockedProfiles.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={user.displayName}
                        className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-white">{user.displayName}</span>
                          {user.isVerified && <ShieldCheck className="text-aeirmist-cyan shrink-0" size={14} />}
                        </div>
                        <span className="text-[10px] text-white/40 font-mono">@{user.username}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnblock(user.id, user.username || 'user')}
                      className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <UserCheck size={12} />
                      <span>Unblock</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-white/[0.01] border border-dashed border-white/10 space-y-3">
                <Ghost size={32} className="mx-auto text-white/20" />
                <h4 className="text-xs font-black uppercase tracking-widest text-white/60">No Blocked Users</h4>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Your purge list is completely clear.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* SUB-TAB 3: Restricted Users */}
      {activeSubTab === 'restricted' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <ShieldAlert size={18} className="text-aeirmist-magenta" />
                  <span>Restricted Users</span>
                </h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">
                  Restricted users can comment, but their comments are only visible to them until approved
                </p>
              </div>

              <div className="relative min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search restricted..."
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-aeirmist-magenta/50"
                />
              </div>
            </div>

            {restrictedProfiles.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {restrictedProfiles.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={user.displayName}
                        className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-white">{user.displayName}</span>
                          {user.isVerified && <ShieldCheck className="text-aeirmist-cyan shrink-0" size={14} />}
                        </div>
                        <span className="text-[10px] text-white/40 font-mono">@{user.username}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnrestrict(user.id, user.username || 'user')}
                      className="px-4 py-2 rounded-xl bg-aeirmist-magenta/10 text-aeirmist-magenta hover:bg-aeirmist-magenta/20 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <UserCheck size={12} />
                      <span>Lift Restriction</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-white/[0.01] border border-dashed border-white/10 space-y-3">
                <ShieldAlert size={32} className="mx-auto text-white/20" />
                <h4 className="text-xs font-black uppercase tracking-widest text-white/60">No Restricted Users</h4>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">No accounts are currently restricted.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* SUB-TAB 4: Vault & Hidden Chats */}
      {activeSubTab === 'vault' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-aeirmist-cyan/10 text-aeirmist-cyan">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Aeirmist Secure Vault</h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Protect sensitive conversations behind a PIN code lock</p>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${profile?.vaultEnabled ? 'bg-aeirmist-cyan/10 text-aeirmist-cyan border border-aeirmist-cyan/20' : 'bg-white/10 text-white/40'}`}>
                {profile?.vaultEnabled ? 'Vault Protected' : 'Not Configured'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-white">Vault PIN Passcode</h4>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-tight mt-0.5">
                  {profile?.vaultEnabled ? 'PIN lock active. Click below to re-configure.' : 'Set up a passcode to lock hidden conversations.'}
                </p>
              </div>
              <button
                onClick={() => setShowVaultPinModal(true)}
                className="px-4 py-2.5 rounded-xl bg-aeirmist-cyan text-black font-black uppercase text-[10px] tracking-widest hover:bg-aeirmist-cyan/90 transition-all cursor-pointer"
              >
                {profile?.vaultEnabled ? 'Change PIN' : 'Set Vault PIN'}
              </button>
            </div>
          </div>

          {/* Hidden & Archived Chats */}
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-white/5 text-white/60">
                <Archive size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Archived & Hidden Channels</h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Auto-archive policies and hidden chat options</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">Auto-Archive Inactive Chats</h4>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-tight mt-0.5">Automatically move chats to archive after 30 days of inactivity</p>
                </div>
                <Toggle
                  enabled={!!profile?.messagingSettings?.autoArchiveInactive}
                  onToggle={() => handleToggleSetting('messagingSettings.autoArchiveInactive', !!profile?.messagingSettings?.autoArchiveInactive)}
                  loading={isUpdating === 'messagingSettings.autoArchiveInactive'}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">Auto-Archive Spam Requests</h4>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-tight mt-0.5">Route unconfirmed promotional requests directly to archives</p>
                </div>
                <Toggle
                  enabled={profile?.messagingSettings?.autoArchiveSpam !== false}
                  onToggle={() => handleToggleSetting('messagingSettings.autoArchiveSpam', profile?.messagingSettings?.autoArchiveSpam !== false)}
                  loading={isUpdating === 'messagingSettings.autoArchiveSpam'}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Vault PIN Setup Modal */}
      {showVaultPinModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#090D16]/90 border border-white/10 space-y-5 shadow-2xl relative">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-aeirmist-cyan/10 text-aeirmist-cyan">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-white uppercase tracking-wider text-sm">Vault Passcode Setup</h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Enter a 4-digit security code</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-white/40 tracking-wider">New PIN Code</label>
                <input
                  type="password"
                  maxLength={6}
                  value={vaultPin}
                  onChange={(e) => setVaultPin(e.target.value)}
                  placeholder="••••"
                  className="w-full h-11 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-white font-mono text-center tracking-[0.5em] text-lg focus:outline-none focus:border-aeirmist-cyan/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-white/40 tracking-wider">Confirm PIN Code</label>
                <input
                  type="password"
                  maxLength={6}
                  value={confirmVaultPin}
                  onChange={(e) => setConfirmVaultPin(e.target.value)}
                  placeholder="••••"
                  className="w-full h-11 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-white font-mono text-center tracking-[0.5em] text-lg focus:outline-none focus:border-aeirmist-cyan/50"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowVaultPinModal(false);
                    setVaultPin('');
                    setConfirmVaultPin('');
                  }}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveVaultPin}
                  disabled={isSavingPin || vaultPin.length < 4}
                  className="flex-1 py-3 rounded-xl bg-aeirmist-cyan text-black font-black uppercase text-[10px] tracking-widest hover:bg-aeirmist-cyan/90 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSavingPin ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  <span>Save PIN</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
