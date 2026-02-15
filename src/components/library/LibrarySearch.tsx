/**
 * Library Search
 * Fast, fuzzy, titles-only search
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui'
import { cn } from '@/lib/utils'

// ============================================================================
// Fuzzy Search Implementation
// ============================================================================

interface SearchItem {
  id: string
  title: string
}

export interface FuzzyMatch {
  item: SearchItem
  score: number
  matches: Array<{ start: number; end: number }>
}

// Simple fuzzy matching algorithm
function fuzzySearch(query: string, items: SearchItem[]): FuzzyMatch[] {
  if (!query.trim()) return []
  
  const normalizedQuery = query.toLowerCase().trim()
  const queryChars = normalizedQuery.split('')
  
  const results: FuzzyMatch[] = []
  
  for (const item of items) {
    const normalizedTitle = item.title.toLowerCase()
    const matches: Array<{ start: number; end: number }> = []
    let queryIndex = 0
    let score = 0
    let lastMatchIndex = -1
    let consecutiveMatches = 0
    
    for (let i = 0; i < normalizedTitle.length && queryIndex < queryChars.length; i++) {
      if (normalizedTitle[i] === queryChars[queryIndex]) {
        // Check if this is a consecutive match
        if (lastMatchIndex === i - 1) {
          consecutiveMatches++
          score += 2 // Bonus for consecutive matches
        } else {
          consecutiveMatches = 1
          score += 1
        }
        
        // Bonus for matching at word boundaries
        if (i === 0 || normalizedTitle[i - 1] === ' ') {
          score += 3
        }
        
        lastMatchIndex = i
        
        // Track match ranges for highlighting
        const lastMatch = matches[matches.length - 1]
        if (lastMatch && lastMatch.end === i) {
          lastMatch.end = i + 1
        } else {
          matches.push({ start: i, end: i + 1 })
        }
        
        queryIndex++
      }
    }
    
    // Only include if all query chars were matched
    if (queryIndex === queryChars.length) {
      // Penalty for length difference
      score -= (normalizedTitle.length - normalizedQuery.length) * 0.1
      
      results.push({
        item,
        score,
        matches,
      })
    }
  }
  
  // Sort by score (descending)
  return results.sort((a, b) => b.score - a.score)
}

// ============================================================================
// Search Input
// ============================================================================

interface LibrarySearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export function LibrarySearchInput({ 
  value, 
  onChange, 
  placeholder = 'Search titles...',
  className,
  autoFocus = false,
}: LibrarySearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut: Cmd/Ctrl + K to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="pl-10 pr-20"
      />
      
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {value && (
          <button
            onClick={() => onChange('')}
            className="p-1 rounded hover:bg-muted transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
        <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs font-mono bg-muted rounded">
          ⌘K
        </kbd>
      </div>
    </div>
  )
}

// ============================================================================
// Search Results
// ============================================================================

interface HighlightedTitleProps {
  title: string
  matches: Array<{ start: number; end: number }>
  className?: string
}

function HighlightedTitle({ title, matches, className }: HighlightedTitleProps) {
  if (matches.length === 0) {
    return <span className={className}>{title}</span>
  }

  const parts: React.ReactNode[] = []
  let lastEnd = 0

  for (const match of matches) {
    // Add text before match
    if (match.start > lastEnd) {
      parts.push(
        <span key={`text-${lastEnd}`}>{title.slice(lastEnd, match.start)}</span>
      )
    }
    
    // Add highlighted match
    parts.push(
      <mark 
        key={`match-${match.start}`}
        className="bg-primary/20 text-primary font-medium rounded px-0.5"
      >
        {title.slice(match.start, match.end)}
      </mark>
    )
    
    lastEnd = match.end
  }

  // Add remaining text
  if (lastEnd < title.length) {
    parts.push(
      <span key={`text-${lastEnd}`}>{title.slice(lastEnd)}</span>
    )
  }

  return <span className={className}>{parts}</span>
}

interface SearchResultsProps {
  results: FuzzyMatch[]
  onSelect: (item: SearchItem) => void
  selectedIndex?: number
  className?: string
}

export function SearchResults({ 
  results, 
  onSelect, 
  selectedIndex = 0,
  className 
}: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className={cn('p-4 text-center text-muted-foreground text-sm', className)}>
        No results found
      </div>
    )
  }

  return (
    <div className={cn('py-2', className)}>
      <div className="px-3 py-1.5 text-xs text-muted-foreground">
        {results.length} result{results.length !== 1 ? 's' : ''}
      </div>
      
      {results.map((result, index) => (
        <button
          key={result.item.id}
          onClick={() => onSelect(result.item)}
          className={cn(
            'w-full px-3 py-2 text-left transition-colors',
            index === selectedIndex 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-muted'
          )}
        >
          <HighlightedTitle 
            title={result.item.title}
            matches={index === selectedIndex ? [] : result.matches}
            className="text-sm"
          />
        </button>
      ))}
    </div>
  )
}

// ============================================================================
// Main Search Component
// ============================================================================

interface LibrarySearchProps {
  items: SearchItem[]
  onSelect: (item: SearchItem) => void
  placeholder?: string
  className?: string
}

export function LibrarySearch({ 
  items, 
  onSelect, 
  placeholder,
  className 
}: LibrarySearchProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  
  const results = useMemo(() => {
    return fuzzySearch(query, items)
  }, [query, items])

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
    setIsOpen(query.length > 0)
  }, [query])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0)
        break
      case 'Enter':
        e.preventDefault()
        if (results[selectedIndex]) {
          onSelect(results[selectedIndex].item)
          setQuery('')
          setIsOpen(false)
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }, [isOpen, results, selectedIndex, onSelect])

  return (
    <div className={cn('relative', className)} onKeyDown={handleKeyDown}>
      <LibrarySearchInput
        value={query}
        onChange={setQuery}
        placeholder={placeholder}
      />
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Results dropdown */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-50 max-h-80 overflow-auto">
            <SearchResults
              results={results}
              onSelect={(item) => {
                onSelect(item)
                setQuery('')
                setIsOpen(false)
              }}
              selectedIndex={selectedIndex}
            />
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useLibrarySearch(items: SearchItem[]) {
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    
    const results = fuzzySearch(searchQuery, items)
    return results.map(r => r.item)
  }, [searchQuery, items])

  return {
    searchQuery,
    setSearchQuery,
    filteredItems,
    hasActiveSearch: searchQuery.trim().length > 0,
    clearSearch: () => setSearchQuery(''),
  }
}
