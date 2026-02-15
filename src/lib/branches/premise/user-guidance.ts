/**
 * User guidance for premise generation (character focus)
 */

import type { CharacterState } from '../context/character-states'
import type { BranchPremise } from './transformer'

export interface UserGuidance {
  // Character focus preferences
  characterFocus?: {
    primaryCharacterId?: string
    characterIds: string[]
    focusType: 'protagonist' | 'antagonist' | 'ensemble' | 'relationship'
  }
  
  // Theme preferences
  themePreferences?: {
    preferredThemes: string[]
    avoidedThemes: string[]
    themeEmphasis: 'light' | 'dark' | 'balanced'
  }
  
  // Tone preferences
  tonePreferences?: {
    mood: 'hopeful' | 'tragic' | 'mixed' | 'dark'
    intensity: 'subtle' | 'moderate' | 'intense'
  }
  
  // Structural preferences
  structuralPreferences?: {
    complexity: 'simple' | 'moderate' | 'complex'
    pace: 'fast' | 'moderate' | 'slow'
    scope: 'personal' | 'local' | 'global'
  }
}

export interface GuidedPremiseResult {
  premises: BranchPremise[]
  appliedGuidance: UserGuidance
  filteringApplied: {
    characterFiltered: boolean
    themeFiltered: boolean
    toneAdjusted: boolean
  }
  recommendations: string[]
}

/**
 * Apply user guidance to premise generation
 */
export function applyUserGuidance(
  premises: BranchPremise[],
  guidance: UserGuidance,
  allCharacters: CharacterState[]
): GuidedPremiseResult {
  let filtered = [...premises]
  const filteringApplied = {
    characterFiltered: false,
    themeFiltered: false,
    toneAdjusted: false,
  }
  const recommendations: string[] = []
  
  // Apply character focus
  if (guidance.characterFocus && guidance.characterFocus.characterIds.length > 0) {
    filtered = filterByCharacterFocus(filtered, guidance.characterFocus, allCharacters)
    filteringApplied.characterFiltered = true
    
    // Add recommendation
    const charNames = guidance.characterFocus.characterIds
      .map(id => allCharacters.find(c => c.id === id)?.name)
      .filter(Boolean)
    recommendations.push(`Focusing on ${charNames.join(', ')}`)
  }
  
  // Apply theme preferences
  if (guidance.themePreferences) {
    filtered = filterByThemePreferences(filtered, guidance.themePreferences)
    filteringApplied.themeFiltered = true
    
    if (guidance.themePreferences.preferredThemes.length > 0) {
      recommendations.push(`Emphasizing themes: ${guidance.themePreferences.preferredThemes.join(', ')}`)
    }
  }
  
  // Apply tone preferences
  if (guidance.tonePreferences) {
    filtered = adjustForTone(filtered, guidance.tonePreferences)
    filteringApplied.toneAdjusted = true
    recommendations.push(`Tone set to ${guidance.tonePreferences.mood} (${guidance.tonePreferences.intensity})`)
  }
  
  // Apply structural preferences
  if (guidance.structuralPreferences) {
    filtered = adjustForStructure(filtered, guidance.structuralPreferences)
    recommendations.push(`${guidance.structuralPreferences.complexity} complexity, ${guidance.structuralPreferences.scope} scope`)
  }
  
  return {
    premises: filtered,
    appliedGuidance: guidance,
    filteringApplied,
    recommendations,
  }
}

function filterByCharacterFocus(
  premises: BranchPremise[],
  focus: UserGuidance['characterFocus'],
  allCharacters: CharacterState[]
): BranchPremise[] {
  if (!focus || focus.characterIds.length === 0) return premises
  
  return premises.filter(premise => {
    switch (focus.focusType) {
      case 'protagonist':
        // Premise should involve the primary character
        return focus.primaryCharacterId && 
               premise.affectedCharacters.some(name => {
                 const char = allCharacters.find(c => c.id === focus.primaryCharacterId)
                 return char?.name === name
               })
      
      case 'antagonist':
        // Premise should have conflict/opposition
        return premise.themes.some(t => 
          ['conflict', 'betrayal', 'opposition'].includes(t)
        )
      
      case 'ensemble':
        // Premise should affect multiple characters
        return premise.affectedCharacters.length >= 2
      
      case 'relationship':
        // Premise should involve relationship dynamics
        return premise.themes.some(t =>
          ['love', 'betrayal', 'friendship', 'trust'].includes(t)
        )
      
      default:
        // Default: premise should involve at least one focused character
        return premise.affectedCharacters.some(name => {
          return focus.characterIds.some(id => {
            const char = allCharacters.find(c => c.id === id)
            return char?.name === name
          })
        })
    }
  })
}

