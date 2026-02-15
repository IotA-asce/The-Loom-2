/**
 * Branch variation generator
 * Generate 2-5 branches per anchor (anchor-dependent)
 */

import type { AnchorEvent } from '@/lib/db/schema'
import type { BranchPremise } from '../premise/transformer'
import type { ContextPackage } from '../context/adaptive-selector'

export interface BranchVariation {
  id: string
  premise: BranchPremise
  trajectory: BranchTrajectory
  consequenceType: 'personal' | 'political' | 'cosmic'
  themeProgression: string[]
  mood: 'hopeful' | 'tragic' | 'mixed' | 'dark'
  complexity: 'simple' | 'moderate' | 'complex'
  estimatedChapters: number
  characterArcs: CharacterArcProjection[]
}

export interface BranchTrajectory {
  summary: string
  keyEvents: string[]
  turningPoints: string[]
  climax: string
  resolution: string
  endingType: 'hopeful' | 'tragic' | 'bittersweet' | 'ambiguous' | 'open'
}

export interface CharacterArcProjection {
  characterId: string
  characterName: string
  startingState: string
  arcDescription: string
  endingState: string
  growth: 'positive' | 'negative' | 'neutral' | 'complex'
}

/**
 * Generate branch variations for an anchor
 */
export function generateBranchVariations(
  context: ContextPackage,
  count: number = 3
): BranchVariation[] {
  // Determine count based on anchor significance
  const anchorCount = getAnchorDependentCount(context.anchor)
  const finalCount = Math.min(count, anchorCount)
  
  const variations: BranchVariation[] = []
  
  // Generate different consequence types
  const consequenceTypes: BranchVariation['consequenceType'][] = 
    ['personal', 'political', 'cosmic']
  
  // Generate different moods
  const moods: BranchVariation['mood'][] = 
    ['hopeful', 'tragic', 'mixed', 'dark']
  
  for (let i = 0; i < finalCount; i++) {
    const consequenceType = consequenceTypes[i % consequenceTypes.length]
    const mood = moods[i % moods.length]
    
    const variation = generateSingleVariation(
      context,
      consequenceType,
      mood,
      i
    )
    
    variations.push(variation)
  }
  
  return variations
}

/**
 * Get branch count based on anchor significance
 */
function getAnchorDependentCount(anchor: ContextPackage['anchor']): number {
  switch (anchor.significance) {
    case 'critical':
      return 5 // Maximum variations for critical anchors
    case 'major':
      return 4
    case 'moderate':
      return 3
    case 'minor':
      return 2 // Minimum variations for minor anchors
    default:
      return 3
  }
}

function generateSingleVariation(
  context: ContextPackage,
  consequenceType: BranchVariation['consequenceType'],
  mood: BranchVariation['mood'],
  index: number
): BranchVariation {
  const { anchor, characters, world } = context
  
  // Generate trajectory
  const trajectory = generateTrajectory(
    anchor,
    consequenceType,
    mood,
    world
  )
  
  // Project character arcs
  const characterArcs = projectCharacterArcs(
    characters,
    consequenceType,
    mood
  )
  
  // Determine complexity
  const complexity = determineComplexity(anchor.significance, consequenceType)
  
  // Estimate chapters
  const estimatedChapters = estimateChapterCount(
    complexity,
    characterArcs.length
  )
  
  return {
    id: `branch-${anchor.id}-${index}`,
    premise: generateVariationPremise(anchor, consequenceType, mood),
    trajectory,
    consequenceType,
    themeProgression: generateThemeProgression(world.themes, consequenceType),
    mood,
    complexity,
    estimatedChapters,
    characterArcs,
  }
}

function generateTrajectory(
  anchor: ContextPackage['anchor'],
  consequenceType: BranchVariation['consequenceType'],
  mood: BranchVariation['mood'],
  world: ContextPackage['world']
): BranchTrajectory {
  const keyEvents: string[] = []
  
  // Generate key events based on consequence type
  switch (consequenceType) {
    case 'personal':
      keyEvents.push(
        'Initial emotional response',
        'Personal relationships shift',
        'Internal struggle reaches peak',
        'Personal resolution or transformation'
      )
      break
    case 'political':
      keyEvents.push(
        'Power dynamics shift',
        'Alliances form and break',
        'Conflicts escalate',
        'New order emerges'
      )
      break
    case 'cosmic':
      keyEvents.push(
        'Ripple effects spread',
        'Larger forces take notice',
        'Scale of impact expands',
        'Fundamental changes occur'
      )
      break
  }
  
  // Determine ending type based on mood
  const endingType = determineEndingType(mood)
  
  return {
    summary: `A ${consequenceType} journey with ${mood} undertones`,
    keyEvents,
    turningPoints: [
      'Point of no return',
      'Major revelation or shift',
      'Climactic confrontation',
    ],
    climax: `The ${consequenceType} consequences reach their peak`,
    resolution: generateResolution(endingType, consequenceType),
    endingType,
  }
}

