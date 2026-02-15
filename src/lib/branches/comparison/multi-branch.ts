/**
 * Unlimited branch comparison
 */

import type { BranchVariation } from '../variation/generator'
import { compareBranches, type BranchComparison } from './dimensions'
import { calculateCharacterFateSimilarity, compareFatesAcrossBranches } from './character-fates'

export interface MultiBranchComparison {
  branches: BranchVariation[]
  pairwise: Map<string, BranchComparison>
  characterFates: ReturnType<typeof compareFatesAcrossBranches>
  rankings: BranchRanking[]
  consensus: ConsensusAnalysis
  uniqueBranches: BranchVariation[]
  similarGroups: BranchVariation[][]
}

export interface BranchRanking {
  branchId: string
  branchName: string
  rank: number
  score: number
  criteria: {
    characterImpact: number
    thematicDepth: number
    emotionalResonance: number
    narrativeCoherence: number
    originality: number
  }
}

export interface ConsensusAnalysis {
  mostPopularEnding: string
  mostCommonMood: string
  sharedThemes: string[]
  divergentAspects: string[]
}

/**
 * Compare unlimited number of branches
 */
export function compareMultipleBranches(
  branches: BranchVariation[]
): MultiBranchComparison {
  if (branches.length < 2) {
    throw new Error('Need at least 2 branches to compare')
  }
  
  // Generate all pairwise comparisons
  const pairwise = new Map<string, BranchComparison>()
  
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const key = `${branches[i].id}-${branches[j].id}`
      const comparison = compareBranches(branches[i], branches[j])
      pairwise.set(key, comparison)
    }
  }
  
  // Character fate analysis across all branches
  const characterFates = compareFatesAcrossBranches(branches)
  
  // Rank branches
  const rankings = rankBranches(branches, pairwise)
  
  // Find consensus
  const consensus = analyzeConsensus(branches)
  
  // Find unique branches
  const uniqueBranches = findUniqueBranches(branches, pairwise)
  
  // Group similar branches
  const similarGroups = groupSimilarBranches(branches, pairwise)
  
  return {
    branches,
    pairwise,
    characterFates,
    rankings,
    consensus,
    uniqueBranches,
    similarGroups,
  }
}

function rankBranches(
  branches: BranchVariation[],
  comparisons: Map<string, BranchComparison>
): BranchRanking[] {
  const scored = branches.map(branch => {
    // Calculate average similarity to others (lower = more unique = higher score)
    let totalSimilarity = 0
    let count = 0
    
    for (const [key, comp] of comparisons) {
      if (key.includes(branch.id)) {
        totalSimilarity += comp.overallSimilarity
        count++
      }
    }
    
    const avgSimilarity = count > 0 ? totalSimilarity / count : 0.5
    const originalityScore = 1 - avgSimilarity
    
    // Calculate individual criteria
    const criteria = {
      characterImpact: Math.min(branch.characterArcs.length / 5, 1),
      thematicDepth: Math.min(branch.themeProgression.length / 4, 1),
      emotionalResonance: getMoodWeight(branch.mood),
      narrativeCoherence: branch.trajectory.keyEvents.length >= 3 ? 0.8 : 0.5,
      originality: originalityScore,
    }
    
    const score = Object.values(criteria).reduce((a, b) => a + b, 0) / 5
    
    return {
      branchId: branch.id,
      branchName: branch.premise.title,
      rank: 0, // Will be set after sorting
      score,
      criteria,
    }
  })
  
  // Sort by score and assign ranks
  scored.sort((a, b) => b.score - a.score)
  scored.forEach((item, index) => {
    item.rank = index + 1
  })
  
  return scored
}

function getMoodWeight(mood: BranchVariation['mood']): number {
  const weights: Record<typeof mood, number> = {
    hopeful: 0.9,
    tragic: 0.8,
    mixed: 1.0,
    dark: 0.7,
  }
  return weights[mood]
}

function analyzeConsensus(branches: BranchVariation[]): ConsensusAnalysis {
  // Count ending types
  const endingCounts = new Map<string, number>()
  const moodCounts = new Map<string, number>()
  const themeCounts = new Map<string, number>()
  
  for (const branch of branches) {
    // Endings
    const ending = branch.trajectory.endingType
    endingCounts.set(ending, (endingCounts.get(ending) || 0) + 1)
    
    // Moods
    const mood = branch.mood
    moodCounts.set(mood, (moodCounts.get(mood) || 0) + 1)
    
    // Themes
    for (const theme of branch.themeProgression) {
      themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1)
    }
  }
  
  // Find most common
  const mostPopularEnding = findMax(endingCounts)
  const mostCommonMood = findMax(moodCounts)
  
  // Find shared themes (present in at least 50% of branches)
  const threshold = branches.length * 0.5
  const sharedThemes = [...themeCounts.entries()]
    .filter(([_, count]) => count >= threshold)
    .map(([theme, _]) => theme)
  
  // Find divergent aspects
  const divergentAspects: string[] = []
  if (endingCounts.size > 2) divergentAspects.push('endings')
  if (moodCounts.size > 2) divergentAspects.push('moods')
  
  return {
    mostPopularEnding,
    mostCommonMood,
    sharedThemes,
    divergentAspects,
  }
}

