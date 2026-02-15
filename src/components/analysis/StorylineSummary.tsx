/**
 * StorylineSummary Component
 * Displays summary of analyzed storyline
 */

import React from 'react'
import { Storyline } from '@/lib/db/schema'

export interface StorylineSummaryProps {
  /** The storyline data to display */
  storyline: Storyline
  /** Optional className */
  className?: string
  /** Callback when a section is clicked */
  onSectionClick?: (section: 'characters' | 'timeline' | 'themes' | 'relationships') => void
}

/**
 * StorylineSummary - Overview card for analyzed storyline
 */
export const StorylineSummary: React.FC<StorylineSummaryProps> = ({
  storyline,
  className = '',
  onSectionClick,
}) => {
  const { characters, timeline, themes, relationships, confidence } = storyline

  const getConfidenceColor = (conf: number): string => {
    if (conf >= 0.8) return 'storyline-summary__confidence--high'
    if (conf >= 0.6) return 'storyline-summary__confidence--medium'
    if (conf >= 0.4) return 'storyline-summary__confidence--low'
    return 'storyline-summary__confidence--critical'
  }

  return (
    <div className={`storyline-summary ${className}`}>
      <div className="storyline-summary__header">
        <h2 className="storyline-summary__title">Storyline Analysis</h2>
        <div className={`storyline-summary__confidence ${getConfidenceColor(confidence)}`}>
          <span className="storyline-summary__confidence-label">Confidence</span>
          <span className="storyline-summary__confidence-value">
            {Math.round(confidence * 100)}%
          </span>
        </div>
      </div>

      <div className="storyline-summary__stats">
        <button
          className="storyline-summary__stat"
          onClick={() => onSectionClick?.('characters')}
          type="button"
        >
          <span className="storyline-summary__stat-value">{characters.length}</span>
          <span className="storyline-summary__stat-label">Characters</span>
          {getMajorCharacterCount(characters) > 0 && (
            <span className="storyline-summary__stat-sub">
              {getMajorCharacterCount(characters)} major
            </span>
          )}
        </button>

        <button
          className="storyline-summary__stat"
          onClick={() => onSectionClick?.('timeline')}
          type="button"
        >
          <span className="storyline-summary__stat-value">{timeline.length}</span>
          <span className="storyline-summary__stat-label">Events</span>
          {getCriticalEventCount(timeline) > 0 && (
            <span className="storyline-summary__stat-sub">
              {getCriticalEventCount(timeline)} critical
            </span>
          )}
        </button>

        <button
          className="storyline-summary__stat"
          onClick={() => onSectionClick?.('themes')}
          type="button"
        >
          <span className="storyline-summary__stat-value">{themes.length}</span>
          <span className="storyline-summary__stat-label">Themes</span>
          {getDominantThemeCount(themes) > 0 && (
            <span className="storyline-summary__stat-sub">
              {getDominantThemeCount(themes)} dominant
            </span>
          )}
        </button>

        <button
          className="storyline-summary__stat"
          onClick={() => onSectionClick?.('relationships')}
          type="button"
        >
          <span className="storyline-summary__stat-value">{relationships.length}</span>
          <span className="storyline-summary__stat-label">Relationships</span>
        </button>
      </div>

      {storyline.visualOverview && (
        <div className="storyline-summary__overview">
          <h3 className="storyline-summary__section-title">Visual Overview</h3>
          <div className="storyline-summary__overview-grid">
            <div className="storyline-summary__overview-item">
              <span className="storyline-summary__overview-label">Art Style</span>
              <span className="storyline-summary__overview-value">
                {storyline.visualOverview.artStyle}
              </span>
            </div>
            <div className="storyline-summary__overview-item">
              <span className="storyline-summary__overview-label">Narrative Density</span>
              <span className="storyline-summary__overview-value">
                {storyline.visualOverview.narrativeDensity}
              </span>
            </div>
            <div className="storyline-summary__overview-item">
              <span className="storyline-summary__overview-label">Panel Complexity</span>
              <span className="storyline-summary__overview-value">
                {storyline.visualOverview.panelComplexity}
              </span>
            </div>
          </div>
          {storyline.visualOverview.genreIndicators.length > 0 && (
            <div className="storyline-summary__genres">
              {storyline.visualOverview.genreIndicators.map(genre => (
                <span key={genre} className="storyline-summary__genre-tag">
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {storyline.issues && storyline.issues.length > 0 && (
        <div className="storyline-summary__issues">
          <h3 className="storyline-summary__section-title">Issues</h3>
          <ul className="storyline-summary__issue-list">
            {storyline.issues.slice(0, 3).map((issue, index) => (
              <li 
                key={index} 
                className={`storyline-summary__issue storyline-summary__issue--${issue.severity}`}
              >
                <span className="storyline-summary__issue-type">{issue.type}</span>
                <span className="storyline-summary__issue-message">{issue.message}</span>
              </li>
            ))}
            {storyline.issues.length > 3 && (
              <li className="storyline-summary__issue storyline-summary__issue--more">
                +{storyline.issues.length - 3} more issues
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

// Helper functions
function getMajorCharacterCount(characters: Storyline['characters']): number {
  return characters.filter(c => c.importance === 'major').length
}

function getCriticalEventCount(events: Storyline['timeline']): number {
  return events.filter(e => e.significance === 'critical').length
}

function getDominantThemeCount(themes: Storyline['themes']): number {
  return themes.filter(t => t.prevalence > 0.7).length
}

export default StorylineSummary
