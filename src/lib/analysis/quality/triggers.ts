/**
 * User review triggers
 * Determines when user review is needed based on confidence thresholds
 */

import { AnalysisStage } from '../prompts'
import { CalibratedConfidence } from './confidence'
import { QualityIssue, IssueSeverity } from './blocking'

export interface ReviewTrigger {
  id: string
  condition: 'confidence' | 'issue_severity' | 'inconsistency' | 'manual'
  threshold: number
  message: string
  priority: 'low' | 'medium' | 'high'
  autoTrigger: boolean
}

export interface ReviewRequest {
  stage: AnalysisStage
  trigger: ReviewTrigger
  confidence?: CalibratedConfidence
  issues?: QualityIssue[]
  context: {
    description: string
    suggestedAction: string
    estimatedTime: string
  }
}

/**
 * Default review triggers
 */
export const DEFAULT_REVIEW_TRIGGERS: ReviewTrigger[] = [
  {
    id: 'low-confidence',
    condition: 'confidence',
    threshold: 0.5,
    message: 'Analysis confidence is below acceptable threshold',
    priority: 'high',
    autoTrigger: true,
  },
  {
    id: 'critical-issue',
    condition: 'issue_severity',
    threshold: 1, // 1 = critical
    message: 'Critical quality issue detected',
    priority: 'high',
    autoTrigger: true,
  },
  {
    id: 'high-inconsistency',
    condition: 'inconsistency',
    threshold: 0.7,
    message: 'Significant inconsistencies found in analysis',
    priority: 'medium',
    autoTrigger: true,
  },
  {
    id: 'manual-review',
    condition: 'manual',
    threshold: 0,
    message: 'Manual review requested',
    priority: 'low',
    autoTrigger: false,
  },
]

/**
 * Review trigger manager
 */
export class ReviewTriggerManager {
  private triggers: ReviewTrigger[]
  private triggered: ReviewRequest[] = []
  private dismissed = new Set<string>()
  
  constructor(triggers: ReviewTrigger[] = DEFAULT_REVIEW_TRIGGERS) {
    this.triggers = triggers
  }
  
  /**
   * Check confidence against triggers
   */
  checkConfidence(
    stage: AnalysisStage,
    confidence: CalibratedConfidence
  ): ReviewRequest | null {
    const trigger = this.triggers.find(
      t => t.condition === 'confidence' && 
           t.threshold >= confidence.overall &&
           !this.dismissed.has(t.id)
    )
    
    if (!trigger) return null
    
    const request: ReviewRequest = {
      stage,
      trigger,
      confidence,
      context: {
        description: `Confidence of ${confidence.overall.toFixed(2)} is below threshold of ${trigger.threshold}`,
        suggestedAction: 'Review analysis results and consider re-running with adjusted parameters',
        estimatedTime: '5-10 minutes',
      },
    }
    
    if (trigger.autoTrigger) {
      this.triggered.push(request)
    }
    
    return request
  }
  
  /**
   * Check issues against triggers
   */
  checkIssues(
    stage: AnalysisStage,
    issues: QualityIssue[]
  ): ReviewRequest | null {
    // Check for critical issues
    const criticalCount = issues.filter(i => i.severity === 'critical').length
    const errorCount = issues.filter(i => i.severity === 'error').length
    
    const trigger = this.triggers.find(t => {
      if (t.condition !== 'issue_severity' || this.dismissed.has(t.id)) {
        return false
      }
      
      if (t.threshold === 1 && criticalCount > 0) return true
      if (t.threshold === 0.8 && errorCount >= 3) return true
      
      return false
    })
    
    if (!trigger) return null
    
    const request: ReviewRequest = {
      stage,
      trigger,
      issues: issues.filter(i => i.severity === 'critical' || i.severity === 'error'),
      context: {
        description: `${criticalCount} critical and ${errorCount} error issues detected`,
        suggestedAction: 'Review and resolve quality issues before proceeding',
        estimatedTime: '10-15 minutes',
      },
    }
    
    if (trigger.autoTrigger) {
      this.triggered.push(request)
    }
    
    return request
  }
  
