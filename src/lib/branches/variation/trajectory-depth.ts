/**
 * Adaptive trajectory depth
 */

import type { BranchVariation } from './generator'
import type { AnchorEvent } from '@/lib/db/schema'

export interface TrajectoryDepth {
  level: 'shallow' | 'moderate' | 'deep'
  chapterCount: number
  detailLevel: 'summary' | 'outline' | 'detailed'
  eventGranularity: 'major' | 'significant' | 'all'
}

/**
 * Calculate adaptive trajectory depth based on factors
 */
export function calculateTrajectoryDepth(
  anchorSignificance: AnchorEvent['significance'],
  consequenceType: BranchVariation['consequenceType'],
  complexity: BranchVariation['complexity'],
  userPreference?: TrajectoryDepth['level']
): TrajectoryDepth {
  // Base depth from anchor significance
  let level: TrajectoryDepth['level'] = 'moderate'
  
  switch (anchorSignificance) {
    case 'critical':
      level = 'deep'
      break
    case 'major':
      level = 'moderate'
      break
    case 'moderate':
      level = userPreference === 'deep' ? 'moderate' : 'shallow'
      break
    case 'minor':
      level = 'shallow'
      break
  }
  
  // Adjust for consequence type
  if (consequenceType === 'cosmic') {
    level = level === 'shallow' ? 'moderate' : 'deep'
  }
  
  // Adjust for complexity
  if (complexity === 'complex') {
    level = level === 'shallow' ? 'moderate' : 'deep'
  }
  
  // Apply user override if provided
  if (userPreference) {
    level = userPreference
  }
  
  return getDepthConfig(level)
}

function getDepthConfig(level: TrajectoryDepth['level']): TrajectoryDepth {
  const configs: Record<TrajectoryDepth['level'], TrajectoryDepth> = {
    shallow: {
      level: 'shallow',
      chapterCount: 3,
      detailLevel: 'summary',
      eventGranularity: 'major',
    },
    moderate: {
      level: 'moderate',
      chapterCount: 5,
      detailLevel: 'outline',
      eventGranularity: 'significant',
    },
    deep: {
      level: 'deep',
      chapterCount: 8,
      detailLevel: 'detailed',
      eventGranularity: 'all',
    },
  }
  
  return configs[level]
}

/**
 * Expand trajectory based on depth level
 */
export function expandTrajectory(
  baseTrajectory: BranchVariation['trajectory'],
  depth: TrajectoryDepth
): BranchVariation['trajectory'] {
  return {
    ...baseTrajectory,
    keyEvents: expandEvents(baseTrajectory.keyEvents, depth),
  }
}

function expandEvents(
  events: string[],
  depth: TrajectoryDepth
): string[] {
  if (depth.eventGranularity === 'major') {
    // Keep only major events (first and last)
    return [events[0], events[events.length - 1]]
  }
  
  if (depth.eventGranularity === 'all') {
    // Add intermediate events
    const expanded: string[] = []
    for (let i = 0; i < events.length; i++) {
      expanded.push(events[i])
      if (i < events.length - 1) {
        expanded.push(`Transition: ${events[i]} leads to ${events[i + 1]}`)
      }
    }
    return expanded
  }
  
  // 'significant' - keep as is
  return events
}

/**
 * Generate detailed outline based on depth
 */
export function generateDetailedOutline(
  variation: BranchVariation,
  depth: TrajectoryDepth
): string[] {
  const outline: string[] = []
  const { trajectory, characterArcs } = variation
  
  // Title and summary
  outline.push(`# ${variation.premise.title}`)
  outline.push('')
  outline.push(`## Summary`)
  outline.push(trajectory.summary)
  outline.push('')
  
  // Character arcs
  outline.push(`## Character Arcs`)
  for (const arc of characterArcs.slice(0, depth.level === 'deep' ? undefined : 3)) {
    outline.push(`### ${arc.characterName}`)
    outline.push(`- Start: ${arc.startingState}`)
    outline.push(`- Arc: ${arc.arcDescription}`)
    outline.push(`- End: ${arc.endingState}`)
    outline.push('')
  }
  
  // Key events with appropriate detail
  outline.push(`## Key Events`)
  const events = expandEvents(trajectory.keyEvents, depth)
  for (let i = 0; i < events.length; i++) {
    if (depth.detailLevel === 'detailed') {
      outline.push(`### Event ${i + 1}: ${events[i]}`)
      outline.push(`Setting: [To be determined]`)
      outline.push(`Characters involved: [To be determined]`)
      outline.push(`Emotional beat: [To be determined]`)
      outline.push('')
    } else if (depth.detailLevel === 'outline') {
      outline.push(`${i + 1}. ${events[i]}`)
    } else {
      outline.push(`- ${events[i]}`)
    }
  }
  
  // Turning points
  if (depth.level !== 'shallow') {
    outline.push('')
    outline.push(`## Turning Points`)
    for (const point of trajectory.turningPoints) {
      outline.push(`- ${point}`)
    }
  }
  
  // Climax and resolution
  outline.push('')
  outline.push(`## Climax`)
  outline.push(trajectory.climax)
  
  if (depth.level === 'deep') {
    outline.push('')
    outline.push(`### Climax Details`)
    outline.push(`- Emotional intensity: High`)
    outline.push(`- Stakes: [To be determined]`)
    outline.push(`- Confrontation: [To be determined]`)
  }
  
  outline.push('')
  outline.push(`## Resolution`)
  outline.push(`Type: ${trajectory.endingType}`)
  outline.push(trajectory.resolution)
  
  return outline
}

/**
 * Adjust depth based on user feedback
 */
export function adjustDepthFromFeedback(
  currentDepth: TrajectoryDepth,
  feedback: 'more-detail' | 'less-detail' | 'perfect'
): TrajectoryDepth {
  if (feedback === 'perfect') {
    return currentDepth
  }
  
  const levels: TrajectoryDepth['level'][] = ['shallow', 'moderate', 'deep']
  const currentIndex = levels.indexOf(currentDepth.level)
  
  if (feedback === 'more-detail' && currentIndex < levels.length - 1) {
    return getDepthConfig(levels[currentIndex + 1])
  }
  
  if (feedback === 'less-detail' && currentIndex > 0) {
    return getDepthConfig(levels[currentIndex - 1])
  }
  
  return currentDepth
}
