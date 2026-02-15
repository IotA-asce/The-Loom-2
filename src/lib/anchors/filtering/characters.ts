/**
 * Character involvement filtering
 */

import type { ParsedTimelineEvent, ParsedCharacter } from '@/lib/analysis/parser/validation'

/**
 * Filter events by major character involvement
 */
export function filterByMajorCharacters(
  events: ParsedTimelineEvent[],
  majorCharacters: ParsedCharacter[],
  minMajorCharacters: number = 1
): ParsedTimelineEvent[] {
  const majorCharacterIds = new Set(majorCharacters.map(c => c.id))

  return events.filter(event => {
    const majorCount = event.characters.filter(id => majorCharacterIds.has(id)).length
    return majorCount >= minMajorCharacters
  })
}

/**
 * Calculate character involvement score
 */
export function calculateCharacterInvolvement(
  event: ParsedTimelineEvent,
  characters: ParsedCharacter[]
): number {
  const majorChars = characters.filter(c => c.importance === 'major')
  const majorCount = event.characters.filter(id => 
    majorChars.some(c => c.id === id)
  ).length
  
  return Math.min(majorCount / Math.max(majorChars.length * 0.5, 1), 1)
}
