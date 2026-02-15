/**
 * Multi-stage prompt architecture for storyline analysis
 */

export type AnalysisStage =
  | 'overview'
  | 'characters'
  | 'timeline'
  | 'relationships'
  | 'themes'

export interface PromptContext {
  mangaTitle?: string
  genre?: string
  author?: string
  totalPages: number
  currentBatch: number
  totalBatches: number
}

export interface PromptResult {
  stage: AnalysisStage
  prompt: string
  systemMessage: string
  expectedOutput: string
}

/**
 * Base prompt builder
 */
export abstract class BasePromptBuilder {
  protected context: PromptContext

  constructor(context: PromptContext) {
    this.context = context
  }

  abstract build(): PromptResult

  protected getBaseSystemMessage(): string {
    return `You are an expert manga analyst specializing in narrative structure, character development, and thematic analysis.
Your task is to analyze manga pages and extract structured information.
Be thorough but concise. Focus on observable facts from the images provided.`
  }
}

/**
 * Prompt registry
 */
export class PromptRegistry {
  private builders: Map<AnalysisStage, new (context: PromptContext) => BasePromptBuilder> =
    new Map()

  register(
    stage: AnalysisStage,
    builder: new (context: PromptContext) => BasePromptBuilder
  ): void {
    this.builders.set(stage, builder)
  }

  build(stage: AnalysisStage, context: PromptContext): PromptResult {
    const BuilderClass = this.builders.get(stage)
    if (!BuilderClass) {
      throw new Error(`No builder registered for stage: ${stage}`)
    }
    return new BuilderClass(context).build()
  }
}

export const promptRegistry = new PromptRegistry()
