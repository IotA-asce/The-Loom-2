import { BasePromptBuilder, PromptResult, promptRegistry } from './index'

/**
 * Visual Overview prompt - First stage analysis
 */
export class OverviewPromptBuilder extends BasePromptBuilder {
  build(): PromptResult {
    const prompt = `Analyze the provided manga pages and give a high-level overview of:

1. **Setting**: Time period, location, and world-building elements
2. **Genre Indicators**: Action, romance, mystery, fantasy, etc.
3. **Tone**: Serious, comedic, dark, light-hearted
4. **Art Style**: Detailed, minimalist, realistic, stylized
5. **Initial Plot Setup**: What appears to be happening at the start

Manga: ${this.context.mangaTitle || 'Unknown'}
Pages: ${this.context.currentBatch} of ${this.context.totalBatches}

Provide a concise summary (150-200 words) focusing on what can be directly observed.`

    return {
      stage: 'overview',
      prompt,
      systemMessage: this.getBaseSystemMessage(),
      expectedOutput: 'JSON with fields: setting, genre, tone, artStyle, summary',
    }
  }
}

promptRegistry.register('overview', OverviewPromptBuilder)
