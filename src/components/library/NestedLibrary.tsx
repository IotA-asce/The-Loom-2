/**
 * Nested Library
 * Generated stories nested under source manga
 */

import { useState, useCallback } from 'react'
import { 
  ChevronRight, ChevronDown, BookOpen, GitBranch,
  MoreHorizontal, Plus 
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { ViewMode } from './LibraryView'

// ============================================================================
// Types
// ============================================================================

export interface MangaItem {
  id: string
  title: string
  coverImage?: string
  author?: string
  chapterCount: number
  status: 'completed' | 'ongoing' | 'dropped'
}

export interface GeneratedStory {
  id: string
  mangaId: string
  title: string
  branchName: string
  chapterCount: number
  lastModified: Date
  wordCount: number
}

export interface NestedManga extends MangaItem {
  stories: GeneratedStory[]
  isExpanded?: boolean
}

// ============================================================================
// Nested Library Item
// ============================================================================

interface NestedLibraryItemProps {
  manga: NestedManga
  viewMode: ViewMode
  onToggle: (mangaId: string) => void
  onStoryClick: (story: GeneratedStory) => void
  onMangaClick: (manga: MangaItem) => void
  onCreateStory?: (mangaId: string) => void
  className?: string
}

export function NestedLibraryItem({
  manga,
  viewMode,
  onToggle,
  onStoryClick,
  onMangaClick,
  onCreateStory,
  className,
}: NestedLibraryItemProps) {
  const hasStories = manga.stories.length > 0

  if (viewMode === 'compact') {
    return (
      <div className={cn('border rounded-md overflow-hidden', className)}>
        {/* Compact Header */}
        <button
          onClick={() => onMangaClick(manga)}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors"
        >
          {hasStories && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggle(manga.id)
              }}
              className="p-0.5 rounded hover:bg-muted"
            >
              {manga.isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          {!hasStories && <span className="w-4" />}
          
          {manga.coverImage ? (
            <img src={manga.coverImage} alt="" className="w-6 h-8 object-cover rounded" />
          ) : (
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          )}
          
          <span className="flex-1 text-left text-sm font-medium truncate">
            {manga.title}
          </span>
          
          <span className="text-xs text-muted-foreground">
            {manga.chapterCount} ch
          </span>
          
          {hasStories && (
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              {manga.stories.length}
            </span>
          )}
        </button>

        {/* Compact Stories */}
        {manga.isExpanded && hasStories && (
          <div className="bg-muted/30">
            {manga.stories.map(story => (
              <button
                key={story.id}
                onClick={() => onStoryClick(story)}
                className="w-full flex items-center gap-2 px-3 py-1.5 pl-10 hover:bg-muted transition-colors text-left"
              >
                <GitBranch className="h-3 w-3 text-muted-foreground" />
                <span className="flex-1 text-sm truncate">{story.title}</span>
                <span className="text-xs text-muted-foreground">
                  {story.chapterCount} ch
                </span>
              </button>
            ))}
            
            {onCreateStory && (
              <button
                onClick={() => onCreateStory(manga.id)}
                className="w-full flex items-center gap-2 px-3 py-1.5 pl-10 hover:bg-muted transition-colors text-left text-muted-foreground"
              >
                <Plus className="h-3 w-3" />
                <span className="text-sm">Create new story</span>
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className={cn('border rounded-lg overflow-hidden bg-card', className)}>
        {/* List Header */}
        <div className="flex items-center gap-4 p-4">
          {hasStories && (
            <button
              onClick={() => onToggle(manga.id)}
              className="p-1 rounded hover:bg-muted"
            >
              {manga.isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {!hasStories && <span className="w-6" />}

          {manga.coverImage ? (
            <img 
              src={manga.coverImage} 
              alt={manga.title}
              className="w-12 h-16 object-cover rounded-md flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-16 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{manga.title}</h3>
            {manga.author && (
              <p className="text-sm text-muted-foreground">{manga.author}</p>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{manga.chapterCount} chapters</span>
            {hasStories && (
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                {manga.stories.length} stories
              </span>
            )}
          </div>

          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* List Stories */}
        {manga.isExpanded && hasStories && (
          <div className="border-t bg-muted/30">
            {manga.stories.map(story => (
              <button
                key={story.id}
                onClick={() => onStoryClick(story)}
                className="w-full flex items-center gap-4 px-4 py-3 pl-16 hover:bg-muted transition-colors text-left"
              >
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{story.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {story.branchName} • {story.chapterCount} chapters
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {(story.wordCount / 1000).toFixed(1)}k words
                </span>
              </button>
            ))}
            
            {onCreateStory && (
              <button
                onClick={() => onCreateStory(manga.id)}
                className="w-full flex items-center gap-4 px-4 py-3 pl-16 hover:bg-muted transition-colors text-left text-muted-foreground"
              >
                <Plus className="h-4 w-4" />
                <span>Create new story from this manga</span>
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  // Grid view
  return (
    <div className={cn('border rounded-xl overflow-hidden bg-card', className)}>
      {/* Grid Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {hasStories && (
            <button
              onClick={() => onToggle(manga.id)}
              className="p-1 rounded hover:bg-muted mt-1"
            >
              {manga.isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {!hasStories && <span className="w-6" />}

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold line-clamp-2">{manga.title}</h3>
            {manga.author && (
              <p className="text-sm text-muted-foreground mt-1">{manga.author}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {manga.chapterCount} chapters
            </p>
          </div>
        </div>

        {manga.coverImage ? (
          <img 
            src={manga.coverImage} 
            alt={manga.title}
            className="w-full aspect-[3/4] object-cover rounded-lg mt-4"
          />
        ) : (
          <div className="w-full aspect-[3/4] bg-muted rounded-lg mt-4 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Grid Stories */}
      {manga.isExpanded && hasStories && (
        <div className="border-t bg-muted/30 p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Generated Stories
          </p>
          
          {manga.stories.map(story => (
            <button
              key={story.id}
              onClick={() => onStoryClick(story)}
              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-card transition-colors text-left"
            >
              <GitBranch className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{story.title}</p>
                <p className="text-xs text-muted-foreground">
                  {story.chapterCount} ch
                </p>
              </div>
            </button>
          ))}
          
          {onCreateStory && (
            <button
              onClick={() => onCreateStory(manga.id)}
              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-card transition-colors text-left text-muted-foreground"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Create new story</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Nested Library Container
// ============================================================================

interface NestedLibraryContainerProps {
  children: React.ReactNode
  viewMode: ViewMode
  className?: string
}

export function NestedLibraryContainer({ 
  children, 
  viewMode, 
  className 
}: NestedLibraryContainerProps) {
  const containerClasses = {
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
    list: 'flex flex-col gap-4',
    compact: 'flex flex-col gap-2',
  }

  return (
    <div className={cn(containerClasses[viewMode], className)}>
      {children}
    </div>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useNestedLibrary(mangas: NestedManga[]) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleManga = useCallback((mangaId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(mangaId)) {
        next.delete(mangaId)
      } else {
        next.add(mangaId)
      }
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(mangas.map(m => m.id)))
  }, [mangas])

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set())
  }, [])

  const mangasWithExpansion = mangas.map(manga => ({
    ...manga,
    isExpanded: expandedIds.has(manga.id),
  }))

  return {
    mangas: mangasWithExpansion,
    toggleManga,
    expandAll,
    collapseAll,
    expandedCount: expandedIds.size,
  }
}
