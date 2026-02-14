/**
 * Database Module Exports
 * 
 * Centralized export point for all database-related modules.
 */

// Database and schema
export { LoomDatabase, getDatabase, resetDatabase, db } from './database';
export type { DATABASE_VERSION, DATABASE_NAME } from './database';

// Schema types
export type {
  Manga,
  Storyline,
  Character,
  TimelineEvent,
  Theme,
  Relationship,
  AnchorEvent,
  AlternativeOutcome,
  BranchingPotential,
  Branch,
  CharacterState,
  WorldState,
  BranchPremise,
  BranchTrajectory,
  Chapter,
  Scene,
  EntityStatus,
  AnalysisStatus,
  ContentStatus,
  SignificanceLevel,
  AnchorEventType,
} from './schema';

// Repository
export {
  BaseRepository,
  type Entity,
  type QueryOptions,
  type PaginatedResult,
} from './repository';

// Repositories
export {
  MangaRepository,
  StorylineRepository,
  AnchorEventRepository,
  BranchRepository,
  ChapterRepository,
  repositories,
  getRepositories,
} from './repositories';

// Migrations
export {
  registerMigration,
  getMigrations,
  runMigrations,
  getCurrentVersion,
  setCurrentVersion,
  needsMigration,
  resetVersion,
  createMigrationBackup,
  MigrationError,
} from './migration';
