/**
 * Dexie Database Setup
 * 
 * Main database configuration using Dexie.js for IndexedDB.
 * Defines all tables, indexes, and database versioning.
 */

import Dexie, { type Table } from 'dexie';
import type {
  Manga,
  Storyline,
  AnchorEvent,
  Branch,
  Chapter,
} from './schema';
import type { RawResponseEntry } from '@/lib/analysis/parser/storage';

/**
 * Database version constant
 */
export const DATABASE_VERSION = 1;

/**
 * Database name
 */
export const DATABASE_NAME = 'TheLoom2DB';

/**
 * The Loom 2 Database class
 */
export class LoomDatabase extends Dexie {
  // Tables
  manga!: Table<Manga, string>;
  storylines!: Table<Storyline, string>;
  anchorEvents!: Table<AnchorEvent, string>;
  branches!: Table<Branch, string>;
  chapters!: Table<Chapter, string>;
  rawResponses!: Table<RawResponseEntry, string>;

  constructor() {
    super(DATABASE_NAME);
    
    this.initializeSchema();
    this.setupHooks();
  }

  /**
   * Initialize database schema
   */
  private initializeSchema(): void {
    this.version(DATABASE_VERSION).stores({
      // Manga table with indexes
      manga: `
        ++id,
        title,
        author,
        status,
        createdAt,
        updatedAt,
        [title+author],
        [status+updatedAt]
      `,
      
      // Storyline table with indexes
      storylines: `
        ++id,
        mangaId,
        status,
        createdAt,
        updatedAt,
        [mangaId+status],
        [mangaId+createdAt]
      `,
      
      // Anchor events table with indexes
      anchorEvents: `
        ++id,
        mangaId,
        storylineId,
        type,
        status,
        confidence,
        pageNumber,
        [mangaId+status],
        [storylineId+status],
        [mangaId+type],
        [mangaId+confidence]
      `,
      
      // Branches table with indexes
      branches: `
        ++id,
        mangaId,
        anchorEventId,
        status,
        createdAt,
        [mangaId+anchorEventId],
        [anchorEventId+status],
        [mangaId+status]
      `,
      
      // Chapters table with indexes
      chapters: `
        ++id,
        mangaId,
        branchId,
        order,
        status,
        createdAt,
        [mangaId+order],
        [branchId+order],
        [mangaId+branchId+order]
      `,
      
      // Raw LLM responses for debugging
      rawResponses: `
        ++id,
        mangaId,
        stage,
        batchIndex,
        timestamp,
        [mangaId+stage],
        [mangaId+timestamp]
      `,
    });
  }

  /**
   * Setup database hooks for automatic timestamp updates
   */
  private setupHooks(): void {
    // Manga hooks
    this.manga.hook('creating', (_primKey, obj) => {
      obj.createdAt = Date.now();
      obj.updatedAt = Date.now();
    });
    this.manga.hook('updating', (modifications) => {
      return { ...modifications, updatedAt: Date.now() };
    });

    // Storyline hooks
    this.storylines.hook('creating', (_primKey, obj) => {
      obj.createdAt = Date.now();
      obj.updatedAt = Date.now();
    });
    this.storylines.hook('updating', (modifications) => {
      return { ...modifications, updatedAt: Date.now() };
    });

    // Anchor events hooks
    this.anchorEvents.hook('creating', (_primKey, obj) => {
      obj.createdAt = Date.now();
      obj.updatedAt = Date.now();
    });
    this.anchorEvents.hook('updating', (modifications) => {
      return { ...modifications, updatedAt: Date.now() };
    });

    // Branch hooks
    this.branches.hook('creating', (_primKey, obj) => {
      obj.createdAt = Date.now();
      obj.updatedAt = Date.now();
    });
    this.branches.hook('updating', (modifications) => {
      return { ...modifications, updatedAt: Date.now() };
    });

    // Chapter hooks
    this.chapters.hook('creating', (_primKey, obj) => {
      obj.createdAt = Date.now();
      obj.updatedAt = Date.now();
    });
    this.chapters.hook('updating', (modifications) => {
      return { ...modifications, updatedAt: Date.now() };
    });
  }

  /**
   * Reset database (useful for testing)
   */
  async reset(): Promise<void> {
    await this.delete();
    await this.open();
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    manga: number;
    storylines: number;
    anchorEvents: number;
    branches: number;
    chapters: number;
    totalSize: number;
  }> {
    const [
      mangaCount,
      storylinesCount,
      anchorEventsCount,
      branchesCount,
      chaptersCount,
    ] = await Promise.all([
      this.manga.count(),
      this.storylines.count(),
      this.anchorEvents.count(),
      this.branches.count(),
      this.chapters.count(),
    ]);

    return {
      manga: mangaCount,
      storylines: storylinesCount,
      anchorEvents: anchorEventsCount,
      branches: branchesCount,
      chapters: chaptersCount,
      totalSize: mangaCount + storylinesCount + anchorEventsCount + branchesCount + chaptersCount,
    };
  }

  /**
   * Export all data
   */
  async export(): Promise<{
    version: number;
    timestamp: number;
    data: {
      manga: Manga[];
      storylines: Storyline[];
      anchorEvents: AnchorEvent[];
      branches: Branch[];
      chapters: Chapter[];
    };
  }> {
    const [manga, storylines, anchorEvents, branches, chapters] = await Promise.all([
      this.manga.toArray(),
      this.storylines.toArray(),
      this.anchorEvents.toArray(),
      this.branches.toArray(),
      this.chapters.toArray(),
    ]);

    return {
      version: DATABASE_VERSION,
      timestamp: Date.now(),
      data: {
        manga,
        storylines,
        anchorEvents,
        branches,
        chapters,
      },
    };
  }

  /**
   * Import data (with optional clear)
   */
  async import(
    data: {
      manga: Manga[];
      storylines: Storyline[];
      anchorEvents: AnchorEvent[];
      branches: Branch[];
      chapters: Chapter[];
    },
    options: { clear?: boolean } = {}
  ): Promise<void> {
    await this.transaction(
      'rw',
      [this.manga, this.storylines, this.anchorEvents, this.branches, this.chapters],
      async () => {
        if (options.clear) {
          await Promise.all([
            this.manga.clear(),
            this.storylines.clear(),
            this.anchorEvents.clear(),
            this.branches.clear(),
            this.chapters.clear(),
          ]);
        }

        await Promise.all([
          this.manga.bulkAdd(data.manga),
          this.storylines.bulkAdd(data.storylines),
          this.anchorEvents.bulkAdd(data.anchorEvents),
          this.branches.bulkAdd(data.branches),
          this.chapters.bulkAdd(data.chapters),
        ]);
      }
    );
  }
}

/**
 * Singleton database instance
 */
let dbInstance: LoomDatabase | null = null;

/**
 * Get database instance (creates if not exists)
 */
export const getDatabase = (): LoomDatabase => {
  if (!dbInstance) {
    dbInstance = new LoomDatabase();
  }
  return dbInstance;
};

/**
 * Reset database instance
 */
export const resetDatabase = async (): Promise<void> => {
  if (dbInstance) {
    await dbInstance.reset();
  }
  dbInstance = null;
};

// Export singleton
export const db = getDatabase();
