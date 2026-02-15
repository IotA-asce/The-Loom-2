/**
 * ConfidenceBadge Component
 * 
 * Visual indicator for detection confidence
 */

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui'

interface ConfidenceBadgeProps {
  confidence: number // 0-1
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
}

const getConfidenceLevel = (confidence: number): { 
  level: 'high' | 'medium' | 'low' 
  label: string 
  color: string 
  bg: string 
} => {
  if (confidence >= 0.8) {
    return { 
      level: 'high', 
      label: 'High Confidence', 
      color: 'text-green-600',
      bg: 'bg-green-100'
    }
  }
  if (confidence >= 0.5) {
    return { 
      level: 'medium', 
      label: 'Medium Confidence', 
      color: 'text-yellow-600',
      bg: 'bg-yellow-100'
    }
  }
  return { 
    level: 'low', 
    label: 'Low Confidence', 
    color: 'text-red-600',
    bg: 'bg-red-100'
  }
}

const sizeConfig = {
  sm: { badge: 'h-2 w-2', text: 'text-xs' },
  md: { badge: 'h-3 w-3', text: 'text-sm' },
  lg: { badge: 'h-4 w-4', text: 'text-base' },
}

export function ConfidenceBadge({ 
  confidence, 
  size = 'md',
  showValue = true 
}: ConfidenceBadgeProps) {
  const { level, label, color, bg } = getConfidenceLevel(confidence)
  const sizes = sizeConfig[size]
  
  const badge = (
    <div className={cn(
      'rounded-full flex items-center gap-1.5',
      sizes.text
    )}>
      <div className={cn(
        'rounded-full',
        sizes.badge,
        bg
      )} />
      {showValue && (
        <span className={cn('font-medium', color)}>
          {(confidence * 100).toFixed(0)}%
        </span>
      )}
    </div>
  )
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p>{label} ({(confidence * 100).toFixed(1)}%)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Simple dot-only version for compact UIs
 */
export function ConfidenceDot({ 
  confidence, 
  size = 'md' 
}: Omit<ConfidenceBadgeProps, 'showValue'>) {
  const { bg } = getConfidenceLevel(confidence)
  const sizes = sizeConfig[size]
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            'rounded-full',
            sizes.badge,
            bg
          )} />
        </TooltipTrigger>
        <TooltipContent>
          <p>{(confidence * 100).toFixed(0)}% confidence</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
