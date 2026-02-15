/**
 * Instruction + conversation feedback
 */

import type { BranchVariation } from '../variation/generator'
import type { RefinementArea, RefinementResult } from './refiner'

export type ConversationMessageType = 'user-instruction' | 'user-feedback' | 'system-question' | 'refinement-confirmation'

export interface ConversationMessage {
  id: string
  type: ConversationMessageType
  content: string
  timestamp: number
  metadata?: {
    focusArea?: RefinementArea
    iteration?: number
    applied?: boolean
  }
}

export interface RefinementConversation {
  branchId: string
  messages: ConversationMessage[]
  currentIteration: number
  pendingInstructions: string[]
  resolvedInstructions: string[]
}

/**
 * Start a refinement conversation
 */
export function startConversation(
  branchId: string,
  initialInstruction: string,
  focusArea?: RefinementArea
): RefinementConversation {
  return {
    branchId,
    messages: [{
      id: `msg-${Date.now()}`,
      type: 'user-instruction',
      content: initialInstruction,
      timestamp: Date.now(),
      metadata: { focusArea, iteration: 1 },
    }],
    currentIteration: 1,
    pendingInstructions: [initialInstruction],
    resolvedInstructions: [],
  }
}

/**
 * Add user feedback to conversation
 */
export function addUserFeedback(
  conversation: RefinementConversation,
  feedback: string,
  type: 'positive' | 'negative' | 'adjustment' = 'adjustment'
): RefinementConversation {
  const messageType: ConversationMessageType = type === 'positive' 
    ? 'refinement-confirmation' 
    : 'user-feedback'
  
  const newMessage: ConversationMessage = {
    id: `msg-${Date.now()}`,
    type: messageType,
    content: feedback,
    timestamp: Date.now(),
    metadata: { iteration: conversation.currentIteration },
  }
  
  const pendingInstructions = type === 'adjustment' 
    ? [...conversation.pendingInstructions, feedback]
    : conversation.pendingInstructions
  
  return {
    ...conversation,
    messages: [...conversation.messages, newMessage],
    pendingInstructions,
  }
}

/**
 * Add system question to conversation
 */
export function addSystemQuestion(
  conversation: RefinementConversation,
  question: string,
  focusArea?: RefinementArea
): RefinementConversation {
  const newMessage: ConversationMessage = {
    id: `msg-${Date.now()}`,
    type: 'system-question',
    content: question,
    timestamp: Date.now(),
    metadata: { focusArea, iteration: conversation.currentIteration },
  }
  
  return {
    ...conversation,
    messages: [...conversation.messages, newMessage],
  }
}

/**
 * Mark instruction as resolved
 */
export function resolveInstruction(
  conversation: RefinementConversation,
  instruction: string
): RefinementConversation {
  return {
    ...conversation,
    pendingInstructions: conversation.pendingInstructions.filter(i => i !== instruction),
    resolvedInstructions: [...conversation.resolvedInstructions, instruction],
  }
}

/**
 * Advance to next iteration
 */
export function advanceIteration(
  conversation: RefinementConversation
): RefinementConversation {
  return {
    ...conversation,
    currentIteration: conversation.currentIteration + 1,
  }
}

/**
 * Extract focus areas from conversation
 */
export function extractFocusAreas(conversation: RefinementConversation): RefinementArea[] {
  const areas = new Set<RefinementArea>()
  
  for (const message of conversation.messages) {
    if (message.metadata?.focusArea) {
      areas.add(message.metadata.focusArea)
    }
    
    // Infer from content
    const content = message.content.toLowerCase()
    if (content.includes('character')) areas.add('character-depth')
    if (content.includes('plot')) areas.add('plot-coherence')
    if (content.includes('theme')) areas.add('theme-development')
    if (content.includes('emotion')) areas.add('emotional-impact')
    if (content.includes('dialogue')) areas.add('dialogue-quality')
    if (content.includes('pace')) areas.add('pacing')
    if (content.includes('world')) areas.add('world-building')
    if (content.includes('stake')) areas.add('stakes-clarity')
  }
  
  return Array.from(areas)
}

