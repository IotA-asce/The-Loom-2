/**
 * User cliffhanger selection per chapter
 */

import type { ChapterOutline } from './generator'

export type CliffhangerType = 
  | 'dramatic-reveal'
  | 'danger-threat'
  | 'emotional-twist'
  | 'mystery-question'
  | 'action-cut'
  | 'decision-pending'
  | 'ironic-reversal'
  | 'prophecy-vision'

export interface CliffhangerOption {
  id: string
  type: CliffhangerType
  title: string
  description: string
  emotionalImpact: string
  preview: string
}

export interface ChapterCliffhangers {
  chapterNumber: number
  selectedId?: string
  options: CliffhangerOption[]
}

/**
 * Generate cliffhanger options for chapter
 */
export function generateCliffhangerOptions(
  chapter: ChapterOutline,
  count: number = 3
): CliffhangerOption[] {
  const types: CliffhangerType[] = [
    'dramatic-reveal',
    'danger-threat',
    'emotional-twist',
    'mystery-question',
    'action-cut',
    'decision-pending',
  ]
  
  const options: CliffhangerOption[] = []
  
  for (let i = 0; i < count && i < types.length; i++) {
    const type = types[i]
    options.push(generateOptionForType(type, chapter))
  }
  
  return options
}

function generateOptionForType(
  type: CliffhangerType,
  chapter: ChapterOutline
): CliffhangerOption {
  const templates: Record<CliffhangerType, {
    title: string
    description: string
    emotionalImpact: string
  }> = {
    'dramatic-reveal': {
      title: 'The Revelation',
      description: 'A crucial secret is revealed that changes everything',
      emotionalImpact: 'Shock and realization',
    },
    'danger-threat': {
      title: 'Imminent Danger',
      description: 'Characters face sudden, immediate peril',
      emotionalImpact: 'Fear and urgency',
    },
    'emotional-twist': {
      title: 'Emotional Turn',
      description: 'A relationship shifts unexpectedly',
      emotionalImpact: 'Surprise and confusion',
    },
    'mystery-question': {
      title: 'Unanswered Question',
      description: 'A new mystery emerges without resolution',
      emotionalImpact: 'Curiosity and unease',
    },
    'action-cut': {
      title: 'Mid-Action Cut',
      description: 'Action sequence cuts at the critical moment',
      emotionalImpact: 'Suspense and excitement',
    },
    'decision-pending': {
      title: 'The Choice',
      description: 'Character must make a crucial decision',
      emotionalImpact: 'Anticipation and tension',
    },
    'ironic-reversal': {
      title: 'Ironic Twist',
      description: 'Events unfold with painful irony',
      emotionalImpact: 'Dread and inevitability',
    },
    'prophecy-vision': {
      title: 'The Vision',
      description: 'Character sees glimpse of future',
      emotionalImpact: 'Awe and foreboding',
    },
  }
  
  const template = templates[type]
  
  return {
    id: `cliffhanger-${type}-${Date.now()}`,
    type,
    title: template.title,
    description: template.description,
    emotionalImpact: template.emotionalImpact,
    preview: generatePreview(type, chapter),
  }
}

function generatePreview(type: CliffhangerType, chapter: ChapterOutline): string {
  const previews: Record<CliffhangerType, string[]> = {
    'dramatic-reveal': [
      `And then they saw who had been behind it all...`,
      `The letter revealed a truth that would change everything...`,
      `"You're not who I thought you were," she said...`,
    ],
    'danger-threat': [
      `The shadow moved, and they realized they weren't alone...`,
      `The door slammed shut, trapping them inside...`,
      `The blade gleamed in the moonlight as it descended...`,
    ],
    'emotional-twist': [
      `"I never loved you," the words hung in the air...`,
      `Their eyes met, and in that moment, everything changed...`,
      `The confession came, but not the one they expected...`,
    ],
    'mystery-question': [
      `But if he was there, then who was in the room?`,
      `The answer only led to more questions...`,
      `Three words that made no sense: "Check the attic."`,
    ],
    'action-cut': [
      `The gun fired—`,
      `She leaped, not knowing if she would—`,
      `The blade struck home as the world went—`,
    ],
    'decision-pending': [
      `Two paths lay before them. Which would they choose?`,
      `The offer hung in the air, waiting for an answer...`,
      `Save one or save many—the choice was theirs...`,
    ],
    'ironic-reversal': [
      `They had come to save him, but he was already—`,
      `The weapon they sought had been theirs all along...`,
      `Victory, it turned out, tasted like defeat...`,
    ],
    'prophecy-vision': [
      `The vision came, showing a future they couldn't prevent...`,
      `Seven days, the voice whispered. You have seven days...`,
      `They saw the end, and it was only the beginning...`,
    ],
  }
  
  const typePreviews = previews[type]
  return typePreviews[chapter.chapterNumber % typePreviews.length]
}

/**
 * Select cliffhanger for chapter
 */
export function selectCliffhanger(
  cliffhangers: ChapterCliffhangers,
  optionId: string
): ChapterCliffhangers {
  return {
    ...cliffhangers,
    selectedId: optionId,
  }
}

/**
 * Apply selected cliffhanger to chapter
 */
