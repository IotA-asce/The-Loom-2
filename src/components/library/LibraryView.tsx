/**
 * Library View
 * Adaptive view modes: grid, list, compact
 */

import { useState, useCallback } from 'react'
import { Grid3X3, List, AlignJustify } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

export type ViewMode = 'grid' | 'list' | 'compact'

interface ViewToggleProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
  className?: string
}

export function ViewToggle({ currentView, onViewChange, className }: ViewToggleProps) {
  const views: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'grid', icon: <Grid3X3 className="h-4 w-4" />, label: 'Grid' },
    { mode: 'list', icon: <List className="h-4 w-4" />, label: 'List' },
    { mode: 'compact', icon: <AlignJustify className="h-4 w-4" />, label: 'Compact' },
  ]

  return (
    <div className={cn('flex items-center gap-1 p-1 bg-muted rounded-lg', className)}>
      {views.map(({ mode, icon, label }) => (
        <Button
          key={mode}
          variant={currentView === mode ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewChange(mode)}
          className="flex items-center gap-2"
          title={label}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  )
}

interface LibraryContainerProps {
  children: React.ReactNode
  viewMode: ViewMode
  className?: string
}

export function LibraryContainer({ children, viewMode, className }: LibraryContainerProps) {
  const containerClasses = {
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
    list: 'flex flex-col gap-4',
    compact: 'flex flex-col gap-2',
  }

  return (
    <div className={cn(containerClasses[viewMode], className)}>
      {children}
    </div>
  )
}

interface LibraryItemProps {
  children: React.ReactNode
  viewMode: ViewMode
  className?: string
  onClick?: () => void
}

export function LibraryItem({ children, viewMode, className, onClick }: LibraryItemProps) {
  const itemClasses = {
    grid: 'group relative flex flex-col rounded-xl border bg-card p-4 hover:shadow-md transition-shadow cursor-pointer',
    list: 'group relative flex items-center gap-4 rounded-lg border bg-card p-4 hover:shadow-md transition-shadow cursor-pointer',
    compact: 'group relative flex items-center gap-3 rounded-md border bg-card px-3 py-2 hover:bg-muted/50 transition-colors cursor-pointer',
  }

  return (
    <div 
      className={cn(itemClasses[viewMode], className)}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface LibraryItemImageProps {
  src?: string
  alt: string
  viewMode: ViewMode
  className?: string
}

export function LibraryItemImage({ src, alt, viewMode, className }: LibraryItemImageProps) {
  const imageClasses = {
    grid: 'w-full aspect-[3/4] object-cover rounded-lg mb-4',
    list: 'w-16 h-20 object-cover rounded-md flex-shrink-0',
    compact: 'w-10 h-12 object-cover rounded flex-shrink-0',
  }

  if (!src) {
    return (
      <div className={cn(
        imageClasses[viewMode],
        'bg-muted flex items-center justify-center',
        className
      )}>
        <span className="text-muted-foreground text-xs">No Image</span>
      </div>
    )
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={cn(imageClasses[viewMode], className)}
      loading="lazy"
    />
  )
}

interface LibraryItemContentProps {
  title: string
  subtitle?: string
  meta?: string
  viewMode: ViewMode
  className?: string
  actions?: React.ReactNode
}

export function LibraryItemContent({ 
  title, 
  subtitle, 
  meta, 
  viewMode, 
  className,
  actions 
}: LibraryItemContentProps) {
  if (viewMode === 'compact') {
    return (
      <div className={cn('flex items-center justify-between flex-1 min-w-0', className)}>
        <div className="min-w-0">
          <h3 className="text-sm font-medium truncate">{title}</h3>
          {meta && <p className="text-xs text-muted-foreground truncate">{meta}</p>}
        </div>
        {actions && (
          <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {actions}
          </div>
        )}
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className={cn('flex-1 min-w-0 flex items-center justify-between', className)}>
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
          {meta && <p className="text-xs text-muted-foreground mt-1">{meta}</p>}
        </div>
        {actions && (
          <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
            {actions}
          </div>
        )}
      </div>
    )
  }

  // Grid view
  return (
    <div className={cn('flex-1 flex flex-col', className)}>
      <h3 className="font-semibold line-clamp-2">{title}</h3>
      {subtitle && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{subtitle}</p>}
      {meta && <p className="text-xs text-muted-foreground mt-2">{meta}</p>}
      {actions && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t opacity-0 group-hover:opacity-100 transition-opacity">
          {actions}
        </div>
      )}
    </div>
  )
}

// Hook for managing view mode
export function useLibraryView(defaultView: ViewMode = 'grid') {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView)

  const toggleView = useCallback(() => {
    setViewMode(prev => {
      if (prev === 'grid') return 'list'
      if (prev === 'list') return 'compact'
      return 'grid'
    })
  }, [])

  return { viewMode, setViewMode, toggleView }
}
