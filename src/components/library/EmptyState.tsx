/**
 * Empty State
 * Tutorial empty state for first-time users
 */

import { 
  BookOpen, Upload, Sparkles, GitBranch, 
  ArrowRight, CheckCircle2, Circle 
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

// ============================================================================
// Tutorial Step
// ============================================================================

export interface TutorialStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  isCompleted?: boolean
}

// ============================================================================
// Tutorial Empty State
// ============================================================================

interface TutorialEmptyStateProps {
  steps: TutorialStep[]
  onSkip?: () => void
  className?: string
}

export function TutorialEmptyState({ 
  steps, 
  onSkip,
  className 
}: TutorialEmptyStateProps) {
  const completedCount = steps.filter(s => s.isCompleted).length
  const progress = (completedCount / steps.length) * 100

  return (
    <div className={cn('max-w-2xl mx-auto', className)}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Welcome to The Loom</h2>
        <p className="text-muted-foreground">
          Let's get you started with a few quick steps
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Getting started</span>
          <span className="font-medium">{completedCount} of {steps.length} completed</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <TutorialStepCard 
            key={step.id} 
            step={step} 
            index={index}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>

      {/* Skip */}
      {onSkip && completedCount === 0 && (
        <div className="text-center mt-8">
          <button 
            onClick={onSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tutorial
          </button>
        </div>
      )}
    </div>
  )
}

interface TutorialStepCardProps {
  step: TutorialStep
  index: number
  isLast: boolean
}

function TutorialStepCard({ step, index, isLast }: TutorialStepCardProps) {
  return (
    <div className={cn(
      'relative flex gap-4',
      step.isCompleted && 'opacity-60'
    )}>
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-5 top-12 w-px h-full bg-border" />
      )}

      {/* Icon/Number */}
      <div className={cn(
        'relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
        step.isCompleted 
          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-primary text-primary-foreground'
      )}>
        {step.isCompleted ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          step.icon
        )}
      </div>

      {/* Content */}
      <div className={cn(
        'flex-1 pb-8',
        isLast && 'pb-0'
      )}>
        <div className="bg-card border rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className={cn(
                'font-semibold mb-1',
                step.isCompleted && 'line-through'
              )}>
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>

            {step.action && !step.isCompleted && (
              <Button 
                size="sm"
                onClick={step.action.onClick}
                className="flex-shrink-0"
              >
                {step.action.label}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Simple Empty State
// ============================================================================

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center p-8',
      className
    )}>
      {icon && (
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      
      {description && (
        <p className="text-muted-foreground max-w-sm mb-6">
          {description}
        </p>
      )}

      <div className="flex items-center gap-3">
        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Preset Empty States
// ============================================================================

export function LibraryEmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <TutorialEmptyState
      steps={[
        {
          id: 'upload',
          title: 'Upload your first manga',
          description: 'Import manga files (CBZ, CBR, PDF, or images) to get started.',
          icon: <Upload className="h-5 w-5" />,
          action: {
            label: 'Upload',
            onClick: onUpload,
          },
        },
        {
          id: 'analyze',
          title: 'Analyze the story',
          description: 'Our AI will analyze characters, timeline, themes, and relationships.',
          icon: <Sparkles className="h-5 w-5" />,
          isCompleted: false,
        },
        {
          id: 'branch',
          title: 'Create your first branch',
          description: 'Explore "what if" scenarios and generate new story continuations.',
          icon: <GitBranch className="h-5 w-5" />,
          isCompleted: false,
        },
      ]}
    />
  )
}

export function SearchEmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <EmptyState
      icon={<BookOpen className="h-8 w-8 text-muted-foreground" />}
      title="No results found"
      description={`We couldn't find any manga or stories matching "${query}". Try a different search term.`}
      action={{
        label: 'Clear search',
        onClick: onClear,
      }}
    />
  )
}

export function FolderEmptyState({ folderName, onAdd }: { folderName: string; onAdd: () => void }) {
  return (
    <EmptyState
      title={`${folderName} is empty`}
      description="This folder doesn't have any items yet. Add manga or stories to organize them here."
      action={{
        label: 'Add items',
        onClick: onAdd,
      }}
    />
  )
}
