/**
 * Progress and cost tracking
 */

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  estimatedCost: number
}

export interface AnalysisMetrics {
  startTime: Date
  endTime?: Date
  batchesProcessed: number
  totalBatches: number
  tokenUsage: TokenUsage
  retries: number
  fallbackSwitches: number
}

export class CostTracker {
  private usage: TokenUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
  }

  private providerRates: Record<string, { input: number; output: number }> = {
    gemini: { input: 0.075, output: 0.3 }, // per 1M tokens
    openai: { input: 2.5, output: 10.0 },
  }

  /**
   * Record token usage
   */
  recordUsage(provider: string, promptTokens: number, completionTokens: number): void {
    this.usage.promptTokens += promptTokens
    this.usage.completionTokens += completionTokens
    this.usage.totalTokens += promptTokens + completionTokens

    const rates = this.providerRates[provider] || { input: 0.1, output: 0.3 }
    const cost =
      (promptTokens / 1000000) * rates.input +
      (completionTokens / 1000000) * rates.output

    this.usage.estimatedCost += cost
  }

  /**
   * Get current usage
   */
  getUsage(): TokenUsage {
    return { ...this.usage }
  }

  /**
   * Reset tracking
   */
  reset(): void {
    this.usage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
    }
  }
}

export const costTracker = new CostTracker()
