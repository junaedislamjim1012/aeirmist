import React, { useState } from 'react';
import { Smile, Image, Film, MapPin, Users, Music, ListTodo, Link as LinkIcon, Trash2, Undo, Redo } from 'lucide-react';

export const TextComposer = ({ onPublish }: { onPublish: (text: string) => void }) => {
  const [text, setText] = useState('');
  const [background, setBackground] = useState('minimal');

  const backgrounds = ['minimal', 'white', 'black', 'blue', 'purple', 'gradient', 'blur', 'glass', 'paper'];

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center text-xs text-white/40">
        <span>Draft</span>
        <div className="flex gap-2">
          <button onClick={() => console.log("Action coming soon")}><Undo size={16}/></button>
          <button onClick={() => console.log("Action coming soon")}><Redo size={16}/></button>
        </div>
      </div>

      <div className={`p-8 rounded-2xl border border-white/10 ${background === 'minimal' ? 'bg-[#06080d]' : 'bg-white/5'}`}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full h-40 bg-transparent text-lg text-white placeholder:text-white/20 focus:outline-none resize-none"
        />
        <div className="text-right text-xs text-white/20">{text.length} / 3000</div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {backgrounds.map(bg => (
          <button
            key={bg}
            onClick={() => setBackground(bg)}
            className={`p-2 rounded-lg text-[10px] uppercase font-bold border ${background === bg ? 'border-[#00f3ff]' : 'border-white/10'}`}
          >
            {bg}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2 pt-4 border-t border-white/10">
        {[
          { icon: Smile, label: 'Emoji' },
          { icon: Image, label: 'Photo' },
          { icon: Film, label: 'Video' },
          { icon: MapPin, label: 'Location' },
          { icon: Users, label: 'People' },
          { icon: Music, label: 'Music' },
          { icon: ListTodo, label: 'Poll' },
          { icon: LinkIcon, label: 'Link' },
        ].map(item => (
          <button onClick={() => console.log("Action coming soon")} key={item.label} className="flex flex-col items-center gap-2 p-2 text-white/60 hover:text-white">
            <item.icon size={18} />
            <span className="text-[9px]">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
