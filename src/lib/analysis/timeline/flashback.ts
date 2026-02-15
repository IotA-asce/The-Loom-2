/**
 * Flashback detection
 * Identifies and categorizes flashback events
 */

import { TimelineEvent } from '@/lib/db/schema'
import { LLMProvider } from '@/lib/llm/types'

export interface FlashbackIndicators {
  visualCues: string[]
  narrativeCues: string[]
  temporalLanguage: string[]
  confidence: number
}

export interface FlashbackDetectionResult {
  isFlashback: boolean
  indicators: FlashbackIndicators
  estimatedTimePeriod?: string
  confidence: number
}

/**
 * Common flashback indicators
 */
export const FLASHBACK_VISUAL_CUES = [
  'sepia', 'black and white', 'monochrome', 'faded colors',
  'soft focus', 'blur edges', 'frame border', 'photo frame',
  'thought bubble', 'memory cloud', 'dream sequence',
]

export const FLASHBACK_NARRATIVE_CUES = [
  'remember', 'recall', 'memory', 'flashback', 'years ago',
  'when i was', 'back then', 'in the past', 'childhood',
  'used to', 'before', 'previously',
]

export const TEMPORAL_INDICATORS = [
  'ago', 'before', 'earlier', 'previously', 'then',
  'yesterday', 'last week', 'last year', 'childhood',
  'years ago', 'long ago', 'once', 'back when',
]

/**
 * Detect if event is a flashback using heuristics
 */
export function detectFlashbackHeuristic(
  event: TimelineEvent,
  description?: string
): FlashbackDetectionResult {
  const text = `${event.title} ${event.description} ${description || ''}`.toLowerCase()
  
  const visualCues: string[] = []
  const narrativeCues: string[] = []
  const temporalLanguage: string[] = []
  
  // Check for visual cues
  for (const cue of FLASHBACK_VISUAL_CUES) {
    if (text.includes(cue)) visualCues.push(cue)
  }
  
  // Check for narrative cues
  for (const cue of FLASHBACK_NARRATIVE_CUES) {
    if (text.includes(cue)) narrativeCues.push(cue)
  }
  
  // Check for temporal language
  for (const indicator of TEMPORAL_INDICATORS) {
    if (text.includes(indicator)) temporalLanguage.push(indicator)
  }
  
  // Calculate confidence
  const totalIndicators = visualCues.length + narrativeCues.length + temporalLanguage.length
  const confidence = Math.min(1, totalIndicators * 0.2 + 0.1)
  
  return {
    isFlashback: totalIndicators > 0 || event.isFlashback,
    indicators: {
      visualCues,
      narrativeCues,
      temporalLanguage,
      confidence,
    },
    confidence,
  }
}

/**
 * Detect flashbacks with LLM verification
 */
export async function detectFlashbackWithLLM(
  event: TimelineEvent,
  surroundingContext: string,
  provider: LLMProvider
): Promise<FlashbackDetectionResult> {
  const heuristic = detectFlashbackHeuristic(event)
  
  // Skip LLM if already confident
  if (heuristic.confidence > 0.8) {
    return heuristic
  }
  
  const prompt = `Analyze if this event is a flashback:

Event: ${event.title}
Description: ${event.description}
Context: ${surroundingContext}

Respond with JSON:
{
  "isFlashback": boolean,
  "confidence": number (0-1),
  "indicators": ["list", "of", "indicators"],
  "timePeriod": "description of when this takes place relative to present"
}`

  try {
    const response = await provider.complete({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 200,
    })
    
    const parsed = JSON.parse(response.content)
    
    return {
      isFlashback: parsed.isFlashback,
      indicators: {
        visualCues: [],
        narrativeCues: parsed.indicators || [],
        temporalLanguage: [],
        confidence: parsed.confidence || 0.5,
      },
      estimatedTimePeriod: parsed.timePeriod,
      confidence: parsed.confidence || 0.5,
    }
  } catch {
    // Fall back to heuristic
    return heuristic
  }
}

/**
 * Flashback classifier
 */
export type FlashbackType = 
  | 'memory' 
  | 'backstory' 
  | 'exposition' 
  | 'dream' 
  | 'vision' 
  | 'unknown'

export interface FlashbackClassification {
  type: FlashbackType
  purpose: string
  narrativeImportance: 'essential' | 'supporting' | 'decorative'
  estimatedLength: 'brief' | 'scene' | 'extended'
}

/**
 * Classify flashback type
 */
