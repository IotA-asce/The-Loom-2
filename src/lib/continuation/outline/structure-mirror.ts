/**
 * Mirror original manga structure variety
 */

import type { Chapter } from '@/lib/db/schema'
import type { ChapterOutline } from './generator'

export interface StructureAnalysis {
  avgChapterLength: number
  avgSceneCount: number
  pacingPattern: 'fast' | 'moderate' | 'slow' | 'variable'
  sceneLengthPattern: 'short' | 'medium' | 'long' | 'mixed'
  commonStructures: StructurePattern[]
  structuralVariety: number // 0-1
}

export interface StructurePattern {
  name: string
  sceneCount: number
  sceneTypes: string[]
  frequency: number
}

/**
 * Analyze original manga structure
 */
export function analyzeOriginalStructure(
  originalChapters: Chapter[]
): StructureAnalysis {
  if (originalChapters.length === 0) {
    return getDefaultStructure()
  }
  
  // Calculate averages
  const chapterLengths = originalChapters.map(c => c.wordCount)
  const avgChapterLength = chapterLengths.reduce((a, b) => a + b, 0) / chapterLengths.length
  
  const sceneCounts = originalChapters.map(c => c.scenes.length)
  const avgSceneCount = sceneCounts.reduce((a, b) => a + b, 0) / sceneCounts.length
  
  // Determine pacing
  const pacingPattern = determinePacingPattern(originalChapters)
  
  // Determine scene length pattern
  const sceneLengthPattern = determineSceneLengthPattern(originalChapters)
  
  // Find common structures
  const commonStructures = findCommonStructures(originalChapters)
  
  // Calculate variety
  const structuralVariety = calculateStructuralVariety(originalChapters)
  
  return {
    avgChapterLength,
    avgSceneCount,
    pacingPattern,
    sceneLengthPattern,
    commonStructures,
    structuralVariety,
  }
}

function getDefaultStructure(): StructureAnalysis {
  return {
    avgChapterLength: 3000,
    avgSceneCount: 4,
    pacingPattern: 'moderate',
    sceneLengthPattern: 'medium',
    commonStructures: [
      { name: 'Standard', sceneCount: 4, sceneTypes: ['opening', 'development', 'climax', 'transition'], frequency: 1 },
    ],
    structuralVariety: 0.5,
  }
}

function determinePacingPattern(
  chapters: Chapter[]
): StructureAnalysis['pacingPattern'] {
  const lengths = chapters.map(c => c.wordCount)
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / lengths.length
  const stdDev = Math.sqrt(variance)
  
  if (stdDev / avg > 0.3) return 'variable'
  if (avg < 2000) return 'fast'
  if (avg > 4000) return 'slow'
  return 'moderate'
}

function determineSceneLengthPattern(
  chapters: Chapter[]
): StructureAnalysis['sceneLengthPattern'] {
  const sceneCounts = chapters.map(c => c.scenes.length)
  const variance = calculateVariance(sceneCounts)
  
  if (variance > 2) return 'mixed'
  
  const avg = sceneCounts.reduce((a, b) => a + b, 0) / sceneCounts.length
  if (avg < 3) return 'short'
  if (avg > 5) return 'long'
  return 'medium'
}

function findCommonStructures(chapters: Chapter[]): StructurePattern[] {
  const patterns: Map<string, number> = new Map()
  
  for (const chapter of chapters) {
    const sceneCount = chapter.scenes.length
    const key = `${sceneCount}-scenes`
    patterns.set(key, (patterns.get(key) || 0) + 1)
  }
  
  const total = chapters.length
  const result: StructurePattern[] = []
  
  for (const [key, count] of patterns) {
    const sceneCount = parseInt(key.split('-')[0])
    result.push({
      name: `${sceneCount}-Scene Structure`,
      sceneCount,
      sceneTypes: inferSceneTypes(sceneCount),
      frequency: count / total,
    })
  }
  
  return result.sort((a, b) => b.frequency - a.frequency)
}

function inferSceneTypes(sceneCount: number): string[] {
  const types: Record<number, string[]> = {
    2: ['setup', 'climax'],
    3: ['opening', 'development', 'climax'],
    4: ['opening', 'rising', 'climax', 'resolution'],
    5: ['hook', 'setup', 'rising', 'climax', 'denouement'],
    6: ['hook', 'setup', 'complication', 'rising', 'climax', 'resolution'],
  }
  
  return types[sceneCount] || types[4]
}

function calculateStructuralVariety(chapters: Chapter[]): number {
  const structures = chapters.map(c => c.scenes.length)
  const uniqueStructures = new Set(structures).size
  return Math.min(1, uniqueStructures / Math.max(1, structures.length * 0.5))
}

