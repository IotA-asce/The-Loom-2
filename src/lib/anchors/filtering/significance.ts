/**
 * Significance-based candidate filtering
 */

import type { ParsedTimelineEvent } from '@/lib/analysis/parser/validation'

export type SignificanceLevel = 'minor' | 'moderate' | 'major' | 'critical'

export const SIGNIFICANCE_WEIGHTS: Record<SignificanceLevel, number> = {
  minor: 1,
  moderate: 2,
  major: 4,
  critical: 8,
}

/**
 * Filter events by minimum significance level
 */
export function filterBySignificance(
  events: ParsedTimelineEvent[],
  minLevel: SignificanceLevel = 'moderate'
): ParsedTimelineEvent[] {
  const levels: SignificanceLevel[] = ['minor', 'moderate', 'major', 'critical']
  const minIndex = levels.indexOf(minLevel)

  return events.filter(event => {
    const eventIndex = levels.indexOf(event.significance as SignificanceLevel)
    return eventIndex >= minIndex
  })
}

/**
 * Check if event meets significance threshold
 */
export function meetsSignificanceThreshold(
  event: ParsedTimelineEvent,
  threshold: SignificanceLevel
): boolean {
  const levels: SignificanceLevel[] = ['minor', 'moderate', 'major', 'critical']
  return levels.indexOf(event.significance as SignificanceLevel) >= levels.indexOf(threshold)
}