function findMax(map: Map<string, number>): string {
  let maxKey = ''
  let maxValue = 0
  
  for (const [key, value] of map) {
    if (value > maxValue) {
      maxValue = value
      maxKey = key
    }
  }
  
  return maxKey
}

function findUniqueBranches(
  branches: BranchVariation[],
  comparisons: Map<string, BranchComparison>
): BranchVariation[] {
  const unique: BranchVariation[] = []
  
  for (const branch of branches) {
    // Check if this branch is similar to any other
    let hasSimilar = false
    
    for (const [key, comp] of comparisons) {
      if (key.includes(branch.id) && comp.overallSimilarity > 0.7) {
        hasSimilar = true
        break
      }
    }
    
    if (!hasSimilar) {
      unique.push(branch)
    }
  }
  
  return unique
}

function groupSimilarBranches(
  branches: BranchVariation[],
  comparisons: Map<string, BranchComparison>
): BranchVariation[][] {
  const groups: BranchVariation[][] = []
  const assigned = new Set<string>()
  
  for (const branch of branches) {
    if (assigned.has(branch.id)) continue
    
    const group: BranchVariation[] = [branch]
    assigned.add(branch.id)
    
    // Find similar branches
    for (const other of branches) {
      if (assigned.has(other.id) || other.id === branch.id) continue
      
      const key = branch.id < other.id 
        ? `${branch.id}-${other.id}`
        : `${other.id}-${branch.id}`
      
      const comparison = comparisons.get(key)
      if (comparison && comparison.overallSimilarity > 0.7) {
        group.push(other)
        assigned.add(other.id)
      }
    }
    
    if (group.length > 1) {
      groups.push(group)
    }
  }
  
  return groups
}

/**
 * Get comparison between specific branches from multi-branch result
 */
export function getPairwiseComparison(
  result: MultiBranchComparison,
  branchAId: string,
  branchBId: string
): BranchComparison | undefined {
  const key1 = `${branchAId}-${branchBId}`
  const key2 = `${branchBId}-${branchAId}`
  
  return result.pairwise.get(key1) || result.pairwise.get(key2)
}

/**
 * Filter branches by criteria
 */
export function filterBranches(
  result: MultiBranchComparison,
  criteria: {
    minRanking?: number
    mood?: BranchVariation['mood']
    endingType?: BranchVariation['trajectory']['endingType']
    consequenceType?: BranchVariation['consequenceType']
  }
): BranchVariation[] {
  return result.branches.filter(branch => {
    if (criteria.mood && branch.mood !== criteria.mood) return false
    if (criteria.endingType && branch.trajectory.endingType !== criteria.endingType) return false
    if (criteria.consequenceType && branch.consequenceType !== criteria.consequenceType) return false
    
    if (criteria.minRanking !== undefined) {
      const ranking = result.rankings.find(r => r.branchId === branch.id)
      if (!ranking || ranking.rank > criteria.minRanking) return false
    }
    
    return true
  })
}

/**
 * Generate multi-branch comparison report
 */
export function generateMultiBranchReport(
  result: MultiBranchComparison
): string {
  const lines: string[] = []
  
  lines.push('# Multi-Branch Comparison Report')
  lines.push('')
  
  lines.push(`## Overview`)
  lines.push(`Total branches: ${result.branches.length}`)
  lines.push(`Pairwise comparisons: ${result.pairwise.size}`)
  lines.push('')
  
  lines.push(`## Rankings`)
  for (const rank of result.rankings.slice(0, 5)) {
    lines.push(`${rank.rank}. ${rank.branchName} (Score: ${(rank.score * 100).toFixed(1)}%)`)
  }
  lines.push('')
  
  lines.push(`## Consensus`)
  lines.push(`Most common ending: ${result.consensus.mostPopularEnding}`)
  lines.push(`Most common mood: ${result.consensus.mostCommonMood}`)
  lines.push(`Shared themes: ${result.consensus.sharedThemes.join(', ') || 'None'}`)
  if (result.consensus.divergentAspects.length > 0) {
    lines.push(`Divergent aspects: ${result.consensus.divergentAspects.join(', ')}`)
  }
  lines.push('')
  
  if (result.uniqueBranches.length > 0) {
    lines.push(`## Unique Branches`)
    for (const branch of result.uniqueBranches) {
      lines.push(`- ${branch.premise.title}`)
    }
    lines.push('')
  }
  
  if (result.similarGroups.length > 0) {
    lines.push(`## Similar Branch Groups`)
    for (let i = 0; i < result.similarGroups.length; i++) {
      lines.push(`Group ${i + 1}: ${result.similarGroups[i].map(b => b.premise.title).join(', ')}`)
    }
  }
  
  return lines.join('\n')
}
