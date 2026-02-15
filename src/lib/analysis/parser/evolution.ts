/**
 * Schema evolution support
 * Handles versioning and migrations of analysis response formats
 */

import { z, ZodSchema } from 'zod'

export interface SchemaVersion {
  version: string
  schema: ZodSchema<unknown>
  migrations: Migration[]
}

export interface Migration {
  fromVersion: string
  toVersion: string
  transform: (data: unknown) => unknown
}

export interface MigrationResult<T> {
  success: boolean
  data?: T
  version: string
  migrationsApplied: string[]
  error?: string
}

/**
 * Schema registry for managing versions
 */
export class SchemaRegistry {
  private versions: Map<string, SchemaVersion> = new Map()
  private currentVersion: string

  constructor(currentVersion: string) {
    this.currentVersion = currentVersion
  }

  /**
   * Register a schema version
   */
  registerVersion(version: SchemaVersion): void {
    this.versions.set(version.version, version)
  }

  /**
   * Get schema for version
   */
  getSchema(version: string): ZodSchema<unknown> | undefined {
    return this.versions.get(version)?.schema
  }

  /**
   * Get current version schema
   */
  getCurrentSchema(): ZodSchema<unknown> {
    const schema = this.versions.get(this.currentVersion)?.schema
    if (!schema) {
      throw new Error(`Current version ${this.currentVersion} not registered`)
    }
    return schema
  }

  /**
   * Migrate data to current version
   */
  migrate<T>(data: unknown, fromVersion: string): MigrationResult<T> {
    const migrationsApplied: string[] = []
    let currentData = data
    let currentVer = fromVersion

    // Find migration path
    const path = this.findMigrationPath(fromVersion, this.currentVersion)
    
    if (!path) {
      return {
        success: false,
        version: fromVersion,
        migrationsApplied,
        error: `No migration path from ${fromVersion} to ${this.currentVersion}`,
      }
    }

    // Apply migrations
    for (const migration of path) {
      try {
        currentData = migration.transform(currentData)
        migrationsApplied.push(`${migration.fromVersion} -> ${migration.toVersion}`)
        currentVer = migration.toVersion
      } catch (error) {
        return {
          success: false,
          version: currentVer,
          migrationsApplied,
          error: `Migration failed: ${error}`,
        }
      }
    }

    // Validate against current schema
    const schema = this.getCurrentSchema()
    const result = schema.safeParse(currentData)

    if (!result.success) {
      return {
        success: false,
        version: currentVer,
        migrationsApplied,
        error: `Validation failed: ${result.error.message}`,
      }
    }

    return {
      success: true,
      data: result.data as T,
      version: this.currentVersion,
      migrationsApplied,
    }
  }

  /**
   * Find migration path using BFS
   */
  private findMigrationPath(from: string, to: string): Migration[] | null {
    if (from === to) return []

    const queue: Array<{ version: string; path: Migration[] }> = [
      { version: from, path: [] },
    ]
    const visited = new Set<string>([from])

    while (queue.length > 0) {
      const { version, path } = queue.shift()!
      const schemaVersion = this.versions.get(version)

      if (!schemaVersion) continue

      for (const migration of schemaVersion.migrations) {
        if (migration.toVersion === to) {
          return [...path, migration]
        }

        if (!visited.has(migration.toVersion)) {
          visited.add(migration.toVersion)
          queue.push({
            version: migration.toVersion,
            path: [...path, migration],
          })
        }
      }
    }

    return null
  }
}

// ============================================================================
// Common Migrations
// ============================================================================

/**
 * Rename field migration
 */
export function renameField(oldName: string, newName: string) {
  return (data: unknown): unknown => {
    if (typeof data !== 'object' || data === null) return data
    
    const record = { ...(data as Record<string, unknown>) }
    if (oldName in record) {
      record[newName] = record[oldName]
      delete record[oldName]
    }
    
    return record
  }
}

/**
 * Add default field migration
 */
export function addDefaultField(fieldName: string, defaultValue: unknown) {
  return (data: unknown): unknown => {
    if (typeof data !== 'object' || data === null) return data
    
    const record = { ...(data as Record<string, unknown>) }
    if (!(fieldName in record)) {
      record[fieldName] = defaultValue
    }
    
    return record
  }
}

/**
 * Remove field migration
 */
export function removeField(fieldName: string) {
  return (data: unknown): unknown => {
    if (typeof data !== 'object' || data === null) return data
    
    const record = { ...(data as Record<string, unknown>) }
    delete record[fieldName]
    
    return record
  }
}

/**
 * Transform array items migration
 */
export function transformArrayItems(
  arrayField: string,
  itemTransform: (item: unknown) => unknown
) {
  return (data: unknown): unknown => {
    if (typeof data !== 'object' || data === null) return data
    
    const record = { ...(data as Record<string, unknown>) }
    const array = record[arrayField]
    
    if (Array.isArray(array)) {
      record[arrayField] = array.map(itemTransform)
    }
    
    return record
  }
}

// ============================================================================
// Versioned Analysis Response Schema
// ============================================================================

export const AnalysisResponseV1 = z.object({
  characters: z.array(z.any()).default([]),
  events: z.array(z.any()).default([]),
  themes: z.array(z.string()).default([]),
})

export const AnalysisResponseV2 = z.object({
  characters: z.array(z.any()).default([]),
  timeline: z.array(z.any()).default([]),
  themes: z.array(z.any()).default([]),
  relationships: z.array(z.any()).default([]),
})

export const AnalysisResponseV3 = z.object({
  characters: z.array(z.any()).default([]),
  timeline: z.array(z.any()).default([]),
  themes: z.array(z.any()).default([]),
  relationships: z.array(z.any()).default([]),
  confidence: z.number().default(0.5),
  metadata: z.object({
    version: z.string(),
    processedAt: z.string(),
  }).optional(),
})

/**
 * Create default schema registry with analysis migrations
 */
export function createAnalysisSchemaRegistry(): SchemaRegistry {
  const registry = new SchemaRegistry('3.0.0')

  registry.registerVersion({
    version: '1.0.0',
    schema: AnalysisResponseV1,
    migrations: [
      {
        fromVersion: '1.0.0',
        toVersion: '2.0.0',
        transform: (data) => {
          const d = data as Record<string, unknown>
          return {
            ...d,
            timeline: d.events || [],
            relationships: [],
            themes: (d.themes as string[] || []).map((t, i) => ({
              id: `theme-${i}`,
              name: t,
              description: '',
              keywords: [],
              prevalence: 0.5,
            })),
          }
        },
      },
    ],
  })

  registry.registerVersion({
    version: '2.0.0',
    schema: AnalysisResponseV2,
    migrations: [
      {
        fromVersion: '2.0.0',
        toVersion: '3.0.0',
        transform: (data) => ({
          ...data,
          confidence: 0.5,
          metadata: {
            version: '3.0.0',
            processedAt: new Date().toISOString(),
          },
        }),
      },
    ],
  })

  registry.registerVersion({
    version: '3.0.0',
    schema: AnalysisResponseV3,
    migrations: [],
  })

  return registry
}
