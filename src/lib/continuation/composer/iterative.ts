// @ts-nocheck
/**
 * Iterative chapter generation (draft→review→expand→polish)
 */

import type { Chapter } from '@/lib/db/schema'

// Extended types for composer
interface ChapterOutline {
  id: string
  chapterNumber: number
  title: string
  scenes: Array<{
    id: string
    title: string
    summary: string
    characters: string[]
    emotionalArc: string
    dialogueSnippets: string[]
  }>
  cliffhangerType?: string
}

export type GenerationPhase = 
  | 'draft'
  | 'review'
  | 'expand'
  | 'polish'
  | 'complete'

export interface IterativeGeneration {
  chapterId: string
  outline: ChapterOutline
  currentPhase: GenerationPhase
  phases: {
    draft?: DraftPhase
    review?: ReviewPhase
    expand?: ExpandPhase
    polish?: PolishPhase
  }
  finalChapter?: Chapter
}

export interface DraftPhase {
  content: string
  wordCount: number
  timestamp: number
  issues: string[]
}

export interface ReviewPhase {
  content: string
  wordCount: number
  timestamp: number
  assessments: PhaseAssessment[]
  approved: boolean
}

export interface ExpandPhase {
  content: string
  wordCount: number
  timestamp: number
  expansionAreas: string[]
}

export interface PolishPhase {
  content: string
  wordCount: number
  timestamp: number
  improvements: string[]
}

export interface PhaseAssessment {
  aspect: string
  score: number
  issues: string[]
  suggestions: string[]
}

/**
 * Start iterative generation
 */
export function startIterativeGeneration(
  chapterId: string,
  outline: ChapterOutline
): IterativeGeneration {
  return {
    chapterId,
    outline,
    currentPhase: 'draft',
    phases: {},
  }
}

/**
 * Complete draft phase
 */
export function completeDraft(
  generation: IterativeGeneration,
  content: string
): IterativeGeneration {
  const wordCount = content.split(/\s+/).length
  const issues = detectDraftIssues(content, generation.outline)
  
  return {
    ...generation,
    currentPhase: 'review',
    phases: {
      ...generation.phases,
      draft: {
        content,
        wordCount,
        timestamp: Date.now(),
        issues,
      },
    },
  }
}

