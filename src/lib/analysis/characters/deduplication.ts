/**
 * Character deduplication (LLM-based)
 * Identifies and merges duplicate character entries
 */

import { Character } from '@/lib/db/schema'
import { LLMProvider } from '@/lib/llm/types'

export interface DuplicateCandidate {
  characterA: Character
  characterB: Character
  similarityScore: number
  isLikelyDuplicate: boolean
}

export interface DeduplicationResult {
  duplicates: Array<{
    keep: Character
    remove: Character
    confidence: number
  }>
  unique: Character[]
  merged: Character[]
}

/**
 * Find potential duplicates using heuristics
 */
export function findDuplicateCandidates(characters: Character[]): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = []
  
  for (let i = 0; i < characters.length; i++) {
    for (let j = i + 1; j < characters.length; j++) {
      const a = characters[i]
      const b = characters[j]
      
      const similarityScore = calculateSimilarity(a, b)
      const isLikelyDuplicate = similarityScore > 0.7
      
      if (similarityScore > 0.4) {
        candidates.push({
          characterA: a,
          characterB: b,
          similarityScore,
          isLikelyDuplicate,
        })
      }
    }
  }
  
  return candidates.sort((a, b) => b.similarityScore - a.similarityScore)
}

/**
 * Calculate similarity between two characters
 */
function calculateSimilarity(a: Character, b: Character): number {
  let score = 0
  let weights = 0
  
  // Name similarity (40%)
  const nameSim = stringSimilarity(a.name.toLowerCase(), b.name.toLowerCase())
  score += nameSim * 0.4
  weights += 0.4
  
  // Alias overlap (20%)
  const aliasOverlap = calculateAliasOverlap(a.aliases, b.aliases)
  score += aliasOverlap * 0.2
  weights += 0.2
  
  // Description similarity (20%)
  const descSim = stringSimilarity(
    a.description.toLowerCase(),
    b.description.toLowerCase()
  )
  score += descSim * 0.2
  weights += 0.2
  
  // Appearance similarity (10%)
  if (a.appearance && b.appearance) {
    const appSim = stringSimilarity(
      a.appearance.toLowerCase(),
      b.appearance.toLowerCase()
    )
    score += appSim * 0.1
    weights += 0.1
  }
  
  // Proximity in story (10%) - characters appearing close together
  const pageDiff = Math.abs(a.firstAppearance - b.firstAppearance)
  const proximityScore = Math.max(0, 1 - pageDiff / 50)
  score += proximityScore * 0.1
  weights += 0.1
  
  return weights > 0 ? score / weights : 0
}

/**
 * Calculate string similarity (Jaccard-like)
 */
function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1
  if (a.length === 0 || b.length === 0) return 0
  
  const aWords = new Set(a.split(/\s+/))
  const bWords = new Set(b.split(/\s+/))
  
  const intersection = new Set([...aWords].filter(x => bWords.has(x)))
  const union = new Set([...aWords, ...bWords])
  
  return intersection.size / union.size
}

/**
 * Calculate alias overlap
 */
function calculateAliasOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0
  
  const setA = new Set(a.map(s => s.toLowerCase()))
  const setB = new Set(b.map(s => s.toLowerCase()))
  
  const intersection = new Set([...setA].filter(x => setB.has(x)))
  const union = new Set([...setA, ...setB])
  
  return intersection.size / union.size
}

/**
 * Deduplicate characters using LLM verification
 */
