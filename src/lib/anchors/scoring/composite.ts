/**
 * Composite score calculation
 */

import type { AnchorCandidate } from '../filtering/pool'
import type { AnchorAnalysis } from '../analysis/analyzer'
import type { BranchingScore } from './branching'
import type { NarrativeWeight } from './narrative'
import type { RelevanceScore } from './relevance'
import type { QualityMetrics } from './multiplier'
import { calculateQualityMultiplier, applyMultiplier, DEFAULT_QUALITY_METRICS } from './multiplier'

export interface CompositeScore {
  raw: number
  weighted: number
  final: number
  components: {
    branching: number
    narrative: number
    relevance: number
  }
  tier: 'gold' | 'silver' | 'bronze'
}

export const TIER_THRESHOLDS = {
  gold: 0.85,
  silver: 0.70,
  bronze: 0.55,
}

export interface ScoreComponents {
  branching: BranchingScore
  narrative: NarrativeWeight
  relevance: RelevanceScore
}

/**
 * Calculate composite score from all components
 */
export function calculateCompositeScore(
  candidate: AnchorCandidate,
  analysis: AnchorAnalysis,
  components: ScoreComponents,
  quality?: QualityMetrics
): CompositeScore {
  const qualityMetrics = quality ?? DEFAULT_QUALITY_METRICS
  const rawComponents = {
    branching: components.branching.score,
    narrative: components.narrative.score,
    relevance: components.relevance.overall,
  }
  
  const raw = (rawComponents.branching * 0.4) +
              (rawComponents.narrative * 0.35) +
              (rawComponents.relevance * 0.25)
  
  const multiplier = calculateQualityMultiplier(qualityMetrics)
  const final = applyMultiplier(raw, multiplier)
  
  const tier: CompositeScore['tier'] = 
    final >= TIER_THRESHOLDS.gold ? 'gold' :
    final >= TIER_THRESHOLDS.silver ? 'silver' : 'bronze'
  
  return {
    raw,
    weighted: raw,
    final,
    components: rawComponents,
    tier,
  }
}
