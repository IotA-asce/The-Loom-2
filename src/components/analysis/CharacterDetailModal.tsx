/**
 * CharacterDetailModal Component
 * Detailed view of a character in a modal
 */

import React, { useEffect } from 'react'
import { Character, TimelineEvent, Relationship } from '@/lib/db/schema'

export interface CharacterDetailModalProps {
  /** The character to display */
  character: Character
  /** Character's events */
  events?: TimelineEvent[]
  /** Character's relationships */
  relationships?: Relationship[]
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback to close the modal */
  onClose: () => void
  /** Callback when an event is clicked */
  onEventClick?: (event: TimelineEvent) => void
  /** Optional className */
  className?: string
}

/**
 * CharacterDetailModal - Detailed character information modal
 */
export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  character,
  events = [],
  relationships = [],
  isOpen,
  onClose,
  onEventClick,
  className = '',
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const getImportanceColor = (importance: Character['importance']) => {
    const colors: Record<Character['importance'], string> = {
      major: 'character-detail__importance--major',
      supporting: 'character-detail__importance--supporting',
      minor: 'character-detail__importance--minor',
    }
    return colors[importance]
  }

  const sortedEvents = [...events].sort((a, b) => a.pageNumber - b.pageNumber)
  const significantEvents = sortedEvents.filter(
    e => e.significance === 'major' || e.significance === 'critical'
  )

  return (
    <div 
      className={`character-detail__overlay ${className}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="character-detail-title"
    >
      <div 
        className="character-detail__modal"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="character-detail__close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>

        <div className="character-detail__header">
          <span className={`character-detail__importance ${getImportanceColor(character.importance)}`}>
            {character.importance.charAt(0).toUpperCase() + character.importance.slice(1)} Character
          </span>
          <h2 id="character-detail-title" className="character-detail__name">
            {character.name}
          </h2>
          {character.aliases.length > 0 && (
            <p className="character-detail__aliases">
              Also known as: {character.aliases.join(', ')}
            </p>
          )}
        </div>

        <div className="character-detail__content">
          <section className="character-detail__section">
            <h3 className="character-detail__section-title">Description</h3>
            <p className="character-detail__description">{character.description}</p>
          </section>

          {character.appearance && (
            <section className="character-detail__section">
              <h3 className="character-detail__section-title">Appearance</h3>
              <p className="character-detail__appearance">{character.appearance}</p>
            </section>
          )}

          {character.personality && (
            <section className="character-detail__section">
              <h3 className="character-detail__section-title">Personality</h3>
              <p className="character-detail__personality">{character.personality}</p>
            </section>
          )}

          <section className="character-detail__section">
            <h3 className="character-detail__section-title">
              Appearances ({events.length})
            </h3>
            {sortedEvents.length > 0 ? (
              <ul className="character-detail__event-list">
                {sortedEvents.slice(0, 10).map(event => (
                  <li 
                    key={event.id}
                    className={`character-detail__event character-detail__event--${event.significance}`}
                  >
                    <button
                      className="character-detail__event-button"
                      onClick={() => onEventClick?.(event)}
                      type="button"
                    >
                      <span className="character-detail__event-page">P{event.pageNumber + 1}</span>
                      <span className="character-detail__event-title">{event.title}</span>
                      {event.isFlashback && (
                        <span className="character-detail__event-flashback">Flashback</span>
                      )}
                    </button>
                  </li>
                ))}
                {sortedEvents.length > 10 && (
                  <li className="character-detail__event-more">
                    +{sortedEvents.length - 10} more appearances
                  </li>
                )}
              </ul>
            ) : (
              <p className="character-detail__no-events">No recorded appearances</p>
            )}
          </section>

          {relationships.length > 0 && (
            <section className="character-detail__section">
              <h3 className="character-detail__section-title">
                Relationships ({relationships.length})
              </h3>
              <ul className="character-detail__relationship-list">
                {relationships.map(rel => (
                  <li key={rel.id} className="character-detail__relationship">
                    <span className="character-detail__relationship-type">{rel.type}</span>
                    <span className="character-detail__relationship-desc">{rel.description}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {significantEvents.length > 0 && (
            <section className="character-detail__section">
              <h3 className="character-detail__section-title">Key Moments</h3>
              <ul className="character-detail__key-moments">
                {significantEvents.map(event => (
                  <li key={event.id} className="character-detail__key-moment">
                    <span className="character-detail__key-moment-page">
                      Page {event.pageNumber + 1}
                    </span>
                    <span className="character-detail__key-moment-title">{event.title}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export default CharacterDetailModal
