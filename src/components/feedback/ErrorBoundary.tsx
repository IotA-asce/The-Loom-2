/**
 * Error Boundary
 * Catches React errors and displays fallback UI
 */

import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  className?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

// ============================================================================
// Error Boundary Component
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error, errorInfo })
    
    // Log to console
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo)
    
    // Could send to error reporting service here
    // reportError(error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleReload = (): void => {
    window.location.reload()
  }

  handleGoHome = (): void => {
    window.location.href = '/'
  }

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state
    const { children, fallback, className } = this.props

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return fallback
      }

      // Default error UI
      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo}
          onReset={this.handleReset}
          onReload={this.handleReload}
          onGoHome={this.handleGoHome}
          className={className}
        />
      )
    }

    return children
  }
}

// ============================================================================
// Error Fallback UI
// ============================================================================

interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  onReset: () => void
  onReload: () => void
  onGoHome: () => void
  className?: string
}

export function ErrorFallback({
  error,
  errorInfo,
  onReset,
  onReload,
  onGoHome,
  className,
}: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center p-4 bg-background',
      className
    )}>
      <div className="max-w-lg w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        
        {/* Message */}
        <p className="text-muted-foreground mb-6">
          We apologize for the inconvenience. The application encountered an unexpected error.
        </p>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-mono text-red-800 dark:text-red-300 break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <Button onClick={onReset} variant="outline">
            <RefreshCw className="h-4 w-4 mr-1" />
            Try Again
          </Button>
          <Button onClick={onReload}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Reload Page
          </Button>
          <Button onClick={onGoHome} variant="ghost">
            <Home className="h-4 w-4 mr-1" />
            Go Home
          </Button>
        </div>

        {/* Show Details Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 mx-auto"
        >
          <Bug className="h-4 w-4" />
          {showDetails ? 'Hide technical details' : 'Show technical details'}
        </button>

        {/* Stack Trace */}
        {showDetails && errorInfo && (
          <div className="mt-4 text-left">
            <div className="bg-muted rounded-lg p-4 overflow-auto max-h-64">
              <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                {errorInfo.componentStack}
              </pre>
            </div>
          </div>
        )}

        {/* Error ID */}
        <p className="text-xs text-muted-foreground mt-6">
          Error ID: {generateErrorId()}
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// Helper Components
// ============================================================================

import { useState } from 'react'

/**
 * Generate a unique error ID for tracking
 */
function generateErrorId(): string {
  return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// ============================================================================
// Mini Error Boundary
// ============================================================================

interface MiniErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  className?: string
}

interface MiniErrorBoundaryState {
  hasError: boolean
}

export class MiniErrorBoundary extends Component<MiniErrorBoundaryProps, MiniErrorBoundaryState> {
  constructor(props: MiniErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): MiniErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('MiniErrorBoundary caught an error:', error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className={cn(
          'p-4 border border-red-200 rounded-lg bg-red-50 text-red-800',
          this.props.className
        )}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Failed to load component</span>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// ============================================================================
// Async Error Handler
// ============================================================================

export function useAsyncErrorHandler() {
  const handleAsyncError = (error: unknown): void => {
    if (error instanceof Error) {
      console.error('Async error:', error)
      // Could show toast notification here
    }
  }

  return { handleAsyncError }
}

// ============================================================================
// Safe Render Component
// ============================================================================

interface SafeRenderProps {
  children: ReactNode
  loading?: ReactNode
  error?: ReactNode
  className?: string
}

export function SafeRender({ children, loading, error, className }: SafeRenderProps) {
  return (
    <ErrorBoundary
      fallback={error}
      className={className}
    >
      {children}
    </ErrorBoundary>
  )
}
