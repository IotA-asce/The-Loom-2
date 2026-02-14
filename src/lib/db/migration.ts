/**
 * Database Migration System
 * 
 * Handles database schema migrations between versions.
 * Uses Dexie's built-in migration support with custom migration scripts.
 */

import { type Transaction } from 'dexie';
import { LoomDatabase, DATABASE_NAME, DATABASE_VERSION } from './database';

/**
 * Migration function type
 */
type MigrationFunction = (trans: Transaction) => Promise<void>;

/**
 * Migration definition
 */
interface Migration {
  version: number;
  description: string;
  migrate: MigrationFunction;
}

/**
 * Migration registry
 */
const migrations: Migration[] = [];

/**
 * Register a migration
 */
export const registerMigration = (migration: Migration): void => {
  migrations.push(migration);
  // Sort by version
  migrations.sort((a, b) => a.version - b.version);
};

/**
 * Get registered migrations
 */
export const getMigrations = (): Migration[] => [...migrations];

/**
 * Migration 1: Initial schema (v1)
 * This is handled by the initial schema definition in database.ts
 */
registerMigration({
  version: 1,
  description: 'Initial schema setup',
  migrate: async () => {
    // Initial schema is created automatically by Dexie
    console.log('Migration v1: Initial schema created');
  },
});

/**
 * Migration 2: Add user preferences table (example)
 * Uncomment and modify when needed
 */
// registerMigration({
//   version: 2,
//   description: 'Add user preferences table',
//   migrate: async (trans) => {
//     const db = trans.db as Dexie;
//     // Schema change is handled by version() in database.ts
//     // Data migration can be done here
//   },
// });

/**
 * Run pending migrations
 */
export const runMigrations = async (db: LoomDatabase): Promise<void> => {
  const currentVersion = await getCurrentVersion();
  
  console.log(`Database version: ${currentVersion}, Target: ${DATABASE_VERSION}`);
  
  if (currentVersion >= DATABASE_VERSION) {
    console.log('Database is up to date');
    return;
  }
  
  const pendingMigrations = migrations.filter(
    (m) => m.version > currentVersion && m.version <= DATABASE_VERSION
  );
  
  for (const migration of pendingMigrations) {
    console.log(`Running migration v${migration.version}: ${migration.description}`);
    
    try {
      await db.transaction('rw', db.tables, async () => {
        await migration.migrate(db as unknown as Transaction);
      });
      
      await setCurrentVersion(migration.version);
      console.log(`Migration v${migration.version} completed`);
    } catch (error) {
      console.error(`Migration v${migration.version} failed:`, error);
      throw error;
    }
  }
  
  console.log('All migrations completed');
};

/**
 * Get current database version from metadata
 */
export const getCurrentVersion = async (): Promise<number> => {
  try {
    const stored = localStorage.getItem(`${DATABASE_NAME}-version`);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
};

/**
 * Set current database version in metadata
 */
export const setCurrentVersion = async (version: number): Promise<void> => {
  localStorage.setItem(`${DATABASE_NAME}-version`, version.toString());
};

/**
 * Check if database needs migration
 */
export const needsMigration = async (): Promise<boolean> => {
  const currentVersion = await getCurrentVersion();
  return currentVersion < DATABASE_VERSION;
};

/**
 * Reset database version (for testing)
 */
export const resetVersion = (): void => {
  localStorage.removeItem(`${DATABASE_NAME}-version`);
};

/**
 * Create a backup before migration
 */
export const createMigrationBackup = async (
  db: LoomDatabase
): Promise<string> => {
  const exportData = await db.export();
  const backupName = `${DATABASE_NAME}-backup-v${await getCurrentVersion()}-${Date.now()}.json`;
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });
  
  // Store backup in IndexedDB or download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupName;
  a.click();
  URL.revokeObjectURL(url);
  
  return backupName;
};

/**
 * Migration error class
 */
export class MigrationError extends Error {
  readonly version: number;
  readonly originalError: unknown;

  constructor(version: number, message: string, originalError: unknown) {
    super(`Migration v${version} failed: ${message}`);
    this.name = 'MigrationError';
    this.version = version;
    this.originalError = originalError;
  }
}
