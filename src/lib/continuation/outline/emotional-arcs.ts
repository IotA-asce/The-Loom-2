/**
 * Scene-by-scene emotional arc planning
 */

import type { ChapterOutline, SceneOutline } from './generator'
import type { BranchVariation } from '@/lib/branches/variation/generator'

export interface EmotionalArcPlan {
  chapterNumber: number
  overallArc: string
  sceneArcs: SceneEmotionalArc[]
  turningPoint?: number // Scene number where major shift occurs
  cliffhangerEmotion: string
}

export interface SceneEmotionalArc {
  sceneNumber: number
  startingEmotion: string
  endingEmotion: string
  transition: string
  intensity: number // 0-10
  purpose: string
}

export interface EmotionalPalette {
  primary: string[]
  secondary: string[]
  transitions: Map<string, string[]>
}

/**
 * Plan emotional arcs for chapter
 */
export function planEmotionalArcs(
  chapter: ChapterOutline,
  branch: BranchVariation,
  previousChapter?: ChapterOutline
): EmotionalArcPlan {
  const sceneCount = chapter.scenes.length
  const mood = branch.mood
  
  // Determine overall arc direction
  const overallArc = determineOverallArc(mood, chapter.chapterNumber)
  
  // Generate scene-by-scene arcs
  const sceneArcs: SceneEmotionalArc[] = []
  
  let currentEmotion = previousChapter?.emotionalArc.split('→').pop()?.trim() || 'neutral'
  
  for (let i = 1; i <= sceneCount; i++) {
    const sceneEmotion = generateSceneEmotionalArc(
      i,
      sceneCount,
      currentEmotion,
      mood,
      overallArc
    )
    
    sceneArcs.push(sceneEmotion)
    currentEmotion = sceneEmotion.endingEmotion
  }
  
  // Find turning point
  const turningPoint = findTurningPoint(sceneArcs)
  
  // Determine cliffhanger emotion
  const cliffhangerEmotion = determineCliffhangerEmotion(mood)
  
  return {
    chapterNumber: chapter.chapterNumber,
    overallArc,
    sceneArcs,
    turningPoint,
    cliffhangerEmotion,
  }
}

function determineOverallArc(
  mood: BranchVariation['mood'],
  chapterNum: number
): string {
  const arcs: Record<typeof mood, string[]> = {
    hopeful: ['hope→struggle→hope', 'despair→discovery→hope', 'cautious→brave→triumphant'],
    tragic: ['hope→warning→loss', 'calm→storm→grief', 'determined→sacrifice→mourning'],
    mixed: ['hope→doubt→acceptance', 'joy→conflict→bittersweet', 'curious→concerned→resolved'],
    dark: ['fear→resistance→defeat', 'determined→betrayal→isolation', 'hope→corruption→despair'],
  }
  
  const moodArcs = arcs[mood]
  return moodArcs[chapterNum % moodArcs.length]
}

function generateSceneEmotionalArc(
  sceneNum: number,
  totalScenes: number,
  previousEmotion: string,
  mood: BranchVariation['mood'],
  overallArc: string
): SceneEmotionalArc {
  // Determine position in chapter
  const position = sceneNum / totalScenes
  
  // Calculate intensity
  let intensity = 5
  if (position > 0.6 && position < 0.9) {
    intensity = 8 // Climax scenes are more intense
  } else if (position > 0.9) {
    intensity = 6 // Resolution
  } else if (position < 0.2) {
    intensity = 4 // Setup
  }
  
  // Adjust based on mood
  const moodMultipliers: Record<typeof mood, number> = {
    hopeful: 0.9,
    tragic: 1.1,
    mixed: 1.0,
    dark: 1.2,
  }
  intensity *= moodMultipliers[mood]
  intensity = Math.min(10, Math.max(1, Math.round(intensity)))
  
  // Determine emotions
  const startingEmotion = previousEmotion
  const endingEmotion = determineNextEmotion(startingEmotion, position, overallArc)
  
  // Determine transition
  const transition = determineTransition(startingEmotion, endingEmotion)
  
  // Determine purpose
  const purpose = determineScenePurpose(position)
  
  return {
    sceneNumber: sceneNum,
    startingEmotion,
    endingEmotion,
    transition,
    intensity,
    purpose,
  }
}

function determineNextEmotion(
  current: string,
  position: number,
  overallArc: string
): string {
  const arcPhases = overallArc.split('→').map(s => s.trim())
  
  // Map position to phase
  const phaseIndex = Math.min(
    arcPhases.length - 1,
    Math.floor(position * arcPhases.length)
  )
  
  // Return emotion from appropriate phase
  return arcPhases[phaseIndex] || current
}

function determineTransition(from: string, to: string): string {
  const transitions: Record<string, Record<string, string>> = {
    hope: {
      despair: 'crushed by events',
      determination: 'resolved to act',
      fear: 'realizing danger',
    },
    despair: {
      hope: 'finding a way forward',
      anger: 'channeling grief',
      acceptance: 'coming to terms',
    },
    calm: {
      tension: 'sensing trouble',
      excitement: 'discovering opportunity',
      fear: 'unexpected threat',
    },
  }
  
  return transitions[from]?.[to] || 'gradual shift'
}

function determineScenePurpose(position: number): string {
  if (position < 0.2) return 'establish'
  if (position < 0.5) return 'escalate'
  if (position < 0.8) return 'climax-build'
  return 'resolve'
}

