/**
 * Batch size calculation for LLM processing
 */

export interface BatchConfig {
  batchSize: number
  overlapSize: number
  totalBatches: number
}

/**
 * Calculate optimal batch size based on image characteristics
 */
export function calculateBatchSize(
  totalPages: number,
  averageFileSizeKB: number,
  options: {
    maxBatchSize?: number
    targetBatchSizeKB?: number
  } = {}
): BatchConfig {
  const { maxBatchSize = 10, targetBatchSizeKB = 500 } = options

  // Calculate based on file size
  const sizeBasedBatch = Math.floor(targetBatchSizeKB / Math.max(averageFileSizeKB, 50))

  // Take minimum of size-based and max
  const batchSize = Math.max(3, Math.min(sizeBasedBatch, maxBatchSize))

  // Calculate overlap (10% of batch or 2 pages, whichever is larger)
  const overlapSize = Math.max(2, Math.floor(batchSize * 0.1))

  // Calculate total batches needed
  const effectiveBatchSize = batchSize - overlapSize
  const totalBatches = Math.ceil((totalPages - overlapSize) / effectiveBatchSize)

  return {
    batchSize,
    overlapSize,
    totalBatches: Math.max(1, totalBatches),
  }
}

/**
 * Calculate batch size for specific LLM provider
 */
export function calculateProviderBatchSize(
  provider: 'gemini' | 'openai',
  totalPages: number,
  imageComplexity: 'low' | 'medium' | 'high' = 'medium'
): BatchConfig {
  const complexityMultiplier = {
    low: 1.2,
    medium: 1.0,
    high: 0.8,
  }

  const baseSizes = {
    gemini: 12, // Gemini has larger context
    openai: 8,
  }

  const adjustedSize = Math.floor(baseSizes[provider] * complexityMultiplier[imageComplexity])

  return calculateBatchSize(totalPages, 100, {
    maxBatchSize: adjustedSize,
    targetBatchSizeKB: provider === 'gemini' ? 800 : 400,
  })
}

/**
 * Generate batch ranges with overlap
 */
export function generateBatchRanges(
  totalPages: number,
  batchSize: number,
  overlapSize: number
): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = []
  let current = 0

  while (current < totalPages) {
    const end = Math.min(current + batchSize, totalPages)
    ranges.push({ start: current, end: end - 1 })

    // Move forward by batch size minus overlap
    current += batchSize - overlapSize
  }

  return ranges
}
