/**
 * DetectionProgress Component
 * 
 * Progress indicator for anchor detection process
 */

import { Progress } from '@/components/ui'
import { cn } from '@/lib/utils'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface DetectionProgressProps {
  phase: 'filtering' | 'analyzing' | 'scoring' | 'complete' | 'error'
  progress: number // 0-100
  totalCandidates?: number
  processedCount?: number
  message?: string
}

const phaseConfig = {
  filtering: { label: 'Filtering Candidates', icon: Loader2 },
  analyzing: { label: 'Analyzing Events', icon: Loader2 },
  scoring: { label: 'Scoring & Ranking', icon: Loader2 },
  complete: { label: 'Detection Complete', icon: CheckCircle2 },
  error: { label: 'Detection Failed', icon: AlertCircle },
}

export function DetectionProgress({
  phase,
  progress,
  totalCandidates,
  processedCount,
  message,
}: DetectionProgressProps) {
  const config = phaseConfig[phase]
  const Icon = config.icon
  
  return (
    <div className="w-full space-y-3 p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        <div className={cn(
          'p-2 rounded-full',
          phase === 'complete' && 'bg-green-100 text-green-600',
          phase === 'error' && 'bg-red-100 text-red-600',
          phase !== 'complete' && phase !== 'error' && 'bg-blue-100 text-blue-600'
        )}>
          <Icon className={cn('w-5 h-5', phase !== 'complete' && phase !== 'error' && 'animate-spin')} />
        </div>
        <div className="flex-1">
          <h4 className="font-medium">{config.label}</h4>
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
        </div>
        <span className="text-sm font-medium">{Math.round(progress)}%</span>
      </div>
      
      <Progress 
        value={progress} 
        className={cn(
          phase === 'error' && 'bg-red-200'
        )}
      />
      
      {totalCandidates !== undefined && processedCount !== undefined && (
        <p className="text-xs text-muted-foreground text-right">
          {processedCount} of {totalCandidates} candidates processed
        </p>
      )}
    </div>
  )
}
