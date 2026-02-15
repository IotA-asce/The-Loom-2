/**
 * Library Organization
 * Folders, tags, and AI-powered auto-organization
 */

import { useState, useCallback, useMemo } from 'react'
import { 
  Folder, Tag, Sparkles, ChevronRight, ChevronDown,
  Plus, MoreHorizontal, FolderOpen 
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface LibraryFolder {
  id: string
  name: string
  parentId?: string
  itemIds: string[]
  isDefault?: boolean
  createdAt: Date
}

export interface LibraryTag {
  id: string
  name: string
  color: string
  itemIds: string[]
}

export interface LibraryItem {
  id: string
  title: string
  folderId?: string
  tagIds: string[]
  aiTags?: string[]
  createdAt: Date
}

// ============================================================================
// Folder Tree
// ============================================================================

interface FolderTreeProps {
  folders: LibraryFolder[]
  activeFolderId?: string
  onFolderSelect: (folderId: string) => void
  onCreateFolder?: () => void
  className?: string
}

export function FolderTree({ 
  folders, 
  activeFolderId, 
  onFolderSelect,
  onCreateFolder,
  className 
}: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }, [])

  // Build folder hierarchy
  const folderHierarchy = useMemo(() => {
    const folderMap = new Map(folders.map(f => [f.id, { ...f, children: [] as LibraryFolder[] }]))
    const roots: LibraryFolder[] = []

    for (const folder of folders) {
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId)
        if (parent) {
          parent.children.push(folderMap.get(folder.id)!)
        }
      } else {
        roots.push(folderMap.get(folder.id)!)
      }
    }

    return roots
  }, [folders])

  const renderFolder = (folder: LibraryFolder & { children?: LibraryFolder[] }, depth = 0) => {
    const hasChildren = folder.children && folder.children.length > 0
    const isExpanded = expandedFolders.has(folder.id)
    const isActive = activeFolderId === folder.id

    return (
      <div key={folder.id}>
        <button
          onClick={() => onFolderSelect(folder.id)}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
            isActive 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
          )}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {hasChildren && (
            <span 
              onClick={(e) => {
                e.stopPropagation()
                toggleFolder(folder.id)
              }}
              className="p-0.5 rounded hover:bg-black/10"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </span>
          )}
          {!hasChildren && <span className="w-4" />}
          
          {isActive ? (
            <FolderOpen className="h-4 w-4 flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 flex-shrink-0" />
          )}
          
          <span className="flex-1 text-left truncate">{folder.name}</span>
          <span className="text-xs opacity-60">{folder.itemIds.length}</span>
        </button>

        {hasChildren && isExpanded && (
          <div>
            {folder.children!.map(child => renderFolder(child as LibraryFolder & { children?: LibraryFolder[] }, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between px-3 mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Folders
        </span>
        {onCreateFolder && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCreateFolder}>
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {folderHierarchy.map(folder => renderFolder(folder))}
    </div>
  )
}

// ============================================================================
// Tag Cloud
// ============================================================================

interface TagCloudProps {
  tags: LibraryTag[]
  activeTagIds: string[]
  onTagToggle: (tagId: string) => void
  onCreateTag?: () => void
  className?: string
}

const TAG_COLORS: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

export function TagCloud({ 
  tags, 
  activeTagIds, 
  onTagToggle,
  onCreateTag,
  className 
}: TagCloudProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between px-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Tags
        </span>
        {onCreateTag && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCreateTag}>
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 px-3">
        {tags.map(tag => {
          const isActive = activeTagIds.includes(tag.id)
          return (
            <button
              key={tag.id}
              onClick={() => onTagToggle(tag.id)}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                isActive 
                  ? (TAG_COLORS[tag.color] || TAG_COLORS.gray) + ' ring-2 ring-offset-1 ring-primary'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <Tag className="h-3 w-3" />
              {tag.name}
              <span className="opacity-60">({tag.itemIds.length})</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// AI Organization Panel
// ============================================================================

interface AIOrganizationProps {
  suggestions: Array<{
    type: 'folder' | 'tag'
    name: string
    itemIds: string[]
    confidence: number
  }>
  onApplySuggestion: (suggestion: AIOrganizationProps['suggestions'][0]) => void
  onDismissSuggestion: (index: number) => void
  className?: string
}

export function AIOrganization({ 
  suggestions, 
  onApplySuggestion,
  onDismissSuggestion,
  className 
}: AIOrganizationProps) {
  if (suggestions.length === 0) return null

  return (
    <div className={cn('border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-purple-500" />
        <span className="font-medium text-sm">AI Organization Suggestions</span>
      </div>

      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <div 
            key={index}
            className="flex items-center justify-between p-3 bg-white dark:bg-black/20 rounded-lg"
          >
            <div className="flex items-center gap-3">
              {suggestion.type === 'folder' ? (
                <Folder className="h-4 w-4 text-blue-500" />
              ) : (
                <Tag className="h-4 w-4 text-green-500" />
              )}
              <div>
                <p className="text-sm font-medium">{suggestion.name}</p>
                <p className="text-xs text-muted-foreground">
                  {suggestion.itemIds.length} items • {Math.round(suggestion.confidence * 100)}% confidence
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => onDismissSuggestion(index)}
              >
                Dismiss
              </Button>
              <Button 
                size="sm"
                onClick={() => onApplySuggestion(suggestion)}
              >
                Apply
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Organization Sidebar
// ============================================================================

interface OrganizationSidebarProps {
  folders: LibraryFolder[]
  tags: LibraryTag[]
  activeFolderId?: string
  activeTagIds: string[]
  aiSuggestions?: AIOrganizationProps['suggestions']
  onFolderSelect: (folderId: string) => void
  onTagToggle: (tagId: string) => void
  onCreateFolder?: () => void
  onCreateTag?: () => void
  onApplyAISuggestion?: (suggestion: AIOrganizationProps['suggestions'][0]) => void
  className?: string
}

export function OrganizationSidebar({
  folders,
  tags,
  activeFolderId,
  activeTagIds,
  aiSuggestions = [],
  onFolderSelect,
  onTagToggle,
  onCreateFolder,
  onCreateTag,
  onApplyAISuggestion,
  className,
}: OrganizationSidebarProps) {
  return (
    <div className={cn('w-64 flex-shrink-0 space-y-6 py-4', className)}>
      <FolderTree
        folders={folders}
        activeFolderId={activeFolderId}
        onFolderSelect={onFolderSelect}
        onCreateFolder={onCreateFolder}
      />

      <div className="border-t pt-4">
        <TagCloud
          tags={tags}
          activeTagIds={activeTagIds}
          onTagToggle={onTagToggle}
          onCreateTag={onCreateTag}
        />
      </div>

      {aiSuggestions.length > 0 && onApplyAISuggestion && (
        <div className="border-t pt-4">
          <AIOrganization
            suggestions={aiSuggestions}
            onApplySuggestion={onApplyAISuggestion}
            onDismissSuggestion={() => {}}
          />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Hooks
// ============================================================================

export function useLibraryOrganization() {
  const [activeFolderId, setActiveFolderId] = useState<string>()
  const [activeTagIds, setActiveTagIds] = useState<string[]>([])

  const toggleTag = useCallback((tagId: string) => {
    setActiveTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }, [])

  const clearFilters = useCallback(() => {
    setActiveFolderId(undefined)
    setActiveTagIds([])
  }, [])

  return {
    activeFolderId,
    setActiveFolderId,
    activeTagIds,
    toggleTag,
    clearFilters,
  }
}
