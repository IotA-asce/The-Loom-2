/**
 * Character fate similarity calculation
 */

import type { BranchVariation, CharacterArcProjection } from '../variation/generator'

export interface CharacterFateComparison {
  characterId: string
  characterName: string
  fateSimilarity: number // 0-1
  fateDivergence: 'none' | 'minor' | 'significant' | 'complete'
  branchAState: string
  branchBState: string
  branchAGrowth: CharacterArcProjection['growth']
  branchBGrowth: CharacterArcProjection['growth']
  implications: string[]
}

export interface CharacterFateMatrix {
  characters: CharacterFateComparison[]
  overallSimilarity: number
  mostDivergent: CharacterFateComparison | null
  mostSimilar: CharacterFateComparison | null
  summary: string
}

/**
 * Calculate character fate similarity between branches
 */
export function calculateCharacterFateSimilarity(
  branchA: BranchVariation,
  branchB: BranchVariation
): CharacterFateMatrix {
  const comparisons: CharacterFateComparison[] = []
  
  // Get all unique characters
  const allCharacterIds = new Set([
    ...branchA.characterArcs.map(a => a.characterId),
    ...branchB.characterArcs.map(a => a.characterId),
  ])
  
  for (const charId of allCharacterIds) {
    const arcA = branchA.characterArcs.find(a => a.characterId === charId)
    const arcB = branchB.characterArcs.find(a => a.characterId === charId)
    
    if (arcA && arcB) {
      comparisons.push(compareCharacterFates(arcA, arcB))
    } else if (arcA) {
      // Character only in branch A
      comparisons.push({
        characterId: charId,
        characterName: arcA.characterName,
        fateSimilarity: 0,
        fateDivergence: 'complete',
        branchAState: arcA.endingState,
        branchBState: 'N/A (not present)',
        branchAGrowth: arcA.growth,
        branchBGrowth: 'neutral',
        implications: [`${arcA.characterName} only appears in Branch A`],
      })
    } else if (arcB) {
      // Character only in branch B
      comparisons.push({
        characterId: charId,
        characterName: arcB.characterName,
        fateSimilarity: 0,
        fateDivergence: 'complete',
        branchAState: 'N/A (not present)',
        branchBState: arcB.endingState,
        branchAGrowth: 'neutral',
        branchBGrowth: arcB.growth,
        implications: [`${arcB.characterName} only appears in Branch B`],
      })
    }
  }
  
  // Calculate overall similarity
  const similarities = comparisons.map(c => c.fateSimilarity)
  const overallSimilarity = similarities.length > 0
    ? similarities.reduce((a, b) => a + b, 0) / similarities.length
    : 0
  
  // Find most divergent and similar
  const sorted = [...comparisons].sort((a, b) => a.fateSimilarity - b.fateSimilarity)
  const mostDivergent = sorted[0]?.fateSimilarity < 0.5 ? sorted[0] : null
  const mostSimilar = sorted[sorted.length - 1]?.fateSimilarity > 0.8 
    ? sorted[sorted.length - 1] 
    : null
  
  return {
    characters: comparisons,
    overallSimilarity,
    mostDivergent,
    mostSimilar,
    summary: generateFateSummary(comparisons, overallSimilarity),
  }
}

function compareCharacterFates(
  arcA: CharacterArcProjection,
  arcB: CharacterArcProjection
): CharacterFateComparison {
  // Calculate growth similarity
  const growthSimilarity = calculateGrowthSimilarity(arcA.growth, arcB.growth)
  
  // Calculate ending state similarity
  const stateSimilarity = calculateStateSimilarity(arcA.endingState, arcB.endingState)
  
  // Calculate arc description similarity
  const arcSimilarity = calculateArcSimilarity(arcA.arcDescription, arcB.arcDescription)
  
  // Weighted average
  const fateSimilarity = (
    growthSimilarity * 0.4 +
    stateSimilarity * 0.4 +
    arcSimilarity * 0.2
  )
  
  // Determine divergence level
  const fateDivergence: CharacterFateComparison['fateDivergence'] =
    fateSimilarity >= 0.8 ? 'none' :
    fateSimilarity >= 0.5 ? 'minor' :
    fateSimilarity >= 0.2 ? 'significant' : 'complete'
  
  // Generate implications
  const implications = generateImplications(arcA, arcB, fateDivergence)
  
  return {
    characterId: arcA.characterId,
    characterName: arcA.characterName,
    fateSimilarity,
    fateDivergence,
    branchAState: arcA.endingState,
    branchBState: arcB.endingState,
    branchAGrowth: arcA.growth,
    branchBGrowth: arcB.growth,
    implications,
  }
}

