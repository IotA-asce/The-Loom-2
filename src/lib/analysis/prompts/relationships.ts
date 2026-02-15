import { BasePromptBuilder, PromptResult, promptRegistry } from './index'

/**
 * Relationship Mapping prompt
 */
export class RelationshipsPromptBuilder extends BasePromptBuilder {
  build(): PromptResult {
    const prompt = `Analyze character relationships in these pages:

For each relationship:
1. **Characters**: The two (or more) characters involved
2. **Relationship Type**: Friend, enemy, family, mentor-student, romantic, professional, etc.
3. **Dynamic**: Cooperative, antagonistic, complex, one-sided
4. **Evidence**: Specific panels/scenes that demonstrate this relationship
5. **Strength**: Weak, moderate, strong (how important is this relationship to the story)

Track how relationships evolve across batches.
Existing relationships: [context from previous batches]

Format as relationship graph with nodes (characters) and edges (relationships).`

    return {
      stage: 'relationships',
      prompt,
      systemMessage: this.getBaseSystemMessage(),
      expectedOutput:
        'JSON with relationships array containing: characters, type, dynamic, evidence, strength',
    }
  }
}

promptRegistry.register('relationships', RelationshipsPromptBuilder)
