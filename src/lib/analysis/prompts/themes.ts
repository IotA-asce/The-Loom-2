import { BasePromptBuilder, PromptResult, promptRegistry } from './index'

/**
 * Theme Synthesis prompt
 */
export class ThemesPromptBuilder extends BasePromptBuilder {
  build(): PromptResult {
    const prompt = `Identify major themes in these manga pages:

For each theme:
1. **Name**: The theme (e.g., "redemption", "friendship", "corruption")
2. **Description**: How the theme manifests in the story
3. **Evidence**: Specific scenes, dialogue, or imagery that supports this
4. **Prominence**: Primary (central to plot) or Secondary (supporting)
5. **Character Connections**: Which characters embody or challenge this theme

Consider:
- Recurring motifs and symbols
- Character arcs and transformations
- Narrative conflicts and resolutions
- Visual storytelling elements

Format as structured theme analysis with supporting evidence.`

    return {
      stage: 'themes',
      prompt,
      systemMessage: this.getBaseSystemMessage(),
      expectedOutput:
        'JSON with themes array containing: name, description, evidence, prominence, characterConnections',
    }
  }
}

promptRegistry.register('themes', ThemesPromptBuilder)
