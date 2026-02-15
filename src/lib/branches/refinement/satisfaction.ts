/**
 * User satisfaction handling
 */

import type { RefinementResult } from './refiner'
import type { RefinementConversation, ConversationMessage } from './conversation'

export interface SatisfactionCriteria {
  // Explicit signals
  explicitApproval: boolean
  // Implicit signals
  noPendingIssues: boolean
  iterationCount: number
  improvementThreshold: number
  timeSpent: number // seconds
}

export interface SatisfactionResult {
  satisfied: boolean
  confidence: number // 0-1
  reason: string
  canProceed: boolean
  needsMoreWork: boolean
  suggestions?: string[]
}

/**
 * Check if user is satisfied with refinement
 */
export function checkSatisfaction(
  result: RefinementResult,
  conversation: RefinementConversation,
  criteria: Partial<SatisfactionCriteria> = {}
): SatisfactionResult {
  const defaultCriteria: SatisfactionCriteria = {
    explicitApproval: false,
    noPendingIssues: conversation.pendingInstructions.length === 0,
    iterationCount: result.iteration,
    improvementThreshold: 0.7,
    timeSpent: 0,
    ...criteria,
  }
  
  let confidence = 0
  const signals: string[] = []
  
  // Check explicit approval
  if (defaultCriteria.explicitApproval || result.userSatisfied) {
    confidence += 0.4
    signals.push('Explicit user approval')
  }
  
  // Check for no pending issues
  if (defaultCriteria.noPendingIssues) {
    confidence += 0.2
    signals.push('No pending refinement requests')
  }
  
  // Check iteration count (diminishing returns)
  if (defaultCriteria.iterationCount >= 3) {
    confidence += 0.15
    signals.push('Multiple refinement cycles completed')
  }
  
  // Check conversation for satisfaction indicators
  const conversationScore = analyzeConversationSatisfaction(conversation)
  confidence += conversationScore * 0.25
  if (conversationScore > 0.5) {
    signals.push('Positive conversation indicators')
  }
  
  // Determine result
  const satisfied = confidence >= defaultCriteria.improvementThreshold
  
  // Generate suggestions if not satisfied
  let suggestions: string[] | undefined
  if (!satisfied && confidence < 0.5) {
    suggestions = generateImprovementSuggestions(result, conversation)
  }
  
  return {
    satisfied,
    confidence,
    reason: signals.join(', ') || 'Insufficient satisfaction signals',
    canProceed: satisfied || defaultCriteria.iterationCount >= 5,
    needsMoreWork: !satisfied && defaultCriteria.iterationCount < 5,
    suggestions,
  }
}

/**
 * Analyze conversation for satisfaction indicators
 */
function analyzeConversationSatisfaction(conversation: RefinementConversation): number {
  let score = 0
  const messages = conversation.messages
  
  if (messages.length === 0) return 0
  
  // Check last few messages
  const recentMessages = messages.slice(-5)
  
  for (const msg of recentMessages) {
    const content = msg.content.toLowerCase()
    
    // Positive indicators
    if (msg.type === 'refinement-confirmation') {
      score += 0.3
    }
    
    // Content analysis
    const positiveWords = ['good', 'great', 'perfect', 'excellent', 'better', 'improved', 'satisfied', 'happy']
    const negativeWords = ['fix', 'wrong', 'bad', 'issue', 'problem', 'change', 'not', 'dislike']
    
    for (const word of positiveWords) {
      if (content.includes(word)) score += 0.1
    }
    for (const word of negativeWords) {
      if (content.includes(word)) score -= 0.1
    }
  }
  
  // Check for repeated issues (indicates dissatisfaction)
  const issues = new Set<string>()
  for (const msg of messages) {
    if (msg.metadata?.focusArea) {
      if (issues.has(msg.metadata.focusArea)) {
        score -= 0.1 // Repeated focus area = not satisfied yet
      } else {
        issues.add(msg.metadata.focusArea)
      }
    }
  }
  
  return Math.max(0, Math.min(1, score))
}

