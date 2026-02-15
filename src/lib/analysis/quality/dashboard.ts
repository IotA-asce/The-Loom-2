/**
 * Quality metrics dashboard
 * Aggregates and displays quality metrics
 */

import { AnalysisStage } from '../prompts'
import { CalibratedConfidence, ConfidenceFactors } from './confidence'
import { QualityIssue } from './blocking'
import { ClassifiedIssue, ImpactCategory } from './classification'

export interface StageMetrics {
  stage: AnalysisStage
  confidence: CalibratedConfidence
  issueCount: number
  criticalIssues: number
  processingTime: number
  retryCount: number
  status: 'pending' | 'running' | 'completed' | 'failed'
}

export interface DashboardMetrics {
  overallConfidence: number
  overallQuality: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical'
  stages: StageMetrics[]
  totalIssues: number
  issuesBySeverity: Record<string, number>
  issuesByCategory: Record<ImpactCategory, number>
  trends: {
    confidence: 'improving' | 'stable' | 'declining'
    issues: 'increasing' | 'stable' | 'decreasing'
  }
  recommendations: string[]
}

export interface HistoricalMetrics {
  timestamp: number
  overallConfidence: number
  totalIssues: number
  stageConfidences: Record<AnalysisStage, number>
}

/**
 * Quality dashboard
 */
export class QualityDashboard {
  private stageMetrics = new Map<AnalysisStage, StageMetrics>()
  private classifiedIssues: ClassifiedIssue[] = []
  private history: HistoricalMetrics[] = []
  private startTime: number = Date.now()
  
  /**
   * Record stage completion
   */
  recordStage(
    stage: AnalysisStage,
    confidence: CalibratedConfidence,
    issues: QualityIssue[],
    processingTime: number,
    retryCount: number = 0
  ): void {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length
    
    const metrics: StageMetrics = {
      stage,
      confidence,
      issueCount: issues.length,
      criticalIssues,
      processingTime,
      retryCount,
      status: 'completed',
    }
    
    this.stageMetrics.set(stage, metrics)
    this.updateHistory()
  }
  
  /**
   * Record classified issues
   */
  recordIssues(issues: ClassifiedIssue[]): void {
    this.classifiedIssues.push(...issues)
  }
  
  /**
   * Get full dashboard metrics
   */
  getMetrics(): DashboardMetrics {
    const stages = Array.from(this.stageMetrics.values())
    
    // Calculate overall confidence
    const overallConfidence = stages.length > 0
      ? stages.reduce((sum, s) => sum + s.confidence.overall, 0) / stages.length
      : 0
    
    // Determine overall quality
    const overallQuality = this.determineQuality(overallConfidence)
    
    // Count issues
    const issuesBySeverity = this.countIssuesBySeverity()
    const issuesByCategory = this.countIssuesByCategory()
    const totalIssues = this.classifiedIssues.length
    
    // Calculate trends
    const trends = this.calculateTrends()
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      overallConfidence,
      issuesBySeverity,
      stages
    )
    
