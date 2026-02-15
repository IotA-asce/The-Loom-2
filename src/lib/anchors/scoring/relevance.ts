/**
 * Thematic relevance scoring
 */

import type { ParsedTheme } from '@/lib/analysis/parser/validation'
import type { AnchorAnalysis } from '../analysis/analyzer'

export interface RelevanceScore {
  thematic: number
  emotional: number
  genre: number
  overall: number
}

/**
 * Calculate thematic relevance score
 */
export function calculateThematicRelevance(
  analysis: AnchorAnalysis,
  themes: ParsedTheme[]
): RelevanceScore {
  // Thematic score based on theme connections
  const thematic = Math.min(analysis.branchPotential.alternatives.length / 4, 1) * 0.8 +
                   (themes.length > 0 ? 0.2 : 0)
  
  // Emotional score based on emotional impact
  const emotionalCount = analysis.emotionalImpact.primaryEmotions.length
  const emotional = Math.min(emotionalCount / 3, 1)
  
  // Genre score (placeholder - would use genre-specific metrics)
  const genre = 0.7
  
  return {
    thematic,
    emotional,
    genre,
    overall: (thematic * 0.5) + (emotional * 0.3) + (genre * 0.2),
  }
}

/**
 * Calculate character arc relevance
 */
export function calculateCharacterArcRelevance(
  analysis: AnchorAnalysis,
  characterImportance: Map<string, number>
): number {
  // Sum importance of characters involved
  let total = 0
  characterImportance.forEach(imp => {
    total += imp
  })
  return Math.min(total / 3, 1)
}
