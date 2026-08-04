import React, { useState } from 'react';
import { 
  Sparkles, Check, RefreshCw, Type, AlignLeft, Scissors, Maximize2, 
  Hash, MessageSquare, ChevronDown, Wand2
} from 'lucide-react';
import { writingAssistant, RefineMode } from '../../services/WritingAssistantService';

interface WritingToolsMenuProps {
  currentText: string;
  onApplyText: (newText: string) => void;
  onAppendText?: (textToAppend: string) => void;
  contextHint?: string;
  className?: string;
}

export const WritingToolsMenu: React.FC<WritingToolsMenuProps> = ({
  currentText,
  onApplyText,
  onAppendText,
  contextHint,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingMode, setLoadingMode] = useState<RefineMode | null>(null);
  const [captionSuggestions, setCaptionSuggestions] = useState<string[]>([]);
  const [hashtagSuggestions, setHashtagSuggestions] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleRefine = async (mode: RefineMode) => {
    setLoadingMode(mode);
    setStatusMessage(null);
    try {
      const res = await writingAssistant.refineText(currentText, mode, contextHint);
      
      if (mode === 'caption' && res.suggestions) {
        setCaptionSuggestions(res.suggestions);
        setStatusMessage('Select a suggested caption below:');
      } else if (mode === 'hashtags' && res.suggestions) {
        setHashtagSuggestions(res.suggestions);
        setStatusMessage('Select hashtags to add to your post:');
      } else if (res.result) {
        onApplyText(res.result);
        setStatusMessage('Text refined successfully.');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (e) {
      console.error('Refinement failed:', e);
      setStatusMessage('Unable to refine text at this moment.');
    } finally {
      setLoadingMode(null);
    }
  };

  const applyHashtag = (tag: string) => {
    if (onAppendText) {
      onAppendText(` ${tag}`);
    } else {
      onApplyText(`${currentText} ${tag}`.trim());
    }
  };

  const applyAllHashtags = () => {
    const allTags = hashtagSuggestions.join(' ');
    if (onAppendText) {
      onAppendText(`\n\n${allTags}`);
    } else {
      onApplyText(`${currentText}\n\n${allTags}`.trim());
    }
    setHashtagSuggestions([]);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 min-h-[36px] bg-white/5 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 text-cyan-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-950/20"
        title="Writing Enhancements"
      >
        <Wand2 size={13} className="text-cyan-400" />
        <span>Refine Text</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[#090d16] border border-cyan-500/30 rounded-2xl shadow-2xl p-3 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1">
              <Type size={11} /> Writing Enhancements
            </span>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-white/40 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1">
            {/* Quick Actions */}
            <button
              disabled={loadingMode !== null || !currentText.trim()}
              onClick={() => handleRefine('better_wording')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/90 hover:bg-cyan-500/10 hover:text-cyan-300 flex items-center justify-between disabled:opacity-40 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={12} className="text-cyan-400" /> Better Wording
              </span>
              {loadingMode === 'better_wording' && <RefreshCw size={12} className="animate-spin text-cyan-400" />}
            </button>

            <button
              disabled={loadingMode !== null || !currentText.trim()}
              onClick={() => handleRefine('grammar')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/90 hover:bg-cyan-500/10 hover:text-cyan-300 flex items-center justify-between disabled:opacity-40 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Check size={12} className="text-emerald-400" /> Grammar Check
              </span>
              {loadingMode === 'grammar' && <RefreshCw size={12} className="animate-spin text-cyan-400" />}
            </button>

            <button
              disabled={loadingMode !== null || !currentText.trim()}
              onClick={() => handleRefine('spelling')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/90 hover:bg-cyan-500/10 hover:text-cyan-300 flex items-center justify-between disabled:opacity-40 transition-colors"
            >
              <span className="flex items-center gap-2">
                <AlignLeft size={12} className="text-blue-400" /> Spelling Correction
              </span>
              {loadingMode === 'spelling' && <RefreshCw size={12} className="animate-spin text-cyan-400" />}
            </button>

            <button
              disabled={loadingMode !== null || !currentText.trim()}
              onClick={() => handleRefine('punctuation')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/90 hover:bg-cyan-500/10 hover:text-cyan-300 flex items-center justify-between disabled:opacity-40 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Type size={12} className="text-purple-400" /> Punctuation & Formatting
              </span>
              {loadingMode === 'punctuation' && <RefreshCw size={12} className="animate-spin text-cyan-400" />}
            </button>

            <div className="my-1 border-t border-white/5" />

            <button
              disabled={loadingMode !== null || !currentText.trim()}
              onClick={() => handleRefine('shorter')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/90 hover:bg-cyan-500/10 hover:text-cyan-300 flex items-center justify-between disabled:opacity-40 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Scissors size={12} className="text-amber-400" /> Make Shorter
              </span>
              {loadingMode === 'shorter' && <RefreshCw size={12} className="animate-spin text-cyan-400" />}
            </button>

            <button
              disabled={loadingMode !== null || !currentText.trim()}
              onClick={() => handleRefine('longer')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/90 hover:bg-cyan-500/10 hover:text-cyan-300 flex items-center justify-between disabled:opacity-40 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Maximize2 size={12} className="text-fuchsia-400" /> Make Longer
              </span>
              {loadingMode === 'longer' && <RefreshCw size={12} className="animate-spin text-cyan-400" />}
            </button>

            <div className="my-1 border-t border-white/5" />

            <button
              disabled={loadingMode !== null}
              onClick={() => handleRefine('caption')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/90 hover:bg-cyan-500/10 hover:text-cyan-300 flex items-center justify-between disabled:opacity-40 transition-colors"
            >
              <span className="flex items-center gap-2">
                <MessageSquare size={12} className="text-pink-400" /> Suggested Captions
              </span>
              {loadingMode === 'caption' && <RefreshCw size={12} className="animate-spin text-cyan-400" />}
            </button>

            <button
              disabled={loadingMode !== null}
              onClick={() => handleRefine('hashtags')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/90 hover:bg-cyan-500/10 hover:text-cyan-300 flex items-center justify-between disabled:opacity-40 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Hash size={12} className="text-teal-400" /> Recommend Hashtags
              </span>
              {loadingMode === 'hashtags' && <RefreshCw size={12} className="animate-spin text-cyan-400" />}
            </button>
          </div>

          {statusMessage && (
            <div className="mt-2 text-[10px] text-cyan-300/80 bg-cyan-950/40 p-1.5 rounded-lg border border-cyan-500/20">
              {statusMessage}
            </div>
          )}

          {/* Caption Suggestions List */}
          {captionSuggestions.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/10 space-y-1.5 max-h-48 overflow-y-auto">
              <span className="text-[9px] uppercase tracking-wider font-bold text-white/50 block">Caption Options:</span>
              {captionSuggestions.map((c, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onApplyText(c);
                    setCaptionSuggestions([]);
                    setIsOpen(false);
                  }}
                  className="p-2 bg-white/5 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/40 rounded-lg text-xs text-white/90 cursor-pointer transition-all line-clamp-3"
                >
                  "{c}"
                </div>
              ))}
            </div>
          )}

          {/* Hashtag Suggestions List */}
          {hashtagSuggestions.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/10 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase tracking-wider font-bold text-white/50">Suggested Hashtags (5-8):</span>
                <button
                  onClick={applyAllHashtags}
                  className="text-[10px] text-cyan-400 font-bold hover:underline"
                >
                  Add All
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {hashtagSuggestions.map((tag, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyHashtag(tag)}
                    className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold rounded-md hover:bg-cyan-500/30 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
