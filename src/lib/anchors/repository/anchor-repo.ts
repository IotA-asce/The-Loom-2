/**
 * Anchor Event Repository
 * 
 * CRUD operations for anchor events with query helpers
 */

import { getDatabase } from '@/lib/db'
import type { AnchorEvent, AlternativeOutcome } from '@/lib/db/schema'

export interface CreateAnchorInput {
  mangaId: string
  storylineId: string
  timelineEventId: string
  type: AnchorEvent['type']
  title: string
  description: string
  pageNumber: number
  characters: string[]
  significance: AnchorEvent['significance']
  alternatives: AlternativeOutcome[]
  branchingPotential: AnchorEvent['branchingPotential']
  confidence: number
}

export interface UpdateAnchorInput {
  title?: string
  description?: string
  type?: AnchorEvent['type']
  significance?: AnchorEvent['significance']
  status?: AnchorEvent['status']
  alternatives?: AlternativeOutcome[]
  branchingPotential?: AnchorEvent['branchingPotential']
  userNotes?: string
  userRating?: number
}

/**
 * Create a new anchor event
 */
export async function createAnchor(input: CreateAnchorInput): Promise<AnchorEvent> {
  const db = await getDatabase()
  
  const anchor: AnchorEvent = {
    ...input,
    status: 'detected',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  
  const id = await db.anchorEvents.add(anchor)
  return { ...anchor, id: id as string }
}

/**
 * Get anchor by ID
 */
export async function getAnchor(id: string): Promise<AnchorEvent | undefined> {
  const db = await getDatabase()
  return db.anchorEvents.get(id)
}

/**
 * Update anchor event
 */
export async function updateAnchor(
  id: string,
  input: UpdateAnchorInput
): Promise<void> {
  const db = await getDatabase()
  await db.anchorEvents.update(id, {
    ...input,
    updatedAt: Date.now(),
  })
}

/**
 * Delete anchor event
 */
export async function deleteAnchor(id: string): Promise<void> {
  const db = await getDatabase()
  await db.anchorEvents.delete(id)
}

/**
 * Get anchors by manga ID
 */
export async function getAnchorsByManga(
  mangaId: string,
  status?: AnchorEvent['status']
): Promise<AnchorEvent[]> {
  const db = await getDatabase()
  
  if (status) {
    return db.anchorEvents.where({ mangaId, status }).toArray()
  }
  return db.anchorEvents.where('mangaId').equals(mangaId).toArray()
}

/**
 * Get anchors by storyline
 */
export async function getAnchorsByStoryline(
  storylineId: string
): Promise<AnchorEvent[]> {
  const db = await getDatabase()
  return db.anchorEvents.where({ storylineId }).toArray()
}

/**
 * Get high-confidence anchors
 */
export async function getHighConfidenceAnchors(
  mangaId: string,
  minConfidence: number = 0.7
): Promise<AnchorEvent[]> {
  const db = await getDatabase()
  return db.anchorEvents
    .where('mangaId')
    .equals(mangaId)
    .filter(a => a.confidence >= minConfidence)
    .toArray()
}

/**
 * Get anchors by type
 */
export async function getAnchorsByType(
  mangaId: string,
  type: AnchorEvent['type']
): Promise<AnchorEvent[]> {
  const db = await getDatabase()
  return db.anchorEvents.where({ mangaId, type }).toArray()
}

/**
 * Approve anchor detection
 */
export async function approveAnchor(id: string): Promise<void> {
  await updateAnchor(id, { status: 'approved' })
}

/**
 * Reject anchor detection
 */
export async function rejectAnchor(id: string): Promise<void> {
  await updateAnchor(id, { status: 'rejected' })
}
