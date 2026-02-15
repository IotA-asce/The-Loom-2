/**
 * Sequential processing for analysis stages
 * Ensures proper order and dependencies between analysis stages
 */

import { AnalysisStage } from '../prompts'

export interface SequentialStage<TInput = unknown, TOutput = unknown> {
  stage: AnalysisStage
  name: string
  dependencies: AnalysisStage[]
  process: (input: TInput, context: ProcessingContext) => Promise<TOutput>
  timeoutMs: number
}

export interface ProcessingContext {
  mangaId: string
  batchIndex: number
  totalBatches: number
  previousResults: Partial<Record<AnalysisStage, unknown>>
  abortSignal?: AbortSignal
}

export interface StageResult<T = unknown> {
  stage: AnalysisStage
  success: boolean
  data?: T
  error?: Error
  durationMs: number
}

export interface SequentialOptions {
  continueOnError: boolean
  skipCompleted: boolean
  timeoutMultiplier: number
}

const DEFAULT_OPTIONS: SequentialOptions = {
  continueOnError: false,
  skipCompleted: true,
  timeoutMultiplier: 1,
}

/**
 * Sequential processor for analysis stages
 */
export class SequentialProcessor {
  private stages: Map<AnalysisStage, SequentialStage> = new Map()
  private completedStages: Set<AnalysisStage> = new Set()
  private results: Map<AnalysisStage, StageResult> = new Map()

  /**
   * Register a processing stage
   */
  registerStage<TInput, TOutput>(stage: SequentialStage<TInput, TOutput>): void {
    this.stages.set(stage.stage, stage as SequentialStage)
  }

  /**
   * Process all stages in dependency order
   */
  async process(
    initialInput: unknown,
    context: ProcessingContext,
    options: Partial<SequentialOptions> = {}
  ): Promise<Record<AnalysisStage, StageResult>> {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    const orderedStages = this.getDependencyOrder()

    for (const stageDef of orderedStages) {
      // Check if already completed
      if (opts.skipCompleted && this.completedStages.has(stageDef.stage)) {
        continue
      }

      // Check dependencies
      const depsSatisfied = stageDef.dependencies.every(dep => 
        this.completedStages.has(dep)
      )
      
      if (!depsSatisfied) {
        const error = new Error(
          `Dependencies not satisfied for stage: ${stageDef.stage}`
        )
        
        if (!opts.continueOnError) {
          throw error
        }
        
        this.results.set(stageDef.stage, {
          stage: stageDef.stage,
          success: false,
          error,
          durationMs: 0,
        })
        continue
      }

      // Process stage with timeout
      const result = await this.processStage(stageDef, initialInput, context, opts)
      this.results.set(stageDef.stage, result)

      if (result.success) {
        this.completedStages.add(stageDef.stage)
        context.previousResults[stageDef.stage] = result.data
      } else if (!opts.continueOnError) {
        throw result.error
      }
    }

    return Object.fromEntries(this.results) as Record<AnalysisStage, StageResult>
  }

  /**
   * Process a single stage with timeout
   */
  private async processStage<T>(
    stage: SequentialStage,
    input: unknown,
    context: ProcessingContext,
    options: SequentialOptions
  ): Promise<StageResult<T>> {
    const startTime = Date.now()
    const timeoutMs = stage.timeoutMs * options.timeoutMultiplier

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Stage timeout: ${stage.stage}`)), timeoutMs)
      })

      const data = await Promise.race([
        stage.process(input, context),
        timeoutPromise,
      ]) as T

      return {
        stage: stage.stage,
        success: true,
        data,
        durationMs: Date.now() - startTime,
      }
    } catch (error) {
      return {
        stage: stage.stage,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        durationMs: Date.now() - startTime,
      }
    }
  }

  /**
   * Get stages in dependency order (topological sort)
   */
  private getDependencyOrder(): SequentialStage[] {
    const visited = new Set<AnalysisStage>()
    const order: SequentialStage[] = []

    const visit = (stage: SequentialStage) => {
      if (visited.has(stage.stage)) return
      
      visited.add(stage.stage)
      
      // Visit dependencies first
      for (const dep of stage.dependencies) {
        const depStage = this.stages.get(dep)
        if (depStage) visit(depStage)
      }
      
      order.push(stage)
    }

    for (const stage of this.stages.values()) {
      visit(stage)
    }

    return order
  }

  /**
   * Mark a stage as completed
   */
  markCompleted(stage: AnalysisStage, result?: unknown): void {
    this.completedStages.add(stage)
    if (result !== undefined) {
      this.results.set(stage, {
        stage,
        success: true,
        data: result,
        durationMs: 0,
      })
    }
  }

  /**
   * Reset processor state
   */
  reset(): void {
    this.completedStages.clear()
    this.results.clear()
  }

  /**
   * Get processing progress
   */
  getProgress(): {
    completed: number
    total: number
    percentage: number
  } {
    const total = this.stages.size
    const completed = this.completedStages.size
    
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }
}

/**
 * Predefined stage order for storyline analysis
 */
export const STAGE_ORDER: AnalysisStage[] = [
  'overview',
  'characters',
  'timeline',
  'relationships',
  'themes',
]

/**
 * Stage dependencies - which stages must complete before others
 */
export const STAGE_DEPENDENCIES: Record<AnalysisStage, AnalysisStage[]> = {
  overview: [],
  characters: ['overview'],
  timeline: ['overview', 'characters'],
  relationships: ['characters'],
  themes: ['overview', 'characters', 'timeline'],
}
