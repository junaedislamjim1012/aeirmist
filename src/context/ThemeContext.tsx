import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type AtmosphereType = 'neural' | 'grid' | 'particles' | 'fog' | 'matrix' | 'flare' | 'void' | 'stars' | 'bio' | 'minimal';

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  primary: string;
  secondary: string;
  bg: string;
  panel: string;
  glow: string;
  accent: string;
  atmosphere: AtmosphereType;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Artifact';
  isLocked?: boolean;
  isLight?: boolean;
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'neural-default',
    name: 'Dark Default',
    description: 'The standard theme. Balanced and stable.',
    primary: '#00f2ff', // Aeirmist Cyan
    secondary: '#ff00ea', // Aeirmist Magenta
    bg: '#050505',
    panel: 'rgba(255, 255, 255, 0.03)',
    glow: 'transparent',
    accent: '#1e1e1e',
    atmosphere: 'neural',
    rarity: 'Common'
  },
  {
    id: 'void-protocol',
    name: 'Dark Theme',
    description: 'Dimensional echo from the outer networks.',
    primary: '#bc00ff',
    secondary: '#000000',
    bg: '#020005',
    panel: 'rgba(188, 0, 255, 0.04)',
    glow: 'transparent',
    accent: '#0d001a',
    atmosphere: 'void',
    rarity: 'Epic'
  },
  {
    id: 'quantum-ice',
    name: 'Ice Blue',
    description: 'Cold-state computing. Optimal for high-speed transmission.',
    primary: '#ffffff',
    secondary: '#00d0ff',
    bg: '#000810',
    panel: 'rgba(255, 255, 255, 0.02)',
    glow: 'transparent',
    accent: '#001a33',
    atmosphere: 'fog',
    rarity: 'Rare'
  },
  {
    id: 'emerald-echo',
    name: 'Emerald Echo',
    description: 'Legacy terminal theme. Traditional Interface.',
    primary: '#00ff41',
    secondary: '#003300',
    bg: '#000500',
    panel: 'rgba(0, 255, 65, 0.03)',
    glow: 'transparent',
    accent: '#001a00',
    atmosphere: 'matrix',
    rarity: 'Common'
  },
  {
    id: 'solar-flare',
    name: 'Solar Flare',
    description: 'High-energy plasma activity.',
    primary: '#ff9d00',
    secondary: '#cc0000',
    bg: '#0a0500',
    panel: 'rgba(255, 157, 0, 0.04)',
    glow: 'transparent',
    accent: '#1a0d00',
    atmosphere: 'flare',
    rarity: 'Epic'
  },
  {
    id: 'obsidion-zero',
    name: 'Obsidian Zero',
    description: 'Minimalist theme. Minimalist and elite.',
    primary: '#a0a0a0',
    secondary: '#1a1a1a',
    bg: '#000000',
    panel: 'rgba(255, 255, 255, 0.01)',
    glow: 'transparent',
    accent: '#0e0e0e',
    atmosphere: 'minimal',
    rarity: 'Legendary'
  },
  {
    id: 'synthwave-x',
    name: 'Synthwave X',
    description: 'Retro-futuristic nostalgia from the 80s Grid.',
    primary: '#ff00ff',
    secondary: '#00ffff',
    bg: '#05000a',
    panel: 'rgba(255, 0, 255, 0.04)',
    glow: 'transparent',
    accent: '#140026',
    atmosphere: 'grid',
    rarity: 'Rare'
  },
  {
    id: 'astro-link',
    name: 'Astro Link',
    description: 'Saved with the orbital satellites.',
    primary: '#4d9eff',
    secondary: '#001a3d',
    bg: '#00020a',
    panel: 'rgba(77, 158, 255, 0.03)',
    glow: 'transparent',
    accent: '#000d1a',
    atmosphere: 'stars',
    rarity: 'Artifact'
  },
  {
    id: 'biohazard-x',
    name: 'Biohazard-X',
    description: 'Warning: System errors.',
    primary: '#ccff00',
    secondary: '#334d00',
    bg: '#020500',
    panel: 'rgba(204, 255, 0, 0.04)',
    glow: 'transparent',
    accent: '#0d1a00',
    atmosphere: 'bio',
    rarity: 'Epic'
  },
  {
    id: 'luminous-white',
    name: 'Luminous Dark',
    description: 'A brilliant, daylight-balanced light theme with high text safety and clean light paneling.',
    primary: '#0ea5e9', // Deep sky blue
    secondary: '#d946ef', // Vibrant pink
    bg: '#f8fafc', // slate-50
    panel: 'rgba(15, 23, 42, 0.04)', // slate panel
    glow: 'transparent',
    accent: '#cbd5e1', // slate-300
    atmosphere: 'minimal',
    isLight: true,
    rarity: 'Common'
  },
  {
    id: 'cyber-blossom',
    name: 'Neon Sakura',
    description: 'Electric spring aesthetic. High vibrancy fuchsia glows reflected on warm-fiber white mesh canvas.',
    primary: '#ec4899', // pink-500
    secondary: '#14b8a6', // teal-500
    bg: '#fffbee', // Warm fiber off-white
    panel: 'rgba(236, 72, 153, 0.04)',
    glow: 'transparent',
    accent: '#fef08a', // yellow-200
    atmosphere: 'minimal',
    isLight: true,
    rarity: 'Rare'
  },
  {
    id: 'matrix-mainframe-light',
    name: 'Mainframe Light',
    description: 'Industrial mainframe daylight mode. Traditional digital node emerald contrast.',
    primary: '#16a34a', // green-600
    secondary: '#0f172a', // slate-800
    bg: '#f0fdf4', // green-50
    panel: 'rgba(22, 163, 74, 0.04)',
    glow: 'transparent',
    accent: '#bbf7d0', // green-200
    atmosphere: 'minimal',
    isLight: true,
    rarity: 'Epic'
  }
];

interface ThemeContextType {
  activeTheme: ThemeConfig;
  setTheme: (id: string) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    try {
      return localStorage.getItem('aeirmist_theme_id') || 'neural-default';
    } catch (e) {
      console.warn("Failed to read theme from localStorage:", e);
      return 'neural-default';
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const activeTheme = THEMES.find(t => t.id === activeThemeId) || THEMES[0];

  const setTheme = useCallback((id: string) => {
    setIsLoading(true);
    // Simulate a brief Sync
    setTimeout(() => {
      setActiveThemeId(id);
      try {
        localStorage.setItem('aeirmist_theme_id', id);
      } catch (e) {
        console.warn("Failed to save theme to localStorage:", e);
      }
      setIsLoading(false);
    }, 800);
  }, []);

  useEffect(() => {
    // Apply CSS variables to root
    const root = document.documentElement;
    root.style.setProperty('--color-aeirmist-cyan', activeTheme.primary);
    root.style.setProperty('--color-aeirmist-magenta', activeTheme.secondary);
    root.style.setProperty('--color-aeirmist-bg', activeTheme.bg);
    root.style.setProperty('--color-aeirmist-accent', activeTheme.accent);
    root.style.setProperty('--aeirmist-panel', activeTheme.panel);
    root.style.setProperty('--aeirmist-glow', activeTheme.glow);
    
    // Update data attribute for specific styling if needed
    root.setAttribute('data-theme', activeTheme.id);
    root.setAttribute('data-atmosphere', activeTheme.atmosphere);

    if (activeTheme.isLight) {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [activeTheme]);

  return (
    <ThemeContext.Provider value={{ activeTheme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
