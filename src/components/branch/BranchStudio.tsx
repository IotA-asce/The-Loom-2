/**
 * Branch Studio
 * Create and manage story branches
 */

import { useState, useCallback } from 'react'
import { 
  GitBranch, Plus, Settings2, Eye, Download, 
  ChevronRight, RefreshCw, Check, X, LayoutGrid,
  TreePine, SlidersHorizontal, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface Branch {
  id: string
  name: string
  premise: string
  description: string
  anchorId: string
  parentBranchId?: string
  status: 'draft' | 'generating' | 'generated' | 'selected'
  preview?: string
  chapterCount: number
  wordCount: number
  similarity: number // 0-1, similarity to other branches
  settings: BranchSettings
}

export interface BranchSettings {
  creativity: number // 0-1
  style: 'faithful' | 'creative' | 'experimental'
  targetLength: 'short' | 'medium' | 'long'
  tone: 'dark' | 'neutral' | 'light'
}

// ============================================================================
// Branch Studio
// ============================================================================

interface BranchStudioProps {
  branches: Branch[]
  selectedBranchIds: string[]
  onBranchSelect: (branchId: string) => void
  onGenerate: (settings: BranchSettings) => void
  onRegenerate: (branchId: string, feedback: string) => void
  onSelectForContinuation: (branchId: string) => void
  onSettingsChange: (settings: BranchSettings) => void
  settings: BranchSettings
  isGenerating: boolean
  className?: string
}

export function BranchStudio({
  branches,
  selectedBranchIds,
  onBranchSelect,
  onGenerate,
  onRegenerate,
  onSelectForContinuation,
  onSettingsChange,
  settings,
  isGenerating,
  className,
}: BranchStudioProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid')
  const [showSettings, setShowSettings] = useState(false)
  const [feedbackBranchId, setFeedbackBranchId] = useState<string | null>(null)

  return (
    <div className={cn('flex h-full gap-6', className)}>
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Branch Studio
            </h2>
            
            {/* View Toggle */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  viewMode === 'grid' ? 'bg-background shadow-sm' : 'hover:bg-muted'
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('tree')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  viewMode === 'tree' ? 'bg-background shadow-sm' : 'hover:bg-muted'
                )}
              >
                <TreePine className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowSettings(!showSettings)}
              className={showSettings ? 'bg-accent' : ''}
            >
              <SlidersHorizontal className="h-4 w-4 mr-1" />
              Settings
            </Button>
            
            <Button 
              onClick={() => onGenerate(settings)}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1" />
                  Generate Branches
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <BranchSettingsPanel
            settings={settings}
            onChange={onSettingsChange}
            className="mb-4"
          />
        )}

        {/* Branch Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto">
            {branches.map(branch => (
              <BranchCard
                key={branch.id}
                branch={branch}
                isSelected={selectedBranchIds.includes(branch.id)}
                onSelect={() => onBranchSelect(branch.id)}
                onRegenerate={(feedback) => onRegenerate(branch.id, feedback)}
                onSelectForContinuation={() => onSelectForContinuation(branch.id)}
              />
            ))}
          </div>
        ) : (
          <BranchTreeView 
            branches={branches}
            selectedIds={selectedBranchIds}
            onSelect={onBranchSelect}
          />
        )}
      </div>

      {/* Selection Panel */}
      {selectedBranchIds.length > 0 && (
        <BranchSelectionPanel
          selectedBranches={branches.filter(b => selectedBranchIds.includes(b.id))}
          onClear={() => selectedBranchIds.forEach(id => onBranchSelect(id))}
          onContinue={(id) => onSelectForContinuation(id)}
        />
      )}
    </div>
  )
}

// ============================================================================
// Branch Card
// ============================================================================

interface BranchCardProps {
  branch: Branch
  isSelected: boolean
  onSelect: () => void
  onRegenerate: (feedback: string) => void
  onSelectForContinuation: () => void
}

