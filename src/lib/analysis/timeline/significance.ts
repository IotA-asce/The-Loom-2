/**
 * Significance-based filtering and scoring
 * Determines and filters events by narrative importance
 */

import { TimelineEvent, SignificanceLevel } from '@/lib/db/schema'

export interface SignificanceFactors {
  characterImpact: number      // 0-1: How many/which characters affected
  plotAdvancement: number      // 0-1: How much story progresses
  emotionalWeight: number      // 0-1: Emotional impact on reader
  thematicImportance: number   // 0-1: Relevance to themes
  causalCriticality: number    // 0-1: How essential to later events
}

export interface ScoredEvent extends TimelineEvent {
  significanceScore: number
  factors: SignificanceFactors
}

/**
 * Calculate significance score from multiple factors
 */
export function calculateSignificanceScore(
  event: TimelineEvent,
  factors: Partial<SignificanceFactors> = {}
): ScoredEvent {
  // Default factor calculations
  const defaults: SignificanceFactors = {
    characterImpact: Math.min(1, event.characters.length / 3),
    plotAdvancement: getPlotAdvancementScore(event),
    emotionalWeight: getEmotionalWeightScore(event),
    thematicImportance: 0.5, // Would need theme data
    causalCriticality: 0.5,  // Would need causal graph
  }
  
  const merged = { ...defaults, ...factors }
  
  // Weighted average
  const weights = {
    characterImpact: 0.25,
    plotAdvancement: 0.25,
    emotionalWeight: 0.2,
    thematicImportance: 0.15,
    causalCriticality: 0.15,
  }
  
  const score = 
    merged.characterImpact * weights.characterImpact +
    merged.plotAdvancement * weights.plotAdvancement +
    merged.emotionalWeight * weights.emotionalWeight +
    merged.thematicImportance * weights.thematicImportance +
    merged.causalCriticality * weights.causalCriticality
  
  return {
    ...event,
    significanceScore: Math.round(score * 100) / 100,
    factors: merged,
  }
}

/**
 * Estimate plot advancement from event description
 */
function getPlotAdvancementScore(event: TimelineEvent): number {
  const text = `${event.title} ${event.description}`.toLowerCase()
  
  const advancementIndicators = [
    'decide', 'choose', 'discover', 'learn', 'defeat', 'win',
    'lose', 'escape', 'capture', 'rescue', 'betray', 'reveal',
    'defeat', 'victory', 'defeated', 'died', 'born', 'arrive',
    'depart', 'begin', 'end', 'start', 'finish',
  ]
  
  let score = 0
  for (const indicator of advancementIndicators) {
    if (text.includes(indicator)) {
      score += 0.2
    }
  }
  
  return Math.min(1, score)
}

/**
 * Estimate emotional weight from event description
 */
function getEmotionalWeightScore(event: TimelineEvent): number {
  const text = `${event.title} ${event.description}`.toLowerCase()
  
  const emotionalIndicators = [
    'death', 'die', 'kill', 'murder', 'love', 'hate', 'fear',
    'cry', 'tears', 'laugh', 'smile', 'sad', 'happy', 'angry',
    'revenge', 'forgive', 'betray', 'sacrifice', 'save', 'lose',
  ]
  
  let score = 0
  for (const indicator of emotionalIndicators) {
    if (text.includes(indicator)) {
      score += 0.2
    }
  }
  
  // Major character death is very significant
  if (text.includes('dies') || text.includes('death') || text.includes('killed')) {
    score += 0.3
  }
  
  return Math.min(1, score)
}

/**
 * Filter events by significance
 */
export function filterBySignificance(
  events: TimelineEvent[],
  minimumSignificance: SignificanceLevel,
  customScores?: Map<string, SignificanceFactors>
): TimelineEvent[] {
  const significanceOrder: SignificanceLevel[] = ['minor', 'moderate', 'major', 'critical']
  const minIndex = significanceOrder.indexOf(minimumSignificance)
  
  return events.filter(event => {
    const eventIndex = significanceOrder.indexOf(event.significance)
    
    // Check explicit significance
    if (eventIndex >= minIndex) return true
    
    // Check calculated score if available
    if (customScores?.has(event.id)) {
      const scored = calculateSignificanceScore(event, customScores.get(event.id))
      const scoreThreshold = minIndex / significanceOrder.length
      return scored.significanceScore >= scoreThreshold
    }
    
    return false
  })
}

