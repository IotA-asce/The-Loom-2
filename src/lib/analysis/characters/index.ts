/**
 * Character Analyzer Module
 * 
 * Exports all character analysis functionality.
 */

// Character extraction
export {
  extractCharacters,
  mergeCharacterData,
  calculateStats,
  type ExtractionContext,
  type ExtractedCharacter,
  type ExtractionStats,
} from './extraction'

// Descriptive IDs
export {
  generateDescriptiveId,
  parseVisualDescription,
  DescriptiveIdGenerator,
  type CharacterDescriptor,
  type DescriptiveIdResult,
} from './ids'

// Deduplication
export {
  findDuplicateCandidates,
  deduplicateWithLLM,
  deduplicateHeuristic,
  type DuplicateCandidate,
  type DeduplicationResult,
} from './deduplication'

// Alias resolution
export {
  CharacterAliasResolver,
  resolveAliasesInText,
} from './aliases'

// Relationships
export {
  RelationshipMapper,
  RelationshipGraph,
  type RelationshipContext,
  type RelationshipChange,
} from './relationships'

// State tracking
export {
  CharacterStateManager,
  StateConsistencyChecker,
  type CharacterState,
  type StateTransition,
} from './states'

// Historical tracking
export {
  RelationshipHistoryTracker,
  type HistoricalRelationship,
  type RelationshipMetrics,
} from './history'

// Dynamic introduction
export {
  DynamicCharacterIntroducer,
  type IntroductionContext,
  type IntroductionResult,
} from './dynamic'

// Confidence scoring
export {
  ConfidenceCalculator,
  ConfidenceThresholdChecker,
  BatchConfidenceAggregator,
  type ConfidenceFactors,
  type CharacterConfidence,
} from './confidence'
