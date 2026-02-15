/**
 * ChapterReader component
 * Displays generated chapter content with navigation
 */

import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Settings, Share2, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui'

interface ChapterReaderProps {
  chapterId: string
  title: string
  content: string
  chapterNumber: number
  totalChapters: number
  onPrevious?: () => void
  onNext?: () => void
  onEdit?: () => void
  onShare?: () => void
  fontSize?: 'small' | 'medium' | 'large'
  lineHeight?: 'compact' | 'normal' | 'relaxed'
}

export function ChapterReader({
  title,
  content,
  chapterNumber,
  totalChapters,
  onPrevious,
  onNext,
  onEdit,
  onShare,
  fontSize = 'medium',
  lineHeight = 'normal',
}: ChapterReaderProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [currentFontSize, setCurrentFontSize] = useState(fontSize)
  const [currentLineHeight, setCurrentLineHeight] = useState(lineHeight)

  const fontSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  }

  const lineHeightClasses = {
    compact: 'leading-snug',
    normal: 'leading-relaxed',
    relaxed: 'leading-loose',
  }

  const handlePrevious = useCallback(() => {
    if (chapterNumber > 1) onPrevious?.()
  }, [chapterNumber, onPrevious])

  const handleNext = useCallback(() => {
    if (chapterNumber < totalChapters) onNext?.()
  }, [chapterNumber, totalChapters, onNext])

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Chapter {chapterNumber} of {totalChapters}
          </span>
          <h1 className="text-lg font-semibold truncate max-w-md">{title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            aria-label="Reader settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              aria-label="Edit chapter"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          )}
          
          {onShare && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onShare}
              aria-label="Share chapter"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-4 py-3 border-b bg-muted/50">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Font:</span>
              <div className="flex gap-1">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <Button
                    key={size}
                    variant={currentFontSize === size ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentFontSize(size)}
                    className="text-xs capitalize"
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Spacing:</span>
              <div className="flex gap-1">
                {(['compact', 'normal', 'relaxed'] as const).map((lh) => (
                  <Button
                    key={lh}
                    variant={currentLineHeight === lh ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentLineHeight(lh)}
                    className="text-xs capitalize"
                  >
                    {lh}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <article
          className={`
            max-w-3xl mx-auto
            ${fontSizeClasses[currentFontSize]}
            ${lineHeightClasses[currentLineHeight]}
            prose prose-slate dark:prose-invert
          `}
        >
          <h2 className="text-2xl font-bold mb-6">{title}</h2>
          <div className="whitespace-pre-wrap">{content}</div>
        </article>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={chapterNumber <= 1}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        
        <span className="text-sm text-muted-foreground">
          {chapterNumber} / {totalChapters}
        </span>
        
        <Button
          variant="outline"
          onClick={handleNext}
          disabled={chapterNumber >= totalChapters}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
