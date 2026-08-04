import { CreatorTier, TIER_THRESHOLDS, POINT_REWARDS } from '../types/economy';

export { CreatorTier as AeirmistRank };

export const AEIRMIST_THRESHOLDS = TIER_THRESHOLDS.map(t => ({
  rank: t.tier,
  points: t.aeirmistPoints,
  color: t.color,
  bg: `${t.color}1a`, // 10% opacity hex
  glow: t.glow,
  emblem: t.emblem,
  benefits: t.benefits
}));

export function getRankInfo(points: number = 0) {
  return AEIRMIST_THRESHOLDS.find(t => points >= t.points) || AEIRMIST_THRESHOLDS[AEIRMIST_THRESHOLDS.length - 1];
}

export const REWARDS = {
  SCROLL_CHUNK: 2, // Every 1000px scrolled
  SCREEN_MINUTE: 10, // Per minute active
  POST_CREATED: POINT_REWARDS.POST_CREATED,
  MESSAGE: 15,
  LIKE_GIVEN: 5,
  FOLLOW_GIVEN: 25,
  SHARE_ACTION: 30,
  ...POINT_REWARDS
};
