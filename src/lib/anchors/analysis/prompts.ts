/**
 * Anchor analysis prompts
 */

import type { AnchorContext } from './context-builder'

export interface AnchorPrompts {
  branchPotential: string
  emotionalImpact: string
}

/**
 * Generate prompts for anchor analysis
 */
export function generateAnchorPrompts(context: AnchorContext): AnchorPrompts {
  const { event, surroundingEvents, involvedCharacters, timelinePosition } = context
  
  const branchPotential = `Analyze this manga event for branching potential:

Event: "${event.description}"
Significance: ${event.significance}
Timeline Position: ${timelinePosition}

Context:
${surroundingEvents.map(e => `- ${e.description} (${e.significance})`).join('\n')}

Characters Involved:
${involvedCharacters.map(c => `- ${c.name} (${c.importance}): ${c.personality || 'No personality info'}`).join('\n')}

Task: Evaluate the branching potential of this event. How could the story diverge?
What alternative paths could characters take? What are the consequences?

Provide your analysis in this JSON format:
{
  "branchPotential": "high|moderate|low",
  "branchingPoints": ["specific moment/decision that could diverge"],
  "alternatives": ["what could happen differently"],
  "consequences": ["downstream effects of each alternative"],
  "confidence": 0.0-1.0
}`

  const emotionalImpact = `Analyze the emotional impact of this event:

Event: "${event.description}"

Characters Involved:
${involvedCharacters.map(c => `- ${c.name}: current emotional state`).join('\n')}

Task: What emotions does this event create? How does it affect character relationships?
What emotional stakes are present for potential branches?

Provide your analysis in this JSON format:
{
  "primaryEmotions": ["emotion1", "emotion2"],
  "emotionalStakes": "description of what's at stake emotionally",
  "readerImpact": "how readers would feel about this moment",
  "relationshipEffects": ["how this affects specific relationships"],
  "confidence": 0.0-1.0
}`

  return { branchPotential, emotionalImpact }
}
