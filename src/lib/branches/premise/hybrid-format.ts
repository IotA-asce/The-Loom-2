/**
 * Hybrid format for premise presentation (hook + subtitle)
 */

import type { BranchPremise } from './transformer'

export interface HybridPremiseFormat {
  // Primary hook - grabs attention
  hook: {
    text: string
    type: 'dramatic' | 'intriguing' | 'emotional' | 'suspenseful'
  }
  
  // Subtitle - provides context
  subtitle: {
    text: string
    emphasis: 'consequence' | 'character' | 'theme' | 'mystery'
  }
  
  // Full display format
  display: {
    short: string // Just hook
    medium: string // Hook + subtitle
    full: string // Complete premise
  }
  
  // For UI presentation
  ui: {
    title: string
    tagline: string
    preview: string
  }
}

/**
 * Format premise in hybrid (hook + subtitle) format
 */
export function formatHybridPremise(premise: BranchPremise): HybridPremiseFormat {
  const hook = createHook(premise)
  const subtitle = createSubtitle(premise)
  
  return {
    hook,
    subtitle,
    display: {
      short: hook.text,
      medium: `${hook.text} ${subtitle.text}`,
      full: createFullPremise(premise, hook, subtitle),
    },
    ui: {
      title: premise.title,
      tagline: subtitle.text,
      preview: createPreview(premise),
    },
  }
}

function createHook(premise: BranchPremise): HybridPremiseFormat['hook'] {
  const whatIf = premise.whatIf
  
  // Determine hook type based on content
  let type: HybridPremiseFormat['hook']['type'] = 'intriguing'
  const lowerWhatIf = whatIf.toLowerCase()
  
  if (lowerWhatIf.includes('die') || lowerWhatIf.includes('kill') || lowerWhatIf.includes('death')) {
    type = 'dramatic'
  } else if (lowerWhatIf.includes('love') || lowerWhatIf.includes('heart') || lowerWhatIf.includes('feel')) {
    type = 'emotional'
  } else if (lowerWhatIf.includes('secret') || lowerWhatIf.includes('truth') || lowerWhatIf.includes('discover')) {
    type = 'suspenseful'
  }
  
  return { text: whatIf, type }
}

function createSubtitle(premise: BranchPremise): HybridPremiseFormat['subtitle'] {
  const consequences = premise.immediateConsequences
  const themes = premise.themes
  const characters = premise.affectedCharacters
  
  // Determine emphasis and create subtitle
  let emphasis: HybridPremiseFormat['subtitle']['emphasis'] = 'consequence'
  let text = ''
  
  if (consequences.length > 0 && consequences[0].length < 80) {
    emphasis = 'consequence'
    text = `Leading to: ${consequences[0]}`
  } else if (characters.length > 0) {
    emphasis = 'character'
    const charList = characters.slice(0, 2).join(' and ')
    text = `Transforming the journey of ${charList}`
  } else if (themes.length > 0) {
    emphasis = 'theme'
    text = `A story of ${themes.slice(0, 2).join(' and ')}`
  } else {
    emphasis = 'mystery'
    text = 'Where nothing will be the same'
  }
  
  return { text, emphasis }
}

function createFullPremise(
  premise: BranchPremise,
  hook: HybridPremiseFormat['hook'],
  subtitle: HybridPremiseFormat['subtitle']
): string {
  const parts: string[] = []
  
  parts.push(hook.text)
  parts.push('')
  parts.push(subtitle.text)
  parts.push('')
  parts.push(premise.description)
  
  if (premise.immediateConsequences.length > 0) {
    parts.push('')
    parts.push('Immediate consequences:')
    for (const consequence of premise.immediateConsequences) {
      parts.push(`• ${consequence}`)
    }
  }
  
  if (premise.themes.length > 0) {
    parts.push('')
    parts.push(`Themes: ${premise.themes.join(', ')}`)
  }
  
  return parts.join('\n')
}

function createPreview(premise: BranchPremise): string {
  // Create a 2-3 sentence preview
  const sentences: string[] = []
  
  sentences.push(premise.whatIf)
  
  if (premise.immediateConsequences.length > 0) {
    sentences.push(`This leads to ${premise.immediateConsequences[0].toLowerCase()}.`)
  }
  
  if (premise.affectedCharacters.length > 0) {
    const chars = premise.affectedCharacters.slice(0, 2).join(' and ')
    sentences.push(`${chars} must navigate the fallout.`)
  }
  
  return sentences.join(' ')
}

/**
 * Compare two hybrid formats for similarity
 */
export function compareHybridFormats(
  format1: HybridPremiseFormat,
  format2: HybridPremiseFormat
): number {
  let similarity = 0
  
  // Compare hook types
  if (format1.hook.type === format2.hook.type) {
    similarity += 0.2
  }
  
  // Compare subtitle emphasis
  if (format1.subtitle.emphasis === format2.subtitle.emphasis) {
    similarity += 0.2
  }
  
  // Compare hook text (simple word overlap)
  const words1 = new Set(format1.hook.text.toLowerCase().split(' '))
  const words2 = new Set(format2.hook.text.toLowerCase().split(' '))
  const intersection = new Set([...words1].filter(w => words2.has(w)))
  const union = new Set([...words1, ...words2])
  similarity += (intersection.size / union.size) * 0.6
  
  return similarity
}
