/**
 * TimelineEventCard Component
 * Detailed card view for a timeline event
 */

import React from 'react'
import { TimelineEvent, Character } from '@/lib/db/schema'

export interface TimelineEventCardProps {
  /** The event to display */
  event: TimelineEvent
  /** Characters involved in this event */
  characters?: Character[]
  /** Whether this is a flashback */
  isFlashback?: boolean
  /** Optional className */
  className?: string
  /** Callback when a character is clicked */
  onCharacterClick?: (character: Character) => void
  /** Callback when related event is clicked */
  onRelatedEventClick?: (eventId: string) => void
  /** Related events for context */
  relatedEvents?: {
    previous?: TimelineEvent
    next?: TimelineEvent
  }
}

/**
 * TimelineEventCard - Detailed event information card
 */
export const TimelineEventCard: React.FC<TimelineEventCardProps> = ({
  event,
  characters = [],
  isFlashback = event.isFlashback,
  className = '',
  onCharacterClick,
  onRelatedEventClick,
  relatedEvents,
}) => {
  const getSignificanceClass = (significance: TimelineEvent['significance']) => {
    return `timeline-event-card--${significance}`
  }

  const getSignificanceLabel = (significance: TimelineEvent['significance']) => {
    const labels: Record<TimelineEvent['significance'], string> = {
      critical: 'Critical Event',
      major: 'Major Event',
      moderate: 'Moderate Event',
      minor: 'Minor Event',
    }
    return labels[significance]
  }

  const involvedCharacters = characters.filter(c => event.characters.includes(c.id))

  return (
    <div className={`timeline-event-card ${getSignificanceClass(event.significance)} ${className}`}>
      {/* Header */}
      <div className="timeline-event-card__header">
        <div className="timeline-event-card__badges">
          <span className={`timeline-event-card__significance timeline-event-card__significance--${event.significance}`}>
            {getSignificanceLabel(event.significance)}
          </span>
          {isFlashback && (
            <span className="timeline-event-card__flashback">Flashback</span>
          )}
        </div>
        <h3 className="timeline-event-card__title">{event.title}</h3>
      </div>

      {/* Content */}
      <div className="timeline-event-card__content">
        <p className="timeline-event-card__description">{event.description}</p>

        {/* Meta info */}
        <div className="timeline-event-card__meta">
          <div className="timeline-event-card__meta-item">
            <span className="timeline-event-card__meta-label">Page</span>
            <span className="timeline-event-card__meta-value">{event.pageNumber + 1}</span>
          </div>
          {event.chapterNumber !== undefined && (
            <div className="timeline-event-card__meta-item">
              <span className="timeline-event-card__meta-label">Chapter</span>
              <span className="timeline-event-card__meta-value">{event.chapterNumber}</span>
            </div>
          )}
          {event.chronologicalOrder !== undefined && (
            <div className="timeline-event-card__meta-item">
              <span className="timeline-event-card__meta-label">Chronological Order</span>
              <span className="timeline-event-card__meta-value">{event.chronologicalOrder}</span>
            </div>
          )}
        </div>

        {/* Characters */}
        {involvedCharacters.length > 0 && (
          <div className="timeline-event-card__characters">
            <h4 className="timeline-event-card__section-title">
              Characters ({involvedCharacters.length})
            </h4>
            <div className="timeline-event-card__character-list">
              {involvedCharacters.map(character => (
                <button
                  key={character.id}
                  className="timeline-event-card__character"
                  onClick={() => onCharacterClick?.(character)}
                  type="button"
                >
                  <span className="timeline-event-card__character-name">{character.name}</span>
                  <span className={`timeline-event-card__character-importance timeline-event-card__character-importance--${character.importance}`}>
                    {character.importance}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Related events */}
        {relatedEvents && (relatedEvents.previous || relatedEvents.next) && (
          <div className="timeline-event-card__related">
            <h4 className="timeline-event-card__section-title">Timeline Context</h4>
            <div className="timeline-event-card__related-events">
              {relatedEvents.previous && (
                <button
                  className="timeline-event-card__related-event timeline-event-card__related-event--previous"
                  onClick={() => onRelatedEventClick?.(relatedEvents.previous!.id)}
                  type="button"
                >
                  <span className="timeline-event-card__related-label">← Previous</span>
                  <span className="timeline-event-card__related-title">
                    {relatedEvents.previous.title}
                  </span>
                </button>
              )}
              {relatedEvents.next && (
                <button
                  className="timeline-event-card__related-event timeline-event-card__related-event--next"
                  onClick={() => onRelatedEventClick?.(relatedEvents.next!.id)}
                  type="button"
                >
                  <span className="timeline-event-card__related-label">Next →</span>
                  <span className="timeline-event-card__related-title">
                    {relatedEvents.next.title}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TimelineEventCard
