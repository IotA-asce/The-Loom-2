/**
 * Chapter distribution scoring
 */

import type { ParsedTimelineEvent } from '@/lib/analysis/parser/validation'

export interface DistributionScore {
  evenness: number // 0-1, higher is more evenly distributed
  coverage: number // Percentage of chapters with anchors
  balanceScore: number
}

/**
 * Calculate chapter distribution score
 */
export function calculateChapterDistribution(
  events: ParsedTimelineEvent[],
  totalChapters: number
): DistributionScore {
  const chapterCounts = new Map<number, number>()
  events.forEach(e => {
    const chapter = e.chapterNumber || 0
    chapterCounts.set(chapter, (chapterCounts.get(chapter) || 0) + 1)
  })
  
  const counts = Array.from(chapterCounts.values())
  const chaptersWithAnchors = chapterCounts.size
  
  // Calculate evenness using coefficient of variation
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length
  const variance = counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / counts.length
  const cv = Math.sqrt(variance) / mean
  const evenness = Math.max(0, 1 - cv)
  
  const coverage = chaptersWithAnchors / totalChapters
  
  return {
    evenness,
    coverage,
    balanceScore: (evenness * 0.6) + (coverage * 0.4),
  }
}

/**
 * Validate minimum distance between anchors
 */
export function validateMinDistance(
  events: ParsedTimelineEvent[],
  minDistance: number
): { valid: boolean; violations: [number, number][] } {
  const violations: [number, number][] = []
  
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const distance = Math.abs(events[i].pageNumber - events[j].pageNumber)
      if (distance < minDistance) {
        violations.push([i, j])
      }
    }
  }
  
  return { valid: violations.length === 0, violations }
}
