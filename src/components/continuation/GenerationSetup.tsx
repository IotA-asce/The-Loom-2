/**
 * GenerationSetup component
 * Configure chapter generation parameters
 */

import { useState, useCallback } from 'react'
import { Play, Settings2, BookOpen, Users, Clock, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui'

interface GenerationSetupProps {
  chapterNumber: number
  previousChapterTitle?: string
  availableCharacters: Array<{ id: string; name: string }>
  onGenerate: (config: GenerationConfig) => void
  onCancel: () => void
}

export interface GenerationConfig {
  chapterType: 'continuation' | 'flashback' | 'transition'
  focusCharacters: string[]
  targetLength: 'short' | 'medium' | 'long'
  tone: 'light' | 'neutral' | 'dark' | 'intense'
  cliffhangerType: 'none' | 'revelation' | 'danger' | 'emotional' | 'mystery'
  descriptionLevel: 'minimal' | 'moderate' | 'rich'
  dialogueRatio: number // 0-1
}

export function GenerationSetup({
  chapterNumber,
  previousChapterTitle,
  availableCharacters,
  onGenerate,
  onCancel,
}: GenerationSetupProps) {
  const [config, setConfig] = useState<GenerationConfig>({
    chapterType: 'continuation',
    focusCharacters: [],
    targetLength: 'medium',
    tone: 'neutral',
    cliffhangerType: 'revelation',
    descriptionLevel: 'moderate',
    dialogueRatio: 0.5,
  })
  const [activeSection, setActiveSection] = useState<'basic' | 'advanced'>('basic')

  const updateConfig = useCallback(<K extends keyof GenerationConfig>(
    key: K,
    value: GenerationConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }, [])

  const toggleCharacter = useCallback((charId: string) => {
    setConfig(prev => ({
      ...prev,
      focusCharacters: prev.focusCharacters.includes(charId)
        ? prev.focusCharacters.filter(id => id !== charId)
        : [...prev.focusCharacters, charId],
    }))
  }, [])

  const handleGenerate = useCallback(() => {
    onGenerate(config)
  }, [config, onGenerate])

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">Generate Chapter {chapterNumber}</h2>
        {previousChapterTitle && (
          <p className="text-sm text-muted-foreground">
            Following: {previousChapterTitle}
          </p>
        )}
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b">
        <Button
          variant={activeSection === 'basic' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setActiveSection('basic')}
          className="flex items-center gap-2"
        >
          <BookOpen className="h-4 w-4" />
          Basic
        </Button>
        <Button
          variant={activeSection === 'advanced' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setActiveSection('advanced')}
          className="flex items-center gap-2"
        >
          <Settings2 className="h-4 w-4" />
          Advanced
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {activeSection === 'basic' ? (
            <>
              {/* Chapter Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Chapter Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['continuation', 'flashback', 'transition'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => updateConfig('chapterType', type)}
                      className={`
                        px-3 py-2 text-sm rounded-md border transition-colors
                        ${config.chapterType === type 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-background hover:bg-muted'}
                      `}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Focus Characters */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Focus Characters
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableCharacters.map(char => (
                    <button
                      key={char.id}
                      onClick={() => toggleCharacter(char.id)}
                      className={`
                        px-3 py-1 text-sm rounded-full border transition-colors
                        ${config.focusCharacters.includes(char.id)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted'}
                      `}
                    >
                      {char.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Length */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Target Length
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['short', 'medium', 'long'] as const).map(length => (
                    <button
                      key={length}
                      onClick={() => updateConfig('targetLength', length)}
                      className={`
                        px-3 py-2 text-sm rounded-md border transition-colors
                        ${config.targetLength === length 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-background hover:bg-muted'}
                      `}
                    >
                      {length.charAt(0).toUpperCase() + length.slice(1)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Short: ~1,500 words | Medium: ~3,000 words | Long: ~5,000 words
                </p>
              </div>

              {/* Tone */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tone</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['light', 'neutral', 'dark', 'intense'] as const).map(tone => (
                    <button
                      key={tone}
                      onClick={() => updateConfig('tone', tone)}
                      className={`
                        px-3 py-2 text-sm rounded-md border transition-colors
                        ${config.tone === tone 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-background hover:bg-muted'}
                      `}
                    >
                      {tone.charAt(0).toUpperCase() + tone.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Cliffhanger Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Cliffhanger Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['none', 'revelation', 'danger', 'emotional', 'mystery'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => updateConfig('cliffhangerType', type)}
                      className={`
                        px-3 py-2 text-sm rounded-md border transition-colors
                        ${config.cliffhangerType === type 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-background hover:bg-muted'}
                      `}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['minimal', 'moderate', 'rich'] as const).map(level => (
                    <button
                      key={level}
                      onClick={() => updateConfig('descriptionLevel', level)}
                      className={`
                        px-3 py-2 text-sm rounded-md border transition-colors
                        ${config.descriptionLevel === level 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-background hover:bg-muted'}
                      `}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dialogue Ratio */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Dialogue-to-Narration Ratio</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.dialogueRatio * 100}
                  onChange={(e) => updateConfig('dialogueRatio', parseInt(e.target.value) / 100)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>More Narration</span>
                  <span>Balanced</span>
                  <span>More Dialogue</span>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  {(config.dialogueRatio * 100).toFixed(0)}% Dialogue
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        
        <div className="flex items-center gap-2">
          {activeSection === 'basic' ? (
            <Button variant="outline" onClick={() => setActiveSection('advanced')}>
              Advanced Settings
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : null}
          
          <Button onClick={handleGenerate} className="bg-primary">
            <Play className="h-4 w-4 mr-1" />
            Generate Chapter
          </Button>
        </div>
      </div>
    </div>
  )
}
