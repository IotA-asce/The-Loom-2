/**
 * Adaptive context selection based on anchor type
 */

import type { AnchorEvent } from '@/lib/db/schema'
import type { AnchorDetails } from './anchor-details'
import type { CharacterState } from './character-states'
import type { WorldState } from './world-state'
import type { NarrativeStyleProfile } from './style-profile'

export interface ContextPackage {
  anchor: AnchorDetails
  characters: CharacterState[]
  world: WorldState
  style: NarrativeStyleProfile
  
  // Type-specific context weights
  focusAreas: string[]
  requiredContext: string[]
  optionalContext: string[]
  
  // Narrative format
  timelineNarrative: string
}

/**
 * Select context based on anchor type
 */
export function selectContextForAnchorType(
  anchor: AnchorDetails,
  characters: CharacterState[],
  world: WorldState,
  style: NarrativeStyleProfile
): ContextPackage {
  const typeStrategy = getTypeStrategy(anchor.type)
  
  // Filter characters based on anchor type needs
  const relevantCharacters = filterRelevantCharacters(
    characters,
    anchor,
    typeStrategy
  )
  
  // Extract relevant world state elements
  const relevantWorldContext = extractRelevantWorldContext(
    world,
    anchor,
    typeStrategy
  )
  
  // Build timeline narrative
  const timelineNarrative = buildTimelineNarrative(
    anchor,
    relevantCharacters,
    relevantWorldContext,
    style
  )
  
  return {
    anchor,
    characters: relevantCharacters,
    world: relevantWorldContext,
    style,
    focusAreas: typeStrategy.focusAreas,
    requiredContext: typeStrategy.requiredContext,
    optionalContext: typeStrategy.optionalContext,
    timelineNarrative,
  }
}

interface TypeStrategy {
  focusAreas: string[]
  requiredContext: string[]
  optionalContext: string[]
  characterImportance: 'decision-maker' | 'all-involved' | 'relationship-pairs'
}

function getTypeStrategy(type: AnchorEvent['type']): TypeStrategy {
  const strategies: Record<AnchorEvent['type'], TypeStrategy> = {
    decision: {
      focusAreas: ['character motivations', 'stakes', 'options', 'consequences'],
      requiredContext: ['decision-maker state', 'stakeholder interests', 'available options'],
      optionalContext: ['past similar decisions', 'cultural context', 'time pressure'],
      characterImportance: 'decision-maker',
    },
    coincidence: {
      focusAreas: ['timing', 'external forces', 'serendipity', 'unforeseen consequences'],
      requiredContext: ['converging plot threads', 'character locations', 'timing factors'],
      optionalContext: ['probability factors', 'fate/destiny themes', 'ironic elements'],
      characterImportance: 'all-involved',
    },
    revelation: {
      focusAreas: ['secret keeper', 'reveal method', 'emotional impact', 'cascade effects'],
      requiredContext: ['who knows what', 'revelation method', 'character relationships'],
      optionalContext: ['foreshadowing', 'symbolic elements', 'dramatic irony'],
      characterImportance: 'relationship-pairs',
    },
    betrayal: {
      focusAreas: ['betrayer motivation', 'betrayed expectations', 'trust dynamics', 'fallout'],
      requiredContext: ['relationship history', 'betrayer goals', 'betrayed vulnerabilities'],
      optionalContext: ['redemption possibility', 'sympathetic factors', 'power dynamics'],
      characterImportance: 'relationship-pairs',
    },
    sacrifice: {
      focusAreas: ['sacrifice value', 'motivation', 'recipient', 'cost', 'meaning'],
      requiredContext: ['what is sacrificed', 'sacrificer state', 'stakes involved'],
      optionalContext: ['symbolic significance', 'historical parallels', 'cultural meaning'],
      characterImportance: 'decision-maker',
    },
    encounter: {
      focusAreas: ['character dynamics', 'circumstances', 'power balance', 'immediate goals'],
      requiredContext: ['character states', 'meeting context', 'power dynamics'],
      optionalContext: ['fated/destined elements', 'cultural clash', 'past connections'],
      characterImportance: 'relationship-pairs',
    },
    conflict: {
      focusAreas: ['opposing forces', 'stakes', 'resources', 'resolution possibilities'],
      requiredContext: ['conflict parties', 'conflict causes', 'current advantages'],
      optionalContext: ['escalation potential', 'mediation options', 'long-term implications'],
      characterImportance: 'all-involved',
    },
    transformation: {
      focusAreas: ['before state', 'trigger', 'change process', 'after state', 'acceptance'],
      requiredContext: ['character baseline', 'transformation catalyst', 'societal context'],
      optionalContext: ['symbolic elements', 'support systems', 'resistance factors'],
      characterImportance: 'decision-maker',
    },
    mystery: {
      focusAreas: ['unknown element', 'clues so far', 'investigators', 'possible explanations'],
      requiredContext: ['known facts', 'active investigators', 'stakeholder interests'],
      optionalContext: ['red herrings', 'genre conventions', 'reader knowledge'],
      characterImportance: 'all-involved',
    },
  }
  
  return strategies[type]
}

