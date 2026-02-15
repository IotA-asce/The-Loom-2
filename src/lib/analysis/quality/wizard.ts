/**
 * Guided intervention wizard
 * Interactive wizard for resolving quality issues
 */

import { QualityIssue, IssueSeverity } from './blocking'
import { ClassifiedIssue, ImpactCategory } from './classification'
import { AnalysisStage } from '../prompts'

export interface WizardStep {
  id: string
  title: string
  description: string
  issue: ClassifiedIssue
  options: WizardOption[]
  canSkip: boolean
  autoAdvance: boolean
}

export interface WizardOption {
  id: string
  label: string
  description: string
  action: 'retry' | 'skip' | 'manual_fix' | 'auto_fix' | 'abort'
  confidence: number
}

export interface WizardResult {
  completed: boolean
  resolution: 'fixed' | 'skipped' | 'manual_required' | 'aborted'
  actionsTaken: string[]
  remainingIssues: ClassifiedIssue[]
}

/**
 * Guided intervention wizard
 */
export class InterventionWizard {
  private issues: ClassifiedIssue[]
  private currentIndex = 0
  private results: WizardResult = {
    completed: false,
    resolution: 'aborted',
    actionsTaken: [],
    remainingIssues: [],
  }
  
  constructor(issues: ClassifiedIssue[]) {
    this.issues = prioritizeIssues(issues)
  }
  
  /**
   * Get current step
   */
  getCurrentStep(): WizardStep | null {
    if (this.currentIndex >= this.issues.length) {
      return null
    }
    
    const issue = this.issues[this.currentIndex]
    return this.createStep(issue)
  }
  
  /**
   * Create wizard step from issue
   */
  private createStep(issue: ClassifiedIssue): WizardStep {
    const options = this.generateOptions(issue)
    
    return {
      id: `step-${this.currentIndex}`,
      title: this.getStepTitle(issue),
      description: this.getStepDescription(issue),
      issue,
      options,
      canSkip: issue.severity !== 'critical' && issue.severity !== 'error',
      autoAdvance: issue.autoFixable && options.some(o => o.action === 'auto_fix'),
    }
  }
  
  /**
   * Generate options for issue
   */
  private generateOptions(issue: ClassifiedIssue): WizardOption[] {
    const options: WizardOption[] = []
    
    // Auto-fix option if available
    if (issue.autoFixable) {
      options.push({
        id: 'auto_fix',
        label: 'Auto-fix Issue',
        description: issue.suggestedFix || 'Attempt automatic resolution',
        action: 'auto_fix',
        confidence: 0.7,
      })
    }
    
    // Retry option
    options.push({
      id: 'retry',
      label: 'Retry Analysis',
      description: 'Re-run this stage with adjusted parameters',
      action: 'retry',
      confidence: 0.6,
    })
    
    // Manual fix for user intervention
    options.push({
      id: 'manual',
      label: 'Fix Manually',
      description: 'Pause for manual correction',
      action: 'manual_fix',
      confidence: 0.9,
    })
    
    // Skip option
    if (issue.severity !== 'critical') {
      options.push({
        id: 'skip',
        label: 'Skip Issue',
        description: 'Continue without resolving this issue',
        action: 'skip',
        confidence: 0.4,
      })
    }
    
    // Abort option
    options.push({
      id: 'abort',
      label: 'Abort Analysis',
      description: 'Stop the analysis process',
      action: 'abort',
      confidence: 1,
    })
    
    return options
  }
  
  /**
   * Get step title based on issue
   */
  private getStepTitle(issue: ClassifiedIssue): string {
    const categoryTitles: Record<ImpactCategory, string> = {
      accuracy: 'Accuracy Issue Detected',
      completeness: 'Incomplete Analysis',
      consistency: 'Data Inconsistency',
      usability: 'Processing Issue',
      performance: 'Performance Warning',
    }
    
    return categoryTitles[issue.impact.category] || 'Quality Issue'
  }
  
  /**
   * Get step description
   */
  private getStepDescription(issue: ClassifiedIssue): string {
    return `${issue.message}${issue.details ? `\n\n${issue.details}` : ''}`
  }
  
  /**
   * Submit option selection
   */
  submitOption(optionId: string): boolean {
    const step = this.getCurrentStep()
    if (!step) return false
    
    const option = step.options.find(o => o.id === optionId)
    if (!option) return false
    
    // Record action
    this.results.actionsTaken.push(`${step.issue.id}: ${option.action}`)
    
    switch (option.action) {
      case 'auto_fix':
      case 'retry':
        // Remove issue from list (will be re-checked)
        this.issues.splice(this.currentIndex, 1)
        return this.currentIndex < this.issues.length
        
      case 'skip':
        // Move to next issue
        this.currentIndex++
        return this.currentIndex < this.issues.length
        
      case 'manual_fix':
        this.results.resolution = 'manual_required'
        this.results.remainingIssues = this.issues.slice(this.currentIndex)
        return false
        
      case 'abort':
        this.results.resolution = 'aborted'
        this.results.remainingIssues = this.issues.slice(this.currentIndex)
        return false
    }
  }
  
  /**
   * Complete wizard
   */
  complete(): WizardResult {
    this.results.completed = true
    
    if (this.results.resolution === 'aborted') {
      return this.results
    }
    
    if (this.issues.length === 0 || this.currentIndex >= this.issues.length) {
      this.results.resolution = 'fixed'
    }
    
    return this.results
  }
  
  /**
   * Get progress
   */
  getProgress(): { current: number; total: number; percentage: number } {
    return {
      current: this.currentIndex + 1,
      total: this.issues.length,
      percentage: Math.round((this.currentIndex / this.issues.length) * 100),
    }
  }
  
  /**
   * Get all remaining issues
   */
  getRemainingIssues(): ClassifiedIssue[] {
    return this.issues.slice(this.currentIndex)
  }
}

/**
 * Prioritize issues for wizard
 */
function prioritizeIssues(issues: ClassifiedIssue[]): ClassifiedIssue[] {
  const severityOrder = ['critical', 'error', 'warning', 'info']
  
  return [...issues].sort((a, b) => {
    // Sort by severity first
    const severityDiff = severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
    if (severityDiff !== 0) return severityDiff
    
    // Then by impact score
    return b.impact.impactScore - a.impact.impactScore
  })
}

/**
 * Quick wizard for common scenarios
 */
export function createRetryWizard(
  stage: AnalysisStage,
  error: string
): InterventionWizard {
  const issue: ClassifiedIssue = {
    id: 'retry-wizard',
    stage,
    severity: 'error',
    message: `Analysis failed: ${error}`,
    autoFixable: true,
    suggestedFix: 'Retry with adjusted parameters',
    impact: {
      category: 'usability',
      severity: 'error',
      impactScore: 0.8,
      affectedOutputs: ['all'],
      userVisible: true,
    },
  }
  
  return new InterventionWizard([issue])
}

/**
 * Create wizard for low confidence
 */
export function createConfidenceWizard(
  stage: AnalysisStage,
  confidence: number
): InterventionWizard {
  const issue: ClassifiedIssue = {
    id: 'confidence-wizard',
    stage,
    severity: 'warning',
    message: `Low confidence in ${stage} analysis`,
    details: `Confidence score of ${confidence.toFixed(2)} is below recommended threshold`,
    autoFixable: true,
    suggestedFix: 'Enable thorough mode for better results',
    impact: {
      category: 'accuracy',
      severity: 'warning',
      impactScore: 0.6,
      affectedOutputs: ['analysis_results'],
      userVisible: true,
    },
  }
  
  return new InterventionWizard([issue])
}
