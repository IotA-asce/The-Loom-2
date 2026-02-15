/**
 * Per-character confidence scores
 * Calculates and manages confidence for character analysis
 */

import { Character } from '@/lib/db/schema'

export interface ConfidenceFactors {
  namingClarity: number      // 0-1: How clearly the character is named
  visualDistinctiveness: number // 0-1: How visually unique
  descriptionDetail: number  // 0-1: Level of detail in description
  appearanceConsistency: number // 0-1: Consistency across appearances
  interactionFrequency: number // 0-1: How often they appear/interact
}

export interface CharacterConfidence {
  characterId: string
  overall: number // 0-1 weighted average
  factors: ConfidenceFactors
  batchScores: Map<number, number> // Per-batch confidence
  trend: 'improving' | 'stable' | 'declining'
}

/**
 * Confidence calculator for characters
 */
export class ConfidenceCalculator {
  private weights: ConfidenceFactors = {
    namingClarity: 0.2,
    visualDistinctiveness: 0.2,
    descriptionDetail: 0.25,
    appearanceConsistency: 0.2,
    interactionFrequency: 0.15,
  }
  
  /**
   * Calculate confidence for a character
   */
  calculate(character: Character, appearances: number = 1): CharacterConfidence {
    const factors = this.calculateFactors(character, appearances)
    
    // Weighted average
    const overall = 
      factors.namingClarity * this.weights.namingClarity +
      factors.visualDistinctiveness * this.weights.visualDistinctiveness +
      factors.descriptionDetail * this.weights.descriptionDetail +
      factors.appearanceConsistency * this.weights.appearanceConsistency +
      factors.interactionFrequency * this.weights.interactionFrequency
    
    return {
      characterId: character.id,
      overall: Math.round(overall * 100) / 100,
      factors,
      batchScores: new Map(),
      trend: 'stable',
    }
  }
  
  /**
   * Calculate individual factors
   */
  private calculateFactors(character: Character, appearances: number): ConfidenceFactors {
    // Naming clarity
    const namingClarity = this.scoreNamingClarity(character.name)
    
    // Visual distinctiveness (based on appearance description)
    const visualDistinctiveness = character.appearance 
      ? Math.min(1, character.appearance.length / 100)
      : 0.3
    
    // Description detail
    const descriptionDetail = Math.min(1, character.description.length / 200)
    
    // Appearance consistency (placeholder - would need multi-appearance data)
    const appearanceConsistency = appearances > 1 ? 0.8 : 0.5
    
    // Interaction frequency
    const interactionFrequency = Math.min(1, appearances / 5)
    
    return {
      namingClarity,
      visualDistinctiveness,
      descriptionDetail,
      appearanceConsistency,
      interactionFrequency,
    }
  }
  
  /**
   * Score naming clarity
   */
  private scoreNamingClarity(name: string): number {
    // Penalize descriptive/placeholder names
    const lower = name.toLowerCase()
    
    if (lower.includes('unknown') || lower.includes('unnamed')) return 0.2
    if (lower.includes('character') || lower.includes('figure')) return 0.4
    if (lower.includes('man') || lower.includes('woman') || lower.includes('boy') || lower.includes('girl')) {
      // Check if it has modifiers
      const words = name.split(' ')
      return words.length > 1 ? 0.5 : 0.3
    }
    
    // Named characters get high score
    return 0.9
  }
  
  /**
   * Update confidence with new batch data
   */
  updateConfidence(
    current: CharacterConfidence,
    newScore: number,
    batchIndex: number
  ): CharacterConfidence {
    const batchScores = new Map(current.batchScores)
    batchScores.set(batchIndex, newScore)
    
    // Calculate trend
    const scores = Array.from(batchScores.values())
    const trend = this.calculateTrend(scores)
    
    // Recalculate overall with new data
    const recentScores = scores.slice(-3)
    const recentAverage = recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    const overall = (current.overall * 0.7) + (recentAverage * 0.3)
    
    return {
      ...current,
      overall: Math.round(overall * 100) / 100,
      batchScores,
      trend,
    }
  }
  
  /**
   * Calculate trend from scores
   */
  private calculateTrend(scores: number[]): CharacterConfidence['trend'] {
    if (scores.length < 2) return 'stable'
    
    const first = scores[0]
    const last = scores[scores.length - 1]
    const change = last - first
    
    if (change > 0.1) return 'improving'
    if (change < -0.1) return 'declining'
    return 'stable'
  }
  
  /**
   * Set custom weights
   */
  setWeights(weights: Partial<ConfidenceFactors>): void {
    this.weights = { ...this.weights, ...weights }
  }
  
  /**
   * Get minimum acceptable confidence
   */
  static getMinimumConfidence(importance: Character['importance']): number {
    switch (importance) {
      case 'major': return 0.6
      case 'supporting': return 0.4
      case 'minor': return 0.2
      default: return 0.3
    }
  }
}

/**
 * Confidence threshold checker
 */
export class ConfidenceThresholdChecker {
  private thresholds: Map<string, number> = new Map()
  
  /**
   * Set threshold for character
   */
  setThreshold(characterId: string, threshold: number): void {
    this.thresholds.set(characterId, threshold)
  }
  
  /**
   * Check if character meets confidence threshold
   */
  meetsThreshold(confidence: CharacterConfidence): boolean {
    const threshold = this.thresholds.get(confidence.characterId) ?? 0.5
    return confidence.overall >= threshold
  }
  
  /**
   * Get characters needing review
   */
  getReviewNeeded(
    confidences: CharacterConfidence[]
  ): Array<{ confidence: CharacterConfidence; reason: string }> {
    const review: Array<{ confidence: CharacterConfidence; reason: string }> = []
    
    for (const conf of confidences) {
      if (!this.meetsThreshold(conf)) {
        review.push({
          confidence: conf,
          reason: `Confidence ${conf.overall} below threshold ${this.thresholds.get(conf.characterId) ?? 0.5}`,
        })
      } else if (conf.trend === 'declining') {
        review.push({
          confidence: conf,
          reason: 'Confidence trend is declining',
        })
      }
    }
    
    return review
  }
}

/**
 * Batch confidence aggregator
 */
export class BatchConfidenceAggregator {
  private batchConfidences = new Map<number, Map<string, number>>()
  
  /**
   * Add batch confidence data
   */
  addBatch(batchIndex: number, characterConfidences: Map<string, number>): void {
    this.batchConfidences.set(batchIndex, characterConfidences)
  }
  
  /**
   * Get aggregated confidence for character
   */
  getAggregatedConfidence(characterId: string): {
    average: number
    min: number
    max: number
    variance: number
  } {
    const scores: number[] = []
    
    for (const batchScores of this.batchConfidences.values()) {
      const score = batchScores.get(characterId)
      if (score !== undefined) {
        scores.push(score)
      }
    }
    
    if (scores.length === 0) {
      return { average: 0, min: 0, max: 0, variance: 0 }
    }
    
    const sum = scores.reduce((a, b) => a + b, 0)
    const average = sum / scores.length
    const min = Math.min(...scores)
    const max = Math.max(...scores)
    
    // Calculate variance
    const squaredDiffs = scores.map(s => Math.pow(s - average, 2))
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / scores.length
    
    return {
      average: Math.round(average * 100) / 100,
      min,
      max,
      variance: Math.round(variance * 100) / 100,
    }
  }
  
  /**
   * Get batch count for character
   */
  getBatchCount(characterId: string): number {
    let count = 0
    
    for (const batchScores of this.batchConfidences.values()) {
      if (batchScores.has(characterId)) {
        count++
      }
    }
    
    return count
  }
}
