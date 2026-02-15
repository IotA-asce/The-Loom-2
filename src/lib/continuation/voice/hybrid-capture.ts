/**
 * Hybrid voice capture (examples + rules + profile)
 */

import type { Chapter } from '@/lib/db/schema'
import type { CharacterState } from '@/lib/branches/context/character-states'

export interface VoiceProfile {
  characterId: string
  characterName: string
  source: 'original' | 'user-defined' | 'derived'
  examples: VoiceExample[]
  rules: VoiceRule[]
  traits: VoiceTraits
}

export interface VoiceExample {
  text: string
  context: string
  emotion: string
  source: 'original' | 'generated' | 'user-provided'
}

export interface VoiceRule {
  id: string
  category: 'vocabulary' | 'syntax' | 'speech-pattern' | 'tone'
  description: string
  priority: 'high' | 'medium' | 'low'
}

export interface VoiceTraits {
  formality: 'casual' | 'neutral' | 'formal'
  verbosity: 'concise' | 'moderate' | 'verbose'
  humor: 'none' | 'dry' | 'witty' | 'sarcastic'
  emotionality: 'reserved' | 'balanced' | 'expressive'
  dialect?: string
  catchphrases: string[]
}

/**
 * Capture voice from original manga samples
 */
export function captureVoiceFromSamples(
  character: CharacterState,
  chapters: Chapter[]
): VoiceProfile {
  const examples: VoiceExample[] = []
  const rules: VoiceRule[] = []
  
  // Extract dialogue from chapters
  for (const chapter of chapters) {
    for (const scene of chapter.scenes) {
      if (scene.characters.includes(character.id)) {
        // In real implementation, parse dialogue from scene content
        const extractedDialogue = extractDialogue(scene.summary, character.name)
        
        for (const dialogue of extractedDialogue) {
          examples.push({
            text: dialogue,
            context: scene.summary,
            emotion: scene.emotionalArc,
            source: 'original',
          })
        }
      }
    }
  }
  
  // Derive rules from examples
  const derivedRules = deriveVoiceRules(examples, character)
  rules.push(...derivedRules)
  
  // Derive traits
  const traits = deriveVoiceTraits(examples, character)
  
  return {
    characterId: character.id,
    characterName: character.name,
    source: examples.length > 0 ? 'original' : 'derived',
    examples: examples.slice(0, 10), // Keep top 10 examples
    rules,
    traits,
  }
}

function extractDialogue(sceneSummary: string, characterName: string): string[] {
  // Simplified extraction - would use proper parsing in real impl
  const dialogue: string[] = []
  
  // Look for quoted text
  const matches = sceneSummary.match(/"[^"]*"/g)
  if (matches) {
    dialogue.push(...matches.map(m => m.slice(1, -1)))
  }
  
  return dialogue
}

function deriveVoiceRules(
  examples: VoiceExample[],
  character: CharacterState
): VoiceRule[] {
  const rules: VoiceRule[] = []
  
  // Analyze vocabulary
  const allText = examples.map(e => e.text).join(' ')
  const words = allText.toLowerCase().split(/\s+/)
  
  // Check for formal language
  const formalWords = ['shall', 'indeed', 'certainly', 'perhaps', 'however']
  const hasFormal = formalWords.some(w => words.includes(w))
  
  rules.push({
    id: 'formality',
    category: 'tone',
    description: hasFormal ? 'Uses formal language' : 'Uses casual language',
    priority: 'medium',
  })
  
  // Check sentence length
  const avgLength = words.length / Math.max(1, examples.length)
  rules.push({
    id: 'verbosity',
    category: 'syntax',
    description: avgLength > 15 ? 'Speaks in longer sentences' : 'Speaks concisely',
    priority: 'medium',
  })
  
  // Add personality-based rule
  if (character.personality) {
    const personality = character.personality.toLowerCase()
    if (personality.includes('confident') || personality.includes('proud')) {
      rules.push({
        id: 'confidence',
        category: 'speech-pattern',
        description: 'Speaks with confidence and authority',
        priority: 'high',
      })
    }
  }
  
  return rules
}

