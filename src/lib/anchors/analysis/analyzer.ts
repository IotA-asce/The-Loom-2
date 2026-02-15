/**
 * Anchor analysis runner
 */

import { LLMService, createLLMService } from '@/lib/llm/factory'
import type { LLMProviderConfig } from '@/stores/configStore'
import type { ParsedTimelineEvent } from '@/lib/analysis/parser/validation'
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

// Simple JSON repair fallback
function repairJson(content: string): string {
  try {
    // Try to find JSON in the content
    const match = content.match(/\{[\s\S]*\}/)
    if (match) {
      // Validate by parsing
      JSON.parse(match[0])
      return match[0]
    }
  } catch {
    // Fall through to return original
  }
  return content
}

/**
 * Analyze a single event for anchor potential
 */
export async function analyzeEventForAnchors(
  event: ParsedTimelineEvent,
  configs: LLMProviderConfig[]
): Promise<AnchorAnalysis> {
  const context = buildAnchorContext(event)
  const prompts = generateAnchorPrompts(context)
  const service = createLLMService(configs)
  
  // Analyze branch potential
  const branchResult = await service.complete({ 
    messages: [{ role: 'user', content: prompts.branchPotential }] 
  })
  
  // Analyze emotional impact
  const emotionalResult = await service.complete({ 
    messages: [{ role: 'user', content: prompts.emotionalImpact }] 
  })
  
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
  try {
    const data = JSON.parse(content)
    return {
      level: data.branchPotential || 'low',
      points: data.branchingPoints || [],
      alternatives: data.alternatives || [],
      consequences: data.consequences || [],
      confidence: data.confidence || 0.5,
    }
  } catch {
    return {
      level: 'low',
      points: [],
      alternatives: [],
      consequences: [],
      confidence: 0.5,
    }
  }
}

function parseEmotionalAnalysis(content: string): AnchorAnalysis['emotionalImpact'] {
  try {
    const data = JSON.parse(content)
    return {
      primaryEmotions: data.primaryEmotions || [],
      emotionalStakes: data.emotionalStakes || '',
      readerImpact: data.readerImpact || '',
      relationshipEffects: data.relationshipEffects || [],
      confidence: data.confidence || 0.5,
    }
  } catch {
    return {
      primaryEmotions: [],
      emotionalStakes: '',
      readerImpact: '',
      relationshipEffects: [],
      confidence: 0.5,
    }
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