export function classifyFlashback(
  event: TimelineEvent,
  events: TimelineEvent[]
): FlashbackClassification {
  const text = `${event.title} ${event.description}`.toLowerCase()
  
  // Determine type
  let type: FlashbackType = 'memory'
  
  if (text.includes('dream') || text.includes('sleep')) {
    type = 'dream'
  } else if (text.includes('vision') || text.includes('prophecy')) {
    type = 'vision'
  } else if (text.includes('backstory') || text.includes('origin')) {
    type = 'backstory'
  } else if (text.includes('explain') || text.includes('history')) {
    type = 'exposition'
  }
  
  // Determine purpose
  let purpose = 'Character reflection or memory'
  if (type === 'backstory') purpose = 'Reveal character background'
  if (type === 'exposition') purpose = 'Provide world context'
  if (type === 'dream') purpose = 'Foreshadowing or character insight'
  if (type === 'vision') purpose = 'Prophetic or supernatural insight'
  
  // Determine importance based on significance
  const narrativeImportance: FlashbackClassification['narrativeImportance'] = 
    event.significance === 'critical' ? 'essential' :
    event.significance === 'major' ? 'supporting' : 'decorative'
  
  // Estimate length (naive approach based on description length)
  const descriptionLength = event.description.length
  const estimatedLength: FlashbackClassification['estimatedLength'] =
    descriptionLength < 50 ? 'brief' :
    descriptionLength < 200 ? 'scene' : 'extended'
  
  return {
    type,
    purpose,
    narrativeImportance,
    estimatedLength,
  }
}

/**
 * Flashback manager
 */
export class FlashbackManager {
  private flashbacks: Map<string, FlashbackDetectionResult & { event: TimelineEvent }> = new Map()
  
  /**
   * Register a flashback
   */
  register(event: TimelineEvent, detection: FlashbackDetectionResult): void {
    this.flashbacks.set(event.id, { ...detection, event })
  }
  
  /**
   * Get all flashbacks
   */
  getAll(): Array<FlashbackDetectionResult & { event: TimelineEvent }> {
    return Array.from(this.flashbacks.values())
  }
  
  /**
   * Get flashbacks by type
   */
  getByType(type: FlashbackType): TimelineEvent[] {
    return Array.from(this.flashbacks.values())
      .filter(f => classifyFlashback(f.event, []).type === type)
      .map(f => f.event)
  }
  
  /**
   * Get flashback timeline (chronological order within flashbacks)
   */
  getFlashbackTimeline(): TimelineEvent[] {
    const events = Array.from(this.flashbacks.values()).map(f => f.event)
    
    // Sort by chronological order if available, otherwise by reading order
    return events.sort((a, b) => {
      if (a.chronologicalOrder !== undefined && b.chronologicalOrder !== undefined) {
        return a.chronologicalOrder - b.chronologicalOrder
      }
      return a.pageNumber - b.pageNumber
    })
  }
  
  /**
   * Get flashback statistics
   */
  getStats(): {
    total: number
    byType: Record<FlashbackType, number>
    averageConfidence: number
    nestedFlashbacks: number
  } {
    const byType: Record<FlashbackType, number> = {
      memory: 0,
      backstory: 0,
      exposition: 0,
      dream: 0,
      vision: 0,
      unknown: 0,
    }
    
    let totalConfidence = 0
    
    for (const flashback of this.flashbacks.values()) {
      const classification = classifyFlashback(flashback.event, [])
      byType[classification.type]++
      totalConfidence += flashback.confidence
    }
    
    return {
      total: this.flashbacks.size,
      byType,
      averageConfidence: this.flashbacks.size > 0 
        ? totalConfidence / this.flashbacks.size 
        : 0,
      nestedFlashbacks: 0, // Would need more context to detect
    }
  }
  
  /**
   * Check if flashback is nested (within another flashback)
   */
  isNested(flashbackId: string, allEvents: TimelineEvent[]): boolean {
    const flashback = this.flashbacks.get(flashbackId)?.event
    if (!flashback) return false
    
    // Check if there's a flashback that contains this one
    const flashbackEvents = allEvents.filter(e => e.isFlashback && e.id !== flashbackId)
    
    for (const other of flashbackEvents) {
      // Simplistic check: if this flashback's page is "inside" another's narrative
      // This is a heuristic - true nested detection would need more context
      const surrounding = this.getSurroundingPages(other, allEvents)
      if (surrounding.includes(flashback.pageNumber)) {
        return true
      }
    }
    
    return false
  }
  
  /**
   * Get pages surrounding an event
   */
  private getSurroundingPages(event: TimelineEvent, allEvents: TimelineEvent[]): number[] {
    const sorted = [...allEvents].sort((a, b) => a.pageNumber - b.pageNumber)
    const index = sorted.findIndex(e => e.id === event.id)
    
    if (index === -1) return []
    
    // Get pages within ~5 pages of this event
    const start = Math.max(0, index - 2)
    const end = Math.min(sorted.length, index + 3)
    
    return sorted.slice(start, end).map(e => e.pageNumber)
  }
}
