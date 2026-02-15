/**
 * Event extraction from analysis responses
 * Extracts and normalizes timeline events
 */

import { TimelineEvent } from '@/lib/db/schema'
import { ParsedTimelineEvent } from '../parser/validation'

export interface EventExtractionContext {
  batchIndex: number
  pageOffset: number
  chapterOffset?: number
}

export interface ExtractedEvent extends TimelineEvent {
  sourceBatch: number
  extractionConfidence: number
  isInferred: boolean
}

/**
 * Extract events from parsed data
 */
export function extractEvents(
  parsed: ParsedTimelineEvent[],
  context: EventExtractionContext
): ExtractedEvent[] {
  return parsed.map((parsedEvent, index) => {
    const pageNumber = parsedEvent.pageNumber + context.pageOffset
    
    return {
      id: parsedEvent.id || generateEventId(pageNumber, index),
      pageNumber,
      chapterNumber: parsedEvent.chapterNumber 
        ? parsedEvent.chapterNumber + (context.chapterOffset || 0)
        : undefined,
      title: parsedEvent.title,
      description: parsedEvent.description,
      characters: parsedEvent.characters,
      significance: parsedEvent.significance,
      isFlashback: parsedEvent.isFlashback ?? false,
      chronologicalOrder: parsedEvent.chronologicalOrder,
      sourceBatch: context.batchIndex,
      extractionConfidence: parsedEvent.confidence || 0.5,
      isInferred: false,
    }
  })
}

/**
 * Generate unique event ID
 */
function generateEventId(pageNumber: number, index: number): string {
  return `event-p${pageNumber}-i${index}-${Date.now().toString(36)}`
}

/**
 * Merge events from multiple batches
 */
export function mergeEvents(events: ExtractedEvent[]): Map<string, ExtractedEvent> {
  const merged = new Map<string, ExtractedEvent>()
  
  for (const event of events) {
    // Check for duplicate by content similarity
    const duplicate = findDuplicateEvent(event, merged)
    
    if (duplicate) {
      // Merge data, keeping higher confidence
      merged.set(duplicate.id, {
        ...duplicate,
        // Keep higher confidence description
        description: event.extractionConfidence > duplicate.extractionConfidence
          ? event.description
          : duplicate.description,
        // Merge characters
        characters: [...new Set([...duplicate.characters, ...event.characters])],
        // Update confidence
        extractionConfidence: Math.max(
          duplicate.extractionConfidence,
          event.extractionConfidence
        ),
      })
    } else {
      merged.set(event.id, event)
    }
  }
  
  return merged
}

/**
 * Find duplicate event by content similarity
 */
function findDuplicateEvent(
  event: ExtractedEvent,
  existing: Map<string, ExtractedEvent>
): ExtractedEvent | undefined {
  // Same page and similar title = duplicate
  for (const existingEvent of existing.values()) {
    const samePage = Math.abs(existingEvent.pageNumber - event.pageNumber) < 3
    const titleSim = calculateSimilarity(
      existingEvent.title.toLowerCase(),
      event.title.toLowerCase()
    )
    
    if (samePage && titleSim > 0.7) {
      return existingEvent
    }
  }
  
  return undefined
}

/**
 * Calculate string similarity
 */
function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1
  if (a.length === 0 || b.length === 0) return 0
  
  const aWords = new Set(a.split(/\s+/))
  const bWords = new Set(b.split(/\s+/))
  
  const intersection = new Set([...aWords].filter(x => bWords.has(x)))
  const union = new Set([...aWords, ...bWords])
  
  return intersection.size / union.size
}

/**
 * Infer events between known events
 */
export function inferIntermediateEvents(
  events: ExtractedEvent[],
  totalPages: number
): ExtractedEvent[] {
  const inferred: ExtractedEvent[] = []
  const sorted = [...events].sort((a, b) => a.pageNumber - b.pageNumber)
  
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]
    
    const pageGap = next.pageNumber - current.pageNumber
    
    // If large gap, infer travel/transition event
    if (pageGap > 20) {
      const inferredPage = Math.floor((current.pageNumber + next.pageNumber) / 2)
      inferred.push(createInferredEvent(
        inferredPage,
        'Time Passes',
        'Period of time passes between events',
        current.characters.filter(c => next.characters.includes(c)),
        'minor'
      ))
    }
  }
  
  return inferred
}

/**
 * Create inferred event
 */
function createInferredEvent(
  pageNumber: number,
  title: string,
  description: string,
  characters: string[],
  significance: TimelineEvent['significance']
): ExtractedEvent {
  return {
    id: `event-inferred-${pageNumber}-${Date.now()}`,
    pageNumber,
    title,
    description,
    characters,
    significance,
    isFlashback: false,
    sourceBatch: -1,
    extractionConfidence: 0.3,
    isInferred: true,
  }
}

/**
 * Event extraction statistics
 */
export interface EventStats {
  totalEvents: number
  bySignificance: Record<string, number>
  flashbackCount: number
  inferredCount: number
  averageConfidence: number
  pageCoverage: number // Percentage of pages with events
}

/**
 * Calculate extraction statistics
 */
export function calculateEventStats(
  events: ExtractedEvent[],
  totalPages: number
): EventStats {
  const bySignificance: Record<string, number> = {
    minor: 0,
    moderate: 0,
    major: 0,
    critical: 0,
  }
  
  let totalConfidence = 0
  let flashbackCount = 0
  let inferredCount = 0
  const pagesWithEvents = new Set<number>()
  
  for (const event of events) {
    bySignificance[event.significance]++
    totalConfidence += event.extractionConfidence
    
    if (event.isFlashback) flashbackCount++
    if (event.isInferred) inferredCount++
    
    pagesWithEvents.add(event.pageNumber)
  }
  
  return {
    totalEvents: events.length,
    bySignificance,
    flashbackCount,
    inferredCount,
    averageConfidence: events.length > 0 
      ? Math.round((totalConfidence / events.length) * 100) / 100 
      : 0,
    pageCoverage: Math.round((pagesWithEvents.size / totalPages) * 100) / 100,
  }
}
