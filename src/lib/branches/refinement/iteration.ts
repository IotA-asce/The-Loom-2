/**
 * User-decided iteration count (1-5)
 */

import type { BranchVariation } from '../variation/generator'
import type { ContextPackage } from '../context/adaptive-selector'
import type { RefinementRequest, RefinementResult, RefinementArea } from './refiner'

export interface IterationConfig {
  maxIterations: number // 1-5
  stopOnSatisfaction: boolean
  stopOnDiminishingReturns: boolean
  minImprovementThreshold: number // 0-1, stop if improvement less than this
}

export interface IterationResult {
  iterations: RefinementResult[]
  finalBranch: BranchVariation
  totalChanges: number
  stoppedReason: 'max-iterations' | 'user-satisfied' | 'diminishing-returns' | 'error'
  improvementGraph: number[] // Score at each iteration
}

/**
 * Run refinement iterations
 */
export async function runRefinementIterations(
  initialVariation: BranchVariation,
  context: ContextPackage,
  baseRequest: Omit<RefinementRequest, 'branchId'>,
  config: IterationConfig
): Promise<IterationResult> {
  const iterations: RefinementResult[] = []
  const improvementGraph: number[] = []
  let currentBranch = initialVariation
  let previousScore = calculateBranchScore(initialVariation)
  improvementGraph.push(previousScore)
  
  for (let i = 0; i < config.maxIterations; i++) {
    // Create request for this iteration
    const request: RefinementRequest = {
      ...baseRequest,
      branchId: currentBranch.id,
    }
    
    // Run refinement
    const { triggerRefinement } = await import('./refiner')
    const result = await triggerRefinement(currentBranch, context, request)
    result.iteration = i + 1
    
    iterations.push(result)
    currentBranch = result.refined
    
    // Calculate improvement
    const currentScore = calculateBranchScore(result.refined)
    improvementGraph.push(currentScore)
    const improvement = currentScore - previousScore
    
    // Check stop conditions
    if (config.stopOnSatisfaction && result.userSatisfied) {
      return {
        iterations,
        finalBranch: currentBranch,
        totalChanges: iterations.reduce((sum, iter) => sum + iter.changes.length, 0),
        stoppedReason: 'user-satisfied',
        improvementGraph,
      }
    }
    
    if (config.stopOnDiminishingReturns && improvement < config.minImprovementThreshold) {
      return {
        iterations,
        finalBranch: currentBranch,
        totalChanges: iterations.reduce((sum, iter) => sum + iter.changes.length, 0),
        stoppedReason: 'diminishing-returns',
        improvementGraph,
      }
    }
    
    previousScore = currentScore
  }
  
  return {
    iterations,
    finalBranch: currentBranch,
    totalChanges: iterations.reduce((sum, iter) => sum + iter.changes.length, 0),
    stoppedReason: 'max-iterations',
    improvementGraph,
  }
}

/**
 * Calculate branch quality score
 */
function calculateBranchScore(variation: BranchVariation): number {
  let score = 0.5 // Base score
  
  // Factor 1: Character arcs (0-0.2)
  if (variation.characterArcs.length > 0) {
    score += 0.1
    const completeArcs = variation.characterArcs.filter(a => 
      a.startingState && a.endingState
    ).length
    score += (completeArcs / variation.characterArcs.length) * 0.1
  }
  
  // Factor 2: Theme progression (0-0.15)
  score += Math.min(variation.themeProgression.length * 0.05, 0.15)
  
  // Factor 3: Trajectory completeness (0-0.2)
  if (variation.trajectory.keyEvents.length >= 3) score += 0.1
  if (variation.trajectory.climax) score += 0.05
  if (variation.trajectory.resolution) score += 0.05
  
  // Factor 4: Premise quality (0-0.15)
  if (variation.premise.affectedCharacters.length > 0) score += 0.05
  if (variation.premise.immediateConsequences.length > 0) score += 0.05
  if (variation.premise.longTermImplications.length > 0) score += 0.05
  
  // Factor 5: Appropriate scope (0-0.15)
  const expectedChapters = variation.complexity === 'simple' ? 3 : 
                           variation.complexity === 'moderate' ? 5 : 8
  if (Math.abs(variation.estimatedChapters - expectedChapters) <= 1) {
    score += 0.15
  } else {
    score += 0.05
  }
  
  // Factor 6: Mood-consequence alignment (0-0.15)
  const moodAlignment: Record<typeof variation.mood, number> = {
    hopeful: variation.trajectory.endingType === 'hopeful' ? 0.15 : 0.05,
    tragic: variation.trajectory.endingType === 'tragic' ? 0.15 : 0.05,
    mixed: ['bittersweet', 'ambiguous'].includes(variation.trajectory.endingType) ? 0.15 : 0.05,
    dark: ['tragic', 'ambiguous'].includes(variation.trajectory.endingType) ? 0.15 : 0.05,
  }
  score += moodAlignment[variation.mood]
  
  return Math.min(1, Math.max(0, score))
}

/**
 * Create iteration config with user preferences
 */
export function createIterationConfig(
  maxIterations: number = 3,
  options: Partial<Omit<IterationConfig, 'maxIterations'>> = {}
): IterationConfig {
  return {
    maxIterations: Math.min(5, Math.max(1, maxIterations)),
    stopOnSatisfaction: true,
    stopOnDiminishingReturns: true,
    minImprovementThreshold: 0.05,
    ...options,
  }
}

/**
 * Get iteration presets
 */
export function getIterationPresets(): Record<string, IterationConfig> {
  return {
    quick: {
      maxIterations: 1,
      stopOnSatisfaction: true,
      stopOnDiminishingReturns: false,
      minImprovementThreshold: 0,
    },
    standard: {
      maxIterations: 3,
      stopOnSatisfaction: true,
      stopOnDiminishingReturns: true,
      minImprovementThreshold: 0.05,
    },
    thorough: {
      maxIterations: 5,
      stopOnSatisfaction: false,
      stopOnDiminishingReturns: true,
      minImprovementThreshold: 0.02,
    },
    maximum: {
      maxIterations: 5,
      stopOnSatisfaction: false,
      stopOnDiminishingReturns: false,
      minImprovementThreshold: 0,
    },
  }
}
