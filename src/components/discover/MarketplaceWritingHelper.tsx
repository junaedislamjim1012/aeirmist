import React, { useState } from 'react';
import { Sparkles, Wand2, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { writingAssistant } from '../../services/WritingAssistantService';

interface MarketplaceWritingHelperProps {
  prodName: string;
  prodDesc: string;
  prodPrice: string;
  category: string;
  onApplyTitle: (title: string) => void;
  onApplyDesc: (desc: string) => void;
  onApplyPrice: (price: string) => void;
}

export const MarketplaceWritingHelper: React.FC<MarketplaceWritingHelperProps> = ({
  prodName,
  prodDesc,
  prodPrice,
  category,
  onApplyTitle,
  onApplyDesc,
  onApplyPrice
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [titleOptions, setTitleOptions] = useState<string[]>([]);
  const [missingDetails, setMissingDetails] = useState<string[]>([]);
  const [priceTip, setPriceTip] = useState<string | null>(null);

  const handleEnhanceTitle = async () => {
    if (!prodName.trim()) return;
    setLoadingAction('title');
    try {
      const res = await writingAssistant.refineText(prodName, 'product_title', category);
      if (res.suggestions && res.suggestions.length) {
        setTitleOptions(res.suggestions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCleanDesc = async () => {
    if (!prodDesc.trim()) return;
    setLoadingAction('desc');
    try {
      const res = await writingAssistant.refineText(prodDesc, 'product_desc', `Product Title: ${prodName}`);
      if (res.result) {
        onApplyDesc(res.result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCheckDetails = async () => {
    setLoadingAction('details');
    try {
      const res = await writingAssistant.refineText(`${prodName}. ${prodDesc}`, 'product_details');
      if (res.missingInfo) {
        setMissingDetails(res.missingInfo);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleFormatPrice = async () => {
    if (!prodPrice.trim()) return;
    setLoadingAction('price');
    try {
      const res = await writingAssistant.refineText(prodPrice, 'price_format');
      if (res.formatted) {
        const cleanedNumeric = res.formatted.replace(/[^0-9.]/g, '');
        if (cleanedNumeric) {
          onApplyPrice(cleanedNumeric);
        }
      }
      if (res.rangeTip) {
        setPriceTip(res.rangeTip);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="bg-neutral-900/80 border border-cyan-500/20 rounded-2xl p-3 space-y-3">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <span className="text-[10px] font-black uppercase text-cyan-400 tracking-widest flex items-center gap-1.5">
          <Wand2 size={12} /> Listing Writing Assistance
        </span>
        <span className="text-[9px] text-zinc-500 font-mono">Enhance quality & details</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!prodName.trim() || loadingAction !== null}
          onClick={handleEnhanceTitle}
          className="px-2.5 py-1.5 bg-white/5 border border-white/10 hover:border-cyan-500/40 text-xs text-cyan-300 font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
        >
          <Sparkles size={11} />
          {loadingAction === 'title' ? 'Suggesting Titles...' : 'Title Options'}
        </button>

        <button
          type="button"
          disabled={!prodDesc.trim() || loadingAction !== null}
          onClick={handleCleanDesc}
          className="px-2.5 py-1.5 bg-white/5 border border-white/10 hover:border-cyan-500/40 text-xs text-cyan-300 font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
        >
          <Wand2 size={11} />
          {loadingAction === 'desc' ? 'Improving...' : 'Clean Description'}
        </button>

        <button
          type="button"
          disabled={loadingAction !== null}
          onClick={handleCheckDetails}
          className="px-2.5 py-1.5 bg-white/5 border border-white/10 hover:border-cyan-500/40 text-xs text-cyan-300 font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
        >
          <AlertCircle size={11} />
          {loadingAction === 'details' ? 'Scanning...' : 'Missing Details Check'}
        </button>

        <button
          type="button"
          disabled={!prodPrice.trim() || loadingAction !== null}
          onClick={handleFormatPrice}
          className="px-2.5 py-1.5 bg-white/5 border border-white/10 hover:border-cyan-500/40 text-xs text-cyan-300 font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
        >
          <CheckCircle2 size={11} />
          {loadingAction === 'price' ? 'Formatting...' : 'Price Formatting'}
        </button>
      </div>

      {/* Suggested Title Pills */}
      {titleOptions.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-400 block">Select title suggestion:</span>
          <div className="space-y-1">
            {titleOptions.map((title, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onApplyTitle(title);
                  setTitleOptions([]);
                }}
                className="w-full text-left p-2 bg-white/5 hover:bg-cyan-500/20 border border-white/10 rounded-lg text-xs font-medium text-white transition-all"
              >
                {title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Missing Details Checklist */}
      {missingDetails.length > 0 && (
        <div className="space-y-1.5 pt-1 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-amber-300 block">Suggested missing details to add to description:</span>
          <ul className="list-disc list-inside text-xs text-amber-100/90 space-y-0.5">
            {missingDetails.map((detail, idx) => (
              <li key={idx}>{detail}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Price Tip */}
      {priceTip && (
        <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl">
          💡 {priceTip}
        </div>
      )}
    </div>
  );
};
