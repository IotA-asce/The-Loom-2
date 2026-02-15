/**
 * Anchor ranking engine
 */

import type { CompositeScore } from './composite'

export interface RankedAnchor {
  eventId: string
  score: CompositeScore
  rank: number
  percentile: number
}

/**
 * Rank anchors by composite score
 */
export function rankAnchors(
  anchors: { eventId: string; score: CompositeScore }[]
): RankedAnchor[] {
  const sorted = [...anchors].sort((a, b) => b.score.final - a.score.final)
  
  return sorted.map((anchor, index) => ({
    eventId: anchor.eventId,
    score: anchor.score,
    rank: index + 1,
    percentile: 1 - (index / sorted.length),
  }))
}

/**
 * Select top N anchors
 */
export function selectTopAnchors(
  ranked: RankedAnchor[],
  count: number,
  minTier?: 'gold' | 'silver' | 'bronze'
): RankedAnchor[] {
  let filtered = ranked
  
  if (minTier) {
    const tierOrder = { gold: 3, silver: 2, bronze: 1 }
    const minTierValue = tierOrder[minTier]
    filtered = ranked.filter(a => tierOrder[a.score.tier] >= minTierValue)
  }
  
  return filtered.slice(0, count)
}

/**
 * Get anchors by tier
 */
export function getAnchorsByTier(
  ranked: RankedAnchor[],
  tier: 'gold' | 'silver' | 'bronze'
): RankedAnchor[] {
  return ranked.filter(a => a.score.tier === tier)
}
