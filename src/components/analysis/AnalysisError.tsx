/**
 * AnalysisError Component
 * Displays analysis errors with recovery options
 */

import React from 'react'
import { AnalysisStage } from '@/lib/analysis/prompts'

export type ErrorSeverity = 'warning' | 'error' | 'critical'

export interface AnalysisErrorProps {
  /** Error title/headline */
  title: string
  /** Detailed error message */
  message: string
  /** Error severity level */
  severity?: ErrorSeverity
  /** The stage where error occurred (if applicable) */
  stage?: AnalysisStage
  /** Whether the error is recoverable */
  recoverable?: boolean
  /** Callback to retry the operation */
  onRetry?: () => void
  /** Callback to skip/continue despite error */
  onSkip?: () => void
  /** Callback to abort the analysis */
  onAbort?: () => void
  /** Optional className */
  className?: string
  /** Additional error details */
  details?: string
  /** Suggested fixes */
  suggestions?: string[]
}

/**
 * AnalysisError - Error display with recovery options
 */
export const AnalysisError: React.FC<AnalysisErrorProps> = ({
  title,
  message,
  severity = 'error',
  stage,
  recoverable = true,
  onRetry,
  onSkip,
  onAbort,
  className = '',
  details,
  suggestions,
}) => {
  const getSeverityIcon = () => {
    switch (severity) {
      case 'critical':
        return '✕'
      case 'warning':
        return '⚠'
      case 'error':
      default:
        return '!'
    }
  }

  const getSeverityClass = () => {
    return `analysis-error--${severity}`
  }

  return (
    <div className={`analysis-error ${getSeverityClass()} ${className}`} role="alert">
      <div className="analysis-error__icon">
        {getSeverityIcon()}
      </div>

      <div className="analysis-error__content">
        <h3 className="analysis-error__title">{title}</h3>
        
        {stage && (
          <span className="analysis-error__stage">
            Stage: {getStageDisplayName(stage)}
          </span>
        )}

        <p className="analysis-error__message">{message}</p>

        {details && (
          <details className="analysis-error__details">
            <summary>Technical Details</summary>
            <pre className="analysis-error__details-content">{details}</pre>
          </details>
        )}

        {suggestions && suggestions.length > 0 && (
          <div className="analysis-error__suggestions">
            <h4 className="analysis-error__suggestions-title">Suggested Actions:</h4>
            <ul className="analysis-error__suggestions-list">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="analysis-error__suggestion">
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="analysis-error__actions">
          {recoverable && onRetry && (
            <button
              className="analysis-error__button analysis-error__button--primary"
              onClick={onRetry}
              type="button"
            >
              Retry
            </button>
          )}
          
          {recoverable && onSkip && (
            <button
              className="analysis-error__button analysis-error__button--secondary"
              onClick={onSkip}
              type="button"
            >
              Skip & Continue
            </button>
          )}
          
          {onAbort && (
            <button
              className="analysis-error__button analysis-error__button--danger"
              onClick={onAbort}
              type="button"
            >
              Abort Analysis
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Get display name for analysis stage
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

/**
 * Predefined error configurations for common scenarios
 */
export const PredefinedErrors = {
  networkError: (onRetry: () => void): AnalysisErrorProps => ({
    title: 'Network Error',
    message: 'Unable to connect to the analysis service. Please check your internet connection and try again.',
    severity: 'error',
    recoverable: true,
    onRetry,
    suggestions: [
      'Check your internet connection',
      'Verify API key configuration',
      'Try again in a few moments',
    ],
  }),

  providerError: (onRetry: () => void, onSkip?: () => void): AnalysisErrorProps => ({
    title: 'Provider Error',
    message: 'The LLM provider encountered an error while processing your request.',
    severity: 'error',
    recoverable: true,
    onRetry,
    onSkip,
    suggestions: [
      'Retry with current settings',
      'Switch to a fallback provider',
      'Reduce batch size and try again',
    ],
  }),

  parseError: (onRetry: () => void): AnalysisErrorProps => ({
    title: 'Parse Error',
    message: 'Unable to parse the analysis results. The response format was unexpected.',
    severity: 'warning',
    recoverable: true,
    onRetry,
    suggestions: [
      'Retry the analysis',
      'Enable thorough mode for better formatting',
      'Check if the manga images are clear and readable',
    ],
  }),

  lowConfidence: (stage: AnalysisStage, onRetry: () => void, onSkip: () => void): AnalysisErrorProps => ({
    title: 'Low Confidence Results',
    message: `The ${getStageDisplayName(stage).toLowerCase()} analysis completed but with low confidence scores. Results may be incomplete or inaccurate.`,
    severity: 'warning',
    stage,
    recoverable: true,
    onRetry,
    onSkip,
    suggestions: [
      'Retry with thorough mode enabled',
      'Check image quality and try again',
      'Proceed with manual review of results',
    ],
  }),

  criticalError: (onAbort: () => void): AnalysisErrorProps => ({
    title: 'Critical Analysis Error',
    message: 'A critical error occurred that prevents the analysis from continuing.',
    severity: 'critical',
    recoverable: false,
    onAbort,
    suggestions: [
      'Restart the application',
      'Check system resources',
      'Contact support if the issue persists',
    ],
  }),
}

export default AnalysisError
