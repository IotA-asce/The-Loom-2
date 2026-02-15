/**
 * Diversity constraints for anchor candidates
 */

import type { ParsedTimelineEvent } from '@/lib/analysis/parser/validation'

export interface DiversityConfig {
  minDistance: number // Minimum pages between anchors
  maxPerChapter: number
  spreadAcrossChapters?: boolean  // Optional
}

/**
 * Apply diversity constraints to filter events
 */
export function applyDiversityConstraints(
  events: ParsedTimelineEvent[],
  config: DiversityConfig
): ParsedTimelineEvent[] {
  const selected: ParsedTimelineEvent[] = []
  const chapterCounts = new Map<number, number>()
  
  for (const event of events) {
    // Check distance from last selected
    const tooClose = selected.some(s => 
      Math.abs(s.pageNumber - event.pageNumber) < config.minDistance
    )
    if (tooClose) continue
    
    // Check chapter limit
    const chapter = event.chapterNumber || 0
    const currentCount = chapterCounts.get(chapter) || 0
    if (currentCount >= config.maxPerChapter) continue
    
    selected.push(event)
    chapterCounts.set(chapter, currentCount + 1)
  }
  
  return selected
}
