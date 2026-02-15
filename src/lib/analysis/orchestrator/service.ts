/**
 * AnalysisService - Main LLM orchestration class
 */

import { LLMProvider } from '@/lib/llm/types'
import { AnalysisStage, PromptContext } from '../prompts'
import { promptRegistry } from '../prompts'
import { ProgressTracker } from '@/lib/archive/progress'

export interface AnalysisConfig {
  provider: LLMProvider
  fallbackProvider?: LLMProvider
  batchSize: number
  overlapSize: number
  thoroughMode: boolean
  maxRetries: number
}

export interface AnalysisProgress {
  stage: AnalysisStage
  currentBatch: number
  totalBatches: number
  status: 'pending' | 'processing' | 'completed' | 'error'
}

export class AnalysisService {
  private config: AnalysisConfig
  private progressTracker: ProgressTracker
  private abortController: AbortController

  constructor(config: AnalysisConfig) {
    this.config = config
    this.progressTracker = new ProgressTracker(100)
    this.abortController = new AbortController()
  }

  /**
   * Run complete analysis pipeline
   */
  async analyze(
    images: string[],
    context: PromptContext,
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<Record<AnalysisStage, unknown>> {
    const stages: AnalysisStage[] = [
      'overview',
      'characters',
      'timeline',
      'relationships',
      'themes',
    ]

    const results: Partial<Record<AnalysisStage, unknown>> = {}

    for (const stage of stages) {
      onProgress?.({
        stage,
        currentBatch: 0,
        totalBatches: context.totalBatches,
        status: 'processing',
      })

      const stageResult = await this.analyzeStage(stage, images, context)
      results[stage] = stageResult

      onProgress?.({
        stage,
        currentBatch: context.totalBatches,
        totalBatches: context.totalBatches,
        status: 'completed',
      })
    }

    return results as Record<AnalysisStage, unknown>
  }

  /**
   * Analyze a single stage
   */
  private async analyzeStage(
    stage: AnalysisStage,
    images: string[],
    context: PromptContext
  ): Promise<unknown> {
    const prompt = promptRegistry.build(stage, context)

    // Call LLM with retry logic
    const result = await this.callWithRetry(() =>
      this.config.provider.analyzeImages(images, prompt.prompt)
    )

    return result
  }

  /**
   * Call LLM with retry logic
   */
  private async callWithRetry<T>(
    fn: () => Promise<T>,
    retries: number = this.config.maxRetries
  ): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      if (retries > 0 && this.config.fallbackProvider) {
        // Try fallback provider
        return this.callWithRetry(
          () => this.config.fallbackProvider!.analyzeImages([], ''),
          retries - 1
        )
      }
      throw error
    }
  }

  /**
   * Cancel ongoing analysis
   */
  cancel(): void {
    this.abortController.abort()
  }
}
