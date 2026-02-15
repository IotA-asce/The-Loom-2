// @ts-nocheck
/**
 * Reactive character evolution tracking
 */

import type { CharacterState } from '@/lib/branches/context/character-states'
import type { Chapter } from '@/lib/db/schema'

export interface CharacterEvolution {
  characterId: string
  characterName: string
  baseState: CharacterState
  currentState: CharacterState
  evolutionLog: EvolutionEntry[]
  significantChanges: ChangeRecord[]
  currentTraits: Map<string, TraitValue>
}

export interface EvolutionEntry {
  chapterId: string
  chapterOrder: number
  timestamp: number
  change: string
  trigger: string
  significance: 'minor' | 'moderate' | 'major'
}

export interface ChangeRecord {
  trait: string
  from: string
  to: string
  chapterId: string
  reason: string
}

export interface TraitValue {
  value: string
  confidence: number
  source: string
  chapterId?: string
}

/**
 * Track reactive character evolution
 */
export function trackCharacterEvolution(
  character: CharacterState,
  chapters: Chapter[]
): CharacterEvolution {
  const evolutionLog: EvolutionEntry[] = []
  const significantChanges: ChangeRecord[] = []
  const currentTraits = new Map<string, TraitValue>()
  
  // Initialize with base state
  initializeTraits(currentTraits, character)
  
  // Process each chapter for evolution
  for (const chapter of chapters) {
    const chapterChanges = extractCharacterChanges(character.id, chapter)
    
    for (const change of chapterChanges) {
      evolutionLog.push({
        chapterId: chapter.id!,
        chapterOrder: chapter.order,
        timestamp: chapter.createdAt,
        change: change.description,
        trigger: change.trigger,
        significance: change.significance,
      })
      
      if (change.significance !== 'minor' && change.trait) {
        significantChanges.push({
          trait: change.trait,
          from: change.from ?? '',
          to: change.to ?? '',
          chapterId: chapter.id!,
          reason: change.reason ?? '',
        })
      }
      
      // Update current traits
      if (change.trait) {
        currentTraits.set(change.trait, {
          value: change.to,
          confidence: 0.9,
          source: `Chapter ${chapter.order ?? 0}`,
          chapterId: chapter.id,
        })
      }
    }
  }
  
  // Build current state from evolution
  const currentState = buildCurrentState(character, currentTraits)
  
  return {
    characterId: character.id,
    characterName: character.name,
    baseState: character,
    currentState,
    evolutionLog,
    significantChanges,
    currentTraits,
  }
}

interface ExtractedChange {
  description: string
  trigger: string
  significance: 'minor' | 'moderate' | 'major'
  trait?: string
  from?: string
  to?: string
  reason?: string
}

function extractCharacterChanges(
  characterId: string,
  chapter: Chapter
): ExtractedChange[] {
  const changes: ExtractedChange[] = []
  
  // Check if character appears in this chapter
  const characterScenes = chapter.scenes.filter(s => 
    s.characters.includes(characterId)
  )
  
  if (characterScenes.length === 0) {
    return changes
  }
  
  // Extract changes from scene summaries
  for (const scene of characterScenes) {
    // Look for change indicators in summary
    const summary = scene.summary.toLowerCase()
    const emotionalArc = scene.emotionalArc.toLowerCase()
    
    // Detect emotional changes
    const emotionKeywords = ['angry', 'sad', 'happy', 'determined', 'fearful', 'hopeful']
    for (const emotion of emotionKeywords) {
      if (summary.includes(emotion) || emotionalArc.includes(emotion)) {
        changes.push({
          description: `Emotional shift: ${emotion}`,
          trigger: scene.title || 'Scene events',
          significance: detectSignificance(summary, emotionalArc),
          trait: 'emotional-state',
          to: emotion,
        })
      }
    }
    
    // Detect relationship changes
    if (summary.includes('trust') || summary.includes('betray')) {
      changes.push({
        description: 'Relationship dynamic shifted',
        trigger: scene.title || 'Character interaction',
        significance: detectSignificance(summary, emotionalArc),
      })
    }
    
    // Detect goal/obstacle changes
    if (summary.includes('decide') || summary.includes('choose')) {
      changes.push({
        description: 'Character made significant decision',
        trigger: scene.title || 'Decision point',
        significance: 'major',
      })
    }
  }
  
  return changes
}

function detectSignificance(summary: string, emotionalArc: string): 'minor' | 'moderate' | 'major' {
  const majorIndicators = ['transform', 'decide', 'betray', 'sacrifice', 'death', 'reveal']
  const moderateIndicators = ['realize', 'change', 'conflict', 'struggle']
  
  const combined = (summary + ' ' + emotionalArc).toLowerCase()
  
  for (const indicator of majorIndicators) {
    if (combined.includes(indicator)) return 'major'
  }
  
  for (const indicator of moderateIndicators) {
    if (combined.includes(indicator)) return 'moderate'
  }
  
  return 'minor'
}

function initializeTraits(
  traits: Map<string, TraitValue>,
  character: CharacterState
): void {
  traits.set('emotional-state', {
    value: character.currentState.emotional,
    confidence: 1,
    source: 'Base state',
  })
  
  traits.set('goal', {
    value: character.currentState.goal,
    confidence: 1,
    source: 'Base state',
  })
  
  traits.set('obstacle', {
    value: character.currentState.obstacle,
    confidence: 1,
    source: 'Base state',
  })
  
  traits.set('location', {
    value: character.currentState.location,
    confidence: 1,
    source: 'Base state',
  })
}

function buildCurrentState(
  baseState: CharacterState,
  currentTraits: Map<string, TraitValue>
): CharacterState {
  return {
    ...baseState,
    currentState: {
      emotional: currentTraits.get('emotional-state')?.value || baseState.currentState.emotional,
      physical: currentTraits.get('physical-state')?.value || baseState.currentState.physical,
      location: currentTraits.get('location')?.value || baseState.currentState.location,
      goal: currentTraits.get('goal')?.value || baseState.currentState.goal,
      obstacle: currentTraits.get('obstacle')?.value || baseState.currentState.obstacle,
    },
  }
}

/**
 * Get recent character changes
 */
export function getRecentChanges(
  evolution: CharacterEvolution,
  chapterCount: number = 3
): EvolutionEntry[] {
  const maxOrder = Math.max(...evolution.evolutionLog.map(e => e.chapterOrder))
  return evolution.evolutionLog.filter(e => 
    e.chapterOrder > maxOrder - chapterCount
  )
}

/**
 * Check if character has evolved significantly
 */
export function hasSignificantEvolution(
  evolution: CharacterEvolution
): boolean {
  return evolution.significantChanges.length > 0
}

/**
 * Format evolution for context
 */
export function formatEvolutionForContext(
  evolution: CharacterEvolution
): string {
  const parts: string[] = []
  
  parts.push(`### ${evolution.characterName} - Character Evolution`)
  parts.push('')
  
  // Current state
  parts.push(`**Current State:** ${evolution.currentState.currentState.emotional}`)
  parts.push(`**Current Goal:** ${evolution.currentState.currentState.goal}`)
  parts.push('')
  
  // Recent changes
  const recentChanges = getRecentChanges(evolution, 2)
  if (recentChanges.length > 0) {
    parts.push('**Recent Changes:**')
    for (const change of recentChanges) {
      parts.push(`- Chapter ${change.chapterOrder}: ${change.change} (${change.significance})`)
    }
    parts.push('')
  }
  
  return parts.join('\n')
}
