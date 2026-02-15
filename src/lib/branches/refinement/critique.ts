/**
 * Critique-based refinement
 */

import type { BranchVariation } from '../variation/generator'
import type { ContextPackage } from '../context/adaptive-selector'
import type { RefinementArea, RefinementChange } from './refiner'

export interface Critique {
  id: string
  aspect: RefinementArea
  severity: 'minor' | 'moderate' | 'major'
  observation: string
  suggestion: string
  examples?: string[]
}

export interface CritiqueBasedRefinement {
  original: BranchVariation
  refined: BranchVariation
  critiques: Critique[]
  addressedCritiques: Critique[]
  changes: RefinementChange[]
}

/**
 * Generate critiques for a branch
 */
export function generateCritiques(
  variation: BranchVariation,
  context: ContextPackage
): Critique[] {
  const critiques: Critique[] = []
  
  // Character depth critique
  const shallowCharacters = variation.characterArcs.filter(arc => 
    arc.arcDescription.length < 50
  )
  if (shallowCharacters.length > 0) {
    critiques.push({
      id: `critique-char-${Date.now()}`,
      aspect: 'character-depth',
      severity: 'moderate',
      observation: `${shallowCharacters.length} character(s) have underdeveloped arcs`,
      suggestion: 'Expand on internal conflicts and growth moments',
      examples: shallowCharacters.map(c => c.characterName),
    })
  }
  
  // Plot coherence critique
  if (variation.trajectory.keyEvents.length < 3) {
    critiques.push({
      id: `critique-plot-${Date.now()}`,
      aspect: 'plot-coherence',
      severity: 'major',
      observation: 'Plot trajectory lacks sufficient events',
      suggestion: 'Add intermediate complications and turning points',
    })
  }
  
  // Theme development critique
  if (variation.themeProgression.length === 0) {
    critiques.push({
      id: `critique-theme-${Date.now()}`,
      aspect: 'theme-development',
      severity: 'major',
      observation: 'No theme progression defined',
      suggestion: 'Develop how themes evolve through the branch',
    })
  }
  
  // Emotional impact critique
  if (!variation.trajectory.climax.includes('emotional') && 
      !variation.trajectory.climax.includes('confrontation')) {
    critiques.push({
      id: `critique-emotion-${Date.now()}`,
      aspect: 'emotional-impact',
      severity: 'moderate',
      observation: 'Climax may lack emotional resonance',
      suggestion: 'Heighten emotional stakes at the climax',
    })
  }
  
  // Stakes clarity critique
  if (variation.premise.longTermImplications.length === 0) {
    critiques.push({
      id: `critique-stakes-${Date.now()}`,
      aspect: 'stakes-clarity',
      severity: 'moderate',
      observation: 'Long-term stakes not clearly established',
      suggestion: 'Define what happens if the branch succeeds or fails',
    })
  }
  
  // Pacing critique
  const expectedEvents = variation.estimatedChapters * 2
  if (variation.trajectory.keyEvents.length < expectedEvents * 0.5) {
    critiques.push({
      id: `critique-pacing-${Date.now()}`,
      aspect: 'pacing',
      severity: 'minor',
      observation: 'Event density may be too low for planned chapter count',
      suggestion: 'Add more plot events or reduce chapter estimate',
    })
  }
  
  // World-building critique
  const hasWorldContext = variation.premise.description.length > 100
  if (!hasWorldContext) {
    critiques.push({
      id: `critique-world-${Date.now()}`,
      aspect: 'world-building',
      severity: 'minor',
      observation: 'Limited world context in premise',
      suggestion: 'Expand on how the world state affects the branch',
    })
  }
  
  return critiques
}

/**
 * Apply critique-based refinement
 */
