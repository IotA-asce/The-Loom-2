/**
 * Timeout/retry and user intervention for stuck generation
 */

import type { IterativeGeneration, GenerationPhase } from './iterative'

export interface InterventionConfig {
  timeoutMs: number
  maxRetries: number
  autoRetry: boolean
  requireUserIntervention: boolean
}

export interface GenerationAttempt {
  phase: GenerationPhase
  attempt: number
  timestamp: number
  status: 'running' | 'timeout' | 'error' | 'success'
  error?: string
  partialResult?: string
}

export interface InterventionRequest {
  type: 'timeout' | 'error' | 'stuck' | 'quality-issue'
  message: string
  options: InterventionOption[]
  canAutoRetry: boolean
}

export interface InterventionOption {
  id: string
  label: string
  action: 'retry' | 'continue' | 'skip' | 'modify' | 'cancel'
  description: string
}

export interface InterventionResult {
  action: InterventionOption['action']
  modifications?: string
  proceed: boolean
}

const DEFAULT_CONFIG: InterventionConfig = {
  timeoutMs: 120000, // 2 minutes
  maxRetries: 3,
  autoRetry: true,
  requireUserIntervention: true,
}

/**
 * Create intervention manager
 */
export function createInterventionManager(
  config: Partial<InterventionConfig> = {}
) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config }
  const attempts: GenerationAttempt[] = []
  
  return {
    config: fullConfig,
    attempts,
    
    recordAttempt(attempt: GenerationAttempt): void {
      attempts.push(attempt)
    },
    
    shouldIntervene(phase: GenerationPhase): boolean {
      const phaseAttempts = attempts.filter(a => a.phase === phase)
      
      // Check if max retries exceeded
      if (phaseAttempts.length >= fullConfig.maxRetries) {
        return true
      }
      
      // Check for consecutive errors
      const recentAttempts = phaseAttempts.slice(-3)
      if (recentAttempts.every(a => a.status === 'error')) {
        return true
      }
      
      return false
    },
    
    createInterventionRequest(
      type: InterventionRequest['type'],
      phase: GenerationPhase
    ): InterventionRequest {
      const options: InterventionOption[] = [
        {
          id: 'retry',
          label: 'Retry',
          action: 'retry',
          description: 'Try generating again with same parameters',
        },
        {
          id: 'continue',
          label: 'Continue from Partial',
          action: 'continue',
          description: 'Use partial result and continue',
        },
        {
          id: 'modify',
          label: 'Modify & Retry',
          action: 'modify',
          description: 'Adjust parameters and retry',
        },
        {
          id: 'skip',
          label: 'Skip Phase',
          action: 'skip',
          description: 'Skip to next phase with current result',
        },
      ]
      
      const messages: Record<InterventionRequest['type'], string> = {
        timeout: `Generation timed out after ${fullConfig.timeoutMs / 1000}s`,
        error: 'An error occurred during generation',
        stuck: 'Generation appears to be stuck',
        'quality-issue': 'Generated content does not meet quality standards',
      }
      
      return {
        type,
        message: messages[type],
        options,
        canAutoRetry: fullConfig.autoRetry && type !== 'quality-issue',
      }
    },
    
    handleIntervention(
      result: InterventionResult
    ): { action: string; continue: boolean } {
      switch (result.action) {
        case 'retry':
          return { action: 'retry', continue: true }
        case 'continue':
          return { action: 'continue', continue: true }
        case 'skip':
          return { action: 'skip', continue: true }
        case 'modify':
          return { action: 'modify', continue: true }
        case 'cancel':
          return { action: 'cancel', continue: false }
        default:
          return { action: 'unknown', continue: false }
      }
    },
    
    getAttemptHistory(): GenerationAttempt[] {
      return [...attempts]
    },
    
    getRetryCount(phase: GenerationPhase): number {
      return attempts.filter(a => a.phase === phase).length
    },
  }
}

export type InterventionManager = ReturnType<typeof createInterventionManager>

/**
 * Check if generation is stuck
 */
export function isGenerationStuck(
  generation: IterativeGeneration,
  startTime: number,
  config: InterventionConfig
): boolean {
  const elapsed = Date.now() - startTime
  return elapsed > config.timeoutMs
}

/**
 * Generate recovery suggestions
 */
export function generateRecoverySuggestions(
  error: string,
  phase: GenerationPhase
): string[] {
  const suggestions: string[] = []
  
  if (error.includes('context')) {
    suggestions.push('Reduce context length')
    suggestions.push('Summarize previous chapters')
  }
  
  if (error.includes('token')) {
    suggestions.push('Reduce chapter length target')
    suggestions.push('Simplify scene descriptions')
  }
  
  if (error.includes('timeout')) {
    suggestions.push('Break into smaller scenes')
    suggestions.push('Generate one scene at a time')
  }
  
  if (phase === 'expand') {
    suggestions.push('Focus on specific scenes only')
    suggestions.push('Reduce expansion target')
  }
  
  if (suggestions.length === 0) {
    suggestions.push('Try again with same parameters')
    suggestions.push('Simplify the outline')
  }
  
  return suggestions
}

/**
 * Format intervention for display
 */
export function formatIntervention(
  request: InterventionRequest
): string {
  const parts: string[] = []
  
  parts.push('## Generation Intervention Required')
  parts.push('')
  parts.push(request.message)
  parts.push('')
  
  parts.push('### Options')
  for (const option of request.options) {
    parts.push(`**${option.label}**`)
    parts.push(option.description)
    parts.push('')
  }
  
  if (request.canAutoRetry) {
    parts.push('*Auto-retry available*')
  }
  
  return parts.join('\n')
}
