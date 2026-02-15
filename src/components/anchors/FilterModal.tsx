/**
 * FilterModal Component
 * 
 * Advanced filtering modal for anchor events with multiple criteria
 */

import { useState, useCallback, useMemo } from 'react'
import type { AnchorEvent, AnchorEventType, SignificanceLevel } from '@/lib/db/schema'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  X,
  Filter,
  Users,
  GitBranch,
  Sparkles,
  Target,
  Calendar,
  RotateCcw,
  Check
} from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export interface AnchorFilters {
  /** Search query for title/description */
  search: string
  /** Filter by event types */
  types: AnchorEventType[]
  /** Filter by significance levels */
  significances: SignificanceLevel[]
  /** Filter by status */
  statuses: AnchorEvent['status'][]
  /** Minimum confidence score (0-1) */
  minConfidence: number
  /** Minimum branching potential score (0-1) */
  minBranchingPotential: number
  /** Filter by characters involved */
  characters: string[]
  /** Page number range */
  pageRange: { min: number | null; max: number | null }
  /** Has alternatives */
  hasAlternatives: boolean | null
  /** Has user notes */
  hasUserNotes: boolean | null
  /** Has user rating */
  hasUserRating: boolean | null
}

export interface FilterModalProps {
  open: boolean
  onClose: () => void
  anchors: AnchorEvent[]
  filters: AnchorFilters
  onFiltersChange: (filters: AnchorFilters) => void
  onApply: () => void
  onReset: () => void
  className?: string
}

// ============================================================================
// Constants
// ============================================================================

const ANCHOR_TYPES: { value: AnchorEventType; label: string; color: string }[] = [
  { value: 'decision', label: 'Decision', color: 'bg-blue-500' },
  { value: 'coincidence', label: 'Coincidence', color: 'bg-purple-500' },
  { value: 'revelation', label: 'Revelation', color: 'bg-yellow-500' },
  { value: 'betrayal', label: 'Betrayal', color: 'bg-red-500' },
  { value: 'sacrifice', label: 'Sacrifice', color: 'bg-orange-500' },
  { value: 'encounter', label: 'Encounter', color: 'bg-green-500' },
  { value: 'conflict', label: 'Conflict', color: 'bg-rose-500' },
  { value: 'transformation', label: 'Transformation', color: 'bg-cyan-500' },
  { value: 'mystery', label: 'Mystery', color: 'bg-indigo-500' },
]

const SIGNIFICANCE_LEVELS: { value: SignificanceLevel; label: string; color: string }[] = [
  { value: 'minor', label: 'Minor', color: 'text-gray-500' },
  { value: 'moderate', label: 'Moderate', color: 'text-blue-500' },
  { value: 'major', label: 'Major', color: 'text-orange-500' },
  { value: 'critical', label: 'Critical', color: 'text-red-500' },
]

const STATUSES: { value: AnchorEvent['status']; label: string; color: string }[] = [
  { value: 'detected', label: 'Detected', color: 'text-blue-500' },
  { value: 'review', label: 'Under Review', color: 'text-yellow-500' },
  { value: 'approved', label: 'Approved', color: 'text-green-500' },
  { value: 'rejected', label: 'Rejected', color: 'text-red-500' },
  { value: 'manual', label: 'Manual', color: 'text-purple-500' },
]

// ============================================================================
// Default Filters
// ============================================================================

export const defaultFilters: AnchorFilters = {
  search: '',
  types: [],
  significances: [],
  statuses: [],
  minConfidence: 0,
  minBranchingPotential: 0,
  characters: [],
  pageRange: { min: null, max: null },
  hasAlternatives: null,
  hasUserNotes: null,
  hasUserRating: null,
}

// ============================================================================
// Filter Modal Component
// ============================================================================