function calculateGrowthSimilarity(
  growthA: CharacterArcProjection['growth'],
  growthB: CharacterArcProjection['growth']
): number {
  if (growthA === growthB) return 1
  
  // Define similarity between different growth types
  const similarityMatrix: Record<string, Record<string, number>> = {
    positive: { negative: 0, neutral: 0.3, complex: 0.5 },
    negative: { positive: 0, neutral: 0.3, complex: 0.5 },
    neutral: { positive: 0.3, negative: 0.3, complex: 0.7 },
    complex: { positive: 0.5, negative: 0.5, neutral: 0.7 },
  }
  
  return similarityMatrix[growthA]?.[growthB] ?? 0.5
}

function calculateStateSimilarity(stateA: string, stateB: string): number {
  const wordsA = new Set(stateA.toLowerCase().split(' '))
  const wordsB = new Set(stateB.toLowerCase().split(' '))
  
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)))
  const union = new Set([...wordsA, ...wordsB])
  
  if (union.size === 0) return 0
  
  // Also check for antonyms
  const antonyms: Record<string, string[]> = {
    'happy': ['sad', 'broken', 'defeated'],
    'fulfilled': ['empty', 'broken', 'lost'],
    'triumphant': ['defeated', 'broken', 'fallen'],
    'at peace': ['haunted', 'conflicted', 'troubled'],
  }
  
  let similarity = intersection.size / union.size
  
  // Reduce similarity for antonyms
  for (const [word, opposites] of Object.entries(antonyms)) {
    if (wordsA.has(word) && opposites.some(o => wordsB.has(o))) {
      similarity *= 0.3
    }
  }
  
  return similarity
}

function calculateArcSimilarity(arcA: string, arcB: string): number {
  const wordsA = new Set(arcA.toLowerCase().split(' '))
  const wordsB = new Set(arcB.toLowerCase().split(' '))
  
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)))
  const union = new Set([...wordsA, ...wordsB])
  
  return union.size > 0 ? intersection.size / union.size : 0
}

function generateImplications(
  arcA: CharacterArcProjection,
  arcB: CharacterArcProjection,
  divergence: CharacterFateComparison['fateDivergence']
): string[] {
  const implications: string[] = []
  
  switch (divergence) {
    case 'none':
      implications.push(`${arcA.characterName}'s fate is consistent across branches`)
      break
    case 'minor':
      implications.push(`${arcA.characterName} reaches similar endpoints through different paths`)
      break
    case 'significant':
      implications.push(`${arcA.characterName}'s fate differs substantially between branches`)
      implications.push(`Consider how ${arcA.characterName}'s choices lead to different outcomes`)
      break
    case 'complete':
      implications.push(`${arcA.characterName} has completely different fates`)
      implications.push('Major decision point for this character')
      break
  }
  
  if (arcA.growth !== arcB.growth) {
    implications.push(`Character growth differs: ${arcA.growth} vs ${arcB.growth}`)
  }
  
  return implications
}

function generateFateSummary(
  comparisons: CharacterFateComparison[],
  overallSimilarity: number
): string {
  const divergent = comparisons.filter(c => c.fateDivergence !== 'none').length
  const consistent = comparisons.filter(c => c.fateDivergence === 'none').length
  
  if (overallSimilarity > 0.8) {
    return `Character fates are highly consistent across branches (${consistent}/${comparisons.length} identical)`
  } else if (overallSimilarity > 0.5) {
    return `Some character fates diverge (${divergent} with notable differences)`
  } else {
    return `Character fates diverge significantly (${divergent} with major differences)`
  }
}

/**
 * Compare character fates across multiple branches
 */
export function compareFatesAcrossBranches(
  branches: BranchVariation[]
): {
  characterFates: Map<string, Map<string, CharacterArcProjection>>
  divergenceHeatmap: number[][]
} {
  const characterFates = new Map<string, Map<string, CharacterArcProjection>>()
  
  // Collect all fates
  for (const branch of branches) {
    for (const arc of branch.characterArcs) {
      if (!characterFates.has(arc.characterId)) {
        characterFates.set(arc.characterId, new Map())
      }
      characterFates.get(arc.characterId)!.set(branch.id, arc)
    }
  }
  
  // Build divergence heatmap
  const heatmap: number[][] = []
  const charIds = Array.from(characterFates.keys())
  
  for (let i = 0; i < branches.length; i++) {
    heatmap[i] = []
    for (let j = 0; j < branches.length; j++) {
      if (i === j) {
        heatmap[i][j] = 1
      } else {
        const matrix = calculateCharacterFateSimilarity(branches[i], branches[j])
        heatmap[i][j] = matrix.overallSimilarity
      }
    }
  }
  
  return { characterFates, divergenceHeatmap: heatmap }
}
