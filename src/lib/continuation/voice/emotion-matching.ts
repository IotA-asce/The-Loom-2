/**
 * Character emotion matching
 */

import type { VoiceProfile } from './hybrid-capture'

export interface EmotionContext {
  currentEmotion: string
  previousEmotion?: string
  intensity: 'low' | 'medium' | 'high'
  trigger?: string
}

export interface ToneShift {
  indicator: string
  speechPattern: string
  vocabularyLevel: 'simple' | 'normal' | 'complex'
  pacing: 'rushed' | 'normal' | 'deliberate'
}

/**
 * Map emotions to tone shifts
 */
const EMOTION_TONE_MAP: Record<string, ToneShift> = {
  'angry': {
    indicator: 'sharp, clipped sentences',
    speechPattern: 'interrupts, short commands',
    vocabularyLevel: 'simple',
    pacing: 'rushed',
  },
  'sad': {
    indicator: 'pauses, trailing off',
    speechPattern: 'hesitant, incomplete thoughts',
    vocabularyLevel: 'normal',
    pacing: 'deliberate',
  },
  'happy': {
    indicator: 'laughter, exclamations',
    speechPattern: 'enthusiastic, energetic',
    vocabularyLevel: 'normal',
    pacing: 'normal',
  },
  'scared': {
    indicator: 'stammering, breathlessness',
    speechPattern: 'repetitive, disjointed',
    vocabularyLevel: 'simple',
    pacing: 'rushed',
  },
  'confident': {
    indicator: 'assertive declarations',
    speechPattern: 'authoritative, direct',
    vocabularyLevel: 'normal',
    pacing: 'deliberate',
  },
  'nervous': {
    indicator: 'filler words, self-correction',
    speechPattern: 'rambling, defensive',
    vocabularyLevel: 'complex',
    pacing: 'rushed',
  },
  'neutral': {
    indicator: 'steady tone',
    speechPattern: 'balanced, measured',
    vocabularyLevel: 'normal',
    pacing: 'normal',
  },
}

/**
 * Match emotion to tone shift
 */
export function matchEmotionToTone(
  emotion: string,
  intensity: 'low' | 'medium' | 'high' = 'medium'
): ToneShift {
  const normalizedEmotion = emotion.toLowerCase()
  const baseTone = EMOTION_TONE_MAP[normalizedEmotion] || EMOTION_TONE_MAP['neutral']
  
  // Adjust based on intensity
  const adjustedTone: ToneShift = { ...baseTone }
  
  if (intensity === 'high') {
    adjustedTone.pacing = baseTone.pacing === 'rushed' ? 'rushed' : 'rushed'
  } else if (intensity === 'low') {
    adjustedTone.pacing = 'normal'
  }
  
  return adjustedTone
}

/**
 * Generate emotion-aware dialogue
 */
export function generateEmotionAwareDialogue(
  baseText: string,
  emotionContext: EmotionContext,
  voiceProfile: VoiceProfile
): string {
  const tone = matchEmotionToTone(emotionContext.currentEmotion, emotionContext.intensity)
  
  let dialogue = baseText
  
  // Apply tone modifications
  switch (emotionContext.currentEmotion.toLowerCase()) {
    case 'angry':
      dialogue = makeAngry(dialogue)
      break
    case 'sad':
      dialogue = makeSad(dialogue)
      break
    case 'happy':
      dialogue = makeHappy(dialogue)
      break
    case 'scared':
      dialogue = makeScared(dialogue)
      break
    case 'nervous':
      dialogue = makeNervous(dialogue)
      break
  }
  
  // Apply voice profile catchphrases if applicable
  if (voiceProfile.traits.catchphrases.length > 0) {
    // 30% chance to include catchphrase
    if (Math.random() < 0.3 && emotionContext.intensity !== 'high') {
      const catchphrase = voiceProfile.traits.catchphrases[
        Math.floor(Math.random() * voiceProfile.traits.catchphrases.length)
      ]
      dialogue = weaveCatchphrase(dialogue, catchphrase)
    }
  }
  
  return dialogue
}

function makeAngry(text: string): string {
  // Shorten sentences, add emphasis
  return text
    .replace(/\./g, '!')
    .replace(/,/g, '—')
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => {
      if (s.length > 20) {
        return s.split(',').slice(0, 2).join(' ') + '!'
      }
      return s + '!'
    })
    .join(' ')
}

function makeSad(text: string): string {
  // Add pauses, trailing off
  return text
    .replace(/\./g, '...')
    .replace(/,/g, '...')
}

function makeHappy(text: string): string {
  // Add exclamations, energetic
  return text
    .replace(/\.$/g, '!')
    .replace(/,/g, ',')
}

function makeScared(text: string): string {
  // Add stammering, breathlessness
  const words = text.split(' ')
  const stammered: string[] = []
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    stammered.push(word)
    
    // Add occasional stammers
    if (i < words.length - 1 && Math.random() < 0.2) {
      const firstChar = word.charAt(0)
      stammered.push(`${firstChar}-${word}`)
    }
  }
  
  return stammered.join(' ')
}

function makeNervous(text: string): string {
  // Add filler words
  const fillers = ['um', 'uh', 'like', 'you know']
  const words = text.split(' ')
  const withFillers: string[] = []
  
  for (let i = 0; i < words.length; i++) {
    if (i > 0 && i < words.length - 1 && Math.random() < 0.15) {
      withFillers.push(fillers[Math.floor(Math.random() * fillers.length)])
    }
    withFillers.push(words[i])
  }
  
  return withFillers.join(' ')
}

function weaveCatchphrase(text: string, catchphrase: string): string {
  // Try to naturally weave in the catchphrase
  const endings = text.match(/[.!?]+$/)
  if (endings) {
    return text.replace(/[.!?]+$/, ` ${catchphrase}${endings[0]}`)
  }
  return `${text} ${catchphrase}`
}

/**
 * Get emotion transition guidance
 */
export function getEmotionTransitionGuidance(
  from: string,
  to: string
): string {
  if (from === to) {
    return 'Maintain consistent emotional tone'
  }
  
  const transitions: Record<string, Record<string, string>> = {
    'neutral': {
      'angry': 'Shift from calm to tense - shorter responses, clipped speech',
      'happy': 'Shift from even tone to more animated, energetic speech',
      'sad': 'Shift from even tone to slower, softer speech',
    },
    'angry': {
      'neutral': 'Gradually release tension, return to measured responses',
      'sad': 'Anger subsides into hurt, defensive speech becomes withdrawn',
    },
    'happy': {
      'neutral': 'Energy levels out, enthusiasm dampens',
      'sad': 'Joy fades, speech slows and quiets',
    },
    'sad': {
      'neutral': 'Gradual recovery, speech becomes more measured',
      'angry': 'Sadness turns to frustration, then anger',
    },
  }
  
  return transitions[from]?.[to] || `Transition from ${from} to ${to} should feel natural`
}
