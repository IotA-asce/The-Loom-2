/**
 * Auto-retry for low confidence
 * Automatically retries analysis when confidence is below threshold
 */

import { AnalysisStage } from '../prompts'
import { CalibratedConfidence } from './confidence'

export interface RetryPolicy {
  maxRetries: number
  confidenceThreshold: number
  backoffMultiplier: number
  initialDelayMs: number
  escalateParams: boolean
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 2,
  confidenceThreshold: 0.5,
  backoffMultiplier: 1.5,
  initialDelayMs: 2000,
  escalateParams: true,
}

export interface RetryAttempt {
  attempt: number
  timestamp: number
  confidence: number
  params: Record<string, unknown>
  success: boolean
}

export interface AutoRetryResult {
  success: boolean
  finalConfidence: number
  attempts: RetryAttempt[]
  shouldEscalate: boolean
  escalationParams?: Record<string, unknown>
}

/**
 * Auto-retry manager
 */
export class AutoRetryManager {
  private policy: RetryPolicy
  private attempts: RetryAttempt[] = []
  
  constructor(policy: Partial<RetryPolicy> = {}) {
    this.policy = { ...DEFAULT_RETRY_POLICY, ...policy }
  }
  
  /**
   * Check if retry is needed
   */
  shouldRetry(confidence: CalibratedConfidence): boolean {
    // Check attempt limit
    if (this.attempts.length >= this.policy.maxRetries) {
      return false
    }
    
    // Check confidence threshold
    return confidence.overall < this.policy.confidenceThreshold
  }
  
  /**
   * Get retry parameters
   */
  getRetryParams(baseParams: Record<string, unknown>): Record<string, unknown> {
    const attempt = this.attempts.length + 1
    
    // @ts-ignore - escalateParameters is a standalone function
    const escalated = this.policy.escalateParams
      ? escalateParameters(baseParams, attempt)
      : baseParams
    
    return {
      ...escalated,
      retryAttempt: attempt,
      temperature: Math.max(0.1, 0.7 - attempt * 0.1), // Lower temp for more focused results
    }
  }
  
  /**
   * Escalate parameters for better results
   */
  private escalateParams(
    baseParams: Record<string, unknown>,
    attempt: number
  ): Record<string, unknown> {
    const escalated: Record<string, unknown> = { ...baseParams }
    
    // Enable thorough mode on second retry
    if (attempt >= 2) {
      escalated.thoroughMode = true
    }
    
    // Increase max tokens on later retries
    if (attempt >= 2 && typeof baseParams.maxTokens === 'number') {
      escalated.maxTokens = Math.floor(baseParams.maxTokens * 1.5)
    }
    
    // Add more context
    if (attempt >= 2) {
      escalated.includeExamples = true
    }
    
    return escalated
  }
  
  /**
   * Record attempt
   */
  recordAttempt(confidence: number, params: Record<string, unknown>, success: boolean): void {
    this.attempts.push({
      attempt: this.attempts.length + 1,
      timestamp: Date.now(),
      confidence,
      params,
      success,
    })
  }
  
  /**
   * Get retry delay
   */
  getDelay(): number {
    return this.policy.initialDelayMs * Math.pow(
      this.policy.backoffMultiplier,
      this.attempts.length
    )
  }
  
  /**
   * Get final result
   */
  getResult(): AutoRetryResult {
    const lastAttempt = this.attempts[this.attempts.length - 1]
    const finalConfidence = lastAttempt?.confidence ?? 0
    
    return {
      success: finalConfidence >= this.policy.confidenceThreshold,
      finalConfidence,
      attempts: [...this.attempts],
      shouldEscalate: finalConfidence < this.policy.confidenceThreshold && 
                      this.attempts.length >= this.policy.maxRetries,
      escalationParams: this.shouldEscalate() ? this.getEscalationParams() : undefined,
    }
  }
  
  /**
   * Check if should escalate to manual intervention
   */
  private shouldEscalate(): boolean {
    if (this.attempts.length < this.policy.maxRetries) return false
    
    const lastConfidence = this.attempts[this.attempts.length - 1]?.confidence ?? 0
    return lastConfidence < this.policy.confidenceThreshold
  }
  