function deriveVoiceTraits(
  examples: VoiceExample[],
  character: CharacterState
): VoiceTraits {
  // Default traits
  const traits: VoiceTraits = {
    formality: 'neutral',
    verbosity: 'moderate',
    humor: 'none',
    emotionality: 'balanced',
    catchphrases: [],
  }
  
  // Analyze formality
  const allText = examples.map(e => e.text).join(' ')
  if (allText.includes('sir') || allText.includes('madam') || allText.includes('please')) {
    traits.formality = 'formal'
  } else if (allText.includes('hey') || allText.includes('yeah') || allText.includes('gonna')) {
    traits.formality = 'casual'
  }
  
  // Check for catchphrases (repeated phrases)
  const catchphrases = findCatchphrases(examples)
  traits.catchphrases = catchphrases
  
  return traits
}

function findCatchphrases(examples: VoiceExample[]): string[] {
  const phraseCounts = new Map<string, number>()
  
  for (const example of examples) {
    const phrases = example.text.match(/\b\w+\s+\w+\b/g) || []
    for (const phrase of phrases) {
      phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1)
    }
  }
  
  // Return phrases that appear multiple times
  return [...phraseCounts.entries()]
    .filter(([_, count]) => count >= 2)
    .map(([phrase, _]) => phrase)
    .slice(0, 3)
}

/**
 * Create user-defined voice
 */
export function createUserDefinedVoice(
  characterId: string,
  characterName: string,
  traits: Partial<VoiceTraits>,
  examples: string[]
): VoiceProfile {
  return {
    characterId,
    characterName,
    source: 'user-defined',
    examples: examples.map((text, i) => ({
      text,
      context: 'User-provided example',
      emotion: 'neutral',
      source: 'user-provided',
    })),
    rules: [
      {
        id: 'user-defined',
        category: 'tone',
        description: 'Follow user-defined voice characteristics',
        priority: 'high',
      },
    ],
    traits: {
      formality: 'neutral',
      verbosity: 'moderate',
      humor: 'none',
      emotionality: 'balanced',
      catchphrases: [],
      ...traits,
    },
  }
}

/**
 * Merge voice profiles
 */
export function mergeVoiceProfiles(
  original: VoiceProfile,
  userOverride: Partial<VoiceProfile>
): VoiceProfile {
  return {
    ...original,
    ...userOverride,
    traits: {
      ...original.traits,
      ...userOverride.traits,
    },
    rules: [
      ...original.rules,
      ...(userOverride.rules || []),
    ],
    examples: [
      ...original.examples,
      ...(userOverride.examples || []),
    ],
  }
}

/**
 * Format voice profile for prompt
 */
export function formatVoiceForPrompt(profile: VoiceProfile): string {
  const parts: string[] = []
  
  parts.push(`## Voice: ${profile.characterName}`)
  parts.push('')
  
  // Traits
  parts.push(`Formality: ${profile.traits.formality}`)
  parts.push(`Verbosity: ${profile.traits.verbosity}`)
  parts.push(`Humor: ${profile.traits.humor}`)
  parts.push(`Emotionality: ${profile.traits.emotionality}`)
  
  if (profile.traits.catchphrases.length > 0) {
    parts.push(`Catchphrases: "${profile.traits.catchphrases.join('", "')}"`)
  }
  
  parts.push('')
  
  // Rules
  parts.push('### Voice Rules')
  for (const rule of profile.rules) {
    parts.push(`- ${rule.description} (${rule.priority})`)
  }
  
  // Examples
  if (profile.examples.length > 0) {
    parts.push('')
    parts.push('### Examples')
    for (const example of profile.examples.slice(0, 3)) {
      parts.push(`"${example.text}"`)
    }
  }
  
  return parts.join('\n')
}
