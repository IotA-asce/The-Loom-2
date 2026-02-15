/**
 * Onboarding Flow
 * Multi-step wizard for first-time users
 */

import { useState, useCallback } from 'react'
import { 
  BookOpen, Upload, Sparkles, GitBranch, 
  ChevronRight, ChevronLeft, Check, X,
  Key, HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  component: React.ReactNode
}

export interface OnboardingProps {
  steps: OnboardingStep[]
  onComplete: () => void
  onSkip: () => void
  className?: string
}

// ============================================================================
// Onboarding Flow
// ============================================================================

export function OnboardingFlow({ steps, onComplete, onSkip, className }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [isExiting, setIsExiting] = useState(false)

  const progress = ((currentStep + 1) / steps.length) * 100
  const step = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  const handleNext = useCallback(() => {
    setCompletedSteps(prev => new Set([...prev, step.id]))
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }, [isLastStep, onComplete, step.id])

  const handlePrevious = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1)
    }
  }, [isFirstStep])

  const handleSkip = useCallback(() => {
    setIsExiting(true)
    setTimeout(onSkip, 300)
  }, [onSkip])

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm',
      isExiting && 'opacity-0 transition-opacity duration-300',
      className
    )}>
      <div className="w-full max-w-4xl mx-4 bg-card rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Welcome to The Loom</span>
          </div>
          
          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tour
          </button>
        </div>

        {/* Progress */}
        <div className="h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8 min-h-[400px]">
          <div className="max-w-2xl mx-auto">
            {/* Step Icon */}
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <div className="text-3xl">{step.icon}</div>
            </div>

            {/* Step Title */}
            <h2 className="text-2xl font-bold text-center mb-3">{step.title}</h2>
            
            {/* Step Description */}
            <p className="text-muted-foreground text-center mb-8">
              {step.description}
            </p>

            {/* Step Component */}
            <div className="mb-8">
              {step.component}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
          <div className="flex items-center gap-2">
            {steps.map((s, index) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-colors',
                  index === currentStep ? 'bg-primary' :
                  completedSteps.has(s.id) ? 'bg-primary/50' : 'bg-muted'
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {!isFirstStep && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button onClick={handleNext}>
              {isLastStep ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Get Started
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Preset Onboarding Steps
// ============================================================================

export function getDefaultOnboardingSteps(): OnboardingStep[] {
  return [
    {
      id: 'welcome',
      title: 'Welcome to The Loom',
      description: 'Your personal manga branching and story generation platform. Let\'s get you set up.',
      icon: '🎉',
      component: (
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            The Loom helps you:
          </p>
          <ul className="space-y-2 text-left max-w-sm mx-auto">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Import and analyze manga
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Create branching storylines
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Generate new chapters with AI
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'api-setup',
      title: 'Configure AI Provider',
      description: 'Add your API key to start generating stories. Your key is stored securely.',
      icon: <Key className="h-6 w-6 text-primary" />,
      component: <APISetupForm />,
    },
    {
      id: 'library',
      title: 'Your Library',
      description: 'Upload your first manga to get started. We support CBZ, CBR, PDF, and image files.',
      icon: <Upload className="h-6 w-6 text-primary" />,
      component: <UploadDemo />,
    },
    {
      id: 'analysis',
      title: 'AI Analysis',
      description: 'Our AI will analyze characters, timeline, themes, and relationships.',
      icon: <Sparkles className="h-6 w-6 text-primary" />,
      component: <AnalysisDemo />,
    },
    {
      id: 'branching',
      title: 'Create Branches',
      description: 'Explore "what if" scenarios and generate new story continuations.',
      icon: <GitBranch className="h-6 w-6 text-primary" />,
      component: <BranchingDemo />,
    },
  ]
}

// ============================================================================
// Step Components
// ============================================================================

function APISetupForm() {
  const [provider, setProvider] = useState('openai')
  const [apiKey, setApiKey] = useState('')

  return (
    <div className="space-y-4 max-w-sm mx-auto">
      <select
        value={provider}
        onChange={(e) => setProvider(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg"
      >
        <option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic</option>
        <option value="google">Google AI</option>
      </select>
      
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Enter your API key"
        className="w-full px-3 py-2 border rounded-lg"
      />
      
      <p className="text-xs text-muted-foreground">
        Your API key is encrypted and stored locally. It never leaves your device.
      </p>
    </div>
  )
}

function UploadDemo() {
  return (
    <div className="border-2 border-dashed border-muted rounded-xl p-8 text-center">
      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground">
        Drag and drop files here or click to browse
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        Supports CBZ, CBR, PDF, JPG, PNG
      </p>
    </div>
  )
}

function AnalysisDemo() {
  const steps = ['Upload', 'Analyze', 'Review']
  
  return (
    <div className="flex items-center justify-center gap-4">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-4">
          <div className="text-center">
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center mb-2',
              index <= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}>
              {index === 0 && <Check className="h-5 w-5" />}
              {index === 1 && <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
              {index === 2 && <span className="text-lg">3</span>}
            </div>
            <span className="text-sm">{step}</span>
          </div>
          {index < steps.length - 1 && (
            <div className="w-8 h-0.5 bg-muted" />
          )}
        </div>
      ))}
    </div>
  )
}

function BranchingDemo() {
  return (
    <div className="flex justify-center gap-4">
      <div className="w-32 p-3 border rounded-lg text-center">
        <div className="w-8 h-8 bg-primary/10 rounded-full mx-auto mb-2 flex items-center justify-center">
          <BookOpen className="h-4 w-4" />
        </div>
        <p className="text-sm font-medium">Original</p>
      </div>
      <div className="flex items-center">
        <GitBranch className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="flex gap-2">
        <div className="w-24 p-3 border rounded-lg text-center bg-primary/5">
          <p className="text-sm">Branch A</p>
        </div>
        <div className="w-24 p-3 border rounded-lg text-center">
          <p className="text-sm">Branch B</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Tutorial Overlay
// ============================================================================

interface TutorialOverlayProps {
  target: string
  title: string
  description: string
  onNext: () => void
  onSkip: () => void
  stepNumber: number
  totalSteps: number
}

export function TutorialOverlay({ 
  target, 
  title, 
  description, 
  onNext, 
  onSkip,
  stepNumber,
  totalSteps 
}: TutorialOverlayProps) {
  return (
    <div className="fixed inset-0 z-50">
      {/* Spotlight */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Tooltip */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border rounded-xl p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onSkip} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <p className="text-muted-foreground mb-4">{description}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {stepNumber} of {totalSteps}
          </span>
          <Button size="sm" onClick={onNext}>
            {stepNumber === totalSteps ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}
