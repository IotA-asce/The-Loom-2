/**
 * Causal dependency graph
 * Models cause-and-effect relationships between events
 */

import { TimelineEvent } from '@/lib/db/schema'

export interface CausalLink {
  from: string // Event ID
  to: string   // Event ID
  type: 'causes' | 'enables' | 'prevents' | 'influences'
  strength: number // 0-1
  confidence: number // 0-1
}

export interface CausalNode {
  event: TimelineEvent
  incoming: CausalLink[]
  outgoing: CausalLink[]
  depth: number // Longest path from start
}

export interface CausalGraph {
  nodes: Map<string, CausalNode>
  links: CausalLink[]
  rootEvents: string[]
  leafEvents: string[]
}

/**
 * Build causal graph from events
 */
export function buildCausalGraph(events: TimelineEvent[]): CausalGraph {
  const nodes = new Map<string, CausalNode>()
  const links: CausalLink[] = []
  
  // Create nodes
  for (const event of events) {
    nodes.set(event.id, {
      event,
      incoming: [],
      outgoing: [],
      depth: 0,
    })
  }
  
  // Infer causal links based on:
  // 1. Character overlap
  // 2. Temporal proximity
  // 3. Narrative flow
  const sorted = [...events].sort((a, b) => a.pageNumber - b.pageNumber)
  
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]
    const currentNode = nodes.get(current.id)!
    
    // Look at subsequent events
    for (let j = i + 1; j < Math.min(i + 5, sorted.length); j++) {
      const next = sorted[j]
      const nextNode = nodes.get(next.id)!
      
      const link = inferCausalLink(current, next)
      
      if (link && link.strength > 0.3) {
        links.push(link)
        currentNode.outgoing.push(link)
        nextNode.incoming.push(link)
      }
    }
  }
  
  // Calculate depths
  calculateDepths(nodes)
  
  // Identify roots and leaves
  const rootEvents = Array.from(nodes.values())
    .filter(n => n.incoming.length === 0)
    .map(n => n.event.id)
  
  const leafEvents = Array.from(nodes.values())
    .filter(n => n.outgoing.length === 0)
    .map(n => n.event.id)
  
  return {
    nodes,
    links,
    rootEvents,
    leafEvents,
  }
}

/**
 * Infer causal link between two events
 */
function inferCausalLink(from: TimelineEvent, to: TimelineEvent): CausalLink | null {
  // Character overlap
  const sharedCharacters = from.characters.filter(c => to.characters.includes(c))
  const characterOverlap = sharedCharacters.length / 
    Math.max(from.characters.length, to.characters.length)
  
  // Temporal proximity (closer = more likely causal)
  const pageGap = to.pageNumber - from.pageNumber
  const temporalScore = Math.max(0, 1 - pageGap / 20)
  
  // Overall strength
  const strength = characterOverlap * 0.6 + temporalScore * 0.4
  
  if (strength < 0.3) return null
  
  // Determine link type
  let type: CausalLink['type'] = 'influences'
  
  const text = `${from.title} ${from.description} ${to.title} ${to.description}`.toLowerCase()
  
  if (text.includes('because') || text.includes('so') || text.includes('therefore')) {
    type = 'causes'
  } else if (text.includes('allow') || text.includes('enable')) {
    type = 'enables'
  } else if (text.includes('prevent') || text.includes('stop')) {
    type = 'prevents'
  }
  
  return {
    from: from.id,
    to: to.id,
    type,
    strength: Math.round(strength * 100) / 100,
    confidence: Math.round(strength * 100) / 100,
  }
}

/**
 * Calculate node depths (longest path from root)
 */
function calculateDepths(nodes: Map<string, CausalNode>): void {
  const visited = new Set<string>()
  const visiting = new Set<string>()
  
  const calculateDepth = (nodeId: string): number => {
    if (visiting.has(nodeId)) return 0 // Cycle detection
    if (visited.has(nodeId)) return nodes.get(nodeId)!.depth
    
    visiting.add(nodeId)
    const node = nodes.get(nodeId)!
    
    let maxDepth = 0
    for (const link of node.incoming) {
      const parentDepth = calculateDepth(link.from)
      maxDepth = Math.max(maxDepth, parentDepth + 1)
    }
    
    node.depth = maxDepth
    visited.add(nodeId)
    visiting.delete(nodeId)
    
    return maxDepth
  }
  
  for (const nodeId of nodes.keys()) {
    calculateDepth(nodeId)
  }
}

/**
 * Get all effects of an event (downstream)
 */
export function getDownstreamEffects(
  graph: CausalGraph,
  eventId: string,
  maxDepth: number = 5
): Array<{ eventId: string; depth: number; path: string[] }> {
  const effects: Array<{ eventId: string; depth: number; path: string[] }> = []
  const visited = new Set<string>()
  const queue: Array<{ id: string; depth: number; path: string[] }> = [
    { id: eventId, depth: 0, path: [eventId] },
  ]
  
  while (queue.length > 0) {
    const { id, depth, path } = queue.shift()!
    
    if (visited.has(id) || depth >= maxDepth) continue
    visited.add(id)
    
    const node = graph.nodes.get(id)
    if (!node) continue
    
    for (const link of node.outgoing) {
      if (!visited.has(link.to)) {
        effects.push({
          eventId: link.to,
          depth: depth + 1,
          path: [...path, link.to],
        })
        queue.push({
          id: link.to,
          depth: depth + 1,
          path: [...path, link.to],
        })
      }
    }
  }
  
  return effects
}

