/**
 * Outline modification support
 */

import type { StoryOutline, ChapterOutline, SceneOutline } from './generator'

export type OutlineModificationType = 
  | 'reorder-chapters'
  | 'add-chapter'
  | 'remove-chapter'
  | 'modify-chapter'
  | 'add-scene'
  | 'remove-scene'
  | 'modify-scene'
  | 'adjust-wordcount'
  | 'change-emphasis'

export interface OutlineModification {
  id: string
  type: OutlineModificationType
  description: string
  targetId?: string
  changes: Record<string, unknown>
  reason: string
}

export interface ModificationSuggestion {
  type: OutlineModificationType
  description: string
  impact: 'minor' | 'moderate' | 'major'
  automatic: boolean
  preview?: string
}

/**
 * Apply modification to outline
 */
export function applyModification(
  outline: StoryOutline,
  modification: OutlineModification
): StoryOutline {
  const modified = { ...outline }
  
  switch (modification.type) {
    case 'reorder-chapters':
      modified.chapters = reorderChapters(
        modified.chapters,
        modification.changes.order as number[]
      )
      break
      
    case 'add-chapter':
      modified.chapters = addChapter(
        modified.chapters,
        modification.changes.chapter as ChapterOutline,
        modification.changes.position as number
      )
      break
      
    case 'remove-chapter':
      modified.chapters = removeChapter(
        modified.chapters,
        modification.targetId!
      )
      break
      
    case 'modify-chapter':
      modified.chapters = modifyChapter(
        modified.chapters,
        modification.targetId!,
        modification.changes
      )
      break
      
    case 'add-scene':
      modified.chapters = addScene(
        modified.chapters,
        modification.targetId!,
        modification.changes.scene as SceneOutline
      )
      break
      
    case 'remove-scene':
      modified.chapters = removeScene(
        modified.chapters,
        modification.targetId!,
        modification.changes.sceneNumber as number
      )
      break
      
    case 'modify-scene':
      modified.chapters = modifyScene(
        modified.chapters,
        modification.targetId!,
        modification.changes.sceneNumber as number,
        modification.changes
      )
      break
      
    case 'adjust-wordcount':
      modified.chapters = adjustWordCounts(
        modified.chapters,
        modification.changes.multiplier as number
      )
      break
      
    case 'change-emphasis':
      modified.chapters = changeEmphasis(
        modified.chapters,
        modification.changes.focus as string
      )
      break
  }
  
  // Recalculate totals
  modified.totalChapters = modified.chapters.length
  modified.estimatedWordCount = modified.chapters.reduce(
    (sum, c) => sum + c.wordCountTarget,
    0
  )
  modified.version = outline.version + 1
  modified.status = 'modified'
  
  return modified
}

function reorderChapters(
  chapters: ChapterOutline[],
  newOrder: number[]
): ChapterOutline[] {
  const reordered: ChapterOutline[] = []
  
  for (const index of newOrder) {
    if (chapters[index]) {
      reordered.push({
        ...chapters[index],
        chapterNumber: reordered.length + 1,
      })
    }
  }
  
  return reordered
}

function addChapter(
  chapters: ChapterOutline[],
  chapter: ChapterOutline,
  position: number
): ChapterOutline[] {
  const newChapters = [...chapters]
  
  // Insert at position
  newChapters.splice(position, 0, {
    ...chapter,
    chapterNumber: position + 1,
  })
  
  // Renumber subsequent chapters
  for (let i = position + 1; i < newChapters.length; i++) {
    newChapters[i] = {
      ...newChapters[i],
      chapterNumber: i + 1,
    }
  }
  
  return newChapters
}

function removeChapter(
  chapters: ChapterOutline[],
  chapterId: string
): ChapterOutline[] {
  const index = chapters.findIndex(c => c.chapterNumber === parseInt(chapterId))
  if (index === -1) return chapters
  
  const newChapters = [...chapters]
  newChapters.splice(index, 1)
  
  // Renumber chapters
  for (let i = index; i < newChapters.length; i++) {
    newChapters[i] = {
      ...newChapters[i],
      chapterNumber: i + 1,
    }
  }
  
  return newChapters
}

function modifyChapter(
  chapters: ChapterOutline[],
  chapterId: string,
  changes: Record<string, unknown>
): ChapterOutline[] {
  const index = chapters.findIndex(c => c.chapterNumber === parseInt(chapterId))
  if (index === -1) return chapters
  
  const newChapters = [...chapters]
  newChapters[index] = {
    ...newChapters[index],
    ...changes,
  } as ChapterOutline
  
  return newChapters
}

function addScene(
  chapters: ChapterOutline[],
  chapterId: string,
  scene: SceneOutline
): ChapterOutline[] {
  const index = chapters.findIndex(c => c.chapterNumber === parseInt(chapterId))
  if (index === -1) return chapters
  
  const newChapters = [...chapters]
  const chapter = newChapters[index]
  
  // Add scene with correct number
  const newScene = {
    ...scene,
    sceneNumber: chapter.scenes.length + 1,
  }
  
  newChapters[index] = {
    ...chapter,
    scenes: [...chapter.scenes, newScene],
  }
  
  return newChapters
}

