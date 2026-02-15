/**
 * PremiseEditor Component
 * 
 * Edit branch premise details
 */

import { useState } from 'react'
import type { BranchPremise } from '@/lib/branches/premise/transformer'
import { Button, Input, Textarea, Label, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui'
import { Plus, X, Sparkles } from 'lucide-react'
import type { ChangeEvent, MouseEvent } from 'react'

interface PremiseEditorProps {
  premise: BranchPremise
  onSave: (premise: BranchPremise) => void
  onCancel?: () => void
}

export function PremiseEditor({ premise, onSave, onCancel }: PremiseEditorProps) {
  const [title, setTitle] = useState(premise.title)
  const [subtitle, setSubtitle] = useState(premise.subtitle || '')
  const [hook, setHook] = useState(premise.hook)
  const [whatIf, setWhatIf] = useState(premise.whatIf)
  const [description, setDescription] = useState(premise.description)
  const [themes, setThemes] = useState<string[]>(premise.themes)
  const [newTheme, setNewTheme] = useState('')
  const [consequences, setConsequences] = useState<string[]>(premise.immediateConsequences)
  const [newConsequence, setNewConsequence] = useState('')
  
  const isValid = title && hook && whatIf && description
  
  const handleSave = () => {
    if (!isValid) return
    
    onSave({
      ...premise,
      title,
      subtitle: subtitle || undefined,
      hook,
      whatIf,
      description,
      themes,
      immediateConsequences: consequences,
    })
  }
  
  const addTheme = () => {
    if (newTheme && !themes.includes(newTheme)) {
      setThemes([...themes, newTheme])
      setNewTheme('')
    }
  }
  
  const removeTheme = (theme: string) => {
    setThemes(themes.filter(t => t !== theme))
  }
  
  const addConsequence = () => {
    if (newConsequence) {
      setConsequences([...consequences, newConsequence])
      setNewConsequence('')
    }
  }
  
  const removeConsequence = (idx: number) => {
    setConsequences(consequences.filter((_, i) => i !== idx))
  }
  
  const generateSuggestion = (field: 'title' | 'hook' | 'whatIf') => {
    const suggestions: Record<typeof field, string[]> = {
      title: [
        'The Road Not Taken',
        'What Could Have Been',
        'Another Path',
        'The Divergence',
      ],
      hook: [
        'When everything changes in a single moment...',
        'What if the impossible became possible?',
        'Sometimes one choice changes everything...',
      ],
      whatIf: [
        'What if things had gone differently?',
        'What if they made another choice?',
        'What if fate took another turn?',
      ],
    }
    
    const options = suggestions[field]
    const suggestion = options[Math.floor(Math.random() * options.length)]
    
    switch (field) {
      case 'title': setTitle(suggestion); break
      case 'hook': setHook(suggestion); break
      case 'whatIf': setWhatIf(suggestion); break
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="title">Title</Label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => generateSuggestion('title')}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Suggest
          </Button>
        </div>
        <Input
          id="title"
          value={title}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          placeholder="Branch title"
        />
      </div>
      
      {/* Subtitle */}
      <div className="space-y-2">
        <Label htmlFor="subtitle">Subtitle (optional)</Label>
        <Input
          id="subtitle"
          value={subtitle}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSubtitle(e.target.value)}
          placeholder="Descriptive subtitle"
        />
      </div>
      
      {/* Hook */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="hook">Hook</Label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => generateSuggestion('hook')}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Suggest
          </Button>
        </div>
        <Textarea
          id="hook"
          value={hook}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setHook(e.target.value)}
          placeholder="Compelling one-sentence hook"
          rows={2}
        />
      </div>
      
      {/* What If */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="whatIf">What If</Label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => generateSuggestion('whatIf')}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Suggest
          </Button>
        </div>
        <Textarea
          id="whatIf"
          value={whatIf}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setWhatIf(e.target.value)}
          placeholder="What if scenario"
          rows={2}
        />
      </div>
      
      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          placeholder="Detailed description of the branch premise"
          rows={4}
        />
      </div>
      
      {/* Themes */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Themes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {themes.map(theme => (
              <Badge key={theme} variant="secondary" className="flex items-center gap-1">
                {theme}
                <button
                  onClick={(e: MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault()
                    removeTheme(theme)
                  }}
                  className="hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTheme}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewTheme(e.target.value)}
              placeholder="Add theme..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTheme())}
            />
            <Button type="button" size="sm" onClick={addTheme}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Consequences */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Immediate Consequences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {consequences.map((consequence, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="flex-1 text-sm p-2 bg-muted rounded">{consequence}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={(e: MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault()
                    removeConsequence(idx)
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newConsequence}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewConsequence(e.target.value)}
              placeholder="Add consequence..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addConsequence())}
            />
            <Button type="button" size="sm" onClick={addConsequence}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={!isValid}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}
