/**
 * Overlap merge with gap detection
 * Merges batch results while detecting and handling gaps
 */

import { TimelineEvent, Character, Theme, Relationship } from '@/lib/db/schema'

export interface BatchResult {
  batchIndex: number
  startPage: number
  endPage: number
  characters: Character[]
  events: TimelineEvent[]
  themes: Theme[]
  relationships: Relationship[]
  confidence: number
}

export interface MergeGap {
  betweenBatches: [number, number]
  startPage: number
  endPage: number
  type: 'continuity' | 'transition' | 'unknown'
  estimatedContent?: string
}

export interface OverlapMergeResult {
  characters: Character[]
  events: TimelineEvent[]
  themes: Theme[]
  relationships: Relationship[]
  gaps: MergeGap[]
  overlapRegions: Array<{
    batches: [number, number]
    pages: [number, number]
    mergedEvents: number
  }>
  confidence: number
}

/**
 * Merge batch results with overlap handling
 */
export function mergeBatchResults(
  batches: BatchResult[]
): OverlapMergeResult {
  // Sort by page order
  const sorted = [...batches].sort((a, b) => a.startPage - b.startPage)
  
  // Detect gaps
  const gaps = detectGaps(sorted)
  
  // Merge each entity type
  const mergedCharacters = mergeCharacters(sorted.map(b => b.characters))
  const mergedEvents = mergeEventsWithOverlap(sorted)
  const mergedThemes = mergeThemes(sorted.map(b => b.themes))
  const mergedRelationships = mergeRelationships(sorted.map(b => b.relationships))
  
  // Identify overlap regions
  const overlapRegions = identifyOverlapRegions(sorted, mergedEvents)
  
  // Calculate overall confidence
  const avgConfidence = sorted.reduce((sum, b) => sum + b.confidence, 0) / sorted.length
  const gapPenalty = gaps.length * 0.05
  
  return {
    characters: mergedCharacters,
    events: mergedEvents,
    themes: mergedThemes,
    relationships: mergedRelationships,
    gaps,
    overlapRegions,
    confidence: Math.max(0, avgConfidence - gapPenalty),
  }
}

/**
 * Detect gaps between batches
 */
function detectGaps(batches: BatchResult[]): MergeGap[] {
  const gaps: MergeGap[] = []
  
  for (let i = 0; i < batches.length - 1; i++) {
    const current = batches[i]
    const next = batches[i + 1]
    
    if (current.endPage < next.startPage) {
      gaps.push({
        betweenBatches: [current.batchIndex, next.batchIndex],
        startPage: current.endPage,
        endPage: next.startPage,
        type: 'transition',
        estimatedContent: 'Scene transition or time skip',
      })
    }
  }
  
  return gaps
}

/**
 * Merge events with overlap handling
 */
function mergeEventsWithOverlap(batches: BatchResult[]): TimelineEvent[] {
  const allEvents: TimelineEvent[] = []
  const seen = new Map<string, TimelineEvent>()
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    const nextBatch = batches[i + 1]
    
    for (const event of batch.events) {
      // Check if this event is in overlap region
      if (nextBatch && event.pageNumber >= nextBatch.startPage) {
        // Look for duplicate in next batch
        const duplicate = nextBatch.events.find(e => isDuplicateEvent(e, event))
        
        if (duplicate) {
          // Merge and use higher confidence data
          const merged = mergeEvent(event, duplicate)
          seen.set(merged.id, merged)
        } else {
          seen.set(event.id, event)
        }
      } else {
        seen.set(event.id, event)
      }
    }
  }
  
  return Array.from(seen.values())
}

/**
 * Check if events are duplicates
 */
function isDuplicateEvent(a: TimelineEvent, b: TimelineEvent): boolean {
  const samePage = Math.abs(a.pageNumber - b.pageNumber) <= 2
  const titleMatch = similarity(a.title, b.title) > 0.8
  
  return samePage && titleMatch
}

/**
 * Merge two events
 */
