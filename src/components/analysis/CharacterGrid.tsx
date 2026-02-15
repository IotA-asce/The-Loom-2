/**
 * CharacterGrid Component
 * Displays characters in a responsive grid layout
 */

import React, { useState, useMemo } from 'react'
import { Character } from '@/lib/db/schema'

export interface CharacterGridProps {
  /** Characters to display */
  characters: Character[]
  /** Optional className */
  className?: string
  /** Callback when a character is clicked */
  onCharacterClick?: (character: Character) => void
  /** Filter by importance */
  filterImportance?: Character['importance'][]
  /** Search query */
  searchQuery?: string
  /** Sort order */
  sortBy?: 'name' | 'appearance' | 'importance'
}

/**
 * CharacterGrid - Grid display for characters
 */
export const CharacterGrid: React.FC<CharacterGridProps> = ({
  characters,
  className = '',
  onCharacterClick,
  filterImportance,
  searchQuery,
  sortBy = 'importance',
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filteredCharacters = useMemo(() => {
    let result = [...characters]

    // Filter by importance
    if (filterImportance && filterImportance.length > 0) {
      result = result.filter(c => filterImportance.includes(c.importance))
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.aliases.some(a => a.toLowerCase().includes(query)) ||
        c.description.toLowerCase().includes(query)
      )
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'appearance':
          return a.firstAppearance - b.firstAppearance
        case 'importance':
          const importanceOrder = { major: 0, supporting: 1, minor: 2 }
          return importanceOrder[a.importance] - importanceOrder[b.importance]
        default:
          return 0
      }
    })

    return result
  }, [characters, filterImportance, searchQuery, sortBy])

  const handleClick = (character: Character) => {
    setSelectedId(character.id)
    onCharacterClick?.(character)
  }

  const getImportanceClass = (importance: Character['importance']) => {
    return `character-grid__card--${importance}`
  }

  const getImportanceBadge = (importance: Character['importance']) => {
    const labels: Record<Character['importance'], string> = {
      major: 'Major',
      supporting: 'Supporting',
      minor: 'Minor',
    }
    return labels[importance]
  }

  return (
    <div className={`character-grid ${className}`}>
      <div className="character-grid__header">
        <span className="character-grid__count">
          {filteredCharacters.length} character{filteredCharacters.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="character-grid__container">
        {filteredCharacters.map(character => (
          <button
            key={character.id}
            className={`character-grid__card ${getImportanceClass(character.importance)} ${
              selectedId === character.id ? 'character-grid__card--selected' : ''
            }`}
            onClick={() => handleClick(character)}
            type="button"
          >
            <div className="character-grid__card-header">
              <span className={`character-grid__importance-badge character-grid__importance-badge--${character.importance}`}>
                {getImportanceBadge(character.importance)}
              </span>
            </div>

            <h3 className="character-grid__name">{character.name}</h3>

            {character.aliases.length > 0 && (
              <p className="character-grid__aliases">
                aka {character.aliases.slice(0, 2).join(', ')}
                {character.aliases.length > 2 && ` +${character.aliases.length - 2}`}
              </p>
            )}

            <p className="character-grid__description">
              {truncateDescription(character.description, 80)}
            </p>

            <div className="character-grid__meta">
              <span className="character-grid__first-appearance">
                First seen: Page {character.firstAppearance + 1}
              </span>
            </div>

            {character.appearance && (
              <div className="character-grid__appearance">
                <span className="character-grid__appearance-label">Appearance:</span>
                <span className="character-grid__appearance-text">
                  {truncateDescription(character.appearance, 50)}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {filteredCharacters.length === 0 && (
        <div className="character-grid__empty">
          <p>No characters match your filters</p>
        </div>
      )}
    </div>
  )
}

/**
 * Truncate description to max length
 */
function truncateDescription(desc: string, maxLength: number): string {
  if (desc.length <= maxLength) return desc
  return desc.substring(0, maxLength).trim() + '...'
}

export default CharacterGrid