function determineEndingType(mood: BranchVariation['mood']): BranchTrajectory['endingType'] {
  switch (mood) {
    case 'hopeful':
      return 'hopeful'
    case 'tragic':
      return 'tragic'
    case 'dark':
      return Math.random() > 0.5 ? 'tragic' : 'bittersweet'
    case 'mixed':
    default:
      return Math.random() > 0.5 ? 'bittersweet' : 'ambiguous'
  }
}

function generateResolution(
  endingType: BranchTrajectory['endingType'],
  consequenceType: BranchVariation['consequenceType']
): string {
  const resolutions: Record<typeof endingType, string> = {
    hopeful: `The ${consequenceType} challenges are overcome, leading to growth`,
    tragic: `The ${consequenceType} weight proves too much, leading to loss`,
    bittersweet: `Victory comes at a cost in the ${consequenceType} realm`,
    ambiguous: `The ${consequenceType} consequences remain unresolved`,
    open: `New paths emerge from the ${consequenceType} aftermath`,
  }
  return resolutions[endingType]
}

function projectCharacterArcs(
  characters: ContextPackage['characters'],
  consequenceType: BranchVariation['consequenceType'],
  mood: BranchVariation['mood']
): CharacterArcProjection[] {
  return characters.map(char => {
    const growth = determineGrowthType(mood, consequenceType)
    
    return {
      characterId: char.id,
      characterName: char.name,
      startingState: char.currentState.emotional,
      arcDescription: generateArcDescription(char, consequenceType, mood),
      endingState: generateEndingState(char, growth),
      growth,
    }
  })
}

function determineGrowthType(
  mood: BranchVariation['mood'],
  consequenceType: BranchVariation['consequenceType']
): CharacterArcProjection['growth'] {
  if (mood === 'hopeful') return 'positive'
  if (mood === 'tragic') return 'negative'
  if (mood === 'dark') return Math.random() > 0.5 ? 'negative' : 'complex'
  return 'complex'
}

function generateArcDescription(
  char: ContextPackage['characters'][0],
  consequenceType: BranchVariation['consequenceType'],
  mood: BranchVariation['mood']
): string {
  return `${char.name} faces ${consequenceType} challenges that test their ${char.personality}`
}

function generateEndingState(
  char: ContextPackage['characters'][0],
  growth: CharacterArcProjection['growth']
): string {
  const states: Record<typeof growth, string[]> = {
    positive: ['fulfilled', 'at peace', 'triumphant', 'wise'],
    negative: ['broken', 'haunted', 'defeated', 'changed for worse'],
    neutral: ['different', 'adapted', 'resigned', 'accepting'],
    complex: ['transformed', 'conflicted', 'enlightened but scarred', 'evolved'],
  }
  
  const possibleStates = states[growth]
  return possibleStates[Math.floor(Math.random() * possibleStates.length)]
}

function determineComplexity(
  significance: AnchorEvent['significance'],
  consequenceType: BranchVariation['consequenceType']
): BranchVariation['complexity'] {
  if (significance === 'critical' || consequenceType === 'cosmic') {
    return 'complex'
  }
  if (significance === 'major' || consequenceType === 'political') {
    return 'moderate'
  }
  return 'simple'
}

function estimateChapterCount(
  complexity: BranchVariation['complexity'],
  characterCount: number
): number {
  const baseCount = complexity === 'simple' ? 3 : complexity === 'moderate' ? 5 : 8
  const characterModifier = Math.floor(characterCount / 2)
  return baseCount + characterModifier
}

function generateVariationPremise(
  anchor: ContextPackage['anchor'],
  consequenceType: BranchVariation['consequenceType'],
  mood: BranchVariation['mood']
): BranchPremise {
  // This would integrate with the premise transformer
  // For now, return a simplified premise structure
  return {
    id: `premise-${anchor.id}-${consequenceType}`,
    title: `${consequenceType.charAt(0).toUpperCase() + consequenceType.slice(1)} Consequences`,
    subtitle: `A ${mood} variation`,
    hook: `What if the ${anchor.type} led to ${consequenceType} consequences?`,
    whatIf: `What if ${anchor.selectedAlternative.description}?`,
    description: anchor.selectedAlternative.description,
    themes: [consequenceType, mood, anchor.type],
    affectedCharacters: anchor.characters,
    immediateConsequences: anchor.selectedAlternative.consequences,
    longTermImplications: [],
  }
}

function generateThemeProgression(
  worldThemes: ContextPackage['world']['themes'],
  consequenceType: BranchVariation['consequenceType']
): string[] {
  const baseThemes = worldThemes.map(t => t.name)
  baseThemes.push(consequenceType)
  return baseThemes.slice(0, 4)
}
