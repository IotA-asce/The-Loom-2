/**
 * Previous chapters context inclusion
 * Supports Gemini 1M context window
 */

import type { Chapter } from '@/lib/db/schema'

export interface PreviousChaptersContext {
  chapters: Chapter[]
  totalTokens: number
  totalPages: number
  wordCount: number
  canIncludeFullText: boolean
  includedChapters: Chapter[]
  summaryChapters: Chapter[] // For when full text doesn't fit
}

// Average tokens per word for estimation
const TOKENS_PER_WORD = 1.3
// Gemini 1M context (leave room for prompt, response, etc.)
const MAX_CONTEXT_TOKENS = 900_000

/**
 * Include all previous chapters in context
 */
export function includePreviousChapters(
  chapters: Chapter[],
  maxTokens: number = MAX_CONTEXT_TOKENS
): PreviousChaptersContext {
  const totalWordCount = chapters.reduce((sum, c) => sum + c.wordCount, 0)
  const totalTokens = Math.ceil(totalWordCount * TOKENS_PER_WORD)
  const totalPages = chapters.length
  
  const canIncludeFullText = totalTokens <= maxTokens
  
  if (canIncludeFullText) {
    return {
      chapters,
      totalTokens,
      totalPages,
      wordCount: totalWordCount,
      canIncludeFullText: true,
      includedChapters: chapters,
      summaryChapters: [],
    }
  }
  
  // Need to be selective - prioritize recent chapters
  const sortedChapters = [...chapters].sort((a, b) => b.order - a.order)
  const includedChapters: Chapter[] = []
  const summaryChapters: Chapter[] = []
  let currentTokens = 0
  
  for (const chapter of sortedChapters) {
    const chapterTokens = Math.ceil(chapter.wordCount * TOKENS_PER_WORD)
    
    if (currentTokens + chapterTokens <= maxTokens * 0.7) {
      // Include full text for recent chapters (70% of budget)
      includedChapters.unshift(chapter) // Keep chronological order
      currentTokens += chapterTokens
    } else if (currentTokens + (chapterTokens * 0.1) <= maxTokens) {
      // Include summary for older chapters (10% of original size)
      summaryChapters.unshift({
        ...chapter,
        content: generateChapterSummary(chapter),
        wordCount: Math.ceil(chapter.wordCount * 0.1),
      })
      currentTokens += Math.ceil(chapterTokens * 0.1)
    }
    // Skip very old chapters if still over budget
  }
  
  return {
    chapters,
    totalTokens: currentTokens,
    totalPages,
    wordCount: totalWordCount,
    canIncludeFullText: false,
    includedChapters,
    summaryChapters,
  }
}

/**
 * Generate summary of chapter for context
 */
function generateChapterSummary(chapter: Chapter): string {
  const parts: string[] = []
  
  parts.push(`Chapter ${chapter.order}: ${chapter.title}`)
  parts.push(`Summary: ${chapter.summary || 'No summary available'}`)
  
  if (chapter.scenes.length > 0) {
    parts.push('Key scenes:')
    for (const scene of chapter.scenes.slice(0, 3)) {
      parts.push(`- ${scene.summary}`)
    }
  }
  
  parts.push(`Characters: ${chapter.characters.join(', ')}`)
  
  return parts.join('\n')
}

/**
 * Format chapters for LLM context
 */
export function formatChaptersForContext(
  context: PreviousChaptersContext
): string {
  const parts: string[] = []
  
  parts.push(`## Previous Chapters (${context.totalPages} total)`)
  parts.push('')
  
  // Full text chapters
  for (const chapter of context.includedChapters) {
    parts.push(`### Chapter ${chapter.order}: ${chapter.title}`)
    parts.push('')
    parts.push(chapter.content)
    parts.push('')
    parts.push('---')
    parts.push('')
  }
  
  // Summary chapters
  if (context.summaryChapters.length > 0) {
    parts.push('### Earlier Chapters (Summaries)')
    parts.push('')
    
    for (const chapter of context.summaryChapters) {
      parts.push(chapter.content)
      parts.push('')
    }
  }
  
  return parts.join('\n')
}

/**
 * Get token estimate for chapters
 */
export function estimateChapterTokens(chapters: Chapter[]): number {
  const wordCount = chapters.reduce((sum, c) => sum + c.wordCount, 0)
  return Math.ceil(wordCount * TOKENS_PER_WORD)
}

/**
 * Check if full context fits in model
 */
export function checkContextFits(
  chapters: Chapter[],
  maxTokens: number = MAX_CONTEXT_TOKENS
): boolean {
  return estimateChapterTokens(chapters) <= maxTokens
}
