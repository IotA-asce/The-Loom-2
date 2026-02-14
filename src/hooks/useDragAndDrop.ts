import { useState, useCallback, useEffect, useRef } from 'react'

export interface DragState {
  isDragging: boolean
  isOver: boolean
  dragCounter: number
}

export interface UseDragAndDropOptions {
  onDrop: (files: File[]) => void
  onDragEnter?: () => void
  onDragLeave?: () => void
  accept?: string[]
  multiple?: boolean
}

export function useDragAndDrop(options: UseDragAndDropOptions) {
  const { onDrop, onDragEnter, onDragLeave, accept, multiple = true } = options
  const [isDragging, setIsDragging] = useState(false)
  const [isOver, setIsOver] = useState(false)
  const dragCounterRef = useRef(0)

  const isAcceptedFile = useCallback(
    (file: File): boolean => {
      if (!accept || accept.length === 0) return true
      return accept.some(type => {
        if (type.includes('*')) {
          return file.type.startsWith(type.replace('/*', ''))
        }
        return file.type === type
      })
    },
    [accept]
  )

  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounterRef.current += 1

      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragging(true)
        setIsOver(true)
        onDragEnter?.()
      }
    },
    [onDragEnter]
  )

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounterRef.current -= 1

      if (dragCounterRef.current === 0) {
        setIsDragging(false)
        setIsOver(false)
        onDragLeave?.()
      }
    },
    [onDragLeave]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounterRef.current = 0
      setIsDragging(false)
      setIsOver(false)

      const files = e.dataTransfer?.files
      if (!files || files.length === 0) return

      const fileArray = Array.from(files)
      const acceptedFiles = fileArray.filter(isAcceptedFile)

      if (acceptedFiles.length > 0) {
        onDrop(multiple ? acceptedFiles : [acceptedFiles[0]])
      }
    },
    [onDrop, isAcceptedFile, multiple]
  )

  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault()
    }

    const handleWindowDrop = (e: DragEvent) => {
      // Prevent dropping files outside drop zone
      if (!e.defaultPrevented) {
        e.preventDefault()
      }
    }

    window.addEventListener('dragover', handleWindowDragOver)
    window.addEventListener('drop', handleWindowDrop)

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver)
      window.removeEventListener('drop', handleWindowDrop)
    }
  }, [])

  const getRootProps = useCallback(
    () => ({
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    }),
    [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]
  )

  return {
    isDragging,
    isOver,
    getRootProps,
  }
}
