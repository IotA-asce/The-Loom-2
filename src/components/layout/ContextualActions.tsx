/**
 * Contextual Primary Actions
 * Actions that appear in context, not cluttering the main UI
 */

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'

interface ActionItem {
  id: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'outline' | 'ghost'
  disabled?: boolean
}

interface ContextualActionsProps {
  actions: ActionItem[]
  className?: string
  position?: 'left' | 'center' | 'right'
}

export function ContextualActions({ 
  actions, 
  className,
  position = 'right'
}: ContextualActionsProps) {
  const positionClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }

  return (
    <div className={cn(
      'flex items-center gap-3',
      positionClasses[position],
      className
    )}>
      {actions.map((action, index) => (
        <Button
          key={action.id}
          variant={action.variant || (index === 0 ? 'default' : 'outline')}
          onClick={action.onClick}
          disabled={action.disabled}
          className="flex items-center gap-2"
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
    </div>
  )
}

interface PageActionsProps {
  primary?: ActionItem
  secondary?: ActionItem[]
  className?: string
}

export function PageActions({ 
  primary, 
  secondary = [], 
  className 
}: PageActionsProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {secondary.map(action => (
        <Button
          key={action.id}
          variant={action.variant || 'outline'}
          onClick={action.onClick}
          disabled={action.disabled}
          className="flex items-center gap-2"
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
      {primary && (
        <Button
          variant={primary.variant || 'default'}
          onClick={primary.onClick}
          disabled={primary.disabled}
          className="flex items-center gap-2"
        >
          {primary.icon}
          {primary.label}
        </Button>
      )}
    </div>
  )
}

interface FloatingActionButtonProps {
  icon: React.ReactNode
  onClick: () => void
  label?: string
  className?: string
}

export function FloatingActionButton({ 
  icon, 
  onClick, 
  label,
  className 
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-8 right-8 z-50',
        'w-14 h-14 rounded-full',
        'bg-primary text-primary-foreground',
        'shadow-lg hover:shadow-xl',
        'flex items-center justify-center',
        'transition-all duration-300 ease-out',
        'hover:scale-105 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        className
      )}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  )
}

interface ToolbarProps {
  children: React.ReactNode
  className?: string
}

export function Toolbar({ children, className }: ToolbarProps) {
  return (
    <div className={cn(
      'flex items-center gap-2 p-2',
      'border rounded-lg bg-card/50',
      className
    )}>
      {children}
    </div>
  )
}

interface ActionGroupProps {
  children: React.ReactNode
  className?: string
  label?: string
}

export function ActionGroup({ children, className, label }: ActionGroupProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {label && (
        <span className="text-xs text-muted-foreground mr-2">{label}</span>
      )}
      {children}
    </div>
  )
}
