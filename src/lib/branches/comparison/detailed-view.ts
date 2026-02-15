/**
 * Detailed comparison view with toggles
 */

import type { BranchVariation } from '../variation/generator'
import type { ComparisonDimension } from './dimensions'

export type DetailLevel = 'summary' | 'moderate' | 'full'

export interface DetailedComparisonView {
  level: DetailLevel
  sections: ComparisonSection[]
  visibleDimensions: ComparisonDimension[]
  hiddenDimensions: ComparisonDimension[]
}

export interface ComparisonSection {
  dimension: ComparisonDimension
  title: string
  summary: string
  details: string[]
  similarity: number
  expanded: boolean
  highlight: 'similar' | 'different' | 'neutral'
}

/**
 * Generate detailed comparison view
 */
export function generateDetailedView(
  branchA: BranchVariation,
  branchB: BranchVariation,
  level: DetailLevel = 'moderate'
): DetailedComparisonView {
  const sections: ComparisonSection[] = [
    generatePremiseSection(branchA, branchB, level),
    generateCharacterSection(branchA, branchB, level),
    generateThemeSection(branchA, branchB, level),
    generateEndingSection(branchA, branchB, level),
    generateStructureSection(branchA, branchB, level),
    generateMoodSection(branchA, branchB, level),
    generateStakesSection(branchA, branchB, level),
    generateExperienceSection(branchA, branchB, level),
  ]
  
  const visibleDimensions = sections
    .filter(s => s.similarity < 0.9 || level === 'full')
    .map(s => s.dimension)
  
  const hiddenDimensions = sections
    .filter(s => s.similarity >= 0.9 && level !== 'full')
    .map(s => s.dimension)
  
  return {
    level,
    sections,
    visibleDimensions,
    hiddenDimensions,
  }
}

function generatePremiseSection(
  a: BranchVariation,
  b: BranchVariation,
  level: DetailLevel
): ComparisonSection {
  const details: string[] = []
  
  details.push(`Branch A: ${a.premise.whatIf}`)
  details.push(`Branch B: ${b.premise.whatIf}`)
  
  if (level === 'full') {
    details.push(`A consequences: ${a.premise.immediateConsequences.join(', ')}`)
    details.push(`B consequences: ${b.premise.immediateConsequences.join(', ')}`)
  }
  
  const similarity = a.consequenceType === b.consequenceType ? 0.7 : 0.3
  
  return {
    dimension: 'premise-similarity',
    title: 'Premise',
    summary: a.consequenceType === b.consequenceType 
      ? `Both explore ${a.consequenceType} consequences`
      : `Different consequence scopes: ${a.consequenceType} vs ${b.consequenceType}`,
    details,
    similarity,
    expanded: similarity < 0.8,
    highlight: similarity > 0.6 ? 'similar' : 'different',
  }
}

function generateCharacterSection(
  a: BranchVariation,
  b: BranchVariation,
  level: DetailLevel
): ComparisonSection {
  const commonChars = a.characterArcs.filter(ca => 
    b.characterArcs.some(cb => cb.characterId === ca.characterId)
  )
  
  const details: string[] = []
  
  for (const charA of commonChars) {
    const charB = b.characterArcs.find(c => c.characterId === charA.characterId)!
    const sameFate = charA.endingState === charB.endingState
    
    if (level === 'summary') {
      details.push(`${charA.characterName}: ${sameFate ? 'Same fate' : 'Different fate'}`)
    } else {
      details.push(`${charA.characterName}:`)
      details.push(`  A: ${charA.endingState} (${charA.growth})`)
      details.push(`  B: ${charB.endingState} (${charB.growth})`)
    }
  }
  
  const similarity = commonChars.length / Math.max(a.characterArcs.length, b.characterArcs.length)
  
  return {
    dimension: 'character-fates',
    title: 'Character Fates',
    summary: `${commonChars.length} characters in common`,
    details,
    similarity,
    expanded: similarity < 0.8,
    highlight: similarity > 0.7 ? 'similar' : 'different',
  }
}