export async function deduplicateWithLLM(
  candidates: DuplicateCandidate[],
  provider: LLMProvider,
  options?: { threshold?: number }
): Promise<DeduplicationResult> {
  const threshold = options?.threshold ?? 0.8
  const duplicates: DeduplicationResult['duplicates'] = []
  const toRemove = new Set<string>()
  
  for (const candidate of candidates) {
    if (candidate.similarityScore < 0.5) continue
    
    // For high confidence matches, skip LLM
    if (candidate.similarityScore > 0.9) {
      const { keep, remove } = decideMergeOrder(
        candidate.characterA,
        candidate.characterB
      )
      duplicates.push({ keep, remove, confidence: candidate.similarityScore })
      toRemove.add(remove.id)
      continue
    }
    
    // Use LLM for borderline cases
    try {
      const llmConfidence = await verifyDuplicateWithLLM(
        candidate.characterA,
        candidate.characterB,
        provider
      )
      
      if (llmConfidence >= threshold) {
        const { keep, remove } = decideMergeOrder(
          candidate.characterA,
          candidate.characterB
        )
        duplicates.push({ keep, remove, confidence: llmConfidence })
        toRemove.add(remove.id)
      }
    } catch {
      // If LLM fails, use heuristic score
      if (candidate.similarityScore >= threshold) {
        const { keep, remove } = decideMergeOrder(
          candidate.characterA,
          candidate.characterB
        )
        duplicates.push({ keep, remove, confidence: candidate.similarityScore })
        toRemove.add(remove.id)
      }
    }
  }
  
  // Build result
  const unique: Character[] = []
  const merged: Character[] = []
  
  for (const dup of duplicates) {
    const mergedChar = mergeCharacters(dup.keep, dup.remove)
    merged.push(mergedChar)
  }
  
  for (const char of candidates.flatMap(c => [c.characterA, c.characterB])) {
    if (!toRemove.has(char.id) && !merged.some(m => m.id === char.id)) {
      unique.push(char)
    }
  }
  
  return { duplicates, unique, merged }
}

/**
 * Verify duplicate with LLM
 */
async function verifyDuplicateWithLLM(
  a: Character,
  b: Character,
  provider: LLMProvider
): Promise<number> {
  const prompt = `Compare these two character descriptions and determine if they are the same person:

Character A:
- Name: ${a.name}
- Aliases: ${a.aliases.join(', ') || 'None'}
- Description: ${a.description}
${a.appearance ? `- Appearance: ${a.appearance}` : ''}

Character B:
- Name: ${b.name}
- Aliases: ${b.aliases.join(', ') || 'None'}
- Description: ${b.description}
${b.appearance ? `- Appearance: ${b.appearance}` : ''}

Are these the same character? Respond with ONLY a confidence score from 0.0 to 1.0.
0.0 = definitely different people
1.0 = definitely the same person`

  const response = await provider.complete({
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 10,
  })
  
  const score = parseFloat(response.content.trim())
  return isNaN(score) ? 0 : Math.max(0, Math.min(1, score))
}

/**
 * Decide which character to keep when merging
 */
function decideMergeOrder(a: Character, b: Character): { keep: Character; remove: Character } {
  // Prefer character with:
  // 1. More detailed description
  // 2. More aliases
  // 3. Earlier first appearance
  
  const scoreA = a.description.length + a.aliases.length * 10 - a.firstAppearance * 0.1
  const scoreB = b.description.length + b.aliases.length * 10 - b.firstAppearance * 0.1
  
  return scoreA >= scoreB ? { keep: a, remove: b } : { keep: b, remove: a }
}

/**
 * Merge two character records
 */
function mergeCharacters(keep: Character, remove: Character): Character {
  return {
    ...keep,
    // Merge aliases
    aliases: [...new Set([...keep.aliases, ...remove.aliases, remove.name])],
    // Keep earlier appearance
    firstAppearance: Math.min(keep.firstAppearance, remove.firstAppearance),
    // Combine descriptions if different
    description: keep.description !== remove.description
      ? `${keep.description}\n\nAlso described as: ${remove.description}`
      : keep.description,
    // Use more specific importance
    importance: keep.importance === 'minor' ? remove.importance : keep.importance,
  }
}

/**
 * Simple heuristic deduplication (no LLM)
 */
export function deduplicateHeuristic(
  characters: Character[],
  threshold: number = 0.75
): DeduplicationResult {
  const candidates = findDuplicateCandidates(characters)
  const highConfidence = candidates.filter(c => c.similarityScore >= threshold)
  
  const duplicates: DeduplicationResult['duplicates'] = []
  const toRemove = new Set<string>()
  
  for (const candidate of highConfidence) {
    const { keep, remove } = decideMergeOrder(candidate.characterA, candidate.characterB)
    duplicates.push({ keep, remove, confidence: candidate.similarityScore })
    toRemove.add(remove.id)
  }
  
  const unique = characters.filter(c => !toRemove.has(c.id))
  const merged = duplicates.map(d => mergeCharacters(d.keep, d.remove))
  
  return { duplicates, unique, merged }
}
