/**
 * Severity-based blocking system
 * Blocks processing based on issue severity
 */

import { AnalysisStage } from '../prompts'

export type IssueSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface QualityIssue {
  id: string
  stage: AnalysisStage
  severity: IssueSeverity
  message: string
  details?: string
  affectedElements?: string[]
  autoFixable: boolean
  suggestedFix?: string
}

export interface BlockingRule {
  severity: IssueSeverity
  maxCount: number
  blockOnExceed: boolean
}

export const DEFAULT_BLOCKING_RULES: BlockingRule[] = [
  { severity: 'critical', maxCount: 0, blockOnExceed: true },
  { severity: 'error', maxCount: 3, blockOnExceed: true },
  { severity: 'warning', maxCount: 10, blockOnExceed: false },
  { severity: 'info', maxCount: 100, blockOnExceed: false },
]

/**
 * Blocking decision result
 */
export interface BlockingDecision {
  shouldBlock: boolean
  blockedBy: QualityIssue[]
  canProceedWithWarnings: boolean
  warnings: QualityIssue[]
  requiredActions: string[]
}

/**
 * Severity-based blocker
 */
export class SeverityBlocker {
  private rules: BlockingRule[]
  private issues: QualityIssue[] = []
  
  constructor(rules: BlockingRule[] = DEFAULT_BLOCKING_RULES) {
    this.rules = rules
  }
  
  /**
   * Add an issue
   */
  addIssue(issue: QualityIssue): void {
    this.issues.push(issue)
  }
  
  /**
   * Add multiple issues
   */
  addIssues(issues: QualityIssue[]): void {
    this.issues.push(...issues)
  }
  
  /**
   * Evaluate whether to block
   */
  evaluate(): BlockingDecision {
    const severityOrder: IssueSeverity[] = ['critical', 'error', 'warning', 'info']
    const counts: Record<IssueSeverity, number> = {
      critical: 0,
      error: 0,
      warning: 0,
      info: 0,
    }
    
    for (const issue of this.issues) {
      counts[issue.severity]++
    }
    
    const blockedBy: QualityIssue[] = []
    const warnings: QualityIssue[] = []
    const requiredActions: string[] = []
    
    for (const rule of this.rules) {
      if (counts[rule.severity] > rule.maxCount) {
        const issuesOfSeverity = this.issues.filter(i => i.severity === rule.severity)
        
        if (rule.blockOnExceed) {
          blockedBy.push(...issuesOfSeverity)
          requiredActions.push(
            `Address ${counts[rule.severity]} ${rule.severity}(s) before proceeding`
          )
        } else {
          warnings.push(...issuesOfSeverity)
        }
      }
    }
    
    return {
      shouldBlock: blockedBy.length > 0,
      blockedBy,
      canProceedWithWarnings: warnings.length > 0 && blockedBy.length === 0,
      warnings,
      requiredActions,
    }
  }
  
  /**
   * Get issues by severity
   */
  getIssuesBySeverity(severity: IssueSeverity): QualityIssue[] {
    return this.issues.filter(i => i.severity === severity)
  }
  
  /**
   * Get auto-fixable issues
   */
  getAutoFixableIssues(): QualityIssue[] {
    return this.issues.filter(i => i.autoFixable)
  }
  
  /**
   * Clear issues
   */
  clear(): void {
    this.issues = []
  }
  
  /**
   * Get summary
   */
  getSummary(): Record<IssueSeverity, number> {
    return {
      critical: this.issues.filter(i => i.severity === 'critical').length,
      error: this.issues.filter(i => i.severity === 'error').length,
      warning: this.issues.filter(i => i.severity === 'warning').length,
      info: this.issues.filter(i => i.severity === 'info').length,
    }
  }
}

/**
 * Create quality issue
 */
export function createIssue(
  stage: AnalysisStage,
  severity: IssueSeverity,
  message: string,
  options?: {
    details?: string
    affectedElements?: string[]
    autoFixable?: boolean
    suggestedFix?: string
  }
): QualityIssue {
  return {
    id: `issue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    stage,
    severity,
    message,
    details: options?.details,
    affectedElements: options?.affectedElements,
    autoFixable: options?.autoFixable ?? false,
    suggestedFix: options?.suggestedFix,
  }
}

/**
 * Common issue patterns
 */
export const CommonIssues = {
  malformedJson: (stage: AnalysisStage): QualityIssue =>
    createIssue(stage, 'error', 'Failed to parse LLM response as JSON', {
      details: 'The response from the LLM was not valid JSON',
      autoFixable: true,
      suggestedFix: 'Attempt JSON repair or retry with different prompt',
    }),
  
  missingRequiredField: (stage: AnalysisStage, field: string): QualityIssue =>
    createIssue(stage, 'error', `Missing required field: ${field}`, {
      affectedElements: [field],
      autoFixable: false,
      suggestedFix: `Re-run analysis with explicit instruction to include ${field}`,
    }),
  
  lowConfidence: (stage: AnalysisStage, confidence: number): QualityIssue =>
    createIssue(stage, 'warning', `Low confidence score: ${confidence.toFixed(2)}`, {
      details: 'Analysis confidence is below recommended threshold',
      autoFixable: true,
      suggestedFix: 'Consider re-running with thorough mode enabled',
    }),
  
  inconsistentData: (stage: AnalysisStage, description: string): QualityIssue =>
    createIssue(stage, 'warning', 'Inconsistent data detected', {
      details: description,
      autoFixable: false,
    }),
  
  providerError: (stage: AnalysisStage, error: string): QualityIssue =>
    createIssue(stage, 'critical', `Provider error: ${error}`, {
      autoFixable: true,
      suggestedFix: 'Switch to fallback provider',
    }),
}
