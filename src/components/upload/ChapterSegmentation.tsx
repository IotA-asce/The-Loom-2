/**
 * Chapter Segmentation Review
 * Optional review of detected chapter boundaries
 */

import { useState, useCallback } from 'react'
import { 
  Scissors, ChevronLeft, ChevronRight, Plus, 
  Trash2, Edit2, Check, X, BookOpen 
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface DetectedChapter {
  id: string
  number: number
  title: string
  startPage: number
  endPage: number
  thumbnailUrl?: string
  confidence: 'high' | 'medium' | 'low'
  isManuallyEdited?: boolean
}

// ============================================================================
// Chapter Segmentation Review
// ============================================================================

interface ChapterSegmentationProps {
  chapters: DetectedChapter[]
  totalPages: number
  onChaptersChange: (chapters: DetectedChapter[]) => void
  onConfirm: () => void
  onSkip: () => void
  className?: string
}

export function ChapterSegmentationReview({
  chapters,
  totalPages,
  onChaptersChange,
  onConfirm,
  onSkip,
  className,
}: ChapterSegmentationProps) {
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)

  const handleAddChapter = useCallback(() => {
    const newChapter: DetectedChapter = {
      id: `chapter-${Date.now()}`,
      number: chapters.length + 1,
      title: `Chapter ${chapters.length + 1}`,
      startPage: chapters.length > 0 ? chapters[chapters.length - 1].endPage + 1 : 1,
      endPage: totalPages,
      confidence: 'high',
      isManuallyEdited: true,
    }
    onChaptersChange([...chapters, newChapter])
    setEditingChapterId(newChapter.id)
  }, [chapters, totalPages, onChaptersChange])

  const handleDeleteChapter = useCallback((id: string) => {
    onChaptersChange(chapters.filter(c => c.id !== id))
    if (selectedChapterId === id) setSelectedChapterId(null)
  }, [chapters, selectedChapterId, onChaptersChange])

  const handleUpdateChapter = useCallback((id: string, updates: Partial<DetectedChapter>) => {
    onChaptersChange(chapters.map(c => 
      c.id === id ? { ...c, ...updates, isManuallyEdited: true } : c
    ))
  }, [chapters, onChaptersChange])

  const handleMergeWithNext = useCallback((index: number) => {
    if (index >= chapters.length - 1) return
    
    const current = chapters[index]
    const next = chapters[index + 1]
    
    const merged: DetectedChapter = {
      ...current,
      endPage: next.endPage,
      title: `${current.title} + ${next.title}`,
      isManuallyEdited: true,
    }
    
    onChaptersChange([
      ...chapters.slice(0, index),
      merged,
      ...chapters.slice(index + 2),
    ])
  }, [chapters, onChaptersChange])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Review Chapter Segmentation
          </h3>
          <p className="text-sm text-muted-foreground">
            {chapters.length} chapters detected • {totalPages} total pages
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onSkip}>
            Skip Review
          </Button>
          <Button onClick={onConfirm}>
            Confirm & Continue
          </Button>
        </div>
      </div>

      {/* Chapter List */}
      <div className="border rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 text-sm font-medium">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Title</div>
          <div className="col-span-3">Pages</div>
          <div className="col-span-2">Confidence</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y">
          {chapters.map((chapter, index) => (
            <ChapterRow
              key={chapter.id}
              chapter={chapter}
              index={index}
              isSelected={selectedChapterId === chapter.id}
              isEditing={editingChapterId === chapter.id}
              onSelect={() => setSelectedChapterId(chapter.id)}
              onEdit={() => setEditingChapterId(chapter.id)}
              onSave={(updates) => {
                handleUpdateChapter(chapter.id, updates)
                setEditingChapterId(null)
              }}
              onCancelEdit={() => setEditingChapterId(null)}
              onDelete={() => handleDeleteChapter(chapter.id)}
              onMergeNext={() => handleMergeWithNext(index)}
              hasNext={index < chapters.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Add Chapter */}
      <Button variant="outline" onClick={handleAddChapter} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Chapter
      </Button>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          High confidence
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          Medium confidence
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Low confidence
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// Chapter Row
// ============================================================================

interface ChapterRowProps {
  chapter: DetectedChapter
  index: number
  isSelected: boolean
  isEditing: boolean
  onSelect: () => void
  onEdit: () => void
  onSave: (updates: Partial<DetectedChapter>) => void
  onCancelEdit: () => void
  onDelete: () => void
  onMergeNext: () => void
  hasNext: boolean
}

function ChapterRow({
  chapter,
  index,
  isSelected,
  isEditing,
  onSelect,
  onEdit,
  onSave,
  onCancelEdit,
  onDelete,
  onMergeNext,
  hasNext,
}: ChapterRowProps) {
  const [editTitle, setEditTitle] = useState(chapter.title)
  const [editStartPage, setEditStartPage] = useState(chapter.startPage)
  const [editEndPage, setEditEndPage] = useState(chapter.endPage)

  const confidenceColors = {
    high: 'bg-green-500',
    medium: 'bg-yellow-500',
    low: 'bg-red-500',
  }

  if (isEditing) {
    return (
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/30 items-center">
        <div className="col-span-1 text-sm text-muted-foreground">{index + 1}</div>
        
        <div className="col-span-4">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded"
            autoFocus
          />
        </div>

        <div className="col-span-3 flex items-center gap-2">
          <input
            type="number"
            value={editStartPage}
            onChange={(e) => setEditStartPage(parseInt(e.target.value) || 1)}
            className="w-16 px-2 py-1 text-sm border rounded"
            min={1}
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="number"
            value={editEndPage}
            onChange={(e) => setEditEndPage(parseInt(e.target.value) || 1)}
            className="w-16 px-2 py-1 text-sm border rounded"
            min={1}
          />
        </div>

        <div className="col-span-2">
          <span className="text-xs text-muted-foreground">Manual edit</span>
        </div>

        <div className="col-span-2 flex items-center justify-end gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => onSave({ title: editTitle, startPage: editStartPage, endPage: editEndPage })}
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={onCancelEdit}
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        'grid grid-cols-12 gap-4 px-4 py-3 items-center cursor-pointer transition-colors',
        isSelected ? 'bg-muted' : 'hover:bg-muted/50'
      )}
      onClick={onSelect}
    >
      <div className="col-span-1 text-sm text-muted-foreground">{index + 1}</div>
      
      <div className="col-span-4">
        <div className="flex items-center gap-2">
          {chapter.isManuallyEdited && (
            <Edit2 className="h-3 w-3 text-blue-500" />
          )}
          <span className="font-medium truncate">{chapter.title}</span>
        </div>
      </div>

      <div className="col-span-3 text-sm">
        Pages {chapter.startPage} - {chapter.endPage}
        <span className="text-muted-foreground ml-1">
          ({chapter.endPage - chapter.startPage + 1} pages)
        </span>
      </div>

      <div className="col-span-2">
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full', confidenceColors[chapter.confidence])} />
          <span className="text-sm capitalize">{chapter.confidence}</span>
        </div>
      </div>

      <div className="col-span-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
          <Edit2 className="h-4 w-4" />
        </Button>
        {hasNext && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onMergeNext(); }} title="Merge with next">
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Chapter Preview
// ============================================================================

interface ChapterPreviewProps {
  chapter: DetectedChapter
  className?: string
}

export function ChapterPreview({ chapter, className }: ChapterPreviewProps) {
  return (
    <div className={cn('border rounded-xl overflow-hidden', className)}>
      <div className="aspect-video bg-muted flex items-center justify-center">
        {chapter.thumbnailUrl ? (
          <img 
            src={chapter.thumbnailUrl} 
            alt={chapter.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <BookOpen className="h-12 w-12 text-muted-foreground" />
        )}
      </div>
      <div className="p-4">
        <h4 className="font-semibold">{chapter.title}</h4>
        <p className="text-sm text-muted-foreground">
          Pages {chapter.startPage} - {chapter.endPage}
        </p>
      </div>
    </div>
  )
}