/**
 * Get all causes of an event (upstream)
 */
export function getUpstreamCauses(
  graph: CausalGraph,
  eventId: string,
  maxDepth: number = 5
): Array<{ eventId: string; depth: number; path: string[] }> {
  const causes: Array<{ eventId: string; depth: number; path: string[] }> = []
  const visited = new Set<string>()
  const queue: Array<{ id: string; depth: number; path: string[] }> = [
    { id: eventId, depth: 0, path: [eventId] },
  ]
  
  while (queue.length > 0) {
    const { id, depth, path } = queue.shift()!
    
    if (visited.has(id) || depth >= maxDepth) continue
    visited.add(id)
    
    const node = graph.nodes.get(id)
    if (!node) continue
    
    for (const link of node.incoming) {
      if (!visited.has(link.from)) {
        causes.push({
          eventId: link.from,
          depth: depth + 1,
          path: [link.from, ...path],
        })
        queue.push({
          id: link.from,
          depth: depth + 1,
          path: [link.from, ...path],
        })
      }
    }
  }
  
  return causes
}

/**
 * Find critical path (longest chain of causation)
 */
export function findCriticalPath(graph: CausalGraph): string[] {
  let maxDepth = 0
  let criticalPath: string[] = []
  
  for (const [nodeId, node] of graph.nodes) {
    if (node.depth > maxDepth) {
      maxDepth = node.depth
      
      // Reconstruct path
      const path: string[] = [nodeId]
      let current = node
      
      while (current.incoming.length > 0) {
        // Follow strongest incoming link
        const strongest = current.incoming.reduce((a, b) => 
          a.strength > b.strength ? a : b
        )
        path.unshift(strongest.from)
        current = graph.nodes.get(strongest.from)!
      }
      
      criticalPath = path
    }
  }
  
  return criticalPath
}

/**
 * Calculate event criticality (how many paths depend on this event)
 */
export function calculateEventCriticality(
  graph: CausalGraph,
  eventId: string
): number {
  const downstream = getDownstreamEffects(graph, eventId)
  const upstream = getUpstreamCauses(graph, eventId)
  
  // Criticality based on how central this event is
  const reach = downstream.length + upstream.length
  const maxReach = graph.nodes.size - 1
  
  return maxReach > 0 ? reach / maxReach : 0
}

/**
 * Causal graph analyzer
 */
export class CausalGraphAnalyzer {
  private graph: CausalGraph
  
  constructor(events: TimelineEvent[]) {
    this.graph = buildCausalGraph(events)
  }
  
  /**
   * Get graph statistics
   */
  getStats(): {
    nodeCount: number
    linkCount: number
    averageDegree: number
    maxDepth: number
    clusteringCoefficient: number
  } {
    const nodeCount = this.graph.nodes.size
    const linkCount = this.graph.links.length
    
    const totalDegree = Array.from(this.graph.nodes.values())
      .reduce((sum, n) => sum + n.incoming.length + n.outgoing.length, 0)
    
    const maxDepth = Math.max(...Array.from(this.graph.nodes.values()).map(n => n.depth))
    
    return {
      nodeCount,
      linkCount,
      averageDegree: nodeCount > 0 ? totalDegree / nodeCount : 0,
      maxDepth,
      clusteringCoefficient: this.calculateClusteringCoefficient(),
    }
  }
  
  /**
   * Calculate clustering coefficient
   */
  private calculateClusteringCoefficient(): number {
    let totalCoefficient = 0
    let count = 0
    
    for (const [nodeId, node] of this.graph.nodes) {
      const neighbors = new Set([
        ...node.incoming.map(l => l.from),
        ...node.outgoing.map(l => l.to),
      ])
      
      if (neighbors.size < 2) continue
      
      let connections = 0
      const neighborList = Array.from(neighbors)
      
      for (let i = 0; i < neighborList.length; i++) {
        for (let j = i + 1; j < neighborList.length; j++) {
          const nodeA = this.graph.nodes.get(neighborList[i])!
          const connected = nodeA.outgoing.some(l => l.to === neighborList[j]) ||
                          nodeA.incoming.some(l => l.from === neighborList[j])
          if (connected) connections++
        }
      }
      
      const possible = (neighbors.size * (neighbors.size - 1)) / 2
      totalCoefficient += connections / possible
      count++
    }
    
    return count > 0 ? totalCoefficient / count : 0
  }
  
  /**
   * Find parallel events (no causal relationship)
   */
  findParallelEvents(): Array<[string, string]> {
    const parallel: Array<[string, string]> = []
    const nodes = Array.from(this.graph.nodes.keys())
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        
        // Check if there's any path between them
        const aDownstream = getDownstreamEffects(this.graph, a).map(e => e.eventId)
        const aUpstream = getUpstreamCauses(this.graph, a).map(e => e.eventId)
        
        if (!aDownstream.includes(b) && !aUpstream.includes(b)) {
          parallel.push([a, b])
        }
      }
    }
    
    return parallel
  }
  
  /**
   * Get the graph
   */
  getGraph(): CausalGraph {
    return this.graph
  }
}
