import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Languages, 
  MessageSquare, 
  Settings2, 
  Scan, 
  ArrowRight,
  Check,
  Search,
  Sparkles,
  CheckCircle2,
  Mic,
  X,
  Volume2
} from 'lucide-react';

export interface LanguageItem {
  code: string;
  name: string;
  nativeName: string;
  scriptChar: string;
  region: 'Americas' | 'Asia & Pacific' | 'Europe' | 'Middle East';
  dialect: string;
  popular?: boolean;
  isRTL?: boolean;
}

const ALL_LANGUAGES: LanguageItem[] = [
  { code: 'en-US', name: 'English (US)', nativeName: 'English', scriptChar: 'A', region: 'Americas', dialect: 'United States', popular: true },
  { code: 'bn-BD', name: 'Bengali', nativeName: 'বাংলা', scriptChar: 'অ', region: 'Asia & Pacific', dialect: 'বাংলাদেশ (Bangladesh) & India', popular: true },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español', scriptChar: 'Es', region: 'Europe', dialect: 'España & Latinoamérica', popular: true },
  { code: 'fr-FR', name: 'French', nativeName: 'Français', scriptChar: 'Fr', region: 'Europe', dialect: 'France & Francophonie', popular: true },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch', scriptChar: 'De', region: 'Europe', dialect: 'Deutschland & Österreich', popular: true },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語', scriptChar: 'あ', region: 'Asia & Pacific', dialect: '日本 (Japan)', popular: true },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어', scriptChar: '한', region: 'Asia & Pacific', dialect: '대한민국 (South Korea)', popular: true },
  { code: 'zh-CN', name: 'Mandarin (Simplified)', nativeName: '简体中文', scriptChar: '文', region: 'Asia & Pacific', dialect: '中国 (China)', popular: true },
  { code: 'zh-TW', name: 'Mandarin (Traditional)', nativeName: '繁體中文', scriptChar: '華', region: 'Asia & Pacific', dialect: '台灣 / 香港' },
  { code: 'pt-BR', name: 'Portuguese', nativeName: 'Português', scriptChar: 'Pt', region: 'Americas', dialect: 'Brasil & Portugal', popular: true },
  { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية', scriptChar: 'ع', region: 'Middle East', dialect: 'العالم العربي (Middle East)', popular: true, isRTL: true },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', scriptChar: 'अ', region: 'Asia & Pacific', dialect: 'भारत (India)', popular: true },
  { code: 'it-IT', name: 'Italian', nativeName: 'Italiano', scriptChar: 'It', region: 'Europe', dialect: 'Italia' },
  { code: 'tr-TR', name: 'Turkish', nativeName: 'Türkçe', scriptChar: 'Tr', region: 'Europe', dialect: 'Türkiye' },
  { code: 'ru-RU', name: 'Russian', nativeName: 'Русский', scriptChar: 'Ру', region: 'Europe', dialect: 'Россия' },
  { code: 'vi-VN', name: 'Vietnamese', nativeName: 'Tiếng Việt', scriptChar: 'Vi', region: 'Asia & Pacific', dialect: 'Việt Nam' },
  { code: 'id-ID', name: 'Indonesian', nativeName: 'Bahasa Indonesia', scriptChar: 'Id', region: 'Asia & Pacific', dialect: 'Indonesia' },
  { code: 'ur-PK', name: 'Urdu', nativeName: 'اردو', scriptChar: 'ار', region: 'Asia & Pacific', dialect: 'پاکستان', isRTL: true },
  { code: 'pl-PL', name: 'Polish', nativeName: 'Polski', scriptChar: 'Pl', region: 'Europe', dialect: 'Polska' },
  { code: 'nl-NL', name: 'Dutch', nativeName: 'Nederlands', scriptChar: 'Nl', region: 'Europe', dialect: 'Nederland' },
  { code: 'en-GB', name: 'English (UK)', nativeName: 'English (UK)', scriptChar: 'UK', region: 'Europe', dialect: 'United Kingdom' },
];

const REGION_FILTERS = ['All', 'Popular', 'Asia & Pacific', 'Europe', 'Americas', 'Middle East'] as const;

