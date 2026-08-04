import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search } from 'lucide-react';
import { Chat } from '../../types/messenger';

interface ForwardModalProps {
  onClose: () => void;
  onForward: (recipientId: string) => void;
  chats: Chat[];
}

export const ForwardModal: React.FC<ForwardModalProps> = ({ onClose, onForward, chats }) => {
  const [search, setSearch] = useState('');

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-panel w-full max-w-sm bg-aeirmist-bg border border-white/10 rounded-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-white">Forward to...</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20} /></button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-black uppercase outline-none focus:border-aeirmist-cyan/40"
          />
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {filteredChats.map(chat => (
            <button
              key={chat.id}
              onClick={() => onForward(chat.id)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-left"
            >
              <img src={chat.photo} alt={chat.name} className="w-10 h-10 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{chat.name}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
