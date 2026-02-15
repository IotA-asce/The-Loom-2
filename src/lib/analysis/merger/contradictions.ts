/**
 * Hybrid contradiction resolution
 * Resolves conflicts using confidence scores and LLM arbitration
 */

import { TimelineEvent, Character } from '@/lib/db/schema'
import { LLMProvider } from '@/lib/llm/types'

export interface Contradiction {
  id: string
  type: 'fact' | 'timeline' | 'character' | 'relationship'
  elementA: unknown
  elementB: unknown
  description: string
  severity: 'minor' | 'major' | 'critical'
}

export interface ResolutionResult {
  contradiction: Contradiction
  resolution: 'use_a' | 'use_b' | 'merge' | 'flag_for_review'
  confidence: number
  reasoning: string
}

/**
 * Detect contradictions between two sets of events
 */
export function detectContradictions(
  eventsA: TimelineEvent[],
  eventsB: TimelineEvent[]
): Contradiction[] {
  const contradictions: Contradiction[] = []
  
  for (const eventA of eventsA) {
    const eventB = eventsB.find(e => e.id === eventA.id || isSameEvent(e, eventA))
    
    if (!eventB) continue
    
    // Check for timeline contradictions
    if (Math.abs(eventA.pageNumber - eventB.pageNumber) > 5) {
      contradictions.push({
        id: `contradiction-${eventA.id}-${Date.now()}`,
        type: 'timeline',
        elementA: eventA,
        elementB: eventB,
        description: `Event "${eventA.title}" has conflicting page numbers: ${eventA.pageNumber} vs ${eventB.pageNumber}`,
        severity: 'major',
      })
    }
    
    // Check for flashback contradictions
    if (eventA.isFlashback !== eventB.isFlashback) {
      contradictions.push({
        id: `contradiction-flash-${eventA.id}-${Date.now()}`,
        type: 'fact',
        elementA: eventA,
        elementB: eventB,
        description: `Event "${eventA.title}" flashback status differs`,
        severity: 'minor',
      })
    }
    
    // Check for significance contradictions
    if (eventA.significance !== eventB.significance) {
      contradictions.push({
        id: `contradiction-sig-${eventA.id}-${Date.now()}`,
        type: 'fact',
        elementA: eventA,
        elementB: eventB,
        description: `Event "${eventA.title}" significance differs: ${eventA.significance} vs ${eventB.significance}`,
        severity: 'minor',
      })
    }
  }
  
  return contradictions
}

/**
 * Check if two events are the same
 */
function isSameEvent(a: TimelineEvent, b: TimelineEvent): boolean {
  const titleSim = calculateSimilarity(a.title, b.title)
  const sharedChars = a.characters.filter(c => b.characters.includes(c)).length
  
  return titleSim > 0.8 && sharedChars > 0
}

/**
 * Calculate string similarity
 */
function calculateSimilarity(a: string, b: string): number {
  const aWords = new Set(a.toLowerCase().split(/\s+/))
  const bWords = new Set(b.toLowerCase().split(/\s+/))
  
  const intersection = new Set([...aWords].filter(x => bWords.has(x)))
  const union = new Set([...aWords, ...bWords])
  
  return intersection.size / union.size
}

/**
 * Resolve contradictions using hybrid approach
 */
export async function resolveContradictions(
  contradictions: Contradiction[],
  confidenceA: number,
  confidenceB: number,
  provider?: LLMProvider
): Promise<ResolutionResult[]> {
  const resolutions: ResolutionResult[] = []
  
  for (const contradiction of contradictions) {
    // Try heuristic resolution first
    const heuristicResult = resolveHeuristic(contradiction, confidenceA, confidenceB)
    
    // If high confidence in heuristic, use it
    if (heuristicResult.confidence > 0.8) {
      resolutions.push(heuristicResult)
      continue
    }
    
    // Otherwise, use LLM if available
    if (provider) {
      const llmResult = await resolveWithLLM(contradiction, provider)
      resolutions.push(llmResult)
    } else {
      // Flag for manual review
      resolutions.push({
        contradiction,
        resolution: 'flag_for_review',
        confidence: 0.3,
        reasoning: 'Low confidence in heuristic resolution, no LLM available',
      })
    }
  }
  
  return resolutions
}

/**
 * Heuristic contradiction resolution
 */
