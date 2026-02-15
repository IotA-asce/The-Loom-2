/**
 * Raw response storage
 * Persists original LLM responses for debugging and auditing
 */

import { database } from '@/lib/db/database'

export interface RawResponseEntry {
  id?: string
  mangaId: string
  stage: string
  batchIndex: number
  rawResponse: string
  extractedData?: unknown
  parsingErrors?: string[]
  timestamp: number
  model: string
  provider: string
  tokenUsage?: {
    prompt: number
    completion: number
  }
}

export interface StorageOptions {
  maxEntriesPerManga: number
  retentionDays: number
  compressOld: boolean
}

export const DEFAULT_STORAGE_OPTIONS: StorageOptions = {
  maxEntriesPerManga: 100,
  retentionDays: 30,
  compressOld: true,
}

/**
 * Raw response storage manager
 */
export class RawResponseStorage {
  private options: StorageOptions

  constructor(options: Partial<StorageOptions> = {}) {
    this.options = { ...DEFAULT_STORAGE_OPTIONS, ...options }
  }

  /**
   * Store a raw response
   */
  async store(entry: Omit<RawResponseEntry, 'id' | 'timestamp'>): Promise<string> {
    const db = await database.getDb()
    
    const fullEntry: RawResponseEntry = {
      ...entry,
      timestamp: Date.now(),
    }

    // Check storage limits
    await this.enforceStorageLimits(entry.mangaId)

    const id = await db.rawResponses.add(fullEntry)
    return String(id)
  }

  /**
   * Get raw response by ID
   */
  async get(id: string): Promise<RawResponseEntry | undefined> {
    const db = await database.getDb()
    return db.rawResponses.get(id)
  }

  /**
   * Get all responses for a manga
   */
  async getForManga(mangaId: string): Promise<RawResponseEntry[]> {
    const db = await database.getDb()
    return db.rawResponses
      .where('mangaId')
      .equals(mangaId)
      .sortBy('timestamp')
  }

  /**
   * Get responses for a specific stage
   */
  async getForStage(
    mangaId: string,
    stage: string
  ): Promise<RawResponseEntry[]> {
    const db = await database.getDb()
    return db.rawResponses
      .where({ mangaId, stage })
      .sortBy('timestamp')
  }

  /**
   * Delete old responses
   */
  async cleanup(mangaId?: string): Promise<number> {
    const db = await database.getDb()
    const cutoff = Date.now() - this.options.retentionDays * 24 * 60 * 60 * 1000

    let collection = db.rawResponses.toCollection()
    
    if (mangaId) {
      collection = db.rawResponses.where('mangaId').equals(mangaId)
    }

    const oldEntries = await collection
      .filter(entry => entry.timestamp < cutoff)
      .primaryKeys()

    await db.rawResponses.bulkDelete(oldEntries)
    return oldEntries.length
  }

  /**
   * Enforce storage limits per manga
   */
  private async enforceStorageLimits(mangaId: string): Promise<void> {
    const db = await database.getDb()
    
    const count = await db.rawResponses
      .where('mangaId')
      .equals(mangaId)
      .count()

    if (count >= this.options.maxEntriesPerManga) {
      // Delete oldest entries
      const oldest = await db.rawResponses
        .where('mangaId')
        .equals(mangaId)
        .sortBy('timestamp')

      const toDelete = oldest.slice(0, count - this.options.maxEntriesPerManga + 1)
      await db.rawResponses.bulkDelete(toDelete.map(e => e.id!))
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(mangaId?: string): Promise<{
    totalEntries: number
    totalSize: number
    oldestEntry?: number
    newestEntry?: number
  }> {
    const db = await database.getDb()
    
    let collection = db.rawResponses.toCollection()
    if (mangaId) {
      collection = db.rawResponses.where('mangaId').equals(mangaId)
    }

    const entries = await collection.toArray()
    
    let totalSize = 0
    let oldestEntry: number | undefined
    let newestEntry: number | undefined

    for (const entry of entries) {
      totalSize += entry.rawResponse.length * 2 // Approximate UTF-16 size
      
      if (!oldestEntry || entry.timestamp < oldestEntry) {
        oldestEntry = entry.timestamp
      }
      if (!newestEntry || entry.timestamp > newestEntry) {
        newestEntry = entry.timestamp
      }
    }

    return {
      totalEntries: entries.length,
      totalSize,
      oldestEntry,
      newestEntry,
    }
  }

  /**
   * Export responses for debugging
   */
  async exportForDebugging(mangaId: string): Promise<{
    mangaId: string
    exportedAt: string
    entries: RawResponseEntry[]
  }> {
    const entries = await this.getForManga(mangaId)
    
    return {
      mangaId,
      exportedAt: new Date().toISOString(),
      entries,
    }
  }
}

/**
 * Global storage instance
 */
export const rawResponseStorage = new RawResponseStorage()

/**
 * Quick store function
 */
export async function storeRawResponse(
  entry: Omit<RawResponseEntry, 'id' | 'timestamp'>
): Promise<string> {
  return rawResponseStorage.store(entry)
}
