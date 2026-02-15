/**
 * Anchor analysis runner
 */

import { getLLMProvider } from '@/lib/llm/factory'
import { retryWithFallback } from '@/lib/llm/orchestrator/retry'
import { repairJson } from '@/lib/analysis/parser/json-repair'
import type { ParsedTimelineEvent, AnalysisResults } from '@/lib/analysis/parser/validation'
import { buildAnchorContext, type AnchorContext } from './context-builder'
import { generateAnchorPrompts } from './prompts'

export interface AnchorAnalysis {
  eventId: string
  branchPotential: {
    level: 'high' | 'moderate' | 'low'
    points: string[]
    alternatives: string[]
    consequences: string[]
    confidence: number
  }
  emotionalImpact: {
    primaryEmotions: string[]
    emotionalStakes: string
    readerImpact: string
    relationshipEffects: string[]
    confidence: number
  }
  overallScore: number
}

const BRANCH_POTENTIAL_LEVELS = { high: 1, moderate: 0.6, low: 0.3 }

/**
 * Analyze a single event for anchor potential
 */
export async function analyzeEventForAnchors(
  event: ParsedTimelineEvent,
  analysis: AnalysisResults,
  mangaId: string
): Promise<AnchorAnalysis> {
  const context = buildAnchorContext(event, analysis)
  const prompts = generateAnchorPrompts(context)
  const provider = getLLMProvider(mangaId)
  
  // Analyze branch potential
  const branchResult = await retryWithFallback(
    async p => p.complete({ messages: [{ role: 'user', content: prompts.branchPotential }] }),
    mangaId
  )
  
  // Analyze emotional impact
  const emotionalResult = await retryWithFallback(
    async p => p.complete({ messages: [{ role: 'user', content: prompts.emotionalImpact }] }),
    mangaId
  )
  
  const branchParsed = parseBranchAnalysis(repairJson(branchResult.content))
  const emotionalParsed = parseEmotionalAnalysis(repairJson(emotionalResult.content))
  
  return {
    eventId: event.id,
    branchPotential: branchParsed,
    emotionalImpact: emotionalParsed,
    overallScore: calculateOverallScore(branchParsed, emotionalParsed),
  }
}

function parseBranchAnalysis(content: string): AnchorAnalysis['branchPotential'] {
  const data = JSON.parse(content)
  return {
    level: data.branchPotential || 'low',
    points: data.branchingPoints || [],
    alternatives: data.alternatives || [],
    consequences: data.consequences || [],
    confidence: data.confidence || 0.5,
  }
}

function parseEmotionalAnalysis(content: string): AnchorAnalysis['emotionalImpact'] {
  const data = JSON.parse(content)
  return {
    primaryEmotions: data.primaryEmotions || [],
    emotionalStakes: data.emotionalStakes || '',
    readerImpact: data.readerImpact || '',
    relationshipEffects: data.relationshipEffects || [],
    confidence: data.confidence || 0.5,
  }
}

function calculateOverallScore(
  branch: AnchorAnalysis['branchPotential'],
  emotional: AnchorAnalysis['emotionalImpact']
): number {
  const branchScore = BRANCH_POTENTIAL_LEVELS[branch.level] || 0.3
  const emotionalScore = emotional.primaryEmotions.length > 0 ? 0.7 : 0.3
  return (branchScore * 0.6) + (emotionalScore * 0.4)
}
