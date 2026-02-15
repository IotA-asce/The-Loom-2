/**
 * Relationship evolution tracking
 * Tracks how relationships change across merged batches
 */

import { Relationship, Character } from '@/lib/db/schema'

export interface RelationshipEvolution {
  relationshipId: string
  characterA: string
  characterB: string
  stages: Array<{
    batchIndex: number
    type: string
    description: string
    pageRange: [number, number]
  }>
  evolutionPath: string[]
  stability: number // 0-1
  intensity: 'low' | 'medium' | 'high'
}

export interface EvolutionSnapshot {
  batchIndex: number
  relationships: Relationship[]
  timestamp: number
}

/**
 * Track relationship evolution across batches
 */
export function trackRelationshipEvolution(
  snapshots: EvolutionSnapshot[],
  characters: Character[]
): RelationshipEvolution[] {
  const characterMap = new Map(characters.map(c => [c.id, c]))
  const evolutions = new Map<string, RelationshipEvolution>()
  
  for (const snapshot of snapshots) {
    for (const rel of snapshot.relationships) {
      const key = [rel.characterA, rel.characterB].sort().join('-')
      
      let evolution = evolutions.get(key)
      
      if (!evolution) {
        const charA = characterMap.get(rel.characterA)
        const charB = characterMap.get(rel.characterB)
        
        evolution = {
          relationshipId: rel.id,
          characterA: charA?.name || rel.characterA,
          characterB: charB?.name || rel.characterB,
          stages: [],
          evolutionPath: [],
          stability: 1,
          intensity: 'medium',
        }
      }
      
      // Add stage
      evolution.stages.push({
        batchIndex: snapshot.batchIndex,
        type: rel.type,
        description: rel.description,
        pageRange: [
          Math.min(...rel.evolution.map(e => e.pageNumber)),
          Math.max(...rel.evolution.map(e => e.pageNumber)),
        ],
      })
      
      // Update path
      if (!evolution.evolutionPath.includes(rel.type)) {
        evolution.evolutionPath.push(rel.type)
      }
      
      evolutions.set(key, evolution)
    }
  }
  
  // Calculate stability and intensity for each
  for (const evolution of evolutions.values()) {
    evolution.stability = calculateStability(evolution.stages)
    evolution.intensity = calculateIntensity(evolution.stages)
  }
  
  return Array.from(evolutions.values())
}

/**
 * Calculate relationship stability
 */
function calculateStability(
  stages: RelationshipEvolution['stages']
): number {
  if (stages.length <= 1) return 1
  
  // Count type changes
  let changes = 0
  for (let i = 1; i < stages.length; i++) {
    if (stages[i].type !== stages[i - 1].type) {
      changes++
    }
  }
  
  // Stability is inverse of change rate
  return Math.max(0, 1 - (changes / (stages.length - 1)))
}

/**
 * Calculate relationship intensity
 */
function calculateIntensity(
  stages: RelationshipEvolution['stages']
): RelationshipEvolution['intensity'] {
  const typeCounts = new Map<string, number>()
  
  for (const stage of stages) {
    typeCounts.set(stage.type, (typeCounts.get(stage.type) || 0) + 1)
  }
  
  // Check for dramatic relationship types
  const dramaticTypes = ['enemy', 'rival', 'lover', 'betrayed', 'conflict']
  const dramaticCount = stages.filter(s => 
    dramaticTypes.some(dt => s.type.includes(dt))
  ).length
  
  if (dramaticCount >= 2 || typeCounts.size >= 3) return 'high'
  if (dramaticCount >= 1 || typeCounts.size >= 2) return 'medium'
  return 'low'
}

/**
 * Find relationship turning points
 */
