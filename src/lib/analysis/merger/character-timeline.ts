/**
 * Character timeline merge
 * Merges character data with timeline events
 */

import { Character, TimelineEvent } from '@/lib/db/schema'

export interface CharacterTimeline {
  character: Character
  appearances: Array<{
    pageNumber: number
    eventId: string
    eventTitle: string
    role: 'primary' | 'supporting' | 'background'
  }>
  arc: {
    introduction: number
    development: number[]
    climax?: number
    resolution?: number
  }
}

export interface MergedCharacterData {
  characters: CharacterTimeline[]
  sharedEvents: Map<string, string[]> // eventId -> characterIds
  characterInteractions: Map<string, Set<string>> // charId -> Set of charIds they interact with
}

/**
 * Merge character data with timeline
 */
export function mergeCharacterTimeline(
  characters: Character[],
  events: TimelineEvent[]
): MergedCharacterData {
  const characterTimelines = new Map<string, CharacterTimeline>()
  const sharedEvents = new Map<string, string[]>()
  const characterInteractions = new Map<string, Set<string>>()
  
  // Initialize character timelines
  for (const character of characters) {
    characterTimelines.set(character.id, {
      character,
      appearances: [],
      arc: {
        introduction: character.firstAppearance,
        development: [],
      },
    })
    characterInteractions.set(character.id, new Set())
  }
  
  // Process events
  for (const event of events) {
    const eventChars: string[] = []
    
    for (const charId of event.characters) {
      const timeline = characterTimelines.get(charId)
      if (!timeline) continue
      
      eventChars.push(charId)
      
      // Determine role based on significance and order
      const role: CharacterTimeline['appearances'][0]['role'] =
        event.significance === 'critical' ? 'primary' :
        event.significance === 'major' ? 'supporting' : 'background'
      
      timeline.appearances.push({
        pageNumber: event.pageNumber,
        eventId: event.id,
        eventTitle: event.title,
        role,
      })
      
      // Track development points
      if (event.significance === 'major' || event.significance === 'critical') {
        timeline.arc.development.push(event.pageNumber)
      }
      
      // Track interactions with other characters in this event
      for (const otherCharId of event.characters) {
        if (otherCharId !== charId) {
          characterInteractions.get(charId)?.add(otherCharId)
        }
      }
    }
    
    sharedEvents.set(event.id, eventChars)
  }
  
  // Identify arc milestones
  identifyArcMilestones(characterTimelines, events)
  
  return {
    characters: Array.from(characterTimelines.values()),
    sharedEvents,
    characterInteractions,
  }
}

/**
 * Identify character arc milestones
 */
function identifyArcMilestones(
  timelines: Map<string, CharacterTimeline>,
  events: TimelineEvent[]
): void {
  for (const timeline of timelines.values()) {
    const appearances = timeline.appearances
    if (appearances.length === 0) continue
    
    // Sort by page
    appearances.sort((a, b) => a.pageNumber - b.pageNumber)
    
    // Introduction is first appearance
    timeline.arc.introduction = appearances[0].pageNumber
    
    // Climax is appearance in most significant event
    const significantAppearances = appearances.filter(a => 
      events.find(e => e.id === a.eventId)?.significance === 'critical'
    )
    
    if (significantAppearances.length > 0) {
      const lastSignificant = significantAppearances[significantAppearances.length - 1]
      timeline.arc.climax = lastSignificant.pageNumber
    }
    
    // Resolution is last appearance
    const lastAppearance = appearances[appearances.length - 1]
    timeline.arc.resolution = lastAppearance.pageNumber
  }
}

/**
 * Find character arc gaps (periods without appearances)
 */
export function findArcGaps(
  timeline: CharacterTimeline,
  minGapSize: number = 30
): Array<{ start: number; end: number; duration: number }> {
  const gaps: Array<{ start: number; end: number; duration: number }> = []
  const appearances = [...timeline.appearances].sort((a, b) => a.pageNumber - b.pageNumber)
  
  for (let i = 0; i < appearances.length - 1; i++) {
    const current = appearances[i]
    const next = appearances[i + 1]
    
    const gap = next.pageNumber - current.pageNumber
    
    if (gap >= minGapSize) {
      gaps.push({
        start: current.pageNumber,
        end: next.pageNumber,
        duration: gap,
      })
    }
  }
  
  return gaps
}

/**
 * Calculate character importance from merged data
 */
export function calculateCharacterImportance(
  timeline: CharacterTimeline,
  totalEvents: number
): {
  screenTime: number // 0-1
  narrativeWeight: number // 0-1
  socialConnectivity: number // 0-1
} {
  // Screen time based on appearance count
  const screenTime = Math.min(1, timeline.appearances.length / (totalEvents * 0.3))
  
  // Narrative weight based on role in significant events
  const primaryAppearances = timeline.appearances.filter(a => a.role === 'primary').length
  const narrativeWeight = timeline.appearances.length > 0
    ? primaryAppearances / timeline.appearances.length
    : 0
  
  // Social connectivity based on unique interactions
  const maxPossibleConnections = totalEvents // Rough approximation
  const socialConnectivity = Math.min(1, timeline.appearances.length / maxPossibleConnections)
  
  return {
    screenTime: Math.round(screenTime * 100) / 100,
    narrativeWeight: Math.round(narrativeWeight * 100) / 100,
    socialConnectivity: Math.round(socialConnectivity * 100) / 100,
  }
}