function filterRelevantCharacters(
  characters: CharacterState[],
  anchor: AnchorDetails,
  strategy: TypeStrategy
): CharacterState[] {
  switch (strategy.characterImportance) {
    case 'decision-maker':
      // Focus on the primary decision maker and those directly affected
      return characters.filter(c => 
        anchor.characters.includes(c.id)
      ).slice(0, 3)
      
    case 'relationship-pairs':
      // Focus on key relationship pairs
      return characters.filter(c => 
        anchor.characters.includes(c.id)
      )
      
    case 'all-involved':
    default:
      // Include all involved characters
      return characters.filter(c => 
        anchor.characters.includes(c.id)
      )
  }
}

function extractRelevantWorldContext(
  world: WorldState,
  anchor: AnchorDetails,
  strategy: TypeStrategy
): WorldState {
  // Return full world state but could be filtered based on requirements
  return world
}

function buildTimelineNarrative(
  anchor: AnchorDetails,
  characters: CharacterState[],
  world: WorldState,
  style: NarrativeStyleProfile
): string {
  const parts: string[] = []
  
  // Opening context
  parts.push(`ANCHOR EVENT: ${anchor.title}`)
  parts.push(`Type: ${anchor.type} (${anchor.significance} significance)`)
  parts.push(`Location: Page ${anchor.pageNumber}`)
  parts.push('')
  
  // Description
  parts.push('DESCRIPTION:')
  parts.push(anchor.description)
  parts.push('')
  
  // Selected alternative
  parts.push('BRANCH POINT:')
  parts.push(anchor.selectedAlternative.description)
  parts.push('')
  
  // Character states
  parts.push('CHARACTER STATES:')
  for (const char of characters) {
    parts.push(`- ${char.name} (${char.importance}): ${char.currentState.emotional}`)
    parts.push(`  Goal: ${char.currentState.goal}`)
    parts.push(`  Obstacle: ${char.currentState.obstacle}`)
  }
  parts.push('')
  
  // World state summary
  parts.push('WORLD CONTEXT:')
  parts.push(world.description)
  if (world.activeConflicts.length > 0) {
    parts.push('Active Conflicts:')
    for (const conflict of world.activeConflicts.slice(0, 2)) {
      parts.push(`- ${conflict.name}: ${conflict.description}`)
    }
  }
  parts.push('')
  
  // Style context
  parts.push('NARRATIVE STYLE:')
  parts.push(`Tone: ${style.tone.primary} (${style.tone.descriptors.join(', ')})`)
  parts.push(`Pacing: ${style.pacing.speed}, ${style.pacing.chapterStructure}`)
  
  return parts.join('\n')
}
