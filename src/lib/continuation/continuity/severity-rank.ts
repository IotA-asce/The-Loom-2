/**
 * Error severity ranking system
 */

import type { ContinuityIssue } from './validator'

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface SeverityRule {
  id: string
  name: string
  description: string
  defaultSeverity: SeverityLevel
  conditions: SeverityCondition[]
}

export interface SeverityCondition {
  when: (issue: ContinuityIssue, context: SeverityContext) => boolean
  adjustTo: SeverityLevel
}

export interface SeverityContext {
  chapterCount: number
  storyPhase: 'setup' | 'rising' | 'climax' | 'falling'
  hasUserOverride: boolean
  previousSimilarIssues: number
}

/**
 * Severity ranking rules
 */
const SEVERITY_RULES: SeverityRule[] = [
  {
    id: 'character-death',
    name: 'Character Death Continuity',
    description: 'Deceased character appearing in new scenes',
    defaultSeverity: 'critical',
    conditions: [
      {
        when: (issue, ctx) => ctx.storyPhase === 'climax',
        adjustTo: 'critical',
      },
      {
        when: (issue, ctx) => ctx.previousSimilarIssues > 2,
        adjustTo: 'high',
      },
    ],
  },
  {
    id: 'timeline',
    name: 'Timeline Consistency',
    description: 'Events occurring out of chronological order',
    defaultSeverity: 'high',
    conditions: [
      {
        when: (issue, ctx) => ctx.chapterCount < 3,
        adjustTo: 'medium',
      },
      {
        when: (issue, ctx) => ctx.storyPhase === 'climax',
        adjustTo: 'critical',
      },
    ],
  },
  {
    id: 'knowledge',
    name: 'Knowledge Consistency',
    description: 'Character knows information they shouldn\'t',
    defaultSeverity: 'medium',
    conditions: [
      {
        when: (issue, ctx) => ctx.previousSimilarIssues > 3,
        adjustTo: 'high',
      },
    ],
  },
  {
    id: 'plot-thread',
    name: 'Plot Thread Continuity',
    description: 'Plot thread state changes without explanation',
    defaultSeverity: 'medium',
    conditions: [
      {
        when: (issue, ctx) => ctx.storyPhase === 'climax',
        adjustTo: 'high',
      },
    ],
  },
  {
    id: 'world-state',
    name: 'World State Consistency',
    description: 'Contradictions in established world state',
    defaultSeverity: 'medium',
    conditions: [
      {
        when: (issue, ctx) => ctx.chapterCount > 10,
        adjustTo: 'high',
      },
    ],
  },
]

const SEVERITY_ORDER: SeverityLevel[] = ['info', 'low', 'medium', 'high', 'critical']

/**
 * Calculate severity for an issue
 */
export function calculateSeverity(
  issue: ContinuityIssue,
  context: SeverityContext
): SeverityLevel {
  // Find matching rule
  const rule = SEVERITY_RULES.find(r => {
    if (issue.type === 'character' && issue.description.includes('Deceased')) {
      return r.id === 'character-death'
    }
    if (issue.type === 'timeline') return r.id === 'timeline'
    if (issue.type === 'knowledge') return r.id === 'knowledge'
    if (issue.type === 'plot') return r.id === 'plot-thread'
    if (issue.type === 'world') return r.id === 'world-state'
    return false
  })
  
  if (!rule) {
    // Map default severity from issue type
    return mapDefaultSeverity(issue.severity)
  }
  
  // Check conditions
  for (const condition of rule.conditions) {
    if (condition.when(issue, context)) {
      return condition.adjustTo
    }
  }
  
  return rule.defaultSeverity
}

function mapDefaultSeverity(issueSeverity: 'error' | 'warning' | 'info'): SeverityLevel {
  switch (issueSeverity) {
    case 'error': return 'high'
    case 'warning': return 'medium'
    case 'info': return 'low'
  }
}

/**
 * Compare severity levels
 */
export function compareSeverity(a: SeverityLevel, b: SeverityLevel): number {
  const indexA = SEVERITY_ORDER.indexOf(a)
  const indexB = SEVERITY_ORDER.indexOf(b)
  return indexA - indexB
}

/**
 * Is severity above threshold
 */
export function isAboveThreshold(
  severity: SeverityLevel,
  threshold: SeverityLevel
): boolean {
  return compareSeverity(severity, threshold) > 0
}

/**
 * Get severity color
 */
export function getSeverityColor(severity: SeverityLevel): string {
  const colors: Record<SeverityLevel, string> = {
    critical: '#dc2626', // red-600
    high: '#ea580c',     // orange-600
    medium: '#ca8a04',   // yellow-600
    low: '#16a34a',      // green-600
    info: '#2563eb',     // blue-600
  }
  
  return colors[severity]
}

/**
 * Get severity icon
 */
export function getSeverityIcon(severity: SeverityLevel): string {
  const icons: Record<SeverityLevel, string> = {
    critical: '⚠️',
    high: '🔴',
    medium: '🟡',
    low: '🟢',
    info: 'ℹ️',
  }
  
  return icons[severity]
}

/**
 * Format severity for display
 */
export function formatSeverity(severity: SeverityLevel): string {
  return `${getSeverityIcon(severity)} ${severity.toUpperCase()}`
}

/**
 * Filter issues by minimum severity
 */
export function filterBySeverity(
  issues: ContinuityIssue[],
  minSeverity: SeverityLevel,
  context: SeverityContext
): ContinuityIssue[] {
  return issues.filter(issue => {
    const calculatedSeverity = calculateSeverity(issue, context)
    return compareSeverity(calculatedSeverity, minSeverity) >= 0
  })
}

/**
 * Rank issues by severity
 */
export function rankBySeverity(
  issues: ContinuityIssue[],
  context: SeverityContext
): Array<{ issue: ContinuityIssue; severity: SeverityLevel }> {
  const ranked = issues.map(issue => ({
    issue,
    severity: calculateSeverity(issue, context),
  }))
  
  // Sort by severity (descending)
  return ranked.sort((a, b) => -compareSeverity(a.severity, b.severity))
}

/**
 * Get severity summary
 */
export function getSeveritySummary(
  issues: ContinuityIssue[],
  context: SeverityContext
): Record<SeverityLevel, number> {
  const summary: Record<SeverityLevel, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  }
  
  for (const issue of issues) {
    const severity = calculateSeverity(issue, context)
    summary[severity]++
  }
  
  return summary
}
