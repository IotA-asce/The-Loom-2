/**
 * Comprehensive character knowledge database
 */

import type { CharacterState } from '@/lib/branches/context/character-states'
import type { Chapter } from '@/lib/db/schema'

export interface CharacterKnowledgeDatabase {
  characters: Map<string, CharacterKnowledge>
}

export interface CharacterKnowledge {
  characterId: string
  characterName: string
  facts: Map<string, KnowledgeFact>
  relationships: Map<string, RelationshipKnowledge>
  events: CharacterEvent[]
  secrets: Secret[]
  misconceptions: Misconception[]
  currentKnowledge: CurrentKnowledge
}

export interface KnowledgeFact {
  id: string
  subject: string
  fact: string
  source: string
  confidence: number
  chapterId?: string
  isSecret: boolean
}

export interface RelationshipKnowledge {
  characterId: string
  relationshipType: string
  dynamic: string
  history: string
  currentStatus: string
  trustLevel: number // -1 to 1
}

export interface CharacterEvent {
  chapterId: string
  chapterOrder: number
  event: string
  impact: 'minor' | 'moderate' | 'major'
  emotionalImpact: string
}

export interface Secret {
  secret: string
  whoKnows: string[]
  whoSuspects: string[]
  whoShouldNotKnow: string[]
  chapterRevealed?: string
}

export interface Misconception {
  belief: string
  reality: string
  whoBelieves: string[]
  chapterCorrected?: string
}

export interface CurrentKnowledge {
  knownFacts: string[]
  suspectedFacts: string[]
  unknownFacts: string[]
  questions: string[]
}

/**
 * Create character knowledge database
 */
export function createCharacterKnowledgeDatabase(
  characters: CharacterState[],
  chapters: Chapter[]
): CharacterKnowledgeDatabase {
  const database: CharacterKnowledgeDatabase = {
    characters: new Map(),
  }
  
  for (const character of characters) {
    database.characters.set(
      character.id,
      buildCharacterKnowledge(character, chapters)
    )
  }
  
  return database
}

function buildCharacterKnowledge(
  character: CharacterState,
  chapters: Chapter[]
): CharacterKnowledge {
  const facts = new Map<string, KnowledgeFact>()
  const relationships = new Map<string, RelationshipKnowledge>()
  const events: CharacterEvent[] = []
  const secrets: Secret[] = []
  const misconceptions: Misconception[] = []
  
  // Initialize with base knowledge
  initializeBaseKnowledge(facts, character)
  initializeRelationships(relationships, character)
  
  // Extract knowledge from chapters
  for (const chapter of chapters) {
    const characterScenes = chapter.scenes.filter(s => 
      s.characters.includes(character.id)
    )
    
    for (const scene of characterScenes) {
      // Extract facts learned
      const learnedFacts = extractFactsFromScene(scene, character.id)
      for (const fact of learnedFacts) {
        facts.set(fact.id, {
          ...fact,
          chapterId: chapter.id,
        })
      }
      
      // Record events
      events.push({
        chapterId: chapter.id!,
        chapterOrder: chapter.order,
        event: scene.summary,
        impact: 'moderate',
        emotionalImpact: scene.emotionalArc,
      })
    }
  }
  
  // Build current knowledge state
  const currentKnowledge = buildCurrentKnowledge(facts, secrets)
  
  return {
    characterId: character.id,
    characterName: character.name,
    facts,
    relationships,
    events,
    secrets,
    misconceptions,
    currentKnowledge,
  }
}

function initializeBaseKnowledge(
  facts: Map<string, KnowledgeFact>,
  character: CharacterState
): void {
  facts.set(`identity-${character.id}`, {
    id: `identity-${character.id}`,
    subject: 'identity',
    fact: `I am ${character.name}`,
    source: 'Self',
    confidence: 1,
    isSecret: false,
  })
  
  character.knowledge.knownFacts.forEach((fact, idx) => {
    facts.set(`known-${idx}`, {
      id: `known-${idx}`,
      subject: 'general',
      fact,
      source: 'Background',
      confidence: 1,
      isSecret: false,
    })
  })
}

function initializeRelationships(
  relationships: Map<string, RelationshipKnowledge>,
  character: CharacterState
): void {
  for (const rel of character.relationships) {
    relationships.set(rel.characterId, {
      characterId: rel.characterId,
      relationshipType: rel.relationshipType,
      dynamic: rel.dynamic,
      history: rel.history,
      currentStatus: rel.dynamic,
      trustLevel: 0, // Neutral default
    })
  }
}

function extractFactsFromScene(
  scene: { summary: string; setting: string },
  _characterId: string
): KnowledgeFact[] {
  const facts: KnowledgeFact[] = []
  
  // Simple fact extraction based on keywords
  const summary = scene.summary.toLowerCase()
  
  // Location fact
  if (scene.setting) {
    facts.push({
      id: `location-${Date.now()}`,
      subject: 'location',
      fact: `Was at ${scene.setting}`,
      source: 'Scene',
      confidence: 1,
      isSecret: false,
    })
  }
  
  // Emotional facts
  const emotions = ['angry', 'happy', 'sad', 'afraid', 'determined']
  for (const emotion of emotions) {
    if (summary.includes(emotion)) {
      facts.push({
        id: `emotion-${emotion}-${Date.now()}`,
        subject: 'emotion',
        fact: `Felt ${emotion}`,
        source: 'Scene',
        confidence: 0.9,
        isSecret: false,
      })
    }
  }
  
  return facts
}

