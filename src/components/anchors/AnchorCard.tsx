/**
 * AnchorCard Component
 * 
 * Displays anchor event with metadata and actions
 */

import { useState } from 'react'
import type { AnchorEvent } from '@/lib/db/schema'
import { 
  GitBranch, 
  Users, 
  MapPin, 
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MouseEvent } from 'react'

interface AnchorCardProps {
  anchor: AnchorEvent
  isSelected?: boolean
  onClick?: () => void
  onApprove?: () => void
  onReject?: () => void
}

const statusConfig = {
  detected: { icon: Sparkles, color: 'text-blue-500', bg: 'bg-blue-50' },
  review: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  approved: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
  rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  manual: { icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
}

const significanceConfig = {
  minor: 'text-gray-500',
  moderate: 'text-blue-500',
  major: 'text-orange-500',
  critical: 'text-red-500',
}

export function AnchorCard({ 
  anchor, 
  isSelected, 
  onClick,
  onApprove,
  onReject 
}: AnchorCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const StatusIcon = statusConfig[anchor.status].icon
  
  return (
    <div
      className={cn(
        'relative rounded-lg border p-4 transition-all cursor-pointer',
        isSelected && 'border-primary ring-2 ring-primary/20',
        !isSelected && 'border-border hover:border-primary/50',
        isHovered && 'shadow-md'
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{anchor.title}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {anchor.description}
          </p>
        </div>
        <div className={cn(
          'p-2 rounded-full shrink-0',
          statusConfig[anchor.status].bg
        )}>
          <StatusIcon className={cn('w-4 h-4', statusConfig[anchor.status].color)} />
        </div>
      </div>
      
      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          <span>Page {anchor.pageNumber}</span>
        </div>
        
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span>{anchor.characters.length} characters</span>
        </div>
        
        <div className="flex items-center gap-1">
          <GitBranch className="w-3.5 h-3.5" />
          <span className={cn(
            'font-medium',
            anchor.branchingPotential.score >= 0.7 ? 'text-green-600' :
            anchor.branchingPotential.score >= 0.4 ? 'text-yellow-600' : 'text-gray-500'
          )}>
            {(anchor.branchingPotential.score * 100).toFixed(0)}%
          </span>
        </div>
        
        <span className={cn(
          'text-xs font-medium capitalize',
          significanceConfig[anchor.significance]
        )}>
          {anchor.significance}
        </span>
      </div>
      
      {/* Actions on hover */}
      {isHovered && (onApprove || onReject) && (
        <div className="absolute top-2 right-2 flex gap-1 bg-background rounded shadow-sm">
          {onApprove && (
            <button
              onClick={(e: MouseEvent) => { e.stopPropagation(); onApprove() }}
              className="p-1.5 hover:bg-green-100 rounded text-green-600"
              title="Approve"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
          {onReject && (
            <button
              onClick={(e: MouseEvent) => { e.stopPropagation(); onReject() }}
              className="p-1.5 hover:bg-red-100 rounded text-red-600"
              title="Reject"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
