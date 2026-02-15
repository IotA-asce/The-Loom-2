/**
 * Thorough mode processing (10-15 min detailed analysis)
 * Deep analysis mode with enhanced prompts and multiple passes
 */

import { AnalysisStage, PromptContext } from '../prompts'
import { LLMProvider } from '@/lib/llm/types'

export interface ThoroughConfig {
  enabled: boolean
  passes: number
  crossValidation: boolean
  detailLevel: 'standard' | 'deep' | 'exhaustive'
  timeoutMinutes: number
}

export const DEFAULT_THOROUGH_CONFIG: ThoroughConfig = {
  enabled: false,
  passes: 2,
  crossValidation: true,
  detailLevel: 'deep',
  timeoutMinutes: 15,
}

export interface ThoroughPass {
  passNumber: number
  focus: string
  instructions: string
}

/**
 * Thorough mode processor for detailed analysis
 */
export class ThoroughProcessor {
  private config: ThoroughConfig

  constructor(config: Partial<ThoroughConfig> = {}) {
    this.config = { ...DEFAULT_THOROUGH_CONFIG, ...config }
  }

  /**
   * Get enhanced prompt for thorough mode
   */
  enhancePrompt(basePrompt: string, stage: AnalysisStage, pass: number): string {
    if (!this.config.enabled) return basePrompt

    const enhancements: Record<AnalysisStage, string[]> = {
      overview: [
        'Provide an extremely detailed visual analysis including:',
        '- Panel composition and layout patterns',
        '- Color palette and shading techniques',
        '- Character positioning and visual hierarchy',
        '- Background details and environmental storytelling',
        '- Artistic influences and style markers',
      ],
      characters: [
        'Conduct an exhaustive character analysis including:',
        '- Physical appearance details (clothing, accessories, distinguishing marks)',
        '- Facial expressions and body language throughout',
        '- Character age estimates and visual cues',
        '- Character archetype analysis with specific evidence',
        '- Character design evolution if visible',
      ],
      timeline: [
        'Perform a meticulous timeline reconstruction including:',
        '- Precise chronological ordering of all events',
        '- Time-of-day indicators and temporal transitions',
        '- Flashback identification with confidence scores',
        '- Parallel event tracking across different locations',
        '- Causal chains between events with explicit reasoning',
      ],
      relationships: [
        'Create a comprehensive relationship map including:',
        '- Power dynamics and hierarchy indicators',
        '- Emotional states and tension levels',
        '- Relationship evolution markers',
        '- Unspoken/subtextual relationship elements',
        '- Relationship tropes and their variations',
      ],
      themes: [
        'Develop a deep thematic analysis including:',
        '- Primary, secondary, and tertiary themes',
        '- Symbolic imagery and visual metaphors',
        '- Thematic progression across pages',
        '- Genre convention adherence and subversion',
        '- Philosophical or moral questions raised',
      ],
    }

    const enhancement = enhancements[stage]?.join('\n') || ''
    
    if (pass === 1) {
      return `${basePrompt}\n\n=== THOROUGH ANALYSIS MODE ===\n${enhancement}\n\nBe exhaustive and cite specific visual evidence for each observation.`
    }

    // Second pass focuses on cross-validation
    return `${basePrompt}\n\n=== CROSS-VALIDATION PASS ===\nReview your previous analysis and:\n1. Verify all claims against the images\n2. Identify any contradictions or uncertainties\n3. Add missing details you may have overlooked\n4. Confidence score each major finding (0.0-1.0)`
  }

  /**
   * Get processing passes configuration
   */
  getPasses(): ThoroughPass[] {
    if (!this.config.enabled) {
      return [{ passNumber: 1, focus: 'standard', instructions: '' }]
    }

    const passes: ThoroughPass[] = []
    
    for (let i = 1; i <= this.config.passes; i++) {
      passes.push({
        passNumber: i,
        focus: i === 1 ? 'detailed_extraction' : 'cross_validation',
        instructions: i === 1 
          ? 'Extract maximum detail from all visual elements'
          : 'Validate and refine previous findings',
      })
    }

    return passes
  }

  /**
   * Merge results from multiple passes
   */
  mergePassResults<T extends { confidence?: number; id: string }>(
    passResults: T[][]
  ): T[] {
    const merged = new Map<string, T>()

    for (const results of passResults) {
      for (const item of results) {
        const existing = merged.get(item.id)
        
        if (!existing) {
          merged.set(item.id, item)
        } else if ((item.confidence || 0) > (existing.confidence || 0)) {
          merged.set(item.id, item)
        }
      }
    }

    return Array.from(merged.values())
  }

  /**
   * Calculate estimated processing time
   */
  estimateTime(stageCount: number, batchCount: number): number {
    if (!this.config.enabled) {
      // Standard mode: ~30s per batch
      return stageCount * batchCount * 30
    }

    // Thorough mode: 2-3x longer per pass
    const timePerBatch = this.config.detailLevel === 'exhaustive' ? 90 : 60
    return stageCount * batchCount * timePerBatch * this.config.passes
  }

  /**
   * Check if within time budget
   */
  isWithinBudget(elapsedSeconds: number): boolean {
    return elapsedSeconds < this.config.timeoutMinutes * 60
  }

  /**
   * Get progress weight for thorough mode
   */
  getProgressWeight(): number {
    return this.config.enabled ? this.config.passes : 1
  }
}

/**
 * Create thorough mode configuration
 */
export function createThoroughConfig(
  enabled: boolean,
  detailLevel: ThoroughConfig['detailLevel'] = 'deep'
): ThoroughConfig {
  return {
    ...DEFAULT_THOROUGH_CONFIG,
    enabled,
    detailLevel,
    passes: detailLevel === 'exhaustive' ? 3 : 2,
    timeoutMinutes: detailLevel === 'exhaustive' ? 20 : 15,
  }
}
