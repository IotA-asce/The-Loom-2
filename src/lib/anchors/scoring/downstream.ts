/**
 * Downstream event counting
 */

import type { CausalGraph } from '@/lib/analysis/timeline/causal'

/**
 * Count downstream events from an anchor
 */
export function countDownstreamEvents(
  eventId: string,
  causalGraph: CausalGraph,
  depth: number = Infinity
): number {
  const visited = new Set<string>()
  const queue: { id: string; level: number }[] = [{ id: eventId, level: 0 }]
  
  while (queue.length > 0) {
    const current = queue.shift()!
    if (visited.has(current.id)) continue
    if (current.level >= depth) continue
    
    visited.add(current.id)
    
    const node = causalGraph.nodes.find(n => n.id === current.id)
    if (node) {
      for (const link of node.outgoing) {
        if (!visited.has(link.target)) {
          queue.push({ id: link.target, level: current.level + 1 })
        }
      }
    }
  }
  
  // Don't count the starting event
  return visited.size - 1
}

/**
 * Get affected characters from downstream events
 */
export function getAffectedCharacters(
  eventId: string,
  causalGraph: CausalGraph,
  eventCharacters: Map<string, string[]>
): string[] {
  const visited = new Set<string>()
  const affected = new Set<string>()
  const queue = [eventId]
  
  while (queue.length > 0) {
    const current = queue.shift()!
    if (visited.has(current)) continue
    
    visited.add(current)
    
    // Add characters from this event
    const chars = eventCharacters.get(current) || []
    chars.forEach(c => affected.add(c))
    
    const node = causalGraph.nodes.find(n => n.id === current)
    if (node) {
      for (const link of node.outgoing) {
        if (!visited.has(link.target)) {
          queue.push(link.target)
        }
      }
    }
  }
  
  return Array.from(affected)
}

/**
 * Estimate branch complexity
 */
export function estimateBranchComplexity(
  downstreamCount: number,
  affectedCharacterCount: number
): { level: 'simple' | 'moderate' | 'complex'; score: number } {
  const score = Math.min(downstreamCount / 10, 0.5) + 
                Math.min(affectedCharacterCount / 5, 0.5)
  
  const level: 'simple' | 'moderate' | 'complex' = 
    score >= 0.7 ? 'complex' : score >= 0.4 ? 'moderate' : 'simple'
  
  return { level, score }
}
