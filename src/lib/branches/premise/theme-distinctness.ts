/**
 * Theme-based premise distinctness
 */

import type { BranchPremise } from './transformer'

export interface ThemeDistinctness {
  premiseId: string
  primaryTheme: string
  themeSignature: string[]
  distinctnessScore: number // 0-1, higher is more distinct
  similarPremises: string[] // IDs of similar premises
}

/**
 * Analyze theme-based distinctness of premises
 */
export function analyzeThemeDistinctness(
  premises: BranchPremise[]
): ThemeDistinctness[] {
  const signatures = premises.map(p => ({
    id: p.id,
    signature: createThemeSignature(p),
    primaryTheme: p.themes[0] || 'general',
  }))
  
  return signatures.map(({ id, signature, primaryTheme }) => {
    // Calculate similarity to other premises
    const similarities = signatures
      .filter(s => s.id !== id)
      .map(s => ({
        id: s.id,
        similarity: calculateSignatureSimilarity(signature, s.signature),
      }))
    
    // Find similar premises (similarity > 0.5)
    const similarPremises = similarities
      .filter(s => s.similarity > 0.5)
      .map(s => s.id)
    
    // Distinctness is inverse of average similarity
    const avgSimilarity = similarities.length > 0
      ? similarities.reduce((sum, s) => sum + s.similarity, 0) / similarities.length
      : 0
    
    const distinctnessScore = 1 - avgSimilarity
    
    return {
      premiseId: id,
      primaryTheme,
      themeSignature: signature,
      distinctnessScore,
      similarPremises,
    }
  })
}

/**
 * Create a theme signature for a premise
 */
function createThemeSignature(premise: BranchPremise): string[] {
  const signature: string[] = []
  
  // Add themes
  signature.push(...premise.themes)
  
  // Add theme indicators from description
  const themeIndicators = extractThemeIndicators(premise.description)
  signature.push(...themeIndicators)
  
  // Add consequence themes
  for (const consequence of premise.immediateConsequences) {
    const indicators = extractThemeIndicators(consequence)
    signature.push(...indicators)
  }
  
  return [...new Set(signature)].slice(0, 10) // Max 10 signature elements
}

/**
 * Extract theme indicators from text
 */
function extractThemeIndicators(text: string): string[] {
  const indicators: string[] = []
  const lowerText = text.toLowerCase()
  
  // Theme keyword mappings
  const themeKeywords: Record<string, string[]> = {
    'conflict': ['fight', 'battle', 'war', 'struggle', 'oppose', 'clash'],
    'transformation': ['change', 'become', 'transform', 'grow', 'evolve'],
    'sacrifice': ['give', 'lose', 'sacrifice', 'cost', 'price'],
    'betrayal': ['betray', 'deceive', 'lie', 'traitor', 'trust'],
    'redemption': ['redeem', 'save', 'forgive', 'atonement', 'sorry'],
    'power': ['power', 'control', 'strength', 'dominate', 'authority'],
    'love': ['love', 'heart', 'romance', 'care', 'affection'],
    'fate': ['fate', 'destiny', 'chance', 'luck', 'coincidence'],
    'truth': ['truth', 'secret', 'reveal', 'discover', 'know'],
    'identity': ['identity', 'self', 'who', 'true', 'real'],
  }
  
  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      indicators.push(theme)
    }
  }
  
  return indicators
}

/**
 * Calculate similarity between two signatures
 */
function calculateSignatureSimilarity(sig1: string[], sig2: string[]): number {
  const set1 = new Set(sig1)
  const set2 = new Set(sig2)
  
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  
  if (union.size === 0) return 0
  
  return intersection.size / union.size
}

/**
 * Ensure minimum distinctness between premises
 */
export function ensureDistinctness(
  premises: BranchPremise[],
  minDistinctness: number = 0.3
): BranchPremise[] {
  const distinctness = analyzeThemeDistinctness(premises)
  
  // Filter out premises that are too similar to others
  const selected: BranchPremise[] = []
  const rejected = new Set<string>()
  
  // Sort by distinctness score (most distinct first)
  const sorted = [...distinctness].sort((a, b) => b.distinctnessScore - a.distinctnessScore)
  
  for (const d of sorted) {
    if (rejected.has(d.premiseId)) continue
    
    // Check if this premise is distinct enough from already selected
    const tooSimilar = selected.some(selected => {
      const selectedDistinctness = distinctness.find(d => d.premiseId === selected.id)
      return selectedDistinctness?.similarPremises.includes(d.premiseId)
    })
    
    if (!tooSimilar || d.distinctnessScore >= minDistinctness) {
      const premise = premises.find(p => p.id === d.premiseId)
      if (premise) {
        selected.push(premise)
        // Reject similar premises to maintain diversity
        d.similarPremises.forEach(id => rejected.add(id))
      }
    }
  }
  
  return selected.length > 0 ? selected : premises
}

/**
 * Group premises by theme
 */
export function groupPremisesByTheme(
  premises: BranchPremise[]
): Map<string, BranchPremise[]> {
  const groups = new Map<string, BranchPremise[]>()
  
  for (const premise of premises) {
    const primaryTheme = premise.themes[0] || 'general'
    
    if (!groups.has(primaryTheme)) {
      groups.set(primaryTheme, [])
    }
    groups.get(primaryTheme)!.push(premise)
  }
  
  return groups
}
