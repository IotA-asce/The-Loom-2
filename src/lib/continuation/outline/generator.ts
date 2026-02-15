/**
 * Outline generator with mandatory approval
 */

import type { BranchVariation } from '@/lib/branches/variation/generator'
import type { Chapter } from '@/lib/db/schema'

export interface ChapterOutline {
  chapterNumber: number
  title: string
  summary: string
  scenes: SceneOutline[]
  emotionalArc: string
  cliffhanger?: string
  wordCountTarget: number
  characters: string[]
  settings: string[]
}

export interface SceneOutline {
  sceneNumber: number
  setting: string
  characters: string[]
  summary: string
  dialogueSnippets: string[]
  emotionalBeat: string
  purpose: string
}

export interface StoryOutline {
  chapters: ChapterOutline[]
  totalChapters: number
  estimatedWordCount: number
  status: 'draft' | 'approved' | 'rejected' | 'modified'
  userNotes?: string
  version: number
}

/**
 * Generate outline for story continuation
 */
export function generateOutline(
  branch: BranchVariation,
  previousChapters: Chapter[],
  targetChapters: number = 5
): StoryOutline {
  const chapters: ChapterOutline[] = []
  
  const startChapter = previousChapters.length + 1
  
  for (let i = 0; i < targetChapters; i++) {
    const chapterNum = startChapter + i
    const isLast = i === targetChapters - 1
    
    chapters.push(generateChapterOutline(
      branch,
      chapterNum,
      i,
      targetChapters,
      isLast
    ))
  }
  
  const totalWordCount = chapters.reduce((sum, c) => sum + c.wordCountTarget, 0)
  
  return {
    chapters,
    totalChapters: chapters.length,
    estimatedWordCount: totalWordCount,
    status: 'draft',
    version: 1,
  }
}

function generateChapterOutline(
  branch: BranchVariation,
  chapterNumber: number,
  index: number,
  totalChapters: number,
  isLast: boolean
): ChapterOutline {
  // Determine chapter position in story structure
  const position = determinePosition(index, totalChapters)
  
  // Generate title based on branch trajectory
  const title = generateChapterTitle(branch, chapterNumber, position)
  
  // Generate summary
  const summary = generateChapterSummary(branch, chapterNumber, position)
  
  // Generate scenes
  const scenes = generateScenesForChapter(branch, chapterNumber, position)
  
  // Determine emotional arc
  const emotionalArc = generateEmotionalArc(branch, chapterNumber, position)
  
  // Cliffhanger for non-final chapters
  const cliffhanger = !isLast ? generateCliffhanger(branch, position) : undefined
  
  return {
    chapterNumber,
    title,
    summary,
    scenes,
    emotionalArc,
    cliffhanger,
    wordCountTarget: determineWordCount(branch.complexity),
    characters: extractCharacters(scenes),
    settings: extractSettings(scenes),
  }
}

type Position = 'setup' | 'rising' | 'climax' | 'falling' | 'resolution'

function determinePosition(index: number, total: number): Position {
  const ratio = index / total
  
  if (ratio < 0.2) return 'setup'
  if (ratio < 0.6) return 'rising'
  if (ratio < 0.8) return 'climax'
  if (ratio < 0.95) return 'falling'
  return 'resolution'
}

function generateChapterTitle(
  branch: BranchVariation,
  chapterNum: number,
  position: Position
): string {
  const templates: Record<Position, string[]> = {
    setup: ['The Beginning', 'New Paths', 'First Steps', 'Awakening'],
    rising: ['Complications', 'Rising Tensions', 'The Plan', 'Obstacles'],
    climax: ['The Confrontation', 'At the Peak', 'The Test', 'No Return'],
    falling: ['Aftermath', 'Reckoning', 'Consequences', 'What Remains'],
    resolution: ['The End', 'New Dawn', 'Resolution', 'What Comes Next'],
  }
  
  const positionTemplates = templates[position]
  return positionTemplates[chapterNum % positionTemplates.length]
}