function calculateVariance(numbers: number[]): number {
  const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length
  return numbers.reduce((sum, n) => sum + Math.pow(n - avg, 2), 0) / numbers.length
}

/**
 * Apply structure analysis to outline
 */
export function mirrorStructureToOutline(
  outline: ChapterOutline[],
  analysis: StructureAnalysis
): ChapterOutline[] {
  return outline.map((chapter, index) => {
    // Vary scene count based on structural variety
    let targetSceneCount = Math.round(analysis.avgSceneCount)
    
    if (analysis.structuralVariety > 0.5 && analysis.commonStructures.length > 1) {
      // Use variety of structures
      const pattern = analysis.commonStructures[index % analysis.commonStructures.length]
      targetSceneCount = pattern.sceneCount
    }
    
    // Adjust current chapter
    let scenes = [...chapter.scenes]
    
    // Add or remove scenes to match target
    while (scenes.length < targetSceneCount) {
      scenes.push(createAdditionalScene(scenes.length + 1, chapter))
    }
    while (scenes.length > targetSceneCount) {
      scenes.pop()
    }
    
    // Renumber scenes
    scenes = scenes.map((s, i) => ({ ...s, sceneNumber: i + 1 }))
    
    // Adjust word count
    const targetWordCount = analysis.avgChapterLength * 
      (0.9 + Math.random() * 0.2) // ±10% variation
    
    return {
      ...chapter,
      scenes,
      wordCountTarget: Math.round(targetWordCount),
    }
  })
}

function createAdditionalScene(
  sceneNumber: number,
  chapter: ChapterOutline
): { sceneNumber: number; setting: string; characters: string[]; summary: string; dialogueSnippets: string[]; emotionalBeat: string; purpose: string } {
  return {
    sceneNumber,
    setting: chapter.settings[sceneNumber % chapter.settings.length] || 'Unknown',
    characters: chapter.characters.slice(0, 2),
    summary: `Additional scene ${sceneNumber}`,
    dialogueSnippets: [],
    emotionalBeat: 'neutral',
    purpose: 'transition',
  }
}

/**
 * Get structure recommendations
 */
export function getStructureRecommendations(
  analysis: StructureAnalysis
): string[] {
  const recommendations: string[] = []
  
  if (analysis.structuralVariety < 0.3) {
    recommendations.push('Consider adding more structural variety to avoid monotony')
  }
  
  if (analysis.pacingPattern === 'slow') {
    recommendations.push('Original has slow pacing - ensure new content maintains reader engagement')
  }
  
  if (analysis.pacingPattern === 'fast') {
    recommendations.push('Original has fast pacing - maintain momentum in continuation')
  }
  
  if (analysis.sceneLengthPattern === 'mixed') {
    recommendations.push('Use varying scene lengths for rhythm and emphasis')
  }
  
  recommendations.push(`Most common structure: ${analysis.commonStructures[0]?.name || 'Standard'}`)
  
  return recommendations
}

/**
 * Adapt pacing for specific chapter position
 */
export function adaptPacingForPosition(
  baseWordCount: number,
  chapterIndex: number,
  totalChapters: number,
  analysis: StructureAnalysis
): number {
  const ratio = chapterIndex / totalChapters
  let multiplier = 1
  
  // Climax chapters tend to be longer
  if (ratio >= 0.6 && ratio < 0.8) {
    multiplier = 1.2
  }
  
  // Resolution chapters can be shorter
  if (ratio >= 0.9) {
    multiplier = 0.9
  }
  
  // Apply original pacing pattern
  switch (analysis.pacingPattern) {
    case 'fast':
      multiplier *= 0.85
      break
    case 'slow':
      multiplier *= 1.15
      break
    case 'variable':
      // Add random variation
      multiplier *= 0.9 + Math.random() * 0.2
      break
  }
  
  return Math.round(baseWordCount * multiplier)
}

/**
 * Generate scene type distribution
 */
export function generateSceneTypeDistribution(
  sceneCount: number,
  position: 'beginning' | 'middle' | 'end'
): string[] {
  const distributions: Record<typeof position, string[]> = {
    beginning: ['hook', 'setup', 'rising', 'complication'],
    middle: ['development', 'rising', 'climax-scene', 'twist'],
    end: ['climax-scene', 'falling', 'resolution', 'denouement'],
  }
  
  const types = distributions[position]
  const result: string[] = []
  
  for (let i = 0; i < sceneCount; i++) {
    result.push(types[i % types.length])
  }
  
  return result
}
