/**
 * Build context for anchor analysis prompts
 */

import type { ParsedTimelineEvent, ParsedCharacter, ParsedTheme } from '@/lib/analysis/parser/validation'

export interface AnchorContext {
  event: ParsedTimelineEvent
  surroundingEvents: ParsedTimelineEvent[]
  involvedCharacters: ParsedCharacter[]
  relevantThemes: ParsedTheme[]
  timelinePosition: 'early' | 'middle' | 'late' | 'climax'
}

/**
 * Build context for anchor event analysis
 */
export function buildAnchorContext(
  event: ParsedTimelineEvent,
  events?: ParsedTimelineEvent[],
  characters?: ParsedCharacter[],
  themes?: ParsedTheme[]
): AnchorContext {
  const allEvents = events || []
  const eventIndex = allEvents.findIndex(e => e.id === event.id)
  
  // Get surrounding events (2 before, 2 after)
  const surrounding = allEvents.slice(
    Math.max(0, eventIndex - 2),
    Math.min(allEvents.length, eventIndex + 3)
  )
  
  // Get involved characters
  const involvedCharacters = characters?.filter(c => 
    event.characters.includes(c.id)
  ) || []
  
  // Get relevant themes
  const relevantThemes = themes?.filter(t => 
    event.id.includes(t.name.toLowerCase().replace(/\s+/g, '-'))
  ) || []
  
  // Determine timeline position
  const position = calculateTimelinePosition(eventIndex, allEvents.length)
  
  return {
    event,
    surroundingEvents: surrounding,
    involvedCharacters,
    relevantThemes,
    timelinePosition: position,
  }
}

function calculateTimelinePosition(
  index: number,
  total: number
): 'early' | 'middle' | 'late' | 'climax' {
  const ratio = index / total
  if (ratio < 0.2) return 'early'
  if (ratio < 0.6) return 'middle'
  if (ratio < 0.85) return 'late'
  return 'climax'
}