/**
 * Generate improvement suggestions
 */
function generateImprovementSuggestions(
  result: RefinementResult,
  conversation: RefinementConversation
): string[] {
  const suggestions: string[] = []
  
  // Analyze what hasn't been addressed
  const addressedAreas = new Set(result.changes.map(c => c.area))
  const allAreas = [
    'character-depth',
    'plot-coherence',
    'theme-development',
    'emotional-impact',
    'dialogue-quality',
    'pacing',
    'world-building',
    'stakes-clarity',
  ] as const
  
  const unaddressed = allAreas.filter(a => !addressedAreas.has(a))
  
  if (unaddressed.length > 0) {
    suggestions.push(`Consider focusing on: ${unaddressed.slice(0, 3).join(', ')}`)
  }
  
  // Check conversation for repeated concerns
  const focusAreas: string[] = []
  for (const msg of conversation.messages) {
    if (msg.metadata?.focusArea && !focusAreas.includes(msg.metadata.focusArea)) {
      focusAreas.push(msg.metadata.focusArea)
    }
  }
  
  if (focusAreas.length > 3) {
    suggestions.push('Many different areas addressed - consider if scope is clear')
  }
  
  // Check iteration efficiency
  if (result.iteration > 3 && result.changes.length === 0) {
    suggestions.push('Recent iterations had no changes - may be ready for final approval')
  }
  
  return suggestions
}

/**
 * Mark user as satisfied
 */
export function markSatisfied(
  conversation: RefinementConversation,
  message?: string
): RefinementConversation {
  const satisfactionMessage: ConversationMessage = {
    id: `msg-${Date.now()}`,
    type: 'refinement-confirmation',
    content: message || 'User satisfied with refinement',
    timestamp: Date.now(),
    metadata: { iteration: conversation.currentIteration },
  }
  
  return {
    ...conversation,
    messages: [...conversation.messages, satisfactionMessage],
    pendingInstructions: [],
  }
}

/**
 * Request explicit satisfaction check
 */
export function requestSatisfactionCheck(
  conversation: RefinementConversation
): RefinementConversation {
  const checkMessage: ConversationMessage = {
    id: `msg-${Date.now()}`,
    type: 'system-question',
    content: 'Are you satisfied with the current refinement? (yes/no/more changes needed)',
    timestamp: Date.now(),
    metadata: { iteration: conversation.currentIteration },
  }
  
  return {
    ...conversation,
    messages: [...conversation.messages, checkMessage],
  }
}

/**
 * Get satisfaction progress
 */
export function getSatisfactionProgress(
  conversation: RefinementConversation,
  maxIterations: number
): {
  progress: number // 0-100
  status: 'starting' | 'in-progress' | 'nearly-there' | 'complete'
  estimate: string
} {
  const iteration = conversation.currentIteration
  const pending = conversation.pendingInstructions.length
  const resolved = conversation.resolvedInstructions.length
  
  // Calculate progress
  let progress = (iteration / maxIterations) * 50 // Up to 50% from iterations
  progress += Math.min(resolved * 5, 30) // Up to 30% from resolved issues
  progress += pending === 0 ? 20 : 0 // 20% for no pending issues
  
  progress = Math.min(100, Math.max(0, progress))
  
  // Determine status
  let status: 'starting' | 'in-progress' | 'nearly-there' | 'complete'
  if (progress < 25) status = 'starting'
  else if (progress < 60) status = 'in-progress'
  else if (progress < 90) status = 'nearly-there'
  else status = 'complete'
  
  // Generate estimate
  let estimate: string
  if (pending > 0) {
    estimate = `${pending} item(s) still to address`
  } else if (iteration < 2) {
    estimate = 'Minimum iterations not yet reached'
  } else {
    estimate = 'Ready for final review'
  }
  
  return { progress, status, estimate }
}
