/**
 * Historical relationship tracking
 * Tracks relationship evolution over time
 */

import { Character, Relationship } from '@/lib/db/schema'

export interface HistoricalRelationship {
  relationshipId: string
  characterA: string
  characterB: string
  timeline: Array<{
    pageNumber: number
    state: string
    description: string
    significance: 'minor' | 'major'
  }>
  currentState: string
  formedAt: number
  lastChangedAt: number
  totalChanges: number
}

export interface RelationshipMetrics {
  stability: number // 0-1, higher is more stable
  intensity: number // 0-1, based on change frequency
  importance: 'background' | 'supporting' | 'central'
}

/**
 * Historical relationship tracker
 */
export class RelationshipHistoryTracker {
  private history = new Map<string, HistoricalRelationship>()
  private characters: Map<string, Character>
  
  constructor(characters: Character[]) {
    this.characters = new Map(characters.map(c => [c.id, c]))
  }
  
  /**
   * Track a relationship from parsed data
   */
  trackRelationship(
    relationship: Relationship,
    pageNumber: number
  ): HistoricalRelationship {
    const id = this.createId(relationship.characterA, relationship.characterB)
    
    let historical = this.history.get(id)
    
    if (!historical) {
      historical = {
        relationshipId: id,
        characterA: relationship.characterA,
        characterB: relationship.characterB,
        timeline: [],
        currentState: relationship.type,
        formedAt: pageNumber,
        lastChangedAt: pageNumber,
        totalChanges: 0,
      }
    }
    
    // Add or update timeline entry
    const existingEntry = historical.timeline.find(e => e.pageNumber === pageNumber)
    
    if (existingEntry) {
      existingEntry.state = relationship.type
      existingEntry.description = relationship.description
    } else {
      historical.timeline.push({
        pageNumber,
        state: relationship.type,
        description: relationship.description,
        significance: this.assessSignificance(relationship),
      })
    }
    
    // Update current state if changed
    if (historical.currentState !== relationship.type) {
      historical.currentState = relationship.type
      historical.lastChangedAt = pageNumber
      historical.totalChanges++
    }
    
    this.history.set(id, historical)
    return historical
  }
  
  /**
   * Create consistent relationship ID
   */
  private createId(charA: string, charB: string): string {
    const [first, second] = [charA, charB].sort()
    return `hist-rel-${first}-${second}`
  }
  
  /**
   * Assess significance of relationship state
   */
  private assessSignificance(relationship: Relationship): 'minor' | 'major' {
    const majorStates = ['enemy', 'lover', 'family', 'rival', 'mentor', 'betrayal']
    return majorStates.some(s => relationship.type.includes(s)) ? 'major' : 'minor'
  }
  
  /**
   * Get relationship history
   */
  getHistory(charA: string, charB: string): HistoricalRelationship | undefined {
    const id = this.createId(charA, charB)
    return this.history.get(id)
  }
  
  /**
   * Get all histories for a character
   */
  getCharacterHistories(characterId: string): HistoricalRelationship[] {
    return Array.from(this.history.values()).filter(
      h => h.characterA === characterId || h.characterB === characterId
    )
  }
  
  /**
   * Calculate relationship metrics
   */
  calculateMetrics(charA: string, charB: string): RelationshipMetrics {
    const history = this.getHistory(charA, charB)
    
    if (!history) {
      return { stability: 1, intensity: 0, importance: 'background' }
    }
    
    // Stability: inverse of change frequency
    const timeline = history.timeline
    const changes = timeline.filter((e, i) => 
      i > 0 && e.state !== timeline[i - 1].state
    ).length
    
    const stability = Math.max(0, 1 - (changes / timeline.length) * 0.5)
    
    // Intensity: based on significant changes
    const majorChanges = timeline.filter(e => e.significance === 'major').length
    const intensity = Math.min(1, majorChanges / 3)
    
    // Importance: based on character prominence and change frequency
    const charAImportance = this.getCharacterImportance(charA)
    const charBImportance = this.getCharacterImportance(charB)
    
    let importance: RelationshipMetrics['importance']
    if ((charAImportance === 'major' && charBImportance === 'major') || majorChanges >= 2) {
      importance = 'central'
    } else if (charAImportance === 'major' || charBImportance === 'major' || changes > 0) {
      importance = 'supporting'
    } else {
      importance = 'background'
    }
    
    return { stability, intensity, importance }
  }
  
  /**
   * Get character importance
   */
  private getCharacterImportance(characterId: string): string {
    return this.characters.get(characterId)?.importance || 'minor'
  }
  
  /**
   * Get relationship evolution summary
   */
  getEvolutionSummary(charA: string, charB: string): {
    trajectory: string
    keyMoments: Array<{ page: number; event: string }>
    arcComplete: boolean
  } {
    const history = this.getHistory(charA, charB)
    
    if (!history) {
      return { trajectory: 'none', keyMoments: [], arcComplete: false }
    }
    
    const timeline = history.timeline
    const states = timeline.map(t => t.state)
    
    // Determine trajectory
    let trajectory = 'stable'
    if (states.includes('enemy') && states.includes('ally')) {
      trajectory = 'enemies_to_allies'
    } else if (states.includes('stranger') && states.includes('friend')) {
      trajectory = 'strangers_to_friends'
    } else if (states.includes('friend') && states.includes('enemy')) {
      trajectory = 'betrayal'
    } else if (history.totalChanges > 3) {
      trajectory = 'turbulent'
    }
    
    // Extract key moments
    const keyMoments = timeline
      .filter(t => t.significance === 'major')
      .map(t => ({ page: t.pageNumber, event: t.description }))
    
    // Arc completion check (simplified)
    const arcComplete = ['resolution', 'reconciliation', 'separation'].some(term =>
      timeline[timeline.length - 1]?.description.toLowerCase().includes(term)
    )
    
    return { trajectory, keyMoments, arcComplete }
  }
  
  /**
   * Get all historical relationships
   */
  getAllHistories(): HistoricalRelationship[] {
    return Array.from(this.history.values())
  }
  
  /**
   * Find relationships with similar trajectories
   */
  findSimilarTrajectories(
    charA: string,
    charB: string
  ): Array<{ pair: [string, string]; similarity: number }> {
    const targetHistory = this.getHistory(charA, charB)
    if (!targetHistory) return []
    
    const targetStates = targetHistory.timeline.map(t => t.state)
    const similarities: Array<{ pair: [string, string]; similarity: number }> = []
    
    for (const history of this.history.values()) {
      if (history.relationshipId === targetHistory.relationshipId) continue
      
      const states = history.timeline.map(t => t.state)
      const similarity = this.calculateTrajectorySimilarity(targetStates, states)
      
      if (similarity > 0.5) {
        similarities.push({
          pair: [history.characterA, history.characterB],
          similarity,
        })
      }
    }
    
    return similarities.sort((a, b) => b.similarity - a.similarity)
  }
  
  /**
   * Calculate trajectory similarity
   */
  private calculateTrajectorySimilarity(a: string[], b: string[]): number {
    // Simple Jaccard similarity for now
    const setA = new Set(a)
    const setB = new Set(b)
    
    const intersection = new Set([...setA].filter(x => setB.has(x)))
    const union = new Set([...setA, ...setB])
    
    return intersection.size / union.size
  }
}
