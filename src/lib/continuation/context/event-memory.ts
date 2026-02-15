/**
 * Event-based memory derivation
 */

import type { Chapter } from '@/lib/db/schema'

export interface EventMemory {
  id: string
  timestamp: number
  description: string
  participants: string[]
  location: string
  significance: 'minor' | 'moderate' | 'major' | 'critical'
  emotionalImpact: string
  consequences: string[]
  references: string[] // IDs of other related events
}

export interface MemoryIndex {
  events: Map<string, EventMemory>
  byCharacter: Map<string, string[]> // characterId -> eventIds
  byLocation: Map<string, string[]> // location -> eventIds
  byChapter: Map<string, string[]> // chapterId -> eventIds
  timeline: TimelineEntry[]
}

export interface TimelineEntry {
  order: number
  chapterId: string
  eventIds: string[]
}

/**
 * Derive event memories from chapters
 */
export function deriveEventMemories(chapters: Chapter[]): MemoryIndex {
  const events = new Map<string, EventMemory>()
  const byCharacter = new Map<string, string[]>()
  const byLocation = new Map<string, string[]>()
  const byChapter = new Map<string, string[]>()
  const timeline: TimelineEntry[] = []
  
  for (const chapter of chapters) {
    const chapterEventIds: string[] = []
    
    for (const scene of chapter.scenes) {
      const eventId = `event-${chapter.id}-${scene.id || Math.random().toString(36).substr(2, 9)}`
      
      const memory: EventMemory = {
        id: eventId,
        timestamp: chapter.createdAt,
        description: scene.summary,
        participants: scene.characters,
        location: scene.setting,
        significance: deriveSignificance(scene),
        emotionalImpact: scene.emotionalArc,
        consequences: [],
        references: [],
      }
      
      events.set(eventId, memory)
      chapterEventIds.push(eventId)
      
      // Index by character
      for (const characterId of scene.characters) {
        const existing = byCharacter.get(characterId) || []
        existing.push(eventId)
        byCharacter.set(characterId, existing)
      }
      
      // Index by location
      if (scene.setting) {
        const existing = byLocation.get(scene.setting) || []
        existing.push(eventId)
        byLocation.set(scene.setting, existing)
      }
    }
    
    byChapter.set(chapter.id!, chapterEventIds)
    timeline.push({
      order: chapter.order,
      chapterId: chapter.id!,
      eventIds: chapterEventIds,
    })
  }
  
  // Find references between events
  findEventReferences(events)
  
  return {
    events,
    byCharacter,
    byLocation,
    byChapter,
    timeline,
  }
}

function deriveSignificance(scene: {
  summary: string
  emotionalArc: string
}): EventMemory['significance'] {
  const summary = scene.summary.toLowerCase()
  const emotionalArc = scene.emotionalArc.toLowerCase()
  
  const criticalIndicators = ['death', 'kill', 'betray', 'reveal secret', 'transform']
  const majorIndicators = ['decide', 'discover', 'confront', 'sacrifice']
  const moderateIndicators = ['argue', 'agree', 'plan', 'prepare']
  
  for (const indicator of criticalIndicators) {
    if (summary.includes(indicator)) return 'critical'
  }
  
  for (const indicator of majorIndicators) {
    if (summary.includes(indicator)) return 'major'
  }
  
  for (const indicator of moderateIndicators) {
    if (summary.includes(indicator)) return 'moderate'
  }
  
  // Check emotional intensity
  if (emotionalArc.includes('intense') || emotionalArc.includes('climax')) {
    return 'major'
  }
  
  return 'minor'
}

function findEventReferences(events: Map<string, EventMemory>): void {
  const eventList = Array.from(events.values())
  
  for (let i = 0; i < eventList.length; i++) {
    const eventA = eventList[i]
    
    for (let j = i + 1; j < eventList.length; j++) {
      const eventB = eventList[j]
      
      // Check for shared participants
      const sharedParticipants = eventA.participants.filter(p => 
        eventB.participants.includes(p)
      )
      
      if (sharedParticipants.length > 0) {
        // These events are related through characters
        if (!eventA.references.includes(eventB.id)) {
          eventA.references.push(eventB.id)
        }
        if (!eventB.references.includes(eventA.id)) {
          eventB.references.push(eventA.id)
        }
      }
      
      // Check for same location
      if (eventA.location && eventA.location === eventB.location) {
        if (!eventA.references.includes(eventB.id)) {
          eventA.references.push(eventB.id)
        }
        if (!eventB.references.includes(eventA.id)) {
          eventB.references.push(eventA.id)
        }
      }
    }
  }
}

