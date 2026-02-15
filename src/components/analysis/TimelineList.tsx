/**
 * TimelineList Component
 * Displays timeline events in a scrollable list
 */

import React, { useState, useMemo } from 'react'
import { TimelineEvent } from '@/lib/db/schema'

export interface TimelineListProps {
  /** Events to display */
  events: TimelineEvent[]
  /** Optional className */
  className?: string
  /** Callback when an event is clicked */
  onEventClick?: (event: TimelineEvent) => void
  /** Filter by significance */
  filterSignificance?: TimelineEvent['significance'][]
  /** Group by chapter */
  groupByChapter?: boolean
  /** Show chronological order instead of reading order */
  chronologicalOrder?: boolean
}

/**
 * TimelineList - Scrollable list of timeline events
 */
export const TimelineList: React.FC<TimelineListProps> = ({
  events,
  className = '',
  onEventClick,
  filterSignificance,
  groupByChapter = false,
  chronologicalOrder = false,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set())

  const filteredEvents = useMemo(() => {
    let result = [...events]

    // Filter by significance
    if (filterSignificance && filterSignificance.length > 0) {
      result = result.filter(e => filterSignificance.includes(e.significance))
    }

    // Sort
    result.sort((a, b) => {
      if (chronologicalOrder && a.chronologicalOrder !== undefined && b.chronologicalOrder !== undefined) {
        return a.chronologicalOrder - b.chronologicalOrder
      }
      return a.pageNumber - b.pageNumber
    })

    return result
  }, [events, filterSignificance, chronologicalOrder])

  const groupedEvents = useMemo(() => {
    if (!groupByChapter) return { ungrouped: filteredEvents }

    const groups = new Map<number, TimelineEvent[]>()
    
    for (const event of filteredEvents) {
      const chapter = event.chapterNumber ?? 0
      if (!groups.has(chapter)) {
        groups.set(chapter, [])
      }
      groups.get(chapter)!.push(event)
    }

    return Object.fromEntries(groups)
  }, [filteredEvents, groupByChapter])

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedId(event.id)
    onEventClick?.(event)
  }

  const toggleGroup = (chapter: number) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(chapter)) {
      newExpanded.delete(chapter)
    } else {
      newExpanded.add(chapter)
    }
    setExpandedGroups(newExpanded)
  }

  const getSignificanceClass = (significance: TimelineEvent['significance']) => {
    return `timeline-list__event--${significance}`
  }

  const getSignificanceLabel = (significance: TimelineEvent['significance']) => {
    const labels: Record<TimelineEvent['significance'], string> = {
      critical: 'Critical',
      major: 'Major',
      moderate: 'Moderate',
      minor: 'Minor',
    }
    return labels[significance]
  }

  const renderEvent = (event: TimelineEvent) => (
    <button
      key={event.id}
      className={`timeline-list__event ${getSignificanceClass(event.significance)} ${
        selectedId === event.id ? 'timeline-list__event--selected' : ''
      } ${event.isFlashback ? 'timeline-list__event--flashback' : ''}`}
      onClick={() => handleEventClick(event)}
      type="button"
    >
      <div className="timeline-list__event-marker" />
      
      <div className="timeline-list__event-content">
        <div className="timeline-list__event-header">
          <span className={`timeline-list__event-badge timeline-list__event-badge--${event.significance}`}>
            {getSignificanceLabel(event.significance)}
          </span>
          {event.isFlashback && (
            <span className="timeline-list__event-flashback-badge">Flashback</span>
          )}
        </div>

        <h4 className="timeline-list__event-title">{event.title}</h4>
        <p className="timeline-list__event-description">{event.description}</p>

        <div className="timeline-list__event-meta">
          <span className="timeline-list__event-page">Page {event.pageNumber + 1}</span>
          {event.characters.length > 0 && (
            <span className="timeline-list__event-characters">
              {event.characters.length} character{event.characters.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </button>
  )

  return (
    <div className={`timeline-list ${className}`}>
      <div className="timeline-list__header">
        <span className="timeline-list__count">
          {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
        </span>
        {chronologicalOrder && (
          <span className="timeline-list__order-indicator">Chronological Order</span>
        )}
      </div>

      <div className="timeline-list__container">
        {groupByChapter ? (
          Object.entries(groupedEvents).map(([chapter, chapterEvents]) => {
            const chapterNum = parseInt(chapter)
            const isExpanded = expandedGroups.has(chapterNum)

            return (
              <div key={chapter} className="timeline-list__chapter-group">
                <button
                  className="timeline-list__chapter-header"
                  onClick={() => toggleGroup(chapterNum)}
                  type="button"
                >
                  <span className="timeline-list__chapter-title">
                    {chapterNum === 0 ? 'Unchaptered' : `Chapter ${chapterNum}`}
                  </span>
                  <span className="timeline-list__chapter-count">
                    {chapterEvents.length} events
                  </span>
                  <span className={`timeline-list__chapter-chevron ${isExpanded ? 'timeline-list__chapter-chevron--expanded' : ''}`}>
                    ›
                  </span>
                </button>
                {isExpanded && (
                  <div className="timeline-list__chapter-events">
                    {chapterEvents.map(renderEvent)}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          filteredEvents.map(renderEvent)
        )}
      </div>

      {filteredEvents.length === 0 && (
        <div className="timeline-list__empty">
          <p>No events match your filters</p>
        </div>
      )}
    </div>
  )
}

export default TimelineList
