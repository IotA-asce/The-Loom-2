/**
 * Multi-level refinement scope system
 */

export type RefinementScope = 
  | 'sentence'
  | 'paragraph' 
  | 'scene'
  | 'chapter'
  | 'multi-chapter'

export interface ScopeConfig {
  scope: RefinementScope
  name: string
  description: string
  maxContextSize: number // in characters
  supportsAI: boolean
  supportsManual: boolean
}

/**
 * Scope configurations
 */
export const SCOPE_CONFIGS: Record<RefinementScope, ScopeConfig> = {
  sentence: {
    scope: 'sentence',
    name: 'Sentence Level',
    description: 'Refine individual sentences for clarity, flow, or impact',
    maxContextSize: 500,
    supportsAI: true,
    supportsManual: true,
  },
  paragraph: {
    scope: 'paragraph',
    name: 'Paragraph Level',
    description: 'Refine paragraphs for coherence and pacing',
    maxContextSize: 2000,
    supportsAI: true,
    supportsManual: true,
  },
  scene: {
    scope: 'scene',
    name: 'Scene Level',
    description: 'Refine complete scenes for structure and emotional impact',
    maxContextSize: 10000,
    supportsAI: true,
    supportsManual: true,
  },
  chapter: {
    scope: 'chapter',
    name: 'Chapter Level',
    description: 'Refine entire chapters for flow and consistency',
    maxContextSize: 50000,
    supportsAI: true,
    supportsManual: true,
  },
  'multi-chapter': {
    scope: 'multi-chapter',
    name: 'Multi-Chapter Level',
    description: 'Refine across chapters for arc consistency',
    maxContextSize: 200000,
    supportsAI: true,
    supportsManual: false,
  },
}

export interface RefinementTarget {
  scope: RefinementScope
  chapterId: string
  sceneId?: string
  paragraphId?: string
  sentenceId?: string
  selection?: { start: number; end: number }
}

/**
 * Create a refinement target
 */
export function createRefinementTarget(
  scope: RefinementScope,
  chapterId: string,
  options: {
    sceneId?: string
    paragraphId?: string
    sentenceId?: string
    selection?: { start: number; end: number }
  } = {}
): RefinementTarget {
  return {
    scope,
    chapterId,
    ...options,
  }
}

/**
 * Get scope config
 */
export function getScopeConfig(scope: RefinementScope): ScopeConfig {
  return SCOPE_CONFIGS[scope]
}

/**
 * Check if scope supports AI refinement
 */
export function supportsAI(scope: RefinementScope): boolean {
  return SCOPE_CONFIGS[scope].supportsAI
}

/**
 * Check if scope supports manual refinement
 */
export function supportsManual(scope: RefinementScope): boolean {
  return SCOPE_CONFIGS[scope].supportsManual
}

/**
 * Get valid scope transitions
 */
export function getValidTransitions(from: RefinementScope): RefinementScope[] {
  const transitions: Record<RefinementScope, RefinementScope[]> = {
    sentence: ['paragraph', 'scene', 'chapter'],
    paragraph: ['sentence', 'scene', 'chapter'],
    scene: ['sentence', 'paragraph', 'chapter'],
    chapter: ['sentence', 'paragraph', 'scene'],
    'multi-chapter': ['chapter'],
  }
  
  return transitions[from] || []
}

/**
 * Expand scope to include more context
 */
export function expandScope(target: RefinementTarget): RefinementTarget {
  const expansionMap: Record<RefinementScope, RefinementScope> = {
    sentence: 'paragraph',
    paragraph: 'scene',
    scene: 'chapter',
    chapter: 'multi-chapter',
    'multi-chapter': 'multi-chapter',
  }
  
  return {
    ...target,
    scope: expansionMap[target.scope],
  }
}

/**
 * Narrow scope to focus on details
 */
export function narrowScope(target: RefinementTarget): RefinementTarget {
  const narrowingMap: Record<RefinementScope, RefinementScope> = {
    'multi-chapter': 'chapter',
    chapter: 'scene',
    scene: 'paragraph',
    paragraph: 'sentence',
    sentence: 'sentence',
  }
  
  return {
    ...target,
    scope: narrowingMap[target.scope],
  }
}

/**
 * Format scope for display
 */
export function formatScope(target: RefinementTarget): string {
  const parts: string[] = []
  
  parts.push(SCOPE_CONFIGS[target.scope].name)
  
  if (target.sceneId) {
    parts.push(`→ Scene: ${target.sceneId}`)
  }
  if (target.paragraphId) {
    parts.push(`→ Paragraph: ${target.paragraphId}`)
  }
  if (target.sentenceId) {
    parts.push(`→ Sentence: ${target.sentenceId}`)
  }
  if (target.selection) {
    parts.push(`[${target.selection.start}-${target.selection.end}]`)
  }
  
  return parts.join(' ')
}

/**
 * Validate scope target
 */
export function validateTarget(target: RefinementTarget): { valid: boolean; error?: string } {
  if (!target.chapterId) {
    return { valid: false, error: 'Chapter ID is required' }
  }
  
  if (!SCOPE_CONFIGS[target.scope]) {
    return { valid: false, error: `Invalid scope: ${target.scope}` }
  }
  
  // Scene scope requires sceneId
  if (target.scope === 'scene' && !target.sceneId) {
    return { valid: false, error: 'Scene ID required for scene scope' }
  }
  
  // Paragraph scope requires paragraphId
  if (target.scope === 'paragraph' && !target.paragraphId) {
    return { valid: false, error: 'Paragraph ID required for paragraph scope' }
  }
  
  // Sentence scope requires sentenceId
  if (target.scope === 'sentence' && !target.sentenceId) {
    return { valid: false, error: 'Sentence ID required for sentence scope' }
  }
  
  return { valid: true }
}

/**
 * Extract content at scope
 */
export function extractContentAtScope(
  content: string,
  target: RefinementTarget
): { content: string; context: string } {
  // In real implementation, parse actual document structure
  // This is a simplified version
  
  if (target.selection) {
    return {
      content: content.slice(target.selection.start, target.selection.end),
      context: content,
    }
  }
  
  return {
    content,
    context: content,
  }
}
