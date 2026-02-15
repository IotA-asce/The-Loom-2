/**
 * Character relationship influence on speech
 */

import type { CharacterRelationship } from '@/lib/branches/context/relationships'

export interface RelationshipContext {
  targetCharacterId: string
  targetCharacterName: string
  relationshipType: string
  relationshipLevel: 'hostile' | 'cold' | 'neutral' | 'warm' | 'intimate'
  history: string[] // Significant interactions
}

/**
 * Relationship modifiers for speech
 */
interface RelationshipModifier {
  formalityShift: number // -2 to +2
  openness: number // 0 to 1 (how much they reveal)
  warmth: number // -1 to 1 (cold to warm)
  respect: number // -1 to 1 (disrespect to high respect)
}

const RELATIONSHIP_MODIFIERS: Record<string, RelationshipModifier> = {
  'hostile': {
    formalityShift: -1,
    openness: 0.1,
    warmth: -0.8,
    respect: -0.7,
  },
  'cold': {
    formalityShift: 1,
    openness: 0.2,
    warmth: -0.4,
    respect: 0,
  },
  'neutral': {
    formalityShift: 0,
    openness: 0.5,
    warmth: 0,
    respect: 0.2,
  },
  'warm': {
    formalityShift: -1,
    openness: 0.7,
    warmth: 0.6,
    respect: 0.4,
  },
  'intimate': {
    formalityShift: -2,
    openness: 0.9,
    warmth: 0.9,
    respect: 0.3,
  },
}

/**
 * Get speech guidance based on relationship
 */
export function getRelationshipSpeechGuidance(
  context: RelationshipContext
): string {
  const modifier = RELATIONSHIP_MODIFIERS[context.relationshipLevel]
  const guidance: string[] = []
  
  guidance.push(`## Speaking to ${context.targetCharacterName}`)
  guidance.push(`Relationship: ${context.relationshipType} (${context.relationshipLevel})`)
  guidance.push('')
  
  // Formality
  if (modifier.formalityShift > 0) {
    guidance.push('- Use more formal language and honorifics')
  } else if (modifier.formalityShift < 0) {
    guidance.push('- Use casual language, skip formalities')
  }
  
  // Warmth
  if (modifier.warmth > 0.5) {
    guidance.push('- Speak warmly, use affectionate terms if appropriate')
  } else if (modifier.warmth < -0.5) {
    guidance.push('- Speak coldly, keep responses minimal')
  }
  
  // Openness
  if (modifier.openness < 0.3) {
    guidance.push('- Be guarded, reveal minimal information')
  } else if (modifier.openness > 0.7) {
    guidance.push('- Speak openly, share thoughts freely')
  }
  
  // Respect
  if (modifier.respect > 0.5) {
    guidance.push('- Show deference and respect')
  } else if (modifier.respect < -0.3) {
    guidance.push('- Challenge or dismiss their points')
  }
  
  // History references
  if (context.history.length > 0) {
    guidance.push('')
    guidance.push('### Shared History')
    for (const event of context.history.slice(-3)) {
      guidance.push(`- Reference: "${event}"`)
    }
  }
  
  return guidance.join('\n')
}

/**
 * Apply relationship tone to dialogue
 */
export function applyRelationshipTone(
  baseDialogue: string,
  context: RelationshipContext
): string {
  const modifier = RELATIONSHIP_MODIFIERS[context.relationshipLevel]
  let dialogue = baseDialogue
  
  // Apply warmth
  if (modifier.warmth > 0.5 && !dialogue.match(/dear|friend|pal/)) {
    dialogue = addWarmth(dialogue)
  } else if (modifier.warmth < -0.5) {
    dialogue = makeCold(dialogue)
  }
  
  // Apply guardedness
  if (modifier.openness < 0.3) {
    dialogue = makeGuarded(dialogue)
  }
  
  return dialogue
}

function addWarmth(text: string): string {
  const warmStarters = ['Hey, ', 'Listen, ', 'You know, ']
  const starter = warmStarters[Math.floor(Math.random() * warmStarters.length)]
  
  if (!text.match(/^(Hey|Listen|You know)/)) {
    return starter + text.charAt(0).toLowerCase() + text.slice(1)
  }
  return text
}

function makeCold(text: string): string {
  // Remove warmth indicators
  return text
    .replace(/\b(hey|hi|hello|thanks|please)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function makeGuarded(text: string): string {
  // Add hedging
  const hedges = ['I suppose ', 'Perhaps ', 'Maybe ']
  const hedge = hedges[Math.floor(Math.random() * hedges.length)]
  
  if (!text.match(/^(I suppose|Perhaps|Maybe)/)) {
    return hedge + text.charAt(0).toLowerCase() + text.slice(1)
  }
  return text
}

/**
 * Convert relationship to context
 */
export function relationshipToContext(
  relationship: CharacterRelationship,
  targetName: string
): RelationshipContext {
  let level: RelationshipContext['relationshipLevel'] = 'neutral'
  
  // Map tension/affinity to relationship level
  if (relationship.affinity > 70) {
    level = 'intimate'
  } else if (relationship.affinity > 40) {
    level = 'warm'
  } else if (relationship.affinity < -70) {
    level = 'hostile'
  } else if (relationship.affinity < -30) {
    level = 'cold'
  }
  
  return {
    targetCharacterId: relationship.targetCharacterId,
    targetCharacterName: targetName,
    relationshipType: relationship.type,
    relationshipLevel: level,
    history: relationship.sharedEvents.slice(-5),
  }
}