export function FilterModal({
  open,
  onClose,
  anchors,
  filters,
  onFiltersChange,
  onApply,
  onReset,
  className,
}: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<AnchorFilters>(filters)
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic')

  // Extract unique characters from anchors
  const availableCharacters = useMemo(() => {
    const charSet = new Set<string>()
    anchors.forEach(anchor => {
      anchor.characters.forEach(char => charSet.add(char))
    })
    return Array.from(charSet).sort()
  }, [anchors])

  // Get page range from anchors
  const { minPage, maxPage } = useMemo(() => {
    if (anchors.length === 0) return { minPage: 1, maxPage: 100 }
    const pages = anchors.map(a => a.pageNumber)
    return {
      minPage: Math.min(...pages),
      maxPage: Math.max(...pages),
    }
  }, [anchors])

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (localFilters.search) count++
    if (localFilters.types.length > 0) count++
    if (localFilters.significances.length > 0) count++
    if (localFilters.statuses.length > 0) count++
    if (localFilters.minConfidence > 0) count++
    if (localFilters.minBranchingPotential > 0) count++
    if (localFilters.characters.length > 0) count++
    if (localFilters.pageRange.min !== null || localFilters.pageRange.max !== null) count++
    if (localFilters.hasAlternatives !== null) count++
    if (localFilters.hasUserNotes !== null) count++
    if (localFilters.hasUserRating !== null) count++
    return count
  }, [localFilters])

  // Calculate filtered results preview
  const filteredCount = useMemo(() => {
    return anchors.filter(anchor => matchesFilters(anchor, localFilters)).length
  }, [anchors, localFilters])

  const handleApply = useCallback(() => {
    onFiltersChange(localFilters)
    onApply()
    onClose()
  }, [localFilters, onFiltersChange, onApply, onClose])

  const handleReset = useCallback(() => {
    setLocalFilters(defaultFilters)
    onReset()
  }, [onReset])

  const toggleArrayFilter = useCallback(<T extends string>(
    key: keyof AnchorFilters,
    value: T
  ) => {
    setLocalFilters(prev => {
      const current = prev[key] as T[]
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      return { ...prev, [key]: updated }
    })
  }, [])

  const updateFilter = useCallback(<K extends keyof AnchorFilters>(
    key: K,
    value: AnchorFilters[K]
  ) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn('max-w-2xl max-h-[90vh] overflow-hidden flex flex-col', className)}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Anchors
              {activeFiltersCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredCount} of {anchors.length} anchors match your filters
          </p>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('basic')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'basic'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Basic Filters
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'advanced'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Advanced
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {activeTab === 'basic' ? (
            <BasicFilters
              filters={localFilters}
              onToggleType={(type) => toggleArrayFilter('types', type)}
              onToggleSignificance={(sig) => toggleArrayFilter('significances', sig)}
              onToggleStatus={(status) => toggleArrayFilter('statuses', status)}
              onSearchChange={(search) => updateFilter('search', search)}
            />
          ) : (
            <AdvancedFilters
              filters={localFilters}
              availableCharacters={availableCharacters}
              minPage={minPage}
              maxPage={maxPage}
              onMinConfidenceChange={(val) => updateFilter('minConfidence', val)}
              onMinBranchingPotentialChange={(val) => updateFilter('minBranchingPotential', val)}
              onToggleCharacter={(char) => toggleArrayFilter('characters', char)}
              onPageRangeChange={(range) => updateFilter('pageRange', range)}
              onHasAlternativesChange={(val) => updateFilter('hasAlternatives', val)}
              onHasUserNotesChange={(val) => updateFilter('hasUserNotes', val)}
              onHasUserRatingChange={(val) => updateFilter('hasUserRating', val)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="ghost" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset All
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              <Check className="w-4 h-4 mr-1" />
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Basic Filters Tab
// ============================================================================

interface BasicFiltersProps {
  filters: AnchorFilters
  onToggleType: (type: AnchorEventType) => void
  onToggleSignificance: (sig: SignificanceLevel) => void
  onToggleStatus: (status: AnchorEvent['status']) => void
  onSearchChange: (search: string) => void
}

function BasicFilters({
  filters,
  onToggleType,
  onToggleSignificance,
  onToggleStatus,
  onSearchChange,
}: BasicFiltersProps) {
  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Search
        </Label>
        <Input
          type="text"
          placeholder="Search titles and descriptions..."
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Event Types */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Target className="w-4 h-4" />
          Event Types
        </Label>
        <div className="flex flex-wrap gap-2">
          {ANCHOR_TYPES.map(({ value, label, color }) => (
            <FilterChip
              key={value}
              label={label}
              color={color}
              selected={filters.types.includes(value)}
              onClick={() => onToggleType(value)}
            />
          ))}
        </div>
      </div>

      {/* Significance Levels */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <GitBranch className="w-4 h-4" />
          Significance
        </Label>
        <div className="flex flex-wrap gap-2">
          {SIGNIFICANCE_LEVELS.map(({ value, label, color }) => (
            <FilterChip
              key={value}
              label={label}
              textColor={color}
              selected={filters.significances.includes(value)}
              onClick={() => onToggleSignificance(value)}
            />
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Status
        </Label>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(({ value, label, color }) => (
            <FilterChip
              key={value}
              label={label}
              textColor={color}
              selected={filters.statuses.includes(value)}
              onClick={() => onToggleStatus(value)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Advanced Filters Tab
// ============================================================================

interface AdvancedFiltersProps {
  filters: AnchorFilters
  availableCharacters: string[]
  minPage: number
  maxPage: number
  onMinConfidenceChange: (value: number) => void
  onMinBranchingPotentialChange: (value: number) => void
  onToggleCharacter: (character: string) => void
  onPageRangeChange: (range: { min: number | null; max: number | null }) => void
  onHasAlternativesChange: (value: boolean | null) => void
  onHasUserNotesChange: (value: boolean | null) => void
  onHasUserRatingChange: (value: boolean | null) => void
}

function AdvancedFilters({
  filters,
  availableCharacters,
  minPage,
  maxPage,
  onMinConfidenceChange,
  onMinBranchingPotentialChange,
  onToggleCharacter,
  onPageRangeChange,
  onHasAlternativesChange,
  onHasUserNotesChange,
  onHasUserRatingChange,
}: AdvancedFiltersProps) {
  return (
    <div className="space-y-6">
      {/* Confidence Score */}
      <div className="space-y-2">
        <Label>Minimum Confidence: {(filters.minConfidence * 100).toFixed(0)}%</Label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={filters.minConfidence}
          onChange={(e) => onMinConfidenceChange(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Branching Potential */}
      <div className="space-y-2">
        <Label>Minimum Branching Potential: {(filters.minBranchingPotential * 100).toFixed(0)}%</Label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={filters.minBranchingPotential}
          onChange={(e) => onMinBranchingPotentialChange(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Page Range */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Page Range
        </Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder={`Min (${minPage})`}
            value={filters.pageRange.min ?? ''}
            onChange={(e) => onPageRangeChange({
              ...filters.pageRange,
              min: e.target.value ? parseInt(e.target.value) : null
            })}
            className="w-24"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="number"
            placeholder={`Max (${maxPage})`}
            value={filters.pageRange.max ?? ''}
            onChange={(e) => onPageRangeChange({
              ...filters.pageRange,
              max: e.target.value ? parseInt(e.target.value) : null
            })}
            className="w-24"
          />
        </div>
      </div>

      {/* Characters */}
      {availableCharacters.length > 0 && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Characters ({filters.characters.length} selected)
          </Label>
          <div className="max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1">
            {availableCharacters.map(char => (
              <label key={char} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-1 rounded">
                <input
                  type="checkbox"
                  checked={filters.characters.includes(char)}
                  onChange={() => onToggleCharacter(char)}
                  className="w-4 h-4"
                />
                <span className="text-sm">{char}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Boolean Filters */}
      <div className="space-y-3">
        <Label>Other Filters</Label>
        
        <BooleanFilter
          label="Has Alternatives"
          value={filters.hasAlternatives}
          onChange={onHasAlternativesChange}
        />
        
        <BooleanFilter
          label="Has User Notes"
          value={filters.hasUserNotes}
          onChange={onHasUserNotesChange}
        />
        
        <BooleanFilter
          label="Has User Rating"
          value={filters.hasUserRating}
          onChange={onHasUserRatingChange}
        />
      </div>
    </div>
  )
}

// ============================================================================
// Filter Chip Component
// ============================================================================

interface FilterChipProps {
  label: string
  selected: boolean
  onClick: () => void
  color?: string
  textColor?: string
}

function FilterChip({ label, selected, onClick, color, textColor }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors',
        'border hover:border-primary/50',
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background border-muted text-foreground'
      )}
    >
      {color && (
        <span className={cn('w-2 h-2 rounded-full', color)} />
      )}
      {textColor && selected && <span className={cn('w-2 h-2 rounded-full', textColor)} />}
      {label}
      {selected && <X className="w-3 h-3 ml-0.5" />}
    </button>
  )
}

// ============================================================================
// Boolean Filter Component
// ============================================================================

interface BooleanFilterProps {
  label: string
  value: boolean | null
  onChange: (value: boolean | null) => void
}

function BooleanFilter({ label, value, onChange }: BooleanFilterProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(null)}
          className={cn(
            'px-3 py-1 text-xs rounded-l-md border transition-colors',
            value === null
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background border-muted hover:bg-muted'
          )}
        >
          Any
        </button>
        <button
          onClick={() => onChange(true)}
          className={cn(
            'px-3 py-1 text-xs border-t border-b transition-colors',
            value === true
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background border-muted hover:bg-muted'
          )}
        >
          Yes
        </button>
        <button
          onClick={() => onChange(false)}
          className={cn(
            'px-3 py-1 text-xs rounded-r-md border transition-colors',
            value === false
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background border-muted hover:bg-muted'
          )}
        >
          No
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// Filter Logic
// ============================================================================

export function matchesFilters(anchor: AnchorEvent, filters: AnchorFilters): boolean {
  // Search filter
  if (filters.search) {
    const query = filters.search.toLowerCase()
    const matchesSearch =
      anchor.title.toLowerCase().includes(query) ||
      anchor.description.toLowerCase().includes(query)
    if (!matchesSearch) return false
  }

  // Type filter
  if (filters.types.length > 0 && !filters.types.includes(anchor.type)) {
    return false
  }

  // Significance filter
  if (filters.significances.length > 0 && !filters.significances.includes(anchor.significance)) {
    return false
  }

  // Status filter
  if (filters.statuses.length > 0 && !filters.statuses.includes(anchor.status)) {
    return false
  }

  // Confidence filter
  if (anchor.confidence < filters.minConfidence) {
    return false
  }

  // Branching potential filter
  if (anchor.branchingPotential.score < filters.minBranchingPotential) {
    return false
  }

  // Characters filter
  if (filters.characters.length > 0) {
    const hasMatchingChar = filters.characters.some(char =>
      anchor.characters.includes(char)
    )
    if (!hasMatchingChar) return false
  }

  // Page range filter
  if (filters.pageRange.min !== null && anchor.pageNumber < filters.pageRange.min) {
    return false
  }
  if (filters.pageRange.max !== null && anchor.pageNumber > filters.pageRange.max) {
    return false
  }

  // Has alternatives filter
  if (filters.hasAlternatives !== null) {
    const hasAlts = anchor.alternatives.length > 0
    if (hasAlts !== filters.hasAlternatives) return false
  }

  // Has user notes filter
  if (filters.hasUserNotes !== null) {
    const hasNotes = !!anchor.userNotes && anchor.userNotes.trim().length > 0
    if (hasNotes !== filters.hasUserNotes) return false
  }

  // Has user rating filter
  if (filters.hasUserRating !== null) {
    const hasRating = anchor.userRating !== undefined
    if (hasRating !== filters.hasUserRating) return false
  }

  return true
}

// ============================================================================
// Hook for using filters
// ============================================================================

export function useAnchorFilters(anchors: AnchorEvent[]) {
  const [filters, setFilters] = useState<AnchorFilters>(defaultFilters)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

  const filteredAnchors = useMemo(() => {
    return anchors.filter(anchor => matchesFilters(anchor, filters))
  }, [anchors, filters])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.types.length > 0) count++
    if (filters.significances.length > 0) count++
    if (filters.statuses.length > 0) count++
    if (filters.minConfidence > 0) count++
    if (filters.minBranchingPotential > 0) count++
    if (filters.characters.length > 0) count++
    if (filters.pageRange.min !== null || filters.pageRange.max !== null) count++
    if (filters.hasAlternatives !== null) count++
    if (filters.hasUserNotes !== null) count++
    if (filters.hasUserRating !== null) count++
    return count
  }, [filters])

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [])

  return {
    filters,
    setFilters,
    filteredAnchors,
    activeFiltersCount,
    isFilterModalOpen,
    setIsFilterModalOpen,
    resetFilters,
  }
}
