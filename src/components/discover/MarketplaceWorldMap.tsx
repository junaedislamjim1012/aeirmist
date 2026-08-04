import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Store, Navigation, ShieldCheck, ArrowRight, Compass } from 'lucide-react';
import { Store as StoreType } from './MarketplaceTypes';
import { getAvatarUrl } from '../../lib/avatar';

interface MarketplaceWorldMapProps {
  stores: StoreType[];
  onSelectStore: (store: StoreType) => void;
  onSetLocation: (locationName: string) => void;
  activeLocation: string;
}

// Coordinate mappings for the map nodes inside our visual SVG viewbox
const MAP_USERS = [
  { id: 'dhaka', name: 'Dhaka (Central)', x: 180, y: 150, storesFilter: 'Dhaka', desc: 'Central logistics node' },
  { id: 'banani', name: 'Banani Hub', x: 210, y: 120, storesFilter: 'Banani', desc: 'Premium luxury boutique tier' },
  { id: 'mirpur', name: 'Mirpur Zone', x: 140, y: 110, storesFilter: 'Mirpur', desc: 'High-density tech & electronics' },
  { id: 'chittagong', name: 'Chittagong Port', x: 290, y: 260, storesFilter: 'Chittagong', desc: 'Maritime gate import hub' },
  { id: 'sylhet', name: 'Sylhet Gardens', x: 320, y: 80, storesFilter: 'Sylhet', desc: 'Premium organic tea/textiles' },
  { id: 'barishal', name: 'Barishal', x: 160, y: 250, storesFilter: 'Barishal', desc: 'Riverside supply chain node' }
];

