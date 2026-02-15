// @ts-nocheck
/**
 * AI-assisted collaboration mode
 */

import type { RefinementTarget } from './scopes'
import type { LearningProfile } from './learning'

export type CollaborationMode = 
  | 'suggest-only'
  | 'apply-on-approve'
  | 'auto-apply-safe'
  | 'full-collaboration'

export interface CollaborationConfig {
  mode: CollaborationMode
  autoApplyCategories: string[]
  requireApprovalAbove: number // character count
  userConfidenceThreshold: number // 0-1
}

export interface CollaborationSession {
  id: string
  chapterId: string
  config: CollaborationConfig
  context: CollaborationContext
  history: CollaborationAction[]
  status: 'active' | 'paused' | 'completed'
}

export interface CollaborationContext {
  recentUserEdits: string[]
  aiSuggestionsPending: CollaborationSuggestion[]
  userPreferences: LearningProfile
  currentFocus?: string
}

export interface CollaborationAction {
  id: string
  timestamp: Date
  type: 'user-edit' | 'ai-suggestion' | 'user-approval' | 'user-rejection'
  description: string
  content?: string
}

import type { AISuggestion as BaseAISuggestion } from './ai-assist'

export interface CollaborationSuggestion extends BaseAISuggestion {
  autoApplicable: boolean
}

/**
 * Default collaboration configs
 */
export const COLLABORATION_PRESETS: Record<CollaborationMode, CollaborationConfig> = {
  'suggest-only': {
    mode: 'suggest-only',
    autoApplyCategories: [],
    requireApprovalAbove: 0,
    userConfidenceThreshold: 0,
  },
  'apply-on-approve': {
    mode: 'apply-on-approve',
    autoApplyCategories: ['grammar', 'spelling'],
    requireApprovalAbove: 100,
    userConfidenceThreshold: 0.7,
  },
  'auto-apply-safe': {
    mode: 'auto-apply-safe',
    autoApplyCategories: ['grammar', 'spelling', 'punctuation', 'typo'],
    requireApprovalAbove: 50,
    userConfidenceThreshold: 0.8,
  },
  'full-collaboration': {
    mode: 'full-collaboration',
    autoApplyCategories: ['grammar', 'spelling', 'punctuation', 'style', 'pacing'],
    requireApprovalAbove: 20,
    userConfidenceThreshold: 0.9,
  },
}

/**
 * Create collaboration session
 */
