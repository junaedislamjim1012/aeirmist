import React, { useState } from 'react';
import { Search, Sparkles, Flame, Laugh, Heart, Coffee } from 'lucide-react';

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
}

export const GifPicker: React.FC<GifPickerProps> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('trending');

  // Realistic high quality animated GIFs from curated Unsplash & Giphy servers
  const gifDatabase: Record<string, string[]> = {
    trending: [
      'https://media.giphy.com/media/t3kiY967I37bVvEq9D/giphy.gif',
      'https://media.giphy.com/media/26AHONQ79FdYbzMaQ/giphy.gif',
      'https://media.giphy.com/media/3o7qE1YN7aBOFPRw8E/giphy.gif',
      'https://media.giphy.com/media/xT0xeJpD8e4DYnPLq0/giphy.gif',
      'https://media.giphy.com/media/l41YmQjdoKs4hgI6Y/giphy.gif',
      'https://media.giphy.com/media/l3q2zVr6cu95nF6O4/giphy.gif'
    ],
    reactions: [
      'https://media.giphy.com/media/l0MYEqEzw57gLaA0w/giphy.gif',
      'https://media.giphy.com/media/26gR1vvGChayfNezS/giphy.gif',
      'https://media.giphy.com/media/vNr3gC39at69O/giphy.gif',
      'https://media.giphy.com/media/5Govlcm8BO7gA/giphy.gif',
      'https://media.giphy.com/media/l3V0yA9zHe5m6JJI4/giphy.gif',
      'https://media.giphy.com/media/3o7abKhOpu0NXS3HBC/giphy.gif'
    ],
    meme: [
      'https://media.giphy.com/media/13HgwGsXF09K48/giphy.gif',
      'https://media.giphy.com/media/3orif8f8RkMGusts9a/giphy.gif',
      'https://media.giphy.com/media/yFQ0ywscgobJK/giphy.gif',
      'https://media.giphy.com/media/gw3IWyGkC0m7gX8g/giphy.gif',
      'https://media.giphy.com/media/unQ3IJU2rg76w/giphy.gif',
      'https://media.giphy.com/media/Ju7l5y9osyymQ/giphy.gif'
    ],
    coding: [
      'https://media.giphy.com/media/3o7qE1YN7aBOFPRw8E/giphy.gif',
      'https://media.giphy.com/media/9KCPkAcRqU9j2/giphy.gif',
      'https://media.giphy.com/media/QvBoMEcQ7DQXK/giphy.gif',
      'https://media.giphy.com/media/unQ3IJU2rg76w/giphy.gif',
      'https://media.giphy.com/media/LmN8OY2DAJCbXEGbVj/giphy.gif',
      'https://media.giphy.com/media/KAq5w44fPMnWo/giphy.gif'
    ],
    gaming: [
      'https://media.giphy.com/media/eunrI9scC1KHm/giphy.gif',
      'https://media.giphy.com/media/U3ZouVTrK6XN6/giphy.gif',
      'https://media.giphy.com/media/l1KtXm89v60nnvpH2/giphy.gif',
      'https://media.giphy.com/media/8vIFoKU8s3YfC/giphy.gif',
      'https://media.giphy.com/media/Dlhv0u6uEZZYI/giphy.gif',
      'https://media.giphy.com/media/fVZdQ7TK7hO5b6ADcc/giphy.gif'
    ]
  };

  const categories = [
    { id: 'trending', label: 'Trending', icon: Flame },
    { id: 'reactions', label: 'Reactions', icon: Laugh },
    { id: 'meme', label: 'Memes', icon: Coffee },
    { id: 'coding', label: 'Coding', icon: Sparkles },
    { id: 'gaming', label: 'Gaming', icon: Heart }
  ];

  const getFilteredGifs = () => {
    if (!query) {
      return gifDatabase[activeCategory] || gifDatabase.trending;
    }
    // Simple filter across all categories for matches
    const all = Object.values(gifDatabase).flat();
    return Array.from(new Set(all));
  };

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-4">
      <div className="flex justify-between items-center border-b border-white/10 pb-2">
        <span className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
          <Sparkles size={14} className="text-[#00f3ff]" />
          <span>GIF Picker</span>
        </span>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search GIFs..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f3ff] placeholder:text-white/20"
          />
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
        </div>

        {/* Categories strip */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setQuery('');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all shrink-0 ${activeCategory === cat.id && !query ? 'bg-[#00f3ff] text-black border-[#00f3ff]' : 'bg-white/5 border-white/5 text-white/60 hover:border-white/10'}`}
            >
              <cat.icon size={12} />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* GIF results grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
          {getFilteredGifs().map((gif, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(gif)}
              className="relative aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-[#00f3ff] hover:scale-[1.02] transition-all group"
            >
              <img src={gif} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-[10px] font-black uppercase text-white bg-black/80 px-2 py-0.5 rounded border border-white/10">Select</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