export const MarketplaceWorldMap: React.FC<MarketplaceWorldMapProps> = ({
  stores,
  onSelectStore,
  onSetLocation,
  activeLocation
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Compute active store counts per node
  const getStoresAtNode = (filterName: string) => {
    return stores.filter(s => {
      const storeLoc = (s.location || '').toLowerCase();
      const searchVal = filterName.toLowerCase();
      return storeLoc.includes(searchVal);
    });
  };

  const selectedNodeData = MAP_USERS.find(n => n.id === selectedNodeId);
  const activeNodeStores = selectedNodeData ? getStoresAtNode(selectedNodeData.storesFilter) : [];

  return (
    <div className="rounded-3xl border border-white/5 bg-zinc-950/80 p-5 space-y-5 shadow-2xl relative overflow-hidden">
      
      {/* Decorative cyber grid details */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="text-left">
          <h2 className="text-sm font-black text-white flex items-center gap-1.5 font-mono tracking-wider">
            <Compass className="text-aeirmist-cyan animate-spin-slow" size={16} />
            AEIRMIST LOCATOR NETWORK
          </h2>
          <p className="text-[10px] text-zinc-500 font-mono">Simulated geographic representation of active storefront nodes</p>
        </div>

        {/* Filters and legend */}
        <div className="flex flex-wrap gap-2 text-[8.5px] font-mono select-none">
          <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded border border-white/5">
            <span className="h-1.5 w-1.5 rounded-full bg-aeirmist-cyan animate-ping" />
            Active Node
          </span>
          <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded border border-white/5">
            <Store size={8.5} className="text-indigo-400" /> {stores.length} Connected Stores
          </span>
        </div>
      </div>

      {/* Inner Container grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Map visualization canvas wrapper (7 cols) */}
        <div className="lg:col-span-7 bg-black/50 rounded-2xl border border-white/[0.04] p-4 flex items-center justify-center relative select-none">
          
          {/* Main SVG Vector Outline */}
          <svg viewBox="0 0 400 350" className="w-full h-auto max-w-sm drop-shadow-[0_0_20px_rgba(6,182,212,0.05)]">
            {/* Background Map paths placeholders styled in glowing matrix wireframes */}
            <path 
              d="M 120 40 C 180 30, 220 50, 250 30 C 290 20, 310 60, 330 70 C 350 90, 380 120, 340 180 C 320 220, 310 260, 280 310 C 240 330, 190 320, 150 290 C 120 270, 90 230, 110 190 C 120 150, 80 110, 90 80 Z" 
              fill="none" 
              stroke="rgba(255,255,255,0.02)" 
              strokeWidth="3" 
              strokeDasharray="4 4" 
            />
            <path 
              d="M 140 60 C 170 50, 210 60, 240 50 C 270 40, 300 70, 310 90 C 330 110, 340 150, 320 190 C 300 220, 290 250, 260 290 C 230 310, 180 300, 140 270 C 110 250, 100 210, 120 170 C 130 130, 110 90, 130 70 Z" 
              fill="none" 
              stroke="rgba(6, 182, 212, 0.08)" 
              strokeWidth="1.5" 
            />

            {/* Connecting Matrix lines */}
            <line x1="180" y1="150" x2="210" y2="120" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="180" y1="150" x2="140" y2="110" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="180" y1="150" x2="290" y2="260" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="180" y1="150" x2="160" y2="250" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="2 2" />

            {/* Map coordinates dots */}
            {MAP_USERS.map(node => {
              const count = getStoresAtNode(node.storesFilter).length;
              const isSelected = selectedNodeId === node.id;
              const isHovered = hoveredNode === node.id;
              
              return (
                <g 
                  key={node.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => {
                    setSelectedNodeId(isSelected ? null : node.id);
                    onSetLocation(node.storesFilter);
                  }}
                >
                  {/* Glowing halo rings */}
                  {(isHovered || isSelected) && (
                    <circle 
                      cx={node.x} 
                      cy={node.y} 
                      r="16" 
                      className="fill-cyan-500/10 stroke-cyan-400/30 animate-pulse" 
                      strokeWidth="1" 
                    />
                  )}
                  
                  {/* Ripple pulse */}
                  {count > 0 && (
                    <circle 
                      cx={node.x} 
                      cy={node.y} 
                      r="10" 
                      className="fill-none stroke-cyan-500/30 animate-ping" 
                      strokeWidth="1" 
                    />
                  )}

                  {/* Core Pin point */}
                  <circle 
                    cx={node.x} 
                    cy={node.y} 
                    r={isSelected ? "5" : "3.5"} 
                    className={`${isSelected ? 'fill-white stroke-cyan-400' : count > 0 ? 'fill-cyan-400 stroke-black' : 'fill-zinc-700 stroke-zinc-900'}`}
                    strokeWidth="1.5" 
                  />

                  {/* Dynamic tag overlay label on hover */}
                  {isHovered && (
                    <g transform={`translate(${node.x + 8}, ${node.y - 8})`}>
                      <rect 
                        rx="4" 
                        width="95" 
                        height="20" 
                        className="fill-zinc-950/90 stroke-white/10" 
                        strokeWidth="1" 
                      />
                      <text 
                        x="6" 
                        y="13" 
                        className="fill-white font-mono text-[8px] font-extrabold"
                      >
                        {node.name}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected node listing detail (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          
          <AnimatePresence mode="wait">
            {selectedNodeId ? (
              <motion.div 
                key={selectedNodeId}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5 space-y-4 text-left flex-1"
              >
                {/* Node descriptor */}
                <div className="flex justify-between items-start border-b border-white/[0.04] pb-3">
                  <div>
                    <h3 className="text-xs font-black text-white uppercase font-mono">{selectedNodeData?.name}</h3>
                    <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{selectedNodeData?.desc}</p>
                  </div>
                  <button 
                    onClick={() => { setSelectedNodeId(null); onSetLocation('All'); }}
                    className="text-[9px] text-zinc-500 hover:text-white font-mono uppercase underline cursor-pointer"
                  >
                    Reset Map
                  </button>
                </div>

                {/* Seller listings match */}
                <div className="space-y-3">
                  <p className="text-[8.5px] font-mono tracking-widest text-zinc-500 uppercase">STOREFRONTS DETECTED ({activeNodeStores.length})</p>
                  
                  {activeNodeStores.length === 0 ? (
                    <p className="text-[10px] text-zinc-650 font-mono py-6 text-center">No active stores registered under this geographic filter.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                      {activeNodeStores.map(store => (
                        <div 
                          key={store.id}
                          onClick={() => onSelectStore(store)}
                          className="p-2.5 rounded-xl bg-zinc-950 border border-white/5 hover:border-white/10 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-98 group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <img src={getAvatarUrl(store.logo)} className="h-8 w-8 rounded-lg object-cover bg-neutral-900 border border-white/5" alt="" />
                            <div className="text-xs text-left min-w-0">
                              <p className="font-extrabold text-white truncate group-hover:text-aeirmist-cyan transition flex items-center gap-1">
                                {store.name}
                                <ShieldCheck size={10} className="text-aeirmist-cyan shrink-0" />
                              </p>
                              <p className="text-[9px] text-zinc-500 truncate font-mono">@{store.username} • {store.category}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono font-bold text-zinc-500 group-hover:text-white flex items-center gap-0.5 shrink-0 transition">
                            Visit <ArrowRight size={8} />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="p-5 bg-zinc-900/10 border border-dashed border-white/5 rounded-2xl flex-1 flex flex-col justify-center items-center text-center text-zinc-500 space-y-3 min-h-[160px]">
                <MapPin className="text-zinc-700 animate-pulse" size={24} />
                <div className="space-y-1">
                  <p className="text-[10px] font-mono tracking-wider uppercase text-zinc-400">SELECT GEOGRAPHIC NODE</p>
                  <p className="text-[9px] leading-relaxed max-w-xs text-zinc-600">Click on any glowing vector node on the map overlay to trace active retail entities and filter inventory instantly.</p>
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Quick Info Disclaimer footer */}
          <div className="p-3 bg-zinc-950 border border-white/[0.03] rounded-2xl text-[8px] font-mono text-zinc-600 flex items-center gap-2 text-left">
            <Navigation size={12} className="text-zinc-700 shrink-0" />
            <span>Telemetry data generated automatically via local vendor registrations. Trace parameters correspond to coordinates on delivery sheets.</span>
          </div>

        </div>
      </div>

    </div>
  );
};
