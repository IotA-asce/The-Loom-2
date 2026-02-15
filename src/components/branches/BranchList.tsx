/**
 * BranchList Component
 * 
 * List view of branch variations with filtering
 */

import { useMemo, useState } from 'react'
import type { BranchVariation } from '@/lib/branches/variation/generator'
import { BranchCard } from './BranchCard'
import { Input } from '@/components/ui'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import { Search, Filter, ArrowUpDown } from 'lucide-react'
import type { ChangeEvent } from 'react'

interface BranchListProps {
  branches: BranchVariation[]
  selectedId?: string
  recommendedId?: string
  onSelect: (branch: BranchVariation) => void
  onView: (branch: BranchVariation) => void
  compareMode?: boolean
  compareSelection?: string[]
  onToggleCompare?: (branchId: string) => void
}

type SortBy = 'default' | 'mood' | 'chapters' | 'characters'
type FilterMood = 'all' | BranchVariation['mood']
type FilterConsequence = 'all' | BranchVariation['consequenceType']

export function BranchList({
  branches,
  selectedId,
  recommendedId,
  onSelect,
  onView,
  compareMode,
  compareSelection,
  onToggleCompare,
}: BranchListProps) {
  const [search, setSearch] = useState('')
  const [moodFilter, setMoodFilter] = useState<FilterMood>('all')
  const [consequenceFilter, setConsequenceFilter] = useState<FilterConsequence>('all')
  const [sortBy, setSortBy] = useState<SortBy>('default')
  
  const filteredBranches = useMemo(() => {
    let result = [...branches]
    
    // Search filter
    if (search) {
      const query = search.toLowerCase()
      result = result.filter(b => 
        b.premise.title.toLowerCase().includes(query) ||
        b.premise.whatIf.toLowerCase().includes(query) ||
        b.premise.description.toLowerCase().includes(query)
      )
    }
    
    // Mood filter
    if (moodFilter !== 'all') {
      result = result.filter(b => b.mood === moodFilter)
    }
    
    // Consequence filter
    if (consequenceFilter !== 'all') {
      result = result.filter(b => b.consequenceType === consequenceFilter)
    }
    
    // Sort
    switch (sortBy) {
      case 'mood':
        result.sort((a, b) => a.mood.localeCompare(b.mood))
        break
      case 'chapters':
        result.sort((a, b) => a.estimatedChapters - b.estimatedChapters)
        break
      case 'characters':
        result.sort((a, b) => b.characterArcs.length - a.characterArcs.length)
        break
      default:
        // Keep original order
        break
    }
    
    return result
  }, [branches, search, moodFilter, consequenceFilter, sortBy])
  
  const moodCounts = useMemo(() => {
    const counts: Record<string, number> = { all: branches.length }
    branches.forEach(b => {
      counts[b.mood] = (counts[b.mood] || 0) + 1
    })
    return counts
  }, [branches])
  
  const consequenceCounts = useMemo(() => {
    const counts: Record<string, number> = { all: branches.length }
    branches.forEach(b => {
      counts[b.consequenceType] = (counts[b.consequenceType] || 0) + 1
    })
    return counts
  }, [branches])
  
  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="space-y-3 p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search branches..."
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={moodFilter} onValueChange={(v: string) => setMoodFilter(v as FilterMood)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Mood" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({moodCounts.all})</SelectItem>
              <SelectItem value="hopeful">Hopeful ({moodCounts.hopeful || 0})</SelectItem>
              <SelectItem value="tragic">Tragic ({moodCounts.tragic || 0})</SelectItem>
              <SelectItem value="mixed">Mixed ({moodCounts.mixed || 0})</SelectItem>
              <SelectItem value="dark">Dark ({moodCounts.dark || 0})</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={consequenceFilter} onValueChange={(v: string) => setConsequenceFilter(v as FilterConsequence)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({consequenceCounts.all})</SelectItem>
              <SelectItem value="personal">Personal ({consequenceCounts.personal || 0})</SelectItem>
              <SelectItem value="political">Political ({consequenceCounts.political || 0})</SelectItem>
              <SelectItem value="cosmic">Cosmic ({consequenceCounts.cosmic || 0})</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={(v: string) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="mood">Mood</SelectItem>
              <SelectItem value="chapters">Chapters</SelectItem>
              <SelectItem value="characters">Characters</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* List */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {filteredBranches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No branches match your filters
          </div>
        ) : (
          filteredBranches.map(branch => (
            <div 
              key={branch.id}
              className={compareMode && compareSelection?.includes(branch.id) ? 'ring-2 ring-primary rounded-lg' : ''}
              onClick={() => compareMode && onToggleCompare?.(branch.id)}
            >
              <BranchCard
                branch={branch}
                isSelected={branch.id === selectedId}
                isRecommended={branch.id === recommendedId}
                onClick={() => onView(branch)}
                onSelect={() => onSelect(branch)}
                compareMode={compareMode}
              />
            </div>
          ))
        )}
      </div>
      
      {/* Count */}
      <div className="px-4 py-2 border-t text-sm text-muted-foreground">
        Showing {filteredBranches.length} of {branches.length} branches
      </div>
    </div>
  )
}
