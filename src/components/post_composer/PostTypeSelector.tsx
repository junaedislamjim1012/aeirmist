import React from 'react';
import { Camera, FileText, Film, BookOpen, Video, ListTodo } from 'lucide-react';

export const PostTypeSelector = ({ onSelect }: { onSelect: (type: string) => void }) => {
  const types = [
    { id: 'photo', label: 'Photos & Videos', icon: Camera },
    { id: 'text', label: 'Text Post', icon: FileText },
    { id: 'reel', label: 'Reel / Video', icon: Film },
    { id: 'story', label: 'Story', icon: BookOpen },
    { id: 'live', label: 'Live', icon: Video },
    { id: 'poll', label: 'Poll', icon: ListTodo },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {types.map((type) => (
        <button
          key={type.id}
          onClick={() => onSelect(type.id)}
          className="flex flex-col items-center justify-center p-6 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-2xl transition-all gap-3"
        >
          <type.icon size={32} className="text-[#00f3ff]" />
          <span className="text-white font-bold text-xs">{type.label}</span>
        </button>
      ))}
    </div>
  );
};
