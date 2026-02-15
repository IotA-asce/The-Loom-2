/**
 * Candidate pool builder
 */

import type { ParsedTimelineEvent, ParsedCharacter } from '@/lib/analysis/parser/validation'
import type { CausalGraph } from '@/lib/analysis/timeline/causal'
import { filterBySignificance } from './significance'
import { filterByMajorCharacters, calculateCharacterInvolvement } from './characters'
import { analyzeCausalImpact } from './causal'
import { applyDiversityConstraints } from './diversity'

export interface CandidatePoolConfig {
  minSignificance: 'minor' | 'moderate' | 'major' | 'critical'
  minMajorCharacters: number
  minCausalImpact: number
  diversity: {
    minDistance: number
    maxPerChapter: number
    spreadAcrossChapters?: boolean  // Optional for backward compatibility
  }
  maxCandidates: number
}

export const DEFAULT_POOL_CONFIG: CandidatePoolConfig = {
  minSignificance: 'moderate',
  minMajorCharacters: 1,
  minCausalImpact: 0.3,
  diversity: {
    minDistance: 10,
    maxPerChapter: 3,
  },
  maxCandidates: 20,
}

export interface AnchorCandidate {
  event: ParsedTimelineEvent
  characterInvolvement: number
  causalImpact: number
  score: number
}

/**
 * Build candidate pool from timeline events
 */
export function buildCandidatePool(
  events: ParsedTimelineEvent[],
  characters: ParsedCharacter[],
  causalGraph: CausalGraph,
  config: Partial<CandidatePoolConfig> = {}
): AnchorCandidate[] {
  const fullConfig = { ...DEFAULT_POOL_CONFIG, ...config }
  
  // Apply filters sequentially
  let filtered = filterBySignificance(events, fullConfig.minSignificance)
  filtered = filterByMajorCharacters(filtered, characters, fullConfig.minMajorCharacters)
  filtered = applyDiversityConstraints(filtered, fullConfig.diversity)
  
  // Calculate scores
  const impacts = analyzeCausalImpact(filtered, causalGraph)
  
  const candidates: AnchorCandidate[] = filtered.map(event => {
    const impact = impacts.find(i => i.eventId === event.id)
    const charInvolvement = calculateCharacterInvolvement(event, characters)
    
    return {
      event,
      characterInvolvement: charInvolvement,
      causalImpact: impact?.impactScore || 0,
      score: (charInvolvement * 0.4) + ((impact?.impactScore || 0) * 0.6),
    }
  })
  
  // Filter by minimum causal impact and sort by score
  return candidates
    .filter(c => c.causalImpact >= fullConfig.minCausalImpact)
    .sort((a, b) => b.score - a.score)
    .slice(0, fullConfig.maxCandidates)
}
