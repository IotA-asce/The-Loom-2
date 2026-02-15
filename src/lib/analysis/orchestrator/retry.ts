/**
 * Retry with exponential backoff (3x)
 * Robust retry mechanism for LLM API calls
 */

import { LLMErrorCode } from '@/lib/llm/types'
import { RateLimitError, NetworkError } from '@/lib/errors'

export interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  retryableErrors: LLMErrorCode[]
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    LLMErrorCode.RATE_LIMIT,
    LLMErrorCode.NETWORK,
    LLMErrorCode.TIMEOUT,
    LLMErrorCode.API_ERROR,
  ],
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
  totalDelayMs: number
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateBackoff(
  attempt: number,
  config: RetryConfig
): number {
  const exponentialDelay = config.initialDelayMs * Math.pow(
    config.backoffMultiplier,
    attempt - 1
  )
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs)
  
  // Add random jitter (±25%) to prevent thundering herd
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1)
  
  return Math.floor(cappedDelay + jitter)
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: unknown, config: RetryConfig): boolean {
  if (error instanceof RateLimitError) return true
  if (error instanceof NetworkError) return true
  
  // Check error code if available
  const errorCode = (error as { code?: string })?.code
  if (errorCode && config.retryableErrors.includes(errorCode as LLMErrorCode)) {
    return true
  }
  
  // Retry on timeout errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('econnreset') ||
      message.includes('etimedout')
    )
  }
  
  return false
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Execute function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: Error | undefined
  let totalDelayMs = 0

  for (let attempt = 1; attempt <= fullConfig.maxRetries + 1; attempt++) {
    try {
      const data = await fn()
      return {
        success: true,
        data,
        attempts: attempt,
        totalDelayMs,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Don't retry on last attempt or non-retryable errors
      if (attempt > fullConfig.maxRetries || !isRetryableError(error, fullConfig)) {
        break
      }
      
      // Calculate and apply backoff
      const delay = calculateBackoff(attempt, fullConfig)
      totalDelayMs += delay
      
      await sleep(delay)
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: fullConfig.maxRetries + 1,
    totalDelayMs,
  }
}

/**
 * Retry wrapper class for complex operations
 */
export class RetryWrapper {
  private config: RetryConfig

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config }
  }

  /**
   * Execute with retry
   */
  async execute<T>(fn: () => Promise<T>): Promise<RetryResult<T>> {
    return withRetry(fn, this.config)
  }

  /**
   * Execute multiple operations with individual retry
   */
  async executeBatch<T>(
    operations: Array<() => Promise<T>>,
    options?: { continueOnError?: boolean }
  ): Promise<RetryResult<T>[]> {
    const results: RetryResult<T>[] = []
    
    for (const operation of operations) {
      const result = await this.execute(operation)
      results.push(result)
      
      if (!result.success && !options?.continueOnError) {
        break
      }
    }
    
    return results
  }

  /**
   * Update retry configuration
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

/**
 * Circuit breaker pattern for repeated failures
 */
export class CircuitBreaker {
  private failureCount = 0
  private lastFailureTime?: number
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  
  constructor(
    private failureThreshold = 5,
    private resetTimeoutMs = 30000
  ) {}

  /**
   * Check if circuit is open (should not attempt)
   */
  isOpen(): boolean {
    if (this.state === 'open') {
      const now = Date.now()
      if (this.lastFailureTime && now - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = 'half-open'
        return false
      }
      return true
    }
    return false
  }

  /**
   * Record success
   */
  recordSuccess(): void {
    this.failureCount = 0
    this.state = 'closed'
  }

  /**
   * Record failure
   */
  recordFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open'
    }
  }

  /**
   * Execute with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open - too many failures')
    }

    try {
      const result = await fn()
      this.recordSuccess()
      return result
    } catch (error) {
      this.recordFailure()
      throw error
    }
  }
}
