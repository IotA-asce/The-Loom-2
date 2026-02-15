/**
 * Deduplication for overlapping batches
 * Merges results from overlapping batch processing
 */

import { Character, TimelineEvent, Theme, Relationship } from '@/lib/db/schema'

export interface OverlapRegion {
  batchA: number
  batchB: number
  startPage: number
  endPage: number
  eventsA: TimelineEvent[]
  eventsB: TimelineEvent[]
}

export interface DeduplicationResult<T> {
  unique: T[]
  duplicates: Array<{ kept: T; removed: T; reason: string }>
  merged: T[]
  confidence: number
}

/**
 * Find overlap regions between batches
 */
export function findOverlapRegions(
  batchResults: Array<{
    batchIndex: number
    startPage: number
    endPage: number
    events: TimelineEvent[]
  }>
): OverlapRegion[] {
  const regions: OverlapRegion[] = []
  
  for (let i = 0; i < batchResults.length - 1; i++) {
    const current = batchResults[i]
    const next = batchResults[i + 1]
    
    // Check for overlap
    if (current.endPage > next.startPage) {
      regions.push({
        batchA: current.batchIndex,
        batchB: next.batchIndex,
        startPage: next.startPage,
        endPage: current.endPage,
        eventsA: current.events.filter(e => e.pageNumber >= next.startPage),
        eventsB: next.events.filter(e => e.pageNumber <= current.endPage),
      })
    }
  }
  
  return regions
}

/**
 * Deduplicate events in overlap regions
 */
export function deduplicateOverlapEvents(
  regions: OverlapRegion[]
): DeduplicationResult<TimelineEvent> {
  const unique = new Map<string, TimelineEvent>()
  const duplicates: DeduplicationResult<TimelineEvent>['duplicates'] = []
  const merged: TimelineEvent[] = []
  
  for (const region of regions) {
    for (const eventA of region.eventsA) {
      const match = findMatchingEvent(eventA, region.eventsB)
      
      if (match) {
        // Merge events
        const mergedEvent = mergeEvents(eventA, match)
        unique.set(mergedEvent.id, mergedEvent)
        merged.push(mergedEvent)
        
        duplicates.push({
          kept: mergedEvent,
          removed: eventA.id === mergedEvent.id ? match : eventA,
          reason: 'Duplicate in overlap region',
        })
      } else {
        unique.set(eventA.id, eventA)
      }
    }
    
    // Add unique events from B
    for (const eventB of region.eventsB) {
      if (!Array.from(unique.values()).some(e => isEventMatch(e, eventB))) {
        unique.set(eventB.id, eventB)
      }
    }
  }
  
  return {
    unique: Array.from(unique.values()),
    duplicates,
    merged,
    confidence: 1 - (duplicates.length * 0.1),
  }
}

/**
 * Find matching event
 */
function findMatchingEvent(
  event: TimelineEvent,
  candidates: TimelineEvent[]
): TimelineEvent | undefined {
  return candidates.find(candidate => isEventMatch(event, candidate))
}

/**
 * Check if two events match
 */
function isEventMatch(a: TimelineEvent, b: TimelineEvent): boolean {
  // Same page and similar title
  const samePage = Math.abs(a.pageNumber - b.pageNumber) <= 1
  const titleSimilarity = calculateSimilarity(a.title, b.title)
  const sharedChars = a.characters.filter(c => b.characters.includes(c)).length
  const charOverlap = sharedChars / Math.max(a.characters.length, b.characters.length)
  
  return samePage && titleSimilarity > 0.7 && charOverlap > 0.5
}

/**
 * Calculate string similarity
 */
function calculateSimilarity(a: string, b: string): number {
  const aWords = new Set(a.toLowerCase().split(/\s+/))
  const bWords = new Set(b.toLowerCase().split(/\s+/))
  
  const intersection = new Set([...aWords].filter(x => bWords.has(x)))
  const union = new Set([...aWords, ...bWords])
  
  return intersection.size / union.size
}

/**
 * Merge two events
 */
function mergeEvents(a: TimelineEvent, b: TimelineEvent): TimelineEvent {
  return {
    ...a,
    // Use longer/more detailed description
    description: a.description.length > b.description.length ? a.description : b.description,
    // Merge character lists
    characters: [...new Set([...a.characters, ...b.characters])],
    // Take higher significance
    significance: significanceOrder(a.significance) > significanceOrder(b.significance)
      ? a.significance
      : b.significance,
    // Either is flashback
    isFlashback: a.isFlashback || b.isFlashback,
  }
}

/**
 * Get significance order
 */
function significanceOrder(s: TimelineEvent['significance']): number {
  const order = ['minor', 'moderate', 'major', 'critical']
  return order.indexOf(s)
}

/**
 * Deduplicate characters across batches
 */
export function deduplicateOverlapCharacters(
  batchCharacters: Character[][]
): DeduplicationResult<Character> {
  const unique = new Map<string, Character>()
  const duplicates: DeduplicationResult<Character>['duplicates'] = []
  const merged: Character[] = []
  
  for (const characters of batchCharacters) {
    for (const character of characters) {
      const match = findMatchingCharacter(character, Array.from(unique.values()))
      
      if (match) {
        const mergedChar = mergeCharacters(character, match)
        unique.set(mergedChar.id, mergedChar)
        unique.delete(match.id)
        merged.push(mergedChar)
        
        duplicates.push({
          kept: mergedChar,
          removed: character.id === mergedChar.id ? match : character,
          reason: 'Duplicate character across batches',
        })
      } else {
        unique.set(character.id, character)
      }
    }
  }
  
  return {
    unique: Array.from(unique.values()),
    duplicates,
    merged,
    confidence: 1 - (duplicates.length * 0.05),
  }
}

/**
 * Find matching character
 */
function findMatchingCharacter(
  character: Character,
  candidates: Character[]
): Character | undefined {
  return candidates.find(c => 
    c.name.toLowerCase() === character.name.toLowerCase() ||
    c.aliases.some(a => character.aliases.includes(a)) ||
    character.aliases.some(a => a.toLowerCase() === c.name.toLowerCase())
  )
}

/**
 * Merge two characters
 */
function mergeCharacters(a: Character, b: Character): Character {
  return {
    ...a,
    // Combine aliases
    aliases: [...new Set([...a.aliases, ...b.aliases, b.name])],
    // Earlier first appearance
    firstAppearance: Math.min(a.firstAppearance, b.firstAppearance),
    // Merge descriptions
    description: a.description.length > b.description.length 
      ? a.description 
      : `${a.description}\n${b.description}`,
    // Higher importance
    importance: importanceOrder(a.importance) > importanceOrder(b.importance)
      ? a.importance
      : b.importance,
  }
}

/**
 * Get importance order
 */
function importanceOrder(i: Character['importance']): number {
  const order = ['minor', 'supporting', 'major']
  return order.indexOf(i)
}
