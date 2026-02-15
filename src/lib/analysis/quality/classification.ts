/**
 * Impact-based issue classification
 * Classifies issues by their impact on analysis quality
 */

import { QualityIssue, IssueSeverity } from './blocking'
import { AnalysisStage } from '../prompts'

export type ImpactCategory = 
  | 'accuracy'      // Affects factual correctness
  | 'completeness'  // Affects coverage
  | 'consistency'   // Affects internal logic
  | 'usability'     // Affects user experience
  | 'performance'   // Affects processing speed/cost

export interface ImpactClassification {
  category: ImpactCategory
  severity: IssueSeverity
  impactScore: number // 0-1
  affectedOutputs: string[]
  userVisible: boolean
}

export interface ClassifiedIssue extends QualityIssue {
  impact: ImpactClassification
}

/**
 * Impact classification rules by issue pattern
 */
const IMPACT_RULES: Array<{
  pattern: RegExp
  category: ImpactCategory
  baseScore: number
  affectedOutputs: string[]
}> = [
  {
    pattern: /json|parse|malformed/i,
    category: 'completeness',
    baseScore: 0.7,
    affectedOutputs: ['all'],
  },
  {
    pattern: /confidence|low quality/i,
    category: 'accuracy',
    baseScore: 0.6,
    affectedOutputs: ['analysis_results', 'confidence_scores'],
  },
  {
    pattern: /missing|incomplete/i,
    category: 'completeness',
    baseScore: 0.5,
    affectedOutputs: ['analysis_results'],
  },
  {
    pattern: /inconsistent|contradiction/i,
    category: 'consistency',
    baseScore: 0.8,
    affectedOutputs: ['timeline', 'character_data'],
  },
  {
    pattern: /timeout|slow|performance/i,
    category: 'performance',
    baseScore: 0.3,
    affectedOutputs: ['processing_time'],
  },
  {
    pattern: /provider|api|error/i,
    category: 'usability',
    baseScore: 0.9,
    affectedOutputs: ['all', 'user_experience'],
  },
]

/**
 * Classify issue by impact
 */
export function classifyIssue(
  issue: QualityIssue,
  stage: AnalysisStage
): ClassifiedIssue {
  // Find matching rule
  const rule = IMPACT_RULES.find(r => r.pattern.test(issue.message))
  
  if (!rule) {
    // Default classification
    return {
      ...issue,
      impact: {
        category: 'accuracy',
        severity: issue.severity,
        impactScore: severityToScore(issue.severity),
        affectedOutputs: ['analysis_results'],
        userVisible: issue.severity === 'error' || issue.severity === 'critical',
      },
    }
  }
  
  // Calculate impact score based on severity and base score
  const severityMultiplier = severityToScore(issue.severity)
  const impactScore = Math.min(1, rule.baseScore * severityMultiplier)
  
  // Determine user visibility
  const userVisible = 
    issue.severity === 'critical' ||
    issue.severity === 'error' ||
    (issue.severity === 'warning' && impactScore > 0.6)
  
  return {
    ...issue,
    impact: {
      category: rule.category,
      severity: issue.severity,
      impactScore: Math.round(impactScore * 100) / 100,
      affectedOutputs: rule.affectedOutputs,
      userVisible,
    },
  }
}

/**
 * Convert severity to numeric score
 */
function severityToScore(severity: IssueSeverity): number {
  switch (severity) {
    case 'critical': return 1.0
    case 'error': return 0.8
    case 'warning': return 0.5
    case 'info': return 0.2
    default: return 0.5
  }
}

/**
 * Impact classifier
 */
export class ImpactClassifier {
  private classified: ClassifiedIssue[] = []
  
  /**
   * Classify a single issue
   */
  classify(issue: QualityIssue, stage: AnalysisStage): ClassifiedIssue {
    const classified = classifyIssue(issue, stage)
    this.classified.push(classified)
    return classified
  }
  
  /**
   * Classify multiple issues
   */
  classifyBatch(issues: QualityIssue[], stage: AnalysisStage): ClassifiedIssue[] {
    return issues.map(issue => this.classify(issue, stage))
  }
  
  /**
   * Get issues by impact category
   */
  getByCategory(category: ImpactCategory): ClassifiedIssue[] {
    return this.classified.filter(i => i.impact.category === category)
  }
  
  /**
   * Get high-impact issues
   */
  getHighImpact(threshold: number = 0.7): ClassifiedIssue[] {
    return this.classified.filter(i => i.impact.impactScore >= threshold)
  }
  
  /**
   * Get user-visible issues
   */
  getUserVisible(): ClassifiedIssue[] {
    return this.classified.filter(i => i.impact.userVisible)
  }
  
  /**
   * Calculate aggregate impact
   */
  getAggregateImpact(): Record<ImpactCategory, number> {
    const impacts: Record<ImpactCategory, number> = {
      accuracy: 0,
      completeness: 0,
      consistency: 0,
      usability: 0,
      performance: 0,
    }
    
    const counts: Record<ImpactCategory, number> = {
      accuracy: 0,
      completeness: 0,
      consistency: 0,
      usability: 0,
      performance: 0,
    }
    
    for (const issue of this.classified) {
      impacts[issue.impact.category] += issue.impact.impactScore
      counts[issue.impact.category]++
    }
    
    // Average by category
    for (const category of Object.keys(impacts) as ImpactCategory[]) {
      if (counts[category] > 0) {
        impacts[category] /= counts[category]
      }
    }
    
    return impacts
  }
  
  /**
   * Get impact summary
   */
  getSummary(): {
    totalIssues: number
    byCategory: Record<ImpactCategory, number>
    averageImpact: number
    highestImpact: ClassifiedIssue | undefined
  } {
    const byCategory = this.getCountByCategory()
    const impacts = this.classified.map(i => i.impact.impactScore)
    const averageImpact = impacts.length > 0 
      ? impacts.reduce((a, b) => a + b, 0) / impacts.length 
      : 0
    
    const highestImpact = this.classified.length > 0
      ? this.classified.reduce((max, i) => 
          i.impact.impactScore > max.impact.impactScore ? i : max
        )
      : undefined
    
    return {
      totalIssues: this.classified.length,
      byCategory,
      averageImpact: Math.round(averageImpact * 100) / 100,
      highestImpact,
    }
  }
  
  /**
   * Get count by category
   */
  private getCountByCategory(): Record<ImpactCategory, number> {
    const counts: Record<ImpactCategory, number> = {
      accuracy: 0,
      completeness: 0,
      consistency: 0,
      usability: 0,
      performance: 0,
    }
    
    for (const issue of this.classified) {
      counts[issue.impact.category]++
    }
    
    return counts
  }
  
  /**
   * Clear classified issues
   */
  clear(): void {
    this.classified = []
  }
}

/**
 * Prioritize issues by impact
 */
export function prioritizeIssues(issues: ClassifiedIssue[]): ClassifiedIssue[] {
  return [...issues].sort((a, b) => {
    // Sort by impact score descending
    if (b.impact.impactScore !== a.impact.impactScore) {
      return b.impact.impactScore - a.impact.impactScore
    }
    // Then by severity
    const severityOrder = ['critical', 'error', 'warning', 'info']
    return severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  })
}
