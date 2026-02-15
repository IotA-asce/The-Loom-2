/**
 * Continuous background continuity validation
 */

import type { Chapter } from '@/lib/db/schema'
import type { CharacterState } from '@/lib/branches/context/character-states'

export interface ContinuityIssue {
  id: string
  type: 'character' | 'plot' | 'world' | 'timeline' | 'knowledge'
  severity: 'error' | 'warning' | 'info'
  description: string
  location: {
    chapterId?: string
    sceneIndex?: number
    context: string
  }
  suggestion: string
  autoFixable: boolean
}

export interface ValidationContext {
  chapters: Chapter[]
  characters: Map<string, CharacterState>
  worldState: Record<string, unknown>
  knowledgeBase: Map<string, string[]>
}

export interface ValidationResult {
  issues: ContinuityIssue[]
  passed: boolean
  strictness: 'strict' | 'moderate' | 'lenient'
  timestamp: Date
}

/**
 * Validate continuity continuously
 */
export function validateContinuity(
  currentChapter: Chapter,
  context: ValidationContext
): ValidationResult {
  const issues: ContinuityIssue[] = []
  
  // Character continuity
  const characterIssues = validateCharacterContinuity(currentChapter, context)
  issues.push(...characterIssues)
  
  // Plot continuity
  const plotIssues = validatePlotContinuity(currentChapter, context)
  issues.push(...plotIssues)
  
  // World state continuity
  const worldIssues = validateWorldContinuity(currentChapter, context)
  issues.push(...worldIssues)
  
  // Timeline continuity
  const timelineIssues = validateTimelineContinuity(currentChapter, context)
  issues.push(...timelineIssues)
  
  // Knowledge continuity
  const knowledgeIssues = validateKnowledgeContinuity(currentChapter, context)
  issues.push(...knowledgeIssues)
  
  return {
    issues,
    passed: issues.filter(i => i.severity === 'error').length === 0,
    strictness: determineStrictness(context),
    timestamp: new Date(),
  }
}

function validateCharacterContinuity(
  chapter: Chapter,
  context: ValidationContext
): ContinuityIssue[] {
  const issues: ContinuityIssue[] = []
  
  for (const scene of chapter.scenes) {
    for (const charId of scene.characters) {
      const character = context.characters.get(charId)
      if (!character) {
        issues.push({
          id: `char-${charId}-${Date.now()}`,
          type: 'character',
          severity: 'error',
          description: `Character ${charId} appears but not in knowledge base`,
          location: { chapterId: chapter.id, context: scene.summary },
          suggestion: 'Add character to knowledge base or remove from scene',
          autoFixable: false,
        })
        continue
      }
      
      // Check for character state inconsistencies
      const prevChapter = getPreviousChapter(chapter, context.chapters)
      if (prevChapter) {
        const prevState = context.characters.get(charId)
        if (prevState) {
          // Check for dead characters appearing
          if (prevState.mentalState === 'deceased') {
            issues.push({
              id: `char-dead-${charId}-${Date.now()}`,
              type: 'character',
              severity: 'error',
              description: `Deceased character ${character.name} cannot appear`,
              location: { chapterId: chapter.id, context: scene.summary },
              suggestion: 'Remove character or verify resurrection is intentional',
              autoFixable: false,
            })
          }
        }
      }
    }
  }
  
  return issues
}

function validatePlotContinuity(
  chapter: Chapter,
  context: ValidationContext
): ContinuityIssue[] {
  const issues: ContinuityIssue[] = []
  
  // Check plot thread continuity
  for (const thread of chapter.plotThreads) {
    const prevProgress = getPlotThreadProgress(thread.id, context.chapters)
    const currentProgress = thread.status
    
    // Check for impossible state transitions
    if (prevProgress === 'resolved' && currentProgress === 'active') {
      issues.push({
        id: `plot-${thread.id}-${Date.now()}`,
        type: 'plot',
        severity: 'warning',
        description: `Plot thread "${thread.name}" was resolved but is now active again`,
        location: { chapterId: chapter.id, context: `Plot: ${thread.name}` },
        suggestion: 'Verify this is intentional (e.g., new complication)',
        autoFixable: false,
      })
    }
  }
  
  return issues
}

function validateWorldContinuity(
  chapter: Chapter,
  context: ValidationContext
): ContinuityIssue[] {
  const issues: ContinuityIssue[] = []
  
  // Check for world state contradictions
  const worldMentions = extractWorldMentions(chapter.summary)
  
  for (const mention of worldMentions) {
    const currentState = context.worldState[mention.key]
    if (currentState !== undefined && currentState !== mention.value) {
      issues.push({
        id: `world-${mention.key}-${Date.now()}`,
        type: 'world',
        severity: 'warning',
        description: `World state "${mention.key}" contradicts established state`,
        location: { chapterId: chapter.id, context: chapter.summary },
        suggestion: `Current state: ${currentState}. Mentioned: ${mention.value}`,
        autoFixable: false,
      })
    }
  }
  
  return issues
}

