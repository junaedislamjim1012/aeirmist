import React, { useState, useRef } from 'react';
import { Music, Search, Play, Pause, X, Volume2, Info } from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  url: string;
  duration: number;
}

interface MusicSelectorProps {
  selectedTrack: { track: Track; startOffset: number; volume: number } | null;
  onChange: (music: { track: Track; startOffset: number; volume: number } | null) => void;
}

export const MusicSelector: React.FC<MusicSelectorProps> = ({ selectedTrack, onChange }) => {
  const [query, setQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // High quality sample tracks with royalty-free direct URLs for seamless client preview
  const tracks: Track[] = [
    {
      id: 'synthwave',
      title: 'Neon Horizon',
      artist: 'Aeirmist Synth Collective',
      cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&q=80',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      duration: 372
    },
    {
      id: 'cyber',
      title: 'Digital Rain',
      artist: 'Lofi Glitch Engine',
      cover: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=120&q=80',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      duration: 423
    },
    {
      id: 'ambient',
      title: 'Stardust Void',
      artist: 'Prism Deep Space',
      cover: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=120&q=80',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      duration: 302
    },
    {
      id: 'chill',
      title: 'Solar Connections',
      artist: 'Vapor Waveform',
      cover: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=120&q=80',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      duration: 312
    }
  ];

  const [filteredTracks, setFilteredTracks] = useState<Track[]>(tracks);

  const handleSearch = (text: string) => {
    setQuery(text);
    if (!text) {
      setFilteredTracks(tracks);
      return;
    }
    setFilteredTracks(
      tracks.filter(
        t => t.title.toLowerCase().includes(text.toLowerCase()) || t.artist.toLowerCase().includes(text.toLowerCase())
      )
    );
  };

  const togglePlay = (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (playingId === track.id) {
        audioRef.current.pause();
        setPlayingId(null);
      } else {
        audioRef.current.src = track.url;
        audioRef.current.play();
        setPlayingId(track.id);
      }
    } else {
      const audio = new Audio(track.url);
      audio.play();
      audioRef.current = audio;
      setPlayingId(track.id);
      audio.onended = () => setPlayingId(null);
    }
  };

  const handleSelectTrack = (track: Track) => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
    }
    onChange({
      track,
      startOffset: 0,
      volume: 80
    });
  };

  const handleRemove = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
    }
    onChange(null);
  };

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-4">
      <div className="flex justify-between items-center border-b border-white/10 pb-2">
        <span className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
          <Music size={14} className="text-[#00f3ff]" />
          <span>Add Music</span>
        </span>
        {selectedTrack && (
          <button
            onClick={handleRemove}
            className="text-[10px] text-red-400 hover:underline uppercase font-bold flex items-center gap-0.5"
          >
            <X size={10} /> Remove
          </button>
        )}
      </div>

      {selectedTrack ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-white/[0.04] p-3 rounded-xl border border-white/10">
            <img src={selectedTrack.track.cover} className="w-10 h-10 rounded-lg object-cover" alt="" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">{selectedTrack.track.title}</div>
              <div className="text-[10px] text-white/50 truncate">{selectedTrack.track.artist}</div>
            </div>
            <button
              onClick={(e) => togglePlay(selectedTrack.track, e)}
              className="p-2 bg-[#00f3ff] text-black rounded-full hover:scale-105 active:scale-95 transition-all"
            >
              {playingId === selectedTrack.track.id ? <Pause size={12} /> : <Play size={12} />}
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] font-bold text-white/40 uppercase tracking-widest">
              <span>Trim Start Point</span>
              <span className="text-[#00f3ff] font-mono">{selectedTrack.startOffset}s</span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              value={selectedTrack.startOffset}
              onChange={(e) => {
                const val = Number(e.target.value);
                onChange({ ...selectedTrack, startOffset: val });
              }}
              className="w-full accent-[#00f3ff] bg-white/10 h-1 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] font-bold text-white/40 uppercase tracking-widest">
              <span>Volume</span>
              <span className="text-[#00f3ff] font-mono">{selectedTrack.volume}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Volume2 size={12} className="text-white/40" />
              <input
                type="range"
                min={0}
                max={100}
                value={selectedTrack.volume}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onChange({ ...selectedTrack, volume: val });
                }}
                className="flex-1 accent-[#00f3ff] bg-white/10 h-1 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search songs or artists..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f3ff] placeholder:text-white/20"
            />
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
          </div>

          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
            {filteredTracks.map((track) => (
              <div
                key={track.id}
                onClick={() => handleSelectTrack(track)}
                className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/5 text-left transition-all cursor-pointer group"
              >
                <img src={track.cover} className="w-8 h-8 rounded-md object-cover border border-white/10" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-[#00f3ff] transition-colors truncate">
                    {track.title}
                  </div>
                  <div className="text-[9px] text-white/40 truncate">{track.artist}</div>
                </div>
                <button
                  onClick={(e) => togglePlay(track, e)}
                  className="p-1.5 bg-white/5 group-hover:bg-white/10 rounded-full text-white"
                >
                  {playingId === track.id ? <Pause size={10} /> : <Play size={10} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