    return {
      overallConfidence: Math.round(overallConfidence * 100) / 100,
      overallQuality,
      stages,
      totalIssues,
      issuesBySeverity,
      issuesByCategory,
      trends,
      recommendations,
    }
  }
  
  /**
   * Determine overall quality level
   */
  private determineQuality(confidence: number): DashboardMetrics['overallQuality'] {
    if (confidence >= 0.85) return 'excellent'
    if (confidence >= 0.7) return 'good'
    if (confidence >= 0.5) return 'acceptable'
    if (confidence >= 0.3) return 'poor'
    return 'critical'
  }
  
  /**
   * Count issues by severity
   */
  private countIssuesBySeverity(): Record<string, number> {
    const counts: Record<string, number> = {
      critical: 0,
      error: 0,
      warning: 0,
      info: 0,
    }
    
    for (const issue of this.classifiedIssues) {
      counts[issue.severity] = (counts[issue.severity] || 0) + 1
    }
    
    return counts
  }
  
  /**
   * Count issues by category
   */
  private countIssuesByCategory(): Record<ImpactCategory, number> {
    const counts: Record<ImpactCategory, number> = {
      accuracy: 0,
      completeness: 0,
      consistency: 0,
      usability: 0,
      performance: 0,
    }
    
    for (const issue of this.classifiedIssues) {
      counts[issue.impact.category]++
    }
    
    return counts
  }
  
  /**
   * Calculate trends
   */
  private calculateTrends(): DashboardMetrics['trends'] {
    if (this.history.length < 2) {
      return { confidence: 'stable', issues: 'stable' }
    }
    
    const recent = this.history.slice(-5)
    const first = recent[0]
    const last = recent[recent.length - 1]
    
    const confidenceChange = last.overallConfidence - first.overallConfidence
    const issueChange = last.totalIssues - first.totalIssues
    
    return {
      confidence: confidenceChange > 0.05 ? 'improving' : 
                  confidenceChange < -0.05 ? 'declining' : 'stable',
      issues: issueChange > 2 ? 'increasing' :
              issueChange < -2 ? 'decreasing' : 'stable',
    }
  }
  
  /**
   * Generate recommendations
   */
  private generateRecommendations(
    confidence: number,
    issuesBySeverity: Record<string, number>,
    stages: StageMetrics[]
  ): string[] {
    const recommendations: string[] = []
    
    if (confidence < 0.5) {
      recommendations.push('Consider enabling thorough mode for better accuracy')
    }
    
    if (issuesBySeverity.critical > 0) {
      recommendations.push(`Address ${issuesBySeverity.critical} critical issue(s) immediately`)
    }
    
    if (issuesBySeverity.error > 3) {
      recommendations.push('Multiple errors detected - review analysis configuration')
    }
    
    const lowConfidenceStage = stages.find(s => s.confidence.overall < 0.5)
    if (lowConfidenceStage) {
      recommendations.push(`Re-run ${lowConfidenceStage.stage} analysis with adjusted parameters`)
    }
    
    const highRetryStage = stages.find(s => s.retryCount > 1)
    if (highRetryStage) {
      recommendations.push(`Consider switching provider for ${highRetryStage.stage} stage`)
    }
    
    if (recommendations.length === 0 && confidence > 0.8) {
      recommendations.push('Analysis quality is excellent - no action needed')
    }
    
    return recommendations
  }
  
  /**
   * Update history
   */
  private updateHistory(): void {
    const stages = Array.from(this.stageMetrics.values())
    
    const stageConfidences: Record<AnalysisStage, number> = {
      overview: 0,
      characters: 0,
      timeline: 0,
      relationships: 0,
      themes: 0,
    }
    
    for (const stage of stages) {
      stageConfidences[stage.stage] = stage.confidence.overall
    }
    
    this.history.push({
      timestamp: Date.now(),
      overallConfidence: stages.reduce((sum, s) => sum + s.confidence.overall, 0) / stages.length,
      totalIssues: this.classifiedIssues.length,
      stageConfidences,
    })
    
    // Keep only recent history
    if (this.history.length > 50) {
      this.history.shift()
    }
  }
  
  /**
   * Get processing summary
   */
  getSummary(): {
    totalTime: number
    stagesCompleted: number
    stagesTotal: number
    averageConfidence: number
  } {
    const stages = Array.from(this.stageMetrics.values())
    const totalTime = Date.now() - this.startTime
    
    return {
      totalTime,
      stagesCompleted: stages.filter(s => s.status === 'completed').length,
      stagesTotal: stages.length,
      averageConfidence: stages.length > 0
        ? stages.reduce((sum, s) => sum + s.confidence.overall, 0) / stages.length
        : 0,
    }
  }
  
  /**
   * Export metrics
   */
  export(): {
    metrics: DashboardMetrics
    summary: ReturnType<typeof this.getSummary>
    history: HistoricalMetrics[]
  } {
    return {
      metrics: this.getMetrics(),
      summary: this.getSummary(),
      history: [...this.history],
    }
  }
  
  /**
   * Reset dashboard
   */
  reset(): void {
    this.stageMetrics.clear()
    this.classifiedIssues = []
    this.history = []
    this.startTime = Date.now()
  }
}

/**
 * Quick quality check
 */
export function quickQualityCheck(
  confidence: number,
  issueCount: number
): 'pass' | 'review' | 'fail' {
  if (confidence >= 0.7 && issueCount === 0) return 'pass'
  if (confidence >= 0.4 && issueCount < 5) return 'review'
  return 'fail'
}

/**
 * Format metrics for display
 */
export function formatMetrics(metrics: DashboardMetrics): string {
  const lines = [
    `Overall Confidence: ${(metrics.overallConfidence * 100).toFixed(1)}%`,
    `Quality: ${metrics.overallQuality.toUpperCase()}`,
    `Total Issues: ${metrics.totalIssues}`,
    '',
    'Issues by Severity:',
    `  Critical: ${metrics.issuesBySeverity.critical || 0}`,
    `  Error: ${metrics.issuesBySeverity.error || 0}`,
    `  Warning: ${metrics.issuesBySeverity.warning || 0}`,
    `  Info: ${metrics.issuesBySeverity.info || 0}`,
    '',
    'Recommendations:',
    ...metrics.recommendations.map(r => `  • ${r}`),
  ]
  
  return lines.join('\n')
}
