/**
 * Drag & Drop Zone
 * Visual feedback for drag-and-drop file upload
 */

import { useState, useCallback, useRef } from 'react'
import { Upload, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

type DropZoneState = 'idle' | 'dragover' | 'valid' | 'invalid' | 'dropped'

interface DragDropZoneProps {
  onFilesDrop: (files: File[]) => void
  accept?: string
  maxSize?: number // in bytes
  className?: string
  children?: React.ReactNode
}

// ============================================================================
// Drag Drop Zone
// ============================================================================

export function DragDropZone({
  onFilesDrop,
  accept = '.cbz,.cbr,.pdf,image/*',
  maxSize = 500 * 1024 * 1024, // 500MB
  className,
  children,
}: DragDropZoneProps) {
  const [dropState, setDropState] = useState<DropZoneState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const dragCounter = useRef(0)

  const validateFiles = useCallback((files: File[]): { valid: File[]; invalid: string[] } => {
    const valid: File[] = []
    const invalid: string[] = []

    for (const file of files) {
      if (file.size > maxSize) {
        invalid.push(`${file.name} is too large (max ${formatFileSize(maxSize)})`)
      } else {
        valid.push(file)
      }
    }

    return { valid, invalid }
  }, [maxSize])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const hasFiles = Array.from(e.dataTransfer.items).some(
        item => item.kind === 'file'
      )
      
      if (hasFiles) {
        // Check if files are valid
        const files = Array.from(e.dataTransfer.files)
        const { invalid } = validateFiles(files)
        
        if (invalid.length > 0) {
          setDropState('invalid')
          setErrorMessage(invalid[0])
        } else {
          setDropState('valid')
          setErrorMessage('')
        }
      } else {
        setDropState('invalid')
        setErrorMessage('Only files are supported')
      }
    } else {
      setDropState('dragover')
    }
  }, [validateFiles])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--

    if (dragCounter.current === 0) {
      setDropState('idle')
      setErrorMessage('')
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0

    const files = Array.from(e.dataTransfer.files)
    
    if (files.length === 0) {
      setDropState('idle')
      return
    }

    const { valid, invalid } = validateFiles(files)

    if (invalid.length > 0) {
      setDropState('invalid')
      setErrorMessage(invalid[0])
      setTimeout(() => {
        setDropState('idle')
        setErrorMessage('')
      }, 3000)
    } else {
      setDropState('dropped')
      setErrorMessage('')
      onFilesDrop(valid)
      
      setTimeout(() => {
        setDropState('idle')
      }, 1000)
    }
  }, [onFilesDrop, validateFiles])

  const stateStyles: Record<DropZoneState, string> = {
    idle: 'border-muted bg-card',
    dragover: 'border-primary/50 bg-primary/5',
    valid: 'border-green-500 bg-green-50 dark:bg-green-950/20',
    invalid: 'border-red-500 bg-red-50 dark:bg-red-950/20',
    dropped: 'border-green-500 bg-green-50 dark:bg-green-950/20',
  }

  const stateIcons: Record<DropZoneState, React.ReactNode> = {
    idle: <Upload className="h-8 w-8 text-muted-foreground" />,
    dragover: <Upload className="h-8 w-8 text-primary animate-bounce" />,
    valid: <Upload className="h-8 w-8 text-green-600" />,
    invalid: <AlertCircle className="h-8 w-8 text-red-600" />,
    dropped: <Check className="h-8 w-8 text-green-600" />,
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        'relative border-2 border-dashed rounded-xl transition-all duration-200',
        stateStyles[dropState],
        className
      )}
    >
      {children || (
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 transition-all duration-200">
            {stateIcons[dropState]}
          </div>

          <p className="text-lg font-medium mb-2">
            {dropState === 'idle' && 'Drag and drop files here'}
            {dropState === 'dragover' && 'Drop files to upload'}
            {dropState === 'valid' && 'Release to upload'}
            {dropState === 'invalid' && 'Invalid files'}
            {dropState === 'dropped' && 'Files received!'}
          </p>

          {errorMessage ? (
            <p className="text-sm text-red-600">{errorMessage}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              or click to browse files
            </p>
          )}
        </div>
      )}

      {/* Visual overlay for drag states */}
      {dropState !== 'idle' && dropState !== 'dropped' && (
        <div className={cn(
          'absolute inset-0 rounded-xl pointer-events-none',
          dropState === 'valid' && 'ring-2 ring-green-500 ring-offset-2',
          dropState === 'invalid' && 'ring-2 ring-red-500 ring-offset-2'
        )} />
      )}
    </div>
  )
}

// ============================================================================
// Drag Drop Provider
// ============================================================================

interface DragDropProviderProps {
  onFilesDrop: (files: File[]) => void
  children: React.ReactNode
}

export function DragDropProvider({ onFilesDrop, children }: DragDropProviderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    
    if (e.dataTransfer?.types.includes('Files')) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)

    const files = Array.from(e.dataTransfer?.files || [])
    if (files.length > 0) {
      onFilesDrop(files)
    }
  }, [onFilesDrop])

  // Add global drag listeners
  // Note: This would typically be done in a useEffect
  // For now, we just render the children with a drag overlay

  return (
    <>
      {children}
      
      {/* Global drop overlay */}
      {isDragging && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="bg-card border-2 border-dashed border-primary rounded-xl p-16 text-center">
            <Upload className="h-16 w-16 text-primary mx-auto mb-4" />
            <p className="text-xl font-semibold">Drop files to upload</p>
          </div>
        </div>
      )}
    </>
  )
}

// ============================================================================
// Utilities
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// ============================================================================
// Hook
// ============================================================================

import { useEffect } from 'react'

export function useGlobalDragDrop(onFilesDrop: (files: File[]) => void) {
  const dragCounter = useRef(0)

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      dragCounter.current++
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      dragCounter.current--
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      dragCounter.current = 0

      const files = Array.from(e.dataTransfer?.files || [])
      if (files.length > 0) {
        onFilesDrop(files)
      }
    }

    document.addEventListener('dragenter', handleDragEnter)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('drop', handleDrop)

    return () => {
      document.removeEventListener('dragenter', handleDragEnter)
      document.removeEventListener('dragleave', handleDragLeave)
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('drop', handleDrop)
    }
  }, [onFilesDrop])
}
