/**
 * 8-dimension comparison for branches
 */

import type { BranchVariation } from '../variation/generator'

export type ComparisonDimension = 
  | 'premise-similarity'
  | 'character-fates'
  | 'theme-alignment'
  | 'ending-contrast'
  | 'emotional-arc'
  | 'consequence-scope'
  | 'narrative-structure'
  | 'reader-experience'

export interface DimensionComparison {
  dimension: ComparisonDimension
  similarity: number // 0-1, 1 = identical
  differences: string[]
  notable: string[]
}

export interface BranchComparison {
  branchA: BranchVariation
  branchB: BranchVariation
  dimensions: Record<ComparisonDimension, DimensionComparison>
  overallSimilarity: number
  keyDifferences: string[]
  recommendation: string
}

/**
 * Compare two branches across all 8 dimensions
 */
export function compareBranches(
  branchA: BranchVariation,
  branchB: BranchVariation
): BranchComparison {
  const dimensions: Record<ComparisonDimension, DimensionComparison> = {
    'premise-similarity': comparePremise(branchA, branchB),
    'character-fates': compareCharacterFates(branchA, branchB),
    'theme-alignment': compareThemeAlignment(branchA, branchB),
    'ending-contrast': compareEndingContrast(branchA, branchB),
    'emotional-arc': compareEmotionalArc(branchA, branchB),
    'consequence-scope': compareConsequenceScope(branchA, branchB),
    'narrative-structure': compareNarrativeStructure(branchA, branchB),
    'reader-experience': compareReaderExperience(branchA, branchB),
  }
  
  // Calculate overall similarity
  const scores = Object.values(dimensions).map(d => d.similarity)
  const overallSimilarity = scores.reduce((a, b) => a + b, 0) / scores.length
  
  // Collect key differences
  const keyDifferences: string[] = []
  for (const dim of Object.values(dimensions)) {
    if (dim.similarity < 0.5) {
      keyDifferences.push(...dim.differences.slice(0, 2))
    }
  }
  
  return {
    branchA,
    branchB,
    dimensions,
    overallSimilarity,
    keyDifferences: [...new Set(keyDifferences)].slice(0, 5),
    recommendation: generateRecommendation(dimensions, overallSimilarity),
  }
}

function comparePremise(a: BranchVariation, b: BranchVariation): DimensionComparison {
  const differences: string[] = []
  const notable: string[] = []
  let similarity = 0
  
  // Compare consequence types
  if (a.consequenceType === b.consequenceType) {
    similarity += 0.3
    notable.push(`Both have ${a.consequenceType} consequences`)
  } else {
    differences.push(`Different consequence types: ${a.consequenceType} vs ${b.consequenceType}`)
  }
  
  // Compare affected characters
  const commonChars = a.premise.affectedCharacters.filter(c => 
    b.premise.affectedCharacters.includes(c)
  )
  const charSimilarity = commonChars.length / Math.max(
    a.premise.affectedCharacters.length,
    b.premise.affectedCharacters.length
  )
  similarity += charSimilarity * 0.4
  
  if (commonChars.length > 0) {
    notable.push(`${commonChars.length} characters in common`)
  }
  
  // Compare themes
  const commonThemes = a.themeProgression.filter(t => 
    b.themeProgression.includes(t)
  )
  similarity += (commonThemes.length / Math.max(a.themeProgression.length, 1)) * 0.3
  
  return { dimension: 'premise-similarity', similarity, differences, notable }
}

function compareCharacterFates(a: BranchVariation, b: BranchVariation): DimensionComparison {
  const differences: string[] = []
  const notable: string[] = []
  
  const arcPairs = a.characterArcs.map(arcA => {
    const arcB = b.characterArcs.find(arc => arc.characterId === arcA.characterId)
    return { arcA, arcB }
  })
  
  let similarFates = 0
  let differentFates = 0
  
  for (const { arcA, arcB } of arcPairs) {
    if (!arcB) continue
    
    if (arcA.growth === arcB.growth) {
      similarFates++
    } else {
      differentFates++
      differences.push(`${arcA.characterName}: ${arcA.growth} vs ${arcB.growth}`)
    }
  }
  
  const total = similarFates + differentFates
  const similarity = total > 0 ? similarFates / total : 0.5
  
  if (differentFates > 0) {
    notable.push(`${differentFates} character(s) with different outcomes`)
  }
  
  return { dimension: 'character-fates', similarity, differences, notable }
}

function compareThemeAlignment(a: BranchVariation, b: BranchVariation): DimensionComparison {
  const differences: string[] = []
  const notable: string[] = []
  
  const setA = new Set(a.themeProgression)
  const setB = new Set(b.themeProgression)
  
  const intersection = new Set([...setA].filter(x => setB.has(x)))
  const union = new Set([...setA, ...setB])
  
  const similarity = union.size > 0 ? intersection.size / union.size : 0
  
  if (intersection.size > 0) {
    notable.push(`Common themes: ${[...intersection].slice(0, 3).join(', ')}`)
  }
  
  const uniqueA = [...setA].filter(x => !setB.has(x))
  const uniqueB = [...setB].filter(x => !setA.has(x))
  
  if (uniqueA.length > 0) {
    differences.push(`Branch A unique: ${uniqueA.slice(0, 2).join(', ')}`)
  }
  if (uniqueB.length > 0) {
    differences.push(`Branch B unique: ${uniqueB.slice(0, 2).join(', ')}`)
  }
  
  return { dimension: 'theme-alignment', similarity, differences, notable }
}