/**
 * Get top N most significant events
 */
export function getTopEvents(
  events: TimelineEvent[],
  n: number,
  customScores?: Map<string, SignificanceFactors>
): ScoredEvent[] {
  const scored = events.map(event => 
    calculateSignificanceScore(event, customScores?.get(event.id))
  )
  
  return scored
    .sort((a, b) => b.significanceScore - a.significanceScore)
    .slice(0, n)
}

/**
 * Significance analyzer
 */
export class SignificanceAnalyzer {
  private events: ScoredEvent[]
  
  constructor(events: TimelineEvent[]) {
    this.events = events.map(e => calculateSignificanceScore(e))
  }
  
  /**
   * Get significance distribution
   */
  getDistribution(): {
    byLevel: Record<SignificanceLevel, number>
    byScoreRange: Record<string, number>
    averageScore: number
  } {
    const byLevel: Record<SignificanceLevel, number> = {
      minor: 0,
      moderate: 0,
      major: 0,
      critical: 0,
    }
    
    const byScoreRange: Record<string, number> = {
      '0.0-0.2': 0,
      '0.2-0.4': 0,
      '0.4-0.6': 0,
      '0.6-0.8': 0,
      '0.8-1.0': 0,
    }
    
    let totalScore = 0
    
    for (const event of this.events) {
      byLevel[event.significance]++
      totalScore += event.significanceScore
      
      const score = event.significanceScore
      if (score < 0.2) byScoreRange['0.0-0.2']++
      else if (score < 0.4) byScoreRange['0.2-0.4']++
      else if (score < 0.6) byScoreRange['0.4-0.6']++
      else if (score < 0.8) byScoreRange['0.6-0.8']++
      else byScoreRange['0.8-1.0']++
    }
    
    return {
      byLevel,
      byScoreRange,
      averageScore: this.events.length > 0 ? totalScore / this.events.length : 0,
    }
  }
  
  /**
   * Find pivotal events (high significance with high causal criticality)
   */
  findPivotalEvents(): ScoredEvent[] {
    return this.events
      .filter(e => e.significanceScore > 0.7 && e.factors.causalCriticality > 0.6)
      .sort((a, b) => b.significanceScore - a.significanceScore)
  }
  
  /**
   * Find turning points (significance jumps)
   */
  findTurningPoints(): Array<{
    event: ScoredEvent
    significanceJump: number
  }> {
    const sorted = [...this.events].sort((a, b) => a.pageNumber - b.pageNumber)
    const turningPoints: Array<{ event: ScoredEvent; significanceJump: number }> = []
    
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]
      const curr = sorted[i]
      const jump = curr.significanceScore - prev.significanceScore
      
      if (jump > 0.3) {
        turningPoints.push({ event: curr, significanceJump: jump })
      }
    }
    
    return turningPoints.sort((a, b) => b.significanceJump - a.significanceJump)
  }
  
  /**
   * Get event density by significance over time
   */
  getSignificanceDensity(pageRange: number = 10): Array<{
    pageStart: number
    pageEnd: number
    totalSignificance: number
    eventCount: number
    averageSignificance: number
  }> {
    if (this.events.length === 0) return []
    
    const sorted = [...this.events].sort((a, b) => a.pageNumber - b.pageNumber)
    const maxPage = sorted[sorted.length - 1].pageNumber
    
    const densities = []
    for (let start = 0; start <= maxPage; start += pageRange) {
      const end = start + pageRange
      const eventsInRange = sorted.filter(e => e.pageNumber >= start && e.pageNumber < end)
      
      const totalSignificance = eventsInRange.reduce((sum, e) => sum + e.significanceScore, 0)
      
      densities.push({
        pageStart: start,
        pageEnd: end,
        totalSignificance,
        eventCount: eventsInRange.length,
        averageSignificance: eventsInRange.length > 0 ? totalSignificance / eventsInRange.length : 0,
      })
    }
    
    return densities
  }
}

/**
 * Adaptive significance threshold based on story length
 */
export function getAdaptiveThreshold(
  eventCount: number,
  targetEventCount: number = 20
): number {
  // If we have fewer events than target, include more
  if (eventCount <= targetEventCount) return 0
  
  // Calculate threshold to get approximately target events
  return 1 - (targetEventCount / eventCount)
}
