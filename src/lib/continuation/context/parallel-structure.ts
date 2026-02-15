/**
 * Full parallel structure support
 */

import type { BranchVariation } from '@/lib/branches/variation/generator'
import type { Chapter } from '@/lib/db/schema'

export interface ParallelBranch {
  branchId: string
  branchName: string
  chapters: Chapter[]
  currentChapter: number
  status: 'active' | 'paused' | 'complete'
  lastUpdated: number
}

export interface ParallelStructure {
  branches: ParallelBranch[]
  activeBranchId: string | null
  crossReferences: CrossReference[]
  timeline: ParallelTimeline
}

export interface CrossReference {
  id: string
  fromBranchId: string
  fromChapterOrder: number
  toBranchId: string
  toChapterOrder: number
  type: 'event' | 'character' | 'theme' | 'callback'
  description: string
}

export interface ParallelTimeline {
  events: TimelineEvent[]
}

export interface TimelineEvent {
  id: string
  timestamp: number
  description: string
  branchEvents: BranchTimelineEvent[]
}

export interface BranchTimelineEvent {
  branchId: string
  chapterOrder: number
  eventDescription: string
}

/**
 * Initialize parallel structure
 */
export function initializeParallelStructure(
  branches: BranchVariation[]
): ParallelStructure {
  const parallelBranches: ParallelBranch[] = branches.map(branch => ({
    branchId: branch.id,
    branchName: branch.premise.title,
    chapters: [],
    currentChapter: 0,
    status: 'active',
    lastUpdated: Date.now(),
  }))
  
  return {
    branches: parallelBranches,
    activeBranchId: parallelBranches[0]?.branchId || null,
    crossReferences: [],
    timeline: { events: [] },
  }
}

/**
 * Add chapter to a branch
 */
export function addChapterToBranch(
  structure: ParallelStructure,
  branchId: string,
  chapter: Chapter
): ParallelStructure {
  const updatedBranches = structure.branches.map(branch => {
    if (branch.branchId !== branchId) return branch
    
    return {
      ...branch,
      chapters: [...branch.chapters, chapter],
      currentChapter: chapter.order,
      lastUpdated: Date.now(),
    }
  })
  
  // Add to timeline
  const timelineEvent: TimelineEvent = {
    id: `event-${Date.now()}`,
    timestamp: Date.now(),
    description: `Chapter ${chapter.order} written in ${branchId}`,
    branchEvents: [{
      branchId,
      chapterOrder: chapter.order,
      eventDescription: chapter.title,
    }],
  }
  
  return {
    ...structure,
    branches: updatedBranches,
    timeline: {
      events: [...structure.timeline.events, timelineEvent],
    },
  }
}

/**
 * Switch active branch
 */
export function switchActiveBranch(
  structure: ParallelStructure,
  branchId: string
): ParallelStructure {
  return {
    ...structure,
    activeBranchId: branchId,
  }
}

/**
 * Pause a branch
 */
export function pauseBranch(
  structure: ParallelStructure,
  branchId: string
): ParallelStructure {
  return {
    ...structure,
    branches: structure.branches.map(b => 
      b.branchId === branchId ? { ...b, status: 'paused' as const } : b
    ),
  }
}

/**
 * Resume a branch
 */
export function resumeBranch(
  structure: ParallelStructure,
  branchId: string
): ParallelStructure {
  return {
    ...structure,
    branches: structure.branches.map(b => 
      b.branchId === branchId ? { ...b, status: 'active' as const } : b
    ),
  }
}

/**
 * Mark branch as complete
 */
export function completeBranch(
  structure: ParallelStructure,
  branchId: string
): ParallelStructure {
  return {
    ...structure,
    branches: structure.branches.map(b => 
      b.branchId === branchId ? { ...b, status: 'complete' as const } : b
    ),
  }
}

/**
 * Add cross-reference between branches
 */
export function addCrossReference(
  structure: ParallelStructure,
  reference: Omit<CrossReference, 'id'>
): ParallelStructure {
  const newReference: CrossReference = {
    ...reference,
    id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  }
  
  return {
    ...structure,
    crossReferences: [...structure.crossReferences, newReference],
  }
}

/**
 * Get chapters from all branches at a specific order
 */
export function getChaptersAtOrder(
  structure: ParallelStructure,
  order: number
): Array<{ branchId: string; chapter: Chapter | undefined }> {
  return structure.branches.map(branch => ({
    branchId: branch.branchId,
    chapter: branch.chapters.find(c => c.order === order),
  }))
}

/**
 * Get cross-references for a chapter
 */
export function getChapterCrossReferences(
  structure: ParallelStructure,
  branchId: string,
  chapterOrder: number
): CrossReference[] {
  return structure.crossReferences.filter(ref =>
    (ref.fromBranchId === branchId && ref.fromChapterOrder === chapterOrder) ||
    (ref.toBranchId === branchId && ref.toChapterOrder === chapterOrder)
  )
}

/**
 * Get progress across all branches
 */
export function getParallelProgress(
  structure: ParallelStructure
): {
  totalChapters: number
  chaptersByBranch: Record<string, number>
  completionPercentage: number
} {
  const chaptersByBranch: Record<string, number> = {}
  let totalChapters = 0
  
  for (const branch of structure.branches) {
    chaptersByBranch[branch.branchId] = branch.chapters.length
    totalChapters += branch.chapters.length
  }
  
  // Estimate completion based on branch expected lengths
  const activeBranches = structure.branches.filter(b => b.status !== 'complete')
  const expectedTotal = activeBranches.reduce((sum, b) => sum + 10, 0) // Assume 10 chapters per active branch
  
  return {
    totalChapters,
    chaptersByBranch,
    completionPercentage: expectedTotal > 0 ? totalChapters / expectedTotal : 0,
  }
}

/**
 * Format parallel structure for context
 */
export function formatParallelStructureForContext(
  structure: ParallelStructure
): string {
  const parts: string[] = []
  
  parts.push('## Parallel Story Structure')
  parts.push('')
  
  for (const branch of structure.branches) {
    parts.push(`### ${branch.branchName}`)
    parts.push(`Status: ${branch.status}`)
    parts.push(`Chapters: ${branch.chapters.length}`)
    parts.push(`Current: Chapter ${branch.currentChapter}`)
    
    if (branch.chapters.length > 0) {
      parts.push('Recent chapters:')
      for (const chapter of branch.chapters.slice(-3)) {
        parts.push(`- Chapter ${chapter.order}: ${chapter.title}`)
      }
    }
    
    parts.push('')
  }
  
  // Cross-references
  if (structure.crossReferences.length > 0) {
    parts.push('### Cross-References')
    for (const ref of structure.crossReferences.slice(-5)) {
      parts.push(`- ${ref.type}: ${ref.description}`)
    }
    parts.push('')
  }
  
  return parts.join('\n')
}

/**
 * Find parallel events (same chapter order across branches)
 */
export function findParallelEvents(
  structure: ParallelStructure,
  chapterOrder: number
): TimelineEvent[] {
  return structure.timeline.events.filter(event =>
    event.branchEvents.some(be => be.chapterOrder === chapterOrder)
  )
}

/**
 * Get branch comparison at specific point
 */
export function compareBranchesAtPoint(
  structure: ParallelStructure,
  chapterOrder: number
): Array<{ branchId: string; hasChapter: boolean; chapter?: Chapter }> {
  return structure.branches.map(branch => {
    const chapter = branch.chapters.find(c => c.order === chapterOrder)
    return {
      branchId: branch.branchId,
      hasChapter: !!chapter,
      chapter,
    }
  })
}
