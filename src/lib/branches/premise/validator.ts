/**
 * Premise validation (plausibility + story-fit + interest)
 */

import type { BranchPremise } from './transformer'
import type { CharacterState } from '../context/character-states'
import type { WorldState } from '../context/world-state'

export interface PremiseValidation {
  premiseId: string
  overallScore: number // 0-1
  dimensions: {
    plausibility: number
    storyFit: number
    interest: number
  }
  issues: ValidationIssue[]
  strengths: string[]
  recommendations: string[]
}

export interface ValidationIssue {
  dimension: 'plausibility' | 'storyFit' | 'interest'
  severity: 'minor' | 'major' | 'critical'
  message: string
  suggestion?: string
}

/**
 * Validate a premise across all dimensions
 */
export function validatePremise(
  premise: BranchPremise,
  characters: CharacterState[],
  world: WorldState
): PremiseValidation {
  const plausibility = validatePlausibility(premise, characters, world)
  const storyFit = validateStoryFit(premise, characters, world)
  const interest = validateInterest(premise)
  
  const issues: ValidationIssue[] = [
    ...plausibility.issues,
    ...storyFit.issues,
    ...interest.issues,
  ]
  
  const strengths: string[] = [
    ...plausibility.strengths,
    ...storyFit.strengths,
    ...interest.strengths,
  ]
  
  const overallScore = (
    plausibility.score * 0.35 +
    storyFit.score * 0.35 +
    interest.score * 0.30
  )
  
  return {
    premiseId: premise.id,
    overallScore,
    dimensions: {
      plausibility: plausibility.score,
      storyFit: storyFit.score,
      interest: interest.score,
    },
    issues,
    strengths,
    recommendations: generateRecommendations(issues, strengths),
  }
}

interface DimensionValidation {
  score: number
  issues: ValidationIssue[]
  strengths: string[]
}

function validatePlausibility(
  premise: BranchPremise,
  characters: CharacterState[],
  world: WorldState
): DimensionValidation {
  const issues: ValidationIssue[] = []
  const strengths: string[] = []
  let score = 0.7 // Base score
  
  // Check character capabilities
  const involvedCharacters = characters.filter(c =>
    premise.affectedCharacters.includes(c.name)
  )
  
  for (const char of involvedCharacters) {
    // Check if character has necessary capabilities
    if (!hasRequiredCapabilities(char, premise)) {
      issues.push({
        dimension: 'plausibility',
        severity: 'major',
        message: `${char.name} may not have capabilities needed for this premise`,
        suggestion: `Consider ${char.name}'s established abilities and limitations`,
      })
      score -= 0.15
    }
  }
  
  // Check world consistency
  const worldConsistent = checkWorldConsistency(premise, world)
  if (!worldConsistent.consistent) {
    issues.push({
      dimension: 'plausibility',
      severity: 'critical',
      message: 'Premise conflicts with established world rules',
      suggestion: worldConsistent.suggestion,
    })
    score -= 0.25
  } else {
    strengths.push('Respects established world rules and constraints')
    score += 0.1
  }
  
  // Check consequence plausibility
  if (premise.immediateConsequences.length === 0) {
    issues.push({
      dimension: 'plausibility',
      severity: 'minor',
      message: 'No immediate consequences specified',
      suggestion: 'Add clear immediate consequences for better plausibility',
    })
    score -= 0.05
  } else {
    strengths.push('Has clear immediate consequences')
    score += 0.1
  }
  
  return {
    score: Math.max(0, Math.min(1, score)),
    issues,
    strengths,
  }
}

function validateStoryFit(
  premise: BranchPremise,
  characters: CharacterState[],
  world: WorldState
): DimensionValidation {
  const issues: ValidationIssue[] = []
  const strengths: string[] = []
  let score = 0.7
  
  // Check thematic alignment
  const worldThemes = world.themes.map(t => t.name.toLowerCase())
  const premiseThemes = premise.themes.map(t => t.toLowerCase())
  const thematicOverlap = premiseThemes.filter(t =>
    worldThemes.some(wt => wt.includes(t) || t.includes(wt))
  )
  
  if (thematicOverlap.length === 0) {
    issues.push({
      dimension: 'storyFit',
      severity: 'minor',
      message: 'Premise themes may not align well with story themes',
      suggestion: 'Consider connecting premise to established story themes',
    })
    score -= 0.1
  } else {
    strengths.push(`Aligns with story themes: ${thematicOverlap.join(', ')}`)
    score += 0.15
  }
  
  // Check character motivation alignment
  const motivationAlignment = checkMotivationAlignment(premise, characters)
  if (!motivationAlignment.aligned) {
    issues.push({
      dimension: 'storyFit',
      severity: 'major',
      message: 'Premise may conflict with character motivations',
      suggestion: motivationAlignment.suggestion,
    })
    score -= 0.15
  } else {
    strengths.push('Respects character motivations and goals')
    score += 0.1
  }
  
  // Check conflict alignment
  if (world.activeConflicts.length > 0) {
    const conflictRelevance = checkConflictRelevance(premise, world)
    if (conflictRelevance.relevant) {
      strengths.push('Connects to ongoing conflicts')
      score += 0.1
    }
  }
  
  return {
    score: Math.max(0, Math.min(1, score)),
    issues,
    strengths,
  }
}

