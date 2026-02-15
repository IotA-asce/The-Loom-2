/**
 * Compile full character states for branch context
 */

import type { ParsedCharacter } from '@/lib/analysis/parser/validation'
import type { TimelineRelationship } from '@/lib/analysis/timeline/causal'

export interface CharacterState {
  id: string
  name: string
  aliases: string[]
  description: string
  appearance: string
  personality: string
  importance: 'major' | 'supporting' | 'minor'
  
  // Current state at branch point
  currentState: {
    emotional: string
    physical: string
    location: string
    goal: string
    obstacle: string
  }
  
  // Knowledge and relationships
  knowledge: {
    knownFacts: string[]
    suspectedFacts: string[]
    unknownFacts: string[] // Things they don't know yet
  }
  
  relationships: Array<{
    characterId: string
    characterName: string
    relationshipType: string
    dynamic: string // e.g., "trusting but suspicious", "hostile alliance"
    history: string
  }>
  
  // Arc trajectory
  arc: {
    startingPoint: string
    currentPoint: string
    potentialEndings: string[]
    unresolvedIssues: string[]
  }
}

/**
 * Compile full character state for branch context
 */
export function compileCharacterState(
  character: ParsedCharacter,
  relationships: TimelineRelationship[],
  allCharacters: ParsedCharacter[]
): CharacterState {
  // Get relationships for this character
  const charRelationships = relationships.filter(
    r => r.from === character.id || r.to === character.id
  )
  
  return {
    id: character.id,
    name: character.name,
    aliases: character.aliases,
    description: character.description,
    appearance: character.appearance || 'Not described',
    personality: character.personality || 'Not analyzed',
    importance: character.importance,
    
    currentState: {
      emotional: inferEmotionalState(character),
      physical: 'Healthy', // Default, could be enhanced with analysis
      location: 'Unknown',
      goal: inferGoal(character),
      obstacle: inferObstacle(character),
    },
    
    knowledge: {
      knownFacts: [],
      suspectedFacts: [],
      unknownFacts: [],
    },
    
    relationships: charRelationships.map(r => {
      const otherId = r.from === character.id ? r.to : r.from
      const otherChar = allCharacters.find(c => c.id === otherId)
      
      return {
        characterId: otherId,
        characterName: otherChar?.name || otherId,
        relationshipType: r.type,
        dynamic: r.dynamic,
        history: r.history,
      }
    }),
    
    arc: {
      startingPoint: 'Beginning of story',
      currentPoint: `At page ${character.firstAppearance}`,
      potentialEndings: [],
      unresolvedIssues: [],
    },
  }
}

function inferEmotionalState(character: ParsedCharacter): string {
  if (character.personality) {
    // Extract emotional indicators from personality
    const emotionalKeywords = ['happy', 'sad', 'angry', 'fearful', 'anxious', 'confident', 'determined']
    for (const keyword of emotionalKeywords) {
      if (character.personality.toLowerCase().includes(keyword)) {
        return keyword
      }
    }
  }
  return 'Neutral' // Default
}

function inferGoal(character: ParsedCharacter): string {
  // Could be enhanced with narrative analysis
  return 'Unknown - to be determined from story context'
}

function inferObstacle(character: ParsedCharacter): string {
  // Could be enhanced with narrative analysis
  return 'Unknown - to be determined from story context'
}

/**
 * Get states for all affected characters
 */
export function getAffectedCharacterStates(
  characterIds: string[],
  allCharacters: ParsedCharacter[],
  relationships: TimelineRelationship[]
): CharacterState[] {
  return characterIds
    .map(id => allCharacters.find(c => c.id === id))
    .filter((c): c is ParsedCharacter => c !== undefined)
    .map(c => compileCharacterState(c, relationships, allCharacters))
}
