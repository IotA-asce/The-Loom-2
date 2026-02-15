/**
 * Hard vs. soft world rules
 */

import type { WorldState } from '../context/world-state'
import type { BranchVariation } from '../variation/generator'

export type RuleType = 'hard' | 'soft'

export interface WorldRule {
  id: string
  name: string
  description: string
  type: RuleType
  importance: 'critical' | 'major' | 'minor'
  establishedIn?: string // Event/page where established
}

export interface RuleViolation {
  rule: WorldRule
  violation: string
  severity: 'warning' | 'error' | 'critical'
  suggestedFix?: string
}

export interface WorldRulesValidation {
  hardRules: {
    total: number
    violated: number
    violations: RuleViolation[]
  }
  softRules: {
    total: number
    bent: number
    broken: number
    violations: RuleViolation[]
  }
  acceptable: boolean
  requiresJustification: boolean
}

// Standard hard rules that apply to most stories
export const STANDARD_HARD_RULES: WorldRule[] = [
  { id: 'physics', name: 'Physics', description: 'Physical laws remain consistent', type: 'hard', importance: 'critical' },
  { id: 'causality', name: 'Causality', description: 'Cause and effect relationships hold', type: 'hard', importance: 'critical' },
  { id: 'established-powers', name: 'Established Powers', description: 'Character abilities remain as established', type: 'hard', importance: 'critical' },
  { id: 'past-events', name: 'Past Events', description: 'Established history cannot change', type: 'hard', importance: 'major' },
  { id: 'character-identity', name: 'Character Identity', description: 'Core character identities remain', type: 'hard', importance: 'major' },
]

// Standard soft rules
export const STANDARD_SOFT_RULES: WorldRule[] = [
  { id: 'social-norms', name: 'Social Norms', description: 'Expected social behaviors', type: 'soft', importance: 'major' },
  { id: 'political-structures', name: 'Political Structures', description: 'Power hierarchies and systems', type: 'soft', importance: 'major' },
  { id: 'cultural-traditions', name: 'Cultural Traditions', description: 'Cultural practices and customs', type: 'soft', importance: 'minor' },
  { id: 'economic-systems', name: 'Economic Systems', description: 'Trade and resource distribution', type: 'soft', importance: 'minor' },
  { id: 'unwritten-rules', name: 'Unwritten Rules', description: 'Implicit expectations', type: 'soft', importance: 'minor' },
]

/**
 * Validate world rules in branch
 */
export function validateWorldRules(
  variation: BranchVariation,
  world: WorldState,
  customRules: WorldRule[] = []
): WorldRulesValidation {
  const allHardRules = [...STANDARD_HARD_RULES, ...customRules.filter(r => r.type === 'hard')]
  const allSoftRules = [...STANDARD_SOFT_RULES, ...customRules.filter(r => r.type === 'soft')]
  
  const hardViolations: RuleViolation[] = []
  const softViolations: RuleViolation[] = []
  
  // Check hard rules
  for (const rule of allHardRules) {
    const violation = checkHardRule(rule, variation, world)
    if (violation) {
      hardViolations.push(violation)
    }
  }
  
  // Check soft rules
  for (const rule of allSoftRules) {
    const violation = checkSoftRule(rule, variation, world)
    if (violation) {
      softViolations.push(violation)
    }
  }
  
  // Determine if acceptable
  const criticalHardViolations = hardViolations.filter(v => v.severity === 'critical')
  const acceptable = criticalHardViolations.length === 0
  
  // Justification required for any hard violation or major soft rule break
  const requiresJustification = hardViolations.length > 0 || 
    softViolations.filter(v => v.severity === 'error').length > 0
  
  return {
    hardRules: {
      total: allHardRules.length,
      violated: hardViolations.length,
      violations: hardViolations,
    },
    softRules: {
      total: allSoftRules.length,
      bent: softViolations.filter(v => v.severity === 'warning').length,
      broken: softViolations.filter(v => v.severity === 'error').length,
      violations: softViolations,
    },
    acceptable,
    requiresJustification,
  }
}

function checkHardRule(
  rule: WorldRule,
  variation: BranchVariation,
  _world: WorldState
): RuleViolation | null {
  // Check for violations based on rule type
  switch (rule.id) {
    case 'physics':
      // Check if any trajectory event violates physics
      if (variation.trajectory.keyEvents.some(e => 
        e.toLowerCase().includes('impossible') || 
        e.toLowerCase().includes('defy physics')
      )) {
        return {
          rule,
          violation: 'Event suggests physical impossibility',
          severity: 'critical',
          suggestedFix: 'Ensure events respect established physics',
        }
      }
      break
      
    case 'causality':
      // Check for causality violations
      if (variation.premise.description.toLowerCase().includes('time travel') ||
          variation.premise.description.toLowerCase().includes('change the past')) {
        return {
          rule,
          violation: 'Potential causality violation detected',
          severity: 'critical',
          suggestedFix: 'Ensure cause-effect relationships remain intact',
        }
      }
      break
      
    case 'established-powers':
      // This would need character power data to validate properly
      break
      
    case 'past-events':
      // Check if past is being changed
      if (variation.premise.description.toLowerCase().includes('never happened') ||
          variation.premise.description.toLowerCase().includes('undo')) {
        return {
          rule,
          violation: 'Past events may be altered',
          severity: rule.importance === 'critical' ? 'critical' : 'error',
          suggestedFix: 'Branch should diverge from present, not alter past',
        }
      }
      break
  }
  
  return null
}

function checkSoftRule(
  rule: WorldRule,
  variation: BranchVariation,
  world: WorldState
): RuleViolation | null {
  switch (rule.id) {
    case 'social-norms':
      // Check for significant social norm violations
      if (variation.trajectory.keyEvents.some(e =>
        e.toLowerCase().includes('overthrow') ||
        e.toLowerCase().includes('revolution')
      )) {
        return {
          rule,
          violation: 'Major social structures may be disrupted',
          severity: 'error',
          suggestedFix: 'Consider gradual social change or justify revolution',
        }
      }
      break
      
    case 'political-structures':
      // Check if political changes are plausible
      const hasPoliticalChange = variation.trajectory.keyEvents.some(e =>
        e.toLowerCase().includes('coup') ||
        e.toLowerCase().includes('war') ||
        e.toLowerCase().includes('alliance')
      )
      
      if (hasPoliticalChange && world.activeConflicts.length === 0) {
        return {
          rule,
          violation: 'Political changes without established tension',
          severity: 'warning',
          suggestedFix: 'Establish political tensions earlier',
        }
      }
      break
  }
  
  return null
}

/**
 * Get rule type description
 */
export function getRuleTypeDescription(type: RuleType): string {
  const descriptions: Record<RuleType, string> = {
    hard: 'Fundamental rules that cannot be broken without breaking the story world',
    soft: 'Conventional rules that can be bent or broken with proper narrative justification',
  }
  return descriptions[type]
}

/**
 * Create custom world rule
 */
export function createWorldRule(
  name: string,
  description: string,
  type: RuleType,
  importance: WorldRule['importance'],
  establishedIn?: string
): WorldRule {
  return {
    id: `custom-${Date.now()}`,
    name,
    description,
    type,
    importance,
    establishedIn,
  }
}
