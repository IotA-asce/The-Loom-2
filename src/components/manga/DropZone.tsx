import React, { useCallback } from 'react'
import { useDragAndDrop } from '@/hooks/useDragAndDrop'
import { getSupportedExtensions } from '@/lib/upload/fileType'
import './DropZone.css'

export interface DropZoneProps {
  onDrop: (files: File[]) => void
  isProcessing?: boolean
}

export const DropZone: React.FC<DropZoneProps> = ({ onDrop, isProcessing }) => {
  const handleDrop = useCallback(
    (files: File[]) => {
      if (!isProcessing) {
        onDrop(files)
      }
    },
    [onDrop, isProcessing]
  )

  const { isDragging, isOver, getRootProps } = useDragAndDrop({
    onDrop: handleDrop,
    accept: getSupportedExtensions().map(ext => ext.replace('.', '')),
  })

  const rootProps = getRootProps()

  return (
    <div
      className={`drop-zone ${isDragging ? 'dragging' : ''} ${isOver ? 'over' : ''} ${
        isProcessing ? 'processing' : ''
      }`}
      {...rootProps}
    >
      <div className="drop-zone-content">
        <div className="drop-icon">📚</div>
        <p className="drop-text">
          {isProcessing
            ? 'Processing...'
            : isDragging
              ? 'Drop manga files here'
              : 'Drag & drop manga files here'}
        </p>
        <p className="drop-hint">
          Supports: {getSupportedExtensions().join(', ')}
        </p>
      </div>
    </div>
  )
}
