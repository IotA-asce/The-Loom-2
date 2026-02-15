/**
 * Upload Queue
 * Queue display with polling progress bar
 */

import { useState, useEffect, useCallback } from 'react'
import { 
  X, Pause, Play, RotateCcw, CheckCircle2, 
  AlertCircle, Clock, FileArchive 
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface QueueItem {
  id: string
  fileName: string
  fileSize: number
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error' | 'paused'
  progress: number
  stage?: string
  estimatedTimeRemaining?: number // in seconds
  error?: string
  retryCount: number
}

// ============================================================================
// Upload Queue
// ============================================================================

interface UploadQueueProps {
  items: QueueItem[]
  onPause?: (itemId: string) => void
  onResume?: (itemId: string) => void
  onRetry?: (itemId: string) => void
  onCancel?: (itemId: string) => void
  onClearCompleted?: () => void
  className?: string
}

export function UploadQueue({
  items,
  onPause,
  onResume,
  onRetry,
  onCancel,
  onClearCompleted,
  className,
}: UploadQueueProps) {
  const activeItems = items.filter(i => ['uploading', 'processing', 'pending', 'paused'].includes(i.status))
  const completedItems = items.filter(i => i.status === 'completed')
  const errorItems = items.filter(i => i.status === 'error')

  if (items.length === 0) return null

  return (
    <div className={cn('bg-card border rounded-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Upload Queue</h3>
          <span className="text-sm text-muted-foreground">
            ({activeItems.length} active, {completedItems.length} completed)
          </span>
        </div>
        
        {completedItems.length > 0 && onClearCompleted && (
          <Button variant="ghost" size="sm" onClick={onClearCompleted}>
            Clear Completed
          </Button>
        )}
      </div>

      {/* Queue Items */}
      <div className="divide-y max-h-96 overflow-auto">
        {items.map(item => (
          <QueueItemRow
            key={item.id}
            item={item}
            onPause={onPause}
            onResume={onResume}
            onRetry={onRetry}
            onCancel={onCancel}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Queue Item Row
// ============================================================================

interface QueueItemRowProps {
  item: QueueItem
  onPause?: (itemId: string) => void
  onResume?: (itemId: string) => void
  onRetry?: (itemId: string) => void
  onCancel?: (itemId: string) => void
}

function QueueItemRow({ item, onPause, onResume, onRetry, onCancel }: QueueItemRowProps) {
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const statusIcons = {
    pending: <Clock className="h-4 w-4 text-muted-foreground" />,
    uploading: <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />,
    processing: <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />,
    completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    error: <AlertCircle className="h-4 w-4 text-red-500" />,
    paused: <Pause className="h-4 w-4 text-yellow-500" />,
  }

  return (
    <div className="px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          {statusIcons[item.status]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-sm truncate">{item.fileName}</p>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatFileSize(item.fileSize)}
            </span>
          </div>

          {/* Progress */}
          {['uploading', 'processing', 'paused'].includes(item.status) && (
            <div className="space-y-1">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    'h-full transition-all duration-300',
                    item.status === 'paused' ? 'bg-yellow-500' : 'bg-primary'
                  )}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {item.progress}%
                  {item.stage && ` • ${item.stage}`}
                </span>
                {item.estimatedTimeRemaining !== undefined && item.status !== 'paused' && (
                  <span>{formatTime(item.estimatedTimeRemaining)} remaining</span>
                )}
                {item.status === 'paused' && <span>Paused</span>}
              </div>
            </div>
          )}

          {/* Error */}
          {item.status === 'error' && item.error && (
            <p className="text-xs text-red-600 mt-1">{item.error}</p>
          )}

          {/* Completed */}
          {item.status === 'completed' && (
            <p className="text-xs text-green-600 mt-1">Upload complete</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {item.status === 'uploading' && onPause && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onPause(item.id)}>
              <Pause className="h-4 w-4" />
            </Button>
          )}

          {item.status === 'paused' && onResume && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onResume(item.id)}>
              <Play className="h-4 w-4" />
            </Button>
          )}

          {item.status === 'error' && onRetry && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRetry(item.id)}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}

          {['pending', 'paused', 'error'].includes(item.status) && onCancel && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onCancel(item.id)}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Upload Status Badge
// ============================================================================

interface UploadStatusBadgeProps {
  count: number
  onClick?: () => void
  className?: string
}

export function UploadStatusBadge({ count, onClick, className }: UploadStatusBadgeProps) {
  if (count === 0) return null

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-2 px-3 py-1.5 rounded-full',
        'bg-primary text-primary-foreground text-sm font-medium',
        'hover:bg-primary/90 transition-colors',
        className
      )}
    >
      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      <span>{count} uploading</span>
    </button>
  )
}

// ============================================================================
// Hook for polling simulation
// ============================================================================

export function useUploadQueue(initialItems: QueueItem[] = []) {
  const [items, setItems] = useState<QueueItem[]>(initialItems)

  // Simulate progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      setItems(prev => prev.map(item => {
        if (item.status === 'uploading' && item.progress < 100) {
          const newProgress = Math.min(item.progress + Math.random() * 5, 100)
          return {
            ...item,
            progress: newProgress,
            estimatedTimeRemaining: item.estimatedTimeRemaining 
              ? Math.max(0, item.estimatedTimeRemaining - 1)
              : undefined,
          }
        }
        if (item.status === 'uploading' && item.progress >= 100) {
          return { ...item, status: 'processing', stage: 'Analyzing...' }
        }
        if (item.status === 'processing') {
          // Randomly complete
          if (Math.random() > 0.95) {
            return { ...item, status: 'completed', stage: undefined }
          }
        }
        return item
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const addItem = useCallback((file: File): string => {
    const id = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newItem: QueueItem = {
      id,
      fileName: file.name,
      fileSize: file.size,
      status: 'pending',
      progress: 0,
      retryCount: 0,
    }
    setItems(prev => [...prev, newItem])
    return id
  }, [])

  const startUpload = useCallback((id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, status: 'uploading', estimatedTimeRemaining: 120 }
        : item
    ))
  }, [])

  const pauseUpload = useCallback((id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'paused' } : item
    ))
  }, [])

  const resumeUpload = useCallback((id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'uploading' } : item
    ))
  }, [])

  const retryUpload = useCallback((id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, status: 'pending', error: undefined, retryCount: item.retryCount + 1 }
        : item
    ))
  }, [])

  const cancelUpload = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }, [])

  const clearCompleted = useCallback(() => {
    setItems(prev => prev.filter(item => item.status !== 'completed'))
  }, [])

  return {
    items,
    addItem,
    startUpload,
    pauseUpload,
    resumeUpload,
    retryUpload,
    cancelUpload,
    clearCompleted,
    activeCount: items.filter(i => ['uploading', 'processing', 'pending', 'paused'].includes(i.status)).length,
    completedCount: items.filter(i => i.status === 'completed').length,
    errorCount: items.filter(i => i.status === 'error').length,
  }
}