function resolveHeuristic(
  contradiction: Contradiction,
  confidenceA: number,
  confidenceB: number
): ResolutionResult {
  const diff = Math.abs(confidenceA - confidenceB)
  
  // If confidence difference is significant, trust higher confidence
  if (diff > 0.3) {
    return {
      contradiction,
      resolution: confidenceA > confidenceB ? 'use_a' : 'use_b',
      confidence: diff,
      reasoning: `Higher confidence in ${confidenceA > confidenceB ? 'A' : 'B'} (${Math.max(confidenceA, confidenceB).toFixed(2)} vs ${Math.min(confidenceA, confidenceB).toFixed(2)})`,
    }
  }
  
  // For minor contradictions, try merge
  if (contradiction.severity === 'minor') {
    return {
      contradiction,
      resolution: 'merge',
      confidence: 0.6,
      reasoning: 'Minor contradiction - safe to merge',
    }
  }
  
  // Otherwise, flag for review
  return {
    contradiction,
    resolution: 'flag_for_review',
    confidence: 0.4,
    reasoning: 'Conflicting data with similar confidence',
  }
}

/**
 * Resolve contradiction with LLM
 */
async function resolveWithLLM(
  contradiction: Contradiction,
  provider: LLMProvider
): Promise<ResolutionResult> {
  const prompt = `Resolve this contradiction in story analysis:

Type: ${contradiction.type}
Description: ${contradiction.description}

Version A: ${JSON.stringify(contradiction.elementA, null, 2)}
Version B: ${JSON.stringify(contradiction.elementB, null, 2)}

Which version is more accurate? Respond with JSON:
{
  "choice": "A" | "B" | "merge" | "unsure",
  "confidence": number (0-1),
  "reasoning": "explanation"
}`

  try {
    const response = await provider.complete({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 300,
    })
    
    const parsed = JSON.parse(response.content)
    
    const resolutionMap: Record<string, ResolutionResult['resolution']> = {
      'A': 'use_a',
      'B': 'use_b',
      'merge': 'merge',
      'unsure': 'flag_for_review',
    }
    
    return {
      contradiction,
      resolution: resolutionMap[parsed.choice] || 'flag_for_review',
      confidence: parsed.confidence || 0.5,
      reasoning: parsed.reasoning || 'LLM resolution',
    }
  } catch {
    return {
      contradiction,
      resolution: 'flag_for_review',
      confidence: 0.2,
      reasoning: 'LLM resolution failed',
    }
  }
}

/**
 * Apply resolutions to events
 */
export function applyResolutions(
  eventsA: TimelineEvent[],
  eventsB: TimelineEvent[],
  resolutions: ResolutionResult[]
): TimelineEvent[] {
  const result = new Map<string, TimelineEvent>()
  
  // Start with all events from A
  for (const event of eventsA) {
    result.set(event.id, event)
  }
  
  // Apply resolutions
  for (const resolution of resolutions) {
    const eventA = resolution.contradiction.elementA as TimelineEvent
    const eventB = resolution.contradiction.elementB as TimelineEvent
    
    switch (resolution.resolution) {
      case 'use_a':
        result.set(eventA.id, eventA)
        break
      case 'use_b':
        result.set(eventB.id, eventB)
        break
      case 'merge':
        result.set(eventA.id, mergeEventData(eventA, eventB))
        break
      case 'flag_for_review':
        // Keep A but mark for review
        result.set(eventA.id, { ...eventA, description: `${eventA.description} [REVIEW NEEDED]` } as TimelineEvent)
        break
    }
  }
  
  // Add unique events from B
  for (const event of eventsB) {
    if (!result.has(event.id)) {
      result.set(event.id, event)
    }
  }
  
  return Array.from(result.values())
}

/**
 * Merge event data
 */
function mergeEventData(a: TimelineEvent, b: TimelineEvent): TimelineEvent {
  return {
    ...a,
    pageNumber: a.pageNumber, // Trust A for page
    description: a.description.length > b.description.length ? a.description : b.description,
    characters: [...new Set([...a.characters, ...b.characters])],
    significance: significanceRank(a.significance) > significanceRank(b.significance)
      ? a.significance
      : b.significance,
  }
}

/**
 * Get significance rank
 */
function significanceRank(s: TimelineEvent['significance']): number {
  const ranks = { minor: 0, moderate: 1, major: 2, critical: 3 }
  return ranks[s]
}
