/**
 * ManualAnchorForm Component
 * 
 * Form for manually creating/editing anchor events
 */

import { useState } from 'react'
import type { AnchorEvent, AlternativeOutcome } from '@/lib/db/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ManualAnchorFormProps {
  initialData?: Partial<AnchorEvent>
  availableCharacters: string[]
  totalPages: number
  onSubmit: (data: ManualAnchorData) => void
  onCancel: () => void
}

export interface ManualAnchorData {
  title: string
  description: string
  type: AnchorEvent['type']
  significance: AnchorEvent['significance']
  pageNumber: number
  characters: string[]
  alternatives: AlternativeOutcomeInput[]
}

interface AlternativeOutcomeInput {
  description: string
  consequences: string[]
  affectedCharacters: string[]
}

const anchorTypes: AnchorEvent['type'][] = [
  'decision', 'coincidence', 'revelation', 'betrayal', 
  'sacrifice', 'encounter', 'conflict', 'transformation', 'mystery'
]

const significanceLevels: AnchorEvent['significance'][] = [
  'minor', 'moderate', 'major', 'critical'
]

export function ManualAnchorForm({
  initialData,
  availableCharacters,
  totalPages,
  onSubmit,
  onCancel,
}: ManualAnchorFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [type, setType] = useState<AnchorEvent['type']>(initialData?.type || 'decision')
  const [significance, setSignificance] = useState<AnchorEvent['significance']>(
    initialData?.significance || 'moderate'
  )
  const [pageNumber, setPageNumber] = useState(initialData?.pageNumber || 1)
  const [characters, setCharacters] = useState<string[]>(initialData?.characters || [])
  const [alternatives, setAlternatives] = useState<AlternativeOutcomeInput[]>(
    initialData?.alternatives?.map(a => ({
      description: a.description,
      consequences: a.consequences,
      affectedCharacters: a.affectedCharacters,
    })) || [{ description: '', consequences: [''], affectedCharacters: [] }]
  )
  
  const isValid = title && description && alternatives.some(a => a.description)
  
  const handleSubmit = () => {
    if (!isValid) return
    
    onSubmit({
      title,
      description,
      type,
      significance,
      pageNumber,
      characters,
      alternatives: alternatives.filter(a => a.description),
    })
  }
  
  const addAlternative = () => {
    setAlternatives([...alternatives, { description: '', consequences: [''], affectedCharacters: [] }])
  }
  
  const removeAlternative = (idx: number) => {
    setAlternatives(alternatives.filter((_, i) => i !== idx))
  }
  
  const updateAlternative = (idx: number, updates: Partial<AlternativeOutcomeInput>) => {
    setAlternatives(alternatives.map((a, i) => i === idx ? { ...a, ...updates } : a))
  }
  
  const addConsequence = (altIdx: number) => {
    const alt = alternatives[altIdx]
    updateAlternative(altIdx, { consequences: [...alt.consequences, ''] })
  }
  
  const updateConsequence = (altIdx: number, consIdx: number, value: string) => {
    const alt = alternatives[altIdx]
    updateAlternative(altIdx, {
      consequences: alt.consequences.map((c, i) => i === consIdx ? value : c)
    })
  }
  
  const removeConsequence = (altIdx: number, consIdx: number) => {
    const alt = alternatives[altIdx]
    updateAlternative(altIdx, {
      consequences: alt.consequences.filter((_, i) => i !== consIdx)
    })
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Anchor event title"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="page">Page Number</Label>
          <Input
            id="page"
            type="number"
            min={1}
            max={totalPages}
            value={pageNumber}
            onChange={(e) => setPageNumber(parseInt(e.target.value) || 1)}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what happens at this anchor point..."
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as AnchorEvent['type'])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anchorTypes.map(t => (
                <SelectItem key={t} value={t} className="capitalize">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Significance</Label>
          <Select value={significance} onValueChange={(v) => setSignificance(v as AnchorEvent['significance'])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {significanceLevels.map(s => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Characters Involved</Label>
        <div className="flex flex-wrap gap-2">
          {availableCharacters.map(char => (
            <button
              key={char}
              type="button"
              onClick={() => {
                setCharacters(chars => 
                  chars.includes(char) 
                    ? chars.filter(c => c !== char)
                    : [...chars, char]
                )
              }}
              className={cn(
                'px-3 py-1 rounded-full text-sm transition-colors',
                characters.includes(char)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {char}
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Alternative Outcomes</Label>
          <Button type="button" size="sm" variant="outline" onClick={addAlternative}>
            <Plus className="w-4 h-4 mr-2" />
            Add Alternative
          </Button>
        </div>
        
        {alternatives.map((alt, altIdx) => (
          <Card key={altIdx}>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Alternative {altIdx + 1}
                </CardTitle>
                {alternatives.length > 1 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeAlternative(altIdx)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={alt.description}
                  onChange={(e) => updateAlternative(altIdx, { description: e.target.value })}
                  placeholder="What could happen instead..."
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Consequences</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => addConsequence(altIdx)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
                {alt.consequences.map((cons, consIdx) => (
                  <div key={consIdx} className="flex gap-2">
                    <Input
                      value={cons}
                      onChange={(e) => updateConsequence(altIdx, consIdx, e.target.value)}
                      placeholder={`Consequence ${consIdx + 1}`}
                      className="flex-1"
                    />
                    {alt.consequences.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeConsequence(altIdx, consIdx)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              <div>
                <Label className="text-xs">Affected Characters</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {availableCharacters.map(char => (
                    <button
                      key={char}
                      type="button"
                      onClick={() => {
                        updateAlternative(altIdx, {
                          affectedCharacters: alt.affectedCharacters.includes(char)
                            ? alt.affectedCharacters.filter(c => c !== char)
                            : [...alt.affectedCharacters, char]
                        })
                      }}
                      className={cn(
                        'px-2 py-0.5 rounded text-xs transition-colors',
                        alt.affectedCharacters.includes(char)
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted'
                      )}
                    >
                      {char}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid}>
          {initialData?.id ? 'Update' : 'Create'} Anchor
        </Button>
      </div>
    </div>
  )
}