function buildCurrentKnowledge(
  facts: Map<string, KnowledgeFact>,
  _secrets: Secret[]
): CurrentKnowledge {
  const knownFacts: string[] = []
  const suspectedFacts: string[] = []
  const unknownFacts: string[] = []
  const questions: string[] = []
  
  for (const fact of facts.values()) {
    if (fact.confidence >= 0.8) {
      knownFacts.push(fact.fact)
    } else if (fact.confidence >= 0.4) {
      suspectedFacts.push(fact.fact)
    } else {
      unknownFacts.push(fact.fact)
    }
  }
  
  return {
    knownFacts,
    suspectedFacts,
    unknownFacts,
    questions,
  }
}

/**
 * Get character knowledge
 */
export function getCharacterKnowledge(
  database: CharacterKnowledgeDatabase,
  characterId: string
): CharacterKnowledge | undefined {
  return database.characters.get(characterId)
}

/**
 * Update character knowledge
 */
export function updateCharacterKnowledge(
  database: CharacterKnowledgeDatabase,
  characterId: string,
  chapter: Chapter
): CharacterKnowledgeDatabase {
  const character = database.characters.get(characterId)
  if (!character) return database
  
  const updatedKnowledge = buildCharacterKnowledge(
    { id: characterId, name: character.characterName } as CharacterState,
    [chapter]
  )
  
  // Merge new facts with existing
  for (const [key, fact] of updatedKnowledge.facts) {
    if (!character.facts.has(key)) {
      character.facts.set(key, fact)
    }
  }
  
  // Add new events
  character.events.push(...updatedKnowledge.events)
  
  // Update current knowledge
  character.currentKnowledge = buildCurrentKnowledge(
    character.facts,
    character.secrets
  )
  
  const updatedCharacters = new Map(database.characters)
  updatedCharacters.set(characterId, character)
  
  return {
    ...database,
    characters: updatedCharacters,
  }
}

/**
 * Check if character knows a fact
 */
export function characterKnows(
  database: CharacterKnowledgeDatabase,
  characterId: string,
  fact: string
): { knows: boolean; confidence: number } {
  const knowledge = database.characters.get(characterId)
  if (!knowledge) return { knows: false, confidence: 0 }
  
  for (const knownFact of knowledge.facts.values()) {
    if (knownFact.fact.toLowerCase().includes(fact.toLowerCase())) {
      return { knows: true, confidence: knownFact.confidence }
    }
  }
  
  return { knows: false, confidence: 0 }
}

/**
 * Format character knowledge for context
 */
export function formatCharacterKnowledgeForContext(
  database: CharacterKnowledgeDatabase,
  characterId: string
): string {
  const knowledge = database.characters.get(characterId)
  if (!knowledge) return ''
  
  const parts: string[] = []
  
  parts.push(`### ${knowledge.characterName} - Knowledge State`)
  parts.push('')
  
  if (knowledge.currentKnowledge.knownFacts.length > 0) {
    parts.push('**Knows:**')
    for (const fact of knowledge.currentKnowledge.knownFacts.slice(0, 5)) {
      parts.push(`- ${fact}`)
    }
    parts.push('')
  }
  
  if (knowledge.currentKnowledge.suspectedFacts.length > 0) {
    parts.push('**Suspects:**')
    for (const fact of knowledge.currentKnowledge.suspectedFacts.slice(0, 3)) {
      parts.push(`- ${fact}`)
    }
    parts.push('')
  }
  
  if (knowledge.currentKnowledge.questions.length > 0) {
    parts.push('**Questions:**')
    for (const question of knowledge.currentKnowledge.questions.slice(0, 3)) {
      parts.push(`- ${question}`)
    }
  }
  
  return parts.join('\n')
}

/**
 * Find knowledge gaps between characters
 */
export function findKnowledgeGaps(
  database: CharacterKnowledgeDatabase
): Array<{ who: string; missingInfo: string }> {
  const gaps: Array<{ who: string; missingInfo: string }> = []
  
  // This would require comparing what different characters know
  // Simplified implementation
  
  for (const [charId, knowledge] of database.characters) {
    for (const [otherId, otherKnowledge] of database.characters) {
      if (charId === otherId) continue
      
      for (const [factId, fact] of otherKnowledge.facts) {
        if (fact.confidence >= 0.8 && !knowledge.facts.has(factId)) {
          gaps.push({
            who: knowledge.characterName,
            missingInfo: `${otherKnowledge.characterName} knows: ${fact.fact}`,
          })
        }
      }
    }
  }
  
  return gaps
}
