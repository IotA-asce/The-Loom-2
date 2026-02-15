/**
 * Causal impact analysis
 */

import type { ParsedTimelineEvent } from '@/lib/analysis/parser/validation'
import type { CausalGraph } from '@/lib/analysis/timeline/causal'

export interface CausalImpact {
  eventId: string
  downstreamCount: number
  affectedCharacters: string[]
  impactScore: number
}

/**
 * Analyze causal impact of events
 */
export function analyzeCausalImpact(
  events: ParsedTimelineEvent[],
  causalGraph: CausalGraph
): CausalImpact[] {
  return events.map(event => {
    const downstream = getDownstreamEvents(causalGraph, event.id)
    const affectedChars = new Set<string>()
    
    downstream.forEach(id => {
      const e = events.find(ev => ev.id === id)
      if (e) {
        e.characters.forEach(c => affectedChars.add(c))
      }
    })
    
    return {
      eventId: event.id,
      downstreamCount: downstream.length,
      affectedCharacters: Array.from(affectedChars),
      impactScore: Math.min(downstream.length / 5, 1) * 0.5 + 
                   Math.min(affectedChars.size / 3, 1) * 0.5,
    }
  })
}

function getDownstreamEvents(graph: CausalGraph, eventId: string): string[] {
  const visited = new Set<string>()
  const visit = (id: string) => {
    if (visited.has(id)) return
    visited.add(id)
    const node = graph.nodes.get(id)
    node?.outgoing.forEach(link => visit(link.to))
  }
  
  const startNode = graph.nodes.get(eventId)
  startNode?.outgoing.forEach(link => visit(link.to))
  
  return Array.from(visited).filter(id => id !== eventId)
}
