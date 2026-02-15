/**
 * 7 AI assistance features for refinement
 */

import type { RefinementTarget, RefinementScope } from './scopes'
import type { LearningProfile } from './learning'

export type AIAssistType =
  | 'suggest-improvements'
  | 'fix-continuity'
  | 'enhance-dialogue'
  | 'improve-pacing'
  | 'fix-grammar'
  | 'match-tone'
  | 'expand-contract'

export interface AIAssistRequest {
  type: AIAssistType
  target: RefinementTarget
  content: string
  context?: string
  preferences?: LearningProfile
}

export interface AIAssistResult {
  type: AIAssistType
  suggestions: AISuggestion[]
  confidence: 'high' | 'medium' | 'low'
  processingTime: number
}

export interface AISuggestion {
  id: string
  description: string
  original?: string
  replacement?: string
  explanation: string
  scope: RefinementScope
}

/**
 * 1. Suggest Improvements
 */
export function suggestImprovements(
  content: string,
  target: RefinementTarget,
  preferences?: LearningProfile
): AISuggestion[] {
  const suggestions: AISuggestion[] = []
  
  // Analyze for common improvement opportunities
  
  // Passive voice detection
  const passiveMatches = content.match(/\b(was|were|been|being|is|are)\s+\w+ed\b/gi)
  if (passiveMatches && passiveMatches.length > 3) {
    suggestions.push({
      id: `imp-${Date.now()}-1`,
      description: 'Consider using active voice',
      explanation: `Found ${passiveMatches.length} instances of passive voice. Active voice creates more engaging prose.`,
      scope: target.scope,
    })
  }
  
  // Weak verb detection
  const weakVerbs = ['was', 'were', 'is', 'are', 'had', 'have', 'did', 'do']
  const weakVerbMatches = weakVerbs.flatMap(v => 
    content.match(new RegExp(`\\b${v}\\b`, 'gi')) || []
  )
  if (weakVerbMatches.length > 5) {
    suggestions.push({
      id: `imp-${Date.now()}-2`,
      description: 'Replace weak verbs with strong action verbs',
      explanation: 'Strong verbs create more vivid imagery and engage readers better.',
      scope: target.scope,
    })
  }
  
  // Adverb overuse
  const adverbMatches = content.match(/\w+ly\b/gi)
  if (adverbMatches && adverbMatches.length > 5) {
    suggestions.push({
      id: `imp-${Date.now()}-3`,
      description: 'Reduce adverb usage',
      explanation: `Found ${adverbMatches.length} adverbs. Consider replacing with stronger verbs or removing.`,
      scope: target.scope,
    })
  }
  
  // Apply learned preferences
  if (preferences) {
    const topPrefs = [...preferences.preferences.values()]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
    
    for (const pref of topPrefs) {
      suggestions.push({
        id: `imp-pref-${pref.id}`,
        description: `Apply learned preference: ${pref.description}`,
        explanation: `Based on previous approved refinements (${(pref.weight * 100).toFixed(0)}% confidence)`,
        scope: target.scope,
      })
    }
  }
  
  return suggestions
}

/**
 * 2. Fix Continuity
 */
export function fixContinuitySuggestions(
  content: string,
  target: RefinementTarget,
  context?: string
): AISuggestion[] {
  const suggestions: AISuggestion[] = []
  
  // Check for tense consistency
  const pastTenseMatches = content.match(/\b(was|were|had|did|said|went|came)\b/gi) || []
  const presentTenseMatches = content.match(/\b(is|are|has|does|says|goes|comes)\b/gi) || []
  
  if (pastTenseMatches.length > 0 && presentTenseMatches.length > 0) {
    const dominantTense = pastTenseMatches.length > presentTenseMatches.length ? 'past' : 'present'
    suggestions.push({
      id: `cont-${Date.now()}-1`,
      description: `Standardize to ${dominantTense} tense`,
      explanation: `Mixed tenses detected. Convert ${dominantTense === 'past' ? 'present' : 'past'} tense to ${dominantTense}.`,
      scope: target.scope,
    })
  }
  
  // Check for pronoun clarity
  const ambiguousPronouns = content.match(/\b(he|she|they|it)\b[^.]{50,}\b(he|she|they|it)\b/gi)
  if (ambiguousPronouns) {
    suggestions.push({
      id: `cont-${Date.now()}-2`,
      description: 'Clarify pronoun references',
      explanation: 'Pronouns may be ambiguous. Consider using character names for clarity.',
      scope: target.scope,
    })
  }
  
  return suggestions
}

