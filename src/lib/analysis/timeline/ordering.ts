/**
 * Reading and chronological order
 * Manages both narrative and chronological event ordering
 */

import { TimelineEvent } from '@/lib/db/schema'

export interface OrderedTimeline {
  readingOrder: TimelineEvent[]
  chronologicalOrder: TimelineEvent[]
  flashbacks: TimelineEvent[]
  discrepancies: Array<{
    event: TimelineEvent
    readingPosition: number
    chronologicalPosition: number
    gap: number
  }>
}

export interface OrderMapping {
  eventId: string
  readingIndex: number
  chronologicalIndex: number
  isFlashback: boolean
  timeOffset?: number // Estimated time offset from reading position
}

/**
 * Order events by reading and chronological order
 */
export function orderEvents(events: TimelineEvent[]): OrderedTimeline {
  // Sort by reading order (page number)
  const readingOrder = [...events].sort((a, b) => a.pageNumber - b.pageNumber)
  
  // Sort by chronological order
  const chronologicalOrder = [...events].sort((a, b) => {
    // Use explicit chronological order if available
    if (a.chronologicalOrder !== undefined && b.chronologicalOrder !== undefined) {
      return a.chronologicalOrder - b.chronologicalOrder
    }
    
    // Flashbacks generally happen earlier
    if (a.isFlashback && !b.isFlashback) return -1
    if (!a.isFlashback && b.isFlashback) return 1
    
    // Default to reading order
    return a.pageNumber - b.pageNumber
  })
  
  // Identify flashbacks
  const flashbacks = events.filter(e => e.isFlashback)
  
  // Find discrepancies between orders
  const discrepancies = findDiscrepancies(readingOrder, chronologicalOrder)
  
  return {
    readingOrder,
    chronologicalOrder,
    flashbacks,
    discrepancies,
  }
}

/**
 * Find discrepancies between reading and chronological order
 */
function findDiscrepancies(
  readingOrder: TimelineEvent[],
  chronologicalOrder: TimelineEvent[]
): OrderedTimeline['discrepancies'] {
  const discrepancies: OrderedTimeline['discrepancies'] = []
  
  // Create position maps
  const readingPositions = new Map<string, number>()
  readingOrder.forEach((e, i) => readingPositions.set(e.id, i))
  
  const chronologicalPositions = new Map<string, number>()
  chronologicalOrder.forEach((e, i) => chronologicalPositions.set(e.id, i))
  
  // Find events with large position differences
  for (const event of readingOrder) {
    const readingPos = readingPositions.get(event.id)!
    const chronoPos = chronologicalPositions.get(event.id)!
    const gap = Math.abs(readingPos - chronoPos)
    
    // Flag if significant reordering
    if (gap > 2 && !event.isFlashback) {
      discrepancies.push({
        event,
        readingPosition: readingPos,
        chronologicalPosition: chronoPos,
        gap,
      })
    }
  }
  
  return discrepancies.sort((a, b) => b.gap - a.gap)
}

/**
 * Create order mapping for events
 */
export function createOrderMapping(events: TimelineEvent[]): OrderMapping[] {
  const ordered = orderEvents(events)
  const mappings: OrderMapping[] = []
  
  for (let i = 0; i < ordered.readingOrder.length; i++) {
    const event = ordered.readingOrder[i]
    const chronoIndex = ordered.chronologicalOrder.findIndex(e => e.id === event.id)
    
    mappings.push({
      eventId: event.id,
      readingIndex: i,
      chronologicalIndex: chronoIndex,
      isFlashback: event.isFlashback,
      timeOffset: chronoIndex - i,
    })
  }
  
  return mappings
}

/**
 * Get event at specific reading position
 */
export function getEventAtReadingPosition(
  events: TimelineEvent[],
  position: number
): TimelineEvent | undefined {
  const ordered = [...events].sort((a, b) => a.pageNumber - b.pageNumber)
  return ordered[position]
}

/**
 * Get event at specific chronological position
 */
export function getEventAtChronologicalPosition(
  events: TimelineEvent[],
  position: number
): TimelineEvent | undefined {
  const ordered = orderEvents(events).chronologicalOrder
  return ordered[position]
}

/**
 * Get surrounding events in reading order
 */
export function getSurroundingEvents(
  events: TimelineEvent[],
  eventId: string,
  radius: number = 2
): {
  previous: TimelineEvent[]
  current: TimelineEvent | undefined
  next: TimelineEvent[]
} {
  const ordered = [...events].sort((a, b) => a.pageNumber - b.pageNumber)
  const index = ordered.findIndex(e => e.id === eventId)
  
  if (index === -1) {
    return { previous: [], current: undefined, next: [] }
  }
  
  return {
    previous: ordered.slice(Math.max(0, index - radius), index),
    current: ordered[index],
    next: ordered.slice(index + 1, index + 1 + radius),
  }
}

/**
 * Timeline order analyzer
 */
export class TimelineOrderAnalyzer {
  private events: TimelineEvent[]
  private ordered: OrderedTimeline
  private mapping: OrderMapping[]
  
  constructor(events: TimelineEvent[]) {
    this.events = events
    this.ordered = orderEvents(events)
    this.mapping = createOrderMapping(events)
  }
  
  /**
   * Get narrative complexity score
   */
  getComplexityScore(): number {
    // Based on number of flashbacks and order discrepancies
    const flashbackRatio = this.ordered.flashbacks.length / this.events.length
    const discrepancyRatio = this.ordered.discrepancies.length / this.events.length
    
    return Math.min(1, flashbackRatio * 2 + discrepancyRatio)
  }
  
  /**
   * Get recommended viewing order for specific purpose
   */
  getRecommendedOrder(purpose: 'understanding' | 'chronology' | 'tension'): TimelineEvent[] {
    switch (purpose) {
      case 'understanding':
        // Default reading order is usually best for understanding
        return this.ordered.readingOrder
        
      case 'chronology':
        // Chronological order for timeline clarity
        return this.ordered.chronologicalOrder
        
      case 'tension':
        // Mix: start with hook, then chronological with flashbacks interspersed
        return this.optimizeForTension()
        
      default:
        return this.ordered.readingOrder
    }
  }
  
  /**
   * Optimize order for narrative tension
   */
  private optimizeForTension(): TimelineEvent[] {
    // Start with a major event, then proceed chronologically with strategic flashbacks
    const majorEvents = this.events.filter(e => 
      e.significance === 'major' || e.significance === 'critical'
    )
    
    if (majorEvents.length === 0) {
      return this.ordered.readingOrder
    }
    
    // Use first major event as hook
    const hook = majorEvents[0]
    const rest = this.ordered.chronologicalOrder.filter(e => e.id !== hook.id)
    
    return [hook, ...rest]
  }
  
  /**
   * Check if timeline is linear (no flashbacks/reordering)
   */
  isLinear(): boolean {
    return this.ordered.flashbacks.length === 0 && this.ordered.discrepancies.length === 0
  }
  
  /**
   * Get flashback density (flashbacks per page range)
   */
  getFlashbackDensity(): number {
    if (this.events.length === 0) return 0
    
    const pageSpan = Math.max(...this.events.map(e => e.pageNumber)) - 
                     Math.min(...this.events.map(e => e.pageNumber))
    
    return pageSpan > 0 ? this.ordered.flashbacks.length / pageSpan : 0
  }
}
