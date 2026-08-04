import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Users, Camera, Search, Check } from 'lucide-react';
import { useAeirmist } from '../../context/AeirmistContext';
import { messagingService } from '../../modules/messaging/MessagingService';
import { getAvatarUrl } from '../../lib/avatar';

interface GroupCreationModalProps {
  onClose: () => void;
}

export const GroupCreationModal: React.FC<GroupCreationModalProps> = ({ onClose }) => {
    const { allProfiles, profile, db, addToast } = useAeirmist();
    const [step, setStep] = useState(1);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const toggleMember = (id: string) => {
        setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
    };

    const handleCreate = async () => {
        if (!groupName || selectedMembers.length === 0 || !profile) return;
        setIsLoading(true);
        try {
            await messagingService.createGroupConversation(db, profile.id, selectedMembers, groupName);
            addToast({ title: 'Group Created', message: 'Your group is ready.', type: 'success' });
            onClose();
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error', message: 'Failed to create group.', type: 'warning' });
        } finally {
            setIsLoading(false);
        }
    };

    const filteredProfiles = allProfiles.filter(p => 
        p.id !== profile?.id && 
        (p.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
         p.username?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-[#181A20] w-full max-w-sm rounded-3xl border border-white/10 p-6 shadow-2xl flex flex-col gap-6"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black text-white uppercase tracking-tighter">
                        {step === 1 ? 'New Group' : 'Group Details'}
                    </h2>
                    <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20} /></button>
                </div>

                {step === 1 && (
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                            <input 
                                type="text"
                                placeholder="Search friends..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white"
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto max-h-60 space-y-2">
                            {filteredProfiles.map(p => (
                                <button 
                                    key={p.id}
                                    onClick={() => toggleMember(p.id)}
                                    className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${selectedMembers.includes(p.id) ? 'bg-aeirmist-cyan/20 border border-aeirmist-cyan/30' : 'hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <img src={getAvatarUrl(p.photoURL)} className="w-8 h-8 rounded-full object-cover" alt="" />
                                        <div className="text-left">
                                            <p className="text-xs font-bold text-white">{p.displayName}</p>
                                            <p className="text-[10px] text-white/40">@{p.username}</p>
                                        </div>
                                    </div>
                                    {selectedMembers.includes(p.id) && <Check size={16} className="text-aeirmist-cyan" />}
                                </button>
                            ))}
                        </div>
                        <button 
                            disabled={selectedMembers.length === 0}
                            onClick={() => setStep(2)}
                            className="w-full py-3 rounded-xl bg-aeirmist-cyan text-black text-xs font-bold uppercase disabled:opacity-50"
                        >
                            Next ({selectedMembers.length})
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border border-dashed border-white/20">
                                <Camera className="text-white/40" />
                            </div>
                            <input 
                                type="text"
                                placeholder="Group Name"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white text-center"
                            />
                        </div>
                        <button 
                            disabled={isLoading || !groupName}
                            onClick={handleCreate}
                            className="w-full py-3 rounded-xl bg-aeirmist-cyan text-black text-xs font-bold uppercase disabled:opacity-50"
                        >
                            {isLoading ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};