/**
 * 3. Enhance Dialogue
 */
export function enhanceDialogueSuggestions(
  content: string,
  target: RefinementTarget
): AISuggestion[] {
  const suggestions: AISuggestion[] = []
  
  // Check for "said" overuse
  const saidMatches = content.match(/\bsaid\b/gi)
  if (saidMatches && saidMatches.length > 5) {
    suggestions.push({
      id: `dial-${Date.now()}-1`,
      description: 'Vary dialogue tags',
      explanation: `Found ${saidMatches.length} instances of "said". Consider using action beats or varying tags.`,
      scope: target.scope,
    })
  }
  
  // Check for adverbial dialogue tags
  const adverbialTags = content.match(/\bsaid\s+\w+ly\b/gi)
  if (adverbialTags && adverbialTags.length > 2) {
    suggestions.push({
      id: `dial-${Date.now()}-2`,
      description: 'Replace adverbial dialogue tags with actions',
      explanation: 'Instead of "said angrily," show anger through actions and dialogue content.',
      scope: target.scope,
    })
  }
  
  // Check dialogue length
  const dialogues = content.match(/"[^"]+"/g) || []
  const longDialogues = dialogues.filter(d => d.length > 200)
  if (longDialogues.length > 0) {
    suggestions.push({
      id: `dial-${Date.now()}-3`,
      description: 'Break up long speeches',
      explanation: `${longDialogues.length} long dialogue(s) detected. Consider breaking with actions or reactions.`,
      scope: target.scope,
    })
  }
  
  return suggestions
}

/**
 * 4. Improve Pacing
 */
export function improvePacingSuggestions(
  content: string,
  target: RefinementTarget
): AISuggestion[] {
  const suggestions: AISuggestion[] = []
  
  const paragraphs = content.split(/\n\n+/)
  
  // Check for paragraph length variation
  const paragraphLengths = paragraphs.map(p => p.length)
  const avgLength = paragraphLengths.reduce((a, b) => a + b, 0) / paragraphLengths.length
  
  const veryLongParagraphs = paragraphs.filter(p => p.length > avgLength * 2)
  if (veryLongParagraphs.length > 0) {
    suggestions.push({
      id: `pace-${Date.now()}-1`,
      description: 'Break up long paragraphs',
      explanation: `${veryLongParagraphs.length} paragraphs are significantly longer than average. Consider breaking for better flow.`,
      scope: target.scope,
    })
  }
  
  // Check for pacing monotony
  const sentenceLengths = content.match(/[^.!?]+[.!?]+/g)?.map(s => s.length) || []
  if (sentenceLengths.length > 0) {
    const variance = calculateVariance(sentenceLengths)
    if (variance < 50) {
      suggestions.push({
        id: `pace-${Date.now()}-2`,
        description: 'Vary sentence length for rhythm',
        explanation: 'Sentences are too uniform. Mix short punchy sentences with longer flowing ones.',
        scope: target.scope,
      })
    }
  }
  
  return suggestions
}

function calculateVariance(numbers: number[]): number {
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length
  const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2))
  return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length
}

/**
 * 5. Fix Grammar
 */
