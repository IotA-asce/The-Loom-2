/**
 * Quality multiplier calculation
 */

/**
 * Quality metrics interface (simplified)
 */
export interface QualityMetrics {
  confidence: number
  completeness: {
    overall: number
    characters: number
    timeline: number
    themes: number
  }
}

export interface MultiplierConfig {
  base: number
  qualityFactor: number
  confidenceThreshold: number
}

export const DEFAULT_MULTIPLIER_CONFIG: MultiplierConfig = {
  base: 1.0,
  qualityFactor: 0.3,
  confidenceThreshold: 0.6,
}

// Default quality metrics for when none provided
export const DEFAULT_QUALITY_METRICS: QualityMetrics = {
  confidence: 0.7,
  completeness: {
    overall: 0.7,
    characters: 0.7,
    timeline: 0.7,
    themes: 0.7,
  },
}

/**
 * Calculate quality multiplier for scores
 */
export function calculateQualityMultiplier(
  quality: QualityMetrics,
  config: Partial<MultiplierConfig> = {}
): number {
  const fullConfig = { ...DEFAULT_MULTIPLIER_CONFIG, ...config }
  
  const completeness = quality.completeness.overall
  const confidence = quality.confidence
  
  // Higher quality = higher multiplier
  const qualityBonus = (completeness + confidence) / 2 * fullConfig.qualityFactor
  
  return fullConfig.base + qualityBonus
}

/**
 * Apply multiplier to score
 */
export function applyMultiplier(score: number, multiplier: number): number {
  return Math.min(score * multiplier, 1.0)
}

/**
 * Check if quality meets threshold for inclusion
 */
export function meetsQualityThreshold(
  quality: QualityMetrics,
  threshold: number
): boolean {
  return quality.confidence >= threshold && quality.completeness.overall >= threshold * 0.8
}
