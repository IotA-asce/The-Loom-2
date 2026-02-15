/**
 * Backward-compatible migrations
 * Handles data format changes while maintaining compatibility
 */

import { Character, TimelineEvent, Theme, Relationship } from '@/lib/db/schema'

export interface MigrationContext {
  fromVersion: string
  toVersion: string
  timestamp: number
}

export type DataMigration<TFrom, TTo> = (
  data: TFrom,
  context: MigrationContext
) => TTo

/**
 * Character data migrations
 */
export namespace CharacterMigrations {
  // V1: Basic character info
  export interface CharacterV1 {
    id: string
    name: string
    description: string
    firstAppearance: number
  }

  // V2: Added importance and aliases
  export interface CharacterV2 extends CharacterV1 {
    importance: 'major' | 'supporting' | 'minor'
    aliases: string[]
  }

  // V3: Added appearance and personality (current)
  export interface CharacterV3 extends CharacterV2 {
    appearance?: string
    personality?: string
  }

  export const v1ToV2: DataMigration<CharacterV1, CharacterV2> = (data) => ({
    ...data,
    importance: 'supporting',
    aliases: [],
  })

  export const v2ToV3: DataMigration<CharacterV2, CharacterV3> = (data) => ({
    ...data,
    appearance: undefined,
    personality: undefined,
  })

  export const v1ToV3: DataMigration<CharacterV1, CharacterV3> = (data) => ({
    ...data,
    importance: 'supporting',
    aliases: [],
    appearance: undefined,
    personality: undefined,
  })
}

/**
 * Timeline event migrations
 */
export namespace TimelineEventMigrations {
  export interface EventV1 {
    id: string
    pageNumber: number
    title: string
    description: string
    characters: string[]
  }

  export interface EventV2 extends EventV1 {
    significance: 'minor' | 'moderate' | 'major' | 'critical'
    isFlashback: boolean
  }

  export interface EventV3 extends EventV2 {
    chapterNumber?: number
    chronologicalOrder?: number
  }

  export const v1ToV2: DataMigration<EventV1, EventV2> = (data) => ({
    ...data,
    significance: 'moderate',
    isFlashback: false,
  })

  export const v2ToV3: DataMigration<EventV2, EventV3> = (data) => ({
    ...data,
    chapterNumber: undefined,
    chronologicalOrder: undefined,
  })
}

/**
 * Migration registry
 */
export class MigrationRegistry {
  private migrations: Map<string, Map<string, DataMigration<unknown, unknown>>> = new Map()

  /**
   * Register a migration
   */
  register<TFrom, TTo>(
    type: string,
    fromVersion: string,
    toVersion: string,
    migration: DataMigration<TFrom, TTo>
  ): void {
    if (!this.migrations.has(type)) {
      this.migrations.set(type, new Map())
    }
    
    const typeMigrations = this.migrations.get(type)!
    const key = `${fromVersion}->${toVersion}`
    typeMigrations.set(key, migration as DataMigration<unknown, unknown>)
  }

  /**
   * Get migration for type and versions
   */
  getMigration<TFrom, TTo>(
    type: string,
    fromVersion: string,
    toVersion: string
  ): DataMigration<TFrom, TTo> | undefined {
    const typeMigrations = this.migrations.get(type)
    if (!typeMigrations) return undefined
    
    const key = `${fromVersion}->${toVersion}`
    return typeMigrations.get(key) as DataMigration<TFrom, TTo> | undefined
  }

  /**
   * Check if migration exists
   */
  hasMigration(type: string, fromVersion: string, toVersion: string): boolean {
    return this.getMigration(type, fromVersion, toVersion) !== undefined
  }
}

/**
 * Global migration registry
 */
export const migrationRegistry = new MigrationRegistry()

// Register character migrations
migrationRegistry.register('character', '1', '2', CharacterMigrations.v1ToV2)
migrationRegistry.register('character', '2', '3', CharacterMigrations.v2ToV3)
migrationRegistry.register('character', '1', '3', CharacterMigrations.v1ToV3)

// Register event migrations
migrationRegistry.register('timelineEvent', '1', '2', TimelineEventMigrations.v1ToV2)
migrationRegistry.register('timelineEvent', '2', '3', TimelineEventMigrations.v2ToV3)

/**
 * Migration runner
 */
export class MigrationRunner {
  private registry: MigrationRegistry

  constructor(registry: MigrationRegistry) {
    this.registry = registry
  }

  /**
   * Run migration for single item
   */
  run<T>(
    type: string,
    data: unknown,
    fromVersion: string,
    toVersion: string
  ): T {
    const migration = this.registry.getMigration(type, fromVersion, toVersion)
    
    if (!migration) {
      throw new Error(`No migration found: ${type} ${fromVersion} -> ${toVersion}`)
    }

    const context: MigrationContext = {
      fromVersion,
      toVersion,
      timestamp: Date.now(),
    }

    return migration(data, context) as T
  }

  /**
   * Run migration for array of items
   */
  runBatch<T>(
    type: string,
    items: unknown[],
    fromVersion: string,
    toVersion: string
  ): T[] {
    return items.map(item => this.run<T>(type, item, fromVersion, toVersion))
  }

  /**
   * Auto-detect and migrate
   */
  autoMigrate<T>(type: string, data: unknown, targetVersion: string): T {
    // Detect current version from data shape
    const detectedVersion = this.detectVersion(type, data)
    
    if (detectedVersion === targetVersion) {
      return data as T
    }

    return this.run<T>(type, data, detectedVersion, targetVersion)
  }

  /**
   * Detect version from data structure
   */
  private detectVersion(type: string, data: unknown): string {
    if (typeof data !== 'object' || data === null) return '1'
    
    const record = data as Record<string, unknown>

    switch (type) {
      case 'character':
        if ('appearance' in record || 'personality' in record) return '3'
        if ('importance' in record || 'aliases' in record) return '2'
        return '1'
        
      case 'timelineEvent':
        if ('chapterNumber' in record || 'chronologicalOrder' in record) return '3'
        if ('significance' in record || 'isFlashback' in record) return '2'
        return '1'
        
      default:
        return '1'
    }
  }
}

/**
 * Versioned data wrapper
 */
export interface VersionedData<T> {
  version: string
  data: T
  migratedFrom?: string
  migratedAt?: number
}

/**
 * Wrap data with version info
 */
export function versionData<T>(data: T, version: string): VersionedData<T> {
  return { version, data }
}

/**
 * Migrate versioned data
 */
export function migrateVersioned<T>(
  versioned: VersionedData<unknown>,
  type: string,
  targetVersion: string,
  runner: MigrationRunner
): VersionedData<T> {
  if (versioned.version === targetVersion) {
    return versioned as VersionedData<T>
  }

  const migrated = runner.run<T>(
    type,
    versioned.data,
    versioned.version,
    targetVersion
  )

  return {
    version: targetVersion,
    data: migrated,
    migratedFrom: versioned.version,
    migratedAt: Date.now(),
  }
}
