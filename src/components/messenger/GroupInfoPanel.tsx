import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, UserPlus, Settings, Check, Trash2, Crown, UserMinus } from 'lucide-react';
import { useAeirmist } from '../../context/AeirmistContext';
import { messagingService } from '../../modules/messaging/MessagingService';
import { getAvatarUrl } from '../../lib/avatar';

interface GroupInfoPanelProps {
  chat: any;
  onClose: () => void;
}

export const GroupInfoPanel: React.FC<GroupInfoPanelProps> = ({ chat, onClose }) => {
    const { profile, db, addToast } = useAeirmist();
    const isAdmin = chat.admins?.includes(profile?.id);

    const promote = async (memberId: string) => {
        try {
            await messagingService.promoteToAdmin(db, chat.id, profile.id, memberId);
            addToast({ title: 'Success', message: 'Promoted to admin', type: 'success' });
        } catch (e) {
            addToast({ title: 'Error', message: 'Failed to promote', type: 'warning' });
        }
    };

    const remove = async (memberId: string) => {
        try {
            await messagingService.removeGroupMember(db, chat.id, profile.id, memberId);
            addToast({ title: 'Success', message: 'Member removed', type: 'success' });
        } catch (e) {
            addToast({ title: 'Error', message: 'Failed to remove', type: 'warning' });
        }
    };

    return (
        <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="h-full w-full bg-[#121212] border-l border-white/10 flex flex-col p-6 gap-6 overflow-y-auto"
        >
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-white">Group Info</h2>
                <button onClick={onClose}><X size={20} className="text-white/40"/></button>
            </div>
            
            <div className="flex flex-col items-center gap-2">
                <img src={getAvatarUrl(chat.groupPhotoURL)} className="w-20 h-20 rounded-full object-cover" alt="" />
                <h3 className="text-xl font-bold text-white">{chat.groupName}</h3>
            </div>
            
            <div className="space-y-4">
                <h4 className="text-xs font-black text-white/40 uppercase">Members</h4>
                {chat.participants?.map((pId: string) => (
                    <div key={pId} className="flex items-center justify-between bg-white/5 p-2 rounded-xl">
                        <div className="flex items-center gap-2">
                             <img src={getAvatarUrl(chat.participantDetails?.[pId]?.photoURL)} className="w-8 h-8 rounded-full" alt="" />
                             <span className="text-xs text-white">{chat.participantDetails?.[pId]?.displayName || 'Unknown'}</span>
                             {chat.admins?.includes(pId) && <Crown size={12} className="text-yellow-500 ml-1"/>}
                        </div>
                        {isAdmin && pId !== profile?.id && (
                            <div className="flex gap-2">
                                {!chat.admins?.includes(pId) && <button onClick={() => promote(pId)} className="text-white/40 hover:text-yellow-500"><Crown size={16} /></button>}
                                <button onClick={() => remove(pId)} className="text-white/40 hover:text-red-500"><UserMinus size={16} /></button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
