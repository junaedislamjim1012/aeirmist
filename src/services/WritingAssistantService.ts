export type RefineMode = 
  | 'better_wording'
  | 'grammar'
  | 'spelling'
  | 'punctuation'
  | 'shorter'
  | 'longer'
  | 'caption'
  | 'hashtags'
  | 'product_title'
  | 'product_desc'
  | 'product_details'
  | 'price_format';

export interface WritingRefineResponse {
  result?: string;
  suggestions?: string[];
  missingInfo?: string[];
  recommendation?: string;
  formatted?: string;
  note?: string;
  rangeTip?: string;
}

export interface ModerateResponse {
  isSpam: boolean;
  isAbusive: boolean;
  reason?: string | null;
  suggestion?: string | null;
}

export interface TypoCheckResponse {
  suggestion: string | null;
}

export class WritingAssistantService {
  /**
   * Refine or enhance text for post creation, captions, hashtags, and marketplace.
   */
  async refineText(text: string, mode: RefineMode, context?: string): Promise<WritingRefineResponse> {
    try {
      const response = await fetch('/api/writing/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode, context })
      });

      if (!response.ok) {
        throw new Error(`Refine HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('[WritingAssistantService] Refine error, using local fallback:', error);
      // Fallback behavior
      if (mode === 'hashtags') {
        const words: string[] = text.toLowerCase().match(/\b[a-z0-9]+\b/g) || [];
        const autoTags = Array.from(new Set(words.filter(w => w.length > 3))).slice(0, 5).map(w => `#${w}`);
        return { suggestions: autoTags.length ? autoTags : ['#aeirmist', '#trending', '#vibes'] };
      }
      if (mode === 'caption') {
        return { suggestions: [text || 'Capturing moments today ✨', 'A quick update from my space.', 'Current mood & flow.'] };
      }
      return { result: text };
    }
  }

  /**
   * Moderate user text/comments for spam or abusive content before posting.
   */
  async moderateText(text: string): Promise<ModerateResponse> {
    try {
      const response = await fetch('/api/writing/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error(`Moderate HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('[WritingAssistantService] Moderate error:', error);
      return { isSpam: false, isAbusive: false, reason: null, suggestion: null };
    }
  }

  /**
   * Check search queries for spelling typos ("Did you mean...").
   */
  async checkTypo(query: string): Promise<string | null> {
    try {
      const response = await fetch('/api/writing/typo-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        return null;
      }

      const data: TypoCheckResponse = await response.json();
      return data.suggestion;
    } catch (error) {
      return null;
    }
  }
}

export const writingAssistant = new WritingAssistantService();