function validateInterest(premise: BranchPremise): DimensionValidation {
  const issues: ValidationIssue[] = []
  const strengths: string[] = []
  let score = 0.7
  
  // Check emotional stakes
  if (premise.affectedCharacters.length === 0) {
    issues.push({
      dimension: 'interest',
      severity: 'major',
      message: 'No characters are affected by this premise',
      suggestion: 'Ensure the premise impacts at least one character meaningfully',
    })
    score -= 0.2
  } else if (premise.affectedCharacters.length >= 2) {
    strengths.push(`Affects multiple characters (${premise.affectedCharacters.length})`)
    score += 0.1
  }
  
  // Check theme richness
  if (premise.themes.length < 2) {
    issues.push({
      dimension: 'interest',
      severity: 'minor',
      message: 'Limited thematic depth',
      suggestion: 'Consider exploring additional themes',
    })
    score -= 0.05
  } else {
    strengths.push(`Rich thematic content (${premise.themes.length} themes)`)
    score += 0.1
  }
  
  // Check long-term potential
  if (premise.longTermImplications.length === 0) {
    issues.push({
      dimension: 'interest',
      severity: 'minor',
      message: 'No long-term implications explored',
      suggestion: 'Add long-term consequences to increase interest',
    })
    score -= 0.05
  } else {
    strengths.push('Has compelling long-term implications')
    score += 0.1
  }
  
  // Check hook strength
  const hookStrength = assessHookStrength(premise)
  if (hookStrength.strong) {
    strengths.push('Strong narrative hook')
    score += 0.15
  } else {
    issues.push({
      dimension: 'interest',
      severity: 'minor',
      message: 'Narrative hook could be stronger',
      suggestion: hookStrength.suggestion,
    })
    score -= 0.05
  }
  
  return {
    score: Math.max(0, Math.min(1, score)),
    issues,
    strengths,
  }
}

function hasRequiredCapabilities(char: CharacterState, premise: BranchPremise): boolean {
  // Simplified check - in reality would check against specific premise requirements
  return char.importance !== 'minor' || premise.affectedCharacters.includes(char.name)
}

function checkWorldConsistency(
  premise: BranchPremise,
  world: WorldState
): { consistent: boolean; suggestion?: string } {
  // Check against hard world rules
  for (const rule of world.worldRules.hardRules) {
    if (premise.description.toLowerCase().includes('impossible') ||
        premise.description.toLowerCase().includes('magic') && !rule.includes('magic')) {
      return {
        consistent: false,
        suggestion: 'Ensure premise respects established world mechanics',
      }
    }
  }
  
  return { consistent: true }
}

function checkMotivationAlignment(
  premise: BranchPremise,
  characters: CharacterState[]
): { aligned: boolean; suggestion?: string } {
  // Check if premise aligns with character goals
  for (const charName of premise.affectedCharacters) {
    const char = characters.find(c => c.name === charName)
    if (char) {
      // Simple heuristic - premise should relate to character's goal or obstacle
      const goalMatch = premise.description.toLowerCase().includes(char.currentState.goal.toLowerCase())
      const obstacleMatch = premise.description.toLowerCase().includes(char.currentState.obstacle.toLowerCase())
      
      if (!goalMatch && !obstacleMatch) {
        return {
          aligned: false,
          suggestion: `Consider how this premise relates to ${char.name}'s goal: ${char.currentState.goal}`,
        }
      }
    }
  }
  
  return { aligned: true }
}

function checkConflictRelevance(
  premise: BranchPremise,
  world: WorldState
): { relevant: boolean } {
  for (const conflict of world.activeConflicts) {
    const overlap = premise.affectedCharacters.some(char =>
      conflict.involvedParties.includes(char)
    )
    if (overlap) return { relevant: true }
  }
  return { relevant: false }
}

function assessHookStrength(premise: BranchPremise): { strong: boolean; suggestion?: string } {
  const whatIf = premise.whatIf
  
  // Check for compelling elements
  const compellingElements = [
    'what if', 'imagine', 'discover', 'secret', 'truth',
    'betrayal', 'sacrifice', 'love', 'revenge', 'power',
  ]
  
  const hasCompellingElement = compellingElements.some(el =>
    whatIf.toLowerCase().includes(el)
  )
  
  if (hasCompellingElement && whatIf.length > 30) {
    return { strong: true }
  }
  
  return {
    strong: false,
    suggestion: 'Make the "what if" more specific and emotionally engaging',
  }
}

function generateRecommendations(issues: ValidationIssue[], strengths: string[]): string[] {
  const recommendations: string[] = []
  
  // Prioritize critical issues
  const criticalIssues = issues.filter(i => i.severity === 'critical')
  for (const issue of criticalIssues) {
    if (issue.suggestion) {
      recommendations.push(`[CRITICAL] ${issue.suggestion}`)
    }
  }
  
  // Add major issue suggestions
  const majorIssues = issues.filter(i => i.severity === 'major')
  for (const issue of majorIssues) {
    if (issue.suggestion) {
      recommendations.push(`[MAJOR] ${issue.suggestion}`)
    }
  }
  
  // Add positive reinforcement
  if (strengths.length > 0) {
    recommendations.push(`Strengths: ${strengths.slice(0, 2).join(', ')}`)
  }
  
  return recommendations
}
