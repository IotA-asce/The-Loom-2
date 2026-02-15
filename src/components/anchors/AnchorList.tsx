/**
 * AnchorList Component
 * 
 * List view of anchor events with filtering and sorting
 */

import { useMemo, useState } from 'react'
import type { AnchorEvent } from '@/lib/db/schema'
import { AnchorCard } from './AnchorCard'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter } from 'lucide-react'

interface AnchorListProps {
  anchors: AnchorEvent[]
  selectedId?: string
  onSelect: (anchor: AnchorEvent) => void
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  sortBy?: 'page' | 'confidence' | 'score'
}

type FilterStatus = 'all' | AnchorEvent['status']
type FilterSignificance = 'all' | AnchorEvent['significance']

export function AnchorList({
  anchors,
  selectedId,
  onSelect,
  onApprove,
  onReject,
  sortBy = 'page',
}: AnchorListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [significanceFilter, setSignificanceFilter] = useState<FilterSignificance>('all')
  
  const filteredAnchors = useMemo(() => {
    let result = [...anchors]
    
    // Search filter
    if (search) {
      const query = search.toLowerCase()
      result = result.filter(a => 
        a.title.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query)
      )
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(a => a.status === statusFilter)
    }
    
    // Significance filter
    if (significanceFilter !== 'all') {
      result = result.filter(a => a.significance === significanceFilter)
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'page':
          return a.pageNumber - b.pageNumber
        case 'confidence':
          return b.confidence - a.confidence
        case 'score':
          return b.branchingPotential.score - a.branchingPotential.score
        default:
          return 0
      }
    })
    
    return result
  }, [anchors, search, statusFilter, significanceFilter, sortBy])
  
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: anchors.length }
    anchors.forEach(a => {
      counts[a.status] = (counts[a.status] || 0) + 1
    })
    return counts
  }, [anchors])
  
  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="space-y-3 p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search anchors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
            <SelectTrigger className="flex-1">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({statusCounts.all})</SelectItem>
              <SelectItem value="detected">Detected ({statusCounts.detected || 0})</SelectItem>
              <SelectItem value="review">Review ({statusCounts.review || 0})</SelectItem>
              <SelectItem value="approved">Approved ({statusCounts.approved || 0})</SelectItem>
              <SelectItem value="rejected">Rejected ({statusCounts.rejected || 0})</SelectItem>
              <SelectItem value="manual">Manual ({statusCounts.manual || 0})</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={significanceFilter} onValueChange={(v) => setSignificanceFilter(v as FilterSignificance)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Significance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="major">Major</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="minor">Minor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* List */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {filteredAnchors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No anchors match your filters
          </div>
        ) : (
          filteredAnchors.map(anchor => (
            <AnchorCard
              key={anchor.id}
              anchor={anchor}
              isSelected={anchor.id === selectedId}
              onClick={() => onSelect(anchor)}
              onApprove={onApprove ? () => onApprove(anchor.id!) : undefined}
              onReject={onReject ? () => onReject(anchor.id!) : undefined}
            />
          ))
        )}
      </div>
      
      {/* Count */}
      <div className="px-4 py-2 border-t text-sm text-muted-foreground">
        Showing {filteredAnchors.length} of {anchors.length} anchors
      </div>
    </div>
  )
}