function generateThemeSection(
  a: BranchVariation,
  b: BranchVariation,
  level: DetailLevel
): ComparisonSection {
  const commonThemes = a.themeProgression.filter(t => b.themeProgression.includes(t))
  const allThemes = [...new Set([...a.themeProgression, ...b.themeProgression])]
  
  const details: string[] = []
  
  if (commonThemes.length > 0) {
    details.push(`Shared themes: ${commonThemes.join(', ')}`)
  }
  
  if (level === 'full') {
    const uniqueA = a.themeProgression.filter(t => !b.themeProgression.includes(t))
    const uniqueB = b.themeProgression.filter(t => !a.themeProgression.includes(t))
    
    if (uniqueA.length > 0) details.push(`A unique: ${uniqueA.join(', ')}`)
    if (uniqueB.length > 0) details.push(`B unique: ${uniqueB.join(', ')}`)
  }
  
  const similarity = allThemes.length > 0 ? commonThemes.length / allThemes.length : 0
  
  return {
    dimension: 'theme-alignment',
    title: 'Themes',
    summary: `${commonThemes.length} of ${allThemes.length} themes shared`,
    details,
    similarity,
    expanded: similarity < 0.7,
    highlight: similarity > 0.6 ? 'similar' : 'different',
  }
}

function generateEndingSection(
  a: BranchVariation,
  b: BranchVariation,
  level: DetailLevel
): ComparisonSection {
  const sameEnding = a.trajectory.endingType === b.trajectory.endingType
  const sameMood = a.mood === b.mood
  
  const details: string[] = []
  details.push(`Ending: ${a.trajectory.endingType} vs ${b.trajectory.endingType}`)
  details.push(`Mood: ${a.mood} vs ${b.mood}`)
  
  if (level === 'full') {
    details.push(`A resolution: ${a.trajectory.resolution}`)
    details.push(`B resolution: ${b.trajectory.resolution}`)
  }
  
  const similarity = (sameEnding ? 0.5 : 0) + (sameMood ? 0.5 : 0)
  
  return {
    dimension: 'ending-contrast',
    title: 'Ending',
    summary: sameEnding && sameMood 
      ? 'Similar endings and mood'
      : sameEnding 
        ? 'Same ending type, different mood'
        : 'Different endings',
    details,
    similarity,
    expanded: !sameEnding || !sameMood,
    highlight: sameEnding && sameMood ? 'similar' : 'different',
  }
}

function generateStructureSection(
  a: BranchVariation,
  b: BranchVariation,
  level: DetailLevel
): ComparisonSection {
  const details: string[] = []
  
  details.push(`Chapters: ${a.estimatedChapters} vs ${b.estimatedChapters}`)
  details.push(`Complexity: ${a.complexity} vs ${b.complexity}`)
  details.push(`Events: ${a.trajectory.keyEvents.length} vs ${b.trajectory.keyEvents.length}`)
  
  if (level === 'full') {
    details.push(`A events: ${a.trajectory.keyEvents.slice(0, 3).join(', ')}`)
    details.push(`B events: ${b.trajectory.keyEvents.slice(0, 3).join(', ')}`)
  }
  
  const similarity = a.complexity === b.complexity ? 0.7 : 0.4
  
  return {
    dimension: 'narrative-structure',
    title: 'Structure',
    summary: a.complexity === b.complexity 
      ? `Same complexity (${a.complexity})`
      : `Different complexity: ${a.complexity} vs ${b.complexity}`,
    details,
    similarity,
    expanded: false,
    highlight: 'neutral',
  }
}

function generateMoodSection(
  a: BranchVariation,
  b: BranchVariation,
  _level: DetailLevel
): ComparisonSection {
  const details: string[] = [
    `Primary mood: ${a.mood} vs ${b.mood}`,
  ]
  
  const similarity = a.mood === b.mood ? 1 : 0.2
  
  return {
    dimension: 'emotional-arc',
    title: 'Emotional Arc',
    summary: a.mood === b.mood 
      ? `Same mood: ${a.mood}`
      : `Different moods: ${a.mood} vs ${b.mood}`,
    details,
    similarity,
    expanded: a.mood !== b.mood,
    highlight: a.mood === b.mood ? 'similar' : 'different',
  }
}

