/**
 * Anchor analysis cache
 */

import { getDatabase } from '@/lib/db'

const CACHE_PREFIX = 'anchor_analysis:'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

interface CacheEntry {
  eventId: string
  analysis: unknown
  timestamp: number
}

/**
 * Get cached analysis for event
 */
export async function getCachedAnalysis(eventId: string): Promise<unknown | null> {
  try {
    const db = await getDatabase()
    const cached = await db.anchorEventCache?.get(CACHE_PREFIX + eventId)
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.analysis
    }
    return null
  } catch {
    return null
  }
}

/**
 * Cache analysis for event
 */
export async function cacheAnalysis(eventId: string, analysis: unknown): Promise<void> {
  try {
    const db = await getDatabase()
    await db.anchorEventCache?.put({
      id: CACHE_PREFIX + eventId,
      eventId,
      analysis,
      timestamp: Date.now(),
    })
  } catch {
    // Cache failures are non-fatal
  }
}

/**
 * Invalidate cache for manga
 */
export async function invalidateCache(mangaId: string): Promise<void> {
  try {
    const db = await getDatabase()
    // @ts-ignore - custom table method
    await db.anchorEventCache?.where('id').startsWith(CACHE_PREFIX).delete()
  } catch {
    // Ignore cleanup errors
  }
}
