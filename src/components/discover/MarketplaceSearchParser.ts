import { Product, Store, Service } from './MarketplaceTypes';

interface ParsedSearch {
  rawQuery: string;
  keywords: string[];
  category: string | null;
  maxPrice: number | null;
  minPrice: number | null;
  tags: string[];
  location: string | null;
  sortType: 'relevant' | 'price_low' | 'price_high' | 'newest';
}

/**
 * Heuristics-based client-side smart NLP query parser.
 * Supports statements like "gaming laptop under 140000 BDT" or "Fashion below 8000" or "stores in Banani"
 */
export function parseNaturalLanguageQuery(query: string, currencyRate: number): ParsedSearch {
  const clean = query.toLowerCase().trim();
  const result: ParsedSearch = {
    rawQuery: query,
    keywords: [],
    category: null,
    maxPrice: null,
    minPrice: null,
    tags: [],
    location: null,
    sortType: 'relevant'
  };

  // 1. Detect Price Boundaries
  // Looks for phrases like "under 1000", "below 500", "less than 200", "< 50", "max 1200"
  const maxPriceRegexes = [
    /(?:under|below|less\s+than|cheaper\s+than|max|maximum|budget)\s*(?:৳|\$|€|£)?\s*([0-9,.]+)/i,
    /<\s*([0-9,.]+)/
  ];
  for (const regex of maxPriceRegexes) {
    const match = clean.match(regex);
    if (match) {
      const numStr = match[1].replace(/,/g, '');
      const numVal = parseFloat(numStr);
      if (!isNaN(numVal)) {
        // Since input query numbers are in the current user currency, convert back to BDT
        result.maxPrice = numVal / currencyRate;
        break;
      }
    }
  }

  // Looks for phrases like "above 100", "over 50", "more than 20", "> 10", "min 200"
  const minPriceRegexes = [
    /(?:above|over|more\s+than|greater\s+than|min|minimum)\s*(?:৳|\$|€|£)?\s*([0-9,.]+)/i,
    />\s*([0-9,.]+)/
  ];
  for (const regex of minPriceRegexes) {
    const match = clean.match(regex);
    if (match) {
      const numStr = match[1].replace(/,/g, '');
      const numVal = parseFloat(numStr);
      if (!isNaN(numVal)) {
        result.minPrice = numVal / currencyRate;
        break;
      }
    }
  }

  // 2. Detect Locations
  // e.g. "in dhaka", "near mirpur", "around banani"
  const locationRegex = /(?:in|near|around|at|within)\s+([a-z0-9\s-]+)/i;
  const locMatch = clean.match(locationRegex);
  if (locMatch) {
    const locCandidate = locMatch[1].trim();
    if (['dhaka', 'chittagong', 'sylhet', 'gazipur', 'barishal', 'banani', 'mirpur'].some(l => locCandidate.includes(l))) {
      result.location = locCandidate;
    }
  }

  // 3. Category Detection mapping
  const categoryKeywords: Record<string, string[]> = {
    'Electronics': ['electronics', 'laptop', 'phone', 'iphone', 'gpu', 'graphics', 'hardware', 'mobile', 'gadget', 'charger'],
    'Fashion': ['fashion', 'clothing', 'coat', 'trenchcoat', 'wear', 'tshirt', 'shirt', 'pants', 'dress', 'apparel', 'outerwear'],
    'Beauty': ['beauty', 'cosmetics', 'perfume', 'skin', 'health', 'makeup', 'fragrance'],
    'Food': ['food', 'grocery', 'groceries', 'pizza', 'burger', 'snacks', 'eat'],
    'Furniture': ['furniture', 'sofa', 'chair', 'table', 'bed', 'desk', 'decor'],
    'Services': ['services', 'design', 'maintenance', 'repair', 'freelancer', 'architect', 'developer', 'service']
  };

  for (const [catName, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => clean.includes(kw))) {
      result.category = catName;
      break;
    }
  }

  // 4. Sort type triggers
  if (clean.includes('cheapest') || clean.includes('low price') || clean.includes('price low')) {
    result.sortType = 'price_low';
  } else if (clean.includes('expensive') || clean.includes('premium') || clean.includes('price high')) {
    result.sortType = 'price_high';
  } else if (clean.includes('new') || clean.includes('latest') || clean.includes('recent')) {
    result.sortType = 'newest';
  }

  // 5. Gather raw remaining keywords
  // Filter out stop words and price descriptors
  let queryWithoutPriceAndLocation = clean
    .replace(/(?:under|below|less\s+than|cheaper\s+than|max|maximum|budget|above|over|more\s+than|greater\s+than|min|minimum)\s*(?:৳|\$|€|£)?\s*[0-9,.]+/g, '')
    .replace(/(?:in|near|around|at|within)\s+[a-z0-9\s-]+/g, '')
    .replace(/[<>]/g, '');

  const stopWords = ['a', 'an', 'the', 'for', 'with', 'and', 'or', 'of', 'to', 'find', 'search', 'get', 'show', 'me'];
  const words = queryWithoutPriceAndLocation.split(/\s+/).map(w => w.trim()).filter(Boolean);
  
  result.keywords = words.filter(w => !stopWords.includes(w));

  return result;
}

/**
 * Filter product listings based on a parsed search configuration
 */
export function filterProductsByNlp(
  products: Product[],
  parsed: ParsedSearch,
  selectedLocation: string
): Product[] {
  let list = [...products];

  // 1. Keyword search (names, descriptions, tags)
  if (parsed.keywords.length > 0) {
    list = list.filter(p => {
      const text = `${p.name} ${p.description} ${(p.tags || []).join(' ')}`.toLowerCase();
      return parsed.keywords.every(kw => text.includes(kw));
    });
  }

  // 2. Category matching
  if (parsed.category) {
    list = list.filter(p => p.category === parsed.category);
  }

  // 3. Price range matching (comparing in raw BDT amounts)
  if (parsed.maxPrice !== null) {
    list = list.filter(p => {
      const price = p.discountPrice || p.price;
      return price <= (parsed.maxPrice as number);
    });
  }
  if (parsed.minPrice !== null) {
    list = list.filter(p => {
      const price = p.discountPrice || p.price;
      return price >= (parsed.minPrice as number);
    });
  }

  // 4. Sort execution
  if (parsed.sortType === 'price_low') {
    list.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
  } else if (parsed.sortType === 'price_high') {
    list.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
  } else if (parsed.sortType === 'newest') {
    list.sort((a, b) => {
      const tA = a.createdAt?.seconds || 0;
      const tB = b.createdAt?.seconds || 0;
      return tB - tA;
    });
  }

  return list;
}