/**
 * Build refinement request from conversation
 */
export function buildRefinementRequest(
  conversation: RefinementConversation,
  branchId: string
): {
  branchId: string
  focusAreas: RefinementArea[]
  userInstructions: string
  priority: 'low' | 'medium' | 'high'
} {
  const focusAreas = extractFocusAreas(conversation)
  
  // Combine pending instructions
  const userInstructions = conversation.pendingInstructions.join('\n\n')
  
  // Determine priority based on feedback type
  const hasNegative = conversation.messages.some(m => m.type === 'user-feedback')
  const priority: 'low' | 'medium' | 'high' = hasNegative ? 'high' : 
                                             conversation.currentIteration > 2 ? 'medium' : 'low'
  
  return {
    branchId,
    focusAreas,
    userInstructions,
    priority,
  }
}

/**
 * Generate conversation summary
 */
export function generateConversationSummary(
  conversation: RefinementConversation
): string {
  const lines: string[] = []
  
  lines.push(`# Refinement Conversation Summary`)
  lines.push(`Branch: ${conversation.branchId}`)
  lines.push(`Iterations: ${conversation.currentIteration}`)
  lines.push('')
  
  // Group by iteration
  const byIteration = new Map<number, ConversationMessage[]>()
  for (const msg of conversation.messages) {
    const iter = msg.metadata?.iteration || 1
    if (!byIteration.has(iter)) {
      byIteration.set(iter, [])
    }
    byIteration.get(iter)!.push(msg)
  }
  
  for (let i = 1; i <= conversation.currentIteration; i++) {
    const messages = byIteration.get(i) || []
    if (messages.length === 0) continue
    
    lines.push(`## Iteration ${i}`)
    for (const msg of messages) {
      const prefix = msg.type === 'user-instruction' ? '👤 User:' :
                     msg.type === 'user-feedback' ? '👤 Feedback:' :
                     msg.type === 'system-question' ? '❓ System:' :
                     '✓ Confirm:'
      lines.push(`${prefix} ${msg.content}`)
    }
    lines.push('')
  }
  
  // Status
  lines.push('## Status')
  lines.push(`Pending: ${conversation.pendingInstructions.length}`)
  lines.push(`Resolved: ${conversation.resolvedInstructions.length}`)
  
  return lines.join('\n')
}

/**
 * Check if user is satisfied based on conversation
 */
export function isUserSatisfied(conversation: RefinementConversation): boolean {
  // Check for explicit satisfaction indicators
  const lastMessages = conversation.messages.slice(-3)
  
  for (const msg of lastMessages) {
    if (msg.type === 'refinement-confirmation') {
      return true
    }
    if (msg.type === 'user-feedback') {
      const content = msg.content.toLowerCase()
      if (content.includes('good') || content.includes('perfect') || content.includes('satisfied')) {
        return true
      }
      if (content.includes('fix') || content.includes('change') || content.includes('wrong')) {
        return false
      }
    }
  }
  
  // If no pending instructions and multiple iterations, likely satisfied
  return conversation.pendingInstructions.length === 0 && 
         conversation.currentIteration >= 2
}

/**
 * Create conversation from refinement result
 */
export function createConversationFromResult(
  result: RefinementResult
): RefinementConversation {
  return {
    branchId: result.original.id,
    messages: result.changes.map((change, idx) => ({
      id: `msg-${Date.now()}-${idx}`,
      type: 'system-question',
      content: `Applied: ${change.description}`,
      timestamp: Date.now(),
      metadata: { 
        focusArea: change.area, 
        iteration: result.iteration,
        applied: true,
      },
    })),
    currentIteration: result.iteration,
    pendingInstructions: [],
    resolvedInstructions: result.changes.map(c => c.description),
  }
}
