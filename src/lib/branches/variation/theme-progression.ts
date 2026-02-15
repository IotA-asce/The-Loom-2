/**
 * Theme progression implementation
 */

import type { BranchVariation } from './generator'
import type { ContextPackage } from '../context/adaptive-selector'

export interface ThemeProgressionStage {
  stage: 'introduction' | 'development' | 'climax' | 'resolution'
  theme: string
  expression: string
  events: string[]
  characterImpact: Record<string, string>
}

export interface ThemeProgression {
  theme: string
  startingExpression: string
  stages: ThemeProgressionStage[]
  endingExpression: string
  arc: 'ascending' | 'descending' | 'cyclical' | 'linear'
}

/**
 * Implement theme progression for branches
 */
export function implementThemeProgression(
  variation: BranchVariation,
  context: ContextPackage
): ThemeProgression[] {
  return variation.themeProgression.map(theme => 
    createThemeProgression(theme, variation, context)
  )
}

function createThemeProgression(
  themeName: string,
  variation: BranchVariation,
  context: ContextPackage
): ThemeProgression {
  const worldTheme = context.world.themes.find(t => t.name === themeName)
  
  return {
    theme: themeName,
    startingExpression: worldTheme?.currentExpression || `Introduction of ${themeName}`,
    stages: [
      createStage('introduction', themeName, variation),
      createStage('development', themeName, variation),
      createStage('climax', themeName, variation),
      createStage('resolution', themeName, variation),
    ],
    endingExpression: generateEndingExpression(themeName, variation),
    arc: determineArc(themeName, variation),
  }
}

function createStage(
  stage: ThemeProgressionStage['stage'],
  theme: string,
  variation: BranchVariation
): ThemeProgressionStage {
  const expressions: Record<typeof stage, string[]> = {
    introduction: [
      `The theme of ${theme} is introduced subtly`,
      `${theme} emerges as a background concern`,
      `Early hints of ${theme} appear`,
    ],
    development: [
      `${theme} deepens through character choices`,
      `The complexity of ${theme} is revealed`,
      `${theme} creates tension and conflict`,
    ],
    climax: [
      `${theme} reaches its most intense expression`,
      `The core of ${theme} is tested`,
      `${theme} drives the pivotal moment`,
    ],
    resolution: [
      `${theme} finds its ultimate expression`,
      `The meaning of ${theme} becomes clear`,
      `${theme} resolves or transforms`,
    ],
  }
  
  const expression = expressions[stage][Math.floor(Math.random() * expressions[stage].length)]
  
  return {
    stage,
    theme,
    expression,
    events: generateStageEvents(stage, theme, variation),
    characterImpact: generateCharacterImpact(stage, theme, variation),
  }
}

function generateStageEvents(
  stage: ThemeProgressionStage['stage'],
  theme: string,
  variation: BranchVariation
): string[] {
  const events: string[] = []
  
  switch (stage) {
    case 'introduction':
      events.push(`First hint of ${theme} appears`)
      events.push(`Characters encounter ${theme} indirectly`)
      break
    case 'development':
      events.push(`${theme} creates complications`)
      events.push(`Characters must confront ${theme}`)
      events.push(`The stakes related to ${theme} escalate`)
      break
    case 'climax':
      events.push(`${theme} drives the major confrontation`)
      events.push(`The true nature of ${theme} is revealed`)
      break
    case 'resolution':
      events.push(`${theme} reaches its conclusion`)
      events.push(`Final statement on ${theme}`)
      break
  }
  
  return events
}

function generateCharacterImpact(
  stage: ThemeProgressionStage['stage'],
  theme: string,
  variation: BranchVariation
): Record<string, string> {
  const impact: Record<string, string> = {}
  
  for (const arc of variation.characterArcs) {
    const impacts: Record<typeof stage, string[]> = {
      introduction: [
        `First awareness of ${theme}`,
        `Subtle influence of ${theme}`,
        `Unconscious reaction to ${theme}`,
      ],
      development: [
        `Growing engagement with ${theme}`,
        `Personal stake in ${theme} emerges`,
        `${theme} challenges their beliefs`,
      ],
      climax: [
        `Defining moment for ${theme}`,
        `Must choose regarding ${theme}`,
        `${theme} tests their core`,
      ],
      resolution: [
        `Final relationship to ${theme} established`,
        `Learned from ${theme}`,
        `${theme} becomes part of their story`,
      ],
    }
    
    const possibleImpacts = impacts[stage]
    impact[arc.characterId] = possibleImpacts[Math.floor(Math.random() * possibleImpacts.length)]
  }
  
  return impact
}

function generateEndingExpression(
  theme: string,
  variation: BranchVariation
): string {
  const expressions: Record<BranchVariation['mood'], string[]> = {
    hopeful: [
      `${theme} triumphs, bringing positive change`,
      `The meaning of ${theme} is fulfilled`,
      `${theme} leads to growth and understanding`,
    ],
    tragic: [
      `${theme} ends in loss and sorrow`,
      `The cost of ${theme} proves too high`,
      `${theme} reveals harsh truths`,
    ],
    mixed: [
      `${theme} resolves with both gain and loss`,
      `The complexity of ${theme} is acknowledged`,
      `${theme} brings bittersweet understanding`,
    ],
    dark: [
      `${theme} deepens into something ominous`,
      `The shadow side of ${theme} dominates`,
      `${theme} reveals uncomfortable truths`,
    ],
  }
  
  const possibleExpressions = expressions[variation.mood]
  return possibleExpressions[Math.floor(Math.random() * possibleExpressions.length)]
}

function determineArc(
  theme: string,
  variation: BranchVariation
): ThemeProgression['arc'] {
  const arcs: ThemeProgression['arc'][] = ['ascending', 'descending', 'cyclical', 'linear']
  
  // Choose arc based on mood and consequence type
  if (variation.mood === 'hopeful') {
    return 'ascending'
  }
  if (variation.mood === 'tragic') {
    return 'descending'
  }
  if (variation.consequenceType === 'cosmic') {
    return 'cyclical'
  }
  
  return 'linear'
}

/**
 * Compare theme progressions between branches
 */
export function compareThemeProgressions(
  progressions1: ThemeProgression[],
  progressions2: ThemeProgression[]
): number {
  let similarity = 0
  let comparisons = 0
  
  for (const p1 of progressions1) {
    const p2 = progressions2.find(p => p.theme === p1.theme)
    if (p2) {
      // Compare arcs
      if (p1.arc === p2.arc) similarity += 0.3
      
      // Compare ending expressions (simplified)
      if (p1.endingExpression === p2.endingExpression) similarity += 0.7
      
      comparisons++
    }
  }
  
  return comparisons > 0 ? similarity / comparisons : 0
}
