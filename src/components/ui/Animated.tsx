/**
 * Animated Component Wrapper
 * Apple-style animation components
 */

import { cn } from '@/lib/utils'

type AnimationType = 
  | 'fade-in' 
  | 'fade-out' 
  | 'slide-in-right' 
  | 'slide-in-left' 
  | 'slide-in-bottom'
  | 'scale-in'
  | 'scale-out'

interface AnimatedProps {
  children: React.ReactNode
  className?: string
  animation?: AnimationType
  delay?: number
  duration?: 200 | 300 | 400
}

const animationClasses: Record<AnimationType, string> = {
  'fade-in': 'animate-fade-in',
  'fade-out': 'animate-fade-out',
  'slide-in-right': 'animate-slide-in-right',
  'slide-in-left': 'animate-slide-in-left',
  'slide-in-bottom': 'animate-slide-in-bottom',
  'scale-in': 'animate-scale-in',
  'scale-out': 'animate-scale-out',
}

export function Animated({ 
  children, 
  className,
  animation = 'fade-in',
  delay = 0,
  duration = 300
}: AnimatedProps) {
  return (
    <div 
      className={cn(animationClasses[animation], className)}
      style={{ 
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  )
}

interface StaggerContainerProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}

export function StaggerContainer({ 
  children, 
  className,
  staggerDelay = 50
}: StaggerContainerProps) {
  return (
    <div 
      className={cn('stagger-children', className)}
      style={{ '--stagger-delay': `${staggerDelay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

interface HoverLiftProps {
  children: React.ReactNode
  className?: string
}

export function HoverLift({ children, className }: HoverLiftProps) {
  return (
    <div className={cn('hover-lift', className)}>
      {children}
    </div>
  )
}
