/**
 * Feedback Form
 * User feedback and issue reporting
 */

import { useState } from 'react'
import { 
  MessageSquare, Bug, Lightbulb, Heart, 
  Send, X, CheckCircle, Loader2 
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export type FeedbackType = 'bug' | 'feature' | 'general' | 'praise'

export interface FeedbackData {
  type: FeedbackType
  title: string
  description: string
  email?: string
  screenshot?: string
  logs?: string
  systemInfo?: SystemInfo
}

export interface SystemInfo {
  userAgent: string
  platform: string
  language: string
  screenResolution: string
  appVersion: string
}

export interface FeedbackFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (feedback: FeedbackData) => Promise<void>
  defaultType?: FeedbackType
  className?: string
}

// ============================================================================
// Feedback Form
// ============================================================================

export function FeedbackForm({ 
  open, 
  onClose, 
  onSubmit, 
  defaultType = 'general',
  className 
}: FeedbackFormProps) {
  const [type, setType] = useState<FeedbackType>(defaultType)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [includeLogs, setIncludeLogs] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const feedbackTypes: { id: FeedbackType; label: string; icon: React.ReactNode }[] = [
    { id: 'bug', label: 'Bug Report', icon: <Bug className="h-4 w-4" /> },
    { id: 'feature', label: 'Feature Request', icon: <Lightbulb className="h-4 w-4" /> },
    { id: 'general', label: 'General Feedback', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'praise', label: 'Praise', icon: <Heart className="h-4 w-4" /> },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    
    const feedback: FeedbackData = {
      type,
      title,
      description,
      email: email || undefined,
      systemInfo: getSystemInfo(),
    }

    if (includeLogs) {
      feedback.logs = getRecentLogs()
    }

    try {
      await onSubmit(feedback)
      setSubmitted(true)
      setTimeout(() => {
        onClose()
        // Reset form
        setSubmitted(false)
        setTitle('')
        setDescription('')
        setEmail('')
        setIncludeLogs(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm',
      className
    )}>
      <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl overflow-hidden animate-scale-in mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send Feedback
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
              <p className="text-muted-foreground">
                Your feedback helps us improve The Loom.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Feedback Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Feedback Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {feedbackTypes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id)}
                      className={cn(
                        'flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors',
                        type === t.id
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-muted hover:border-muted-foreground/50'
                      )}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us more details..."
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  We'll only use this to follow up on your feedback.
                </p>
              </div>

              {/* Include Logs */}
              {type === 'bug' && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeLogs}
                    onChange={(e) => setIncludeLogs(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Include debug logs</span>
                </label>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      Send Feedback
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Feedback Button
// ============================================================================

interface FeedbackButtonProps {
  onClick: () => void
  className?: string
}

export function FeedbackButton({ onClick, className }: FeedbackButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-2',
        'bg-primary text-primary-foreground rounded-full shadow-lg',
        'hover:bg-primary/90 transition-all hover:scale-105',
        className
      )}
    >
      <MessageSquare className="h-4 w-4" />
      <span className="text-sm font-medium">Feedback</span>
    </button>
  )
}

// ============================================================================
// Utility Functions
// ============================================================================

function getSystemInfo(): SystemInfo {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    appVersion: import.meta.env.VITE_APP_VERSION || 'unknown',
  }
}

// Simple log buffer - in a real app, you'd have a more sophisticated logging system
const logBuffer: string[] = []

export function addLog(message: string): void {
  logBuffer.push(`[${new Date().toISOString()}] ${message}`)
  if (logBuffer.length > 100) {
    logBuffer.shift()
  }
}

function getRecentLogs(): string {
  return logBuffer.join('\n') || 'No recent logs available'
}
