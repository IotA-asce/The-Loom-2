/**
 * Voice consistency checking
 */

import type { VoiceProfile, VoiceExample, VoiceRule } from './hybrid-capture'

export interface ConsistencyIssue {
  type: 'vocabulary' | 'syntax' | 'tone' | 'catchphrase' | 'personality'
  severity: 'minor' | 'major' | 'critical'
  description: string
  location: string
  suggestion: string
}

export interface ConsistencyReport {
  isConsistent: boolean
  issues: ConsistencyIssue[]
  score: number // 0-100
  details: {
    vocabularyMatch: number
    syntaxMatch: number
    toneMatch: number
    catchphraseUsage: number
  }
}

/**
 * Check voice consistency
 */
export function checkVoiceConsistency(
  text: string,
  profile: VoiceProfile,
  context?: { characterId: string; scene?: string }
): ConsistencyReport {
  const issues: ConsistencyIssue[] = []
  
  // Check vocabulary
  const vocabIssues = checkVocabulary(text, profile)
  issues.push(...vocabIssues)
  
  // Check syntax
  const syntaxIssues = checkSyntax(text, profile)
  issues.push(...syntaxIssues)
  
  // Check tone
  const toneIssues = checkTone(text, profile)
  issues.push(...toneIssues)
  
  // Check catchphrase usage
  const catchphraseIssues = checkCatchphraseUsage(text, profile)
  issues.push(...catchphraseIssues)
  
  // Calculate scores
  const scores = calculateScores(text, profile, issues)
  
  return {
    isConsistent: issues.filter(i => i.severity === 'critical').length === 0,
    issues,
    score: scores.overall,
    details: {
      vocabularyMatch: scores.vocabulary,
      syntaxMatch: scores.syntax,
      toneMatch: scores.tone,
      catchphraseUsage: scores.catchphrase,
    },
  }
}

function checkVocabulary(text: string, profile: VoiceProfile): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = []
  
  // Check for words that don't match formality
  const words = text.toLowerCase().split(/\s+/)
  
  if (profile.traits.formality === 'formal') {
    const informalWords = ['gonna', 'wanna', 'yeah', 'nah', 'dunno', 'gotta']
    const foundInformal = words.filter(w => informalWords.includes(w))
    
    if (foundInformal.length > 0) {
      issues.push({
        type: 'vocabulary',
        severity: 'minor',
        description: `Informal words used: ${foundInformal.join(', ')}`,
        location: 'vocabulary',
        suggestion: `Replace with formal alternatives`,
      })
    }
  }
  
  if (profile.traits.formality === 'casual') {
    const overlyFormal = ['shall', 'indeed', 'certainly', 'whom', 'whilst']
    const foundFormal = words.filter(w => overlyFormal.includes(w))
    
    if (foundFormal.length > 2) {
      issues.push({
        type: 'vocabulary',
        severity: 'minor',
        description: 'Overly formal for casual character',
        location: 'vocabulary',
        suggestion: 'Use simpler, more casual language',
      })
    }
  }
  
  return issues
}

function checkSyntax(text: string, profile: VoiceProfile): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = []
  
  // Check sentence length
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const avgLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length
  
  if (profile.traits.verbosity === 'concise' && avgLength > 15) {
    issues.push({
      type: 'syntax',
      severity: 'minor',
      description: `Sentences too long for concise character (avg: ${avgLength.toFixed(1)} words)`,
      location: 'syntax',
      suggestion: 'Break into shorter sentences',
    })
  }
  
  if (profile.traits.verbosity === 'verbose' && avgLength < 8) {
    issues.push({
      type: 'syntax',
      severity: 'minor',
      description: 'Sentences too short for verbose character',
      location: 'syntax',
      suggestion: 'Elaborate more, use complex sentences',
    })
  }
  
  return issues
}

function checkTone(text: string, profile: VoiceProfile): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = []
  
  // Check humor consistency
  if (profile.traits.humor === 'none') {
    const humorIndicators = ['haha', 'lol', 'joke', 'funny', 'hilarious']
    const hasHumor = humorIndicators.some(h => text.toLowerCase().includes(h))
    
    if (hasHumor) {
      issues.push({
        type: 'tone',
        severity: 'major',
        description: 'Character making jokes despite no humor trait',
        location: 'tone',
        suggestion: 'Remove humor, keep serious tone',
      })
    }
  }
  
  // Check emotionality
  if (profile.traits.emotionality === 'reserved') {
    const emotionalWords = ['love', 'hate', 'furious', 'ecstatic', 'devastated']
    const foundEmotional = emotionalWords.filter(w => text.toLowerCase().includes(w))
    
    if (foundEmotional.length > 0) {
      issues.push({
        type: 'tone',
        severity: 'major',
        description: `Too emotional for reserved character: ${foundEmotional.join(', ')}`,
        location: 'tone',
        suggestion: 'Use more restrained language',
      })
    }
  }
  
  return issues
}

