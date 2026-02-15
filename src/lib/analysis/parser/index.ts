/**
 * Response Parser Module
 * 
 * Exports all response parsing functionality.
 */

// JSON extraction
export {
  extractJson,
  extractMultipleJson,
  cleanJsonString,
  safeJsonParse,
  extractFields,
  type ExtractionResult,
} from './extraction'

// Zod validation
export {
  validateWithZod,
  safeValidateWithWarnings,
  CharacterSchema,
  TimelineEventSchema,
  ThemeSchema,
  RelationshipSchema,
  AnalysisResponseSchema,
  StrictAnalysisResponseSchema,
  type ParsedCharacter,
  type ParsedTimelineEvent,
  type ParsedTheme,
  type ParsedRelationship,
  type ParsedAnalysisResponse,
  type StrictParsedAnalysisResponse,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
} from './validation'

// JSON repair
export {
  repairJson,
  repairWithLLM,
  getRepairMetadata,
  type RepairResult,
  type RepairMetadata,
} from './repair'

// Strict validation
export {
  StrictValidator,
  makeStrict,
  validateStrict,
  DEFAULT_STRICT_OPTIONS,
  type StrictValidationOptions,
} from './strict'

// Schema evolution
export {
  SchemaRegistry,
  createAnalysisSchemaRegistry,
  renameField,
  addDefaultField,
  removeField,
  transformArrayItems,
  AnalysisResponseV1,
  AnalysisResponseV2,
  AnalysisResponseV3,
  type SchemaVersion,
  type Migration,
  type MigrationResult,
} from './evolution'

// Raw response storage
export {
  RawResponseStorage,
  rawResponseStorage,
  storeRawResponse,
  DEFAULT_STORAGE_OPTIONS,
  type RawResponseEntry,
  type StorageOptions,
} from './storage'

// Backward-compatible migrations
export {
  MigrationRegistry,
  MigrationRunner,
  migrationRegistry,
  CharacterMigrations,
  TimelineEventMigrations,
  versionData,
  migrateVersioned,
  type MigrationContext,
  type DataMigration,
  type VersionedData,
} from './migrations'