export function createCollaborationSession(
  chapterId: string,
  mode: CollaborationMode,
  preferences: LearningProfile
): CollaborationSession {
  return {
    id: `collab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    chapterId,
    config: COLLABORATION_PRESETS[mode],
    context: {
      recentUserEdits: [],
      aiSuggestionsPending: [],
      userPreferences: preferences,
    },
    history: [],
    status: 'active',
  }
}

/**
 * Process user edit in collaboration mode
 */
export function processUserEdit(
  session: CollaborationSession,
  edit: { original: string; replacement: string; description: string }
): CollaborationSession {
  const action: CollaborationAction = {
    id: `action-${Date.now()}`,
    timestamp: new Date(),
    type: 'user-edit',
    description: edit.description,
    content: edit.replacement,
  }
  
  // Learn from user edit
  const updatedPreferences = learnFromEdit(session.context.userPreferences, edit)
  
  return {
    ...session,
    context: {
      ...session.context,
      recentUserEdits: [...session.context.recentUserEdits.slice(-4), edit.description],
      userPreferences: updatedPreferences,
    },
    history: [...session.history, action],
  }
}

function learnFromEdit(
  profile: LearningProfile,
  edit: { original: string; replacement: string; description: string }
): LearningProfile {
  // Simple learning - would be more sophisticated in production
  return profile
}

/**
 * Generate contextual AI suggestions
 */
export function generateContextualSuggestions(
  session: CollaborationSession,
  content: string,
  cursorPosition: number
): AISuggestion[] {
  const suggestions: CollaborationSuggestion[] = []
  
  // Get recent user edit patterns
  const recentEdits = session.context.recentUserEdits
  
  // Suggest based on patterns
  if (recentEdits.some(e => e.includes('dialogue') || e.includes('dialog'))) {
    // User has been editing dialogue - suggest dialogue improvements
    suggestions.push({
      id: `sugg-${Date.now()}-1`,

      description: 'Consider varying dialogue tags based on your recent edits',
      explanation: 'Based on your recent edits to dialogue',
      confidence: 'medium',
      autoApplicable: false,
      scope: 'paragraph',
    })
  }
  
  if (recentEdits.some(e => e.includes('description') || e.includes('show'))) {
    suggestions.push({
      id: `sugg-${Date.now()}-2`,

      description: 'Add sensory details to strengthen showing',
      explanation: 'Enhance descriptive passages',
      confidence: 'medium',
      autoApplicable: false,
      scope: 'paragraph',
    })
  }
  
  // Context-aware suggestions
  const currentParagraph = getCurrentParagraph(content, cursorPosition)
  
  // Check for long sentences
  const sentences = currentParagraph.match(/[^.!?]+[.!?]+/g) || []
  const longSentences = sentences.filter(s => s.length > 150)
  
  if (longSentences.length > 0) {
    suggestions.push({
      id: `sugg-${Date.now()}-3`,

      description: 'This paragraph has long sentences. Consider breaking them up.',
      explanation: 'Improve sentence variety for better pacing',
      confidence: 'high',
      autoApplicable: false,
      scope: 'paragraph',
    })
  }
  
  // Apply auto-applicable suggestions based on config
  if (session.config.autoApplyCategories.includes('grammar')) {
    const grammarIssues = checkGrammarQuick(content.slice(cursorPosition - 50, cursorPosition + 50))
    for (const issue of grammarIssues) {
      suggestions.push({
        id: `sugg-grammar-${Date.now()}`,
  
        description: issue.description,
        explanation: 'Grammar correction available',
        original: issue.original,
        replacement: issue.replacement,
        confidence: 'high',
        autoApplicable: true,
        scope: 'sentence',
      })
    }
  }
  
  return suggestions.filter(s => {
    if (s.autoApplicable) return true
    return session.config.mode !== 'suggest-only'
  })
}

function getCurrentParagraph(content: string, position: number): string {
  const before = content.slice(0, position).lastIndexOf('\n\n') + 2
  const after = content.slice(position).indexOf('\n\n')
  const end = after === -1 ? content.length : position + after
  
  return content.slice(before, end)
}

function checkGrammarQuick(text: string): Array<{ description: string; original: string; replacement: string }> {
  const issues: Array<{ description: string; original: string; replacement: string }> = []
  
  // Quick grammar checks
  if (text.includes('  ')) {
    issues.push({
      description: 'Double space detected',
      original: '  ',
      replacement: ' ',
    })
  }
  
  if (text.match(/\s+[.,;:!?]/)) {
    issues.push({
      description: 'Space before punctuation',
      original: text.match(/\s+[.,;:!?]/)?.[0] || '',
      replacement: text.match(/\s+[.,;:!?]/)?.[0].trim() || '',
    })
  }
  
  return issues
}

/**
 * Apply suggestion
 */
export function applySuggestion(
  session: CollaborationSession,
  suggestionId: string,
  content: string
): { session: CollaborationSession; newContent: string } {
  const suggestion = session.context.aiSuggestionsPending.find(s => s.id === suggestionId)
  
  if (!suggestion) {
    return { session, newContent: content }
  }
  
  const action: CollaborationAction = {
    id: `action-${Date.now()}`,
    timestamp: new Date(),
    type: 'user-approval',
    description: `Applied: ${suggestion.description}`,
    content: suggestion.replacement,
  }
  
  let newContent = content
  if (suggestion.original) {
    newContent = content.replace(suggestion.original, suggestion.replacement)
  }
  
  return {
    session: {
      ...session,
      context: {
        ...session.context,
        aiSuggestionsPending: session.context.aiSuggestionsPending.filter(s => s.id !== suggestionId),
      },
      history: [...session.history, action],
    },
    newContent,
  }
}

/**
 * Reject suggestion
 */
export function rejectSuggestion(
  session: CollaborationSession,
  suggestionId: string
): CollaborationSession {
  const suggestion = session.context.aiSuggestionsPending.find(s => s.id === suggestionId)
  
  if (!suggestion) return session
  
  const action: CollaborationAction = {
    id: `action-${Date.now()}`,
    timestamp: new Date(),
    type: 'user-rejection',
    description: `Rejected: ${suggestion.description}`,
  }
  
  return {
    ...session,
    context: {
      ...session.context,
      aiSuggestionsPending: session.context.aiSuggestionsPending.filter(s => s.id !== suggestionId),
    },
    history: [...session.history, action],
  }
}

/**
 * Pause collaboration
 */
export function pauseCollaboration(session: CollaborationSession): CollaborationSession {
  return {
    ...session,
    status: 'paused',
  }
}

/**
 * Resume collaboration
 */
export function resumeCollaboration(session: CollaborationSession): CollaborationSession {
  return {
    ...session,
    status: 'active',
  }
}

/**
 * Get collaboration summary
 */
export function getCollaborationSummary(session: CollaborationSession): {
  totalEdits: number
  totalSuggestions: number
  acceptedSuggestions: number
  rejectedSuggestions: number
  mode: CollaborationMode
} {
  return {
    totalEdits: session.history.filter(h => h.type === 'user-edit').length,
    totalSuggestions: session.history.filter(h => h.type === 'ai-suggestion').length,
    acceptedSuggestions: session.history.filter(h => h.type === 'user-approval').length,
    rejectedSuggestions: session.history.filter(h => h.type === 'user-rejection').length,
    mode: session.config.mode,
  }
}