  /**
   * Check for inconsistencies
   */
  checkInconsistency(
    stage: AnalysisStage,
    inconsistencyScore: number
  ): ReviewRequest | null {
    const trigger = this.triggers.find(
      t => t.condition === 'inconsistency' &&
           inconsistencyScore >= t.threshold &&
           !this.dismissed.has(t.id)
    )
    
    if (!trigger) return null
    
    const request: ReviewRequest = {
      stage,
      trigger,
      context: {
        description: `Inconsistency score of ${inconsistencyScore.toFixed(2)} indicates data quality problems`,
        suggestedAction: 'Review timeline and character data for contradictions',
        estimatedTime: '5-10 minutes',
      },
    }
    
    if (trigger.autoTrigger) {
      this.triggered.push(request)
    }
    
    return request
  }
  
  /**
   * Create manual review request
   */
  requestManualReview(
    stage: AnalysisStage,
    reason: string
  ): ReviewRequest {
    const trigger = this.triggers.find(t => t.condition === 'manual')!
    
    const request: ReviewRequest = {
      stage,
      trigger,
      context: {
        description: reason,
        suggestedAction: 'Perform manual review of analysis results',
        estimatedTime: '5-10 minutes',
      },
    }
    
    this.triggered.push(request)
    return request
  }
  
  /**
   * Dismiss a trigger
   */
  dismiss(triggerId: string): void {
    this.dismissed.add(triggerId)
  }
  
  /**
   * Get all triggered reviews
   */
  getTriggered(): ReviewRequest[] {
    return [...this.triggered]
  }
  
  /**
   * Get pending reviews
   */
  getPending(): ReviewRequest[] {
    return this.triggered.filter(r => !this.dismissed.has(r.trigger.id))
  }
  
  /**
   * Clear triggered reviews
   */
  clear(): void {
    this.triggered = []
  }
  
  /**
   * Add custom trigger
   */
  addTrigger(trigger: ReviewTrigger): void {
    this.triggers.push(trigger)
  }
  
  /**
   * Remove trigger
   */
  removeTrigger(triggerId: string): void {
    this.triggers = this.triggers.filter(t => t.id !== triggerId)
  }
}

/**
 * Confidence threshold manager
 */
export class ConfidenceThresholdManager {
  private thresholds: Map<AnalysisStage, number> = new Map()
  private defaultThreshold = 0.5
  
  /**
   * Set threshold for stage
   */
  setThreshold(stage: AnalysisStage, threshold: number): void {
    this.thresholds.set(stage, threshold)
  }
  
  /**
   * Get threshold for stage
   */
  getThreshold(stage: AnalysisStage): number {
    return this.thresholds.get(stage) ?? this.defaultThreshold
  }
  
  /**
   * Check if confidence meets threshold
   */
  meetsThreshold(stage: AnalysisStage, confidence: CalibratedConfidence): boolean {
    return confidence.overall >= this.getThreshold(stage)
  }
  
  /**
   * Set default threshold
   */
  setDefaultThreshold(threshold: number): void {
    this.defaultThreshold = threshold
  }
  
  /**
   * Get all thresholds
   */
  getAllThresholds(): Record<AnalysisStage, number> {
    return {
      overview: this.getThreshold('overview'),
      characters: this.getThreshold('characters'),
      timeline: this.getThreshold('timeline'),
      relationships: this.getThreshold('relationships'),
      themes: this.getThreshold('themes'),
    }
  }
}

/**
 * Quick check if review is needed
 */
export function isReviewNeeded(
  confidence: CalibratedConfidence,
  threshold: number = 0.5
): boolean {
  return confidence.overall < threshold
}

/**
 * Get review priority from confidence
 */
export function getReviewPriority(
  confidence: CalibratedConfidence
): 'low' | 'medium' | 'high' {
  if (confidence.overall < 0.3) return 'high'
  if (confidence.overall < 0.5) return 'medium'
  return 'low'
}