export function applyCliffhangerToChapter(
  chapter: ChapterOutline,
  cliffhangers: ChapterCliffhangers
): ChapterOutline {
  if (!cliffhangers.selectedId) return chapter
  
  const selected = cliffhangers.options.find(o => o.id === cliffhangers.selectedId)
  if (!selected) return chapter
  
  return {
    ...chapter,
    cliffhanger: `${selected.title}: ${selected.preview}`,
  }
}

/**
 * Generate cliffhangers for all chapters
 */
export function generateAllChapterCliffhangers(
  chapters: ChapterOutline[]
): ChapterCliffhangers[] {
  return chapters.map(chapter => ({
    chapterNumber: chapter.chapterNumber,
    options: generateCliffhangerOptions(chapter, 3),
  }))
}

/**
 * Get cliffhanger type description
 */
export function getCliffhangerTypeDescription(type: CliffhangerType): string {
  const descriptions: Record<CliffhangerType, string> = {
    'dramatic-reveal': 'A truth is exposed that reshapes understanding',
    'danger-threat': 'Physical peril creates immediate suspense',
    'emotional-twist': 'Relationship dynamics shift unexpectedly',
    'mystery-question': 'New questions arise without answers',
    'action-cut': 'Mid-action interruption creates momentum',
    'decision-pending': 'A crucial choice looms unresolved',
    'ironic-reversal': 'Events turn with painful irony',
    'prophecy-vision': 'Future knowledge creates dread or hope',
  }
  
  return descriptions[type]
}

/**
 * Get cliffhanger intensity
 */
export function getCliffhangerIntensity(type: CliffhangerType): number {
  const intensities: Record<CliffhangerType, number> = {
    'dramatic-reveal': 8,
    'danger-threat': 9,
    'emotional-twist': 7,
    'mystery-question': 6,
    'action-cut': 8,
    'decision-pending': 7,
    'ironic-reversal': 7,
    'prophecy-vision': 8,
  }
  
  return intensities[type]
}

/**
 * Validate cliffhanger selection
 */
export function validateCliffhangerSelection(
  cliffhangers: ChapterCliffhangers[],
  selectedIds: Map<number, string>
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = []
  
  // Check for too many similar cliffhangers in sequence
  let consecutiveSimilar = 0
  let lastType: CliffhangerType | undefined
  
  for (let i = 0; i < cliffhangers.length; i++) {
    const chapterCliffhangers = cliffhangers[i]
    const selectedId = selectedIds.get(chapterCliffhangers.chapterNumber)
    
    if (selectedId) {
      const selected = chapterCliffhangers.options.find(o => o.id === selectedId)
      
      if (selected) {
        if (selected.type === lastType) {
          consecutiveSimilar++
          if (consecutiveSimilar >= 2) {
            warnings.push(`Chapters ${i} and ${i + 1} have similar ${selected.type} cliffhangers`)
          }
        } else {
          consecutiveSimilar = 0
          lastType = selected.type
        }
      }
    }
  }
  
  // Check for missing selections
  const missing = cliffhangers.filter(c => !selectedIds.has(c.chapterNumber))
  if (missing.length > 0) {
    warnings.push(`${missing.length} chapter(s) missing cliffhanger selection`)
  }
  
  return {
    valid: warnings.length === 0,
    warnings,
  }
}

/**
 * Auto-select cliffhangers based on pattern
 */
export function autoSelectCliffhangers(
  cliffhangers: ChapterCliffhangers[],
  pattern: 'varied' | 'intense' | 'mystery' | 'emotional' = 'varied'
): Map<number, string> {
  const selected = new Map<number, string>()
  
  const typePreferences: Record<typeof pattern, CliffhangerType[]> = {
    varied: ['dramatic-reveal', 'danger-threat', 'emotional-twist', 'mystery-question', 'action-cut'],
    intense: ['danger-threat', 'action-cut', 'dramatic-reveal', 'decision-pending'],
    mystery: ['mystery-question', 'dramatic-reveal', 'prophecy-vision', 'ironic-reversal'],
    emotional: ['emotional-twist', 'decision-pending', 'dramatic-reveal', 'ironic-reversal'],
  }
  
  const preferences = typePreferences[pattern]
  
  for (let i = 0; i < cliffhangers.length; i++) {
    const chapterCliffhangers = cliffhangers[i]
    
    // Find option matching preference
    const preferredType = preferences[i % preferences.length]
    const option = chapterCliffhangers.options.find(o => o.type === preferredType)
      || chapterCliffhangers.options[0]
    
    if (option) {
      selected.set(chapterCliffhangers.chapterNumber, option.id)
    }
  }
  
  return selected
}

/**
 * Format cliffhanger options for display
 */
export function formatCliffhangerOptions(
  cliffhangers: ChapterCliffhangers
): string {
  const parts: string[] = []
  
  parts.push(`## Chapter ${cliffhangers.chapterNumber} Cliffhanger Options`)
  parts.push('')
  
  for (const option of cliffhangers.options) {
    const isSelected = option.id === cliffhangers.selectedId
    parts.push(`${isSelected ? '✓' : '○'} **${option.title}** (${option.type})`)
    parts.push(`   ${option.description}`)
    parts.push(`   Preview: "${option.preview}"`)
    parts.push(`   Emotional impact: ${option.emotionalImpact}`)
    parts.push('')
  }
  
  return parts.join('\n')
}
