/**
 * Context-aware strictness levels
 */

export type StrictnessLevel = 'strict' | 'moderate' | 'lenient'

export interface StrictnessContext {
  storyPhase: 'setup' | 'rising' | 'climax' | 'falling'
  chapterCount: number
  hasUserEdits: boolean
  complexity: 'simple' | 'moderate' | 'complex'
  userPreference?: StrictnessLevel
}

export interface StrictnessConfig {
  level: StrictnessLevel
  rules: {
    characterContinuity: boolean
    timelineConsistency: boolean
    plotThreadTracking: boolean
    worldStateValidation: boolean
    knowledgeCallbacks: boolean
    relationshipConsistency: boolean
  }
  thresholds: {
    maxWarnings: number
    maxErrors: number
    autoFix: boolean
  }
}

/**
 * Determine appropriate strictness level
 */
export function determineStrictness(context: StrictnessContext): StrictnessConfig {
  // User override takes precedence
  if (context.userPreference) {
    return getConfigForLevel(context.userPreference)
  }
  
  // Early chapters: be more lenient
  if (context.chapterCount < 5) {
    return getConfigForLevel('lenient')
  }
  
  // Climax phase: be strict
  if (context.storyPhase === 'climax') {
    return getConfigForLevel('strict')
  }
  
  // Complex stories: moderate strictness
  if (context.complexity === 'complex') {
    return getConfigForLevel('moderate')
  }
  
  // Default
  return getConfigForLevel('moderate')
}

function getConfigForLevel(level: StrictnessLevel): StrictnessConfig {
  const configs: Record<StrictnessLevel, StrictnessConfig> = {
    strict: {
      level: 'strict',
      rules: {
        characterContinuity: true,
        timelineConsistency: true,
        plotThreadTracking: true,
        worldStateValidation: true,
        knowledgeCallbacks: true,
        relationshipConsistency: true,
      },
      thresholds: {
        maxWarnings: 0,
        maxErrors: 0,
        autoFix: false,
      },
    },
    moderate: {
      level: 'moderate',
      rules: {
        characterContinuity: true,
        timelineConsistency: true,
        plotThreadTracking: true,
        worldStateValidation: false,
        knowledgeCallbacks: false,
        relationshipConsistency: true,
      },
      thresholds: {
        maxWarnings: 3,
        maxErrors: 1,
        autoFix: true,
      },
    },
    lenient: {
      level: 'lenient',
      rules: {
        characterContinuity: true,
        timelineConsistency: false,
        plotThreadTracking: false,
        worldStateValidation: false,
        knowledgeCallbacks: false,
        relationshipConsistency: false,
      },
      thresholds: {
        maxWarnings: 10,
        maxErrors: 5,
        autoFix: true,
      },
    },
  }
  
  return configs[level]
}

/**
 * Get strictness description
 */
export function getStrictnessDescription(level: StrictnessLevel): string {
  const descriptions: Record<StrictnessLevel, string> = {
    strict: 'All continuity rules enforced. Zero tolerance for inconsistencies.',
    moderate: 'Major continuity enforced. Minor issues flagged as warnings.',
    lenient: 'Critical errors only. Allows creative flexibility.',
  }
  
  return descriptions[level]
}

/**
 * Adjust strictness based on issue history
 */
export function adjustStrictnessBasedOnHistory(
  currentLevel: StrictnessLevel,
  recentIssues: { severity: 'error' | 'warning' | 'info' }[]
): StrictnessLevel {
  const errorCount = recentIssues.filter(i => i.severity === 'error').length
  const warningCount = recentIssues.filter(i => i.severity === 'warning').length
  
  // Too many errors: increase strictness
  if (errorCount > 3) {
    if (currentLevel === 'lenient') return 'moderate'
    if (currentLevel === 'moderate') return 'strict'
  }
  
  // Too many warnings at strict level: might be too strict
  if (currentLevel === 'strict' && warningCount > 5) {
    return 'moderate'
  }
  
  return currentLevel
}

/**
 * Check if a rule should be enforced
 */
export function shouldEnforce(
  config: StrictnessConfig,
  rule: keyof StrictnessConfig['rules']
): boolean {
  return config.rules[rule]
}

/**
 * Format strictness for display
 */
export function formatStrictness(config: StrictnessConfig): string {
  const parts: string[] = []
  
  parts.push(`Level: ${config.level.toUpperCase()}`)
  parts.push('')
  parts.push('Enabled Rules:')
  
  for (const [rule, enabled] of Object.entries(config.rules)) {
    const status = enabled ? '✓' : '✗'
    parts.push(`  ${status} ${rule}`)
  }
  
  parts.push('')
  parts.push('Thresholds:')
  parts.push(`  Max Warnings: ${config.thresholds.maxWarnings}`)
  parts.push(`  Max Errors: ${config.thresholds.maxErrors}`)
  parts.push(`  Auto-fix: ${config.thresholds.autoFix ? 'Yes' : 'No'}`)
  
  return parts.join('\n')
}