function findTurningPoint(sceneArcs: SceneEmotionalArc[]): number | undefined {
  // Find scene with biggest emotional shift
  let maxShift = 0
  let turningPoint: number | undefined
  
  const emotionIntensity: Record<string, number> = {
    'despair': 10, 'terror': 10, 'ecstasy': 10,
    'anger': 8, 'joy': 8, 'grief': 8,
    'fear': 7, 'hope': 7, 'determination': 7,
    'anxiety': 5, 'cautious': 5, 'curious': 5,
    'calm': 3, 'neutral': 3, 'content': 3,
  }
  
  for (const arc of sceneArcs) {
    const fromIntensity = emotionIntensity[arc.startingEmotion] || 5
    const toIntensity = emotionIntensity[arc.endingEmotion] || 5
    const shift = Math.abs(toIntensity - fromIntensity)
    
    if (shift > maxShift && shift >= 4) {
      maxShift = shift
      turningPoint = arc.sceneNumber
    }
  }
  
  return turningPoint
}

function determineCliffhangerEmotion(mood: BranchVariation['mood']): string {
  const emotions: Record<typeof mood, string> = {
    hopeful: 'anticipation',
    tragic: 'dread',
    mixed: 'uncertainty',
    dark: 'foreboding',
  }
  
  return emotions[mood]
}

/**
 * Apply emotional arcs to outline
 */
export function applyEmotionalArcsToOutline(
  chapter: ChapterOutline,
  arcPlan: EmotionalArcPlan
): ChapterOutline {
  const updatedScenes = chapter.scenes.map(scene => {
    const arc = arcPlan.sceneArcs.find(a => a.sceneNumber === scene.sceneNumber)
    if (!arc) return scene
    
    return {
      ...scene,
      emotionalBeat: `${arc.startingEmotion}→${arc.endingEmotion}`,
      summary: `${scene.summary} (${arc.purpose}: ${arc.transition})`,
    }
  })
  
  return {
    ...chapter,
    scenes: updatedScenes,
    emotionalArc: arcPlan.overallArc,
  }
}

/**
 * Get emotional palette for mood
 */
export function getEmotionalPalette(
  mood: BranchVariation['mood']
): EmotionalPalette {
  const palettes: Record<typeof mood, EmotionalPalette> = {
    hopeful: {
      primary: ['hope', 'joy', 'determination', 'relief'],
      secondary: ['caution', 'anxiety', 'gratitude', 'pride'],
      transitions: new Map([
        ['hope', ['takes a risk', 'receives good news', 'finds allies']],
        ['joy', ['achieves goal', 'reunites', 'discovers truth']],
      ]),
    },
    tragic: {
      primary: ['despair', 'grief', 'anger', 'resignation'],
      secondary: ['denial', 'bargaining', 'guilt', 'isolation'],
      transitions: new Map([
        ['despair', ['loses everything', 'realizes truth', 'is betrayed']],
        ['grief', ['mourns loss', 'remembers past', 'accepts fate']],
      ]),
    },
    mixed: {
      primary: ['uncertainty', 'conflict', 'bittersweet', 'acceptance'],
      secondary: ['nostalgia', 'regret', 'compromise', 'growth'],
      transitions: new Map([
        ['uncertainty', ['faces choice', 'weighs options', 'seeks advice']],
        ['conflict', ['disagrees', 'confronts', 'struggles']],
      ]),
    },
    dark: {
      primary: ['fear', 'paranoia', 'corruption', 'madness'],
      secondary: ['doubt', 'obsession', 'isolation', 'despair'],
      transitions: new Map([
        ['fear', ['discovers threat', 'is hunted', 'loses protection']],
        ['paranoia', ['mistrusts', 'sees patterns', 'questions reality']],
      ]),
    },
  }
  
  return palettes[mood]
}

/**
 * Validate emotional arc consistency
 */
export function validateEmotionalArc(
  arcPlan: EmotionalArcPlan
): { valid: boolean; issues: string[] } {
  const issues: string[] = []
  
  // Check for jarring transitions
  for (let i = 1; i < arcPlan.sceneArcs.length; i++) {
    const prev = arcPlan.sceneArcs[i - 1]
    const curr = arcPlan.sceneArcs[i]
    
    if (prev.intensity > 8 && curr.intensity < 3) {
      issues.push(`Sharp intensity drop between scenes ${prev.sceneNumber} and ${curr.sceneNumber}`)
    }
  }
  
  // Check overall arc makes sense
  const emotions = arcPlan.sceneArcs.map(a => a.endingEmotion)
  const uniqueEmotions = new Set(emotions).size
  if (uniqueEmotions < 2) {
    issues.push('Emotional arc lacks variation')
  }
  
  return {
    valid: issues.length === 0,
    issues,
  }
}

/**
 * Format emotional arc for display
 */
export function formatEmotionalArc(arcPlan: EmotionalArcPlan): string {
  const parts: string[] = []
  
  parts.push(`## Chapter ${arcPlan.chapterNumber} Emotional Arc`)
  parts.push('')
  parts.push(`**Overall:** ${arcPlan.overallArc}`)
  parts.push('')
  
  parts.push('| Scene | From | To | Intensity | Transition |')
  parts.push('|-------|------|-----|-----------|------------|')
  
  for (const arc of arcPlan.sceneArcs) {
    parts.push(`| ${arc.sceneNumber} | ${arc.startingEmotion} | ${arc.endingEmotion} | ${arc.intensity}/10 | ${arc.transition} |`)
  }
  
  if (arcPlan.turningPoint) {
    parts.push('')
    parts.push(`**Turning Point:** Scene ${arcPlan.turningPoint}`)
  }
  
  parts.push('')
  parts.push(`**Cliffhanger Emotion:** ${arcPlan.cliffhangerEmotion}`)
  
  return parts.join('\n')
}
