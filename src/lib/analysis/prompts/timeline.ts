import { BasePromptBuilder, PromptResult, promptRegistry } from './index'

/**
 * Timeline Extraction prompt
 */
export class TimelinePromptBuilder extends BasePromptBuilder {
  build(): PromptResult {
    const prompt = `Extract key events from these manga pages in their reading order:

For each significant event, provide:
1. **Description**: What happens
2. **Characters Involved**: Who participates
3. **Location**: Where it takes place
4. **Significance**: MINOR, MODERATE, MAJOR, or PIVOTAL
5. **Time Indicators**: Any clues about when (flashbacks, time skips, etc.)
6. **Causal Links**: What events led to this or resulted from it

Flag any flashbacks or non-linear narrative elements.
Events so far: [context from previous batches]

Format as chronological event list with cross-references.`

    return {
      stage: 'timeline',
      prompt,
      systemMessage: this.getBaseSystemMessage(),
      expectedOutput:
        'JSON with events array containing: id, description, characters, significance, isFlashback, causalLinks',
    }
  }
}

promptRegistry.register('timeline', TimelinePromptBuilder)
