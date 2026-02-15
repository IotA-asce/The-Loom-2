/**
 * Suggest-fix workflow for continuity issues
 */

import type { ContinuityIssue } from './validator'

export interface SuggestedFix {
  issueId: string
  description: string
  actions: FixAction[]
  confidence: 'high' | 'medium' | 'low'
}

export interface FixAction {
  type: 'replace' | 'insert' | 'delete' | 'flag'
  location: string
  original?: string
  replacement?: string
  explanation: string
}

export interface FixWorkflow {
  issue: ContinuityIssue
  suggestions: SuggestedFix[]
  userChoice: 'accept' | 'reject' | 'modify' | null
  appliedFix?: SuggestedFix
}

/**
 * Generate fix suggestions for an issue
 */
export function suggestFix(issue: ContinuityIssue): SuggestedFix[] {
  const suggestions: SuggestedFix[] = []
  
  switch (issue.type) {
    case 'character':
      suggestions.push(...suggestCharacterFix(issue))
      break
    case 'plot':
      suggestions.push(...suggestPlotFix(issue))
      break
    case 'world':
      suggestions.push(...suggestWorldFix(issue))
      break
    case 'timeline':
      suggestions.push(...suggestTimelineFix(issue))
      break
    case 'knowledge':
      suggestions.push(...suggestKnowledgeFix(issue))
      break
  }
  
  return suggestions
}

function suggestCharacterFix(issue: ContinuityIssue): SuggestedFix[] {
  const suggestions: SuggestedFix[] = []
  
  if (issue.description.includes('Deceased')) {
    suggestions.push({
      issueId: issue.id,
      description: 'Remove deceased character from scene',
      actions: [{
        type: 'delete',
        location: issue.location.context,
        explanation: 'Character is deceased and cannot appear in new scenes',
      }],
      confidence: 'high',
    })
    
    suggestions.push({
      issueId: issue.id,
      description: 'Add resurrection explanation',
      actions: [{
        type: 'insert',
        location: 'before scene',
        replacement: '[Add scene explaining resurrection]',
        explanation: 'If character is meant to be alive, add resurrection plot point',
      }],
      confidence: 'low',
    })
  }
  
  if (issue.description.includes('not in knowledge base')) {
    suggestions.push({
      issueId: issue.id,
      description: 'Add character to knowledge base',
      actions: [{
        type: 'flag',
        location: 'knowledge-base',
        explanation: 'Add this character to the character database',
      }],
      confidence: 'high',
    })
  }
  
  return suggestions
}

function suggestPlotFix(issue: ContinuityIssue): SuggestedFix[] {
  const suggestions: SuggestedFix[] = []
  
  if (issue.description.includes('resolved but is now active')) {
    suggestions.push({
      issueId: issue.id,
      description: 'Add new complication to plot thread',
      actions: [{
        type: 'insert',
        location: issue.location.context,
        replacement: '[Add unexpected complication that reopens this plot]',
        explanation: 'Make the reactivation intentional by adding a new twist',
      }],
      confidence: 'medium',
    })
    
    suggestions.push({
      issueId: issue.id,
      description: 'Change to new related plot thread',
      actions: [{
        type: 'replace',
        location: issue.location.context,
        original: issue.location.context,
        replacement: '[Create new related plot thread instead]',
        explanation: 'Start a fresh plot rather than reopening resolved one',
      }],
      confidence: 'high',
    })
  }
  
  return suggestions
}

function suggestWorldFix(issue: ContinuityIssue): SuggestedFix[] {
  const suggestions: SuggestedFix[] = []
  
  suggestions.push({
    issueId: issue.id,
    description: 'Correct world state reference',
    actions: [{
      type: 'replace',
      location: issue.location.context,
      explanation: 'Update reference to match established world state',
    }],
    confidence: 'high',
  })
  
  suggestions.push({
    issueId: issue.id,
    description: 'Add world state change explanation',
    actions: [{
      type: 'insert',
      location: 'earlier in chapter',
      replacement: '[Add event explaining world state change]',
      explanation: 'If the change is intentional, show how it happened',
    }],
    confidence: 'medium',
  })
  
  return suggestions
}

function suggestTimelineFix(issue: ContinuityIssue): SuggestedFix[] {
  const suggestions: SuggestedFix[] = []
  
  suggestions.push({
    issueId: issue.id,
    description: 'Reorder chapters to maintain timeline',
    actions: [{
      type: 'flag',
      location: 'chapter-order',
      explanation: 'Adjust chapter order in story structure',
    }],
    confidence: 'high',
  })
  
  return suggestions
}

function suggestKnowledgeFix(issue: ContinuityIssue): SuggestedFix[] {
  const suggestions: SuggestedFix[] = []
  
  suggestions.push({
    issueId: issue.id,
    description: 'Add earlier revelation of information',
    actions: [{
      type: 'insert',
      location: 'previous chapter',
      replacement: '[Add scene revealing this information]',
      explanation: 'Show this information being revealed before referencing it',
    }],
    confidence: 'medium',
  })
  
  suggestions.push({
    issueId: issue.id,
    description: 'Remove callback to unrevealed information',
    actions: [{
      type: 'delete',
      location: issue.location.context,
      explanation: 'Remove reference until information is properly revealed',
    }],
    confidence: 'high',
  })
  
  return suggestions
}

/**
 * Create fix workflow
 */
export function createFixWorkflow(issue: ContinuityIssue): FixWorkflow {
  const suggestions = suggestFix(issue)
  
  return {
    issue,
    suggestions,
    userChoice: null,
  }
}

/**
 * Apply a fix
 */
export function applyFix(
  workflow: FixWorkflow,
  suggestionIndex: number
): FixWorkflow {
  const suggestion = workflow.suggestions[suggestionIndex]
  if (!suggestion) {
    return workflow
  }
  
  return {
    ...workflow,
    userChoice: 'accept',
    appliedFix: suggestion,
  }
}

/**
 * Reject a fix
 */
export function rejectFix(workflow: FixWorkflow): FixWorkflow {
  return {
    ...workflow,
    userChoice: 'reject',
  }
}

/**
 * Modify a fix
 */
export function modifyFix(
  workflow: FixWorkflow,
  modifiedSuggestion: SuggestedFix
): FixWorkflow {
  return {
    ...workflow,
    userChoice: 'modify',
    appliedFix: modifiedSuggestion,
  }
}

/**
 * Format suggestion for display
 */
export function formatSuggestion(suggestion: SuggestedFix): string {
  const parts: string[] = []
  
  parts.push(`### ${suggestion.description}`)
  parts.push(`Confidence: ${suggestion.confidence}`)
  parts.push('')
  parts.push('Actions:')
  
  for (const action of suggestion.actions) {
    parts.push(`- ${action.type.toUpperCase()} at ${action.location}`)
    if (action.original) {
      parts.push(`  Original: "${action.original}"`)
    }
    if (action.replacement) {
      parts.push(`  Replacement: "${action.replacement}"`)
    }
    parts.push(`  (${action.explanation})`)
  }
  
  return parts.join('\n')
}

/**
 * Batch suggest fixes
 */
export function batchSuggestFixes(
  issues: ContinuityIssue[]
): Map<string, SuggestedFix[]> {
  const results = new Map<string, SuggestedFix[]>()
  
  for (const issue of issues) {
    const suggestions = suggestFix(issue)
    results.set(issue.id, suggestions)
  }
  
  return results
}
