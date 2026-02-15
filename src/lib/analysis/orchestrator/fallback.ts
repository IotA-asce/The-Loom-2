/**
 * Fallback provider switching
 * Automatic failover to backup providers on failure
 */

import { LLMProvider, LLMRequest, LLMResponse } from '@/lib/llm/types'
import { withRetry, RetryResult } from './retry'

export interface FallbackConfig {
  providers: LLMProvider[]
  primaryIndex: number
  switchOnError: boolean
  switchOnRateLimit: boolean
  maxSwitches: number
}

export interface FallbackResult<T> extends RetryResult<T> {
  providerUsed: string
  switches: number
  providerHistory: Array<{
    provider: string
    success: boolean
    error?: string
  }>
}

/**
 * Fallback orchestrator for provider switching
 */
export class FallbackOrchestrator {
  private config: FallbackConfig
  private currentIndex: number
  private switchCount = 0
  private providerHistory: Array<{ provider: string; success: boolean; error?: string }> = []

  constructor(config: FallbackConfig) {
    this.config = config
    this.currentIndex = config.primaryIndex
  }

  /**
   * Execute with automatic fallback
   */
  async execute<T>(
    operation: (provider: LLMProvider) => Promise<T>
  ): Promise<FallbackResult<T>> {
    const startProvider = this.currentProvider.id
    let lastError: Error | undefined

    while (this.switchCount <= this.config.maxSwitches) {
      const provider = this.currentProvider
      
      try {
        const result = await withRetry(() => operation(provider))
        
        if (result.success) {
          this.providerHistory.push({
            provider: provider.id,
            success: true,
          })
          
          return {
            ...result,
            providerUsed: provider.id,
            switches: this.switchCount,
            providerHistory: [...this.providerHistory],
          }
        }
        
        // Retry failed but didn't throw - try fallback
        lastError = result.error
        this.providerHistory.push({
          provider: provider.id,
          success: false,
          error: result.error?.message,
        })
        
        if (!this.switchProvider(result.error)) {
          break
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        this.providerHistory.push({
          provider: provider.id,
          success: false,
          error: lastError.message,
        })
        
        if (!this.switchProvider(lastError)) {
          break
        }
      }
    }

    return {
      success: false,
      error: lastError || new Error('All providers failed'),
      attempts: 0,
      totalDelayMs: 0,
      providerUsed: startProvider,
      switches: this.switchCount,
      providerHistory: [...this.providerHistory],
    }
  }

  /**
   * Switch to next available provider
   */
  private switchProvider(error?: Error): boolean {
    if (this.switchCount >= this.config.maxSwitches) {
      return false
    }

    // Check if error warrants a switch
    if (error && !this.shouldSwitchOnError(error)) {
      return false
    }

    // Find next available provider
    const nextIndex = this.findNextProvider()
    if (nextIndex === -1 || nextIndex === this.currentIndex) {
      return false
    }

    this.currentIndex = nextIndex
    this.switchCount++
    return true
  }

  /**
   * Determine if error warrants provider switch
   */
  private shouldSwitchOnError(error: Error): boolean {
    const message = error.message.toLowerCase()
    
    // Always switch on rate limit if configured
    if (this.config.switchOnRateLimit && 
        (message.includes('rate limit') || message.includes('429'))) {
      return true
    }

    // Switch on authentication errors
    if (message.includes('auth') || message.includes('api key')) {
      return true
    }

    // Switch on certain error types
    if (this.config.switchOnError) {
      return true
    }

    return false
  }

  /**
   * Find next available provider
   */
  private findNextProvider(): number {
    for (let i = 1; i < this.config.providers.length; i++) {
      const index = (this.currentIndex + i) % this.config.providers.length
      const provider = this.config.providers[index]
      
      // Skip if provider not configured
      if (provider.isConfigured()) {
        return index
      }
    }
    return -1
  }

  /**
   * Get current provider
   */
  get currentProvider(): LLMProvider {
    return this.config.providers[this.currentIndex]
  }

  /**
   * Reset to primary provider
   */
  reset(): void {
    this.currentIndex = this.config.primaryIndex
    this.switchCount = 0
    this.providerHistory = []
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): LLMProvider[] {
    return this.config.providers.filter(p => p.isConfigured())
  }
}

/**
 * Provider priority manager
 */
export class ProviderPriorityManager {
  private providers: Map<string, { provider: LLMProvider; priority: number; successRate: number }> = new Map()

  /**
   * Register a provider with priority
   */
  registerProvider(provider: LLMProvider, priority: number): void {
    this.providers.set(provider.id, {
      provider,
      priority,
      successRate: 1.0,
    })
  }

  /**
   * Record success for provider
   */
  recordSuccess(providerId: string): void {
    const entry = this.providers.get(providerId)
    if (entry) {
      entry.successRate = Math.min(1, entry.successRate * 1.1)
    }
  }

  /**
   * Record failure for provider
   */
  recordFailure(providerId: string): void {
    const entry = this.providers.get(providerId)
    if (entry) {
      entry.successRate = Math.max(0, entry.successRate * 0.9)
    }
  }

  /**
   * Get best available provider
   */
  getBestProvider(): LLMProvider | undefined {
    const sorted = Array.from(this.providers.values())
      .filter(({ provider }) => provider.isConfigured())
      .sort((a, b) => {
        // Weight by priority and success rate
        const scoreA = a.priority * a.successRate
        const scoreB = b.priority * b.successRate
        return scoreB - scoreA
      })
    
    return sorted[0]?.provider
  }
}

/**
 * Convenience function for fallback execution
 */
export async function withFallback<T>(
  providers: LLMProvider[],
  operation: (provider: LLMProvider) => Promise<T>,
  options?: { maxSwitches?: number }
): Promise<FallbackResult<T>> {
  const orchestrator = new FallbackOrchestrator({
    providers,
    primaryIndex: 0,
    switchOnError: true,
    switchOnRateLimit: true,
    maxSwitches: options?.maxSwitches ?? providers.length - 1,
  })
  
  return orchestrator.execute(operation)
}
