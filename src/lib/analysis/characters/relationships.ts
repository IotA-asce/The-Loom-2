/**
 * Relationship mapping and tracking
 * Manages character relationships with evolution tracking
 */

import { Character, Relationship } from '@/lib/db/schema'

export interface RelationshipContext {
  pageNumber: number
  chapterNumber?: number
  characters: string[] // IDs of characters in scene
}

export interface RelationshipChange {
  type: 'formed' | 'strengthened' | 'weakened' | 'broken' | 'transformed'
  fromState: string
  toState: string
  pageNumber: number
  description: string
}

/**
 * Relationship mapper
 */
export class RelationshipMapper {
  private relationships = new Map<string, Relationship>()
  private characterIds: Set<string>
  
  constructor(characters: Character[]) {
    this.characterIds = new Set(characters.map(c => c.id))
  }
  
  /**
   * Create relationship ID from two character IDs
   */
  private createId(charA: string, charB: string): string {
    // Consistent ordering
    const [first, second] = [charA, charB].sort()
    return `rel-${first}-${second}`
  }
  
  /**
   * Add or update relationship
   */
  addRelationship(
    charA: string,
    charB: string,
    type: string,
    description: string,
    pageNumber: number
  ): Relationship {
    const id = this.createId(charA, charB)
    
    let relationship = this.relationships.get(id)
    
    if (!relationship) {
      relationship = {
        id,
        characterA: charA,
        characterB: charB,
        type,
        description,
        evolution: [],
      }
    }
    
    // Track evolution
    const lastState = relationship.evolution[relationship.evolution.length - 1]
    if (!lastState || lastState.state !== type) {
      relationship.evolution.push({
        pageNumber,
        state: type,
      })
    }
    
    // Update current type if changed
    if (relationship.type !== type) {
      relationship.type = type
      relationship.description = description
    }
    
    this.relationships.set(id, relationship)
    return relationship
  }
  
  /**
   * Get relationship between two characters
   */
  getRelationship(charA: string, charB: string): Relationship | undefined {
    const id = this.createId(charA, charB)
    return this.relationships.get(id)
  }
  
  /**
   * Get all relationships for a character
   */
  getCharacterRelationships(characterId: string): Relationship[] {
    return Array.from(this.relationships.values()).filter(
      r => r.characterA === characterId || r.characterB === characterId
    )
  }
  
  /**
   * Get all relationships
   */
  getAllRelationships(): Relationship[] {
    return Array.from(this.relationships.values())
  }
  
  /**
   * Infer relationships from scene context
   */
  inferFromScene(context: RelationshipContext): Relationship[] {
    const inferred: Relationship[] = []
    const { characters: charIds, pageNumber } = context
    
    // If 2 characters, check for relationship
    if (charIds.length === 2) {
      const [a, b] = charIds
      const existing = this.getRelationship(a, b)
      
      if (!existing) {
        // Create basic acquaintance relationship
        inferred.push(this.addRelationship(
          a,
          b,
          'acquaintance',
          'Characters appear together in scene',
          pageNumber
        ))
      }
    }
    
    // For groups, everyone knows everyone
    if (charIds.length > 2) {
      for (let i = 0; i < charIds.length; i++) {
        for (let j = i + 1; j < charIds.length; j++) {
          const existing = this.getRelationship(charIds[i], charIds[j])
          
          if (!existing) {
            inferred.push(this.addRelationship(
              charIds[i],
              charIds[j],
              'group_association',
              'Characters appear together in group scene',
              pageNumber
            ))
          }
        }
      }
    }
    
    return inferred
  }
  
  /**
   * Detect relationship changes from narrative
   */
  detectChange(
    relationship: Relationship,
    newType: string,
    newDescription: string,
    pageNumber: number
  ): RelationshipChange | null {
    if (relationship.type === newType) {
      return null
    }
    
    let changeType: RelationshipChange['type']
    
    // Determine change type
    if (relationship.evolution.length === 0) {
      changeType = 'formed'
    } else if (this.isPositiveChange(relationship.type, newType)) {
      changeType = 'strengthened'
    } else if (this.isNegativeChange(relationship.type, newType)) {
      changeType = 'weakened'
    } else if (newType === 'estranged' || newType === 'enemy') {
      changeType = 'broken'
    } else {
      changeType = 'transformed'
    }
    
    return {
      type: changeType,
      fromState: relationship.type,
      toState: newType,
      pageNumber,
      description: newDescription,
    }
  }
  
