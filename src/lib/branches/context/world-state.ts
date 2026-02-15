/**
 * Assemble world state snapshot for branch context
 */

import type { ParsedTheme } from '@/lib/analysis/parser/validation'
import type { ParsedTimelineEvent } from '@/lib/analysis/parser/validation'

export interface WorldState {
  // Current situation
  description: string
  setting: string
  time: string
  
  // Key facts that are true at this point
  keyFacts: string[]
  
  // Active story elements
  activeConflicts: Array<{
    name: string
    description: string
    involvedParties: string[]
    stakes: string
    currentStatus: string
  }>
  
  // Available resources/advantages
  availableResources: Array<{
    name: string
    description: string
    holder: string
    limitations: string[]
  }>
  
  // World rules and constraints
  worldRules: {
    hardRules: string[] // Cannot be broken (physics, established canon)
    softRules: string[] // Can be bent (social norms, traditions)
    breakingSoftRules: string[] // What happens if soft rules are broken
  }
  
  // Thematic elements
  themes: Array<{
    name: string
    currentExpression: string
    potentialDevelopments: string[]
  }>
  
  // Unresolved mysteries/plot threads
  plotThreads: Array<{
    description: string
    importance: 'major' | 'minor'
    potentialResolutions: string[]
  }>
}

/**
 * Assemble world state snapshot at branch point
 */
export function assembleWorldState(
  events: ParsedTimelineEvent[],
  themes: ParsedTheme[],
  pageNumber: number
): WorldState {
  // Get events up to this point
  const pastEvents = events.filter(e => e.pageNumber <= pageNumber)
  const currentEvent = events.find(e => e.pageNumber === pageNumber)
  
  return {
    description: generateWorldDescription(pastEvents, currentEvent),
    setting: inferSetting(pastEvents),
    time: inferTime(pastEvents),
    
    keyFacts: extractKeyFacts(pastEvents),
    
    activeConflicts: extractActiveConflicts(pastEvents),
    
    availableResources: extractResources(pastEvents),
    
    worldRules: {
      hardRules: [
        'Physical laws of the world remain consistent',
        'Character abilities established so far remain valid',
        'Past events cannot be changed',
      ],
      softRules: [
        'Social hierarchies and power structures',
        'Cultural norms and traditions',
        'Political alliances and treaties',
      ],
      breakingSoftRules: [
        'May lead to social ostracization',
        'Could create new alliances or enemies',
        'Might reveal hidden depths of characters',
      ],
    },
    
    themes: themes.map(t => ({
      name: t.name,
      currentExpression: `Exploring ${t.name} through ${t.relatedEvents.length} events`,
      potentialDevelopments: t.developments,
    })),
    
    plotThreads: extractPlotThreads(pastEvents),
  }
}

function generateWorldDescription(
  pastEvents: ParsedTimelineEvent[],
  currentEvent?: ParsedTimelineEvent
): string {
  const significantEvents = pastEvents
    .filter(e => e.significance === 'major' || e.significance === 'critical')
    .map(e => e.title)
  
  let description = `World state after ${pastEvents.length} events.`
  if (significantEvents.length > 0) {
    description += ` Major developments: ${significantEvents.slice(-3).join(', ')}.`
  }
  if (currentEvent) {
    description += ` Currently at: ${currentEvent.title}.`
  }
  
  return description
}

function inferSetting(events: ParsedTimelineEvent[]): string {
  // Could be enhanced with location extraction
  return 'Current setting based on recent events'
}

function inferTime(events: ParsedTimelineEvent[]): string {
  // Could be enhanced with temporal analysis
  return `Event sequence position ${events.length}`
}

function extractKeyFacts(events: ParsedTimelineEvent[]): string[] {
  return events
    .filter(e => e.significance !== 'minor')
    .map(e => `${e.title}: ${e.description}`)
    .slice(-10) // Last 10 significant facts
}

function extractActiveConflicts(events: ParsedTimelineEvent[]): WorldState['activeConflicts'] {
  const conflictEvents = events.filter(e => 
    e.description.toLowerCase().includes('conflict') ||
    e.description.toLowerCase().includes('fight') ||
    e.description.toLowerCase().includes('against') ||
    e.significance === 'critical'
  )
  
  return conflictEvents.slice(-3).map(e => ({
    name: e.title,
    description: e.description,
    involvedParties: e.characters,
    stakes: 'To be determined from context',
    currentStatus: e.significance === 'critical' ? 'Escalating' : 'Ongoing',
  }))
}

function extractResources(events: ParsedTimelineEvent[]): WorldState['availableResources'] {
  // Simplified - could be enhanced with resource extraction
  return []
}

function extractPlotThreads(events: ParsedTimelineEvent[]): WorldState['plotThreads'] {
  const unresolved = events.filter(e => 
    e.description.toLowerCase().includes('mystery') ||
    e.description.toLowerCase().includes('unknown') ||
    e.description.toLowerCase().includes('question')
  )
  
  return unresolved.slice(-5).map(e => ({
    description: e.description,
    importance: e.significance === 'critical' ? 'major' : 'minor',
    potentialResolutions: [],
  }))
}
