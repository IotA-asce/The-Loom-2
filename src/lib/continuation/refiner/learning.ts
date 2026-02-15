/**
 * User-approved learning system
 */

export interface UserPreference {
  id: string
  category: 'style' | 'tone' | 'pacing' | 'dialogue' | 'description' | 'plot'
  description: string
  examples: string[]
  weight: number // 0-1
  approvedAt: Date
  chapterId?: string
}

export interface LearningProfile {
  userId: string
  preferences: Map<string, UserPreference>
  patterns: WritingPattern[]
  lastUpdated: Date
}

export interface WritingPattern {
  id: string
  type: 'sentence-structure' | 'vocabulary' | 'pacing' | 'dialogue-style'
  description: string
  frequency: number // 0-1
  examples: string[]
}

/**
 * Create learning profile
 */
export function createLearningProfile(userId: string): LearningProfile {
  return {
    userId,
    preferences: new Map(),
    patterns: [],
    lastUpdated: new Date(),
  }
}

/**
 * Add preference from approved refinement
 */
export function addPreferenceFromRefinement(
  profile: LearningProfile,
  category: UserPreference['category'],
  instruction: string,
  chapterId?: string
): LearningProfile {
  const preference: UserPreference = {
    id: `pref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    category,
    description: instruction,
    examples: [],
    weight: 0.5, // Start at medium weight
    approvedAt: new Date(),
    chapterId,
  }
  
  const preferences = new Map(profile.preferences)
  preferences.set(preference.id, preference)
  
  return {
    ...profile,
    preferences,
    lastUpdated: new Date(),
  }
}

/**
 * Reinforce preference (increase weight)
 */
export function reinforcePreference(
  profile: LearningProfile,
  preferenceId: string
): LearningProfile {
  const preferences = new Map(profile.preferences)
  const preference = preferences.get(preferenceId)
  
  if (preference) {
    preferences.set(preferenceId, {
      ...preference,
      weight: Math.min(1, preference.weight + 0.1),
    })
  }
  
  return {
    ...profile,
    preferences,
    lastUpdated: new Date(),
  }
}

/**
 * Reduce preference weight (if user rejects similar suggestions)
 */
export function reducePreference(
  profile: LearningProfile,
  preferenceId: string
): LearningProfile {
  const preferences = new Map(profile.preferences)
  const preference = preferences.get(preferenceId)
  
  if (preference) {
    const newWeight = preference.weight - 0.1
    if (newWeight <= 0) {
      preferences.delete(preferenceId)
    } else {
      preferences.set(preferenceId, {
        ...preference,
        weight: newWeight,
      })
    }
  }
  
  return {
    ...profile,
    preferences,
    lastUpdated: new Date(),
  }
}

/**
 * Get preferences by category
 */
export function getPreferencesByCategory(
  profile: LearningProfile,
  category: UserPreference['category']
): UserPreference[] {
  return [...profile.preferences.values()]
    .filter(p => p.category === category)
    .sort((a, b) => b.weight - a.weight)
}

/**
 * Get top preferences
 */
export function getTopPreferences(
  profile: LearningProfile,
  limit: number = 10
): UserPreference[] {
  return [...profile.preferences.values()]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
}

/**
 * Format preferences for prompt
 */
export function formatPreferencesForPrompt(
  profile: LearningProfile,
  category?: UserPreference['category']
): string {
  const preferences = category 
    ? getPreferencesByCategory(profile, category)
    : getTopPreferences(profile, 10)
  
  if (preferences.length === 0) {
    return ''
  }
  
  const parts: string[] = []
  parts.push('## User Preferences (Learned)')
  parts.push('')
  
  for (const pref of preferences) {
    const confidence = pref.weight > 0.7 ? '(Strong)' : 
                      pref.weight > 0.4 ? '(Moderate)' : '(Tentative)'
    parts.push(`- ${pref.description} ${confidence}`)
  }
  
  return parts.join('\n')
}

/**
 * Detect pattern from refinements
 */
export function detectPattern(
  refinements: Array<{ instruction: string; category: string }>
): WritingPattern | null {
  if (refinements.length < 3) return null
  
  // Group by category
  const byCategory = new Map<string, number>()
  for (const r of refinements) {
    byCategory.set(r.category, (byCategory.get(r.category) || 0) + 1)
  }
  
  // Find most common category
  let maxCount = 0
  let maxCategory = ''
  
  for (const [cat, count] of byCategory) {
    if (count > maxCount) {
      maxCount = count
      maxCategory = cat
    }
  }
  
  // If significant pattern detected
  if (maxCount >= 3) {
    return {
      id: `pattern-${Date.now()}`,
      type: 'pacing', // Simplified
      description: `User frequently refines ${maxCategory}`,
      frequency: maxCount / refinements.length,
      examples: refinements
        .filter(r => r.category === maxCategory)
        .slice(0, 3)
        .map(r => r.instruction),
    }
  }
  
  return null
}

/**
 * Add pattern to profile
 */
export function addPattern(
  profile: LearningProfile,
  pattern: WritingPattern
): LearningProfile {
  return {
    ...profile,
    patterns: [...profile.patterns, pattern],
    lastUpdated: new Date(),
  }
}

/**
 * Export learning profile
 */
export function exportLearningProfile(profile: LearningProfile): object {
  return {
    userId: profile.userId,
    preferences: [...profile.preferences.values()],
    patterns: profile.patterns,
    lastUpdated: profile.lastUpdated.toISOString(),
  }
}

/**
 * Import learning profile
 */
export function importLearningProfile(data: object): LearningProfile {
  const preferences = new Map<string, UserPreference>()
  
  // @ts-ignore
  if (data.preferences) {
    // @ts-ignore
    for (const pref of data.preferences) {
      preferences.set(pref.id, {
        ...pref,
        approvedAt: new Date(pref.approvedAt),
      })
    }
  }
  
  return {
    // @ts-ignore
    userId: data.userId || 'unknown',
    preferences,
    // @ts-ignore
    patterns: data.patterns || [],
    // @ts-ignore
    lastUpdated: new Date(data.lastUpdated || Date.now()),
  }
}
