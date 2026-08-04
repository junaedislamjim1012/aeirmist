import React from 'react';
import { 
  Shield, 
  Lock, 
  Mail, 
  Smartphone, 
  Key, 
  RefreshCcw, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';

interface SecurityTimelineProps {
  activities: any[];
}

export const SecurityTimeline: React.FC<SecurityTimelineProps> = ({ activities }) => {
  const getEventIcon = (action: string) => {
    const lower = (action || '').toLowerCase();
    if (lower.includes('password')) return <Lock size={14} className="text-amber-400" />;
    if (lower.includes('email')) return <Mail size={14} className="text-[var(--color-aeirmist-cyan)]" />;
    if (lower.includes('device') || lower.includes('terminal')) return <Smartphone size={14} className="text-blue-400" />;
    if (lower.includes('revoke') || lower.includes('logout')) return <LogOut size={14} className="text-red-400" />;
    if (lower.includes('2fa')) return <Shield size={14} className="text-purple-400" />;
    return <Key size={14} className="text-[var(--color-aeirmist-cyan)]" />;
  };

  const formatDate = (ts: any) => {
    if (!ts) return 'Recent';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  return (
    <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 space-y-5">
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Clock className="text-[var(--color-aeirmist-cyan)]" size={18} />
          <h3 className="text-sm font-black uppercase tracking-widest text-white">Recent Security Events Timeline</h3>
        </div>
        <span className="text-[10px] font-mono text-white/40 uppercase">Audit Trail</span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
        {activities.length > 0 ? (
          activities.map((item, idx) => (
            <div key={item.id || idx} className="relative group">
              {/* Dot */}
              <div className="absolute -left-[1.65rem] top-1.5 w-3.5 h-3.5 rounded-full bg-[#090d16] border-2 border-[var(--color-aeirmist-cyan)] shadow-[0_0_8px_var(--color-aeirmist-cyan)] group-hover:scale-125 transition-transform" />

              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getEventIcon(item.action)}
                    <span className="text-xs font-bold text-white capitalize">
                      {(item.action || 'Security Action').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-white/40">
                    {formatDate(item.timestamp)}
                  </span>
                </div>

                {item.details && (
                  <p className="text-[11px] font-mono text-white/60 pl-6">
                    {item.details}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-xs font-mono text-white/30 uppercase tracking-widest">
            No recent security events logged
          </div>
        )}
      </div>
    </div>
  );
};
