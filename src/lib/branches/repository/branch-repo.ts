/**
 * Branch repository
 * 
 * CRUD operations for branches with versioning support
 */

import { getDatabase } from '@/lib/db'
import type { Branch } from '@/lib/db/schema'

export interface CreateBranchInput {
  mangaId: string
  anchorEventId: string
  alternativeId: string
  premise: Branch['premise']
  characterStates: Branch['characterStates']
  worldState: Branch['worldState']
  trajectory: Branch['trajectory']
  generationParams?: Branch['generationParams']
}

export interface UpdateBranchInput {
  premise?: Branch['premise']
  characterStates?: Branch['characterStates']
  worldState?: Branch['worldState']
  trajectory?: Branch['trajectory']
  status?: Branch['status']
  qualityScore?: number
  userPreference?: number
}

/**
 * Create a new branch
 */
export async function createBranch(input: CreateBranchInput): Promise<Branch> {
  const db = await getDatabase()
  
  const branch: Branch = {
    ...input,
    status: 'generated',
    qualityScore: 0,
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  
  const id = await db.branches.add(branch)
  return { ...branch, id: id as string }
}

/**
 * Get branch by ID
 */
export async function getBranch(id: string): Promise<Branch | undefined> {
  const db = await getDatabase()
  return db.branches.get(id)
}

/**
 * Update branch
 */
export async function updateBranch(
  id: string,
  input: UpdateBranchInput
): Promise<void> {
  const db = await getDatabase()
  
  // Get current branch to increment version
  const current = await db.branches.get(id)
  const newVersion = current ? current.version + 1 : 1
  
  await db.branches.update(id, {
    ...input,
    version: newVersion,
    updatedAt: Date.now(),
  })
}

/**
 * Delete branch
 */
export async function deleteBranch(id: string): Promise<void> {
  const db = await getDatabase()
  await db.branches.delete(id)
}

/**
 * Get branches by manga ID
 */
export async function getBranchesByManga(
  mangaId: string,
  status?: Branch['status']
): Promise<Branch[]> {
  const db = await getDatabase()
  
  if (status) {
    return db.branches.where({ mangaId, status }).toArray()
  }
  return db.branches.where('mangaId').equals(mangaId).toArray()
}

/**
 * Get branches by anchor event
 */
export async function getBranchesByAnchor(
  anchorEventId: string
): Promise<Branch[]> {
  const db = await getDatabase()
  return db.branches.where({ anchorEventId }).toArray()
}

/**
 * Get selected branch for anchor
 */
export async function getSelectedBranch(
  anchorEventId: string
): Promise<Branch | undefined> {
  const db = await getDatabase()
  const branches = await db.branches.where({ 
    anchorEventId,
    status: 'selected'
  }).toArray()
  return branches[0]
}

/**
 * Select a branch (mark as the chosen path)
 */
export async function selectBranch(id: string): Promise<void> {
  const db = await getDatabase()
  const branch = await db.branches.get(id)
  
  if (!branch) {
    throw new Error(`Branch ${id} not found`)
  }
  
  // Deselect any currently selected branch for this anchor
  await db.branches
    .where({ anchorEventId: branch.anchorEventId, status: 'selected' })
    .modify({ status: 'review' })
  
  // Select this branch
  await db.branches.update(id, {
    status: 'selected',
    updatedAt: Date.now(),
  })
}

/**
 * Update branch status
 */
export async function updateBranchStatus(
  id: string,
  status: Branch['status']
): Promise<void> {
  const db = await getDatabase()
  await db.branches.update(id, {
    status,
    updatedAt: Date.now(),
  })
}

/**
 * Update user preference rating
 */
export async function rateBranch(
  id: string,
  rating: number
): Promise<void> {
  const db = await getDatabase()
  await db.branches.update(id, {
    userPreference: rating,
    updatedAt: Date.now(),
  })
}

/**
 * Get branch versions (for a specific anchor + alternative combination)
 */
export async function getBranchVersions(
  anchorEventId: string,
  alternativeId: string
): Promise<Branch[]> {
  const db = await getDatabase()
  return db.branches
    .where({ anchorEventId, alternativeId })
    .sortBy('version')
}

/**
 * Get latest version of a branch
 */
export async function getLatestBranchVersion(
  anchorEventId: string,
  alternativeId: string
): Promise<Branch | undefined> {
  const versions = await getBranchVersions(anchorEventId, alternativeId)
  return versions[versions.length - 1]
}

/**
 * Create new version of existing branch
 */
export async function createBranchVersion(
  existingBranchId: string,
  updates: UpdateBranchInput
): Promise<Branch> {
  const db = await getDatabase()
  const existing = await db.branches.get(existingBranchId)
  
  if (!existing) {
    throw new Error(`Branch ${existingBranchId} not found`)
  }
  
  const newBranch: Branch = {
    ...existing,
    ...updates,
    id: undefined, // Will be auto-generated
    parentBranchId: existing.id,
    version: existing.version + 1,
    status: 'generated',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  
  const id = await db.branches.add(newBranch)
  return { ...newBranch, id: id as string }
}

/**
 * Get branches by quality score
 */
export async function getHighQualityBranches(
  mangaId: string,
  minScore: number = 0.7
): Promise<Branch[]> {
  const db = await getDatabase()
  return db.branches
    .where('mangaId')
    .equals(mangaId)
    .filter(b => b.qualityScore >= minScore)
    .toArray()
}

/**
 * Get user-preferred branches
 */
export async function getUserPreferredBranches(
  mangaId: string,
  minRating: number = 4
): Promise<Branch[]> {
  const db = await getDatabase()
  return db.branches
    .where('mangaId')
    .equals(mangaId)
    .filter(b => (b.userPreference || 0) >= minRating)
    .toArray()
}

/**
 * Delete all branches for an anchor
 */
export async function deleteBranchesByAnchor(
  anchorEventId: string
): Promise<void> {
  const db = await getDatabase()
  await db.branches.where({ anchorEventId }).delete()
}

/**
 * Count branches by status
 */
export async function countBranchesByStatus(
  mangaId: string
): Promise<Record<Branch['status'], number>> {
  const db = await getDatabase()
  const branches = await db.branches.where({ mangaId }).toArray()
  
  const counts: Record<string, number> = {
    generated: 0,
    review: 0,
    selected: 0,
    writing: 0,
    complete: 0,
  }
  
  for (const branch of branches) {
    counts[branch.status] = (counts[branch.status] || 0) + 1
  }
  
  return counts as Record<Branch['status'], number>
}
