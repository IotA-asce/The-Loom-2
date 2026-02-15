/**
 * Context-aware strictness for consistency validation
 */

import type { AnchorEvent } from '@/lib/db/schema'
import type { BranchVariation } from '../variation/generator'

export interface StrictnessConfig {
  level: 'strict' | 'moderate' | 'flexible'
  contextFactors: {
    anchorSignificance: AnchorEvent['significance']
    consequenceType: BranchVariation['consequenceType']
    isFirstBranch: boolean
    establishedCanon: number // Pages of established story
  }
}

export interface StrictnessRules {
  characterDeviation: 'none' | 'minor' | 'significant'
  worldRuleBreaking: 'none' | 'soft-only' | 'any-with-justification'
  timelineChanges: 'none' | 'future-only' | 'any'
  toneShift: 'none' | 'gradual' | 'any'
}

/**
 * Determine validation strictness based on context
 */
export function determineStrictness(
  config: StrictnessConfig
): StrictnessRules {
  const { level, contextFactors } = config
  
  // Base rules from level
  const baseRules = getBaseRules(level)
  
  // Adjust for anchor significance
  const significanceAdjustment = getSignificanceAdjustment(contextFactors.anchorSignificance)
  
  // Adjust for consequence type
  const consequenceAdjustment = getConsequenceAdjustment(contextFactors.consequenceType)
  
  // Adjust for canon length
  const canonAdjustment = getCanonAdjustment(contextFactors.establishedCanon)
  
  // Combine adjustments
  return combineRules(baseRules, significanceAdjustment, consequenceAdjustment, canonAdjustment)
}

function getBaseRules(level: StrictnessConfig['level']): StrictnessRules {
  const rules: Record<StrictnessConfig['level'], StrictnessRules> = {
    strict: {
      characterDeviation: 'none',
      worldRuleBreaking: 'none',
      timelineChanges: 'none',
      toneShift: 'none',
    },
    moderate: {
      characterDeviation: 'minor',
      worldRuleBreaking: 'soft-only',
      timelineChanges: 'future-only',
      toneShift: 'gradual',
    },
    flexible: {
      characterDeviation: 'significant',
      worldRuleBreaking: 'any-with-justification',
      timelineChanges: 'any',
      toneShift: 'any',
    },
  }
  return rules[level]
}

function getSignificanceAdjustment(
  significance: AnchorEvent['significance']
): Partial<StrictnessRules> {
  switch (significance) {
    case 'critical':
      return { characterDeviation: 'significant', timelineChanges: 'any' }
    case 'major':
      return { characterDeviation: 'minor', timelineChanges: 'future-only' }
    case 'moderate':
      return { characterDeviation: 'minor' }
    case 'minor':
      return { characterDeviation: 'none' }
    default:
      return {}
  }
}

function getConsequenceAdjustment(
  consequenceType: BranchVariation['consequenceType']
): Partial<StrictnessRules> {
  switch (consequenceType) {
    case 'cosmic':
      return { worldRuleBreaking: 'any-with-justification', toneShift: 'any' }
    case 'political':
      return { characterDeviation: 'significant', timelineChanges: 'any' }
    case 'personal':
      return { characterDeviation: 'minor', toneShift: 'gradual' }
    default:
      return {}
  }
}

function getCanonAdjustment(establishedCanon: number): Partial<StrictnessRules> {
  // More established canon = stricter rules
  if (establishedCanon > 200) {
    return { characterDeviation: 'none', worldRuleBreaking: 'none' }
  }
  if (establishedCanon > 100) {
    return { characterDeviation: 'minor' }
  }
  return { characterDeviation: 'significant' }
}

function combineRules(
  base: StrictnessRules,
  ...adjustments: Partial<StrictnessRules>[]
): StrictnessRules {
  const combined = { ...base }
  
  for (const adjustment of adjustments) {
    // More lenient adjustments take precedence
    if (adjustment.characterDeviation) {
      combined.characterDeviation = moreLenient(
        combined.characterDeviation,
        adjustment.characterDeviation,
        ['none', 'minor', 'significant']
      )
    }
    if (adjustment.worldRuleBreaking) {
      combined.worldRuleBreaking = moreLenient(
        combined.worldRuleBreaking,
        adjustment.worldRuleBreaking,
        ['none', 'soft-only', 'any-with-justification']
      )
    }
    if (adjustment.timelineChanges) {
      combined.timelineChanges = moreLenient(
        combined.timelineChanges,
        adjustment.timelineChanges,
        ['none', 'future-only', 'any']
      )
    }
    if (adjustment.toneShift) {
      combined.toneShift = moreLenient(
        combined.toneShift,
        adjustment.toneShift,
        ['none', 'gradual', 'any']
      )
    }
  }
  
  return combined
}

function moreLenient<T>(current: T, proposed: T, order: T[]): T {
  const currentIndex = order.indexOf(current)
  const proposedIndex = order.indexOf(proposed)
  return proposedIndex > currentIndex ? proposed : current
}

/**
 * Get strictness description for UI
 */
export function getStrictnessDescription(rules: StrictnessRules): string {
  const parts: string[] = []
  
  if (rules.characterDeviation === 'none') {
    parts.push('Characters must remain true to established traits')
  } else if (rules.characterDeviation === 'minor') {
    parts.push('Minor character developments allowed')
  } else {
    parts.push('Significant character changes possible')
  }
  
  if (rules.worldRuleBreaking === 'none') {
    parts.push('World rules cannot be broken')
  } else if (rules.worldRuleBreaking === 'soft-only') {
    parts.push('Only soft world rules can be bent')
  } else {
    parts.push('World rules can be broken with justification')
  }
  
  return parts.join('. ') + '.'
}