function generateChapterSummary(
  branch: BranchVariation,
  chapterNum: number,
  position: Position
): string {
  const baseSummary = branch.trajectory.summary
  
  const positionFocus: Record<Position, string> = {
    setup: 'establishing the new situation',
    rising: 'escalating complications',
    climax: 'reaching the pivotal moment',
    falling: 'dealing with consequences',
    resolution: 'finding closure',
  }
  
  return `Chapter ${chapterNum} focuses on ${positionFocus[position]}, advancing toward ${baseSummary.toLowerCase()}.`
}

function generateScenesForChapter(
  branch: BranchVariation,
  chapterNum: number,
  position: Position
): SceneOutline[] {
  const sceneCount = determineSceneCount(position)
  const scenes: SceneOutline[] = []
  
  for (let i = 1; i <= sceneCount; i++) {
    scenes.push({
      sceneNumber: i,
      setting: determineSetting(branch, i),
      characters: determineCharacters(branch, i),
      summary: generateSceneSummary(position, i, sceneCount),
      dialogueSnippets: generateDialogueSnippets(branch, position, i),
      emotionalBeat: determineEmotionalBeat(branch.mood, position, i),
      purpose: determineScenePurpose(position, i, sceneCount),
    })
  }
  
  return scenes
}

function determineSceneCount(position: Position): number {
  const counts: Record<Position, number> = {
    setup: 3,
    rising: 4,
    climax: 5,
    falling: 3,
    resolution: 2,
  }
  return counts[position] || 3
}

function determineSetting(branch: BranchVariation, sceneNum: number): string {
  const settings = ['Primary Location', 'Secondary Location', 'Transit', 'Flashback Location']
  return settings[sceneNum % settings.length]
}

function determineCharacters(branch: BranchVariation, sceneNum: number): string[] {
  // Rotate through main characters
  const mainChars = branch.characterArcs.slice(0, 3).map(a => a.characterName)
  return mainChars.slice(0, sceneNum % mainChars.length + 1)
}

function generateSceneSummary(
  position: Position,
  sceneNum: number,
  totalScenes: number
): string {
  if (sceneNum === 1) return 'Opening scene establishing situation'
  if (sceneNum === totalScenes) return 'Closing scene with transition'
  return `Scene ${sceneNum} advancing the plot`
}

function generateDialogueSnippets(
  branch: BranchVariation,
  position: Position,
  sceneNum: number
): string[] {
  const snippets: string[] = []
  
  // Generate 1-2 dialogue snippets per scene
  if (position === 'climax' && sceneNum > 1) {
    snippets.push("[Key confrontation line]")
    snippets.push("[Emotional revelation]")
  } else if (sceneNum === 1) {
    snippets.push("[Opening hook line]")
  }
  
  return snippets
}

function determineEmotionalBeat(
  mood: BranchVariation['mood'],
  position: Position,
  sceneNum: number
): string {
  const moodBeats: Record<typeof mood, string[]> = {
    hopeful: ['optimistic', 'determined', 'triumphant'],
    tragic: ['somber', 'grieving', 'resigned'],
    mixed: ['conflicted', 'uncertain', 'cautious'],
    dark: ['fearful', 'oppressed', 'defiant'],
  }
  
  const beats = moodBeats[mood]
  return beats[sceneNum % beats.length]
}

function determineScenePurpose(
  position: Position,
  sceneNum: number,
  totalScenes: number
): string {
  if (sceneNum === 1) return 'Establish'
  if (sceneNum === totalScenes) return 'Transition'
  if (position === 'climax') return 'Escalate'
  return 'Develop'
}

function generateEmotionalArc(
  branch: BranchVariation,
  chapterNum: number,
  position: Position
): string {
  const arcs: Record<Position, string> = {
    setup: 'Building tension and establishing stakes',
    rising: 'Increasing pressure and complications',
    climax: 'Peak emotional intensity and confrontation',
    falling: 'Processing and dealing with outcomes',
    resolution: 'Finding peace or acceptance',
  }
  
  return arcs[position]
}

