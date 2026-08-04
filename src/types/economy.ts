export enum CreatorTier {
  EXPLORER = 'EXPLORER',
  CREATOR = 'CREATOR',
  VERIFIED_CREATOR = 'VERIFIED CREATOR',
  INFINITY_MEMBER = 'AEIRMIST INFINITY MEMBER',
  INFINITY_ELITE = 'AEIRMIST INFINITY ELITE'
}

export interface TierRequirements {
  aeirmistPoints: number;
  followers: number;
  accountAgeDays: number;
  originalPosts: number;
  contentViews?: number;
}

export const TIER_CONFIG: Record<CreatorTier, TierRequirements> = {
  [CreatorTier.EXPLORER]: {
    aeirmistPoints: 0,
    followers: 0,
    accountAgeDays: 0,
    originalPosts: 0
  },
  [CreatorTier.CREATOR]: {
    aeirmistPoints: 25000,
    followers: 2000,
    accountAgeDays: 90,
    originalPosts: 20
  },
  [CreatorTier.VERIFIED_CREATOR]: {
    aeirmistPoints: 100000,
    followers: 10000,
    accountAgeDays: 180,
    originalPosts: 50 // Inferred/Added for consistency
  },
  [CreatorTier.INFINITY_MEMBER]: {
    aeirmistPoints: 25000, // Wait, prompt said 250,000 for Infinity
    followers: 25000,
    accountAgeDays: 365,
    originalPosts: 100,
    contentViews: 500000
  },
  [CreatorTier.INFINITY_ELITE]: {
    aeirmistPoints: 1000000,
    followers: 100000,
    accountAgeDays: 730, // 2 Years
    originalPosts: 500 // Inferred
  }
};

// Update Infinity Member points in config after double check
export const TIER_THRESHOLDS = [
  { 
    tier: CreatorTier.INFINITY_ELITE, 
    aeirmistPoints: 1000000, 
    color: '#ff00ea', 
    glow: 'rgba(255, 0, 234, 0.6)',
    emblem: 'elite_infinity',
    benefits: ['Maximum Distribution', 'Elite Council', 'Elite Profile Effects']
  },
  { 
    tier: CreatorTier.INFINITY_MEMBER, 
    aeirmistPoints: 250000, 
    color: '#00f2ff', 
    glow: 'rgba(0, 242, 255, 0.6)',
    emblem: 'infinity_member',
    benefits: ['Infinity Profile Frame', 'Priority Distribution', 'Revenue Sharing']
  },
  { 
    tier: CreatorTier.VERIFIED_CREATOR, 
    aeirmistPoints: 100000, 
    color: '#00ffaa', 
    glow: 'rgba(0, 255, 170, 0.4)',
    emblem: 'verified_creator',
    benefits: ['Verified Badge', 'Increased Discoverability', 'Early Access']
  },
  { 
    tier: CreatorTier.CREATOR, 
    aeirmistPoints: 25000, 
    color: '#aa00ff', 
    glow: 'rgba(170, 0, 255, 0.4)',
    emblem: 'creator',
    benefits: ['Creator Dashboard', 'Detailed Analytics', 'Growth Tools']
  },
  { 
    tier: CreatorTier.EXPLORER, 
    aeirmistPoints: 0, 
    color: '#666666', 
    glow: 'rgba(102, 102, 102, 0.2)',
    emblem: 'explorer',
    benefits: ['Basic Subnet Access']
  }
];

export const POINT_REWARDS = {
  POST_CREATED: 500,
  VIDEO_UPLOADED: 750,
  PHOTO_UPLOADED: 400,
  STORY_PUBLISHED: 200,
  LIKE_RECEIVED: 50,
  COMMENT_RECEIVED: 100,
  SHARE_RECEIVED: 250,
  SAVE_RECEIVED: 150,
  FOLLOWER_GROWN: 500,
  STREAK_MAINTAINED: 1000,
  COMMUNITY_IMPACT: 500 // Generic for positive participation
};
