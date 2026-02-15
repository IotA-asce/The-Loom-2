/**
 * Narrative weight calculation
 */

import type { AnchorCandidate } from '../filtering/pool'
import type { AnchorAnalysis } from '../analysis/analyzer'

export interface NarrativeWeight {
  score: number
  components: {
    significance: number
    characterInvolvement: number
    causalImpact: number
    thematicRelevance: number
  }
}

const SIGNIFICANCE_WEIGHTS = { minor: 0.25, moderate: 0.5, major: 0.75, critical: 1.0 }

/**
 * Calculate narrative weight of an anchor
 */
export function calculateNarrativeWeight(
  candidate: AnchorCandidate,
  analysis: AnchorAnalysis
): NarrativeWeight {
  const significance = SIGNIFICANCE_WEIGHTS[candidate.event.significance] || 0.5
  
  const components = {
    significance,
    characterInvolvement: candidate.characterInvolvement,
    causalImpact: candidate.causalImpact,
    thematicRelevance: calculateThematicRelevance(candidate, analysis),
  }
  
  const score = (components.significance * 0.35) +
                (components.characterInvolvement * 0.25) +
                (components.causalImpact * 0.25) +
                (components.thematicRelevance * 0.15)
  
  return { score, components }
}

function calculateThematicRelevance(
  candidate: AnchorCandidate,
  analysis: AnchorAnalysis
): number {
  // Higher emotional impact = higher thematic relevance
  const emotionCount = analysis.emotionalImpact.primaryEmotions.length
  return Math.min(emotionCount / 3, 1)
}

/**
 * Check if narrative weight meets threshold
 */
export function meetsNarrativeThreshold(
  weight: NarrativeWeight,
  threshold: number
): boolean {
  return weight.score >= threshold
}