/**
 * Get events for a character
 */
export function getCharacterEvents(
  index: MemoryIndex,
  characterId: string
): EventMemory[] {
  const eventIds = index.byCharacter.get(characterId) || []
  return eventIds.map(id => index.events.get(id)!).filter(Boolean)
}

/**
 * Get events at a location
 */
export function getLocationEvents(
  index: MemoryIndex,
  location: string
): EventMemory[] {
  const eventIds = index.byLocation.get(location) || []
  return eventIds.map(id => index.events.get(id)!).filter(Boolean)
}

/**
 * Get related events
 */
export function getRelatedEvents(
  index: MemoryIndex,
  eventId: string
): EventMemory[] {
  const event = index.events.get(eventId)
  if (!event) return []
  
  return event.references.map(id => index.events.get(id)!).filter(Boolean)
}

/**
 * Get timeline for chapter range
 */
export function getTimelineRange(
  index: MemoryIndex,
  startChapter: number,
  endChapter: number
): TimelineEntry[] {
  return index.timeline.filter(t => 
    t.order >= startChapter && t.order <= endChapter
  )
}

/**
 * Find significant events
 */
export function findSignificantEvents(
  index: MemoryIndex,
  minSignificance: EventMemory['significance'] = 'major'
): EventMemory[] {
  const significanceOrder: EventMemory['significance'][] = ['minor', 'moderate', 'major', 'critical']
  const minIndex = significanceOrder.indexOf(minSignificance)
  
  return Array.from(index.events.values()).filter(event => {
    const eventIndex = significanceOrder.indexOf(event.significance)
    return eventIndex >= minIndex
  })
}

/**
 * Format event memory for context
 */
export function formatEventMemoryForContext(
  event: EventMemory
): string {
  const parts: string[] = []
  
  parts.push(`**${event.description}**`)
  parts.push(`Location: ${event.location}`)
  parts.push(`Participants: ${event.participants.join(', ')}`)
  parts.push(`Significance: ${event.significance}`)
  parts.push(`Emotional impact: ${event.emotionalImpact}`)
  
  if (event.consequences.length > 0) {
    parts.push(`Consequences: ${event.consequences.join(', ')}`)
  }
  
  return parts.join(' | ')
}

/**
 * Get memory summary for context
 */
export function getMemorySummaryForContext(
  index: MemoryIndex,
  characterId?: string
): string {
  const parts: string[] = []
  
  parts.push('## Event Memories')
  parts.push('')
  
  if (characterId) {
    // Character-specific memories
    const events = getCharacterEvents(index, characterId)
    const significant = events.filter(e => 
      e.significance === 'major' || e.significance === 'critical'
    )
    
    if (significant.length > 0) {
      parts.push('### Significant Events')
      for (const event of significant.slice(0, 5)) {
        parts.push(`- ${formatEventMemoryForContext(event)}`)
      }
      parts.push('')
    }
  } else {
    // All significant events
    const significant = findSignificantEvents(index)
    
    if (significant.length > 0) {
      parts.push('### Recent Significant Events')
      for (const event of significant.slice(-5)) {
        parts.push(`- ${event.description} (${event.significance})`)
      }
      parts.push('')
    }
  }
  
  return parts.join('\n')
}

/**
 * Add consequence to event
 */
export function addEventConsequence(
  index: MemoryIndex,
  eventId: string,
  consequence: string
): MemoryIndex {
  const event = index.events.get(eventId)
  if (!event) return index
  
  event.consequences.push(consequence)
  
  const updatedEvents = new Map(index.events)
  updatedEvents.set(eventId, event)
  
  return {
    ...index,
    events: updatedEvents,
  }
}

/**
 * Search events
 */
export function searchEvents(
  index: MemoryIndex,
  query: string
): EventMemory[] {
  const lowerQuery = query.toLowerCase()
  
  return Array.from(index.events.values()).filter(event =>
    event.description.toLowerCase().includes(lowerQuery) ||
    event.location.toLowerCase().includes(lowerQuery) ||
    event.emotionalImpact.toLowerCase().includes(lowerQuery)
  )
}
