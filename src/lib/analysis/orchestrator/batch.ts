/**
 * Batch processing logic for LLM analysis
 */

import { calculateBatchSize, generateBatchRanges } from '../preprocessor/batch'

export interface BatchProcessorConfig {
  maxBatchSize: number
  overlapSize: number
  delayBetweenBatches: number // ms
}

export class BatchProcessor {
  private config: BatchProcessorConfig

  constructor(config: BatchProcessorConfig) {
    this.config = config
  }

  /**
   * Process images in batches with overlap
   */
  async processBatches<T>(
    images: string[],
    processor: (batch: string[], batchIndex: number) => Promise<T>,
    onBatchComplete?: (result: T, batchIndex: number, total: number) => void
  ): Promise<T[]> {
    const ranges = generateBatchRanges(
      images.length,
      this.config.maxBatchSize,
      this.config.overlapSize
    )

    const results: T[] = []

    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i]
      const batch = images.slice(range.start, range.end + 1)

      const result = await processor(batch, i)
      results.push(result)

      onBatchComplete?.(result, i, ranges.length)

      // Delay between batches to avoid rate limiting
      if (i < ranges.length - 1) {
        await this.delay(this.config.delayBetweenBatches)
      }
    }

    return results
  }

  /**
   * Calculate optimal batch configuration
   */
  calculateOptimalConfig(
    totalPages: number,
    provider: 'gemini' | 'openai'
  ): { batchSize: number; overlapSize: number; totalBatches: number } {
    return calculateBatchSize(totalPages, 100, {
      maxBatchSize: provider === 'gemini' ? 12 : 8,
      targetBatchSizeKB: provider === 'gemini' ? 800 : 400,
    })
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
