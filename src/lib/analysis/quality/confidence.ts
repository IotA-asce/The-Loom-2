/**
 * Multi-factor confidence calibration
 * Calculates calibrated confidence from multiple quality indicators
 */

import { AnalysisStage } from '../prompts'

export interface ConfidenceFactors {
  extractionQuality: number      // 0-1: How well data was extracted
  validationScore: number        // 0-1: Schema validation result
  consistencyScore: number       // 0-1: Internal consistency
  completenessScore: number      // 0-1: Coverage of expected fields
  providerReliability: number    // 0-1: Based on provider track record
  retryCount: number             // Number of retries needed
}

export interface CalibratedConfidence {
  overall: number
  factors: ConfidenceFactors
  calibrationDetails: {
    rawScore: number
    adjustments: Array<{ reason: string; delta: number }>
    confidenceLevel: 'high' | 'medium' | 'low' | 'critical'
  }
}

/**
 * Default weights for confidence factors
 */
const DEFAULT_WEIGHTS = {
  extractionQuality: 0.25,
  validationScore: 0.25,
  consistencyScore: 0.2,
  completenessScore: 0.15,
  providerReliability: 0.15,
}

/**
 * Calculate calibrated confidence
 */
export function calibrateConfidence(
  factors: ConfidenceFactors,
  weights?: Partial<typeof DEFAULT_WEIGHTS>
): CalibratedConfidence {
  const w = { ...DEFAULT_WEIGHTS, ...weights }
  
  // Calculate base score
  const rawScore =
    factors.extractionQuality * w.extractionQuality +
    factors.validationScore * w.validationScore +
    factors.consistencyScore * w.consistencyScore +
    factors.completenessScore * w.completenessScore +
    factors.providerReliability * w.providerReliability
  
  const adjustments: Array<{ reason: string; delta: number }> = []
  let adjustedScore = rawScore
  
  // Apply retry penalty
  if (factors.retryCount > 0) {
    const retryPenalty = Math.min(0.3, factors.retryCount * 0.1)
    adjustedScore -= retryPenalty
    adjustments.push({ reason: `Required ${factors.retryCount} retries`, delta: -retryPenalty })
  }
  
  // Boost for perfect validation
  if (factors.validationScore === 1) {
    adjustedScore += 0.05
    adjustments.push({ reason: 'Perfect validation', delta: 0.05 })
  }
  
  // Ensure within bounds
  adjustedScore = Math.max(0, Math.min(1, adjustedScore))
  
  // Determine confidence level
  const confidenceLevel: CalibratedConfidence['calibrationDetails']['confidenceLevel'] =
    adjustedScore >= 0.8 ? 'high' :
    adjustedScore >= 0.6 ? 'medium' :
    adjustedScore >= 0.4 ? 'low' : 'critical'
  
  return {
    overall: Math.round(adjustedScore * 100) / 100,
    factors,
    calibrationDetails: {
      rawScore: Math.round(rawScore * 100) / 100,
      adjustments,
      confidenceLevel,
    },
  }
}

/**
 * Confidence calibrator for tracking and improving calibration
 */
export class ConfidenceCalibrator {
  private calibrationHistory: Array<{
    predicted: number
    actual: number // User feedback or validation result
    factors: ConfidenceFactors
  }> = []
  
  /**
   * Record calibration result
   */
  recordResult(predicted: number, actual: number, factors: ConfidenceFactors): void {
    this.calibrationHistory.push({ predicted, actual, factors })
    
    // Keep only recent history
    if (this.calibrationHistory.length > 100) {
      this.calibrationHistory.shift()
    }
  }
  
  /**
   * Calculate calibration error (ECE - Expected Calibration Error)
   */
  getCalibrationError(): number {
    if (this.calibrationHistory.length < 10) return 0
    
    // Bin by predicted confidence
    const bins: number[][] = Array.from({ length: 10 }, () => [])
    
    for (const record of this.calibrationHistory) {
      const binIndex = Math.min(9, Math.floor(record.predicted * 10))
      bins[binIndex].push(record.actual)
    }
    
    // Calculate weighted average of |predicted - actual|
    let totalError = 0
    let totalCount = 0
    
    for (let i = 0; i < bins.length; i++) {
      const bin = bins[i]
      if (bin.length === 0) continue
      
      const predicted = (i + 0.5) / 10
      const actual = bin.reduce((a, b) => a + b, 0) / bin.length
      
      totalError += Math.abs(predicted - actual) * bin.length
      totalCount += bin.length
    }
    
    return totalCount > 0 ? totalError / totalCount : 0
  }
  
  /**
   * Get recommended weights based on calibration history
   */
  getRecommendedWeights(): Partial<typeof DEFAULT_WEIGHTS> {
    // Analyze which factors best predict actual quality
    // This is a simplified version - real implementation would use correlation analysis
    
    if (this.calibrationHistory.length < 20) {
      return {}
    }
    
    // If validation score consistently matches actual, increase its weight
    const validationCorrelation = this.calculateCorrelation('validationScore')
    
    if (validationCorrelation > 0.8) {
      return { validationScore: 0.35 }
    }
    
    return {}
  }
  
  /**
   * Calculate correlation between factor and actual quality
   */
  private calculateCorrelation(factor: keyof ConfidenceFactors): number {
    // Simplified correlation calculation
    const n = this.calibrationHistory.length
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0
    
    for (const record of this.calibrationHistory) {
      const x = record.factors[factor] as number
      const y = record.actual
      
      sumX += x
      sumY += y
      sumXY += x * y
      sumX2 += x * x
      sumY2 += y * y
    }
    
    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
    
    return denominator === 0 ? 0 : numerator / denominator
  }
  
  /**
   * Check if confidence is well-calibrated
   */
  isWellCalibrated(threshold: number = 0.1): boolean {
    return this.getCalibrationError() < threshold
  }
}

/**
 * Stage-specific confidence requirements
 */
export const STAGE_CONFIDENCE_THRESHOLDS: Record<AnalysisStage, number> = {
  overview: 0.6,
  characters: 0.7,
  timeline: 0.6,
  relationships: 0.65,
  themes: 0.5,
}

/**
 * Check if confidence meets stage requirements
 */
export function meetsStageThreshold(
  stage: AnalysisStage,
  confidence: number
): boolean {
  return confidence >= STAGE_CONFIDENCE_THRESHOLDS[stage]
}