function generateStakesSection(
  a: BranchVariation,
  b: BranchVariation,
  level: DetailLevel
): ComparisonSection {
  const details: string[] = []
  
  details.push(`Consequence type: ${a.consequenceType} vs ${b.consequenceType}`)
  
  if (level !== 'summary') {
    details.push(`A affected: ${a.premise.affectedCharacters.join(', ') || 'None'}`)
    details.push(`B affected: ${b.premise.affectedCharacters.join(', ') || 'None'}`)
  }
  
  const similarity = a.consequenceType === b.consequenceType ? 0.8 : 0.3
  
  return {
    dimension: 'consequence-scope',
    title: 'Stakes',
    summary: a.consequenceType === b.consequenceType
      ? `Same scope: ${a.consequenceType}`
      : `Different scope: ${a.consequenceType} vs ${b.consequenceType}`,
    details,
    similarity,
    expanded: a.consequenceType !== b.consequenceType,
    highlight: a.consequenceType === b.consequenceType ? 'similar' : 'different',
  }
}

function generateExperienceSection(
  a: BranchVariation,
  b: BranchVariation,
  _level: DetailLevel
): ComparisonSection {
  const experienceA = `${a.mood}-${a.trajectory.endingType}`
  const experienceB = `${b.mood}-${b.trajectory.endingType}`
  
  const details: string[] = [
    `Branch A experience: ${experienceA}`,
    `Branch B experience: ${experienceB}`,
  ]
  
  const similarity = experienceA === experienceB ? 0.9 : 0.3
  
  return {
    dimension: 'reader-experience',
    title: 'Reader Experience',
    summary: experienceA === experienceB
      ? 'Very similar reading experience'
      : 'Distinctly different experiences',
    details,
    similarity,
    expanded: experienceA !== experienceB,
    highlight: experienceA === experienceB ? 'similar' : 'different',
  }
}

/**
 * Toggle dimension visibility
 */
export function toggleDimension(
  view: DetailedComparisonView,
  dimension: ComparisonDimension
): DetailedComparisonView {
  const isVisible = view.visibleDimensions.includes(dimension)
  
  return {
    ...view,
    visibleDimensions: isVisible
      ? view.visibleDimensions.filter(d => d !== dimension)
      : [...view.visibleDimensions, dimension],
    hiddenDimensions: isVisible
      ? [...view.hiddenDimensions, dimension]
      : view.hiddenDimensions.filter(d => d !== dimension),
    sections: view.sections.map(s => 
      s.dimension === dimension ? { ...s, expanded: !s.expanded } : s
    ),
  }
}

/**
 * Set all dimensions visibility
 */
export function setAllDimensions(
  view: DetailedComparisonView,
  showAll: boolean
): DetailedComparisonView {
  const allDimensions: ComparisonDimension[] = [
    'premise-similarity',
    'character-fates',
    'theme-alignment',
    'ending-contrast',
    'emotional-arc',
    'consequence-scope',
    'narrative-structure',
    'reader-experience',
  ]
  
  return {
    ...view,
    visibleDimensions: showAll ? allDimensions : [],
    hiddenDimensions: showAll ? [] : allDimensions,
    sections: view.sections.map(s => ({ ...s, expanded: showAll })),
  }
}

/**
 * Change detail level
 */
export function setDetailLevel(
  view: DetailedComparisonView,
  level: DetailLevel
): DetailedComparisonView {
  return generateDetailedView(
    view.sections[0].details[0].includes('Branch A') 
      ? { id: 'a', premise: { title: 'A' } } as BranchVariation
      : { id: 'a', premise: { title: 'A' } } as BranchVariation,
    { id: 'b', premise: { title: 'B' } } as BranchVariation,
    level
  )
}
