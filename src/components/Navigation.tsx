import React from 'react';
import { useAppearance } from '../context/AppearanceContext';
import { 
  Home, 
  Search, 
  PlusSquare, 
  Plus,
  Heart, 
  User, 
  Sparkles, 
  MessageSquare, 
  Settings, 
  Play,
  Film,
  LayoutDashboard,
  Users,
  Bell,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Bookmark,
  Activity,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  Pin,
  ShoppingBag,
  Scan,
  Fingerprint,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useAeirmist } from '../context/AeirmistContext';
import { getAvatarUrl } from '../lib/avatar';
import { AeirmistLogo } from './ui/AeirmistLogo';

export type Tab = 'feed' | 'messenger' | 'discover' | 'profile' | 'settings' | 'videos' | 'dashboard' | 'notifications' | 'admin';

interface NavigationProps {
  onCreate: () => void;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  onNotificationsClick: () => void;
  onPreload?: (comp: any) => void;
  isRemoteView?: boolean;
}

export const Navigation = React.memo(({ onCreate, activeTab, onTabChange, isExpanded, setIsExpanded, onNotificationsClick, onPreload, isRemoteView }: NavigationProps) => {
  const { user, profile, isNavHidden, unreadMessagesCount, unreadNotificationsCount, localAvatarURL, featureFlags } = useAeirmist();
  const { settings } = useAppearance();
  const isGlobalBgActive = settings.globalBgType !== 'none' && !!settings.globalBgValue;

  // Local hover state with beautiful, smart lock safety
  const [isHovered, setIsHovered] = React.useState(false);
  const collapseTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = React.useCallback(() => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    setIsHovered(true);
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    // Smart collapse protection: check if user is currently typing or interacting
    const isUserActiveTyping = typeof document !== 'undefined' && document.activeElement && (
      document.activeElement.tagName === 'INPUT' || 
      document.activeElement.tagName === 'TEXTAREA' || 
      document.activeElement.getAttribute('contenteditable') === 'true'
    );
    
    if (isUserActiveTyping) {
      // Don't auto-collapse while active in input fields
      return;
    }

    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
    }
    collapseTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 280); // Quick yet elegant buffer delay
  }, []);

  // Clear timer on unmount
  React.useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);

  // Combined smart state
  const isCurrentlyExpanded = isExpanded || isHovered;
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.nav 
        id="aeirmist-desktop-sidebar"
        aria-label="Main Navigation"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        animate={{ width: isCurrentlyExpanded ? 'var(--sidebar-w)' : 'var(--sidebar-w-collapsed)' }}
        transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', damping: 22, stiffness: 125 }}
        className="hidden md:flex flex-col h-full border-r border-white/10 bg-[#060608]/90 backdrop-blur-3xl p-4 z-50 shrink-0 relative select-none overflow-hidden"
      >
        {/* Holographic Top Spotlight Bar */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-aeirmist-cyan/35 to-transparent pointer-events-none" />

        {/* TOP: Fixed sticky header (Logo and Pin Toggle) */}
        <div className="flex items-center justify-between mb-8 px-1.5 pt-2 shrink-0">
          <button 
            type="button"
            onClick={() => onTabChange('feed')} 
            onMouseEnter={() => onPreload?.('feed')}
            aria-label="Aeirmist Home"
            className="flex items-center cursor-pointer group min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aeirmist-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg transition-all" 
          >
            <AeirmistLogo 
              variant={isCurrentlyExpanded ? "full" : "compact"}
              className={isCurrentlyExpanded ? "w-[75px] h-[20px] sm:w-[85px] sm:h-[22px]" : "w-7 h-7 sm:w-8 sm:h-8"} 
              glow={true}
              glowStrength="normal"
            />
          </button>
          
          {/* Dual State Sidebar Pin Button */}
          {isCurrentlyExpanded && (
            <div className="shrink-0">
              {isExpanded ? (
                <button 
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  aria-label="Unpin Sidebar"
                  title="Unpin Sidebar (Enable Auto-Hover)"
                  className="p-1.5 rounded-lg bg-aeirmist-magenta/15 border border-aeirmist-magenta/40 text-aeirmist-magenta hover:text-white hover:bg-aeirmist-magenta/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aeirmist-magenta transition-all duration-300 shadow-[0_0_10px_rgba(255,0,234,0.3)] flex items-center justify-center group/pin relative overflow-hidden"
                >
                  <Pin size={13} strokeWidth={2.5} className="rotate-45 transition-transform duration-300 group-hover/pin:rotate-0" />
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  aria-label="Pin Sidebar"
                  title="Pin Sidebar (Always Expanded)"
                  className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-white/40 hover:text-aeirmist-cyan hover:bg-white/10 hover:border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aeirmist-cyan hover:shadow-[0_0_12px_rgba(0,242,255,0.25)] transition-all duration-300 flex items-center justify-center group/pin"
                >
                  <Pin size={13} strokeWidth={1.8} className="transition-transform duration-300 group-hover/pin:rotate-45 text-white/50" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* MIDDLE: Scrollable navigation links container */}
        <div className="flex-1 overflow-y-auto py-1 space-y-2.0 min-h-0">
          <NavItem icon={<Home />} label="Home Feed" active={activeTab === 'feed'} isExpanded={isCurrentlyExpanded} onClick={() => onTabChange('feed')} onMouseEnter={() => onPreload?.('feed')} />
          <NavItem icon={<Users />} label="Connections" active={activeTab === 'dashboard'} comingSoon={featureFlags?.discover === false} isExpanded={isCurrentlyExpanded} onClick={() => onTabChange('dashboard')} onMouseEnter={() => onPreload?.('dashboard')} />
          <NavItem icon={<ShoppingBag />} label="Marketplace" active={activeTab === 'discover'} comingSoon={featureFlags?.marketplace === false} isExpanded={isCurrentlyExpanded} onClick={() => onTabChange('discover')} onMouseEnter={() => onPreload?.('discover')} />
          <NavItem icon={<Film />} label="Videos" active={activeTab === 'videos'} comingSoon={featureFlags?.videos === false} isExpanded={isCurrentlyExpanded} onClick={() => onTabChange('videos')} onMouseEnter={() => onPreload?.('videos')} />
          <NavItem icon={<MessageSquare />} label="Inbox" active={activeTab === 'messenger'} comingSoon={featureFlags?.inbox === false} isExpanded={isCurrentlyExpanded} onClick={() => onTabChange('messenger')} onMouseEnter={() => onPreload?.('messenger')} badge={unreadMessagesCount} />
          <NavItem icon={<Bell />} label="Alerts" active={activeTab === 'notifications'} comingSoon={featureFlags?.notifications === false} isExpanded={isCurrentlyExpanded} onClick={onNotificationsClick} onMouseEnter={() => onPreload?.('notifications')} badge={unreadNotificationsCount} />
          
          <div className="h-px bg-white/5 my-4 mx-1.5 relative shrink-0">
             <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-aeirmist-cyan/30 via-aeirmist-magenta/30 to-transparent blur-[0.5px]" />
          </div>
          
          <NavItem icon={<PlusSquare />} label="New Post" isExpanded={isCurrentlyExpanded} onClick={onCreate} variant="accent" />
          <NavItem icon={<User />} label="Profile" active={activeTab === 'profile' && !isRemoteView} isExpanded={isCurrentlyExpanded} onClick={() => onTabChange('profile')} onMouseEnter={() => onPreload?.('profile')} />
          <NavItem icon={<Settings />} label="Settings" active={activeTab === 'settings'} isExpanded={isCurrentlyExpanded} onClick={() => onTabChange('settings')} onMouseEnter={() => onPreload?.('settings')} />
          {(user?.email?.toLowerCase() === 'junaedislamjim180@gmail.com' || 
             profile?.email?.toLowerCase() === 'junaedislamjim180@gmail.com' || 
             profile?.username?.toLowerCase() === 'junaed_islam_jim9' ||
             profile?.role === 'admin' ||
             profile?.isAdmin === true) && (
            <NavItem 
              icon={<ShieldCheck className="text-aeirmist-cyan" />} 
              label="Control Panel" 
              active={activeTab === 'admin'} 
              isExpanded={isCurrentlyExpanded} 
              onClick={() => {
                onTabChange('admin' as any);
                if (window.location.pathname !== '/admin-panel') {
                  window.history.pushState({}, '', '/admin-panel');
                }
              }} 
            />
          )}
        </div>

        {/* BOTTOM: Sticky user info profile card */}
        <div className="mt-auto pt-4 shrink-0">
          <div className="h-px bg-white/5 mb-4 relative">
             <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-aeirmist-magenta/30 via-aeirmist-cyan/30 to-transparent blur-[0.5px]" />
          </div>

          <motion.button 
            id="aeirmist-sidebar-profile-card"
            type="button"
            onClick={() => onTabChange('profile')}
            aria-label={`View profile for ${profile?.displayName || user?.displayName || 'user'}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full text-left cursor-pointer rounded-xl transition-all duration-300 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aeirmist-cyan ${
              isCurrentlyExpanded 
                ? 'p-2 bg-gradient-to-r from-[#0d0914]/85 to-[#070d10]/85 border border-white/8 hover:border-white/15 hover:bg-gradient-to-r hover:from-[#110c1c] hover:to-[#0b1418] shadow-[0_4px_24px_rgba(0,0,0,0.65)]' 
                : 'p-[4px] h-[48px] bg-transparent border border-transparent hover:border-white/8 hover:bg-white/5'
            } relative group/profile overflow-hidden`}
          >
            {/* Mirror highlighting sheen */}
            {isCurrentlyExpanded && (
              <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
            )}

            {/* Avatar container with status tracker */}
            <div className={`relative shrink-0 flex items-center justify-center rounded-xl p-[2px] transition-all duration-350 ${
              isCurrentlyExpanded 
                ? 'w-9 h-9 border border-aeirmist-cyan/35 bg-black/40 group-hover/profile:border-aeirmist-cyan/70'
                : 'w-10 h-10 border border-white/5 bg-[#07070a]/90 group-hover/profile:border-aeirmist-magenta/40'
            }`}>
              <div className="w-full h-full rounded-lg overflow-hidden bg-neutral-900 border border-neutral-950">
                <img 
                  src={localAvatarURL || getAvatarUrl(profile?.photoURL || user?.photoURL)} 
                  alt="Profile" 
                  className="w-full h-full object-cover group-hover/profile:scale-105 transition-transform duration-500"
                />
              </div>
              
              {/* Active indicator dot */}
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-aeirmist-lime rounded-full border border-neutral-950 shadow-[0_0_6px_rgba(191,255,0,0.8)]" />
            </div>

            {/* Profile identifiers dynamically loading with beautiful spacing */}
            {isCurrentlyExpanded && (
              <motion.div 
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-3 flex-1 min-w-0 pr-1 flex flex-col justify-center"
              >
                <span className="text-[11px] font-black uppercase text-white/95 tracking-widest truncate block">
                  {profile?.displayName || user?.displayName || 'Identity_Null'}
                </span>
                <span className="text-[9px] font-mono font-bold tracking-widest text-aeirmist-cyan/80 truncate block mt-0.5 group-hover/profile:text-aeirmist-cyan transition-colors">
                  @{profile?.username || 'user'}
                </span>
              </motion.div>
            )}

            {/* Hover Tooltip when collapsed */}
            {!isCurrentlyExpanded && (
              <div className="absolute left-full ml-5 px-3 py-2 rounded-xl bg-[#09090c]/98 border border-white/10 text-[9px] uppercase font-black tracking-widest opacity-0 group-hover/profile:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-[100] shadow-2xl backdrop-blur-xl">
                Profile - {profile?.displayName || user?.displayName || 'Identity_Null'}
              </div>
            )}
          </motion.button>
        </div>
      </motion.nav>

      {/* Mobile Bottom Navigation Bar - FLUID DOCK */}
      <AnimatePresence>
        {!isNavHidden && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-[390px] mb-[env(safe-area-inset-bottom,0px)] overflow-visible"
          >
            <div 
              role="navigation" 
              aria-label="Mobile Navigation"
              className={`relative rounded-2xl border border-white/10 px-2 py-1.5 flex justify-around items-center shadow-[0_12px_30px_rgba(0,0,0,0.85)] ${isGlobalBgActive ? 'bg-[#060608]/80' : 'bg-black/85'} backdrop-blur-3xl overflow-hidden`}
            >
              {/* Metallic Glass sheen highlights */}
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-aeirmist-cyan/40 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 inset-x-0 h-[0.5px] bg-gradient-to-r from-transparent via-aeirmist-magenta/40 to-transparent pointer-events-none" />
              
              <MobileNavItem icon={<Home />} active={activeTab === 'feed'} onClick={() => onTabChange('feed')} onMouseEnter={() => onPreload?.('feed')} label="Home" />
              <MobileNavItem icon={<Users />} active={activeTab === 'dashboard'} onClick={() => onTabChange('dashboard')} onMouseEnter={() => onPreload?.('dashboard')} label="Connections" />
              <MobileNavItem icon={<Film />} active={activeTab === 'videos'} onClick={() => onTabChange('videos')} onMouseEnter={() => onPreload?.('videos')} label="Videos" />
              <MobileNavItem icon={<MessageSquare />} active={activeTab === 'messenger'} onClick={() => onTabChange('messenger')} onMouseEnter={() => onPreload?.('messenger')} label="Messages" badge={unreadMessagesCount} />
              <MobileNavItem icon={<User />} active={activeTab === 'profile' && !isRemoteView} onClick={() => onTabChange('profile')} onMouseEnter={() => onPreload?.('profile')} label="Profile" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

// Primary standardized Sidebar Item Button
const NavItem = React.memo(({ icon, label, active = false, isExpanded = true, onClick, variant = 'default', onMouseEnter, badge, comingSoon = false }: { 
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  isExpanded?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'accent';
  onMouseEnter?: () => void;
  badge?: number;
  comingSoon?: boolean;
}) => {
  const activeColor = label === "Home Feed" || variant === 'accent' ? 'aeirmist-magenta' : 'aeirmist-cyan';
  
  // Custom precise color styling specs for standard navigation items
  const styles = {
    'aeirmist-magenta': {
      activeBg: 'bg-[#120815]/70 backdrop-blur-xl',
      activeText: 'text-aeirmist-magenta font-semibold tracking-wider',
      activeBorder: 'border-aeirmist-magenta/30',
      activeRing: 'focus-visible:ring-aeirmist-magenta',
      indicator: 'bg-aeirmist-magenta',
      shadow: 'transparent'
    },
    'aeirmist-cyan': {
      activeBg: 'bg-[#061218]/70 backdrop-blur-xl',
      activeText: 'text-aeirmist-cyan font-semibold tracking-wider',
      activeBorder: 'border-aeirmist-cyan/30',
      activeRing: 'focus-visible:ring-aeirmist-cyan',
      indicator: 'bg-aeirmist-cyan',
      shadow: 'transparent'
    }
  }[activeColor];

  const formatBadge = (count: number) => {
    return count > 99 ? '99+' : count.toString();
  };

  return (
    <motion.button 
      type="button"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`h-[52px] flex items-center p-1.5 rounded-xl transition-all relative group min-w-0 border w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 ${active ? styles.activeRing : 'focus-visible:ring-white/20'} ${
        active 
          ? `${styles.activeBg} ${styles.activeBorder}` 
          : 'bg-[#09090c]/40 border-white/5 text-white/50 hover:text-white hover:bg-[#121217]/85 hover:border-white/15 hover:shadow-[0_0_15px_rgba(255,255,255,0.04)]'
      }`}
    >
      {/* Active Sidebar Pointer bar - fits beautifully on grid alignment */}
      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className={`absolute left-[-11px] top-1/2 -translate-y-1/2 w-[5px] h-7 ${styles.indicator} rounded-r-xl shrink-0`} 
        />
      )}

      {/* Futuristic Square Icon capsule */}
      <div className={`relative shrink-0 flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-300 overflow-hidden ${
        active 
          ? activeColor === 'aeirmist-magenta'
            ? 'bg-gradient-to-b from-aeirmist-magenta/15 to-transparent border-aeirmist-magenta/80 shadow-[0_0_12px_rgba(255,0,234,0.4)] text-aeirmist-magenta'
            : 'bg-gradient-to-b from-aeirmist-cyan/15 to-transparent border-aeirmist-cyan/80 shadow-[0_0_12px_rgba(0,242,255,0.4)] text-aeirmist-cyan'
          : 'bg-[#07070a]/90 border-white/10 text-white/40 group-hover:border-white/20 group-hover:text-white group-hover:bg-[#111115]'
      }`}>
        {/* Dynamic Glass reflect shines */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:animate-shimmer" />
        </div>
        
        {React.cloneElement(icon as any, { size: 19, strokeWidth: active ? 2.5 : 2.0 })}
        
        {/* Unread badge overlay for compact/collapsed state */}
        {!isExpanded && badge !== undefined && badge > 0 && (
          <div className="absolute -top-1 -right-1 bg-aeirmist-cyan text-black text-[8px] font-black w-4.5 h-4.5 rounded-[6px] flex items-center justify-center border border-neutral-950 shadow-[0_0_10px_rgba(0,242,255,0.75)]">
            {formatBadge(badge)}
          </div>
        )}
      </div>
      
      {/* Navigation Label with fluid space-saving typography */}
      {isExpanded && (
        <div className="flex-1 flex items-center justify-between min-w-0 ml-3 pr-2">
          <motion.span 
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className={`text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap truncate ${active ? styles.activeText : 'text-inherit group-hover:text-white/90'}`}
          >
            {label}
          </motion.span>

          {comingSoon ? (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-1.5 py-0.5 rounded-[6px] bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[7px] font-mono font-bold tracking-widest shrink-0"
            >
              SOON
            </motion.div>
          ) : badge !== undefined && badge > 0 ? (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-1.5 py-0.5 rounded-[6px] bg-aeirmist-cyan text-black text-[8px] font-black tracking-widest shadow-[0_0_15px_rgba(0,242,255,0.6)] border border-black/20 shrink-0"
            >
              {formatBadge(badge)}
            </motion.div>
          ) : null}
        </div>
      )}

      {/* Floating tooltip labels on hover in compact mode */}
      {!isExpanded && (
        <div className="absolute left-full ml-5 px-3 py-2 rounded-xl bg-[#09090c]/98 border border-white/10 text-[9px] uppercase font-black tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-[100] shadow-2xl backdrop-blur-xl">
          {label} {badge !== undefined && badge > 0 ? `(${formatBadge(badge)})` : ''}
        </div>
      )}
    </motion.button>
  );
});

// Compact Mobile Bottom nav item trigger
const MobileNavItem = React.memo(({ icon, active = false, onClick, onMouseEnter, badge, label }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void; onMouseEnter?: () => void; badge?: number }) => (
  <motion.button 
    type="button"
    aria-label={label}
    aria-current={active ? 'page' : undefined}
    whileTap={{ scale: 0.92 }}
    whileHover={{ scale: 1.05 }}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    className="relative flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aeirmist-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-xl"
  >
    <div className={`w-full h-full rounded-xl flex items-center justify-center transition-all duration-300 border ${
      active 
        ? 'bg-gradient-to-b from-aeirmist-cyan/15 to-transparent border-aeirmist-cyan shadow-[0_0_12px_rgba(0,242,255,0.35)] text-aeirmist-cyan'
        : 'bg-[#0a0a0d]/80 border-white/5 text-white/45 hover:border-white/15 hover:text-white'
    }`}>
      {/* Premium Glass reflection */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      <div className="relative z-10 transition-all duration-300">
        {React.cloneElement(icon as any, { 
          size: 18, 
          strokeWidth: active ? 2.5 : 1.8,
        })}
      </div>
    </div>

    {badge !== undefined && badge > 0 && (
      <div className="absolute -top-1 -right-1 z-20 px-1.5 py-0.5 min-w-[18px] h-[18px] bg-aeirmist-cyan text-black text-[8px] font-black rounded-full border border-neutral-950 flex items-center justify-center shadow-[0_0_10px_rgba(0,242,255,0.8)] animate-pulse">
        {badge > 99 ? '99+' : badge}
      </div>
    )}
  </motion.button>
));