function removeScene(
  chapters: ChapterOutline[],
  chapterId: string,
  sceneNumber: number
): ChapterOutline[] {
  const index = chapters.findIndex(c => c.chapterNumber === parseInt(chapterId))
  if (index === -1) return chapters
  
  const newChapters = [...chapters]
  const chapter = newChapters[index]
  
  const newScenes = chapter.scenes.filter(s => s.sceneNumber !== sceneNumber)
  
  // Renumber scenes
  for (let i = 0; i < newScenes.length; i++) {
    newScenes[i] = { ...newScenes[i], sceneNumber: i + 1 }
  }
  
  newChapters[index] = { ...chapter, scenes: newScenes }
  return newChapters
}

function modifyScene(
  chapters: ChapterOutline[],
  chapterId: string,
  sceneNumber: number,
  changes: Record<string, unknown>
): ChapterOutline[] {
  const index = chapters.findIndex(c => c.chapterNumber === parseInt(chapterId))
  if (index === -1) return chapters
  
  const newChapters = [...chapters]
  const chapter = newChapters[index]
  
  const newScenes = chapter.scenes.map(s => 
    s.sceneNumber === sceneNumber
      ? { ...s, ...changes } as SceneOutline
      : s
  )
  
  newChapters[index] = { ...chapter, scenes: newScenes }
  return newChapters
}

function adjustWordCounts(
  chapters: ChapterOutline[],
  multiplier: number
): ChapterOutline[] {
  return chapters.map(chapter => ({
    ...chapter,
    wordCountTarget: Math.round(chapter.wordCountTarget * multiplier),
  }))
}

function changeEmphasis(
  chapters: ChapterOutline[],
  focus: string
): ChapterOutline[] {
  // Modify emotional arcs based on focus
  return chapters.map(chapter => ({
    ...chapter,
    emotionalArc: `${chapter.emotionalArc} with emphasis on ${focus}`,
  }))
}

/**
 * Generate modification suggestions
 */
export function generateModificationSuggestions(
  outline: StoryOutline,
  userFeedback: string
): ModificationSuggestion[] {
  const suggestions: ModificationSuggestion[] = []
  
  const feedback = userFeedback.toLowerCase()
  
  if (feedback.includes('longer') || feedback.includes('more detail')) {
    suggestions.push({
      type: 'adjust-wordcount',
      description: 'Increase word count by 20%',
      impact: 'moderate',
      automatic: true,
      preview: `${Math.round(outline.estimatedWordCount * 1.2).toLocaleString()} words`,
    })
  }
  
  if (feedback.includes('shorter') || feedback.includes('faster')) {
    suggestions.push({
      type: 'adjust-wordcount',
      description: 'Decrease word count by 20%',
      impact: 'moderate',
      automatic: true,
      preview: `${Math.round(outline.estimatedWordCount * 0.8).toLocaleString()} words`,
    })
  }
  
  if (feedback.includes('more action')) {
    suggestions.push({
      type: 'change-emphasis',
      description: 'Emphasize action and conflict',
      impact: 'major',
      automatic: false,
    })
  }
  
  if (feedback.includes('more character')) {
    suggestions.push({
      type: 'change-emphasis',
      description: 'Emphasize character development',
      impact: 'major',
      automatic: false,
    })
  }
  
  if (feedback.includes('reorder') || feedback.includes('rearrange')) {
    suggestions.push({
      type: 'reorder-chapters',
      description: 'Suggest optimal chapter ordering',
      impact: 'major',
      automatic: false,
    })
  }
  
  if (suggestions.length === 0) {
    suggestions.push({
      type: 'modify-chapter',
      description: 'Make targeted adjustments to specific chapters',
      impact: 'minor',
      automatic: false,
    })
  }
  
  return suggestions
}

/**
 * Preview modification
 */
export function previewModification(
  outline: StoryOutline,
  modification: OutlineModification
): string {
  const modified = applyModification(outline, modification)
  
  const changes: string[] = []
  
  if (modified.totalChapters !== outline.totalChapters) {
    changes.push(`Chapters: ${outline.totalChapters} → ${modified.totalChapters}`)
  }
  
  if (modified.estimatedWordCount !== outline.estimatedWordCount) {
    changes.push(`Word count: ${outline.estimatedWordCount.toLocaleString()} → ${modified.estimatedWordCount.toLocaleString()}`)
  }
  
  return changes.join('\n') || 'No significant changes'
}

/**
 * Undo modification
 */
export function undoModification(
  currentOutline: StoryOutline,
  previousOutline: StoryOutline
): StoryOutline {
  return {
    ...previousOutline,
    userNotes: `Reverted from v${currentOutline.version}:\n${currentOutline.userNotes || ''}`,
  }
}

/**
 * Compare outlines
 */
export function compareOutlines(
  original: StoryOutline,
  modified: StoryOutline
): {
  differences: string[]
  addedChapters: number
  removedChapters: number
  wordCountDelta: number
} {
  const differences: string[] = []
  
  if (original.totalChapters !== modified.totalChapters) {
    differences.push(`Chapter count changed from ${original.totalChapters} to ${modified.totalChapters}`)
  }
  
  const addedChapters = modified.totalChapters - original.totalChapters
  const wordCountDelta = modified.estimatedWordCount - original.estimatedWordCount
  
  if (wordCountDelta !== 0) {
    differences.push(`Word count ${wordCountDelta > 0 ? 'increased' : 'decreased'} by ${Math.abs(wordCountDelta).toLocaleString()} words`)
  }
  
  return {
    differences,
    addedChapters: Math.max(0, addedChapters),
    removedChapters: Math.max(0, -addedChapters),
    wordCountDelta,
  }
}
