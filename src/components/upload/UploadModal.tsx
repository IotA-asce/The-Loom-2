/**
 * Upload Modal
 * Modal upload experience
 */

import { useState, useCallback } from 'react'
import { X, Upload, FileArchive, Image, FileText } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export type UploadStep = 'select' | 'preview' | 'uploading' | 'processing' | 'complete' | 'error'

export interface UploadFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  preview?: string
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error'
  progress: number
  error?: string
}

// ============================================================================
// Upload Modal
// ============================================================================

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  step: UploadStep
  files: UploadFile[]
  onFilesSelect: (files: File[]) => void
  onRemoveFile: (fileId: string) => void
  onUpload: () => void
  onRetry?: () => void
  totalProgress?: number
  estimatedTime?: string
  currentStage?: string
  error?: string
}

export function UploadModal({
  isOpen,
  onClose,
  step,
  files,
  onFilesSelect,
  onRemoveFile,
  onUpload,
  onRetry,
  totalProgress = 0,
  estimatedTime,
  currentStage,
  error,
}: UploadModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={step === 'select' ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-card border rounded-xl shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">
              {step === 'select' && 'Upload Manga'}
              {step === 'preview' && 'Review Upload'}
              {step === 'uploading' && 'Uploading...'}
              {step === 'processing' && 'Processing...'}
              {step === 'complete' && 'Upload Complete'}
              {step === 'error' && 'Upload Failed'}
            </h2>
            {step === 'select' && (
              <p className="text-sm text-muted-foreground">
                Import manga files to your library
              </p>
            )}
          </div>

          {step === 'select' && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'select' && (
            <FileSelectArea onFilesSelect={onFilesSelect} />
          )}

          {step === 'preview' && (
            <FilePreviewList 
              files={files} 
              onRemove={onRemoveFile}
            />
          )}

          {(step === 'uploading' || step === 'processing') && (
            <UploadProgress
              files={files}
              totalProgress={totalProgress}
              estimatedTime={estimatedTime}
              currentStage={currentStage}
            />
          )}

          {step === 'complete' && (
            <UploadComplete 
              files={files}
              onClose={onClose}
            />
          )}

          {step === 'error' && (
            <UploadError
              error={error || 'Upload failed'}
              onRetry={onRetry}
              onClose={onClose}
            />
          )}
        </div>

        {/* Footer */}
        {(step === 'select' || step === 'preview') && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
            <div className="text-sm text-muted-foreground">
              {files.length > 0 ? `${files.length} file${files.length !== 1 ? 's' : ''} selected` : 'No files selected'}
            </div>

            <div className="flex items-center gap-3">
              {step === 'preview' && (
                <Button variant="outline" onClick={() => {}}>
                  Back
                </Button>
              )}

              <Button
                onClick={step === 'select' ? () => files.length > 0 && onUpload() : onUpload}
                disabled={files.length === 0}
              >
                {step === 'select' ? 'Continue' : 'Upload'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// File Select Area
// ============================================================================

interface FileSelectAreaProps {
  onFilesSelect: (files: File[]) => void
  className?: string
}

function FileSelectArea({ onFilesSelect, className }: FileSelectAreaProps) {
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFilesSelect(files)
    }
  }, [onFilesSelect])

  return (
    <div className={cn('space-y-4', className)}>
      <label className="block">
        <input
          type="file"
          multiple
          accept=".cbz,.cbr,.pdf,image/*"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="border-2 border-dashed border-muted rounded-xl p-12 text-center hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          
          <p className="text-lg font-medium mb-2">
            Click to upload or drag and drop
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            CBZ, CBR, PDF, or image files
          </p>
          
          <Button variant="outline" type="button">
            Select Files
          </Button>
        </div>
      </label>

      <div className="text-center text-xs text-muted-foreground">
        <p>Maximum file size: 500MB per file</p>
        <p>Supported formats: CBZ, CBR, PDF, JPG, PNG, WebP</p>
      </div>
    </div>
  )
}

// ============================================================================
// File Preview List
// ============================================================================

interface FilePreviewListProps {
  files: UploadFile[]
  onRemove: (fileId: string) => void
  className?: string
}

function FilePreviewList({ files, onRemove, className }: FilePreviewListProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.includes('zip') || type.includes('cbz') || type.includes('cbr')) {
      return <FileArchive className="h-5 w-5 text-blue-500" />
    }
    if (type.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />
    }
    return <Image className="h-5 w-5 text-green-500" />
  }

  return (
    <div className={cn('space-y-2 max-h-80 overflow-auto', className)}>
      {files.map(file => (
        <div 
          key={file.id}
          className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
        >
          {/* Preview or Icon */}
          {file.preview ? (
            <img 
              src={file.preview} 
              alt=""
              className="w-12 h-16 object-cover rounded"
            />
          ) : (
            <div className="w-12 h-16 bg-background rounded flex items-center justify-center">
              {getFileIcon(file.type)}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{file.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
          </div>

          {/* Remove */}
          <button
            onClick={() => onRemove(file.id)}
            className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Upload Progress
// ============================================================================

interface UploadProgressProps {
  files: UploadFile[]
  totalProgress: number
  estimatedTime?: string
  currentStage?: string
  className?: string
}

function UploadProgress({ 
  files, 
  totalProgress, 
  estimatedTime,
  currentStage,
  className 
}: UploadProgressProps) {
  const uploadingCount = files.filter(f => f.status === 'uploading').length

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overall Progress */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
          <span className="text-2xl font-bold text-primary">
            {Math.round(totalProgress)}%
          </span>
        </div>
        
        <p className="text-lg font-medium mb-1">
          {currentStage || 'Uploading files...'}
        </p>
        
        {estimatedTime && (
          <p className="text-sm text-muted-foreground">
            About {estimatedTime} remaining
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${totalProgress}%` }}
        />
      </div>

      {/* File Status */}
      <div className="space-y-2 text-sm">
        {files.slice(0, 3).map(file => (
          <div key={file.id} className="flex items-center justify-between text-muted-foreground">
            <span className="truncate">{file.name}</span>
            <span className="flex-shrink-0">
              {file.status === 'uploading' && `${file.progress}%`}
              {file.status === 'complete' && '✓'}
            </span>
          </div>
        ))}
        {files.length > 3 && (
          <p className="text-muted-foreground">
            and {files.length - 3} more...
          </p>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Upload Complete
// ============================================================================

interface UploadCompleteProps {
  files: UploadFile[]
  onClose: () => void
  className?: string
}

function UploadComplete({ files, onClose, className }: UploadCompleteProps) {
  const completedCount = files.filter(f => f.status === 'complete').length

  return (
    <div className={cn('text-center space-y-6', className)}>
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30">
        <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">
          Upload Complete!
        </h3>
        <p className="text-muted-foreground">
          {completedCount} file{completedCount !== 1 ? 's' : ''} uploaded successfully
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" onClick={onClose}>
          Go to Library
        </Button>
        <Button onClick={onClose}>
          Start Analysis
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Upload Error
// ============================================================================

interface UploadErrorProps {
  error: string
  onRetry?: () => void
  onClose: () => void
  className?: string
}

function UploadError({ error, onRetry, onClose, className }: UploadErrorProps) {
  return (
    <div className={cn('text-center space-y-6', className)}>
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10">
        <svg className="h-10 w-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">Upload Failed</h3>
        <p className="text-muted-foreground">{error}</p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        {onRetry && (
          <Button onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    </div>
  )
}