function mergeEvent(a: TimelineEvent, b: TimelineEvent): TimelineEvent {
  return {
    ...a,
    description: a.description.length > b.description.length ? a.description : b.description,
    characters: [...new Set([...a.characters, ...b.characters])],
    significance: rankSignificance(a.significance) > rankSignificance(b.significance)
      ? a.significance
      : b.significance,
  }
}

/**
 * Calculate string similarity
 */
function similarity(a: string, b: string): number {
  const aWords = new Set(a.toLowerCase().split(/\s+/))
  const bWords = new Set(b.toLowerCase().split(/\s+/))
  
  const intersection = new Set([...aWords].filter(x => bWords.has(x)))
  const union = new Set([...aWords, ...bWords])
  
  return intersection.size / union.size
}

/**
 * Rank significance
 */
function rankSignificance(s: TimelineEvent['significance']): number {
  const ranks = { minor: 0, moderate: 1, major: 2, critical: 3 }
  return ranks[s]
}

/**
 * Merge characters across batches
 */
function mergeCharacters(batchCharacters: Character[][]): Character[] {
  const merged = new Map<string, Character>()
  
  for (const characters of batchCharacters) {
    for (const character of characters) {
      const existing = Array.from(merged.values()).find(c => 
        c.name.toLowerCase() === character.name.toLowerCase() ||
        c.aliases.some(a => character.aliases.includes(a))
      )
      
      if (existing) {
        merged.set(existing.id, mergeCharacter(existing, character))
      } else {
        merged.set(character.id, character)
      }
    }
  }
  
  return Array.from(merged.values())
}

/**
 * Merge two characters
 */
function mergeCharacter(a: Character, b: Character): Character {
  return {
    ...a,
    aliases: [...new Set([...a.aliases, ...b.aliases, b.name])],
    firstAppearance: Math.min(a.firstAppearance, b.firstAppearance),
    description: a.description.length > b.description.length 
      ? a.description 
      : `${a.description}\n${b.description}`,
  }
}

/**
 * Merge themes across batches
 */
function mergeThemes(batchThemes: Theme[][]): Theme[] {
  const merged = new Map<string, Theme>()
  
  for (const themes of batchThemes) {
    for (const theme of themes) {
      const existing = Array.from(merged.values()).find(t => 
        t.name.toLowerCase() === theme.name.toLowerCase()
      )
      
      if (existing) {
        merged.set(existing.id, {
          ...existing,
          prevalence: Math.max(existing.prevalence, theme.prevalence),
          keywords: [...new Set([...existing.keywords, ...theme.keywords])],
        })
      } else {
        merged.set(theme.id, theme)
      }
    }
  }
  
  return Array.from(merged.values())
}

/**
 * Merge relationships across batches
 */
function mergeRelationships(batchRelationships: Relationship[][]): Relationship[] {
  const merged = new Map<string, Relationship>()
  
  for (const relationships of batchRelationships) {
    for (const rel of relationships) {
      const key = [rel.characterA, rel.characterB].sort().join('-')
      const existing = merged.get(key)
      
      if (existing) {
        merged.set(key, {
          ...existing,
          evolution: [...existing.evolution, ...rel.evolution].sort(
            (a, b) => a.pageNumber - b.pageNumber
          ),
        })
      } else {
        merged.set(key, rel)
      }
    }
  }
  
  return Array.from(merged.values())
}

/**
 * Identify overlap regions
 */
function identifyOverlapRegions(
  batches: BatchResult[],
  mergedEvents: TimelineEvent[]
): OverlapMergeResult['overlapRegions'] {
  const regions: OverlapMergeResult['overlapRegions'] = []
  
  for (let i = 0; i < batches.length - 1; i++) {
    const current = batches[i]
    const next = batches[i + 1]
    
    if (current.endPage > next.startPage) {
      const overlapStart = next.startPage
      const overlapEnd = current.endPage
      
      const mergedInRegion = mergedEvents.filter(
        e => e.pageNumber >= overlapStart && e.pageNumber <= overlapEnd
      ).length
      
      regions.push({
        batches: [current.batchIndex, next.batchIndex],
        pages: [overlapStart, overlapEnd],
        mergedEvents: mergedInRegion,
      })
    }
  }
  
  return regions
}
