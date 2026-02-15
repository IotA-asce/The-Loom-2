/**
 * Anchor Explorer
 * Explore and select story anchor points for branching
 */

import { useState, useCallback } from 'react'
import { 
  Anchor, Star, AlertTriangle, CheckCircle2, 
  Plus, Search, Filter, ChevronRight, Info,
  ThumbsUp, ThumbsDown, MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export type AnchorType = 'decision' | 'coincidence' | 'revelation' | 'betrayal' | 
                         'sacrifice' | 'encounter' | 'conflict' | 'transformation' | 'mystery'

export interface StoryAnchor {
  id: string
  type: AnchorType
  title: string
  description: string
  page: number
  chapter?: number
  confidence: number
  impact: 'low' | 'medium' | 'high' | 'critical'
  characters: string[]
  selected: boolean
  userRating?: 'positive' | 'negative' | 'neutral'
  userNotes?: string
}

// ============================================================================
// Anchor Explorer
// ============================================================================

interface AnchorExplorerProps {
  anchors: StoryAnchor[]
  onAnchorSelect: (anchorId: string) => void
  onAnchorRate?: (anchorId: string, rating: 'positive' | 'negative') => void
  onAnchorAddNote?: (anchorId: string, note: string) => void
  onCreateManualAnchor?: () => void
  className?: string
}

export function AnchorExplorer({
  anchors,
  onAnchorSelect,
  onAnchorRate,
  onAnchorAddNote,
  onCreateManualAnchor,
  className,
}: AnchorExplorerProps) {
  const [selectedAnchorId, setSelectedAnchorId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<AnchorType | 'all'>('all')
  const [filterImpact, setFilterImpact] = useState<StoryAnchor['impact'] | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const selectedAnchor = anchors.find(a => a.id === selectedAnchorId)

  const filteredAnchors = anchors.filter(anchor => {
    if (filterType !== 'all' && anchor.type !== filterType) return false
    if (filterImpact !== 'all' && anchor.impact !== filterImpact) return false
    if (searchQuery && !anchor.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const handleAnchorClick = useCallback((anchor: StoryAnchor) => {
    setSelectedAnchorId(anchor.id)
    onAnchorSelect(anchor.id)
  }, [onAnchorSelect])

  return (
    <div className={cn('flex h-full gap-6', className)}>
      {/* Anchor List */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search anchors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as AnchorType | 'all')}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">All Types</option>
            {ANCHOR_TYPES.map(type => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>

          <select
            value={filterImpact}
            onChange={(e) => setFilterImpact(e.target.value as StoryAnchor['impact'] | 'all')}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">All Impact</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          {onCreateManualAnchor && (
            <Button onClick={onCreateManualAnchor}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          <span>{filteredAnchors.length} anchors</span>
          <span>{anchors.filter(a => a.selected).length} selected</span>
        </div>

        {/* Anchor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-auto">
          {filteredAnchors.map(anchor => (
            <AnchorCard
              key={anchor.id}
              anchor={anchor}
              isSelected={selectedAnchorId === anchor.id}
              onClick={() => handleAnchorClick(anchor)}
            />
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedAnchor && (
        <AnchorDetailPanel
          anchor={selectedAnchor}
          onRate={onAnchorRate}
          onAddNote={onAnchorAddNote}
          onClose={() => setSelectedAnchorId(null)}
        />
      )}
    </div>
  )
}

// ============================================================================
// Anchor Card
// ============================================================================

const ANCHOR_TYPES: { id: AnchorType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'decision', label: 'Decision', icon: '⚡', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'coincidence', label: 'Coincidence', icon: '🎲', color: 'bg-purple-100 text-purple-700' },
  { id: 'revelation', label: 'Revelation', icon: '💡', color: 'bg-blue-100 text-blue-700' },
  { id: 'betrayal', label: 'Betrayal', icon: '🗡️', color: 'bg-red-100 text-red-700' },
  { id: 'sacrifice', label: 'Sacrifice', icon: '🕊️', color: 'bg-pink-100 text-pink-700' },
  { id: 'encounter', label: 'Encounter', icon: '🤝', color: 'bg-green-100 text-green-700' },
  { id: 'conflict', label: 'Conflict', icon: '⚔️', color: 'bg-orange-100 text-orange-700' },
  { id: 'transformation', label: 'Transformation', icon: '🦋', color: 'bg-teal-100 text-teal-700' },
  { id: 'mystery', label: 'Mystery', icon: '❓', color: 'bg-indigo-100 text-indigo-700' },
]

const IMPACT_COLORS = {
  low: 'bg-gray-400',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-600',
}

interface AnchorCardProps {
  anchor: StoryAnchor
  isSelected: boolean
  onClick: () => void
}

function AnchorCard({ anchor, isSelected, onClick }: AnchorCardProps) {
  const typeInfo = ANCHOR_TYPES.find(t => t.id === anchor.type) || ANCHOR_TYPES[0]

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative text-left p-4 border rounded-xl transition-all',
        isSelected 
          ? 'border-primary ring-2 ring-primary ring-offset-2' 
          : 'hover:shadow-md'
      )}
    >
      {/* Selection Indicator */}
      {anchor.selected && (
        <div className="absolute top-2 right-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        </div>
      )}

      {/* Type Badge */}
      <div className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-3', typeInfo.color)}>
        <span>{typeInfo.icon}</span>
        <span>{typeInfo.label}</span>
      </div>

      {/* Title */}
      <h4 className="font-semibold mb-2 line-clamp-2">{anchor.title}</h4>

      {/* Description */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
        {anchor.description}
      </p>

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Page {anchor.page}</span>
        
        <div className="flex items-center gap-2">
          {/* Confidence */}
          <span className="text-muted-foreground">
            {Math.round(anchor.confidence * 100)}% confidence
          </span>
          
          {/* Impact */}
          <span className={cn('w-2 h-2 rounded-full', IMPACT_COLORS[anchor.impact])} 
                title={`${anchor.impact} impact`} />
        </div>
      </div>

      {/* Characters */}
      {anchor.characters.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {anchor.characters.map(char => (
            <span key={char} className="text-xs px-2 py-0.5 bg-muted rounded-full">
              {char}
            </span>
          ))}
        </div>
      )}

      {/* User Rating */}
      {anchor.userRating && (
        <div className="mt-3 pt-3 border-t">
          <span className={cn(
            'text-xs',
            anchor.userRating === 'positive' && 'text-green-600',
            anchor.userRating === 'negative' && 'text-red-600'
          )}>
            You rated this anchor {anchor.userRating}
          </span>
        </div>
      )}
    </button>
  )
}

// ============================================================================
// Anchor Detail Panel
// ============================================================================

interface AnchorDetailPanelProps {
  anchor: StoryAnchor
  onRate?: (anchorId: string, rating: 'positive' | 'negative') => void
  onAddNote?: (anchorId: string, note: string) => void
  onClose: () => void
}

function AnchorDetailPanel({ anchor, onRate, onAddNote, onClose }: AnchorDetailPanelProps) {
  const [note, setNote] = useState(anchor.userNotes || '')
  const typeInfo = ANCHOR_TYPES.find(t => t.id === anchor.type) || ANCHOR_TYPES[0]

  const handleSaveNote = () => {
    onAddNote?.(anchor.id, note)
  }

  return (
    <div className="w-80 flex-shrink-0 border-l bg-card p-4 overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Anchor Details</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <Info className="h-4 w-4" />
        </Button>
      </div>

      {/* Type */}
      <div className={cn('inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium mb-4', typeInfo.color)}>
        <span>{typeInfo.icon}</span>
        <span>{typeInfo.label}</span>
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold mb-2">{anchor.title}</h2>

      {/* Description */}
      <p className="text-muted-foreground mb-6">{anchor.description}</p>

      {/* Metadata */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-muted-foreground">Page</span>
          <span className="font-medium">{anchor.page}</span>
        </div>
        {anchor.chapter && (
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-muted-foreground">Chapter</span>
            <span className="font-medium">{anchor.chapter}</span>
          </div>
        )}
        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-muted-foreground">Confidence</span>
          <span className="font-medium">{Math.round(anchor.confidence * 100)}%</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-muted-foreground">Impact</span>
          <span className={cn('capitalize font-medium', 
            anchor.impact === 'critical' && 'text-red-600',
            anchor.impact === 'high' && 'text-orange-600'
          )}>
            {anchor.impact}
          </span>
        </div>
      </div>

      {/* Characters */}
      {anchor.characters.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-2">Involved Characters</h4>
          <div className="flex flex-wrap gap-2">
            {anchor.characters.map(char => (
              <span key={char} className="px-3 py-1 bg-muted rounded-full text-sm">
                {char}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Rating */}
      {onRate && (
        <div className="mb-6">
          <h4 className="font-medium mb-2">Rate this Anchor</h4>
          <div className="flex gap-2">
            <Button 
              variant={anchor.userRating === 'positive' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => onRate(anchor.id, 'positive')}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              Good
            </Button>
            <Button 
              variant={anchor.userRating === 'negative' ? 'destructive' : 'outline'}
              className="flex-1"
              onClick={() => onRate(anchor.id, 'negative')}
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              Poor
            </Button>
          </div>
        </div>
      )}

      {/* Notes */}
      {onAddNote && (
        <div>
          <h4 className="font-medium mb-2">Notes</h4>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add your notes about this anchor..."
            className="w-full h-24 px-3 py-2 border rounded-lg text-sm resize-none"
          />
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2"
            onClick={handleSaveNote}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Save Note
          </Button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Anchor Workflow
// ============================================================================

interface AnchorWorkflowProps {
  selectedAnchors: StoryAnchor[]
  onConfirm: () => void
  onClear: () => void
  className?: string
}

export function AnchorWorkflow({ 
  selectedAnchors, 
  onConfirm, 
  onClear,
  className 
}: AnchorWorkflowProps) {
  if (selectedAnchors.length === 0) return null

  return (
    <div className={cn('bg-card border rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium">
          {selectedAnchors.length} anchor{selectedAnchors.length !== 1 ? 's' : ''} selected
        </h4>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>

      <div className="space-y-2 mb-4 max-h-32 overflow-auto">
        {selectedAnchors.map(anchor => (
          <div key={anchor.id} className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="truncate">{anchor.title}</span>
          </div>
        ))}
      </div>

      <Button className="w-full" onClick={onConfirm}>
        Continue to Branch Creation
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  )
}

// ============================================================================
// Manual Anchor Creator
// ============================================================================

interface ManualAnchorFormProps {
  onSubmit: (anchor: Omit<StoryAnchor, 'id' | 'confidence' | 'selected'>) => void
  onCancel: () => void
  className?: string
}

export function ManualAnchorForm({ onSubmit, onCancel, className }: ManualAnchorFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<AnchorType>('decision')
  const [page, setPage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      title,
      description,
      type,
      page: parseInt(page) || 1,
      impact: 'medium',
      characters: [],
    })
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="e.g., Hero chooses the dark path"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as AnchorType)}
          className="w-full px-3 py-2 border rounded-lg"
        >
          {ANCHOR_TYPES.map(t => (
            <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Page Number</label>
        <input
          type="number"
          value={page}
          onChange={(e) => setPage(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
          min={1}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full h-24 px-3 py-2 border rounded-lg resize-none"
          placeholder="Describe what happens at this anchor point..."
          required
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          Create Anchor
        </Button>
      </div>
    </form>
  )
}
