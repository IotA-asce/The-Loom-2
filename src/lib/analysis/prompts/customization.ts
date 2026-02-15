/**
 * User customization interface for prompts
 */

import { AnalysisStage } from './index'

export interface PromptCustomization {
  stage: AnalysisStage
  additions?: string[] // Add to prompt
  removals?: string[] // Remove from prompt
  replacements?: Array<{ find: string; replace: string }>
  emphasis?: string[] // Sections to emphasize
}

export class PromptCustomizer {
  private customizations: Map<string, PromptCustomization[]> = new Map()

  /**
   * Add customization for a user
   */
  addCustomization(userId: string, customization: PromptCustomization): void {
    const existing = this.customizations.get(userId) || []
    existing.push(customization)
    this.customizations.set(userId, existing)
  }

  /**
   * Apply customizations to a base prompt
   */
  applyCustomizations(
    basePrompt: string,
    userId: string,
    stage: AnalysisStage
  ): string {
    const userCustomizations = this.customizations.get(userId) || []
    const stageCustomizations = userCustomizations.filter(c => c.stage === stage)

    let customized = basePrompt

    for (const custom of stageCustomizations) {
      // Apply additions
      if (custom.additions) {
        customized += '\n\n' + custom.additions.join('\n')
      }

      // Apply removals
      if (custom.removals) {
        for (const removal of custom.removals) {
          customized = customized.replace(removal, '')
        }
      }

      // Apply replacements
      if (custom.replacements) {
        for (const { find, replace } of custom.replacements) {
          customized = customized.replace(new RegExp(find, 'g'), replace)
        }
      }

      // Apply emphasis
      if (custom.emphasis) {
        for (const section of custom.emphasis) {
          customized = customized.replace(
            section,
            `**${section}** (HIGH PRIORITY)`
          )
        }
      }
    }

    return customized
  }

  /**
   * Get user customizations
   */
  getUserCustomizations(userId: string): PromptCustomization[] {
    return this.customizations.get(userId) || []
  }

  /**
   * Clear user customizations
   */
  clearCustomizations(userId: string): void {
    this.customizations.delete(userId)
  }
}

export const promptCustomizer = new PromptCustomizer()