export function findTurningPoints(
  evolution: RelationshipEvolution
): Array<{
  from: string
  to: string
  batchIndex: number
  significance: 'minor' | 'major' | 'critical'
}> {
  const points: Array<{
    from: string
    to: string
    batchIndex: number
    significance: 'minor' | 'major' | 'critical'
  }> = []
  
  for (let i = 1; i < evolution.stages.length; i++) {
    const prev = evolution.stages[i - 1]
    const curr = evolution.stages[i]
    
    if (prev.type !== curr.type) {
      // Determine significance
      let significance: 'minor' | 'major' | 'critical' = 'minor'
      
      const dramaticChanges = [
        ['friend', 'enemy'],
        ['enemy', 'ally'],
        ['stranger', 'lover'],
        ['ally', 'betrayer'],
      ]
      
      for (const [from, to] of dramaticChanges) {
        if ((prev.type.includes(from) && curr.type.includes(to)) ||
            (prev.type.includes(to) && curr.type.includes(from))) {
          significance = 'critical'
          break
        }
      }
      
      if (significance === 'minor' && 
          (prev.type.includes('rival') || curr.type.includes('rival'))) {
        significance = 'major'
      }
      
      points.push({
        from: prev.type,
        to: curr.type,
        batchIndex: curr.batchIndex,
        significance,
      })
    }
  }
  
  return points
}

/**
 * Merge relationship evolution data
 */
export function mergeEvolutionData(
  evolutions: RelationshipEvolution[]
): Relationship[] {
  const merged: Relationship[] = []
  
  for (const evolution of evolutions) {
    // Create merged relationship with full evolution
    const allEvolution = evolution.stages.flatMap(stage => 
      // Convert stages back to evolution entries
      stage.pageRange[0] !== stage.pageRange[1] 
        ? [{ pageNumber: stage.pageRange[0], state: stage.type }]
        : []
    )
    
    merged.push({
      id: evolution.relationshipId,
      characterA: evolution.characterA,
      characterB: evolution.characterB,
      type: evolution.stages[evolution.stages.length - 1]?.type || 'unknown',
      description: evolution.stages.map(s => s.description).join(' → '),
      evolution: allEvolution,
    })
  }
  
  return merged
}

/**
 * Relationship evolution analyzer
 */
export class RelationshipEvolutionAnalyzer {
  private evolutions: RelationshipEvolution[]
  
  constructor(snapshots: EvolutionSnapshot[], characters: Character[]) {
    this.evolutions = trackRelationshipEvolution(snapshots, characters)
  }
  
  /**
   * Get all evolutions
   */
  getEvolutions(): RelationshipEvolution[] {
    return this.evolutions
  }
  
  /**
   * Get evolutions for character
   */
  getCharacterEvolutions(characterId: string): RelationshipEvolution[] {
    return this.evolutions.filter(e => 
      e.characterA === characterId || e.characterB === characterId
    )
  }
  
  /**
   * Get most dynamic relationships
   */
  getMostDynamic(n: number = 5): RelationshipEvolution[] {
    return [...this.evolutions]
      .sort((a, b) => b.evolutionPath.length - a.evolutionPath.length)
      .slice(0, n)
  }
  
  /**
   * Get most stable relationships
   */
  getMostStable(n: number = 5): RelationshipEvolution[] {
    return [...this.evolutions]
      .sort((a, b) => b.stability - a.stability)
      .slice(0, n)
  }
  
  /**
   * Get evolution statistics
   */
  getStats(): {
    totalRelationships: number
    averageStability: number
    mostCommonType: string
    totalTurningPoints: number
  } {
    const totalStability = this.evolutions.reduce((sum, e) => sum + e.stability, 0)
    
    // Count types
    const typeCounts = new Map<string, number>()
    for (const evolution of this.evolutions) {
      for (const stage of evolution.stages) {
        typeCounts.set(stage.type, (typeCounts.get(stage.type) || 0) + 1)
      }
    }
    
    const mostCommonType = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown'
    
    const totalTurningPoints = this.evolutions.reduce(
      (sum, e) => sum + findTurningPoints(e).length,
      0
    )
    
    return {
      totalRelationships: this.evolutions.length,
      averageStability: this.evolutions.length > 0 
        ? totalStability / this.evolutions.length 
        : 0,
      mostCommonType,
      totalTurningPoints,
    }
  }
}
