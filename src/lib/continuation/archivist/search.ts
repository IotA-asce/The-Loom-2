// @ts-nocheck
/**
 * Comprehensive search (title, content, character, tags)
 */

import type { Chapter } from '@/lib/db/schema'
import type { LibraryItem } from './library'

export interface SearchQuery {
  text?: string
  title?: string
  content?: string
  character?: string
  tags?: string[]
  dateRange?: { from?: Date; to?: Date }
}

export interface SearchResult {
  item: LibraryItem | Chapter
  score: number
  matches: SearchMatch[]
}

export interface SearchMatch {
  field: string
  snippet: string
  positions: Array<{ start: number; end: number }>
}

/**
 * Search across all content
 */
export function comprehensiveSearch(
  query: SearchQuery,
  items: LibraryItem[],
  chapters: Chapter[]
): SearchResult[] {
  const results: SearchResult[] = []
  
  // Search library items
  for (const item of items) {
    const result = searchLibraryItem(query, item)
    if (result.score > 0) {
      results.push(result)
    }
  }
  
  // Search chapters
  for (const chapter of chapters) {
    const result = searchChapter(query, chapter)
    if (result.score > 0) {
      results.push(result)
    }
  }
  
  // Sort by score
  return results.sort((a, b) => b.score - a.score)
}

function searchLibraryItem(query: SearchQuery, item: LibraryItem): SearchResult {
  const matches: SearchMatch[] = []
  let score = 0
  
  // Title search
  if (query.title || query.text) {
    const titleMatch = matchText(item.name, query.title || query.text || '')
    if (titleMatch) {
      matches.push({
        field: 'name',
        snippet: createSnippet(item.name, titleMatch),
        positions: [titleMatch],
      })
      score += 10 // High weight for title matches
    }
  }
  
  // Description search
  if (query.text) {
    const descMatch = matchText(item.description, query.text)
    if (descMatch) {
      matches.push({
        field: 'description',
        snippet: createSnippet(item.description, descMatch),
        positions: [descMatch],
      })
      score += 5
    }
  }
  
  // Tag search
  if (query.tags && query.tags.length > 0) {
    const matchingTags = query.tags.filter(t => item.tags.includes(t))
    if (matchingTags.length > 0) {
      matches.push({
        field: 'tags',
        snippet: `Tags: ${matchingTags.join(', ')}`,
        positions: [],
      })
      score += matchingTags.length * 3
    }
  }
  
  // Date range filter
  if (query.dateRange) {
    const { from, to } = query.dateRange
    const createdAt = item.metadata.createdAt
    
    if (from && createdAt < from) score = 0
    if (to && createdAt > to) score = 0
  }
  
  return { item, score, matches }
}

function searchChapter(query: SearchQuery, chapter: Chapter): SearchResult {
  const matches: SearchMatch[] = []
  let score = 0
  
  // Title search
  if (query.title || query.text) {
    const titleMatch = matchText(chapter.title ?? '', query.title || query.text || '')
    if (titleMatch) {
      matches.push({
        field: 'title',
        snippet: createSnippet(chapter.title, titleMatch),
        positions: [titleMatch],
      })
      score += 10
    }
  }
  
  // Content search (summary)
  if (query.content || query.text) {
    const contentMatch = matchText(chapter.summary ?? '', query.content || query.text || '')
    if (contentMatch) {
      matches.push({
        field: 'summary',
        snippet: createSnippet(chapter.summary, contentMatch),
        positions: [contentMatch],
      })
      score += 5
    }
  }
  
  // Character search
  if (query.character) {
    // In real implementation, search through chapter characters
    const characterMatch = chapter.summary.toLowerCase().includes(query.character.toLowerCase())
    if (characterMatch) {
      matches.push({
        field: 'characters',
        snippet: `Character mentioned in chapter`,
        positions: [],
      })
      score += 8
    }
  }
  
  return { item: chapter, score, matches }
}

function matchText(text: string, query: string): { start: number; end: number } | null {
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  
  const index = lowerText.indexOf(lowerQuery)
  if (index === -1) return null
  
  return { start: index, end: index + query.length }
}

function createSnippet(text: string, match: { start: number; end: number }): string {
  const context = 30
  const start = Math.max(0, match.start - context)
  const end = Math.min(text.length, match.end + context)
  
  let snippet = text.slice(start, end)
  
  if (start > 0) snippet = '...' + snippet
  if (end < text.length) snippet = snippet + '...'
  
  // Highlight match
  const relativeStart = match.start - start + (start > 0 ? 3 : 0)
  const relativeEnd = match.end - start + (start > 0 ? 3 : 0)
  
  snippet = 
    snippet.slice(0, relativeStart) +
    `**${snippet.slice(relativeStart, relativeEnd)}**` +
    snippet.slice(relativeEnd)
  
  return snippet
}

/**
 * Quick search
 */
export function quickSearch(
  query: string,
  items: LibraryItem[],
  chapters: Chapter[]
): SearchResult[] {
  return comprehensiveSearch(
    { text: query },
    items,
    chapters
  )
}

/**
 * Advanced search with filters
 */
export function advancedSearch(
  options: {
    query: string
    inTitle?: boolean
    inContent?: boolean
    inCharacters?: boolean
    tags?: string[]
    dateFrom?: Date
    dateTo?: Date
  },
  items: LibraryItem[],
  chapters: Chapter[]
): SearchResult[] {
  const searchQuery: SearchQuery = {
    text: options.query,
  }
  
  if (options.inTitle) searchQuery.title = options.query
  if (options.inContent) searchQuery.content = options.query
  if (options.inCharacters) searchQuery.character = options.query
  if (options.tags) searchQuery.tags = options.tags
  if (options.dateFrom || options.dateTo) {
    searchQuery.dateRange = {
      from: options.dateFrom,
      to: options.dateTo,
    }
  }
  
  return comprehensiveSearch(searchQuery, items, chapters)
}

/**
 * Search suggestions
 */
export function getSearchSuggestions(
  partialQuery: string,
  items: LibraryItem[],
  chapters: Chapter[]
): string[] {
  const suggestions: string[] = []
  const lowerPartial = partialQuery.toLowerCase()
  
  // Collect potential completions
  for (const item of items) {
    if (item.name.toLowerCase().startsWith(lowerPartial)) {
      suggestions.push(item.name)
    }
  }
  
  for (const chapter of chapters) {
    if (chapter.title.toLowerCase().startsWith(lowerPartial)) {
      suggestions.push(chapter.title)
    }
  }
  
  // Deduplicate and limit
  return [...new Set(suggestions)].slice(0, 10)
}

/**
 * Filter results
 */
export function filterResults(
  results: SearchResult[],
  filters: {
    minScore?: number
    types?: string[]
    excludeIds?: string[]
  }
): SearchResult[] {
  return results.filter(r => {
    if (filters.minScore && r.score < filters.minScore) return false
    if (filters.types && !filters.types.includes(r.item.type)) return false
    if (filters.excludeIds?.includes(r.item.id)) return false
    return true
  })
}

/**
 * Export search results
 */
export function exportSearchResults(results: SearchResult[]): object {
  return {
    total: results.length,
    results: results.map(r => ({
      id: r.item.id,
      type: r.item && typeof r.item === 'object' && 'type' in r.item ? (r.item as LibraryItem).type : 'chapter',
      name: r.item && typeof r.item === 'object' && 'name' in r.item ? (r.item as LibraryItem).name : (r.item as Chapter).title ?? 'Untitled',
      score: r.score,
      matches: r.matches,
    })),
  }
}