function validateTimelineContinuity(
  chapter: Chapter,
  context: ValidationContext
): ContinuityIssue[] {
  const issues: ContinuityIssue[] = []
  
  const prevChapter = getPreviousChapter(chapter, context.chapters)
  if (prevChapter && prevChapter.orderIndex !== undefined && chapter.orderIndex !== undefined) {
    // Check for timeline consistency
    if (chapter.orderIndex <= prevChapter.orderIndex) {
      issues.push({
        id: `timeline-${chapter.id}-${Date.now()}`,
        type: 'timeline',
        severity: 'error',
        description: 'Chapter order contradicts previous chapters',
        location: { chapterId: chapter.id, context: `Order: ${chapter.orderIndex}` },
        suggestion: 'Adjust chapter order to maintain timeline',
        autoFixable: false,
      })
    }
  }
  
  return issues
}

function validateKnowledgeContinuity(
  chapter: Chapter,
  context: ValidationContext
): ContinuityIssue[] {
  const issues: ContinuityIssue[] = []
  
  // Check for callbacks to unrevealed information
  const callbacks = extractCallbacks(chapter.summary)
  
  for (const callback of callbacks) {
    const knownFacts = context.knowledgeBase.get(callback.characterId) || []
    if (!knownFacts.includes(callback.fact)) {
      issues.push({
        id: `knowledge-${callback.characterId}-${Date.now()}`,
        type: 'knowledge',
        severity: 'info',
        description: `Callback to unrevealed information: "${callback.fact}"`,
        location: { chapterId: chapter.id, context: callback.context },
        suggestion: 'Ensure this information was properly revealed earlier',
        autoFixable: false,
      })
    }
  }
  
  return issues
}

function getPreviousChapter(
  current: Chapter,
  allChapters: Chapter[]
): Chapter | undefined {
  if (current.orderIndex === undefined) return undefined
  
  return allChapters
    .filter(c => c.orderIndex !== undefined && c.orderIndex < current.orderIndex!)
    .sort((a, b) => (b.orderIndex || 0) - (a.orderIndex || 0))[0]
}

function getPlotThreadProgress(
  threadId: string,
  chapters: Chapter[]
): string {
  // Find the most recent status of this thread
  for (let i = chapters.length - 1; i >= 0; i--) {
    const thread = chapters[i].plotThreads.find(t => t.id === threadId)
    if (thread) {
      return thread.status
    }
  }
  return 'unknown'
}

function extractWorldMentions(text: string): Array<{ key: string; value: unknown }> {
  // Simplified extraction - would use NLP in real implementation
  const mentions: Array<{ key: string; value: unknown }> = []
  
  // Look for "X is Y" patterns
  const matches = text.match(/(\w+)\s+is\s+([^.,]+)/gi)
  if (matches) {
    for (const match of matches) {
      const parts = match.split(/\s+is\s+/)
      if (parts.length === 2) {
        mentions.push({
          key: parts[0].toLowerCase(),
          value: parts[1].trim(),
        })
      }
    }
  }
  
  return mentions
}

interface Callback {
  characterId: string
  fact: string
  context: string
}

function extractCallbacks(text: string): Callback[] {
  // Simplified callback extraction
  const callbacks: Callback[] = []
  
  // Look for references to past events
  const matches = text.match(/remember when ([^.]+)/gi)
  if (matches) {
    for (const match of matches) {
      callbacks.push({
        characterId: 'unknown',
        fact: match.replace(/remember when\s+/i, ''),
        context: match,
      })
    }
  }
  
  return callbacks
}

function determineStrictness(context: ValidationContext): 'strict' | 'moderate' | 'lenient' {
  const issueCount = context.chapters.length
  
  if (issueCount < 10) return 'strict'
  if (issueCount < 30) return 'moderate'
  return 'lenient'
}

/**
 * Background validation runner
 */
export function createBackgroundValidator(
  context: ValidationContext,
  options: {
    intervalMs?: number
    onIssue?: (issue: ContinuityIssue) => void
  } = {}
): { start: () => void; stop: () => void } {
  let intervalId: number | null = null
  
  return {
    start: () => {
      intervalId = window.setInterval(() => {
        // Validate latest chapter
        const latest = context.chapters[context.chapters.length - 1]
        if (latest) {
          const result = validateContinuity(latest, context)
          
          if (options.onIssue) {
            for (const issue of result.issues) {
              options.onIssue(issue)
            }
          }
        }
      }, options.intervalMs || 30000) // Default 30 seconds
    },
    stop: () => {
      if (intervalId !== null) {
        clearInterval(intervalId)
        intervalId = null
      }
    },
  }
}