function compareEndingContrast(a: BranchVariation, b: BranchVariation): DimensionComparison {
  const differences: string[] = []
  const notable: string[] = []
  let similarity = 0
  
  // Compare ending types
  if (a.trajectory.endingType === b.trajectory.endingType) {
    similarity += 0.4
    notable.push(`Both end ${a.trajectory.endingType}`)
  } else {
    differences.push(`Different endings: ${a.trajectory.endingType} vs ${b.trajectory.endingType}`)
  }
  
  // Compare moods
  if (a.mood === b.mood) {
    similarity += 0.3
  } else {
    differences.push(`Different moods: ${a.mood} vs ${b.mood}`)
  }
  
  // Compare resolution similarity
  const resSimilarity = compareTextSimilarity(
    a.trajectory.resolution,
    b.trajectory.resolution
  )
  similarity += resSimilarity * 0.3
  
  return { dimension: 'ending-contrast', similarity, differences, notable }
}

function compareEmotionalArc(a: BranchVariation, b: BranchVariation): DimensionComparison {
  const differences: string[] = []
  const notable: string[] = []
  let similarity = 0
  
  // Compare mood trajectories
  const moodProgressionA = getMoodProgression(a)
  const moodProgressionB = getMoodProgression(b)
  
  if (moodProgressionA === moodProgressionB) {
    similarity = 0.8
    notable.push('Similar emotional journey')
  } else {
    differences.push(`Different emotional arcs: ${moodProgressionA} vs ${moodProgressionB}`)
    similarity = 0.3
  }
  
  return { dimension: 'emotional-arc', similarity, differences, notable }
}

function compareConsequenceScope(a: BranchVariation, b: BranchVariation): DimensionComparison {
  const differences: string[] = []
  const notable: string[] = []
  let similarity = 0
  
  // Compare consequence types
  const scopeWeight = { personal: 1, political: 2, cosmic: 3 }
  const scopeA = scopeWeight[a.consequenceType]
  const scopeB = scopeWeight[b.consequenceType]
  
  if (a.consequenceType === b.consequenceType) {
    similarity = 0.9
    notable.push(`Same scope: ${a.consequenceType}`)
  } else {
    const diff = Math.abs(scopeA - scopeB)
    similarity = 1 - (diff / 3)
    differences.push(`Scope differs: ${a.consequenceType} vs ${b.consequenceType}`)
  }
  
  // Compare affected character count
  const charDiff = Math.abs(
    a.premise.affectedCharacters.length - b.premise.affectedCharacters.length
  )
  if (charDiff === 0) {
    similarity = similarity * 0.5 + 0.5
  }
  
  return { dimension: 'consequence-scope', similarity, differences, notable }
}

function compareNarrativeStructure(a: BranchVariation, b: BranchVariation): DimensionComparison {
  const differences: string[] = []
  const notable: string[] = []
  let similarity = 0
  
  // Compare chapter counts
  const chapterDiff = Math.abs(a.estimatedChapters - b.estimatedChapters)
  const chapterSimilarity = 1 - Math.min(chapterDiff / 5, 1)
  similarity += chapterSimilarity * 0.3
  
  // Compare event counts
  const eventDiff = Math.abs(
    a.trajectory.keyEvents.length - b.trajectory.keyEvents.length
  )
  const eventSimilarity = 1 - Math.min(eventDiff / 5, 1)
  similarity += eventSimilarity * 0.3
  
  // Compare complexity
  if (a.complexity === b.complexity) {
    similarity += 0.4
    notable.push(`Same complexity: ${a.complexity}`)
  } else {
    differences.push(`Different complexity: ${a.complexity} vs ${b.complexity}`)
  }
  
  return { dimension: 'narrative-structure', similarity, differences, notable }
}

function compareReaderExperience(a: BranchVariation, b: BranchVariation): DimensionComparison {
  const differences: string[] = []
  const notable: string[] = []
  let similarity = 0
  
  // Compare overall experience based on mood + ending
  const experienceA = `${a.mood}-${a.trajectory.endingType}`
  const experienceB = `${b.mood}-${b.trajectory.endingType}`
  
  if (experienceA === experienceB) {
    similarity = 0.9
    notable.push('Very similar reader experience')
  } else if (a.mood === b.mood) {
    similarity = 0.6
    notable.push('Similar emotional tone')
  } else {
    similarity = 0.2
    differences.push('Distinctly different reading experiences')
  }
  
  return { dimension: 'reader-experience', similarity, differences, notable }
}

function compareTextSimilarity(textA: string, textB: string): number {
  const wordsA = new Set(textA.toLowerCase().split(' '))
  const wordsB = new Set(textB.toLowerCase().split(' '))
  
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)))
  const union = new Set([...wordsA, ...wordsB])
  
  return union.size > 0 ? intersection.size / union.size : 0
}

function getMoodProgression(branch: BranchVariation): string {
  // Simplified mood progression
  return `${branch.mood}-to-${branch.trajectory.endingType}`
}

function generateRecommendation(
  dimensions: Record<ComparisonDimension, DimensionComparison>,
  overallSimilarity: number
): string {
  if (overallSimilarity > 0.8) {
    return 'Branches are very similar - consider if both are needed'
  } else if (overallSimilarity > 0.5) {
    return 'Branches offer moderate variety with some common elements'
  } else if (overallSimilarity > 0.3) {
    return 'Branches provide good contrast and meaningful choices'
  } else {
    return 'Branches are very different - excellent for diverse experiences'
  }
}