function BranchCard({ 
  branch, 
  isSelected, 
  onSelect, 
  onRegenerate,
  onSelectForContinuation 
}: BranchCardProps) {
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState('')

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    generating: 'bg-blue-100 text-blue-700',
    generated: 'bg-green-100 text-green-700',
    selected: 'bg-primary text-primary-foreground',
  }

  return (
    <div 
      className={cn(
        'relative border rounded-xl p-4 transition-all',
        isSelected ? 'ring-2 ring-primary border-primary' : 'hover:shadow-md'
      )}
    >
      {/* Selection Indicator */}
      <button
        onClick={onSelect}
        className={cn(
          'absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
          isSelected 
            ? 'bg-primary border-primary text-primary-foreground' 
            : 'border-muted hover:border-primary'
        )}
      >
        {isSelected && <Check className="h-4 w-4" />}
      </button>

      {/* Status Badge */}
      <span className={cn('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-3', statusColors[branch.status])}>
        {branch.status}
      </span>

      {/* Title */}
      <h3 className="font-semibold mb-1 pr-8">{branch.name}</h3>

      {/* Premise */}
      <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
        {branch.premise}
      </p>

      {/* Preview */}
      {branch.preview && (
        <div className="bg-muted rounded-lg p-3 mb-3 text-sm line-clamp-4">
          {branch.preview}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <span>{branch.chapterCount} chapters</span>
        <span>{(branch.wordCount / 1000).toFixed(1)}k words</span>
        <span>{Math.round(branch.similarity * 100)}% similar</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {branch.status === 'generated' && (
          <>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFeedback(!showFeedback)}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Regenerate
            </Button>
            <Button 
              size="sm"
              onClick={onSelectForContinuation}
            >
              Continue
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </>
        )}
      </div>

      {/* Feedback Input */}
      {showFeedback && (
        <div className="mt-3 pt-3 border-t">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What would you like to change?"
            className="w-full h-20 px-3 py-2 border rounded-lg text-sm resize-none mb-2"
          />
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => setShowFeedback(false)}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => {
                onRegenerate(feedback)
                setShowFeedback(false)
                setFeedback('')
              }}
            >
              Submit
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Branch Settings Panel
// ============================================================================

interface BranchSettingsPanelProps {
  settings: BranchSettings
  onChange: (settings: BranchSettings) => void
  className?: string
}

function BranchSettingsPanel({ settings, onChange, className }: BranchSettingsPanelProps) {
  return (
    <div className={cn('bg-card border rounded-xl p-4', className)}>
      <h3 className="font-semibold mb-4">Generation Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Creativity */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Creativity: {Math.round(settings.creativity * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.creativity * 100}
            onChange={(e) => onChange({ ...settings, creativity: parseInt(e.target.value) / 100 })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Faithful</span>
            <span>Creative</span>
          </div>
        </div>

        {/* Style */}
        <div>
          <label className="block text-sm font-medium mb-2">Style</label>
          <select
            value={settings.style}
            onChange={(e) => onChange({ ...settings, style: e.target.value as BranchSettings['style'] })}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="faithful">Faithful to Original</option>
            <option value="creative">Creative Interpretation</option>
            <option value="experimental">Experimental</option>
          </select>
        </div>

        {/* Length */}
        <div>
          <label className="block text-sm font-medium mb-2">Target Length</label>
          <select
            value={settings.targetLength}
            onChange={(e) => onChange({ ...settings, targetLength: e.target.value as BranchSettings['targetLength'] })}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="short">Short (~1,500 words)</option>
            <option value="medium">Medium (~3,000 words)</option>
            <option value="long">Long (~5,000 words)</option>
          </select>
        </div>

        {/* Tone */}
        <div>
          <label className="block text-sm font-medium mb-2">Tone</label>
          <select
            value={settings.tone}
            onChange={(e) => onChange({ ...settings, tone: e.target.value as BranchSettings['tone'] })}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="light">Light</option>
            <option value="neutral">Neutral</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Branch Tree View
// ============================================================================

interface BranchTreeViewProps {
  branches: Branch[]
  selectedIds: string[]
  onSelect: (id: string) => void
}

function BranchTreeView({ branches, selectedIds, onSelect }: BranchTreeViewProps) {
  // Group by parent
  const roots = branches.filter(b => !b.parentBranchId)
  
  const renderBranch = (branch: Branch, depth = 0) => {
    const children = branches.filter(b => b.parentBranchId === branch.id)
    
    return (
      <div key={branch.id} style={{ marginLeft: depth * 24 }}>
        <button
          onClick={() => onSelect(branch.id)}
          className={cn(
            'w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors',
            selectedIds.includes(branch.id) 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-muted'
          )}
        >
          <GitBranch className="h-4 w-4" />
          <span className="flex-1 truncate">{branch.name}</span>
          <span className="text-xs opacity-70">{branch.chapterCount}ch</span>
        </button>
        
        {children.map(child => renderBranch(child, depth + 1))}
      </div>
    )
  }

  return (
    <div className="space-y-1 overflow-auto">
      {roots.map(branch => renderBranch(branch))}
    </div>
  )
}

// ============================================================================
// Branch Selection Panel
// ============================================================================

interface BranchSelectionPanelProps {
  selectedBranches: Branch[]
  onClear: () => void
  onContinue: (branchId: string) => void
}

function BranchSelectionPanel({ selectedBranches, onClear, onContinue }: BranchSelectionPanelProps) {
  if (selectedBranches.length === 0) return null

  return (
    <div className="w-72 flex-shrink-0 border-l bg-card p-4 overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">
          {selectedBranches.length} Selected
        </h3>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>

      <div className="space-y-2 mb-4">
        {selectedBranches.map(branch => (
          <div key={branch.id} className="p-3 bg-muted rounded-lg">
            <p className="font-medium text-sm">{branch.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {branch.premise}
            </p>
            <Button 
              size="sm" 
              className="w-full mt-2"
              onClick={() => onContinue(branch.id)}
            >
              Continue with This
            </Button>
          </div>
        ))}
      </div>

      {selectedBranches.length > 1 && (
        <Button className="w-full" onClick={() => onContinue(selectedBranches[0].id)}>
          Compare Selected
        </Button>
      )}
    </div>
  )
}

// ============================================================================
// Premise Editor
// ============================================================================

interface PremiseEditorProps {
  premise: string
  onChange: (premise: string) => void
  validation?: {
    isValid: boolean
    message?: string
  }
  className?: string
}

export function PremiseEditor({ premise, onChange, validation, className }: PremiseEditorProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium">Branch Premise</label>
      <textarea
        value={premise}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe what happens differently in this branch..."
        className={cn(
          'w-full h-32 px-3 py-2 border rounded-lg resize-none',
          validation?.isValid === false && 'border-red-500'
        )}
      />
      {validation?.message && (
        <p className={cn('text-sm', validation.isValid ? 'text-green-600' : 'text-red-600')}>
          {validation.message}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {premise.length} characters • Min 50, Max 500
      </p>
    </div>
  )
}