export function applyCritiqueRefinement(
  variation: BranchVariation,
  context: ContextPackage,
  critiques: Critique[]
): CritiqueBasedRefinement {
  let refined = { ...variation }
  const changes: RefinementChange[] = []
  const addressedCritiques: Critique[] = []
  
  // Sort critiques by severity
  const sortedCritiques = [...critiques].sort((a, b) => {
    const severityOrder = { major: 0, moderate: 1, minor: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })
  
  for (const critique of sortedCritiques) {
    const result = applyCritiqueFix(refined, critique, changes)
    if (result.applied) {
      refined = result.branch
      addressedCritiques.push(critique)
    }
  }
  
  return {
    original: variation,
    refined,
    critiques,
    addressedCritiques,
    changes,
  }
}

interface CritiqueFixResult {
  applied: boolean
  branch: BranchVariation
}

function applyCritiqueFix(
  variation: BranchVariation,
  critique: Critique,
  changes: RefinementChange[]
): CritiqueFixResult {
  let refined = { ...variation }
  let applied = false
  
  switch (critique.aspect) {
    case 'character-depth':
      if (critique.examples && critique.examples.length > 0) {
        refined.characterArcs = variation.characterArcs.map(arc => {
          if (critique.examples!.includes(arc.characterName)) {
            applied = true
            const newArc = {
              ...arc,
              arcDescription: `${arc.arcDescription} (enhanced: ${critique.suggestion})`,
            }
            changes.push({
              area: 'character-depth',
              description: `Enhanced ${arc.characterName}'s arc`,
              before: arc.arcDescription,
              after: newArc.arcDescription,
            })
            return newArc
          }
          return arc
        })
      }
      break
      
    case 'plot-coherence':
      if (critique.observation.includes('insufficient events')) {
        const newEvents = [
          'Complication: Unexpected obstacle arises',
          'Rising Action: Stakes intensify',
          ...variation.trajectory.keyEvents,
        ]
        refined.trajectory = {
          ...variation.trajectory,
          keyEvents: newEvents,
        }
        applied = true
        changes.push({
          area: 'plot-coherence',
          description: critique.suggestion,
          before: `${variation.trajectory.keyEvents.length} events`,
          after: `${newEvents.length} events`,
        })
      }
      break
      
    case 'theme-development':
      if (variation.themeProgression.length === 0) {
        refined.themeProgression = ['primary-theme-development', 'secondary-theme-exploration']
        applied = true
        changes.push({
          area: 'theme-development',
          description: critique.suggestion,
          before: 'No themes',
          after: 'Primary and secondary themes defined',
        })
      }
      break
      
    case 'emotional-impact':
      const newClimax = `${variation.trajectory.climax} (with heightened emotional stakes)`
      refined.trajectory = {
        ...variation.trajectory,
        climax: newClimax,
      }
      applied = true
      changes.push({
        area: 'emotional-impact',
        description: critique.suggestion,
        before: variation.trajectory.climax,
        after: newClimax,
      })
      break
      
    case 'stakes-clarity':
      const newImplications = [
        ...variation.premise.longTermImplications,
        'Success: Positive long-term outcome',
        'Failure: Negative consequences persist',
      ]
      refined.premise = {
        ...variation.premise,
        longTermImplications: newImplications,
      }
      applied = true
      changes.push({
        area: 'stakes-clarity',
        description: critique.suggestion,
        before: `${variation.premise.longTermImplications.length} implications`,
        after: `${newImplications.length} implications`,
      })
      break
      
    case 'pacing':
      const adjustedChapters = Math.max(3, variation.estimatedChapters - 1)
      refined.estimatedChapters = adjustedChapters
      applied = true
      changes.push({
        area: 'pacing',
        description: critique.suggestion,
        before: `${variation.estimatedChapters} chapters`,
        after: `${adjustedChapters} chapters`,
      })
      break
      
    case 'world-building':
      const newDescription = `${variation.premise.description} (Context: ${critique.suggestion})`
      refined.premise = {
        ...variation.premise,
        description: newDescription,
      }
      applied = true
      changes.push({
        area: 'world-building',
        description: critique.suggestion,
        before: 'Brief description',
        after: 'Expanded with world context',
      })
      break
  }
  
  return { applied, branch: refined }
}

/**
 * Compare critiques between iterations
 */
export function compareCritiques(
  before: Critique[],
  after: Critique[]
): {
  resolved: Critique[]
  remaining: Critique[]
  newIssues: Critique[]
} {
  const beforeIds = new Set(before.map(c => c.id))
  const afterIds = new Set(after.map(c => c.id))
  
  const resolved = before.filter(c => !afterIds.has(c.id))
  const remaining = after.filter(c => beforeIds.has(c.id))
  const newIssues = after.filter(c => !beforeIds.has(c.id))
  
  return { resolved, remaining, newIssues }
}
