/**
 * AnalysisProgress Component
 * Shows detailed progress of analysis across stages
 */

import React from 'react'
import { AnalysisStage } from '@/lib/analysis/prompts'

export interface AnalysisProgressProps {
  /** Current analysis stage */
  currentStage: AnalysisStage
  /** Progress within current stage (0-100) */
  stageProgress: number
  /** Overall progress (0-100) */
  overallProgress: number
  /** Current batch number */
  currentBatch?: number
  /** Total number of batches */
  totalBatches?: number
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number
  /** Optional className */
  className?: string
}

const STAGES: AnalysisStage[] = ['overview', 'characters', 'timeline', 'relationships', 'themes']

/**
 * AnalysisProgress - Visual progress indicator for analysis
 */
export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  currentStage,
  stageProgress,
  overallProgress,
  currentBatch,
  totalBatches,
  estimatedTimeRemaining,
  className = '',
}) => {
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.ceil(seconds)}s`
    const minutes = Math.ceil(seconds / 60)
    return `${minutes}m`
  }

  return (
    <div className={`analysis-progress ${className}`}>
      {/* Overall progress bar */}
      <div className="analysis-progress__overall">
        <div className="analysis-progress__header">
          <span className="analysis-progress__title">Analysis Progress</span>
          <span className="analysis-progress__percentage">{Math.round(overallProgress)}%</span>
        </div>
        <div className="analysis-progress__bar">
          <div 
            className="analysis-progress__fill analysis-progress__fill--overall"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        {estimatedTimeRemaining !== undefined && (
          <span className="analysis-progress__time">
            ~{formatTime(estimatedTimeRemaining)} remaining
          </span>
        )}
      </div>

      {/* Stage indicators */}
      <div className="analysis-progress__stages">
        {STAGES.map((stage, index) => {
          const stageIndex = STAGES.indexOf(currentStage)
          const isCompleted = index < stageIndex
          const isCurrent = index === stageIndex
          const isPending = index > stageIndex

          return (
            <div
              key={stage}
              className={`analysis-progress__stage 
                ${isCompleted ? 'analysis-progress__stage--completed' : ''}
                ${isCurrent ? 'analysis-progress__stage--current' : ''}
                ${isPending ? 'analysis-progress__stage--pending' : ''}
              `}
            >
              <div className="analysis-progress__stage-indicator">
                {isCompleted ? (
                  <span className="analysis-progress__check">✓</span>
                ) : isCurrent ? (
                  <span className="analysis-progress__current-dot" />
                ) : (
                  <span className="analysis-progress__pending-dot" />
                )}
              </div>
              <span className="analysis-progress__stage-name">
                {getStageDisplayName(stage)}
              </span>
              {isCurrent && currentBatch !== undefined && totalBatches !== undefined && (
                <span className="analysis-progress__batch">
                  Batch {currentBatch}/{totalBatches}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Current stage progress */}
      {stageProgress > 0 && stageProgress < 100 && (
        <div className="analysis-progress__stage-progress">
          <span className="analysis-progress__stage-label">
            {getStageDisplayName(currentStage)} Progress
          </span>
          <div className="analysis-progress__bar analysis-progress__bar--stage">
            <div 
              className="analysis-progress__fill analysis-progress__fill--stage"
              style={{ width: `${stageProgress}%` }}
            />
          </div>
          <span className="analysis-progress__stage-percentage">
            {Math.round(stageProgress)}%
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Get display name for stage
 */
function getStageDisplayName(stage: AnalysisStage): string {
  const names: Record<AnalysisStage, string> = {
    overview: 'Visual Overview',
    characters: 'Character Discovery',
    timeline: 'Timeline Extraction',
    relationships: 'Relationship Mapping',
    themes: 'Theme Synthesis',
  }
  return names[stage]
}

export default AnalysisProgress
