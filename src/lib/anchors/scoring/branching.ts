/**
 * Branching potential algorithm
 */

import type { AnchorCandidate } from '../filtering/pool'
import type { AnchorAnalysis } from '../analysis/analyzer'

export interface BranchingScore {
  level: 'low' | 'moderate' | 'high'
  score: number
  factors: {
    alternativeCount: number
    consequenceDepth: number
    characterImpact: number
  }
}

const LEVELS = { low: 0.3, moderate: 0.6, high: 1.0 }

/**
 * Calculate branching potential score
 */
export function calculateBranchingPotential(
  candidate: AnchorCandidate,
  analysis: AnchorAnalysis
): BranchingScore {
  const altCount = analysis.branchPotential.alternatives.length
  const consequenceCount = analysis.branchPotential.consequences.length
  
  const factors = {
    alternativeCount: Math.min(altCount / 4, 1),
    consequenceDepth: Math.min(consequenceCount / 5, 1),
    characterImpact: candidate.characterInvolvement,
  }
  
  const score = (factors.alternativeCount * 0.4) + 
                (factors.consequenceDepth * 0.35) + 
                (factors.characterImpact * 0.25)
  
  const level: BranchingScore['level'] = score >= 0.7 ? 'high' : score >= 0.4 ? 'moderate' : 'low'
  
  return { level, score, factors }
}

/**
 * Calculate branchable moment density
 */
export function calculateBranchableDensity(
  anchors: { branching: BranchingScore }[],
  totalPages: number
): number {
  const highBranching = anchors.filter(a => a.branching.level === 'high').length
  return highBranching / totalPages
}
