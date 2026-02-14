/**
 * Base Repository Class
 * 
 * Generic CRUD operations for all database entities.
 * Provides a common interface for data access.
 */

import type { Table } from 'dexie';

/**
 * Entity with ID
 */
export interface Entity {
  id?: string;
}

/**
 * Query options for list operations
 */
export interface QueryOptions<T> {
  /** Filter predicate */
  filter?: (item: T) => boolean;
  /** Sort key or compare function */
  sortBy?: keyof T | ((a: T, b: T) => number);
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Pagination offset */
  offset?: number;
  /** Pagination limit */
  limit?: number;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Base repository class
 */
export abstract class BaseRepository<T extends Entity> {
  protected table: Table<T, string>;

  constructor(table: Table<T, string>) {
    this.table = table;
  }

  // ============================================================================
  // Create Operations
  // ============================================================================

  /**
   * Create a new entity
   */
  async create(data: Omit<T, 'id'>): Promise<T> {
    const id = await this.table.add(data as T);
    const entity = await this.table.get(id);
    if (!entity) {
      throw new Error('Failed to create entity');
    }
    return entity;
  }

  /**
   * Create multiple entities
   */
  async createMany(items: Array<Omit<T, 'id'>>): Promise<T[]> {
    const ids = await this.table.bulkAdd(items as T[], { allKeys: true });
    return this.table.bulkGet(ids as string[]) as Promise<T[]>;
  }

  // ============================================================================
  // Read Operations
  // ============================================================================

  /**
   * Get entity by ID
   */
  async findById(id: string): Promise<T | undefined> {
    return this.table.get(id);
  }

  /**
   * Get multiple entities by IDs
   */
  async findByIds(ids: string[]): Promise<T[]> {
    const entities = await this.table.bulkGet(ids);
    return entities.filter((e): e is T => e !== undefined);
  }

  /**
   * Get all entities
   */
  async findAll(): Promise<T[]> {
    return this.table.toArray();
  }

  /**
   * Query entities with options
   */
  async query(options: QueryOptions<T> = {}): Promise<PaginatedResult<T>> {
    let collection = this.table.toCollection();

    // Apply filter
    if (options.filter) {
      collection = collection.filter(options.filter);
    }

    // Get total count before pagination
    const total = await collection.count();

    // Apply sorting
    if (options.sortBy) {
      if (typeof options.sortBy === 'function') {
        // Note: Dexie doesn't support custom sort functions directly
        // We'd need to fetch all and sort in memory
        const all = await collection.toArray();
        all.sort(options.sortBy);
        
        // Apply pagination manually
        const offset = options.offset ?? 0;
        const limit = options.limit ?? all.length;
        const items = all.slice(offset, offset + limit);
        
        return {
          items,
          total,
          offset,
          limit,
          hasMore: offset + limit < total,
        };
      } else {
        collection = collection.sortBy(options.sortBy as string);
      }
    }

    // Apply pagination
    const offset = options.offset ?? 0;
    const limit = options.limit;

    if (offset > 0) {
      collection = collection.offset(offset);
    }

    if (limit !== undefined) {
      collection = collection.limit(limit);
    }

    const items = await collection.toArray();

    return {
      items,
      total,
      offset,
      limit: limit ?? total,
      hasMore: offset + items.length < total,
    };
  }

  /**
   * Find first entity matching predicate
   */
  async findFirst(predicate: (item: T) => boolean): Promise<T | undefined> {
    return this.table.filter(predicate).first();
  }

  /**
   * Count entities matching predicate
   */
  async count(predicate?: (item: T) => boolean): Promise<number> {
    if (predicate) {
      return this.table.filter(predicate).count();
    }
    return this.table.count();
  }

  // ============================================================================
  // Update Operations
  // ============================================================================

  /**
   * Update entity by ID
   */
  async update(id: string, changes: Partial<Omit<T, 'id'>>): Promise<T | undefined> {
    await this.table.update(id, changes);
    return this.findById(id);
  }

  /**
   * Update multiple entities
   */
  async updateMany(
    predicate: (item: T) => boolean,
    changes: Partial<Omit<T, 'id'>>
  ): Promise<number> {
    const items = await this.table.filter(predicate).toArray();
    await this.table.bulkUpdate(
      items.map((item) => ({
        key: item.id!,
        changes,
      }))
    );
    return items.length;
  }

  /**
   * Upsert entity (update if exists, create if not)
   */
  async upsert(data: T): Promise<T> {
    if (data.id) {
      await this.table.put(data);
      return this.findById(data.id) as Promise<T>;
    }
    return this.create(data);
  }

  // ============================================================================
  // Delete Operations
  // ============================================================================

  /**
   * Delete entity by ID
   */
  async delete(id: string): Promise<void> {
    await this.table.delete(id);
  }

  /**
   * Delete multiple entities
   */
  async deleteMany(predicate: (item: T) => boolean): Promise<number> {
    const items = await this.table.filter(predicate).toArray();
    await this.table.bulkDelete(items.map((i) => i.id!));
    return items.length;
  }

  /**
   * Delete all entities
   */
  async clear(): Promise<void> {
    await this.table.clear();
  }

  // ============================================================================
  // Transaction Support
  // ============================================================================

  /**
   * Execute operations in a transaction
   */
  async transaction<R>(
    mode: 'readonly' | 'readwrite',
    operation: () => Promise<R>
  ): Promise<R> {
    return this.table.db.transaction(mode, this.table, operation);
  }
}