function generateCliffhanger(
  branch: BranchVariation,
  position: Position
): string {
  const cliffhangers: Record<Position, string> = {
    setup: 'A new complication emerges',
    rising: 'The situation worsens unexpectedly',
    climax: 'The confrontation reaches a breaking point',
    falling: 'A new revelation changes everything',
    resolution: 'A hint of what comes next',
  }
  
  return cliffhangers[position] || 'To be continued...'
}

function determineWordCount(complexity: BranchVariation['complexity']): number {
  const counts: Record<typeof complexity, number> = {
    simple: 2000,
    moderate: 3000,
    complex: 4000,
  }
  return counts[complexity]
}

function extractCharacters(scenes: SceneOutline[]): string[] {
  const chars = new Set<string>()
  for (const scene of scenes) {
    scene.characters.forEach(c => chars.add(c))
  }
  return Array.from(chars)
}

function extractSettings(scenes: SceneOutline[]): string[] {
  const settings = new Set<string>()
  for (const scene of scenes) {
    settings.add(scene.setting)
  }
  return Array.from(settings)
}

/**
 * Approve outline
 */
export function approveOutline(outline: StoryOutline): StoryOutline {
  return {
    ...outline,
    status: 'approved',
  }
}

/**
 * Reject outline
 */
export function rejectOutline(
  outline: StoryOutline,
  notes: string
): StoryOutline {
  return {
    ...outline,
    status: 'rejected',
    userNotes: notes,
  }
}

/**
 * Modify outline
 */
export function modifyOutline(
  outline: StoryOutline,
  modifications: Partial<StoryOutline>
): StoryOutline {
  return {
    ...outline,
    ...modifications,
    status: 'modified',
    version: outline.version + 1,
  }
}

/**
 * Check if outline needs approval
 */
export function needsApproval(outline: StoryOutline): boolean {
  return outline.status === 'draft' || outline.status === 'modified'
}

/**
 * Format outline for display
 */
export function formatOutlineForDisplay(outline: StoryOutline): string {
  const parts: string[] = []
  
  parts.push(`# Story Outline v${outline.version}`)
  parts.push(`Status: ${outline.status}`)
  parts.push(`Estimated: ${outline.estimatedWordCount.toLocaleString()} words`)
  parts.push('')
  
  for (const chapter of outline.chapters) {
    parts.push(`## Chapter ${chapter.chapterNumber}: ${chapter.title}`)
    parts.push('')
    parts.push(chapter.summary)
    parts.push('')
    
    parts.push(`**Emotional Arc:** ${chapter.emotionalArc}`)
    parts.push(`**Target:** ${chapter.wordCountTarget.toLocaleString()} words`)
    parts.push('')
    
    parts.push('### Scenes')
    for (const scene of chapter.scenes) {
      parts.push(`#### Scene ${scene.sceneNumber}`)
      parts.push(`- **Setting:** ${scene.setting}`)
      parts.push(`- **Characters:** ${scene.characters.join(', ')}`)
      parts.push(`- **Purpose:** ${scene.purpose}`)
      parts.push(`- **Emotional Beat:** ${scene.emotionalBeat}`)
      parts.push(`- **Summary:** ${scene.summary}`)
      
      if (scene.dialogueSnippets.length > 0) {
        parts.push('- **Dialogue:**')
        for (const snippet of scene.dialogueSnippets) {
          parts.push(`  - "${snippet}"`)
        }
      }
      parts.push('')
    }
    
    if (chapter.cliffhanger) {
      parts.push(`**Cliffhanger:** ${chapter.cliffhanger}`)
      parts.push('')
    }
    
    parts.push('---')
    parts.push('')
  }
  
  return parts.join('\n')
}
