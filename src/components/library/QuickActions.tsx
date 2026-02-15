/**
 * Quick Actions
 * Priority quick actions for library items
 */

import { useState, useRef, useEffect } from 'react'
import { 
  Play, Edit, Trash2, Share2, Download, 
  MoreHorizontal, Sparkles, GitBranch, BookOpen,
  Copy, Archive, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export type ActionPriority = 'primary' | 'secondary' | 'menu'

export interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  priority: ActionPriority
  variant?: 'default' | 'destructive'
  shortcut?: string
  disabled?: boolean
}

// ============================================================================
// Quick Actions Bar
// ============================================================================

interface QuickActionsBarProps {
  actions: QuickAction[]
  maxPrimary?: number
  className?: string
}

export function QuickActionsBar({ 
  actions, 
  maxPrimary = 2,
  className 
}: QuickActionsBarProps) {
  const primaryActions = actions.filter(a => a.priority === 'primary').slice(0, maxPrimary)
  const secondaryActions = actions.filter(a => a.priority === 'secondary')
  const menuActions = actions.filter(a => a.priority === 'menu')

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Primary Actions */}
      {primaryActions.map(action => (
        <Button
          key={action.id}
          size="sm"
          variant={action.variant || 'default'}
          onClick={action.onClick}
          disabled={action.disabled}
          className="flex items-center gap-1.5"
        >
          {action.icon}
          <span className="hidden sm:inline">{action.label}</span>
        </Button>
      ))}

      {/* Secondary Actions */}
      {secondaryActions.map(action => (
        <Button
          key={action.id}
          size="sm"
          variant="outline"
          onClick={action.onClick}
          disabled={action.disabled}
          className="flex items-center gap-1.5"
        >
          {action.icon}
          <span className="hidden sm:inline">{action.label}</span>
        </Button>
      ))}

      {/* Menu Actions */}
      {menuActions.length > 0 && (
        <QuickActionsMenu actions={menuActions} />
      )}
    </div>
  )
}

// ============================================================================
// Quick Actions Menu
// ============================================================================

interface QuickActionsMenuProps {
  actions: QuickAction[]
  className?: string
}

