/**
 * Analysis Merger Module
 * 
 * Exports all analysis merging functionality.
 */

// Character-timeline merge
export {
  mergeCharacterTimeline,
  findArcGaps,
  calculateCharacterImportance,
  type CharacterTimeline,
  type MergedCharacterData,
} from './character-timeline'

// Deduplication
export {
  findOverlapRegions,
  deduplicateOverlapEvents,
  deduplicateOverlapCharacters,
  type OverlapRegion,
  type DeduplicationResult,
} from './deduplication'

// Contradiction resolution
export {
  detectContradictions,
  resolveContradictions,
  applyResolutions,
  type Contradiction,
  type ResolutionResult,
} from './contradictions'

// Overlap merge
export {
  mergeBatchResults,
  type BatchResult,
  type MergeGap,
  type OverlapMergeResult,
} from './overlap-merge'

// Relationship evolution
export {
  trackRelationshipEvolution,
  findTurningPoints,
  mergeEvolutionData,
  RelationshipEvolutionAnalyzer,
  type RelationshipEvolution,
  type EvolutionSnapshot,
} from './relationship-evolution'

// Output views
export {
  AnalysisViewGenerator,
  generateAllViews,
  type OutputViewType,
  type AnchorDetectionView,
  type BranchGenerationView,
  type StoryContinuationView,
  type SummaryView,
} from './views'

// Provenance
export {
  ProvenanceTracker,
  hashResponse,
  verifyIntegrity,
  type ProvenanceEntry,
  type EntityProvenance,
  type AuditTrail,
} from './provenance'
