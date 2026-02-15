/**
 * User-triggered branch refinement
 */

import type { BranchVariation } from '../variation/generator'
import type { ContextPackage } from '../context/adaptive-selector'

export interface RefinementRequest {
  branchId: string
  focusAreas: RefinementArea[]
  userInstructions: string
  priority: 'low' | 'medium' | 'high'
}

export type RefinementArea = 
  | 'character-depth'
  | 'plot-coherence'
  | 'theme-development'
  | 'emotional-impact'
  | 'dialogue-quality'
  | 'pacing'
  | 'world-building'
  | 'stakes-clarity'

export interface RefinementResult {
  original: BranchVariation
  refined: BranchVariation
  changes: RefinementChange[]
  iteration: number
  userSatisfied: boolean
}

export interface RefinementChange {
  area: RefinementArea
  description: string
  before: string
  after: string
}

/**
 * Trigger refinement for a branch
 */
export async function triggerRefinement(
  variation: BranchVariation,
  context: ContextPackage,
  request: RefinementRequest
): Promise<RefinementResult> {
  let current = { ...variation }
  const changes: RefinementChange[] = []
  
  // Apply refinements for each focus area
  for (const area of request.focusAreas) {
    const refinement = await refineArea(current, context, area, request.userInstructions)
    current = refinement.branch
    changes.push(...refinement.changes)
  }
  
  return {
    original: variation,
    refined: current,
    changes,
    iteration: 1,
    userSatisfied: false, // User decides this
  }
}

interface AreaRefinement {
  branch: BranchVariation
  changes: RefinementChange[]
}

async function refineArea(
  variation: BranchVariation,
  context: ContextPackage,
  area: RefinementArea,
  instructions: string
): Promise<AreaRefinement> {
  const changes: RefinementChange[] = []
  let refined = { ...variation }
  
  switch (area) {
    case 'character-depth':
      refined = refineCharacterDepth(refined, context, instructions, changes)
      break
    case 'plot-coherence':
      refined = refinePlotCoherence(refined, instructions, changes)
      break
    case 'theme-development':
      refined = refineThemeDevelopment(refined, instructions, changes)
      break
    case 'emotional-impact':
      refined = refineEmotionalImpact(refined, instructions, changes)
      break
    case 'dialogue-quality':
      refined = refineDialogueQuality(refined, instructions, changes)
      break
    case 'pacing':
      refined = refinePacing(refined, instructions, changes)
      break
    case 'world-building':
      refined = refineWorldBuilding(refined, context, instructions, changes)
      break
    case 'stakes-clarity':
      refined = refineStakesClarity(refined, instructions, changes)
      break
  }
  
  return { branch: refined, changes }
}

function refineCharacterDepth(
  variation: BranchVariation,
  context: ContextPackage,
  instructions: string,
  changes: RefinementChange[]
): BranchVariation {
  const refinedArcs = variation.characterArcs.map(arc => {
    const char = context.characters.find(c => c.id === arc.characterId)
    if (!char) return arc
    
    const newArc = {
      ...arc,
      arcDescription: `${arc.arcDescription} (enhanced: ${instructions})`,
    }
    
    changes.push({
      area: 'character-depth',
      description: `Enhanced arc for ${arc.characterName}`,
      before: arc.arcDescription,
      after: newArc.arcDescription,
    })
    
    return newArc
  })
  
  return {
    ...variation,
    characterArcs: refinedArcs,
  }
}

function refinePlotCoherence(
  variation: BranchVariation,
  instructions: string,
  changes: RefinementChange[]
): BranchVariation {
  const newEvents = [...variation.trajectory.keyEvents]
  
  // Add coherence markers based on instructions
  if (instructions.toLowerCase().includes('clearer')) {
    newEvents.unshift('Setup: Establishing context')
    changes.push({
      area: 'plot-coherence',
      description: 'Added setup context',
      before: 'No explicit setup',
      after: 'Setup: Establishing context',
    })
  }
  
  return {
    ...variation,
    trajectory: {
      ...variation.trajectory,
      keyEvents: newEvents,
    },
  }
}

function refineThemeDevelopment(
  variation: BranchVariation,
  instructions: string,
  changes: RefinementChange[]
): BranchVariation {
  const newThemes = [...variation.themeProgression]
  
  if (instructions) {
    newThemes.push(`user-requested: ${instructions}`)
    changes.push({
      area: 'theme-development',
      description: 'Added user-requested theme emphasis',
      before: variation.themeProgression.join(', '),
      after: newThemes.join(', '),
    })
  }
  
  return {
    ...variation,
    themeProgression: newThemes,
  }
}

function refineEmotionalImpact(
  variation: BranchVariation,
  instructions: string,
  changes: RefinementChange[]
): BranchVariation {
  const newClimax = `${variation.trajectory.climax} (heightened emotional impact: ${instructions})`
  
  changes.push({
    area: 'emotional-impact',
    description: 'Enhanced climax emotional weight',
    before: variation.trajectory.climax,
    after: newClimax,
  })
  
  return {
    ...variation,
    trajectory: {
      ...variation.trajectory,
      climax: newClimax,
    },
  }
}

function refineDialogueQuality(
  variation: BranchVariation,
  instructions: string,
  changes: RefinementChange[]
): BranchVariation {
  // Dialogue refinement would be applied during actual writing
  changes.push({
    area: 'dialogue-quality',
    description: 'Marked for dialogue enhancement',
    before: 'Standard dialogue',
    after: `Enhanced dialogue: ${instructions}`,
  })
  
  return variation
}

function refinePacing(
  variation: BranchVariation,
  instructions: string,
  changes: RefinementChange[]
): BranchVariation {
  let newChapterCount = variation.estimatedChapters
  
  if (instructions.toLowerCase().includes('faster')) {
    newChapterCount = Math.max(3, newChapterCount - 1)
  } else if (instructions.toLowerCase().includes('slower')) {
    newChapterCount = newChapterCount + 1
  }
  
  changes.push({
    area: 'pacing',
    description: 'Adjusted chapter count',
    before: `${variation.estimatedChapters} chapters`,
    after: `${newChapterCount} chapters`,
  })
  
  return {
    ...variation,
    estimatedChapters: newChapterCount,
  }
}

function refineWorldBuilding(
  variation: BranchVariation,
  context: ContextPackage,
  instructions: string,
  changes: RefinementChange[]
): BranchVariation {
  // Add world-building notes
  changes.push({
    area: 'world-building',
    description: 'Enhanced world details',
    before: 'Standard world context',
    after: `Enhanced: ${instructions}`,
  })
  
  return variation
}

function refineStakesClarity(
  variation: BranchVariation,
  instructions: string,
  changes: RefinementChange[]
): BranchVariation {
  const newPremise = {
    ...variation.premise,
    longTermImplications: [
      ...variation.premise.longTermImplications,
      `Clarified stakes: ${instructions}`,
    ],
  }
  
  changes.push({
    area: 'stakes-clarity',
    description: 'Added stakes clarification',
    before: 'Previous stakes',
    after: `Clarified: ${instructions}`,
  })
  
  return {
    ...variation,
    premise: newPremise,
  }
}
