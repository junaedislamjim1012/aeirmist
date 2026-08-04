import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Play, 
  Pause, 
  X, 
  Music, 
  TrendingUp, 
  Clock, 
  ExternalLink, 
  Loader2, 
  Sparkles, 
  Disc 
} from 'lucide-react';
import { useAeirmist } from '../../context/AeirmistContext';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  increment 
} from 'firebase/firestore';

const SPOTIFY_SEARCH_ENABLED = false; // Feature flag to hide/show the Spotify search tab

export const MusicSearchModal = ({ onClose, onSelect }: { onClose: () => void, onSelect: (song: any) => void }) => {
  const { db, addToast } = useAeirmist();
  const [activeTab, setActiveTab] = useState<'library' | 'spotify'>('library');
  
  // Library States
  const [libraryTracks, setLibraryTracks] = useState<any[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Trending');

  // Spotify states
  const [spotifyQuery, setSpotifyQuery] = useState('');
  const [spotifyResults, setSpotifyResults] = useState<any[]>([]);
  const [spotifyLoading, setSpotifyLoading] = useState(false);

  // Audio Engine States
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Real-time Sound Library Subscription
  useEffect(() => {
    if (!db) return;

    setLibraryLoading(true);
    // Fetch all tracks from the sound_library collection
    const q = query(collection(db, 'sound_library'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setLibraryTracks(list);
      setLibraryLoading(false);
    }, (error) => {
      console.error('Error subscription to sound_library:', error);
      setLibraryLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  // Dynamic Category Tags extraction
  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    libraryTracks.forEach(track => {
      if (track.category) {
        cats.add(track.category);
      }
    });
    return ['Trending', 'All', ...Array.from(cats)];
  }, [libraryTracks]);

  // Filter and Sort Sound Library tracks
  const filteredAndSortedLibrary = React.useMemo(() => {
    let list = [...libraryTracks];

    // Search query filtering
    if (libraryQuery.trim()) {
      const queryLower = libraryQuery.toLowerCase();
      list = list.filter(track => 
        track.title.toLowerCase().includes(queryLower) ||
        track.artist.toLowerCase().includes(queryLower)
      );
    }

    // Category filtering & sorting
    if (selectedCategory === 'Trending') {
      // Sort by usageCount descending
      list.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    } else if (selectedCategory !== 'All') {
      list = list.filter(track => track.category === selectedCategory);
    }

    return list;
  }, [libraryTracks, libraryQuery, selectedCategory]);

  // Audio Preview Playback controller
  const handlePlayPause = (e: React.MouseEvent, track: any) => {
    e.stopPropagation(); // Avoid triggering selection
    
    if (playingTrackId === track.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.audioURL);
      audioRef.current.play().catch(err => {
        console.error('Audio preview error:', err);
        addToast?.({
          title: 'PLAYBACK ERROR',
          message: 'Unable to stream audio preview.',
          type: 'warning'
        });
      });
      setPlayingTrackId(track.id);

      audioRef.current.onended = () => {
        setPlayingTrackId(null);
      };
    }
  };

  // Select track and update Usage Count
  const handleSelectTrack = async (track: any) => {
    // Standardize song metadata for the rest of the application
    const songMetadata = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      albumArtUrl: track.coverArtURL || track.albumArtUrl || 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=200&auto=format&fit=crop',
      albumArtURL: track.coverArtURL || track.albumArtURL || 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=200&auto=format&fit=crop',
      url: track.audioURL || track.url,
      audioURL: track.audioURL || track.url,
      category: track.category
    };

    // Increment usageCount in Firestore asynchronously
    if (db && track.id && !track.isSpotify) {
      const trackRef = doc(db, 'sound_library', track.id);
      updateDoc(trackRef, {
        usageCount: increment(1)
      }).catch(err => {
        console.error('Error incrementing usage count:', err);
      });
    }

    // Stop audio preview
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingTrackId(null);

    // Call onSelect callback
    onSelect(songMetadata);
  };

  // Spotify debounce search (only executed if enabled)
  useEffect(() => {
    if (!SPOTIFY_SEARCH_ENABLED || activeTab !== 'spotify') return;

    if (!spotifyQuery.trim()) {
      setSpotifyResults([]);
      return;
    }

    setSpotifyLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(spotifyQuery)}`);
        if (!res.ok) {
          throw new Error('Failed to fetch from Spotify API proxy');
        }
        const data = await res.json();
        
        const mapped = data.map((t: any, idx: number) => ({
          id: `spotify_${idx}_${Date.now()}`,
          title: t.name,
          name: t.name,
          artist: t.artist,
          albumArtUrl: t.albumArtURL,
          albumArtURL: t.albumArtURL,
          spotifyURL: t.spotifyURL,
          isSpotify: true
        }));
        
        setSpotifyResults(mapped);
      } catch (error) {
        console.error("Spotify search error:", error);
      } finally {
        setSpotifyLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [spotifyQuery, activeTab]);

  return (
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 15 }} 
        animate={{ scale: 1, y: 0 }} 
        className="bg-[#0b0c10] border border-white/10 rounded-3xl w-full max-w-md p-6 overflow-hidden flex flex-col max-h-[85vh] shadow-2xl relative"
      >
        {/* Glowing Cyber Accent */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-aeirmist-cyan to-transparent opacity-80" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-black uppercase text-xs tracking-[0.25em] bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent flex items-center gap-2">
              <Music size={14} className="text-aeirmist-cyan animate-pulse" />
              Sonic Soundtrack
            </h3>
            <button onClick={onClose} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
              <X className="text-white/50 hover:text-white" size={14} />
            </button>
        </div>

        {/* Tab Switching (Only visible if Spotify Search is enabled) */}
        {SPOTIFY_SEARCH_ENABLED && (
          <div className="flex gap-2 p-1 bg-white/5 rounded-2xl mb-5 border border-white/5 shrink-0">
            <button 
              onClick={() => setActiveTab('library')}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'library' 
                  ? 'bg-white/10 text-aeirmist-cyan shadow-[0_0_15px_rgba(0,242,255,0.15)] border border-aeirmist-cyan/20' 
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <Music size={12} />
              Sound Library
            </button>
            <button 
              onClick={() => setActiveTab('spotify')}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'spotify' 
                  ? 'bg-white/10 text-[#1DB954] shadow-[0_0_15px_rgba(29,185,84,0.15)] border border-[#1DB954]/20' 
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.377-1.454-5.37-1.783-8.893-.982-.336.075-.668-.135-.744-.47-.077-.337.135-.669.47-.745 3.856-.88 7.15-.51 9.817 1.123.294.18.386.563.207.857zm1.224-2.724c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.078-1.182-.413.125-.85-.107-.975-.52-.125-.413.107-.85.52-.975 3.67-1.114 8.24-.57 11.347 1.342.368.227.488.708.26 1.075zm.105-2.81c-3.262-1.937-8.644-2.115-11.758-1.17-.5.152-1.025-.133-1.177-.633-.153-.5.132-1.025.633-1.177 3.616-1.098 9.544-.89 13.3 1.34.45.267.6.845.333 1.295-.267.45-.845.6-1.295.334z"/>
              </svg>
              Spotify Search
            </button>
          </div>
        )}
        
        {/* Search Inputs */}
        <div className="relative mb-4 shrink-0">
            <Search className="absolute left-3.5 top-3.5 text-white/30" size={16} />
            {activeTab === 'library' ? (
              <input 
                  value={libraryQuery}
                  onChange={(e) => setLibraryQuery(e.target.value)}
                  placeholder="Search local soundtrack library..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 pl-11 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-aeirmist-cyan/30 focus:bg-white/[0.05] transition-all"
              />
            ) : (
              <input 
                  value={spotifyQuery}
                  onChange={(e) => setSpotifyQuery(e.target.value)}
                  placeholder="Search Spotify tracks..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 pl-11 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#1DB954]/30 focus:bg-white/[0.05] transition-all"
              />
            )}
        </div>

        {/* Category Filters (Only for library tab) */}
        {activeTab === 'library' && categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-2 shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0 border ${
                  selectedCategory === cat
                    ? 'bg-aeirmist-cyan/15 text-aeirmist-cyan border-aeirmist-cyan/35 shadow-[0_0_10px_rgba(0,242,255,0.1)]'
                    : 'bg-white/[0.01] text-white/45 border-white/5 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat === 'Trending' && <TrendingUp size={10} className="inline mr-1" />}
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* List Content */}
        <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[450px] space-y-2 pr-1 scrollbar-thin">
          {activeTab === 'library' ? (
            <div className="space-y-2.5">
              
              {libraryLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <Loader2 size={24} className="text-aeirmist-cyan animate-spin" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">Syncing Tracks...</span>
                </div>
              ) : filteredAndSortedLibrary.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-white/30">
                    <Music size={16} />
                  </div>
                  <p className="text-xs text-white/40 font-bold uppercase tracking-wider">No tracks found</p>
                  <p className="text-[10px] font-mono text-white/25 lowercase mt-1">Try another category or adjust your search.</p>
                </div>
              ) : (
                filteredAndSortedLibrary.map(song => {
                  const isCurrentPlaying = playingTrackId === song.id;

                  return (
                    <div 
                      key={song.id} 
                      className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 cursor-pointer transition-all active:scale-[0.99] group" 
                      onClick={() => handleSelectTrack(song)}
                    >
                      {/* Cover Image */}
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-md shrink-0 bg-white/5 border border-white/5">
                        <img 
                          src={song.coverArtURL || song.albumArtUrl || 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=200&auto=format&fit=crop'} 
                          className={`w-full h-full object-cover transition-transform duration-500 ${isCurrentPlaying ? 'animate-spin [animation-duration:8s]' : ''}`} 
                          alt="" 
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={(e) => handlePlayPause(e, song)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                        >
                          {isCurrentPlaying ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs text-white truncate group-hover:text-aeirmist-cyan transition-colors">{song.title}</div>
                          <div className="text-[10px] text-white/40 uppercase tracking-tight mt-0.5 truncate">{song.artist}</div>
                      </div>

                      {/* Right actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-[8px] font-mono text-white/30 hidden sm:inline">
                          {song.category}
                        </span>
                        
                        <button
                          type="button"
                          onClick={(e) => handlePlayPause(e, song)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isCurrentPlaying 
                              ? 'bg-aeirmist-cyan text-black shadow-[0_0_10px_rgba(0,242,255,0.4)]' 
                              : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {isCurrentPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-[10px] uppercase font-black text-[#1DB954] tracking-widest">
                    <Clock size={12} /> Spotify Catalog Lookup
                </div>
                {spotifyLoading && (
                  <Loader2 size={12} className="text-[#1DB954] animate-spin shrink-0" />
                )}
              </div>

              {spotifyResults.map(song => (
                  <div 
                    key={song.id} 
                    className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-[#1DB954]/5 hover:border-[#1DB954]/20 cursor-pointer transition-all active:scale-[0.99] group" 
                    onClick={() => handleSelectTrack(song)}
                  >
                      {song.albumArtUrl ? (
                        <img src={song.albumArtUrl} className="w-11 h-11 rounded-xl object-cover shrink-0" alt={song.title} />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                          <Music size={16} className="text-white/40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs text-white truncate">{song.title}</div>
                          <div className="text-[10px] text-white/40 uppercase tracking-tight mt-0.5 truncate">{song.artist}</div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(song.spotifyURL, '_blank');
                        }}
                        className="w-8 h-8 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/20 hover:bg-[#1DB954] hover:text-black flex items-center justify-center shrink-0 text-[#1DB954] transition-all"
                        title="Open in Spotify"
                      >
                        <ExternalLink size={12} />
                      </button>
                  </div>
              ))}

              {!spotifyLoading && spotifyResults.length === 0 && (
                <div className="text-center py-12 px-6">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-white/30">
                    <Search size={16} />
                  </div>
                  <p className="text-xs text-white/40">
                    {spotifyQuery.trim() ? 'No Spotify tracks found matching this transmission.' : 'Enter a track or artist to search the Spotify catalog.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Power Brand */}
        {SPOTIFY_SEARCH_ENABLED && activeTab === 'spotify' && (
          <div className="mt-4 pt-3 border-t border-white/5 text-center shrink-0">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20">
              Powered by Spotify — opens in Spotify app.
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
