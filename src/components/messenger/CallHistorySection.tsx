import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Phone, Video, Trash2, Clock, PhoneIncoming, PhoneOutgoing, PhoneMissed, Zap } from 'lucide-react';
import { formatShortTimestamp, formatAeirmistTimestamp } from '../../lib/date';
import { useAeirmist } from '../../context/AeirmistContext';
import { collection, query, where, orderBy, limit, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

interface CallRecord {
  id: string;
  callerId: string;
  receiverId: string;
  callerName: string;
  callerPhoto: string;
  receiverName: string;
  receiverPhoto: string;
  type: 'audio' | 'video';
  status: string;
  duration: number;
  timestamp: any;
  participants: string[];
}

export const CallHistorySection = ({ onBack, onRedial }: { onBack: () => void, onRedial: (profileId: string, type: 'audio' | 'video') => void }) => {
  const { db, profile, user, addToast } = useAeirmist();
  const [history, setHistory] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !user?.uid) return;

    const q = query(
      collection(db, 'callHistory'),
      where('participants', 'array-contains', user.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      const records = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CallRecord));
      setHistory(records);
      setLoading(false);
    });

    return () => unsub();
  }, [db, user?.uid]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'callHistory', id));
    } catch (e: any) { console.error("Failed to delete history", e); addToast({ title: "Failed", message: "Failed to delete history", type: "warning" }); }
  };

  const getCallIcon = (record: CallRecord) => {
    const isMeCaller = record.callerId === profile?.id;
    if (record.status === 'missed' || record.status === 'rejected') {
       return <PhoneMissed size={14} className="text-aeirmist-magenta" />;
    }
    return isMeCaller 
      ? <PhoneOutgoing size={14} className="text-aeirmist-cyan" /> 
      : <PhoneIncoming size={14} className="text-aeirmist-lime" />;
  };

  return (
    <div className="flex flex-col h-full bg-aeirmist-bg">
      <div className="p-6 border-b border-white/10 flex items-center gap-4">
        <button onClick={onBack} className="text-white/60 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 className="text-xl font-display font-bold uppercase tracking-tighter italic">Signal Logs</h2>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">History Cluster</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-20">
             <Zap size={32} className="animate-pulse" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em]">Decoding Fragments...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 px-8">
            <p className="text-[10px] text-white/20 uppercase tracking-widest leading-loose font-bold italic">
              No call history. Start a call to see your history here.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {history.map((record, idx) => {
              const isCaller = record.callerId === profile?.id;
              const otherId = isCaller ? record.receiverId : record.callerId;
              const otherName = isCaller ? record.receiverName : record.callerName;
              const otherPhoto = isCaller ? record.receiverPhoto : record.callerPhoto;
              
              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 rounded-[2rem] bg-white/5 border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img 
                        src={otherPhoto} 
                        alt={otherName} 
                        className="w-12 h-12 rounded-2xl object-cover border border-white/10 group-hover:scale-105 transition-transform" 
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black border border-white/10 flex items-center justify-center">
                        {getCallIcon(record)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-sm font-bold truncate group-hover:text-aeirmist-cyan transition-colors">{otherName}</h3>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] text-white/40 font-black uppercase tracking-tighter italic">{formatAeirmistTimestamp(record.timestamp)}</span>
                          <span className="text-[8px] text-white/20 font-black tracking-widest">{formatShortTimestamp(record.timestamp)} ago</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 opacity-60">
                           {record.type === 'video' ? <Video size={10} /> : <Phone size={10} />}
                           <span className="text-[9px] font-black uppercase tracking-widest">{record.type} Link</span>
                        </div>
                        {record.duration > 0 && (
                          <div className="flex items-center gap-1 opacity-40">
                             <Clock size={10} />
                             <span className="text-[9px] font-black tracking-widest capitalize">
                               {Math.floor(record.duration / 60)}m {record.duration % 60}s
                             </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                       <button 
                         onClick={() => onRedial(otherId, record.type)}
                         className="w-9 h-9 rounded-xl bg-aeirmist-cyan/10 text-aeirmist-cyan border border-aeirmist-cyan/20 flex items-center justify-center hover:bg-aeirmist-cyan hover:text-aeirmist-bg transition-all"
                       >
                         {record.type === 'video' ? <Video size={16} /> : <Phone size={16} />}
                       </button>
                       <button 
                         onClick={() => handleDelete(record.id)}
                         className="w-9 h-9 rounded-xl bg-white/5 text-white/20 border border-white/5 flex items-center justify-center hover:bg-aeirmist-magenta/10 hover:text-aeirmist-magenta hover:border-aeirmist-magenta/20 transition-all opacity-0 group-hover:opacity-100"
                       >
                         <Trash2 size={14} />
                       </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
