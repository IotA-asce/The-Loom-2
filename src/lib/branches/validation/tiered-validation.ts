/**
 * Tiered validation (core/secondary/minor traits)
 */

import type { CharacterState } from '../context/character-states'
import type { BranchVariation } from '../variation/generator'

export type TraitTier = 'core' | 'secondary' | 'minor'

export interface TraitDefinition {
  name: string
  tier: TraitTier
  description: string
  examples: string[]
}

export interface TraitValidation {
  trait: string
  tier: TraitTier
  preserved: boolean
  deviation: 'none' | 'minor' | 'major'
  justification?: string
}

export interface TieredValidationResult {
  characterId: string
  characterName: string
  overallScore: number
  traits: TraitValidation[]
  coreViolations: TraitValidation[]
  secondaryViolations: TraitValidation[]
  minorViolations: TraitValidation[]
}

// Define standard trait tiers
export const STANDARD_TRAITS: TraitDefinition[] = [
  // Core traits - fundamental to character identity
  { name: 'core-values', tier: 'core', description: 'Fundamental beliefs and principles', examples: ['honor', 'family-first', 'survival'] },
  { name: 'primary-motivation', tier: 'core', description: 'Main driving force', examples: ['revenge', 'protection', 'ambition'] },
  { name: 'moral-alignment', tier: 'core', description: 'Basic moral compass', examples: ['lawful-good', 'chaotic-neutral', 'evil'] },
  { name: 'identity-foundation', tier: 'core', description: 'Core sense of self', examples: ['hero', 'villain', 'outsider'] },
  
  // Secondary traits - important but can evolve
  { name: 'personality-traits', tier: 'secondary', description: 'Observable personality characteristics', examples: ['brave', 'sarcastic', 'anxious'] },
  { name: 'skills-abilities', tier: 'secondary', description: 'Talents and capabilities', examples: ['combat', 'strategy', 'magic'] },
  { name: 'relationships', tier: 'secondary', description: 'Important connections', examples: ['allies', 'enemies', 'mentors'] },
  { name: 'goals-objectives', tier: 'secondary', description: 'Current aims and objectives', examples: ['defeat villain', 'find treasure', 'save family'] },
  
  // Minor traits - surface level, easily changed
  { name: 'preferences', tier: 'minor', description: 'Likes and dislikes', examples: ['favorite food', 'hobbies', 'aesthetic taste'] },
  { name: 'habits', tier: 'minor', description: 'Behavioral patterns', examples: ['speech patterns', 'routines', 'mannerisms'] },
  { name: 'surface-behaviors', tier: 'minor', description: 'Observable but changeable behaviors', examples: ['dress style', 'speech formality', 'posture'] },
  { name: 'circumstantial', tier: 'minor', description: 'Situation-dependent traits', examples: ['current mood', 'temporary alliances', 'recent wounds'] },
]

/**
 * Validate character traits across tiers
 */
export function validateTieredTraits(
  character: CharacterState,
  variation: BranchVariation
): TieredValidationResult {
  const traits: TraitValidation[] = []
  
  // Validate core traits
  traits.push(validateCoreTrait('core-values', character, variation))
  traits.push(validateCoreTrait('primary-motivation', character, variation))
  traits.push(validateCoreTrait('moral-alignment', character, variation))
  
  // Validate secondary traits
  traits.push(validateSecondaryTrait('personality-traits', character, variation))
  traits.push(validateSecondaryTrait('skills-abilities', character, variation))
  traits.push(validateSecondaryTrait('relationships', character, variation))
  
  // Validate minor traits
  traits.push(validateMinorTrait('preferences', character, variation))
  traits.push(validateMinorTrait('habits', character, variation))
  
  // Calculate score based on tier weights
  const weights = { core: 0.5, secondary: 0.3, minor: 0.2 }
  const totalWeight = traits.reduce((sum, t) => sum + weights[t.tier], 0)
  const preservedWeight = traits
    .filter(t => t.preserved)
    .reduce((sum, t) => sum + weights[t.tier], 0)
  
  const overallScore = totalWeight > 0 ? preservedWeight / totalWeight : 1
  
  // Categorize violations
  const coreViolations = traits.filter(t => t.tier === 'core' && !t.preserved)
  const secondaryViolations = traits.filter(t => t.tier === 'secondary' && !t.preserved)
  const minorViolations = traits.filter(t => t.tier === 'minor' && !t.preserved)
  
  return {
    characterId: character.id,
    characterName: character.name,
    overallScore,
    traits,
    coreViolations,
    secondaryViolations,
    minorViolations,
  }
}

function validateCoreTrait(
  traitName: string,
  character: CharacterState,
  variation: BranchVariation
): TraitValidation {
  // Core traits are derived from personality and arc
  const personality = character.personality.toLowerCase()
  const arc = variation.characterArcs.find(a => a.characterId === character.id)
  
  // Check if arc respects core personality
  const preserved = personality.length > 0 && 
    (!arc || arc.growth !== 'negative' || !personality.includes('stubborn'))
  
  return {
    trait: traitName,
    tier: 'core',
    preserved,
    deviation: preserved ? 'none' : 'major',
    justification: preserved ? undefined : 'Arc conflicts with established personality',
  }
}

function validateSecondaryTrait(
  traitName: string,
  character: CharacterState,
  variation: BranchVariation
): TraitValidation {
  // Secondary traits can evolve
  const arc = variation.characterArcs.find(a => a.characterId === character.id)
  
  // Secondary traits allow for growth
  const preserved = !arc || arc.growth === 'positive' || arc.growth === 'complex'
  
  return {
    trait: traitName,
    tier: 'secondary',
    preserved,
    deviation: preserved ? 'none' : 'minor',
    justification: preserved ? undefined : 'Character arc involves significant change',
  }
}

function validateMinorTrait(
  traitName: string,
  character: CharacterState,
  _variation: BranchVariation
): TraitValidation {
  // Minor traits are easily changed
  return {
    trait: traitName,
    tier: 'minor',
    preserved: true, // Always allowed to change
    deviation: 'none',
  }
}

/**
 * Check if validation passes based on tier rules
 */
export function checkTieredValidation(
  result: TieredValidationResult,
  allowCoreChanges: boolean = false,
  allowSecondaryChanges: boolean = true,
  allowMinorChanges: boolean = true
): { valid: boolean; criticalIssues: string[] } {
  const criticalIssues: string[] = []
  
  // Core violations are critical unless explicitly allowed
  if (!allowCoreChanges && result.coreViolations.length > 0) {
    criticalIssues.push(
      `Core trait violations for ${result.characterName}: ` +
      result.coreViolations.map(v => v.trait).join(', ')
    )
  }
  
  // Secondary violations are warnings unless strict mode
  if (!allowSecondaryChanges && result.secondaryViolations.length > 0) {
    criticalIssues.push(
      `Secondary trait changes for ${result.characterName}: ` +
      result.secondaryViolations.map(v => v.trait).join(', ')
    )
  }
  
  // Minor violations are never critical
  
  return {
    valid: criticalIssues.length === 0,
    criticalIssues,
  }
}

/**
 * Get trait tier description
 */
export function getTraitTierDescription(tier: TraitTier): string {
  const descriptions: Record<TraitTier, string> = {
    core: 'Fundamental to character identity - should never change without extreme justification',
    secondary: 'Important characteristics - can evolve gradually with proper development',
    minor: 'Surface-level traits - can change freely based on circumstances',
  }
  return descriptions[tier]
}
