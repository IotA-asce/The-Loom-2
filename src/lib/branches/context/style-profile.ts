/**
 * Gather narrative style profile for branch context
 */

import type { Manga } from '@/lib/db/schema'

export interface NarrativeStyleProfile {
  // Overall tone
  tone: {
    primary: 'dark' | 'light' | 'neutral' | 'mixed'
    descriptors: string[] // e.g., "gritty", "whimsical", "melancholic"
  }
  
  // Pacing preferences
  pacing: {
    speed: 'fast' | 'moderate' | 'slow'
    chapterStructure: 'scene-based' | 'continuous' | 'episodic'
    sceneLength: 'short' | 'medium' | 'long'
  }
  
  // Narrative perspective
  perspective: {
    type: 'first-person' | 'third-person-limited' | 'third-person-omniscient'
    focus: 'single-protagonist' | 'ensemble' | 'rotating'
  }
  
  // Dialogue style
  dialogue: {
    frequency: 'sparse' | 'moderate' | 'heavy'
    style: 'realistic' | 'stylized' | 'minimalist'
    internalMonologue: 'frequent' | 'occasional' | 'rare'
  }
  
  // Genre conventions
  genreConventions: {
    primaryGenre: string
    subgenres: string[]
    commonTropes: string[]
    avoidedTropes: string[]
  }
  
  // Emotional approach
  emotionalApproach: {
    intensity: 'subtle' | 'moderate' | 'intense'
    expression: 'show-dont-tell' | 'direct' | 'mixed'
    catharsisMoments: 'frequent' | 'earned' | 'rare'
  }
  
  // Thematic preferences
  thematicPreferences: {
    preferredThemes: string[]
    avoidedThemes: string[]
    moralComplexity: 'black-and-white' | 'gray' | 'deeply-complex'
  }
}

/**
 * Gather narrative style profile from manga metadata
 */
export function gatherNarrativeStyleProfile(manga: Manga): NarrativeStyleProfile {
  const tags = manga.tags || []
  const description = manga.description || ''
  
  return {
    tone: inferTone(tags, description),
    pacing: inferPacing(tags),
    perspective: inferPerspective(tags, description),
    dialogue: inferDialogueStyle(tags),
    genreConventions: inferGenreConventions(tags),
    emotionalApproach: inferEmotionalApproach(tags, description),
    thematicPreferences: inferThematicPreferences(tags),
  }
}

function inferTone(tags: string[], description: string): NarrativeStyleProfile['tone'] {
  const darkTags = ['horror', 'thriller', 'psychological', 'dark', 'grim', 'dystopian']
  const lightTags = ['comedy', 'slice of life', 'romance', 'healing', 'wholesome']
  
  const hasDark = tags.some(t => darkTags.includes(t.toLowerCase()))
  const hasLight = tags.some(t => lightTags.includes(t.toLowerCase()))
  
  let primary: NarrativeStyleProfile['tone']['primary'] = 'neutral'
  if (hasDark && !hasLight) primary = 'dark'
  else if (hasLight && !hasDark) primary = 'light'
  else if (hasDark && hasLight) primary = 'mixed'
  
  const descriptors: string[] = []
  if (tags.includes('Psychological')) descriptors.push('psychological')
  if (tags.includes('Action')) descriptors.push('action-oriented')
  if (description.includes('mystery')) descriptors.push('mysterious')
  
  return { primary, descriptors }
}

function inferPacing(tags: string[]): NarrativeStyleProfile['pacing'] {
  if (tags.includes('Action') || tags.includes('Shonen')) {
    return { speed: 'fast', chapterStructure: 'scene-based', sceneLength: 'medium' }
  }
  if (tags.includes('Slice of Life') || tags.includes('Drama')) {
    return { speed: 'moderate', chapterStructure: 'continuous', sceneLength: 'medium' }
  }
  return { speed: 'moderate', chapterStructure: 'scene-based', sceneLength: 'medium' }
}

function inferPerspective(tags: string[], description: string): NarrativeStyleProfile['perspective'] {
  // Default to third-person limited as it's most common in manga
  return {
    type: 'third-person-limited',
    focus: tags.includes('Ensemble') ? 'ensemble' : 'single-protagonist',
  }
}

function inferDialogueStyle(tags: string[]): NarrativeStyleProfile['dialogue'] {
  if (tags.includes('Psychological') || tags.includes('Drama')) {
    return { frequency: 'moderate', style: 'realistic', internalMonologue: 'frequent' }
  }
  return { frequency: 'moderate', style: 'stylized', internalMonologue: 'occasional' }
}

function inferGenreConventions(tags: string[]): NarrativeStyleProfile['genreConventions'] {
  const genreMap: Record<string, string> = {
    'Shonen': 'Battle/Adventure',
    'Shojo': 'Romance/Drama',
    'Seinen': 'Mature/Drama',
    'Josei': 'Women\'s/Romance',
    'Isekai': 'Portal Fantasy',
    'Mecha': 'Sci-Fi/Robots',
  }
  
  const primaryGenre = tags.find(t => genreMap[t]) || 'General Fiction'
  
  return {
    primaryGenre: genreMap[primaryGenre] || primaryGenre,
    subgenres: tags.filter(t => !genreMap[t]).slice(0, 3),
    commonTropes: [],
    avoidedTropes: [],
  }
}

function inferEmotionalApproach(tags: string[], description: string): NarrativeStyleProfile['emotionalApproach'] {
  if (tags.includes('Psychological') || tags.includes('Drama')) {
    return { intensity: 'intense', expression: 'show-dont-tell', catharsisMoments: 'earned' }
  }
  return { intensity: 'moderate', expression: 'mixed', catharsisMoments: 'frequent' }
}

function inferThematicPreferences(tags: string[]): NarrativeStyleProfile['thematicPreferences'] {
  const themeMap: Record<string, string[]> = {
    'Shonen': ['friendship', 'perseverance', 'growth'],
    'Shojo': ['love', 'self-discovery', 'relationships'],
    'Seinen': ['identity', 'society', 'morality'],
    'Psychological': ['mind', 'reality', 'truth'],
  }
  
  const preferredThemes: string[] = []
  for (const tag of tags) {
    if (themeMap[tag]) {
      preferredThemes.push(...themeMap[tag])
    }
  }
  
  return {
    preferredThemes: [...new Set(preferredThemes)],
    avoidedThemes: [],
    moralComplexity: tags.includes('Psychological') ? 'deeply-complex' : 'gray',
  }
}