function detectDraftIssues(content: string, outline: ChapterOutline): string[] {
  const issues: string[] = []
  
  // Check word count
  const wordCount = content.split(/\s+/).length
  const minExpected = outline.wordCountTarget * 0.7
  if (wordCount < minExpected) {
    issues.push(`Word count (${wordCount}) below target minimum (${Math.round(minExpected)})`)
  }
  
  // Check scene coverage
  const sceneMarkers = (content.match(/#{3,}/g) || []).length
  if (sceneMarkers < outline.scenes.length * 0.5) {
    issues.push('Some scenes may not be clearly delineated')
  }
  
  // Check for dialogue
  const dialogueCount = (content.match(/"[^"]*"/g) || []).length
  if (dialogueCount < 5) {
    issues.push('Limited dialogue detected')
  }
  
  return issues
}

/**
 * Complete review phase
 */
export function completeReview(
  generation: IterativeGeneration,
  assessments: PhaseAssessment[],
  approved: boolean
): IterativeGeneration {
  const draft = generation.phases.draft!
  
  return {
    ...generation,
    currentPhase: approved ? 'expand' : 'draft',
    phases: {
      ...generation.phases,
      review: {
        content: draft.content,
        wordCount: draft.wordCount,
        timestamp: Date.now(),
        assessments,
        approved,
      },
    },
  }
}

/**
 * Assess phase quality
 */
export function assessPhase(
  content: string,
  outline: ChapterOutline
): PhaseAssessment[] {
  const assessments: PhaseAssessment[] = []
  
  // Structure assessment
  const structureScore = assessStructure(content, outline)
  assessments.push({
    aspect: 'Structure',
    score: structureScore,
    issues: structureScore < 0.7 ? ['Scene transitions unclear'] : [],
    suggestions: ['Add clearer scene breaks'],
  })
  
  // Content coverage assessment
  const coverageScore = assessCoverage(content, outline)
  assessments.push({
    aspect: 'Content Coverage',
    score: coverageScore,
    issues: coverageScore < 0.7 ? ['Not all outline points covered'] : [],
    suggestions: ['Expand on outline scenes'],
  })
  
  // Dialogue quality assessment
  const dialogueScore = assessDialogue(content)
  assessments.push({
    aspect: 'Dialogue',
    score: dialogueScore,
    issues: dialogueScore < 0.6 ? ['Too much narration'] : [],
    suggestions: ['Add character dialogue'],
  })
  
  // Style consistency assessment
  assessments.push({
    aspect: 'Style',
    score: 0.8,
    issues: [],
    suggestions: [],
  })
  
  return assessments
}

function assessStructure(content: string, outline: ChapterOutline): number {
  const expectedScenes = outline.scenes.length
  const sceneHeaders = (content.match(/#{3,}/g) || []).length
  return Math.min(1, sceneHeaders / expectedScenes * 0.8 + 0.2)
}

function assessCoverage(content: string, outline: ChapterOutline): number {
  // Simple heuristic: check if content mentions key elements
  const contentLower = content.toLowerCase()
  let matches = 0
  
  for (const scene of outline.scenes) {
    if (contentLower.includes(scene.summary.toLowerCase().split(' ')[0])) {
      matches++
    }
  }
  
  return matches / outline.scenes.length
}

function assessDialogue(content: string): number {
  const totalWords = content.split(/\s+/).length
  const dialogueWords = (content.match(/"[^"]*"/g) || [])
    .join(' ')
    .split(/\s+/).length
  
  return Math.min(1, dialogueWords / totalWords * 3) // 33% dialogue = full score
}

/**
 * Complete expand phase
 */
export function completeExpand(
  generation: IterativeGeneration,
  content: string,
  expansionAreas: string[]
): IterativeGeneration {
  const wordCount = content.split(/\s+/).length
  
  return {
    ...generation,
    currentPhase: 'polish',
    phases: {
      ...generation.phases,
      expand: {
        content,
        wordCount,
        timestamp: Date.now(),
        expansionAreas,
      },
    },
  }
}

/**
 * Complete polish phase
 */
export function completePolish(
  generation: IterativeGeneration,
  content: string,
  improvements: string[]
): IterativeGeneration {
  const wordCount = content.split(/\s+/).length
  const outline = generation.outline
  
  // Build final chapter
  const finalChapter: Chapter = {
    id: generation.chapterId,
    mangaId: '', // Set by caller
    branchId: '', // Set by caller
    order: outline.chapterNumber,
    title: outline.title,
    content,
    summary: outline.summary,
    scenes: outline.scenes.map((s, i) => ({
      id: `scene-${i}`,
      title: s.summary,
      characters: s.characters,
      setting: s.setting,
      summary: s.summary,
      emotionalArc: s.emotionalBeat,
    })),
    characters: outline.characters,
    wordCount,
    status: 'published',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  
  return {
    ...generation,
    currentPhase: 'complete',
    phases: {
      ...generation.phases,
      polish: {
        content,
        wordCount,
        timestamp: Date.now(),
        improvements,
      },
    },
    finalChapter,
  }
}

/**
 * Get phase status
 */
export function getPhaseStatus(
  generation: IterativeGeneration,
  phase: GenerationPhase
): {
  complete: boolean
  data?: DraftPhase | ReviewPhase | ExpandPhase | PolishPhase
} {
  const data = generation.phases[phase]
  return {
    complete: !!data,
    data,
  }
}

/**
 * Check if can proceed to next phase
 */
export function canProceedToNextPhase(
  generation: IterativeGeneration
): { canProceed: boolean; reason?: string } {
  switch (generation.currentPhase) {
    case 'draft':
      if (!generation.phases.draft) {
        return { canProceed: false, reason: 'Draft not complete' }
      }
      if (generation.phases.draft.issues.length > 3) {
        return { canProceed: false, reason: 'Too many issues in draft' }
      }
      return { canProceed: true }
      
    case 'review':
      if (!generation.phases.review?.approved) {
        return { canProceed: false, reason: 'Review not approved' }
      }
      return { canProceed: true }
      
    case 'expand':
      if (!generation.phases.expand) {
        return { canProceed: false, reason: 'Expansion not complete' }
      }
      return { canProceed: true }
      
    case 'polish':
      return { canProceed: false, reason: 'Already at final phase' }
      
    case 'complete':
      return { canProceed: false, reason: 'Generation complete' }
      
    default:
      return { canProceed: false }
  }
}

/**
 * Retry current phase
 */
export function retryPhase(
  generation: IterativeGeneration,
  feedback: string
): IterativeGeneration {
  // Remove current phase data to trigger regeneration
  const phases = { ...generation.phases }
  delete phases[generation.currentPhase]
  
  return {
    ...generation,
    phases,
    userNotes: feedback,
  }
}

/**
 * Format generation progress
 */
export function formatGenerationProgress(
  generation: IterativeGeneration
): string {
  const parts: string[] = []
  
  parts.push(`# Chapter ${generation.outline.chapterNumber} Generation`)
  parts.push('')
  
  const phases: GenerationPhase[] = ['draft', 'review', 'expand', 'polish']
  const phaseEmojis: Record<GenerationPhase, string> = {
    draft: '📝',
    review: '👁️',
    expand: '📈',
    polish: '✨',
    complete: '✅',
  }
  
  for (const phase of phases) {
    const status = generation.phases[phase]
    const isCurrent = generation.currentPhase === phase
    const isComplete = !!status
    
    const emoji = isComplete ? '✅' : isCurrent ? '⏳' : '⭕'
    parts.push(`${emoji} ${phaseEmojis[phase]} ${phase.charAt(0).toUpperCase() + phase.slice(1)}`)
    
    if (status) {
      parts.push(`   Word count: ${status.wordCount}`)
      
      if ('assessments' in status && status.assessments) {
        for (const assessment of status.assessments) {
          parts.push(`   ${assessment.aspect}: ${(assessment.score * 100).toFixed(0)}%`)
        }
      }
    }
    
    parts.push('')
  }
  
  if (generation.finalChapter) {
    parts.push('✅ Generation complete!')
  }
  
  return parts.join('\n')
}