  /**
   * Get escalation parameters for manual intervention
   */
  private getEscalationParams(): Record<string, unknown> {
    return {
      thoroughMode: true,
      customPrompt: true,
      providerSwitch: true,
      manualReview: true,
    }
  }
  
  /**
   * Get attempt history
   */
  getAttempts(): RetryAttempt[] {
    return [...this.attempts]
  }
  
  /**
   * Reset manager
   */
  reset(): void {
    this.attempts = []
  }
}

/**
 * Confidence trend analyzer
 */
export class ConfidenceTrendAnalyzer {
  private history: Array<{ stage: AnalysisStage; confidence: number; timestamp: number }> = []
  
  /**
   * Record confidence measurement
   */
  record(stage: AnalysisStage, confidence: number): void {
    this.history.push({ stage, confidence, timestamp: Date.now() })
  }
  
  /**
   * Get trend for stage
   */
  getTrend(stage: AnalysisStage): 'improving' | 'stable' | 'declining' | 'insufficient_data' {
    const stageHistory = this.history.filter(h => h.stage === stage)
    
    if (stageHistory.length < 3) {
      return 'insufficient_data'
    }
    
    const recent = stageHistory.slice(-3)
    const first = recent[0].confidence
    const last = recent[recent.length - 1].confidence
    
    const change = last - first
    
    if (change > 0.1) return 'improving'
    if (change < -0.1) return 'declining'
    return 'stable'
  }
  
  /**
   * Get average confidence by stage
   */
  getAverageByStage(stage: AnalysisStage): number {
    const stageHistory = this.history.filter(h => h.stage === stage)
    
    if (stageHistory.length === 0) return 0
    
    const sum = stageHistory.reduce((acc, h) => acc + h.confidence, 0)
    return sum / stageHistory.length
  }
  
  /**
   * Check if stage consistently fails threshold
   */
  isConsistentlyFailing(stage: AnalysisStage, threshold: number = 0.5): boolean {
    const stageHistory = this.history.filter(h => h.stage === stage)
    
    if (stageHistory.length < 2) return false
    
    const recent = stageHistory.slice(-3)
    return recent.every(h => h.confidence < threshold)
  }
}

/**
 * Create auto-retry with escalation
 */
export async function autoRetryWithEscalation<T>(
  operation: (params: Record<string, unknown>) => Promise<T>,
  validate: (result: T) => { confidence: number },
  baseParams: Record<string, unknown>,
  policy?: Partial<RetryPolicy>
): Promise<{ result: T; retryResult: AutoRetryResult }> {
  const manager = new AutoRetryManager(policy)
  let lastResult: T | undefined
  
  do {
    const params = manager.getRetryParams(baseParams)
    const result = await operation(params)
    lastResult = result
    
    const { confidence } = validate(result)
    const success = confidence >= (policy?.confidenceThreshold ?? 0.5)
    
    manager.recordAttempt(confidence, params, success)
    
    if (success || !manager.shouldRetry({ overall: confidence } as CalibratedConfidence)) {
      break
    }
    
    // Wait before retry
    await sleep(manager.getDelay())
    
  } while (manager.shouldRetry({ overall: 0 } as CalibratedConfidence))
  
  return {
    result: lastResult!,
    retryResult: manager.getResult(),
  }
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Escalate parameters for better results
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function escalateParameters(
  baseParams: Record<string, unknown>,
  attempt: number
): Record<string, unknown> {
  const escalated: Record<string, unknown> = { ...baseParams }
  
  // Enable thorough mode on second retry
  if (attempt >= 2) {
    escalated.thoroughMode = true
  }
  
  // Increase max tokens on later retries
  if (attempt >= 2 && typeof baseParams.maxTokens === 'number') {
    escalated.maxTokens = Math.floor(baseParams.maxTokens * 1.5)
  }
  
  // Add more context
  if (attempt >= 2) {
    escalated.includeExamples = true
  }
  
  return escalated
}
