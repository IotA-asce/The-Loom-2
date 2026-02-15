/**
 * Cross-reference parallel events
 * Identifies and links events happening simultaneously
 */

import { TimelineEvent } from '@/lib/db/schema'

export interface ParallelEventGroup {
  events: TimelineEvent[]
  estimatedTimeWindow: { start: number; end: number }
  sharedContext?: string
  location?: string
}

export interface CrossReference {
  eventA: string
  eventB: string
  relationship: 'concurrent' | 'sequential' | 'causal' | 'unrelated'
  confidence: number
  evidence: string[]
}

/**
 * Find potentially parallel events
 */
export function findParallelEvents(events: TimelineEvent[]): ParallelEventGroup[] {
  const groups: ParallelEventGroup[] = []
  const processed = new Set<string>()
  
  const sorted = [...events].sort((a, b) => a.pageNumber - b.pageNumber)
  
  for (let i = 0; i < sorted.length; i++) {
    const event = sorted[i]
    if (processed.has(event.id)) continue
    
    const concurrent: TimelineEvent[] = [event]
    processed.add(event.id)
    
    // Look for events that might be concurrent
    for (let j = i + 1; j < sorted.length; j++) {
      const other = sorted[j]
      if (processed.has(other.id)) continue
      
      // Check for concurrent indicators
      if (areConcurrent(event, other)) {
        concurrent.push(other)
        processed.add(other.id)
      }
    }
    
    if (concurrent.length > 1) {
      groups.push({
        events: concurrent,
        estimatedTimeWindow: estimateTimeWindow(concurrent),
      })
    }
  }
  
  return groups
}

/**
 * Check if two events appear to be concurrent
 */
function areConcurrent(a: TimelineEvent, b: TimelineEvent): boolean {
  // Small page gap suggests potential concurrency
  const pageGap = Math.abs(a.pageNumber - b.pageNumber)
  if (pageGap > 5) return false
  
  // No shared characters suggests different location/scene
  const sharedChars = a.characters.filter(c => b.characters.includes(c))
  if (sharedChars.length > 0) return false
  
  // Check for explicit concurrent indicators
  const text = `${a.description} ${b.description}`.toLowerCase()
  const concurrentIndicators = ['meanwhile', 'at the same time', 'concurrently', 'parallel']
  
  return concurrentIndicators.some(indicator => text.includes(indicator))
}

/**
 * Estimate time window for parallel events
 */
function estimateTimeWindow(events: TimelineEvent[]): { start: number; end: number } {
  const pages = events.map(e => e.pageNumber)
  return {
    start: Math.min(...pages),
    end: Math.max(...pages),
  }
}

/**
 * Cross-reference events
 */
export function crossReferenceEvents(events: TimelineEvent[]): CrossReference[] {
  const references: CrossReference[] = []
  
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i]
      const b = events[j]
      
      const reference = analyzeRelationship(a, b)
      if (reference.confidence > 0.5) {
        references.push(reference)
      }
    }
  }
  
  return references
}

/**
 * Analyze relationship between two events
 */
function analyzeRelationship(a: TimelineEvent, b: TimelineEvent): CrossReference {
  const evidence: string[] = []
  let relationship: CrossReference['relationship'] = 'unrelated'
  let confidence = 0.5
  
  const pageGap = Math.abs(a.pageNumber - b.pageNumber)
  const sharedChars = a.characters.filter(c => b.characters.includes(c))
  
  // Check for concurrency
  if (pageGap < 5 && sharedChars.length === 0) {
    relationship = 'concurrent'
    confidence = 0.6
    evidence.push('Close in narrative with different characters')
  }
  
  // Check for sequential relationship
  if (pageGap < 20 && sharedChars.length > 0) {
    relationship = 'sequential'
    confidence = 0.7
    evidence.push('Sequential with shared characters')
  }
  
  // Check for causal relationship
  const text = `${a.title} ${a.description} ${b.title} ${b.description}`.toLowerCase()
  if (text.includes('because') || text.includes('so') || text.includes('therefore')) {
    relationship = 'causal'
    confidence = 0.8
    evidence.push('Causal language detected')
  }
  
  // Adjust confidence based on gap
  confidence *= Math.max(0.5, 1 - pageGap / 100)
  
  return {
    eventA: a.id,
    eventB: b.id,
    relationship,
    confidence: Math.round(confidence * 100) / 100,
    evidence,
  }
}

