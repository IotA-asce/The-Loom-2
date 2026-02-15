/**
 * User-controlled world state changes
 */

import type { WorldState } from '@/lib/branches/context/world-state'

export interface WorldStateChange {
  id: string
  timestamp: number
  category: 'conflict' | 'resource' | 'rule' | 'fact' | 'relationship'
  change: string
  description: string
  impact: 'minor' | 'moderate' | 'major'
  reversible: boolean
  userDefined: boolean
}

export interface WorldStateManager {
  baseState: WorldState
  changes: WorldStateChange[]
  currentState: WorldState
}

/**
 * Initialize world state manager
 */
export function initializeWorldStateManager(
  baseState: WorldState
): WorldStateManager {
  return {
    baseState,
    changes: [],
    currentState: { ...baseState },
  }
}

/**
 * Add user-controlled world state change
 */
export function addWorldStateChange(
  manager: WorldStateManager,
  change: Omit<WorldStateChange, 'id' | 'timestamp'>
): WorldStateManager {
  const newChange: WorldStateChange = {
    ...change,
    id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  }
  
  const updatedChanges = [...manager.changes, newChange]
  const updatedState = applyChanges(manager.baseState, updatedChanges)
  
  return {
    ...manager,
    changes: updatedChanges,
    currentState: updatedState,
  }
}

/**
 * Remove a world state change
 */
export function removeWorldStateChange(
  manager: WorldStateManager,
  changeId: string
): WorldStateManager {
  const updatedChanges = manager.changes.filter(c => c.id !== changeId)
  const updatedState = applyChanges(manager.baseState, updatedChanges)
  
  return {
    ...manager,
    changes: updatedChanges,
    currentState: updatedState,
  }
}

/**
 * Update a world state change
 */
export function updateWorldStateChange(
  manager: WorldStateManager,
  changeId: string,
  updates: Partial<Omit<WorldStateChange, 'id' | 'timestamp'>>
): WorldStateManager {
  const updatedChanges = manager.changes.map(c => 
    c.id === changeId ? { ...c, ...updates } : c
  )
  const updatedState = applyChanges(manager.baseState, updatedChanges)
  
  return {
    ...manager,
    changes: updatedChanges,
    currentState: updatedState,
  }
}

/**
 * Apply all changes to base state
 */
function applyChanges(
  baseState: WorldState,
  changes: WorldStateChange[]
): WorldState {
  const state: WorldState = {
    ...baseState,
    activeConflicts: [...baseState.activeConflicts],
    keyFacts: [...baseState.keyFacts],
    availableResources: [...baseState.availableResources],
    worldRules: { ...baseState.worldRules },
  }
  
  for (const change of changes) {
    switch (change.category) {
      case 'conflict':
        applyConflictChange(state, change)
        break
      case 'resource':
        applyResourceChange(state, change)
        break
      case 'rule':
        applyRuleChange(state, change)
        break
      case 'fact':
        applyFactChange(state, change)
        break
      case 'relationship':
        applyRelationshipChange(state, change)
        break
    }
  }
  
  return state
}

function applyConflictChange(state: WorldState, change: WorldStateChange): void {
  if (change.change === 'add') {
    state.activeConflicts.push({
      name: change.description,
      description: change.description,
      involvedParties: [],
      stakes: 'To be defined',
      currentStatus: 'Active',
    })
  } else if (change.change === 'resolve') {
    const index = state.activeConflicts.findIndex(c => 
      c.name === change.description || c.description === change.description
    )
    if (index !== -1) {
      state.activeConflicts.splice(index, 1)
    }
  } else if (change.change === 'escalate') {
    const conflict = state.activeConflicts.find(c => 
      c.name === change.description
    )
    if (conflict) {
      conflict.currentStatus = 'Escalating'
    }
  }
}

function applyResourceChange(state: WorldState, change: WorldStateChange): void {
  if (change.change === 'gain') {
    state.availableResources.push({
      name: change.description,
      description: change.description,
      holder: 'Unknown',
      limitations: [],
    })
  } else if (change.change === 'lose') {
    const index = state.availableResources.findIndex(r => 
      r.name === change.description
    )
    if (index !== -1) {
      state.availableResources.splice(index, 1)
    }
  }
}