export function QuickActionsMenu({ actions, className }: QuickActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="More actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-card border rounded-lg shadow-lg z-50 py-1">
          {actions.map(action => (
            <button
              key={action.id}
              onClick={() => {
                action.onClick()
                setIsOpen(false)
              }}
              disabled={action.disabled}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                action.variant === 'destructive' 
                  ? 'text-destructive hover:bg-destructive/10' 
                  : 'hover:bg-muted',
                action.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className="flex-shrink-0">{action.icon}</span>
              <span className="flex-1">{action.label}</span>
              {action.shortcut && (
                <kbd className="text-xs text-muted-foreground">{action.shortcut}</kbd>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Contextual Quick Actions
// ============================================================================

interface MangaQuickActionsProps {
  onRead?: () => void
  onAnalyze?: () => void
  onBranch?: () => void
  onDelete?: () => void
  className?: string
}

export function MangaQuickActions({
  onRead,
  onAnalyze,
  onBranch,
  onDelete,
  className,
}: MangaQuickActionsProps) {
  const actions = [
    {
      id: 'read' as const,
      label: 'Read',
      icon: <BookOpen className="h-4 w-4" />,
      onClick: onRead || (() => {}),
      priority: 'primary' as const,
    },
    {
      id: 'analyze' as const,
      label: 'Analyze',
      icon: <Sparkles className="h-4 w-4" />,
      onClick: onAnalyze || (() => {}),
      priority: 'secondary' as const,
    },
    {
      id: 'branch' as const,
      label: 'New Branch',
      icon: <GitBranch className="h-4 w-4" />,
      onClick: onBranch || (() => {}),
      priority: 'secondary' as const,
    },
    {
      id: 'delete' as const,
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete || (() => {}),
      priority: 'menu' as const,
      variant: 'destructive' as const,
    },
  ].filter(a => a.onClick !== undefined) satisfies QuickAction[]

  return <QuickActionsBar actions={actions} className={className} />
}

interface StoryQuickActionsProps {
  onContinue?: () => void
  onEdit?: () => void
  onExport?: () => void
  onShare?: () => void
  onDuplicate?: () => void
  onArchive?: () => void
  onDelete?: () => void
  className?: string
}

export function StoryQuickActions({
  onContinue,
  onEdit,
  onExport,
  onShare,
  onDuplicate,
  onArchive,
  onDelete,
  className,
}: StoryQuickActionsProps) {
  const actions = [
    {
      id: 'continue' as const,
      label: 'Continue',
      icon: <Play className="h-4 w-4" />,
      onClick: onContinue || (() => {}),
      priority: 'primary' as const,
    },
    {
      id: 'edit' as const,
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: onEdit || (() => {}),
      priority: 'secondary' as const,
    },
    {
      id: 'export' as const,
      label: 'Export',
      icon: <Download className="h-4 w-4" />,
      onClick: onExport || (() => {}),
      priority: 'menu' as const,
    },
    {
      id: 'share' as const,
      label: 'Share',
      icon: <Share2 className="h-4 w-4" />,
      onClick: onShare || (() => {}),
      priority: 'menu' as const,
    },
    {
      id: 'duplicate' as const,
      label: 'Duplicate',
      icon: <Copy className="h-4 w-4" />,
      onClick: onDuplicate || (() => {}),
      priority: 'menu' as const,
    },
    {
      id: 'archive' as const,
      label: 'Archive',
      icon: <Archive className="h-4 w-4" />,
      onClick: onArchive || (() => {}),
      priority: 'menu' as const,
    },
    {
      id: 'delete' as const,
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete || (() => {}),
      priority: 'menu' as const,
      variant: 'destructive' as const,
    },
  ].filter(a => a.onClick !== undefined) satisfies QuickAction[]

  return <QuickActionsBar actions={actions} className={className} />
}

// ============================================================================
// Floating Quick Actions
// ============================================================================

interface FloatingQuickActionsProps {
  actions: QuickAction[]
  className?: string
}

export function FloatingQuickActions({ actions, className }: FloatingQuickActionsProps) {
  const primaryAction = actions.find(a => a.priority === 'primary')
  const otherActions = actions.filter(a => a.priority !== 'primary').slice(0, 3)

  return (
    <div className={cn(
      'fixed bottom-6 right-6 flex items-center gap-2 z-50',
      className
    )}>
      {otherActions.map(action => (
        <Button
          key={action.id}
          variant="secondary"
          size="icon"
          onClick={action.onClick}
          disabled={action.disabled}
          className="h-10 w-10 rounded-full shadow-lg"
          title={action.label}
        >
          {action.icon}
        </Button>
      ))}
      
      {primaryAction && (
        <Button
          size="icon"
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          className="h-12 w-12 rounded-full shadow-lg"
          title={primaryAction.label}
        >
          {primaryAction.icon}
        </Button>
      )}
    </div>
  )
}

// ============================================================================
// Action Presets
// ============================================================================

export const MANGA_ACTIONS = {
  read: (onClick: () => void): QuickAction => ({
    id: 'read',
    label: 'Read',
    icon: <BookOpen className="h-4 w-4" />,
    onClick,
    priority: 'primary',
  }),
  analyze: (onClick: () => void): QuickAction => ({
    id: 'analyze',
    label: 'Analyze',
    icon: <Sparkles className="h-4 w-4" />,
    onClick,
    priority: 'secondary',
  }),
  branch: (onClick: () => void): QuickAction => ({
    id: 'branch',
    label: 'New Branch',
    icon: <GitBranch className="h-4 w-4" />,
    onClick,
    priority: 'secondary',
  }),
}

export const STORY_ACTIONS = {
  continue: (onClick: () => void): QuickAction => ({
    id: 'continue',
    label: 'Continue',
    icon: <Play className="h-4 w-4" />,
    onClick,
    priority: 'primary',
  }),
  edit: (onClick: () => void): QuickAction => ({
    id: 'edit',
    label: 'Edit',
    icon: <Edit className="h-4 w-4" />,
    onClick,
    priority: 'secondary',
  }),
  export: (onClick: () => void): QuickAction => ({
    id: 'export',
    label: 'Export',
    icon: <Download className="h-4 w-4" />,
    onClick,
    priority: 'menu',
  }),
  share: (onClick: () => void): QuickAction => ({
    id: 'share',
    label: 'Share',
    icon: <Share2 className="h-4 w-4" />,
    onClick,
    priority: 'menu',
  }),
  delete: (onClick: () => void): QuickAction => ({
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    onClick,
    priority: 'menu',
    variant: 'destructive',
  }),
}