function filterByThemePreferences(
  premises: BranchPremise[],
  preferences: UserGuidance['themePreferences']
): BranchPremise[] {
  if (!preferences) return premises
  
  return premises.filter(premise => {
    // Check avoided themes
    const hasAvoidedTheme = preferences.avoidedThemes.some(avoided =>
      premise.themes.some(t => t.toLowerCase().includes(avoided.toLowerCase()))
    )
    if (hasAvoidedTheme) return false
    
    // If preferred themes specified, check for match
    if (preferences.preferredThemes.length > 0) {
      const hasPreferredTheme = preferences.preferredThemes.some(preferred =>
        premise.themes.some(t => t.toLowerCase().includes(preferred.toLowerCase()))
      )
      return hasPreferredTheme
    }
    
    return true
  })
}

function adjustForTone(
  premises: BranchPremise[],
  preferences: UserGuidance['tonePreferences']
): BranchPremise[] {
  if (!preferences) return premises
  
  // Sort premises based on tone match
  return premises.sort((a, b) => {
    const scoreA = calculateToneMatch(a, preferences)
    const scoreB = calculateToneMatch(b, preferences)
    return scoreB - scoreA
  })
}

function calculateToneMatch(
  premise: BranchPremise,
  preferences: UserGuidance['tonePreferences']
): number {
  let score = 0
  const themes = premise.themes.map(t => t.toLowerCase())
  
  // Check mood match
  const moodKeywords: Record<string, string[]> = {
    hopeful: ['redemption', 'love', 'friendship', 'growth', 'triumph'],
    tragic: ['sacrifice', 'loss', 'betrayal', 'death', 'doom'],
    dark: ['betrayal', 'death', 'corruption', 'doom', 'horror'],
    mixed: ['conflict', 'transformation', 'mystery', 'fate'],
  }
  
  const keywords = moodKeywords[preferences.mood] || []
  const matchingThemes = themes.filter(t => 
    keywords.some(kw => t.includes(kw))
  )
  score += matchingThemes.length * 0.3
  
  // Check intensity match
  const intensityIndicators: Record<string, string[]> = {
    subtle: ['mystery', 'intrigue', 'secret'],
    moderate: ['conflict', 'growth', 'change'],
    intense: ['death', 'war', 'betrayal', 'sacrifice', 'love'],
  }
  
  const intensityKeywords = intensityIndicators[preferences.intensity] || []
  const intensityMatch = themes.filter(t =>
    intensityKeywords.some(kw => t.includes(kw))
  )
  score += intensityMatch.length * 0.2
  
  return score
}

function adjustForStructure(
  premises: BranchPremise[],
  preferences: UserGuidance['structuralPreferences']
): BranchPremise[] {
  if (!preferences) return premises
  
  // Sort based on structural complexity
  return premises.sort((a, b) => {
    let scoreA = 0
    let scoreB = 0
    
    // Complexity scoring
    if (preferences.complexity === 'simple') {
      scoreA = a.immediateConsequences.length <= 2 ? 1 : 0
      scoreB = b.immediateConsequences.length <= 2 ? 1 : 0
    } else if (preferences.complexity === 'complex') {
      scoreA = a.longTermImplications.length >= 3 ? 1 : 0
      scoreB = b.longTermImplications.length >= 3 ? 1 : 0
    }
    
    // Scope scoring
    if (preferences.scope === 'personal') {
      scoreA += a.affectedCharacters.length <= 2 ? 0.5 : 0
      scoreB += b.affectedCharacters.length <= 2 ? 0.5 : 0
    } else if (preferences.scope === 'global') {
      scoreA += a.affectedCharacters.length >= 3 ? 0.5 : 0
      scoreB += b.affectedCharacters.length >= 3 ? 0.5 : 0
    }
    
    return scoreB - scoreA
  })
}

/**
 * Create default user guidance
 */
export function createDefaultGuidance(
  characters: CharacterState[]
): UserGuidance {
  const mainCharacter = characters.find(c => c.importance === 'major')
  
  return {
    characterFocus: {
      primaryCharacterId: mainCharacter?.id,
      characterIds: mainCharacter ? [mainCharacter.id] : characters.slice(0, 2).map(c => c.id),
      focusType: 'protagonist',
    },
    themePreferences: {
      preferredThemes: [],
      avoidedThemes: [],
      themeEmphasis: 'balanced',
    },
    tonePreferences: {
      mood: 'mixed',
      intensity: 'moderate',
    },
    structuralPreferences: {
      complexity: 'moderate',
      pace: 'moderate',
      scope: 'local',
    },
  }
}
