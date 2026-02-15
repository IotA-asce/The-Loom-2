/**
 * BranchCard Component
 * 
 * Displays branch variation with metadata
 */

import { useState } from 'react'
import type { BranchVariation } from '@/lib/branches/variation/generator'
import { 
  GitBranch, 
  Users, 
  Sparkles,
  CheckCircle2,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui'
import type { MouseEvent } from 'react'

interface BranchCardProps {
  branch: BranchVariation
  isSelected?: boolean
  isRecommended?: boolean
  onClick?: () => void
  onSelect?: () => void
  compareMode?: boolean
}

const moodConfig = {
  hopeful: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  tragic: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  mixed: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  dark: { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
}

const consequenceConfig = {
  personal: { label: 'Personal', icon: Users },
  political: { label: 'Political', icon: TrendingUp },
  cosmic: { label: 'Cosmic', icon: Sparkles },
}

export function BranchCard({ 
  branch, 
  isSelected, 
  isRecommended,
  onClick,
  onSelect,
  compareMode
}: BranchCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const mood = moodConfig[branch.mood]
  const consequence = consequenceConfig[branch.consequenceType]
  const ConsequenceIcon = consequence.icon
  
  return (
    <div
      className={cn(
        'relative rounded-lg border p-4 transition-all',
        isSelected && 'border-primary ring-2 ring-primary/20',
        !isSelected && 'border-border hover:border-primary/50',
        isRecommended && 'ring-2 ring-yellow-400/50'
      )}
    >
      {/* Recommendation badge */}
      {isRecommended && (
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
          Recommended
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-muted-foreground" />
            <h4 className="font-medium truncate">{branch.premise.title}</h4>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {branch.premise.subtitle}
          </p>
        </div>
        
        <div className={cn('px-2 py-1 rounded-full text-xs font-medium', mood.bg, mood.color)}>
          {branch.mood}
        </div>
      </div>
      
      {/* What If */}
      <div className="mt-3 p-3 bg-muted rounded-md">
        <p className="text-sm italic">{branch.premise.whatIf}</p>
      </div>
      
      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
        <div className="flex items-center gap-1 text-muted-foreground">
          <ConsequenceIcon className="w-3.5 h-3.5" />
          <span>{consequence.label}</span>
        </div>
        
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span>{branch.characterArcs.length} characters</span>
        </div>
        
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{branch.estimatedChapters} chapters</span>
        </div>
        
        <Badge variant="outline" className="text-xs">
          {branch.trajectory.endingType} ending
        </Badge>
      </div>
      
      {/* Expand/Collapse */}
      <button
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation()
          setIsExpanded(!isExpanded)
        }}
        className="flex items-center gap-1 mt-3 text-sm text-muted-foreground hover:text-foreground"
      >
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {isExpanded ? 'Less' : 'More'} details
      </button>
      
      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t space-y-3">
          {/* Description */}
          <div>
            <p className="text-sm font-medium">Description</p>
            <p className="text-sm text-muted-foreground">{branch.premise.description}</p>
          </div>
          
          {/* Themes */}
          {branch.themeProgression.length > 0 && (
            <div>
              <p className="text-sm font-medium">Themes</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {branch.themeProgression.map(theme => (
                  <Badge key={theme} variant="secondary" className="text-xs">
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Consequences */}
          {branch.premise.immediateConsequences.length > 0 && (
            <div>
              <p className="text-sm font-medium">Immediate Consequences</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                {branch.premise.immediateConsequences.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Character preview */}
          {branch.characterArcs.length > 0 && (
            <div>
              <p className="text-sm font-medium">Character Fates</p>
              <div className="space-y-1 mt-1">
                {branch.characterArcs.slice(0, 3).map(arc => (
                  <div key={arc.characterId} className="text-sm">
                    <span className="font-medium">{arc.characterName}:</span>
                    <span className="text-muted-foreground"> {arc.endingState}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Actions */}
      {!compareMode && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation()
              onClick?.()
            }}
            className="flex-1 text-sm px-3 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
          >
            View Details
          </button>
          <button
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation()
              onSelect?.()
            }}
            className={cn(
              'flex-1 text-sm px-3 py-2 rounded-md transition-colors flex items-center justify-center gap-2',
              isSelected
                ? 'bg-green-100 text-green-700'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {isSelected ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Selected
              </>
            ) : (
              'Select This Path'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
