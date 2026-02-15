import { BasePromptBuilder, PromptResult, promptRegistry } from './index'

/**
 * Character Discovery prompt
 */
export class CharactersPromptBuilder extends BasePromptBuilder {
  build(): PromptResult {
    const prompt = `Identify all characters visible in these manga pages. For each character:

1. **Visual Description**: Hair color/style, clothing, distinguishing features
2. **Role**: Protagonist, antagonist, supporting, background
3. **First Appearance**: Which page/ panel they first appear
4. **Name**: If visible in dialogue or text (use descriptive ID if unnamed)

For unnamed characters, create descriptive IDs like:
- "mysterious-hooded-figure-ch1"
- "schoolgirl-with-red-ribbon"

Characters identified so far: [context from previous batches]

Format as structured JSON with character array.`

    return {
      stage: 'characters',
      prompt,
      systemMessage: this.getBaseSystemMessage(),
      expectedOutput:
        'JSON with characters array containing: id, name, description, role, firstAppearance',
    }
  }
}

promptRegistry.register('characters', CharactersPromptBuilder)
