/**
 * System Status
 * Shows application health and status
 */

import { useState, useEffect } from 'react'
import { 
  Activity, CheckCircle, AlertTriangle, XCircle,
  Wifi, WifiOff, Database, Cpu, HardDrive
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export type ServiceStatus = 'operational' | 'degraded' | 'down' | 'unknown'

export interface Service {
  id: string
  name: string
  status: ServiceStatus
  latency?: number
  lastChecked: Date
}

export interface SystemStatusProps {
  services?: Service[]
  className?: string
}

export interface StatusIndicatorProps {
  status: ServiceStatus
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

// ============================================================================
// Status Indicator
// ============================================================================

export function StatusIndicator({ status, showLabel, size = 'md' }: StatusIndicatorProps) {
  const config = {
    operational: { color: 'bg-green-500', icon: CheckCircle, label: 'Operational' },
    degraded: { color: 'bg-yellow-500', icon: AlertTriangle, label: 'Degraded' },
    down: { color: 'bg-red-500', icon: XCircle, label: 'Down' },
    unknown: { color: 'bg-gray-400', icon: Activity, label: 'Unknown' },
  }

  const { color, icon: Icon, label } = config[status]

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }

  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        'rounded-full animate-pulse',
        sizeClasses[size],
        color
      )} />
      {showLabel && (
        <span className="text-sm">{label}</span>
      )}
    </div>
  )
}

// ============================================================================
// System Status Component
// ============================================================================

export function SystemStatus({ services: initialServices, className }: SystemStatusProps) {
  const [services, setServices] = useState<Service[]>(initialServices || defaultServices)
  const [isChecking, setIsChecking] = useState(false)

  const checkServices = async () => {
    setIsChecking(true)
    
    const updatedServices = await Promise.all(
      services.map(async (service) => {
        const start = performance.now()
        const status = await checkService(service.id)
        const latency = Math.round(performance.now() - start)
        
        return {
          ...service,
          status,
          latency,
          lastChecked: new Date(),
        }
      })
    )
    
    setServices(updatedServices)
    setIsChecking(false)
  }

  useEffect(() => {
    checkServices()
    const interval = setInterval(checkServices, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [])

  const overallStatus = getOverallStatus(services)

  return (
    <div className={cn('bg-card border rounded-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">System Status</span>
        </div>
        <StatusIndicator status={overallStatus} showLabel size="sm" />
      </div>

      {/* Services List */}
      <div className="divide-y">
        {services.map(service => (
          <div key={service.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {getServiceIcon(service.id)}
              <div>
                <p className="text-sm font-medium">{service.name}</p>
                {service.latency !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    {service.latency}ms
                  </p>
                )}
              </div>
            </div>
            <StatusIndicator status={service.status} showLabel size="sm" />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-muted/50 text-xs text-muted-foreground">
        Last checked: {services[0]?.lastChecked.toLocaleTimeString()}
      </div>
    </div>
  )
}

// ============================================================================
// Compact Status Badge
// ============================================================================

interface StatusBadgeProps {
  status: ServiceStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = {
    operational: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    degraded: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
    down: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  }

  const labels = {
    operational: 'Online',
    degraded: 'Issues',
    down: 'Offline',
    unknown: 'Unknown',
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
      styles[status],
      className
    )}>
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        status === 'operational' && 'bg-green-500',
        status === 'degraded' && 'bg-yellow-500',
        status === 'down' && 'bg-red-500',
        status === 'unknown' && 'bg-gray-400',
      )} />
      {labels[status]}
    </span>
  )
}

// ============================================================================
// Network Status
// ============================================================================

export function NetworkStatus({ className }: { className?: string }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-sm">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-500" />
          <span className="text-sm">Offline</span>
        </>
      )}
    </div>
  )
}

// ============================================================================
// Storage Status
// ============================================================================

export function StorageStatus({ className }: { className?: string }) {
  const [usage, setUsage] = useState<{ used: number; total: number } | null>(null)

  useEffect(() => {
    const checkStorage = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        setUsage({
          used: estimate.usage || 0,
          total: estimate.quota || 0,
        })
      }
    }

    checkStorage()
  }, [])

  if (!usage) return null

  const percentUsed = Math.round((usage.used / usage.total) * 100)

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <HardDrive className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span>Storage</span>
          <span>{percentUsed}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full transition-all',
              percentUsed > 90 ? 'bg-red-500' : percentUsed > 70 ? 'bg-yellow-500' : 'bg-green-500'
            )}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Helper Functions
// ============================================================================

const defaultServices: Service[] = [
  { id: 'api', name: 'API', status: 'unknown', lastChecked: new Date() },
  { id: 'db', name: 'Database', status: 'unknown', lastChecked: new Date() },
  { id: 'storage', name: 'Storage', status: 'unknown', lastChecked: new Date() },
]

async function checkService(id: string): Promise<ServiceStatus> {
  // Simulate health check - in real app, make actual API calls
  await new Promise(r => setTimeout(r, 100 + Math.random() * 200))
  
  // Random status for demo
  const rand = Math.random()
  if (rand > 0.9) return 'down'
  if (rand > 0.8) return 'degraded'
  return 'operational'
}

function getOverallStatus(services: Service[]): ServiceStatus {
  if (services.every(s => s.status === 'operational')) return 'operational'
  if (services.some(s => s.status === 'down')) return 'down'
  if (services.some(s => s.status === 'degraded')) return 'degraded'
  return 'unknown'
}

function getServiceIcon(id: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    api: <Wifi className="h-4 w-4 text-muted-foreground" />,
    db: <Database className="h-4 w-4 text-muted-foreground" />,
    storage: <HardDrive className="h-4 w-4 text-muted-foreground" />,
    ai: <Cpu className="h-4 w-4 text-muted-foreground" />,
  }
  return icons[id] || <Activity className="h-4 w-4 text-muted-foreground" />
}
