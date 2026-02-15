/**
 * Character state tracking across batches
 * Maintains consistent character data through multi-batch analysis
 */

import { Character } from '@/lib/db/schema'

export interface CharacterState {
  characterId: string
  physicalState: 'healthy' | 'injured' | 'incapacitated' | 'unknown'
  emotionalState: string
  location?: string
  possessions: string[]
  knowledge: string[]
  goals: string[]
  lastUpdated: number // batch index
}

export interface StateTransition {
  from: Partial<CharacterState>
  to: Partial<CharacterState>
  pageNumber: number
  cause: string
}

/**
 * Character state manager
 */
export class CharacterStateManager {
  private states = new Map<string, CharacterState>()
  private transitions = new Map<string, StateTransition[]>()
  private characters: Map<string, Character>
  
  constructor(characters: Character[]) {
    this.characters = new Map(characters.map(c => [c.id, c]))
  }
  
  /**
   * Initialize state for a character
   */
  initializeState(characterId: string, batchIndex: number): CharacterState {
    const character = this.characters.get(characterId)
    
    const state: CharacterState = {
      characterId,
      physicalState: 'healthy',
      emotionalState: 'neutral',
      possessions: [],
      knowledge: [],
      goals: [],
      lastUpdated: batchIndex,
    }
    
    this.states.set(characterId, state)
    this.transitions.set(characterId, [])
    
    return state
  }
  
  /**
   * Get current state
   */
  getState(characterId: string): CharacterState | undefined {
    return this.states.get(characterId)
  }
  
  /**
   * Update character state
   */
  updateState(
    characterId: string,
    updates: Partial<Omit<CharacterState, 'characterId' | 'lastUpdated'>>,
    batchIndex: number,
    pageNumber?: number
  ): CharacterState {
    let state = this.states.get(characterId)
    
    if (!state) {
      state = this.initializeState(characterId, batchIndex)
    }
    
    // Track transition
    const transition: StateTransition = {
      from: {},
      to: {},
      pageNumber: pageNumber || 0,
      cause: updates.emotionalState || 'state_change',
    }
    
    // Apply updates and track changes
    for (const [key, value] of Object.entries(updates)) {
      const k = key as keyof CharacterState
      if (state[k] !== value && k !== 'characterId' && k !== 'lastUpdated') {
        // @ts-expect-error - dynamic property access
        transition.from[key] = state[k]
        // @ts-expect-error - dynamic property access
        transition.to[key] = value
        // @ts-expect-error - dynamic property access
        state[key] = value
      }
    }
    
    state.lastUpdated = batchIndex
    
    // Store transition if something changed
    if (Object.keys(transition.from).length > 0) {
      const charTransitions = this.transitions.get(characterId) || []
      charTransitions.push(transition)
      this.transitions.set(characterId, charTransitions)
    }
    
    this.states.set(characterId, state)
    return state
  }
  
  /**
   * Get state transitions for a character
   */
  getTransitions(characterId: string): StateTransition[] {
    return this.transitions.get(characterId) || []
  }
  
  /**
   * Get all tracked states
   */
  getAllStates(): CharacterState[] {
    return Array.from(this.states.values())
  }
  
  /**
   * Merge state updates from batch analysis
   */
  mergeBatchStates(
    batchResults: Map<string, Partial<CharacterState>>,
    batchIndex: number
  ): Map<string, CharacterState> {
    const updated = new Map<string, CharacterState>()
    
    for (const [characterId, stateUpdate] of batchResults) {
      const newState = this.updateState(characterId, stateUpdate, batchIndex)
      updated.set(characterId, newState)
    }
    
    return updated
  }
  
  /**
   * Get state at specific batch (historical)
   */
  getStateAtBatch(characterId: string, batchIndex: number): CharacterState | undefined {
    const state = this.states.get(characterId)
    if (!state) return undefined
    
    // If current state is after requested batch, reconstruct
    if (state.lastUpdated > batchIndex) {
      return this.reconstructStateAtBatch(characterId, batchIndex)
    }
    
    return state
  }
  
  /**
   * Reconstruct state at specific batch from transitions
   */
  private reconstructStateAtBatch(
    characterId: string,
    batchIndex: number
  ): CharacterState | undefined {
    const initialState = this.initializeState(characterId, 0)
    const transitions = this.transitions.get(characterId) || []
    
    let currentState: CharacterState = { ...initialState }
    
    for (const transition of transitions) {
      // Approximate batch from page number
      const transitionBatch = Math.floor((transition.pageNumber || 0) / 10)
      
      if (transitionBatch > batchIndex) {
        break
      }
      
      Object.assign(currentState, transition.to)
    }
    
    currentState.lastUpdated = batchIndex
    return currentState
  }
  
  /**
   * Export state summary for a character
   */
  exportStateSummary(characterId: string): {
    character: Character | undefined
    currentState: CharacterState | undefined
    transitionCount: number
    keyChanges: StateTransition[]
  } {
    return {
      character: this.characters.get(characterId),
      currentState: this.states.get(characterId),
      transitionCount: this.transitions.get(characterId)?.length || 0,
      keyChanges: this.transitions.get(characterId)?.slice(-5) || [],
    }
  }
}

/**
 * State consistency checker
 */
export class StateConsistencyChecker {
  private states: CharacterStateManager
  
  constructor(states: CharacterStateManager) {
    this.states = states
  }
  
  /**
   * Check for state inconsistencies
   */
  checkConsistency(): Array<{
    characterId: string
    issue: string
    severity: 'low' | 'medium' | 'high'
  }> {
    const issues: Array<{ characterId: string; issue: string; severity: 'low' | 'medium' | 'high' }> = []
    
    for (const state of this.states.getAllStates()) {
      // Check for impossible states
      if (state.physicalState === 'incapacitated' && state.emotionalState === 'energetic') {
        issues.push({
          characterId: state.characterId,
          issue: 'Incapacitated character shown as energetic',
          severity: 'medium',
        })
      }
      
      // Check for sudden knowledge changes
      const transitions = this.states.getTransitions(state.characterId)
      for (let i = 1; i < transitions.length; i++) {
        const prev = transitions[i - 1]
        const curr = transitions[i]
        
        if (prev.to.knowledge && curr.from.knowledge) {
          const knowledgeDiff = (curr.from.knowledge as string[]).filter(
            k => !(prev.to.knowledge as string[]).includes(k)
          )
          
          if (knowledgeDiff.length > 3) {
            issues.push({
              characterId: state.characterId,
              issue: `Sudden knowledge acquisition: ${knowledgeDiff.join(', ')}`,
              severity: 'low',
            })
          }
        }
      }
    }
    
    return issues
  }
}