/**
 * Parallel event tracker
 */
export class ParallelEventTracker {
  private groups: ParallelEventGroup[]
  private references: CrossReference[]
  
  constructor(events: TimelineEvent[]) {
    this.groups = findParallelEvents(events)
    this.references = crossReferenceEvents(events)
  }
  
  /**
   * Get all parallel groups
   */
  getGroups(): ParallelEventGroup[] {
    return this.groups
  }
  
  /**
   * Get events concurrent with given event
   */
  getConcurrentEvents(eventId: string): TimelineEvent[] {
    for (const group of this.groups) {
      if (group.events.some(e => e.id === eventId)) {
        return group.events.filter(e => e.id !== eventId)
      }
    }
    return []
  }
  
  /**
   * Get cross-references for event
   */
  getReferences(eventId: string): CrossReference[] {
    return this.references.filter(
      r => r.eventA === eventId || r.eventB === eventId
    )
  }
  
  /**
   * Get events by relationship type
   */
  getEventsByRelationship(
    eventId: string,
    relationship: CrossReference['relationship']
  ): string[] {
    return this.references
      .filter(r => 
        (r.eventA === eventId || r.eventB === eventId) &&
        r.relationship === relationship
      )
      .map(r => r.eventA === eventId ? r.eventB : r.eventA)
  }
  
  /**
   * Build narrative thread from event
   */
  buildNarrativeThread(startEventId: string, maxDepth: number = 5): TimelineEvent[] {
    const thread: TimelineEvent[] = []
    const visited = new Set<string>()
    const queue: Array<{ id: string; depth: number }> = [
      { id: startEventId, depth: 0 },
    ]
    
    while (queue.length > 0) {
      const { id, depth } = queue.shift()!
      
      if (visited.has(id) || depth > maxDepth) continue
      visited.add(id)
      
      // Find the event
      for (const group of this.groups) {
        const event = group.events.find(e => e.id === id)
        if (event) {
          thread.push(event)
          
          // Add concurrent events to queue
          for (const concurrent of group.events) {
            if (!visited.has(concurrent.id)) {
              queue.push({ id: concurrent.id, depth: depth + 1 })
            }
          }
        }
      }
    }
    
    return thread.sort((a, b) => a.pageNumber - b.pageNumber)
  }
  
  /**
   * Get parallel event statistics
   */
  getStats(): {
    parallelGroupCount: number
    averageGroupSize: number
    concurrentRelationships: number
    sequentialRelationships: number
    causalRelationships: number
  } {
    const parallelGroupCount = this.groups.length
    const totalEventsInGroups = this.groups.reduce((sum, g) => sum + g.events.length, 0)
    
    return {
      parallelGroupCount,
      averageGroupSize: parallelGroupCount > 0 ? totalEventsInGroups / parallelGroupCount : 0,
      concurrentRelationships: this.references.filter(r => r.relationship === 'concurrent').length,
      sequentialRelationships: this.references.filter(r => r.relationship === 'sequential').length,
      causalRelationships: this.references.filter(r => r.relationship === 'causal').length,
    }
  }
  
  /**
   * Find narrative convergence points
   * (where parallel threads meet)
   */
  findConvergencePoints(): Array<{
    event: TimelineEvent
    incomingThreads: number
  }> {
    const convergence: Array<{ event: TimelineEvent; incomingThreads: number }> = []
    
    // Count how many parallel groups lead into each event
    const groupMembership = new Map<string, number>()
    
    for (const group of this.groups) {
      for (const event of group.events) {
        groupMembership.set(event.id, (groupMembership.get(event.id) || 0) + 1)
      }
    }
    
    for (const [eventId, count] of groupMembership) {
      if (count > 1) {
        // Event appears in multiple groups
        for (const group of this.groups) {
          const event = group.events.find(e => e.id === eventId)
          if (event) {
            convergence.push({ event, incomingThreads: count })
            break
          }
        }
      }
    }
    
    return convergence.sort((a, b) => b.incomingThreads - a.incomingThreads)
  }
}
