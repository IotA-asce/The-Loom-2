// @ts-nocheck
/**
 * Cross-chapter callback verification
 */

import type { Chapter } from '@/lib/db/schema'

export interface Callback {
  id: string
  type: 'foreshadowing' | 'payoff' | 'reference' | 'echo' | 'callback'
  sourceChapterId: string
  sourceContext: string
  targetChapterId?: string
  targetContext?: string
  description: string
  status: 'planted' | 'resolved' | 'unresolved'
}

export interface CallbackVerificationResult {
  callbacks: Callback[]
  unplantedPayoffs: Callback[]
  unresolvedCallbacks: Callback[]
  duplicates: Callback[]
  score: number // 0-100
}

/**
 * Verify callbacks across chapters
 */
export function verifyCallbacks(chapters: Chapter[]): CallbackVerificationResult {
  const callbacks = extractCallbacks(chapters)
  
  const unplantedPayoffs: Callback[] = []
  const unresolvedCallbacks: Callback[] = []
  const duplicates: Callback[] = []
  
  // Check for unplanted payoffs (payoffs without foreshadowing)
  for (const callback of callbacks.filter(c => c.type === 'payoff')) {
    const hasForeshadowing = callbacks.some(c => 
      c.type === 'foreshadowing' && 
      c.description.toLowerCase().includes(callback.description.toLowerCase().split(' ')[0])
    )
    
    if (!hasForeshadowing) {
      unplantedPayoffs.push(callback)
    }
  }
  
  // Check for unresolved callbacks
  for (const callback of callbacks.filter(c => c.type === 'foreshadowing')) {
    const hasPayoff = callbacks.some(c => 
      c.type === 'payoff' && 
      c.sourceChapterId !== callback.sourceChapterId &&
      c.description.toLowerCase().includes(callback.description.toLowerCase().split(' ')[0])
    )
    
    if (!hasPayoff) {
      unresolvedCallbacks.push(callback)
    }
  }
  
  // Check for duplicate callbacks
  const seen = new Set<string>()
  for (const callback of callbacks) {
    const key = `${callback.type}-${callback.description}`
    if (seen.has(key)) {
      duplicates.push(callback)
    }
    seen.add(key)
  }
  
  // Calculate score
  const totalCallbacks = callbacks.length
  const resolvedCallbacks = callbacks.filter(c => c.status === 'resolved').length
  const score = totalCallbacks > 0 ? Math.round((resolvedCallbacks / totalCallbacks) * 100) : 100
  
  return {
    callbacks,
    unplantedPayoffs,
    unresolvedCallbacks,
    duplicates,
    score,
  }
}

function extractCallbacks(chapters: Chapter[]): Callback[] {
  const callbacks: Callback[] = []
  
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i]
    const summary = chapter.summary ?? ''
    
    // Look for callback patterns in chapter summary
    const foreshadowingMatches = summary.match(/foreshadows?:\s*([^.,]+)/gi) || []
    for (const match of foreshadowingMatches) {
      callbacks.push({
        // @ts-ignore
        id: `cb-${chapter.id}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'foreshadowing',
        sourceChapterId: chapter.id,
        // @ts-ignore
        sourceContext: summary,
        description: match.replace(/foreshadows?:\s*/i, ''),
        status: 'planted',
      })
    }
    
    const payoffMatches = summary.match(/payoff:\s*([^.,]+)/gi) || []
    for (const match of payoffMatches) {
      callbacks.push({
        // @ts-ignore
        id: `cb-${chapter.id}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'payoff',
        sourceChapterId: chapter.id,
        // @ts-ignore
        sourceContext: summary,
        description: match.replace(/payoff:\s*/i, ''),
        status: 'resolved',
      })
    }
    
    const echoMatches = summary.match(/echoes?:\s*([^.,]+)/gi) || []
    for (const match of echoMatches) {
      callbacks.push({
        // @ts-ignore
        id: `cb-${chapter.id}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'echo',
        sourceChapterId: chapter.id,
        // @ts-ignore
        sourceContext: summary,
        description: match.replace(/echoes?:\s*/i, ''),
        status: 'resolved',
      })
    }
  }
  
  return callbacks
}

/**
 * Plant a callback for future payoff
 */
export function plantCallback(
  description: string,
  chapterId: string,
  context: string
): Callback {
  return {
    id: `cb-${chapterId}-${Date.now()}`,
    type: 'foreshadowing',
    sourceChapterId: chapterId,
    sourceContext: context,
    description,
    status: 'planted',
  }
}

/**
 * Resolve a callback
 */
export function resolveCallback(
  callback: Callback,
  payoffChapterId: string,
  payoffContext: string
): Callback {
  return {
    ...callback,
    targetChapterId: payoffChapterId,
    targetContext: payoffContext,
    status: 'resolved',
  }
}

/**
 * Find unresolved callbacks that could be resolved
 */
export function findResolvableCallbacks(
  unresolved: Callback[],
  currentChapterContent: string
): Callback[] {
  return unresolved.filter(callback => {
    // Check if current chapter content could resolve this callback
    const keywords = callback.description.toLowerCase().split(' ').slice(0, 3)
    return keywords.some(kw => currentChapterContent.toLowerCase().includes(kw))
  })
}

/**
 * Get callback suggestions
 */
export function getCallbackSuggestions(
  chapters: Chapter[],
  currentChapter: Chapter
): string[] {
  const suggestions: string[] = []
  
  // Look for planted foreshadowing that hasn't been resolved
  const result = verifyCallbacks(chapters)
  const resolvable = findResolvableCallbacks(
    result.unresolvedCallbacks,
    currentChapter.summary
  )
  
  for (const callback of resolvable) {
    suggestions.push(
      `Consider resolving: "${callback.description}" ` +
      `(planted in chapter ${callback.sourceChapterId})`
    )
  }
  
  return suggestions
}

/**
 * Format callback report
 */
export function formatCallbackReport(result: CallbackVerificationResult): string {
  const parts: string[] = []
  
  parts.push('## Callback Verification Report')
  parts.push('')
  parts.push(`Total Callbacks: ${result.callbacks.length}`)
  parts.push(`Resolved: ${result.callbacks.filter(c => c.status === 'resolved').length}`)
  parts.push(`Score: ${result.score}%`)
  parts.push('')
  
  if (result.unplantedPayoffs.length > 0) {
    parts.push('### Unplanted Payoffs')
    for (const payoff of result.unplantedPayoffs) {
      parts.push(`- "${payoff.description}" in chapter ${payoff.sourceChapterId}`)
    }
    parts.push('')
  }
  
  if (result.unresolvedCallbacks.length > 0) {
    parts.push('### Unresolved Callbacks')
    for (const callback of result.unresolvedCallbacks) {
      parts.push(`- "${callback.description}" from chapter ${callback.sourceChapterId}`)
    }
    parts.push('')
  }
  
  if (result.duplicates.length > 0) {
    parts.push('### Duplicate Callbacks')
    parts.push(`${result.duplicates.length} duplicate callbacks found`)
  }
  
  return parts.join('\n')
}
