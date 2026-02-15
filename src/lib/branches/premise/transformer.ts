/**
 * Transform alternatives into premises
 */

import type { AlternativeOutcome } from '@/lib/db/schema'
import type { AnchorDetails } from '../context/anchor-details'
import type { CharacterState } from '../context/character-states'

export interface BranchPremise {
  id: string
  title: string
  subtitle?: string
  hook: string
  whatIf: string
  description: string
  themes: string[]
  affectedCharacters: string[]
  immediateConsequences: string[]
  longTermImplications: string[]
}

/**
 * Transform alternative outcome into branch premise
 */
export function transformToPremise(
  alternative: AlternativeOutcome,
  anchor: AnchorDetails,
  characters: CharacterState[]
): BranchPremise {
  const affectedCharacterNames = alternative.affectedCharacters.map(id => {
    const char = characters.find(c => c.id === id)
    return char?.name || id
  })
  
  return {
    id: alternative.id,
    title: generateTitle(alternative, anchor),
    subtitle: generateSubtitle(alternative, anchor),
    hook: generateHook(alternative, anchor),
    whatIf: generateWhatIf(alternative, anchor),
    description: alternative.description,
    themes: inferThemes(alternative, anchor),
    affectedCharacters: affectedCharacterNames,
    immediateConsequences: alternative.consequences.slice(0, 3),
    longTermImplications: generateLongTermImplications(alternative, anchor),
  }
}

function generateTitle(alternative: AlternativeOutcome, anchor: AnchorDetails): string {
  // Create a compelling title based on the alternative
  const prefixes = ['The', 'When', 'If', 'After', 'Beyond']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  
  // Extract key action from description
  const words = alternative.description.split(' ').slice(0, 5)
  const keyPhrase = words.join(' ')
  
  return `${prefix} ${keyPhrase.charAt(0).toUpperCase()}${keyPhrase.slice(1)}`
}

function generateSubtitle(alternative: AlternativeOutcome, anchor: AnchorDetails): string {
  // Create a subtitle that adds intrigue
  const consequences = alternative.consequences
  if (consequences.length > 0) {
    return `Leading to: ${consequences[0]}`
  }
  return `A ${anchor.type} that changes everything`
}

function generateHook(alternative: AlternativeOutcome, anchor: AnchorDetails): string {
  // Create a one-sentence hook
  return `${alternative.description}, setting off a chain of events that will reshape the story.`
}

function generateWhatIf(alternative: AlternativeOutcome, anchor: AnchorDetails): string {
  // Transform description into "what if" format
  const description = alternative.description
  
  // Remove trailing punctuation if present
  const cleanDesc = description.replace(/[.!?]$/, '')
  
  return `What if ${cleanDesc.toLowerCase()}?`
}

function inferThemes(alternative: AlternativeOutcome, anchor: AnchorDetails): string[] {
  const themes: string[] = []
  const description = alternative.description.toLowerCase()
  
  // Map keywords to themes
  const themeKeywords: Record<string, string[]> = {
    'redemption': ['redeem', 'save', 'forgive', 'atonement'],
    'betrayal': ['betray', 'deceive', 'lie', 'traitor'],
    'sacrifice': ['sacrifice', 'give up', 'lose', 'cost'],
    'power': ['power', 'control', 'dominate', 'rule'],
    'love': ['love', 'heart', 'romance', 'feelings'],
    'revenge': ['revenge', 'avenge', 'payback', 'retaliate'],
    'identity': ['identity', 'who', 'become', 'true self'],
    'duty': ['duty', 'responsibility', 'obligation', 'must'],
  }
  
  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some(kw => description.includes(kw))) {
      themes.push(theme)
    }
  }
  
  // Add anchor type as theme
  themes.push(anchor.type)
  
  return [...new Set(themes)].slice(0, 4)
}

function generateLongTermImplications(
  alternative: AlternativeOutcome,
  anchor: AnchorDetails
): string[] {
  const implications: string[] = []
  
  // Generate implications based on consequences
  for (const consequence of alternative.consequences) {
    implications.push(`${consequence} will have lasting effects on the narrative`)
  }
  
  // Add type-specific implications
  const typeImplications: Record<typeof anchor.type, string[]> = {
    decision: ['Character paths diverge permanently', 'New alliances form', 'Old bonds are tested'],
    coincidence: ['Fate takes an unexpected turn', 'New opportunities arise', 'Hidden connections revealed'],
    revelation: ['Trust is fundamentally altered', 'New information reshapes strategies', 'Past events gain new meaning'],
    betrayal: ['Loyalty becomes a rare commodity', 'Vigilance increases', 'Forgiveness becomes central theme'],
    sacrifice: ['The cost of victory is remembered', 'Debt of gratitude creates bonds', 'Loss shapes future decisions'],
    encounter: ['New dynamics enter the story', 'Unexpected partnerships form', 'Rivalries are established'],
    conflict: ['Power structures shift', 'Resources are redistributed', 'New threats emerge'],
    transformation: ['Characters must adapt to new reality', 'Old skills become obsolete', 'New strengths are discovered'],
    mystery: ['The search for truth drives the plot', 'Deception becomes more dangerous', 'Knowledge becomes power'],
  }
  
  implications.push(...typeImplications[anchor.type])
  
  return implications.slice(0, 4)
}
