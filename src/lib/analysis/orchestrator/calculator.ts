/**
 * Batch calculator per provider
 * Calculates optimal batch sizes based on provider capabilities and content
 */

import { LLMProvider, ProviderCapabilities } from '@/lib/llm/types'

export interface BatchCalculation {
  batchSize: number
  overlapSize: number
  totalBatches: number
  estimatedTimeMinutes: number
}

export interface ProviderBatchLimits {
  maxImagesPerBatch: number
  maxBatchSizeKB: number
  maxTokensPerRequest: number
  recommendedBatchSize: number
}

/**
 * Provider-specific batch configuration
 */
export const PROVIDER_LIMITS: Record<string, ProviderBatchLimits> = {
  gemini: {
    maxImagesPerBatch: 16,
    maxBatchSizeKB: 2048,
    maxTokensPerRequest: 1048576,
    recommendedBatchSize: 12,
  },
  openai: {
    maxImagesPerBatch: 8,
    maxBatchSizeKB: 1024,
    maxTokensPerRequest: 128000,
    recommendedBatchSize: 6,
  },
  anthropic: {
    maxImagesPerBatch: 10,
    maxBatchSizeKB: 1536,
    maxTokensPerRequest: 200000,
    recommendedBatchSize: 8,
  },
}

/**
 * Calculates optimal batch configuration based on provider and content
 */
export class BatchCalculator {
  private provider: LLMProvider
  private limits: ProviderBatchLimits

  constructor(provider: LLMProvider) {
    this.provider = provider
    this.limits = PROVIDER_LIMITS[provider.id] || PROVIDER_LIMITS.gemini
  }

  /**
   * Calculate optimal batch configuration
   */
  calculate(
    totalPages: number,
    averagePageSizeKB: number = 500,
    thoroughMode: boolean = false
  ): BatchCalculation {
    // Adjust batch size based on page size
    const sizeAdjustedBatch = Math.floor(
      this.limits.maxBatchSizeKB / Math.max(averagePageSizeKB, 100)
    )

    // Take minimum of image count and size limits
    let batchSize = Math.min(
      this.limits.recommendedBatchSize,
      sizeAdjustedBatch,
      this.limits.maxImagesPerBatch
    )

    // Thorough mode uses smaller batches for more detailed analysis
    if (thoroughMode) {
      batchSize = Math.max(2, Math.floor(batchSize * 0.6))
    }

    // Calculate overlap (10-20% of batch size)
    const overlapSize = Math.max(1, Math.floor(batchSize * 0.15))

    // Calculate total batches accounting for overlap
    const effectiveBatchSize = batchSize - overlapSize
    const totalBatches = Math.ceil((totalPages - overlapSize) / effectiveBatchSize)

    // Estimate time (avg 30s per batch, more for thorough mode)
    const timePerBatch = thoroughMode ? 90 : 30
    const estimatedTimeMinutes = Math.ceil(totalBatches * timePerBatch / 60)

    return {
      batchSize,
      overlapSize,
      totalBatches: Math.max(1, totalBatches),
      estimatedTimeMinutes,
    }
  }

  /**
   * Calculate for multiple providers and return best option
   */
  static compareProviders(
    providers: LLMProvider[],
    totalPages: number,
    averagePageSizeKB?: number
  ): Array<{ provider: LLMProvider; calculation: BatchCalculation }> {
    return providers
      .map(provider => ({
        provider,
        calculation: new BatchCalculator(provider).calculate(
          totalPages,
          averagePageSizeKB
        ),
      }))
      .sort((a, b) => a.calculation.totalBatches - b.calculation.totalBatches)
  }

  /**
   * Get estimated cost for analysis
   */
  estimateCost(totalPages: number, thoroughMode: boolean = false): {
    estimatedTokens: number
    estimatedCost: number
  } {
    const calc = this.calculate(totalPages, undefined, thoroughMode)
    
    // Rough estimate: 1000 tokens per page for input, 500 for output
    const tokensPerPage = thoroughMode ? 2000 : 1000
    const outputTokensPerPage = thoroughMode ? 1500 : 500
    
    const estimatedTokens = totalPages * (tokensPerPage + outputTokensPerPage)
    
    // Provider-specific pricing (per 1M tokens)
    const pricing: Record<string, { input: number; output: number }> = {
      gemini: { input: 0.075, output: 0.3 },
      openai: { input: 2.5, output: 10.0 },
      anthropic: { input: 3.0, output: 15.0 },
    }
    
    const rates = pricing[this.provider.id] || pricing.gemini
    const inputCost = (totalPages * tokensPerPage / 1000000) * rates.input
    const outputCost = (totalPages * outputTokensPerPage / 1000000) * rates.output
    
    return {
      estimatedTokens,
      estimatedCost: inputCost + outputCost,
    }
  }
}

/**
 * Convenience function to calculate batches
 */
export function calculateBatches(
  provider: LLMProvider,
  totalPages: number,
  options?: {
    averagePageSizeKB?: number
    thoroughMode?: boolean
  }
): BatchCalculation {
  const calculator = new BatchCalculator(provider)
  return calculator.calculate(
    totalPages,
    options?.averagePageSizeKB,
    options?.thoroughMode
  )
}
