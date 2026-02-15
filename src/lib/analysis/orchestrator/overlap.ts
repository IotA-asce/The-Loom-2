/**
 * Overlapping batches handling
 * Manages overlapping page ranges for continuity in analysis
 */

export interface OverlappingRange {
  start: number
  end: number
  overlapStart: number // Pages that overlap with previous batch
  overlapEnd: number   // Pages that overlap with next batch
  isFirst: boolean
  isLast: boolean
}

export interface OverlapContext {
  previousBatchEnd?: string[] // Last few images from previous batch
  nextBatchStart?: string[]   // First few images from next batch
  characterContinuity: Map<string, {
    lastSeen: number
    state: string
    confidence: number
  }>
}

/**
 * Generates batch ranges with strategic overlap
 */
export function generateOverlappingRanges(
  totalPages: number,
  batchSize: number,
  overlapSize: number
): OverlappingRange[] {
  const ranges: OverlappingRange[] = []
  const effectiveBatchSize = batchSize - overlapSize
  const totalBatches = Math.ceil((totalPages - overlapSize) / effectiveBatchSize)

  for (let i = 0; i < totalBatches; i++) {
    const start = i * effectiveBatchSize
    const end = Math.min(start + batchSize - 1, totalPages - 1)
    
    ranges.push({
      start,
      end,
      overlapStart: i === 0 ? 0 : overlapSize,
      overlapEnd: i === totalBatches - 1 ? 0 : overlapSize,
      isFirst: i === 0,
      isLast: i === totalBatches - 1,
    })
  }

  return ranges
}

/**
 * Manages continuity data across overlapping batches
 */
export class OverlapManager {
  private overlapContexts: Map<number, OverlapContext> = new Map()
  private characterStates: Map<string, {
    lastSeen: number
    state: string
    confidence: number
  }> = new Map()

  /**
   * Initialize overlap context for a batch
   */
  initializeBatch(batchIndex: number, previousBatch?: string[]): OverlapContext {
    const context: OverlapContext = {
      previousBatchEnd: previousBatch,
      characterContinuity: new Map(this.characterStates),
    }
    
    this.overlapContexts.set(batchIndex, context)
    return context
  }

  /**
   * Update character continuity from batch results
   */
  updateContinuity(
    batchIndex: number,
    characters: Array<{
      id: string
      name: string
      state: string
      confidence: number
    }>
  ): void {
    for (const char of characters) {
      const existing = this.characterStates.get(char.id)
      
      // Only update if confidence is higher or character is new
      if (!existing || char.confidence > existing.confidence) {
        this.characterStates.set(char.id, {
          lastSeen: batchIndex,
          state: char.state,
          confidence: char.confidence,
        })
      }
    }
  }

  /**
   * Get continuity hints for prompt context
   */
  getContinuityHints(batchIndex: number): string {
    const context = this.overlapContexts.get(batchIndex)
    if (!context) return ''

    const hints: string[] = []
    
    // Add character continuity hints
    const continuedChars = Array.from(context.characterContinuity.entries())
      .filter(([_, data]) => batchIndex - data.lastSeen <= 2) // Recently seen
      .map(([id, data]) => `- ${id}: ${data.state}`)
    
    if (continuedChars.length > 0) {
      hints.push('Characters continuing from previous batch:')
      hints.push(...continuedChars)
    }

    return hints.join('\n')
  }

  /**
   * Resolve conflicts between overlapping batch results
   */
  resolveOverlapConflicts<T extends { id: string; confidence: number }>(
    batchIndex: number,
    previousResults: T[],
    currentResults: T[]
  ): T[] {
    const resolved = new Map<string, T>()
    
    // Add previous results first
    for (const result of previousResults) {
      resolved.set(result.id, result)
    }
    
    // Merge with current, keeping higher confidence
    for (const result of currentResults) {
      const existing = resolved.get(result.id)
      if (!existing || result.confidence > existing.confidence) {
        resolved.set(result.id, result)
      }
    }
    
    return Array.from(resolved.values())
  }

  /**
   * Clear all overlap data
   */
  clear(): void {
    this.overlapContexts.clear()
    this.characterStates.clear()
  }
}

/**
 * Merge results from overlapping batches
 */
export function mergeOverlappingResults<T extends { 
  id: string
  pageNumber?: number
  confidence: number 
}>(
  batchResults: T[][],
  overlapSize: number
): T[] {
  const merged = new Map<string, T>()
  
  for (let i = 0; i < batchResults.length; i++) {
    const batch = batchResults[i]
    const isFirstBatch = i === 0
    const isLastBatch = i === batchResults.length - 1
    
    for (const item of batch) {
      // Skip overlap pages (except for first/last batches)
      if (!isFirstBatch && item.pageNumber !== undefined) {
        const batchStart = i * (batch.length - overlapSize)
        if (item.pageNumber < batchStart + overlapSize) {
          continue // Skip overlap from previous batch
        }
      }
      
      const existing = merged.get(item.id)
      if (!existing || item.confidence > existing.confidence) {
        merged.set(item.id, item)
      }
    }
  }
  
  return Array.from(merged.values())
}
