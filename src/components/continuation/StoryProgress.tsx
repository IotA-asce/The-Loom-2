/**
 * StoryProgress component
 * Visual timeline of chapters and branches
 */

import { useState, useCallback } from 'react'
import { GitBranch, CheckCircle2, Circle, Clock, MoreHorizontal } from 'lucide-react'

interface ChapterProgress {
  id: string
  number: number
  title: string
  status: 'completed' | 'in-progress' | 'planned'
  branchId?: string
  branchName?: string
}

interface BranchInfo {
  id: string
  name: string
  color: string
  parentBranchId?: string
}

interface StoryProgressProps {
  chapters: ChapterProgress[]
  branches: BranchInfo[]
  currentChapterId: string
  onChapterClick: (chapterId: string) => void
  onBranchClick?: (branchId: string) => void
}

export function StoryProgress({
  chapters,
  branches,
  currentChapterId,
  onChapterClick,
  onBranchClick,
}: StoryProgressProps) {
  const [hoveredChapter, setHoveredChapter] = useState<string | null>(null)

  const getStatusIcon = useCallback((status: ChapterProgress['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'planned':
        return <Circle className="h-4 w-4 text-muted-foreground" />
    }
  }, [])

  const getBranchColor = useCallback((branchId?: string) => {
    if (!branchId) return 'bg-primary'
    const branch = branches.find(b => b.id === branchId)
    return branch?.color || 'bg-primary'
  }, [branches])

  // Group chapters by branch
  const chaptersByBranch = chapters.reduce((acc, chapter) => {
    const branchId = chapter.branchId || 'main'
    if (!acc[branchId]) {
      acc[branchId] = []
    }
    acc[branchId].push(chapter)
    return acc
  }, {} as Record<string, ChapterProgress[]>)

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">Story Progress</h2>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>{chapters.filter(c => c.status === 'completed').length} Complete</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>{chapters.filter(c => c.status === 'in-progress').length} In Progress</span>
          </div>
        </div>
      </div>

      {/* Branches Legend */}
      {branches.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/30">
          <span className="text-sm text-muted-foreground">Branches:</span>
          <div className="flex items-center gap-3">
            {branches.map(branch => (
              <button
                key={branch.id}
                onClick={() => onBranchClick?.(branch.id)}
                className="flex items-center gap-1 text-sm hover:underline"
              >
                <GitBranch className="h-3 w-3" />
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: branch.color }}
                />
                {branch.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-6">
          {Object.entries(chaptersByBranch).map(([branchId, branchChapters]) => (
            <div key={branchId} className="relative">
              {/* Branch Label */}
              {branchId !== 'main' && (
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {branches.find(b => b.id === branchId)?.name || 'Branch'}
                  </span>
                </div>
              )}

              {/* Chapter Nodes */}
              <div className="relative flex items-start gap-0">
                {/* Connecting Line */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-10" />

                {branchChapters.map((chapter, index) => (
                  <div
                    key={chapter.id}
                    className="flex-1 flex flex-col items-center"
                    onMouseEnter={() => setHoveredChapter(chapter.id)}
                    onMouseLeave={() => setHoveredChapter(null)}
                  >
                    {/* Chapter Node */}
                    <button
                      onClick={() => onChapterClick(chapter.id)}
                      className={`
                        relative z-10 w-10 h-10 rounded-full flex items-center justify-center
                        border-2 transition-all
                        ${chapter.id === currentChapterId 
                          ? 'border-primary bg-primary text-primary-foreground scale-110' 
                          : 'border-muted bg-background hover:border-primary'}
                        ${chapter.status === 'completed' ? 'ring-2 ring-green-500/20' : ''}
                      `}
                    >
                      {chapter.id === currentChapterId ? (
                        <MoreHorizontal className="h-5 w-5" />
                      ) : (
                        getStatusIcon(chapter.status)
                      )}
                    </button>

                    {/* Chapter Info */}
                    <div className={`
                      mt-2 text-center transition-opacity
                      ${hoveredChapter === chapter.id || chapter.id === currentChapterId ? 'opacity-100' : 'opacity-60'}
                    `}>
                      <p className="text-sm font-medium">Ch. {chapter.number}</p>
                      {(hoveredChapter === chapter.id || chapter.id === currentChapterId) && (
                        <p className="text-xs text-muted-foreground max-w-[120px] truncate">
                          {chapter.title}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 p-4 border rounded-lg bg-muted/30">
          <h3 className="text-sm font-medium mb-3">Progress Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{chapters.length}</p>
              <p className="text-xs text-muted-foreground">Total Chapters</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">
                {chapters.filter(c => c.status === 'completed').length}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-500">
                {branches.length + 1}
              </p>
              <p className="text-xs text-muted-foreground">Branches</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
