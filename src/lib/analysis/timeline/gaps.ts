/**
 * Timeline gaps with estimation
 * Detects and estimates missing events between known events
 */

import { TimelineEvent } from '@/lib/db/schema'

export interface TimelineGap {
  startPage: number
  endPage: number
  duration: number // pages
  precedingEvent: TimelineEvent
  followingEvent: TimelineEvent
  estimatedEvents: EstimatedEvent[]
  confidence: number
}

export interface EstimatedEvent {
  estimatedPage: number
  type: 'travel' | 'transition' | 'timeskip' | 'unknown'
  description: string
  likelihood: number // 0-1
}

/**
 * Detect gaps in timeline
 */
export function detectGaps(
  events: TimelineEvent[],
  options?: { minGapSize?: number; maxGapSize?: number }
): TimelineGap[] {
  const minGapSize = options?.minGapSize ?? 10
  const maxGapSize = options?.maxGapSize ?? 100
  
  const sorted = [...events].sort((a, b) => a.pageNumber - b.pageNumber)
  const gaps: TimelineGap[] = []
  
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]
    
    const gap = next.pageNumber - current.pageNumber
    
    if (gap >= minGapSize && gap <= maxGapSize) {
      gaps.push({
        startPage: current.pageNumber,
        endPage: next.pageNumber,
        duration: gap,
        precedingEvent: current,
        followingEvent: next,
        estimatedEvents: estimateGapEvents(current, next, gap),
        confidence: estimateConfidence(current, next, gap),
      })
    }
  }
  
  return gaps
}

/**
 * Estimate what events might fill a gap
 */
function estimateGapEvents(
  from: TimelineEvent,
  to: TimelineEvent,
  gap: number
): EstimatedEvent[] {
  const estimated: EstimatedEvent[] = []
  
  // Check for character travel
  const sharedCharacters = from.characters.filter(c => to.characters.includes(c))
  const locationChange = !sharedCharacters.length || gap > 20
  
  if (locationChange) {
    estimated.push({
      estimatedPage: Math.floor((from.pageNumber + to.pageNumber) / 2),
      type: 'travel',
      description: 'Travel between locations',
      likelihood: 0.6,
    })
  }
  
  // Check for time skip
  if (gap > 30) {
    estimated.push({
      estimatedPage: from.pageNumber + Math.floor(gap * 0.3),
      type: 'timeskip',
      description: 'Time passes',
      likelihood: 0.7,
    })
  }
  
  // Check for narrative transition
  const text = `${from.description} ${to.description}`.toLowerCase()
  if (text.includes('later') || text.includes('meanwhile') || gap > 15) {
    estimated.push({
      estimatedPage: from.pageNumber + Math.floor(gap * 0.5),
      type: 'transition',
      description: 'Scene transition',
      likelihood: 0.5,
    })
  }
  
  return estimated
}

/**
 * Estimate confidence in gap detection
 */
function estimateConfidence(from: TimelineEvent, to: TimelineEvent, gap: number): number {
  let confidence = 0.5
  
  // Higher confidence for larger gaps
  confidence += Math.min(0.3, gap / 100)
  
  // Lower confidence if events are causally linked
  const text = `${from.title} ${to.title}`.toLowerCase()
  if (text.includes('then') || text.includes('next') || text.includes('after')) {
    confidence -= 0.2
  }
  
  // Higher confidence if character sets are different
  const sharedCharacters = from.characters.filter(c => to.characters.includes(c))
  if (sharedCharacters.length === 0) {
    confidence += 0.2
  }
  
  return Math.min(1, Math.max(0, confidence))
}

/**
 * Estimate missing time between events
 */
export function estimateTimeGap(
  from: TimelineEvent,
  to: TimelineEvent
): {
  estimatedDuration: string
  confidence: number
  indicators: string[]
} {
  const gap = to.pageNumber - from.pageNumber
  const indicators: string[] = []
  
  // Check for time indicators in text
  const text = `${from.description} ${to.description}`.toLowerCase()
  
  if (text.includes('morning') && text.includes('evening')) {
    indicators.push('Day cycle transition')
    return { estimatedDuration: 'hours', confidence: 0.7, indicators }
  }
  
  if (text.includes('next day') || gap < 20) {
    indicators.push('Short time gap')
    return { estimatedDuration: 'hours to days', confidence: 0.6, indicators }
  }
  
  if (text.includes('week') || gap < 40) {
    indicators.push('Week referenced')
    return { estimatedDuration: 'days to weeks', confidence: 0.5, indicators }
  }
  
  if (text.includes('month') || gap < 80) {
    indicators.push('Month referenced')
    return { estimatedDuration: 'weeks to months', confidence: 0.5, indicators }
  }
  
  if (text.includes('year') || gap >= 80) {
    indicators.push('Long narrative gap')
    return { estimatedDuration: 'months to years', confidence: 0.4, indicators }
  }
  
  // Default based on gap size
  if (gap < 10) {
    return { estimatedDuration: 'moments', confidence: 0.5, indicators: ['Small page gap'] }
  } else if (gap < 30) {
    return { estimatedDuration: 'hours to days', confidence: 0.4, indicators: ['Moderate page gap'] }
  } else {
    return { estimatedDuration: 'significant time', confidence: 0.3, indicators: ['Large page gap'] }
  }
}

