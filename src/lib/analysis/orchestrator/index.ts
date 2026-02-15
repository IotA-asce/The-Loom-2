/**
 * LLM Orchestrator Module
 * 
 * Exports all orchestration functionality for analysis pipeline.
 */

// Batch processing
export { BatchProcessor, type BatchProcessorConfig } from './batch'
export { BatchCalculator, calculateBatches, type BatchCalculation, PROVIDER_LIMITS } from './calculator'

// Overlapping batches
export {
  OverlapManager,
  generateOverlappingRanges,
  mergeOverlappingResults,
  type OverlappingRange,
  type OverlapContext,
} from './overlap'

// Sequential processing
export {
  SequentialProcessor,
  STAGE_ORDER,
  STAGE_DEPENDENCIES,
  type SequentialStage,
  type ProcessingContext,
  type StageResult,
  type SequentialOptions,
} from './sequential'

// Thorough mode
export {
  ThoroughProcessor,
  createThoroughConfig,
  DEFAULT_THOROUGH_CONFIG,
  type ThoroughConfig,
  type ThoroughPass,
} from './thorough'

// Retry logic
export {
  withRetry,
  RetryWrapper,
  CircuitBreaker,
  DEFAULT_RETRY_CONFIG,
  type RetryConfig,
  type RetryResult,
} from './retry'

// Fallback switching
export {
  FallbackOrchestrator,
  ProviderPriorityManager,
  withFallback,
  type FallbackConfig,
  type FallbackResult,
} from './fallback'

// Service and tracking
export {
  AnalysisService,
  type AnalysisConfig,
  type AnalysisProgress,
} from './service'

export {
  CostTracker,
  costTracker,
  type TokenUsage,
  type AnalysisMetrics,
} from './tracking'