export function fixGrammarSuggestions(
  content: string,
  target: RefinementTarget
): AISuggestion[] {
  const suggestions: AISuggestion[] = []
  
  // Common grammar checks (simplified)
  const commonIssues = [
    { pattern: /\b(their|there|they're)\b/gi, name: 'their/there/they\'re confusion' },
    { pattern: /\b(your|you're)\b/gi, name: 'your/you\'re confusion' },
    { pattern: /\b(its|it's)\b/gi, name: 'its/it\'s confusion' },
    { pattern: /\s+,/g, name: 'space before comma' },
    { pattern: /\.{3,}/g, name: 'excessive ellipsis' },
  ]
  
  for (const issue of commonIssues) {
    const matches = content.match(issue.pattern)
    if (matches && matches.length > 0) {
      suggestions.push({
        id: `gram-${Date.now()}-${issue.name}`,
        description: `Check ${issue.name}`,
        explanation: `Found ${matches.length} potential instance(s). Review for correctness.`,
        scope: target.scope,
      })
    }
  }
  
  return suggestions
}

/**
 * 6. Match Tone
 */
export function matchToneSuggestions(
  content: string,
  target: RefinementTarget,
  desiredTone: string
): AISuggestion[] {
  const suggestions: AISuggestion[] = []
  
  // Analyze current tone indicators
  const wordCount = content.split(/\s+/).length
  
  // Tone-appropriate suggestions
  const toneAdjustments: Record<string, () => void> = {
    'dark': () => {
      const lightWords = content.match(/\b(happy|joy|bright|laugh|smile)\b/gi)
      if (lightWords && lightWords.length > 3) {
        suggestions.push({
          id: `tone-${Date.now()}-1`,
          description: 'Reduce light/positive language',
          explanation: 'For a dark tone, minimize overtly positive words.',
          scope: target.scope,
        })
      }
    },
    'humorous': () => {
      const seriousWords = content.match(/\b(grave|serious|somber|grim)\b/gi)
      if (seriousWords && seriousWords.length > 3) {
        suggestions.push({
          id: `tone-${Date.now()}-2`,
          description: 'Lighten serious language',
          explanation: 'For humorous tone, reduce overly serious descriptors.',
          scope: target.scope,
        })
      }
    },
    'formal': () => {
      const contractions = content.match(/\b\w+'\w+\b/g)
      if (contractions && contractions.length > 5) {
        suggestions.push({
          id: `tone-${Date.now()}-3`,
          description: 'Eliminate contractions',
          explanation: 'Replace contractions with full forms for formal tone.',
          scope: target.scope,
        })
      }
    },
  }
  
  toneAdjustments[desiredTone]?.()
  
  return suggestions
}

/**
 * 7. Expand/Contract
 */
export function expandContractSuggestions(
  content: string,
  target: RefinementTarget,
  direction: 'expand' | 'contract',
  targetRatio: number = 1.5
): AISuggestion[] {
  const suggestions: AISuggestion[] = []
  const currentLength = content.length
  
  if (direction === 'expand') {
    const targetLength = Math.round(currentLength * targetRatio)
    suggestions.push({
      id: `exp-${Date.now()}-1`,
      description: `Expand content by ~${Math.round((targetRatio - 1) * 100)}%`,
      explanation: `Current: ${currentLength} chars → Target: ~${targetLength} chars. Add sensory details, internal thoughts, or dialogue.`,
      scope: target.scope,
    })
    
    // Identify expansion opportunities
    const shortDescriptions = content.match(/\b(he|she|they)\s+\w+ed\s+\w+\b/gi)
    if (shortDescriptions) {
      suggestions.push({
        id: `exp-${Date.now()}-2`,
        description: 'Expand action descriptions',
        explanation: 'Add sensory details and character reactions to action sequences.',
        scope: target.scope,
      })
    }
  } else {
    const targetLength = Math.round(currentLength / targetRatio)
    suggestions.push({
      id: `con-${Date.now()}-1`,
      description: `Condense content by ~${Math.round((1 - 1/targetRatio) * 100)}%`,
      explanation: `Current: ${currentLength} chars → Target: ~${targetLength} chars. Remove redundancy and tighten prose.`,
      scope: target.scope,
    })
    
    // Identify contraction opportunities
    const redundantPhrases = content.match(/\b(very|really|quite|rather)\s+\w+/gi)
    if (redundantPhrases && redundantPhrases.length > 3) {
      suggestions.push({
        id: `con-${Date.now()}-2`,
        description: 'Remove intensifiers',
        explanation: 'Words like "very," "really" can often be removed or replaced.',
        scope: target.scope,
      })
    }
  }
  
  return suggestions
}

/**
 * Process AI assist request
 */
export function processAIAssist(
  request: AIAssistRequest
): AIAssistResult {
  const startTime = Date.now()
  let suggestions: AISuggestion[] = []
  
  switch (request.type) {
    case 'suggest-improvements':
      suggestions = suggestImprovements(request.content, request.target, request.preferences)
      break
    case 'fix-continuity':
      suggestions = fixContinuitySuggestions(request.content, request.target, request.context)
      break
    case 'enhance-dialogue':
      suggestions = enhanceDialogueSuggestions(request.content, request.target)
      break
    case 'improve-pacing':
      suggestions = improvePacingSuggestions(request.content, request.target)
      break
    case 'fix-grammar':
      suggestions = fixGrammarSuggestions(request.content, request.target)
      break
    case 'match-tone':
      suggestions = matchToneSuggestions(request.content, request.target, request.context || 'dark')
      break
    case 'expand-contract':
      suggestions = expandContractSuggestions(
        request.content, 
        request.target, 
        request.context as 'expand' | 'contract' || 'expand'
      )
      break
  }
  
  return {
    type: request.type,
    suggestions,
    confidence: suggestions.length > 5 ? 'high' : suggestions.length > 0 ? 'medium' : 'low',
    processingTime: Date.now() - startTime,
  }
}