function applyRuleChange(state: WorldState, change: WorldStateChange): void {
  if (change.change === 'soften') {
    // Move hard rule to soft
    const ruleIndex = state.worldRules.hardRules.indexOf(change.description)
    if (ruleIndex !== -1) {
      state.worldRules.hardRules.splice(ruleIndex, 1)
      state.worldRules.softRules.push(change.description)
    }
  } else if (change.change === 'break') {
    state.worldRules.breakingSoftRules.push(change.description)
  }
}

function applyFactChange(state: WorldState, change: WorldStateChange): void {
  if (change.change === 'reveal') {
    if (!state.keyFacts.includes(change.description)) {
      state.keyFacts.push(change.description)
    }
  } else if (change.change === 'conceal') {
    const index = state.keyFacts.indexOf(change.description)
    if (index !== -1) {
      state.keyFacts.splice(index, 1)
    }
  }
}

function applyRelationshipChange(state: WorldState, _change: WorldStateChange): void {
  // Relationship changes would affect the world state
  // This is handled through character state changes primarily
}

/**
 * Get recent world state changes
 */
export function getRecentChanges(
  manager: WorldStateManager,
  count: number = 5
): WorldStateChange[] {
  return [...manager.changes]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, count)
}

/**
 * Get changes by category
 */
export function getChangesByCategory(
  manager: WorldStateManager,
  category: WorldStateChange['category']
): WorldStateChange[] {
  return manager.changes.filter(c => c.category === category)
}

/**
 * Format world state for context
 */
export function formatWorldStateForContext(
  manager: WorldStateManager
): string {
  const parts: string[] = []
  const state = manager.currentState
  
  parts.push('## Current World State')
  parts.push('')
  
  parts.push(state.description)
  parts.push('')
  
  if (state.activeConflicts.length > 0) {
    parts.push('### Active Conflicts')
    for (const conflict of state.activeConflicts) {
      parts.push(`- ${conflict.name}: ${conflict.description}`)
    }
    parts.push('')
  }
  
  const recentChanges = getRecentChanges(manager, 3)
  if (recentChanges.length > 0) {
    parts.push('### Recent Changes')
    for (const change of recentChanges) {
      parts.push(`- [${change.category}] ${change.description} (${change.impact})`)
    }
    parts.push('')
  }
  
  return parts.join('\n')
}

/**
 * Create preset world state changes
 */
export function createPresetChanges(
  preset: 'war' | 'peace' | 'discovery' | 'disaster'
): Omit<WorldStateChange, 'id' | 'timestamp'>[] {
  const presets: Record<typeof preset, Omit<WorldStateChange, 'id' | 'timestamp'>[]> = {
    war: [
      { category: 'conflict', change: 'add', description: 'Open warfare declared', impact: 'major', reversible: false, userDefined: false },
      { category: 'rule', change: 'soften', description: 'Normal laws of conduct', impact: 'major', reversible: true, userDefined: false },
    ],
    peace: [
      { category: 'conflict', change: 'resolve', description: 'Major conflicts resolved', impact: 'major', reversible: true, userDefined: false },
      { category: 'resource', change: 'gain', description: 'Peace dividends', impact: 'moderate', reversible: false, userDefined: false },
    ],
    discovery: [
      { category: 'fact', change: 'reveal', description: 'Major secret discovered', impact: 'major', reversible: false, userDefined: false },
      { category: 'resource', change: 'gain', description: 'New knowledge resource', impact: 'moderate', reversible: false, userDefined: false },
    ],
    disaster: [
      { category: 'resource', change: 'lose', description: 'Resources destroyed', impact: 'major', reversible: true, userDefined: false },
      { category: 'conflict', change: 'escalate', description: 'Existing conflicts intensify', impact: 'major', reversible: true, userDefined: false },
    ],
  }
  
  return presets[preset] || []
}