function checkCatchphraseUsage(text: string, profile: VoiceProfile): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = []
  
  if (profile.traits.catchphrases.length === 0) {
    return issues
  }
  
  // Check for catchphrase usage
  let catchphraseUsed = false
  for (const cp of profile.traits.catchphrases) {
    if (text.toLowerCase().includes(cp.toLowerCase())) {
      catchphraseUsed = true
      break
    }
  }
  
  // Characters with catchphrases should use them occasionally
  // But not too often (this is a simplified check)
  if (!catchphraseUsed && text.length > 200) {
    issues.push({
      type: 'catchphrase',
      severity: 'minor',
      description: 'Missed opportunity to use catchphrase',
      location: 'catchphrase',
      suggestion: `Consider using one of: ${profile.traits.catchphrases.join(', ')}`,
    })
  }
  
  return issues
}

function calculateScores(
  text: string,
  profile: VoiceProfile,
  issues: ConsistencyIssue[]
): { overall: number; vocabulary: number; syntax: number; tone: number; catchphrase: number } {
  // Base scores
  let vocabulary = 100
  let syntax = 100
  let tone = 100
  let catchphrase = 100
  
  // Deduct for issues
  for (const issue of issues) {
    const deduction = issue.severity === 'critical' ? 30 : issue.severity === 'major' ? 15 : 5
    
    switch (issue.type) {
      case 'vocabulary':
        vocabulary -= deduction
        break
      case 'syntax':
        syntax -= deduction
        break
      case 'tone':
      case 'personality':
        tone -= deduction
        break
      case 'catchphrase':
        catchphrase -= deduction
        break
    }
  }
  
  // Clamp scores
  vocabulary = Math.max(0, vocabulary)
  syntax = Math.max(0, syntax)
  tone = Math.max(0, tone)
  catchphrase = Math.max(0, catchphrase)
  
  // Calculate overall
  const overall = Math.round((vocabulary + syntax + tone + catchphrase) / 4)
  
  return { overall, vocabulary, syntax, tone, catchphrase }
}

/**
 * Generate voice prompt with consistency rules
 */
export function generateVoicePrompt(
  profile: VoiceProfile,
  sceneContext: string,
  emotion?: string
): string {
  const parts: string[] = []
  
  parts.push(formatVoiceProfile(profile))
  parts.push('')
  parts.push('### Scene Context')
  parts.push(sceneContext)
  
  if (emotion) {
    parts.push('')
    parts.push('### Current Emotion')
    parts.push(emotion)
  }
  
  parts.push('')
  parts.push('### Consistency Requirements')
  parts.push('- Match the character\'s established vocabulary level')
  parts.push('- Use sentence structure matching their verbosity')
  parts.push('- Maintain consistent emotional expression')
  parts.push('- Include catchphrases naturally when appropriate')
  
  return parts.join('\n')
}

function formatVoiceProfile(profile: VoiceProfile): string {
  const parts: string[] = []
  
  parts.push(`## Character: ${profile.characterName}`)
  parts.push('')
  parts.push('### Traits')
  parts.push(`- Formality: ${profile.traits.formality}`)
  parts.push(`- Verbosity: ${profile.traits.verbosity}`)
  parts.push(`- Humor: ${profile.traits.humor}`)
  parts.push(`- Emotionality: ${profile.traits.emotionality}`)
  
  if (profile.traits.catchphrases.length > 0) {
    parts.push(`- Catchphrases: "${profile.traits.catchphrases.join('", "')}"`)
  }
  
  if (profile.examples.length > 0) {
    parts.push('')
    parts.push('### Voice Examples')
    for (const ex of profile.examples.slice(0, 3)) {
      parts.push(`"${ex.text}"`)
    }
  }
  
  return parts.join('\n')
}

/**
 * Batch check consistency for multiple dialogues
 */
export function batchCheckConsistency(
  dialogues: Array<{ text: string; characterId: string }>,
  profiles: Map<string, VoiceProfile>
): Map<string, ConsistencyReport> {
  const results = new Map<string, ConsistencyReport>()
  
  for (const dialogue of dialogues) {
    const profile = profiles.get(dialogue.characterId)
    if (profile) {
      const report = checkVoiceConsistency(dialogue.text, profile, {
        characterId: dialogue.characterId,
      })
      results.set(dialogue.characterId, report)
    }
  }
  
  return results
}
