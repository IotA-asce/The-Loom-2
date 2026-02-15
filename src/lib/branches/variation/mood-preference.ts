/**
 * User mood preference support
 */

import type { BranchVariation } from './generator'

export type MoodPreference = 'hopeful' | 'tragic' | 'mixed' | 'dark' | 'any'

export interface MoodConfig {
  preference: MoodPreference
  allowDeviations: boolean
  deviationProbability: number // 0-1, chance of including non-preferred mood
}

/**
 * Filter and sort variations by mood preference
 */
export function applyMoodPreference(
  variations: BranchVariation[],
  config: MoodConfig
): BranchVariation[] {
  if (config.preference === 'any') {
    return variations
  }
  
  // Separate by mood match
  const preferred: BranchVariation[] = []
  const others: BranchVariation[] = []
  
  for (const variation of variations) {
    if (variation.mood === config.preference) {
      preferred.push(variation)
    } else {
      others.push(variation)
    }
  }
  
  // If we have preferred variations, use them
  if (preferred.length > 0) {
    // Maybe include some non-preferred for variety
    if (config.allowDeviations && Math.random() < config.deviationProbability) {
      const shuffled = shuffleArray(others)
      return [...preferred, ...shuffled.slice(0, 1)]
    }
    return preferred
  }
  
  // No preferred variations found, return all (or closest match)
  return variations
}

/**
 * Generate variations specifically for a mood preference
 */
export function generateMoodSpecificVariations(
  baseVariations: BranchVariation[],
  mood: MoodPreference
): BranchVariation[] {
  if (mood === 'any') return baseVariations
  
  return baseVariations.map(variation => ({
    ...variation,
    mood: mood as BranchVariation['mood'],
    trajectory: adjustTrajectoryForMood(variation.trajectory, mood),
    characterArcs: adjustArcsForMood(variation.characterArcs, mood),
  }))
}

function adjustTrajectoryForMood(
  trajectory: BranchVariation['trajectory'],
  mood: MoodPreference
): BranchVariation['trajectory'] {
  const endingType = moodToEndingType(mood as BranchVariation['mood'])
  
  return {
    ...trajectory,
    endingType,
    resolution: adjustResolution(trajectory.resolution, mood),
  }
}

function moodToEndingType(
  mood: BranchVariation['mood']
): BranchVariation['trajectory']['endingType'] {
  switch (mood) {
    case 'hopeful':
      return 'hopeful'
    case 'tragic':
      return 'tragic'
    case 'dark':
      return Math.random() > 0.5 ? 'tragic' : 'ambiguous'
    case 'mixed':
    default:
      return Math.random() > 0.5 ? 'bittersweet' : 'ambiguous'
  }
}

function adjustResolution(
  resolution: string,
  mood: MoodPreference
): string {
  const moodPrefixes: Record<MoodPreference, string[]> = {
    hopeful: ['Triumphantly', 'With renewed hope', 'Successfully'],
    tragic: ['Tragically', 'In defeat', 'With heavy hearts'],
    dark: ['In darkness', 'With ominous portents', 'Uncertainly'],
    mixed: ['With mixed results', 'Bittersweet', 'Complicated'],
    any: [''],
  }
  
  const prefixes = moodPrefixes[mood]
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  
  return prefix ? `${prefix}, ${resolution.toLowerCase()}` : resolution
}

function adjustArcsForMood(
  arcs: BranchVariation['characterArcs'],
  mood: MoodPreference
): BranchVariation['characterArcs'] {
  const growthType = moodToGrowthType(mood as BranchVariation['mood'])
  
  return arcs.map(arc => ({
    ...arc,
    growth: growthType,
    endingState: generateMoodEndingState(arc.characterName, mood),
  }))
}

function moodToGrowthType(
  mood: BranchVariation['mood']
): BranchVariation['characterArcs'][0]['growth'] {
  switch (mood) {
    case 'hopeful':
      return 'positive'
    case 'tragic':
      return 'negative'
    case 'dark':
      return Math.random() > 0.5 ? 'negative' : 'complex'
    case 'mixed':
    default:
      return 'complex'
  }
}

function generateMoodEndingState(
  characterName: string,
  mood: MoodPreference
): string {
  const states: Record<MoodPreference, string[]> = {
    hopeful: [
      'has found peace',
      'stands triumphant',
      'embraces a new beginning',
      'has grown beyond their past',
    ],
    tragic: [
      'is broken by loss',
      'falls to darkness',
      'cannot escape their fate',
      'is lost to sorrow',
    ],
    dark: [
      'survives but is changed',
      'bears the weight of choices',
      'walks a darker path',
      'accepts a grim reality',
    ],
    mixed: [
      'has won and lost',
      'carries both joy and sorrow',
      'is wiser but scarred',
      'finds peace with complexity',
    ],
    any: [
      'has reached their destination',
      'is transformed by the journey',
    ],
  }
  
  const possibleStates = states[mood]
  return possibleStates[Math.floor(Math.random() * possibleStates.length)]
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Get mood description for UI
 */
export function getMoodDescription(mood: BranchVariation['mood']): string {
  const descriptions: Record<BranchVariation['mood'], string> = {
    hopeful: 'An uplifting journey with positive outcomes',
    tragic: 'A somber path leading to loss or sacrifice',
    mixed: 'A complex journey with both joy and sorrow',
    dark: 'A grim exploration of difficult choices',
  }
  return descriptions[mood]
}

/**
 * Get mood icon/color for UI
 */
export function getMoodStyling(mood: BranchVariation['mood']): {
  color: string
  icon: string
  gradient: string
} {
  const styles: Record<BranchVariation['mood'], {
    color: string
    icon: string
    gradient: string
  }> = {
    hopeful: {
      color: 'text-green-600',
      icon: 'sun',
      gradient: 'from-green-400 to-emerald-500',
    },
    tragic: {
      color: 'text-red-600',
      icon: 'cloud-rain',
      gradient: 'from-red-400 to-rose-500',
    },
    mixed: {
      color: 'text-amber-600',
      icon: 'sunset',
      gradient: 'from-amber-400 to-orange-500',
    },
    dark: {
      color: 'text-purple-600',
      icon: 'moon',
      gradient: 'from-purple-400 to-indigo-500',
    },
  }
  return styles[mood]
}
