/**
 * 8-dimension validation for branches
 */

import type { BranchVariation } from '../variation/generator'
import type { ContextPackage } from '../context/adaptive-selector'

export type ValidationDimension = 
  | 'character-consistency'
  | 'world-consistency'
  | 'plot-plausibility'
  | 'thematic-coherence'
  | 'tone-consistency'
  | 'pacing-balance'
  | 'stakes-clarity'
  | 'narrative-satisfaction'

export interface DimensionValidation {
  dimension: ValidationDimension
  score: number // 0-1
  passed: boolean
  issues: string[]
  strengths: string[]
}

export interface FullValidationResult {
  dimensions: Record<ValidationDimension, DimensionValidation>
  overallScore: number
  passed: boolean
  criticalFailures: ValidationDimension[]
  recommendations: string[]
}

/**
 * Validate all 8 dimensions
 */
export function validateAllDimensions(
  variation: BranchVariation,
  context: ContextPackage
): FullValidationResult {
  const dimensions: Record<ValidationDimension, DimensionValidation> = {
    'character-consistency': validateCharacterConsistency(variation, context),
    'world-consistency': validateWorldConsistency(variation, context),
    'plot-plausibility': validatePlotPlausibility(variation, context),
    'thematic-coherence': validateThematicCoherence(variation, context),
    'tone-consistency': validateToneConsistency(variation, context),
    'pacing-balance': validatePacingBalance(variation, context),
    'stakes-clarity': validateStakesClarity(variation, context),
    'narrative-satisfaction': validateNarrativeSatisfaction(variation, context),
  }
  
  // Calculate overall score
  const scores = Object.values(dimensions).map(d => d.score)
  const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length
  
  // Determine if passed (all dimensions >= 0.5)
  const passed = Object.values(dimensions).every(d => d.score >= 0.5)
  
  // Find critical failures
  const criticalFailures = Object.entries(dimensions)
    .filter(([_, d]) => d.score < 0.4)
    .map(([key, _]) => key as ValidationDimension)
  
  // Generate recommendations
  const recommendations = generateRecommendations(dimensions)
  
  return {
    dimensions,
    overallScore,
    passed,
    criticalFailures,
    recommendations,
  }
}

function validateCharacterConsistency(
  variation: BranchVariation,
  context: ContextPackage
): DimensionValidation {
  const issues: string[] = []
  const strengths: string[] = []
  let score = 0.7
  
  // Check if character arcs are present
  if (variation.characterArcs.length === 0) {
    issues.push('No character arcs defined')
    score -= 0.3
  } else {
    strengths.push(`${variation.characterArcs.length} character arcs projected`)
    score += 0.1
  }
  
  // Check arc coherence
  const coherentArcs = variation.characterArcs.filter(arc => 
    arc.startingState && arc.endingState && arc.arcDescription
  )
  
  if (coherentArcs.length === variation.characterArcs.length) {
    strengths.push('All character arcs are well-defined')
    score += 0.1
  } else {
    issues.push('Some character arcs lack definition')
    score -= 0.1
  }
  
  return {
    dimension: 'character-consistency',
    score: Math.min(1, Math.max(0, score)),
    passed: score >= 0.5,
    issues,
    strengths,
  }
}

function validateWorldConsistency(
  variation: BranchVariation,
  context: ContextPackage
): DimensionValidation {
  const issues: string[] = []
  const strengths: string[] = []
  let score = 0.7
  
  // Check consequence type alignment with world state
  if (variation.consequenceType === 'cosmic' && context.world.themes.length < 2) {
    issues.push('Cosmic consequences may not fit limited world building')
    score -= 0.1
  }
  
  // Check active conflicts alignment
  if (context.world.activeConflicts.length > 0) {
    const conflictRelevance = variation.trajectory.keyEvents.some(e =>
      context.world.activeConflicts.some(c => 
        e.toLowerCase().includes(c.name.toLowerCase())
      )
    )
    if (conflictRelevance) {
      strengths.push('Branch connects to existing conflicts')
      score += 0.15
    }
  }
  
  return {
    dimension: 'world-consistency',
    score: Math.min(1, Math.max(0, score)),
    passed: score >= 0.5,
    issues,
    strengths,
  }
}

function validatePlotPlausibility(
  variation: BranchVariation,
  _context: ContextPackage
): DimensionValidation {
  const issues: string[] = []
  const strengths: string[] = []
  let score = 0.7
  
  // Check for clear cause-effect chain
  if (variation.trajectory.keyEvents.length >= 3) {
    strengths.push('Clear progression of events')
    score += 0.1
  } else {
    issues.push('Event chain may be too short')
    score -= 0.1
  }
  
  // Check premise clarity
  if (variation.premise.immediateConsequences.length > 0) {
    strengths.push('Immediate consequences defined')
    score += 0.1
  } else {
    issues.push('Lack of immediate consequences')
    score -= 0.15
  }
  
  return {
    dimension: 'plot-plausibility',
    score: Math.min(1, Math.max(0, score)),
    passed: score >= 0.5,
    issues,
    strengths,
  }
}

