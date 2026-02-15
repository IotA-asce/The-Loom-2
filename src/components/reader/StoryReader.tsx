/**
 * Story Reader
 * Reading experience with multiple modes and customization
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  ChevronLeft, ChevronRight, Settings, Bookmark, 
  Type, Moon, Sun, BookOpen, Focus, Menu,
  Clock, BarChart3, Share2, Download, List
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export type ReaderTheme = 'light' | 'dark' | 'sepia'
export type ReadingDirection = 'ltr' | 'rtl'

export interface ReaderSettings {
  fontFamily: 'serif' | 'sans' | 'mono'
  fontSize: number // 14-24
  lineHeight: number // 1.4-2.0
  margins: 'narrow' | 'medium' | 'wide'
  theme: ReaderTheme
  direction: ReadingDirection
}

export interface Chapter {
  id: string
  number: number
  title: string
  content: string
}

export interface Bookmark {
  id: string
  chapterId: string
  position: number
  createdAt: Date
  note?: string
}

// ============================================================================
// Story Reader
// ============================================================================

interface StoryReaderProps {
  chapters: Chapter[]
  currentChapterIndex: number
  onChapterChange: (index: number) => void
  bookmarks: Bookmark[]
  onBookmarkAdd: (position: number) => void
  onBookmarkRemove: (bookmarkId: string) => void
  readingTime: number // in minutes
  className?: string
}

export function StoryReader({
  chapters,
  currentChapterIndex,
  onChapterChange,
  bookmarks,
  onBookmarkAdd,
  onBookmarkRemove,
  readingTime,
  className,
}: StoryReaderProps) {
  const [settings, setSettings] = useState<ReaderSettings>({
    fontFamily: 'serif',
    fontSize: 18,
    lineHeight: 1.8,
    margins: 'medium',
    theme: 'light',
    direction: 'ltr',
  })
  const [showSettings, setShowSettings] = useState(false)
  const [showTOC, setShowTOC] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  const currentChapter = chapters[currentChapterIndex]

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current
      const progress = scrollTop / (scrollHeight - clientHeight)
      setScrollProgress(progress)
    }

    const element = contentRef.current
    if (element) {
      element.addEventListener('scroll', handleScroll)
      return () => element.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          if (currentChapterIndex > 0) onChapterChange(currentChapterIndex - 1)
          break
        case 'ArrowRight':
        case ' ':
          if (currentChapterIndex < chapters.length - 1) onChapterChange(currentChapterIndex + 1)
          break
        case 'b':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            onBookmarkAdd(scrollProgress)
          }
          break
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setFocusMode(f => !f)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentChapterIndex, chapters.length, onChapterChange, onBookmarkAdd, scrollProgress])

  const themeClasses = {
    light: 'bg-white text-gray-900',
    dark: 'bg-gray-900 text-gray-100',
    sepia: 'bg-[#f4ecd8] text-[#5b4636]',
  }

  const fontClasses = {
    serif: 'font-serif',
    sans: 'font-sans',
    mono: 'font-mono',
  }

  const marginClasses = {
    narrow: 'max-w-3xl',
    medium: 'max-w-2xl',
    wide: 'max-w-xl',
  }

  return (
    <div className={cn(
      'flex h-full transition-colors duration-300',
      themeClasses[settings.theme],
      focusMode && 'fixed inset-0 z-50',
      className
    )}>
      {/* Table of Contents Drawer */}
      {showTOC && (
        <div className="w-64 border-r flex-shrink-0 overflow-auto p-4">
          <h3 className="font-semibold mb-4">Chapters</h3>
          <div className="space-y-1">
            {chapters.map((chapter, index) => (
              <button
                key={chapter.id}
                onClick={() => {
                  onChapterChange(index)
                  setShowTOC(false)
                }}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                  index === currentChapterIndex 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-black/5'
                )}
              >
                <span className="opacity-70 mr-2">{index + 1}.</span>
                {chapter.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        {!focusMode && (
          <header className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setShowTOC(!showTOC)}>
                <List className="h-5 w-5" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Chapter {currentChapter.number} of {chapters.length}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
                <Type className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setFocusMode(true)}>
                <Focus className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onBookmarkAdd(scrollProgress)}>
                <Bookmark className="h-5 w-5" />
              </Button>
            </div>
          </header>
        )}

        {/* Settings Panel */}
        {showSettings && !focusMode && (
          <ReaderSettingsPanel
            settings={settings}
            onChange={setSettings}
          />
        )}

        {/* Progress Bar */}
        <div className="h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-150"
            style={{ width: `${(currentChapterIndex / chapters.length) * 100 + (scrollProgress * 100 / chapters.length)}%` }}
          />
        </div>

        {/* Content */}
        <div 
          ref={contentRef}
          className={cn(
            'flex-1 overflow-auto py-8 px-4',
            settings.direction === 'rtl' && 'direction-rtl'
          )}
        >
          <article 
            className={cn(
              'mx-auto',
              fontClasses[settings.fontFamily],
              marginClasses[settings.margins]
            )}
            style={{
              fontSize: `${settings.fontSize}px`,
              lineHeight: settings.lineHeight,
            }}
          >
            {/* Exit Focus Mode */}
            {focusMode && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mb-8"
                onClick={() => setFocusMode(false)}
              >
                <Focus className="h-4 w-4 mr-1" />
                Exit Focus Mode
              </Button>
            )}

            <h1 className="text-3xl font-bold mb-4">{currentChapter.title}</h1>
            
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: currentChapter.content }}
            />

            {/* Chapter Navigation */}
            <div className="flex items-center justify-between mt-12 pt-8 border-t">
              <Button
                variant="outline"
                onClick={() => onChapterChange(currentChapterIndex - 1)}
                disabled={currentChapterIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <span className="text-sm text-muted-foreground">
                {currentChapterIndex + 1} / {chapters.length}
              </span>

              <Button
                variant="outline"
                onClick={() => onChapterChange(currentChapterIndex + 1)}
                disabled={currentChapterIndex === chapters.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </article>
        </div>

        {/* Footer Stats */}
        {!focusMode && (
          <footer className="flex items-center justify-between px-4 py-2 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {readingTime} min read
              </span>
              <span>{Math.round(scrollProgress * 100)}% of chapter</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{bookmarks.length} bookmarks</span>
            </div>
          </footer>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Reader Settings Panel
// ============================================================================

interface ReaderSettingsPanelProps {
  settings: ReaderSettings
  onChange: (settings: ReaderSettings) => void
}

function ReaderSettingsPanel({ settings, onChange }: ReaderSettingsPanelProps) {
  return (
    <div className="border-b p-4 bg-muted/30">
      <div className="flex flex-wrap items-center gap-6">
        {/* Font Family */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Font:</span>
          <div className="flex gap-1">
            {(['serif', 'sans', 'mono'] as const).map(font => (
              <button
                key={font}
                onClick={() => onChange({ ...settings, fontFamily: font })}
                className={cn(
                  'px-3 py-1 text-sm rounded transition-colors',
                  settings.fontFamily === font 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                )}
              >
                {font.charAt(0).toUpperCase() + font.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Size:</span>
          <input
            type="range"
            min="14"
            max="24"
            value={settings.fontSize}
            onChange={(e) => onChange({ ...settings, fontSize: parseInt(e.target.value) })}
            className="w-24"
          />
          <span className="text-sm w-8">{settings.fontSize}px</span>
        </div>

        {/* Line Height */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Spacing:</span>
          <input
            type="range"
            min="14"
            max="20"
            value={settings.lineHeight * 10}
            onChange={(e) => onChange({ ...settings, lineHeight: parseInt(e.target.value) / 10 })}
            className="w-24"
          />
        </div>

        {/* Theme */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Theme:</span>
          <div className="flex gap-1">
            {(['light', 'dark', 'sepia'] as const).map(theme => (
              <button
                key={theme}
                onClick={() => onChange({ ...settings, theme })}
                className={cn(
                  'p-2 rounded transition-colors',
                  settings.theme === theme 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                )}
                title={theme}
              >
                {theme === 'light' && <Sun className="h-4 w-4" />}
                {theme === 'dark' && <Moon className="h-4 w-4" />}
                {theme === 'sepia' && <BookOpen className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>

        {/* Margins */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Margins:</span>
          <select
            value={settings.margins}
            onChange={(e) => onChange({ ...settings, margins: e.target.value as ReaderSettings['margins'] })}
            className="px-2 py-1 text-sm border rounded"
          >
            <option value="narrow">Narrow</option>
            <option value="medium">Medium</option>
            <option value="wide">Wide</option>
          </select>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Bookmark List
// ============================================================================

interface BookmarkListProps {
  bookmarks: Bookmark[]
  chapters: Chapter[]
  onSelect: (bookmark: Bookmark) => void
  onDelete: (bookmarkId: string) => void
  className?: string
}

export function BookmarkList({ bookmarks, chapters, onSelect, onDelete, className }: BookmarkListProps) {
  const getChapterTitle = (chapterId: string) => {
    return chapters.find(c => c.id === chapterId)?.title || 'Unknown Chapter'
  }

  return (
    <div className={cn('space-y-2', className)}>
      {bookmarks.map(bookmark => (
        <div 
          key={bookmark.id}
          className="flex items-center gap-3 p-3 bg-card border rounded-lg group"
        >
          <Bookmark className="h-4 w-4 text-primary flex-shrink-0" />
          
          <button 
            onClick={() => onSelect(bookmark)}
            className="flex-1 text-left"
          >
            <p className="font-medium text-sm">{getChapterTitle(bookmark.chapterId)}</p>
            <p className="text-xs text-muted-foreground">
              Position: {Math.round(bookmark.position * 100)}% • 
              {bookmark.createdAt.toLocaleDateString()}
            </p>
            {bookmark.note && (
              <p className="text-xs text-muted-foreground mt-1">{bookmark.note}</p>
            )}
          </button>

          <Button 
            variant="ghost" 
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onDelete(bookmark.id)}
          >
            <span className="sr-only">Delete</span>
            <span className="text-destructive">×</span>
          </Button>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Reading Statistics
// ============================================================================

interface ReadingStatsProps {
  totalChapters: number
  chaptersRead: number
  totalTime: number // minutes
  averageSpeed: number // words per minute
  bookmarksCount: number
  className?: string
}

export function ReadingStats({
  totalChapters,
  chaptersRead,
  totalTime,
  averageSpeed,
  bookmarksCount,
  className,
}: ReadingStatsProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      <StatCard 
        label="Chapters Read" 
        value={`${chaptersRead}/${totalChapters}`}
        icon={<BookOpen className="h-4 w-4" />}
      />
      <StatCard 
        label="Reading Time" 
        value={`${totalTime} min`}
        icon={<Clock className="h-4 w-4" />}
      />
      <StatCard 
        label="Avg Speed" 
        value={`${averageSpeed} wpm`}
        icon={<BarChart3 className="h-4 w-4" />}
      />
      <StatCard 
        label="Bookmarks" 
        value={bookmarksCount.toString()}
        icon={<Bookmark className="h-4 w-4" />}
      />
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-xl p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
