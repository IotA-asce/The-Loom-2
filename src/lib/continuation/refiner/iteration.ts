/**
 * Unlimited refinement iteration system
 */

import type { RefinementTarget, RefinementScope } from './scopes'

export interface RefinementIteration {
  id: string
  number: number
  target: RefinementTarget
  instruction: string
  previousContent: string
  newContent: string
  changes: Change[]
  timestamp: Date
  userApproved: boolean
}

export interface Change {
  id: string
  type: 'insert' | 'delete' | 'replace'
  position: number
  original?: string
  replacement?: string
  description: string
}

export interface RefinementSession {
  id: string
  chapterId: string
  iterations: RefinementIteration[]
  currentIteration: number
  status: 'active' | 'paused' | 'completed' | 'abandoned'
  createdAt: Date
  updatedAt: Date
}

/**
 * Create a new refinement session
 */
export function createRefinementSession(chapterId: string): RefinementSession {
  return {
    id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    chapterId,
    iterations: [],
    currentIteration: 0,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Add iteration to session
 */
export function addIteration(
  session: RefinementSession,
  target: RefinementTarget,
  instruction: string,
  previousContent: string,
  newContent: string
): RefinementSession {
  const iteration: RefinementIteration = {
    id: `iter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    number: session.iterations.length + 1,
    target,
    instruction,
    previousContent,
    newContent,
    changes: computeChanges(previousContent, newContent),
    timestamp: new Date(),
    userApproved: false,
  }
  
  return {
    ...session,
    iterations: [...session.iterations, iteration],
    currentIteration: session.iterations.length + 1,
    updatedAt: new Date(),
  }
}

function computeChanges(original: string, modified: string): Change[] {
  const changes: Change[] = []
  
  // Simple diff - would use proper diff algorithm in production
  if (original === modified) {
    return changes
  }
  
  // Find differences (simplified)
  const maxLength = Math.max(original.length, modified.length)
  let i = 0
  
  while (i < maxLength) {
    if (original[i] !== modified[i]) {
      // Found a difference
      const start = i
      
      // Find end of change
      while (i < maxLength && original[i] !== modified[i]) {
        i++
      }
      
      changes.push({
        id: `change-${start}`,
        type: 'replace',
        position: start,
        original: original.slice(start, i),
        replacement: modified.slice(start, i),
        description: `Changed at position ${start}`,
      })
    } else {
      i++
    }
  }
  
  return changes
}

/**
 * Approve an iteration
 */
export function approveIteration(
  session: RefinementSession,
  iterationNumber: number
): RefinementSession {
  const iterations = session.iterations.map(iter => 
    iter.number === iterationNumber
      ? { ...iter, userApproved: true }
      : iter
  )
  
  return {
    ...session,
    iterations,
    updatedAt: new Date(),
  }
}

/**
 * Reject an iteration and revert
 */
export function rejectIteration(
  session: RefinementSession,
  iterationNumber: number
): { session: RefinementSession; revertedTo: number } {
  // Find the last approved iteration before this one
  let revertedTo = 0
  
  for (let i = iterationNumber - 2; i >= 0; i--) {
    if (session.iterations[i]?.userApproved) {
      revertedTo = i + 1
      break
    }
  }
  
  const iterations = session.iterations.slice(0, revertedTo)
  
  return {
    session: {
      ...session,
      iterations,
      currentIteration: revertedTo,
      updatedAt: new Date(),
    },
    revertedTo,
  }
}

/**
 * Compare two iterations
 */
export function compareIterations(
  session: RefinementSession,
  iterationA: number,
  iterationB: number
): { a: RefinementIteration | null; b: RefinementIteration | null; differences: Change[] } {
  const iterA = session.iterations.find(i => i.number === iterationA) || null
  const iterB = session.iterations.find(i => i.number === iterationB) || null
  
  if (!iterA || !iterB) {
    return { a: iterA, b: iterB, differences: [] }
  }
  
  const differences = computeChanges(iterA.newContent, iterB.newContent)
  
  return { a: iterA, b: iterB, differences }
}

/**
 * Get iteration history
 */
export function getIterationHistory(
  session: RefinementSession
): RefinementIteration[] {
  return [...session.iterations].sort((a, b) => a.number - b.number)
}

/**
 * Get latest approved content
 */
export function getLatestApprovedContent(session: RefinementSession): string {
  for (let i = session.iterations.length - 1; i >= 0; i--) {
    if (session.iterations[i].userApproved) {
      return session.iterations[i].newContent
    }
  }
  
  // Return original content from first iteration
  return session.iterations[0]?.previousContent || ''
}

/**
 * Check if session has unapproved iterations
 */
export function hasUnapprovedIterations(session: RefinementSession): boolean {
  return session.iterations.some(iter => !iter.userApproved)
}

/**
 * Complete session
 */
export function completeSession(session: RefinementSession): RefinementSession {
  return {
    ...session,
    status: 'completed',
    updatedAt: new Date(),
  }
}

/**
 * Abandon session
 */
export function abandonSession(session: RefinementSession): RefinementSession {
  return {
    ...session,
    status: 'abandoned',
    updatedAt: new Date(),
  }
}

/**
 * Get session statistics
 */
export function getSessionStats(session: RefinementSession): {
  totalIterations: number
  approvedIterations: number
  rejectedIterations: number
  averageChangeSize: number
} {
  const totalChanges = session.iterations.reduce(
    (sum, iter) => sum + iter.changes.length,
    0
  )
  
  return {
    totalIterations: session.iterations.length,
    approvedIterations: session.iterations.filter(i => i.userApproved).length,
    rejectedIterations: session.iterations.filter(i => !i.userApproved).length,
    averageChangeSize: session.iterations.length > 0 
      ? totalChanges / session.iterations.length 
      : 0,
  }
}
