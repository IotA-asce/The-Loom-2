/**
 * Timeline Constructor Module
 * 
 * Exports all timeline construction functionality.
 */

// Event extraction
export {
  extractEvents,
  mergeEvents,
  inferIntermediateEvents,
  calculateEventStats,
  type EventExtractionContext,
  type ExtractedEvent,
  type EventStats,
} from './extraction'

// Ordering
export {
  orderEvents,
  createOrderMapping,
  getEventAtReadingPosition,
  getEventAtChronologicalPosition,
  getSurroundingEvents,
  TimelineOrderAnalyzer,
  type OrderedTimeline,
  type OrderMapping,
} from './ordering'

// Flashback detection
export {
  detectFlashbackHeuristic,
  detectFlashbackWithLLM,
  classifyFlashback,
  FlashbackManager,
  FLASHBACK_VISUAL_CUES,
  FLASHBACK_NARRATIVE_CUES,
  TEMPORAL_INDICATORS,
  type FlashbackIndicators,
  type FlashbackDetectionResult,
  type FlashbackClassification,
  type FlashbackType,
} from './flashback'

// Significance
export {
  calculateSignificanceScore,
  filterBySignificance,
  getTopEvents,
  SignificanceAnalyzer,
  getAdaptiveThreshold,
  type SignificanceFactors,
  type ScoredEvent,
} from './significance'

// Causal graph
export {
  buildCausalGraph,
  getDownstreamEffects,
  getUpstreamCauses,
  findCriticalPath,
  calculateEventCriticality,
  CausalGraphAnalyzer,
  type CausalLink,
  type CausalNode,
  type CausalGraph,
} from './causal'

// Gap detection
export {
  detectGaps,
  estimateTimeGap,
  GapAnalyzer,
  type TimelineGap,
  type EstimatedEvent,
} from './gaps'

// Parallel events
export {
  findParallelEvents,
  crossReferenceEvents,
  ParallelEventTracker,
  type ParallelEventGroup,
  type CrossReference,
} from './parallel'
