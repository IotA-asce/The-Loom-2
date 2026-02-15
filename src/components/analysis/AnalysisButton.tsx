/**
 * AnalysisButton Component
 * Button to trigger storyline analysis with state handling
 */

import React, { useCallback } from 'react'
import { AnalysisStage } from '@/lib/analysis/prompts'

export interface AnalysisButtonProps {
  /** Current analysis status */
  status: 'idle' | 'analyzing' | 'completed' | 'error'
  /** Current analysis stage (if analyzing) */
  currentStage?: AnalysisStage
  /** Whether analysis can be started */
  canAnalyze: boolean
  /** Callback when button is clicked */
  onAnalyze: () => void
  /** Callback to cancel ongoing analysis */
  onCancel?: () => void
  /** Optional className for styling */
  className?: string
  /** Button size variant */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * AnalysisButton - Primary action button for starting storyline analysis
 */
export const AnalysisButton: React.FC<AnalysisButtonProps> = ({
  status,
  currentStage,
  canAnalyze,
  onAnalyze,
  onCancel,
  className = '',
  size = 'md',
}) => {
  const handleClick = useCallback(() => {
    if (status === 'analyzing') {
      onCancel?.()
    } else {
      onAnalyze()
    }
  }, [status, onAnalyze, onCancel])

  const getButtonContent = () => {
    switch (status) {
      case 'analyzing':
        return (
          <>
            <span className="analysis-button__spinner" />
            <span>Analyzing{currentStage ? ` (${getStageLabel(currentStage)})` : ''}...</span>
          </>
        )
      case 'completed':
        return 'Analysis Complete ✓'
      case 'error':
        return 'Retry Analysis'
      default:
        return 'Start Analysis'
    }
  }

  const getButtonClass = () => {
    const baseClass = 'analysis-button'
    const sizeClass = `${baseClass}--${size}`
    
    switch (status) {
      case 'analyzing':
        return `${baseClass} ${baseClass}--analyzing ${sizeClass} ${className}`
      case 'completed':
        return `${baseClass} ${baseClass}--completed ${sizeClass} ${className}`
      case 'error':
        return `${baseClass} ${baseClass}--error ${sizeClass} ${className}`
      default:
        return `${baseClass} ${baseClass}--idle ${sizeClass} ${className}`
    }
  }

  return (
    <button
      className={getButtonClass()}
      onClick={handleClick}
      disabled={!canAnalyze && status !== 'analyzing'}
      aria-label={status === 'analyzing' ? 'Cancel analysis' : 'Start analysis'}
    >
      {getButtonContent()}
    </button>
  )
}

/**
 * Get human-readable stage label
 */
function getStageLabel(stage: AnalysisStage): string {
  const labels: Record<AnalysisStage, string> = {
    overview: 'Overview',
    characters: 'Characters',
    timeline: 'Timeline',
    relationships: 'Relationships',
    themes: 'Themes',
  }
  return labels[stage]
}

export default AnalysisButton