const LanguagesSettings = () => {
  // Load initial settings from localStorage or defaults
  const [selectedCode, setSelectedCode] = useState<string>(() => {
    return localStorage.getItem('aeirmist_user_language') || 'en-US';
  });

  const [autoTranslate, setAutoTranslate] = useState<boolean>(() => {
    return localStorage.getItem('aeirmist_auto_translate') !== 'false';
  });

  const [smartFormatting, setSmartFormatting] = useState<boolean>(() => {
    return localStorage.getItem('aeirmist_smart_formatting') !== 'false';
  });

  const [voiceCaptions, setVoiceCaptions] = useState<boolean>(() => {
    return localStorage.getItem('aeirmist_voice_captions') === 'true';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<typeof REGION_FILTERS[number]>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeLang = ALL_LANGUAGES.find(l => l.code === selectedCode) || ALL_LANGUAGES[0];

  const handleSelectLanguage = (lang: LanguageItem) => {
    setSelectedCode(lang.code);
    localStorage.setItem('aeirmist_user_language', lang.code);
    setToastMessage(`Language updated to ${lang.name} (${lang.nativeName})`);

    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleToggle = (key: 'autoTranslate' | 'smartFormatting' | 'voiceCaptions') => {
    if (key === 'autoTranslate') {
      const next = !autoTranslate;
      setAutoTranslate(next);
      localStorage.setItem('aeirmist_auto_translate', String(next));
    } else if (key === 'smartFormatting') {
      const next = !smartFormatting;
      setSmartFormatting(next);
      localStorage.setItem('aeirmist_smart_formatting', String(next));
    } else if (key === 'voiceCaptions') {
      const next = !voiceCaptions;
      setVoiceCaptions(next);
      localStorage.setItem('aeirmist_voice_captions', String(next));
    }
  };

  // Filter languages
  const filteredLanguages = ALL_LANGUAGES.filter((lang) => {
    const matchesSearch = 
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.dialect.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'Popular') return Boolean(lang.popular);
    if (activeTab === 'Asia & Pacific') return lang.region === 'Asia & Pacific';
    if (activeTab === 'Europe') return lang.region === 'Europe';
    if (activeTab === 'Americas') return lang.region === 'Americas';
    if (activeTab === 'Middle East') return lang.region === 'Middle East';

    return true;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-12"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-neutral-900/90 border border-aeirmist-cyan/40 text-white shadow-2xl backdrop-blur-xl"
          >
            <CheckCircle2 size={18} className="text-aeirmist-cyan shrink-0" />
            <span className="text-xs font-semibold text-white/90">{toastMessage}</span>
            <button 
              onClick={() => setToastMessage(null)} 
              className="text-white/40 hover:text-white ml-2 cursor-pointer"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-3xl font-display font-bold text-white">Languages</h2>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-aeirmist-cyan/10 text-aeirmist-cyan border border-aeirmist-cyan/20">
            {ALL_LANGUAGES.length} Workable
          </span>
        </div>
        <p className="text-xs text-white/45 uppercase tracking-widest font-medium">Choose your preferred display language and translation options</p>
      </div>

      {/* Current Language Hero */}
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-gradient-to-r from-white/[0.03] via-white/[0.01] to-transparent border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-aeirmist-cyan/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-5 z-10">
          <div className="w-16 h-16 rounded-[1.5rem] bg-aeirmist-cyan/10 flex items-center justify-center text-aeirmist-cyan border border-aeirmist-cyan/20 group-hover:scale-105 transition-transform shadow-lg shadow-aeirmist-cyan/5">
            <span className="text-2xl font-bold font-mono">{activeLang.scriptChar}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Active System Language</span>
              {activeLang.isRTL && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                  RTL Mode
                </span>
              )}
            </div>
            <div className="text-2xl md:text-3xl font-display font-bold text-white flex items-center gap-3 mt-0.5">
              <span>{activeLang.name}</span>
              <span className="text-base text-aeirmist-cyan/80 font-normal">({activeLang.nativeName})</span>
            </div>
            <div className="text-xs text-white/40 mt-1 flex items-center gap-2">
              <Globe size={13} className="text-white/30" />
              <span>{activeLang.dialect}</span>
              <span className="text-white/20">•</span>
              <span className="font-mono text-[10px] text-white/30 uppercase">{activeLang.code}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-aeirmist-cyan/10 border border-aeirmist-cyan/30 z-10 shrink-0">
          <div className="w-2 h-2 rounded-full bg-aeirmist-cyan animate-pulse" />
          <span className="text-[10px] font-black text-aeirmist-cyan uppercase tracking-widest">Active</span>
        </div>
      </div>

      {/* Language Selection Grid & Filters */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/60 border border-white/10">
              <Languages size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Available Languages</h3>
              <p className="text-[11px] text-white/40">Select any language to apply across Aeirmist UI</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search language or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-aeirmist-cyan/50 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Region Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {REGION_FILTERS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-aeirmist-cyan/15 text-aeirmist-cyan border border-aeirmist-cyan/30 shadow-sm'
                    : 'bg-white/[0.02] text-white/50 border border-white/5 hover:bg-white/5 hover:text-white/80'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Grid List */}
        {filteredLanguages.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
            <Globe size={32} className="mx-auto text-white/20" />
            <p className="text-xs text-white/50">No languages found matching "{searchQuery}"</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveTab('All'); }}
              className="text-xs text-aeirmist-cyan underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredLanguages.map((lang) => {
              const isSelected = lang.code === selectedCode;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang)}
                  className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between group cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-r from-aeirmist-cyan/15 via-aeirmist-cyan/5 to-transparent border-aeirmist-cyan/40 shadow-lg shadow-aeirmist-cyan/5'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-aeirmist-cyan/20 text-aeirmist-cyan border border-aeirmist-cyan/30'
                        : 'bg-white/5 text-white/50 border border-white/10 group-hover:text-white/80 group-hover:bg-white/10'
                    }`}>
                      {lang.scriptChar}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{lang.name}</span>
                        {lang.popular && (
                          <Sparkles size={11} className="text-amber-400 shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] font-medium text-aeirmist-cyan/90 truncate mt-0.5">
                        {lang.nativeName}
                      </div>
                      <div className="text-[9px] text-white/35 font-mono truncate mt-0.5">
                        {lang.dialect}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-aeirmist-cyan/20 border border-aeirmist-cyan/40 flex items-center justify-center text-aeirmist-cyan">
                        <Check size={14} />
                      </div>
                    ) : (
                      <ArrowRight size={14} className="text-white/20 group-hover:text-white/60 transition-all group-hover:translate-x-1" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Translation & Formatting Preferences */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-aeirmist-magenta/10 flex items-center justify-center text-aeirmist-magenta border border-aeirmist-magenta/20">
            <Scan size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Translation Preferences</h3>
            <p className="text-[11px] text-white/40">AI-assisted translation and regional locale adaptations</p>
          </div>
        </div>

        <div className="p-6 md:p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6">
          {/* Auto Translate */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-white/70 border border-white/10 shrink-0">
                <MessageSquare size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Auto-Translate Chat Messages</h4>
                <p className="text-[10px] text-white/40 mt-0.5">Automatically translate incoming posts & chat messages to {activeLang.name}</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('autoTranslate')}
              className={`w-12 h-6 rounded-full relative transition-colors border cursor-pointer shrink-0 ${
                autoTranslate 
                  ? 'bg-aeirmist-magenta/30 border-aeirmist-magenta/50' 
                  : 'bg-white/10 border-white/10'
              }`}
            >
              <motion.div 
                layout
                className={`absolute top-0.5 w-4 h-4 rounded-full ${
                  autoTranslate ? 'right-1 bg-aeirmist-magenta' : 'left-1 bg-white/40'
                }`}
              />
            </button>
          </div>

          {/* Smart Formatting */}
          <div className="pt-5 border-t border-white/5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-white/70 border border-white/10 shrink-0">
                <Settings2 size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Smart Regional Formatting</h4>
                <p className="text-[10px] text-white/40 mt-0.5">Format numbers, dates, timestamps, and currency according to {activeLang.dialect}</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('smartFormatting')}
              className={`w-12 h-6 rounded-full relative transition-colors border cursor-pointer shrink-0 ${
                smartFormatting 
                  ? 'bg-aeirmist-cyan/30 border-aeirmist-cyan/50' 
                  : 'bg-white/10 border-white/10'
              }`}
            >
              <motion.div 
                layout
                className={`absolute top-0.5 w-4 h-4 rounded-full ${
                  smartFormatting ? 'right-1 bg-aeirmist-cyan' : 'left-1 bg-white/40'
                }`}
              />
            </button>
          </div>

          {/* Real-time Voice Captions */}
          <div className="pt-5 border-t border-white/5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-white/70 border border-white/10 shrink-0">
                <Mic size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Real-time Voice Captions</h4>
                <p className="text-[10px] text-white/40 mt-0.5">Generate translated live subtitles during audio/video calls</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('voiceCaptions')}
              className={`w-12 h-6 rounded-full relative transition-colors border cursor-pointer shrink-0 ${
                voiceCaptions 
                  ? 'bg-amber-500/30 border-amber-500/50' 
                  : 'bg-white/10 border-white/10'
              }`}
            >
              <motion.div 
                layout
                className={`absolute top-0.5 w-4 h-4 rounded-full ${
                  voiceCaptions ? 'right-1 bg-amber-400' : 'left-1 bg-white/40'
                }`}
              />
            </button>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default LanguagesSettings;