function validateThematicCoherence(
  variation: BranchVariation,
  context: ContextPackage
): DimensionValidation {
  const issues: string[] = []
  const strengths: string[] = []
  let score = 0.7
  
  // Check theme progression
  if (variation.themeProgression.length > 0) {
    strengths.push(`${variation.themeProgression.length} themes developed`)
    score += 0.15
  } else {
    issues.push('No theme progression defined')
    score -= 0.2
  }
  
  // Check alignment with world themes
  const worldThemeNames = context.world.themes.map(t => t.name.toLowerCase())
  const alignedThemes = variation.themeProgression.filter(t =>
    worldThemeNames.some(wt => t.toLowerCase().includes(wt))
  )
  
  if (alignedThemes.length > 0) {
    strengths.push('Themes align with story themes')
    score += 0.1
  }
  
  return {
    dimension: 'thematic-coherence',
    score: Math.min(1, Math.max(0, score)),
    passed: score >= 0.5,
    issues,
    strengths,
  }
}

function validateToneConsistency(
  variation: BranchVariation,
  context: ContextPackage
): DimensionValidation {
  const issues: string[] = []
  const strengths: string[] = []
  let score = 0.7
  
  // Check mood alignment with narrative style
  const styleTone = context.style.tone.primary
  const moodAlignment = {
    dark: ['dark', 'tragic'],
    light: ['hopeful'],
    neutral: ['mixed'],
    mixed: ['hopeful', 'tragic', 'mixed', 'dark'],
  }
  
  if (moodAlignment[styleTone]?.includes(variation.mood)) {
    strengths.push('Mood aligns with narrative style')
    score += 0.15
  } else {
    issues.push('Mood may conflict with established tone')
    score -= 0.1
  }
  
  // Check ending type matches mood
  const moodEndingAlignment: Record<typeof variation.mood, string[]> = {
    hopeful: ['hopeful', 'bittersweet'],
    tragic: ['tragic', 'ambiguous'],
    mixed: ['bittersweet', 'ambiguous', 'open'],
    dark: ['tragic', 'ambiguous'],
  }
  
  if (moodEndingAlignment[variation.mood]?.includes(variation.trajectory.endingType)) {
    strengths.push('Ending type matches mood')
    score += 0.1
  }
  
  return {
    dimension: 'tone-consistency',
    score: Math.min(1, Math.max(0, score)),
    passed: score >= 0.5,
    issues,
    strengths,
  }
}

function validatePacingBalance(
  variation: BranchVariation,
  _context: ContextPackage
): DimensionValidation {
  const issues: string[] = []
  const strengths: string[] = []
  let score = 0.7
  
  // Check chapter count appropriateness
  const eventCount = variation.trajectory.keyEvents.length
  const chapterCount = variation.estimatedChapters
  
  if (chapterCount >= eventCount) {
    strengths.push('Adequate chapters for event count')
    score += 0.1
  } else {
    issues.push('May need more chapters for events')
    score -= 0.1
  }
  
  // Check complexity matches scope
  if (variation.complexity === 'complex' && chapterCount >= 6) {
    strengths.push('Complexity matches scope')
    score += 0.1
  }
  
  return {
    dimension: 'pacing-balance',
    score: Math.min(1, Math.max(0, score)),
    passed: score >= 0.5,
    issues,
    strengths,
  }
}

function validateStakesClarity(
  variation: BranchVariation,
  _context: ContextPackage
): DimensionValidation {
  const issues: string[] = []
  const strengths: string[] = []
  let score = 0.7
  
  // Check consequence type indicates stakes
  const consequenceStakes: Record<typeof variation.consequenceType, number> = {
    personal: 0.7,
    political: 0.8,
    cosmic: 0.9,
  }
  score = consequenceStakes[variation.consequenceType]
  
  // Check for affected characters
  if (variation.premise.affectedCharacters.length > 0) {
    strengths.push(`Stakes involve ${variation.premise.affectedCharacters.length} characters`)
    score += 0.1
  } else {
    issues.push('No characters affected by stakes')
    score -= 0.2
  }
  
  return {
    dimension: 'stakes-clarity',
    score: Math.min(1, Math.max(0, score)),
    passed: score >= 0.5,
    issues,
    strengths,
  }
}

function validateNarrativeSatisfaction(
  variation: BranchVariation,
  _context: ContextPackage
): DimensionValidation {
  const issues: string[] = []
  const strengths: string[] = []
  let score = 0.7
  
  // Check for clear resolution
  if (variation.trajectory.resolution) {
    strengths.push('Resolution defined')
    score += 0.15
  } else {
    issues.push('Resolution unclear')
    score -= 0.2
  }
  
  // Check for climax
  if (variation.trajectory.climax) {
    strengths.push('Climax established')
    score += 0.1
  }
  
  // Check arc completions
  const completedArcs = variation.characterArcs.filter(arc => arc.endingState)
  if (completedArcs.length === variation.characterArcs.length) {
    strengths.push('All character arcs have endings')
    score += 0.1
  }
  
  return {
    dimension: 'narrative-satisfaction',
    score: Math.min(1, Math.max(0, score)),
    passed: score >= 0.5,
    issues,
    strengths,
  }
}

function generateRecommendations(
  dimensions: Record<ValidationDimension, DimensionValidation>
): string[] {
  const recommendations: string[] = []
  
  for (const [key, validation] of Object.entries(dimensions)) {
    if (validation.score < 0.7) {
      const dimension = key as ValidationDimension
      const dimensionName = dimension.split('-').map(w => 
        w.charAt(0).toUpperCase() + w.slice(1)
      ).join(' ')
      
      if (validation.issues.length > 0) {
        recommendations.push(`${dimensionName}: ${validation.issues[0]}`)
      }
    }
  }
  
  return recommendations
}