/**
 * Gap analyzer
 */
export class GapAnalyzer {
  private gaps: TimelineGap[]
  private events: TimelineEvent[]
  
  constructor(events: TimelineEvent[]) {
    this.events = events
    this.gaps = detectGaps(events)
  }
  
  /**
   * Get all gaps
   */
  getGaps(): TimelineGap[] {
    return this.gaps
  }
  
  /**
   * Get gaps by size category
   */
  getGapsByCategory(): {
    small: TimelineGap[]   // 10-20 pages
    medium: TimelineGap[]  // 20-50 pages
    large: TimelineGap[]   // 50+ pages
  } {
    return {
      small: this.gaps.filter(g => g.duration < 20),
      medium: this.gaps.filter(g => g.duration >= 20 && g.duration < 50),
      large: this.gaps.filter(g => g.duration >= 50),
    }
  }
  
  /**
   * Get total gap coverage
   */
  getGapCoverage(): {
    totalPages: number
    coveredPages: number
    gapPages: number
    coverageRatio: number
  } {
    if (this.events.length === 0) {
      return { totalPages: 0, coveredPages: 0, gapPages: 0, coverageRatio: 0 }
    }
    
    const sorted = [...this.events].sort((a, b) => a.pageNumber - b.pageNumber)
    const firstPage = sorted[0].pageNumber
    const lastPage = sorted[sorted.length - 1].pageNumber
    const totalPages = lastPage - firstPage
    
    let gapPages = 0
    for (const gap of this.gaps) {
      gapPages += gap.duration
    }
    
    return {
      totalPages,
      coveredPages: totalPages - gapPages,
      gapPages,
      coverageRatio: totalPages > 0 ? (totalPages - gapPages) / totalPages : 0,
    }
  }
  
  /**
   * Identify potential missing events in gaps
   */
  identifyMissingEvents(): Array<{
    gap: TimelineGap
    suggestions: string[]
    priority: 'low' | 'medium' | 'high'
  }> {
    return this.gaps.map(gap => {
      const suggestions: string[] = []
      let priority: 'low' | 'medium' | 'high' = 'low'
      
      // Analyze what might be missing
      const fromChars = new Set(gap.precedingEvent.characters)
      const toChars = new Set(gap.followingEvent.characters)
      
      // New characters introduced
      const newChars = [...toChars].filter(c => !fromChars.has(c))
      if (newChars.length > 0) {
        suggestions.push(`${newChars.length} new character(s) introduced`)
        priority = 'medium'
      }
      
      // Character departure
      const departedChars = [...fromChars].filter(c => !toChars.has(c))
      if (departedChars.length > 0) {
        suggestions.push(`${departedChars.length} character(s) no longer present`)
      }
      
      // Significance jump
      const significanceLevels = ['minor', 'moderate', 'major', 'critical']
      const fromLevel = significanceLevels.indexOf(gap.precedingEvent.significance)
      const toLevel = significanceLevels.indexOf(gap.followingEvent.significance)
      
      if (toLevel > fromLevel + 1) {
        suggestions.push('Significant narrative escalation')
        priority = 'high'
      }
      
      // Large gap
      if (gap.duration > 50) {
        suggestions.push('Extended time period - check for major events')
        priority = 'high'
      }
      
      return { gap, suggestions, priority }
    })
  }
  
  /**
   * Generate fill suggestions for gaps
   */
  generateFillSuggestions(gap: TimelineGap): string[] {
    const suggestions: string[] = []
    
    if (gap.duration > 30) {
      suggestions.push('Consider adding a timeskip indicator')
      suggestions.push('Show character travel/montage')
    }
    
    if (gap.precedingEvent.significance === 'major' || 
        gap.precedingEvent.significance === 'critical') {
      suggestions.push('Add aftermath/reaction scene')
    }
    
    if (gap.followingEvent.significance === 'major' || 
        gap.followingEvent.significance === 'critical') {
      suggestions.push('Add buildup/foreshadowing scene')
    }
    
    const sharedChars = gap.precedingEvent.characters
      .filter(c => gap.followingEvent.characters.includes(c))
    
    if (sharedChars.length === 0) {
      suggestions.push('Explain how characters end up in new location')
    }
    
    return suggestions
  }
}