  /**
   * Check if relationship change is positive
   */
  private isPositiveChange(from: string, to: string): boolean {
    const hierarchy = ['enemy', 'rival', 'acquaintance', 'friend', 'ally', 'lover']
    const fromIndex = hierarchy.indexOf(from)
    const toIndex = hierarchy.indexOf(to)
    
    if (fromIndex === -1 || toIndex === -1) return false
    return toIndex > fromIndex
  }
  
  /**
   * Check if relationship change is negative
   */
  private isNegativeChange(from: string, to: string): boolean {
    const hierarchy = ['enemy', 'rival', 'acquaintance', 'friend', 'ally', 'lover']
    const fromIndex = hierarchy.indexOf(from)
    const toIndex = hierarchy.indexOf(to)
    
    if (fromIndex === -1 || toIndex === -1) return false
    return toIndex < fromIndex
  }
}

/**
 * Relationship graph for analysis
 */
export class RelationshipGraph {
  private adjacencyList = new Map<string, Set<string>>()
  private relationshipWeights = new Map<string, number>()
  
  /**
   * Build graph from relationships
   */
  static fromRelationships(relationships: Relationship[]): RelationshipGraph {
    const graph = new RelationshipGraph()
    
    for (const rel of relationships) {
      graph.addConnection(rel.characterA, rel.characterB)
      
      // Weight by evolution complexity
      const weight = Math.min(rel.evolution.length + 1, 5)
      graph.setWeight(rel.characterA, rel.characterB, weight)
    }
    
    return graph
  }
  
  /**
   * Add connection between characters
   */
  addConnection(charA: string, charB: string): void {
    if (!this.adjacencyList.has(charA)) {
      this.adjacencyList.set(charA, new Set())
    }
    if (!this.adjacencyList.has(charB)) {
      this.adjacencyList.set(charB, new Set())
    }
    
    this.adjacencyList.get(charA)!.add(charB)
    this.adjacencyList.get(charB)!.add(charA)
  }
  
  /**
   * Set relationship weight
   */
  setWeight(charA: string, charB: string, weight: number): void {
    const key = [charA, charB].sort().join('-')
    this.relationshipWeights.set(key, weight)
  }
  
  /**
   * Get connected characters
   */
  getConnections(characterId: string): string[] {
    return Array.from(this.adjacencyList.get(characterId) || [])
  }
  
  /**
   * Calculate centrality (how connected a character is)
   */
  calculateCentrality(characterId: string): number {
    const connections = this.getConnections(characterId).length
    const totalCharacters = this.adjacencyList.size
    
    return totalCharacters > 0 ? connections / (totalCharacters - 1) : 0
  }
  
  /**
   * Find shortest path between characters
   */
  findPath(from: string, to: string): string[] | null {
    if (from === to) return [from]
    
    const visited = new Set<string>()
    const queue: Array<{ char: string; path: string[] }> = [{ char: from, path: [from] }]
    
    while (queue.length > 0) {
      const { char, path } = queue.shift()!
      
      if (char === to) {
        return path
      }
      
      if (!visited.has(char)) {
        visited.add(char)
        
        for (const neighbor of this.getConnections(char)) {
          if (!visited.has(neighbor)) {
            queue.push({ char: neighbor, path: [...path, neighbor] })
          }
        }
      }
    }
    
    return null
  }
  
  /**
   * Find character clusters (groups)
   */
  findClusters(): string[][] {
    const visited = new Set<string>()
    const clusters: string[][] = []
    
    for (const char of this.adjacencyList.keys()) {
      if (!visited.has(char)) {
        const cluster = this.exploreCluster(char, visited)
        if (cluster.length > 1) {
          clusters.push(cluster)
        }
      }
    }
    
    return clusters
  }
  
  /**
   * Explore connected component
   */
  private exploreCluster(start: string, visited: Set<string>): string[] {
    const cluster: string[] = []
    const stack = [start]
    
    while (stack.length > 0) {
      const char = stack.pop()!
      
      if (!visited.has(char)) {
        visited.add(char)
        cluster.push(char)
        
        for (const neighbor of this.getConnections(char)) {
          if (!visited.has(neighbor)) {
            stack.push(neighbor)
          }
        }
      }
    }
    
    return cluster
  }
}
