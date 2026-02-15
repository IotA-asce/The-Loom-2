/**
 * User-controlled deviation levels
 */

import type { TieredValidationResult, TraitTier } from './tiered-validation'

export type DeviationLevel = 'strict' | 'moderate' | 'flexible' | 'creative'

export interface DeviationConfig {
  level: DeviationLevel
  userOverrides: {
    allowCoreChanges?: boolean
    allowSecondaryChanges?: boolean
    allowMinorChanges?: boolean
    requireJustification?: boolean
  }
  characterSpecific: Record<string, {
    allowedDeviations: string[]
    protectedTraits: string[]
  }>
}

export interface DeviationResult {
  allowed: boolean
  requiresJustification: boolean
  suggestedJustification?: string
  warnings: string[]
}

/**
 * Check if deviation is allowed based on user config
 */
export function checkDeviationAllowed(
  tier: TraitTier,
  config: DeviationConfig
): DeviationResult {
  const { level, userOverrides } = config
  
  // Determine base permissions
  const basePermissions = getBasePermissions(level)
  
  // Apply user overrides
  const effectivePermissions = {
    ...basePermissions,
    ...userOverrides,
  }
  
  // Check tier-specific permission
  let allowed = false
  switch (tier) {
    case 'core':
      allowed = effectivePermissions.allowCoreChanges ?? false
      break
    case 'secondary':
      allowed = effectivePermissions.allowSecondaryChanges ?? true
      break
    case 'minor':
      allowed = effectivePermissions.allowMinorChanges ?? true
      break
  }
  
  // Determine if justification is required
  const requiresJustification = effectivePermissions.requireJustification ?? 
    (tier === 'core' || tier === 'secondary')
  
  // Generate warnings
  const warnings: string[] = []
  if (tier === 'core' && allowed) {
    warnings.push('Core trait changes may fundamentally alter character identity')
  }
  
  return {
    allowed,
    requiresJustification,
    suggestedJustification: allowed && requiresJustification 
      ? generateSuggestedJustification(tier)
      : undefined,
    warnings,
  }
}

function getBasePermissions(level: DeviationLevel): {
  allowCoreChanges: boolean
  allowSecondaryChanges: boolean
  allowMinorChanges: boolean
  requireJustification: boolean
} {
  const permissions: Record<DeviationLevel, {
    allowCoreChanges: boolean
    allowSecondaryChanges: boolean
    allowMinorChanges: boolean
    requireJustification: boolean
  }> = {
    strict: {
      allowCoreChanges: false,
      allowSecondaryChanges: false,
      allowMinorChanges: true,
      requireJustification: true,
    },
    moderate: {
      allowCoreChanges: false,
      allowSecondaryChanges: true,
      allowMinorChanges: true,
      requireJustification: true,
    },
    flexible: {
      allowCoreChanges: true,
      allowSecondaryChanges: true,
      allowMinorChanges: true,
      requireJustification: false,
    },
    creative: {
      allowCoreChanges: true,
      allowSecondaryChanges: true,
      allowMinorChanges: true,
      requireJustification: false,
    },
  }
  
  return permissions[level]
}

function generateSuggestedJustification(tier: TraitTier): string {
  const justifications: Record<TraitTier, string[]> = {
    core: [
      'Traumatic event causes fundamental reevaluation',
      'Long-term character arc culminating in transformation',
      'Alternate timeline with different formative experiences',
    ],
    secondary: [
      'Natural character growth through experiences',
      'New skills learned during the journey',
      'Relationships evolve with changing circumstances',
    ],
    minor: [
      'Changed circumstances lead to new preferences',
      'Different social context requires adaptation',
    ],
  }
  
  const options = justifications[tier]
  return options[Math.floor(Math.random() * options.length)]
}

/**
 * Apply deviation config to validation results
 */
export function applyDeviationConfig(
  results: TieredValidationResult[],
  config: DeviationConfig
): {
  accepted: TieredValidationResult[]
  rejected: TieredValidationResult[]
  needsJustification: Array<{
    result: TieredValidationResult
    violations: string[]
  }>
} {
  const accepted: TieredValidationResult[] = []
  const rejected: TieredValidationResult[] = []
  const needsJustification: Array<{
    result: TieredValidationResult
    violations: string[]
  }> = []
  
  for (const result of results) {
    // Check character-specific overrides
    const charOverride = config.characterSpecific[result.characterId]
    
    // Collect all violations
    const allViolations = [
      ...result.coreViolations,
      ...result.secondaryViolations,
      ...result.minorViolations,
    ]
    
    // Check if any protected traits are violated
    if (charOverride?.protectedTraits) {
      const protectedViolations = allViolations.filter(v =>
        charOverride.protectedTraits.includes(v.trait)
      )
      if (protectedViolations.length > 0) {
        rejected.push(result)
        continue
      }
    }
    
    // Check if violations are allowed
    const coreCheck = checkDeviationAllowed('core', config)
    const secondaryCheck = checkDeviationAllowed('secondary', config)
    
    const coreViolations = result.coreViolations.filter(v =>
      !charOverride?.allowedDeviations.includes(v.trait)
    )
    
    // Determine status
    if (coreViolations.length > 0 && !coreCheck.allowed) {
      rejected.push(result)
    } else if (coreViolations.length > 0 && coreCheck.requiresJustification) {
      needsJustification.push({
        result,
        violations: coreViolations.map(v => v.trait),
      })
    } else if (result.secondaryViolations.length > 0 && secondaryCheck.requiresJustification) {
      needsJustification.push({
        result,
        violations: result.secondaryViolations.map(v => v.trait),
      })
    } else {
      accepted.push(result)
    }
  }
  
  return { accepted, rejected, needsJustification }
}

/**
 * Create default deviation config
 */
export function createDefaultDeviationConfig(): DeviationConfig {
  return {
    level: 'moderate',
    userOverrides: {
      allowCoreChanges: false,
      allowSecondaryChanges: true,
      allowMinorChanges: true,
      requireJustification: true,
    },
    characterSpecific: {},
  }
}

/**
 * Get deviation level description
 */
export function getDeviationLevelDescription(level: DeviationLevel): string {
  const descriptions: Record<DeviationLevel, string> = {
    strict: 'No character changes allowed - strict adherence to established traits',
    moderate: 'Secondary traits can evolve, core traits remain fixed',
    flexible: 'Significant character development allowed with justification',
    creative: 'Complete creative freedom - characters can transform radically',
  }
  return descriptions[level]
}
