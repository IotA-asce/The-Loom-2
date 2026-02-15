/**
 * Style guide enforcement and prose style matching
 */

import type { Manga } from '@/lib/db/schema'
import type { NarrativeStyleProfile } from '@/lib/branches/context/style-profile'

export interface StyleGuide {
  tone: string
  pacing: string
  dialogueRatio: 'sparse' | 'balanced' | 'heavy'
  descriptionLevel: 'minimal' | 'moderate' | 'rich'
  internalMonologue: 'rare' | 'occasional' | 'frequent'
  paragraphLength: 'short' | 'medium' | 'long'
  sentenceComplexity: 'simple' | 'moderate' | 'complex'
  customRules: StyleRule[]
}

export interface StyleRule {
  id: string
  description: string
  check: (text: string) => boolean
  fix: (text: string) => string
  severity: 'error' | 'warning' | 'suggestion'
}

/**
 * Create style guide from manga metadata
 */
export function createStyleGuide(
  manga: Manga,
  styleProfile: NarrativeStyleProfile
): StyleGuide {
  return {
    tone: styleProfile.tone.primary,
    pacing: styleProfile.pacing.speed,
    dialogueRatio: mapDialogueFrequency(styleProfile.dialogue.frequency),
    descriptionLevel: mapDescriptionLevel(styleProfile.emotionalApproach.expression),
    internalMonologue: styleProfile.dialogue.internalMonologue,
    paragraphLength: mapParagraphLength(styleProfile.pacing.speed),
    sentenceComplexity: mapComplexity(styleProfile.genreConventions.primaryGenre),
    customRules: generateCustomRules(styleProfile),
  }
}

function mapDialogueFrequency(freq: NarrativeStyleProfile['dialogue']['frequency']): StyleGuide['dialogueRatio'] {
  const map: Record<typeof freq, StyleGuide['dialogueRatio']> = {
    sparse: 'sparse',
    moderate: 'balanced',
    heavy: 'heavy',
  }
  return map[freq]
}

function mapDescriptionLevel(expression: NarrativeStyleProfile['emotionalApproach']['expression']): StyleGuide['descriptionLevel'] {
  const map: Record<typeof expression, StyleGuide['descriptionLevel']> = {
    'show-dont-tell': 'rich',
    direct: 'minimal',
    mixed: 'moderate',
  }
  return map[expression]
}

function mapParagraphLength(pacing: NarrativeStyleProfile['pacing']['speed']): StyleGuide['paragraphLength'] {
  const map: Record<typeof pacing, StyleGuide['paragraphLength']> = {
    fast: 'short',
    moderate: 'medium',
    slow: 'long',
  }
  return map[pacing]
}

function mapComplexity(genre: string): StyleGuide['sentenceComplexity'] {
  if (genre.includes('Literary') || genre.includes('Drama')) return 'complex'
  if (genre.includes('Action') || genre.includes('Comedy')) return 'simple'
  return 'moderate'
}

function generateCustomRules(styleProfile: NarrativeStyleProfile): StyleRule[] {
  const rules: StyleRule[] = []
  
  // Add tone-appropriate rules
  if (styleProfile.tone.primary === 'dark') {
    rules.push({
      id: 'dark-tone',
      description: 'Maintain somber, serious tone',
      check: (text) => !text.includes('happy') && !text.includes('joyful'),
      fix: (text) => text,
      severity: 'suggestion',
    })
  }
  
  return rules
}

/**
 * Enforce style guide on content
 */
export function enforceStyleGuide(
  content: string,
  guide: StyleGuide
): { content: string; violations: StyleViolation[] } {
  const violations: StyleViolation[] = []
  let enforced = content
  
  // Check dialogue ratio
  const dialogueRatio = calculateDialogueRatio(enforced)
  const targetRatio = getTargetDialogueRatio(guide.dialogueRatio)
  
  if (Math.abs(dialogueRatio - targetRatio) > 0.1) {
    violations.push({
      rule: 'dialogue-ratio',
      message: `Dialogue ratio ${(dialogueRatio * 100).toFixed(0)}% vs target ${(targetRatio * 100).toFixed(0)}%`,
      severity: 'warning',
    })
  }
  
  // Check paragraph length
  const avgParagraphLength = calculateAvgParagraphLength(enforced)
  const targetLength = getTargetParagraphLength(guide.paragraphLength)
  
  if (avgParagraphLength > targetLength * 1.5) {
    violations.push({
      rule: 'paragraph-length',
      message: `Paragraphs too long (${avgParagraphLength.toFixed(0)} words avg)`,
      severity: 'suggestion',
    })
  }
  
  // Apply custom rules
  for (const rule of guide.customRules) {
    if (!rule.check(enforced)) {
      violations.push({
        rule: rule.id,
        message: rule.description,
        severity: rule.severity,
      })
      enforced = rule.fix(enforced)
    }
  }
  
  return { content: enforced, violations }
}

interface StyleViolation {
  rule: string
  message: string
  severity: 'error' | 'warning' | 'suggestion'
}

function calculateDialogueRatio(text: string): number {
  const dialogueMatches = text.match(/"[^"]*"/g) || []
  const dialogueWords = dialogueMatches.join(' ').split(/\s+/).length
  const totalWords = text.split(/\s+/).length
  return totalWords > 0 ? dialogueWords / totalWords : 0
}

function getTargetDialogueRatio(ratio: StyleGuide['dialogueRatio']): number {
  const map: Record<typeof ratio, number> = {
    sparse: 0.15,
    balanced: 0.3,
    heavy: 0.5,
  }
  return map[ratio]
}

function calculateAvgParagraphLength(text: string): number {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)
  if (paragraphs.length === 0) return 0
  
  const totalWords = paragraphs.reduce((sum, p) => sum + p.split(/\s+/).length, 0)
  return totalWords / paragraphs.length
}

function getTargetParagraphLength(length: StyleGuide['paragraphLength']): number {
  const map: Record<typeof length, number> = {
    short: 50,
    medium: 100,
    long: 150,
  }
  return map[length]
}

/**
 * Format style guide for display
 */
export function formatStyleGuide(guide: StyleGuide): string {
  const parts: string[] = []
  
  parts.push('# Style Guide')
  parts.push('')
  parts.push(`**Tone:** ${guide.tone}`)
  parts.push(`**Pacing:** ${guide.pacing}`)
  parts.push(`**Dialogue:** ${guide.dialogueRatio}`)
  parts.push(`**Description:** ${guide.descriptionLevel}`)
  parts.push(`**Internal Monologue:** ${guide.internalMonologue}`)
  parts.push(`**Paragraph Length:** ${guide.paragraphLength}`)
  parts.push(`**Sentence Complexity:** ${guide.sentenceComplexity}`)
  parts.push('')
  
  if (guide.customRules.length > 0) {
    parts.push('## Custom Rules')
    for (const rule of guide.customRules) {
      parts.push(`- ${rule.description}`)
    }
  }
  
  return parts.join('\n')
}
