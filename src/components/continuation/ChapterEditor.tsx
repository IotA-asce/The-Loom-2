/**
 * ChapterEditor component
 * Multi-level refinement editor with AI assistance
 */

import { useState, useCallback, useRef } from 'react'
import { 
  Save, RotateCcw, Wand2, MessageSquare, 
  Scissors, Layers, Maximize2, Minimize2 
} from 'lucide-react'
import { Button } from '@/components/ui'
import type { RefinementScope } from '@/lib/continuation/refiner'

type AIAssistType = 
  | 'suggest-improvements'
  | 'fix-continuity'
  | 'enhance-dialogue'
  | 'improve-pacing'
  | 'fix-grammar'
  | 'match-tone'
  | 'expand-contract'

interface ChapterEditorProps {
  chapterId: string
  initialContent: string
  onSave: (content: string) => void
  onCancel: () => void
}

export function ChapterEditor({
  initialContent,
  onSave,
  onCancel,
}: ChapterEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [selectedScope, setSelectedScope] = useState<RefinementScope>('paragraph')
  const [showAIAssist, setShowAIAssist] = useState(false)
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null)
  const [history, setHistory] = useState<string[]>([initialContent])
  const [historyIndex, setHistoryIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
  }, [])

  const handleSave = useCallback(() => {
    onSave(content)
  }, [content, onSave])

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setContent(history[newIndex])
    }
  }, [history, historyIndex])

  const handleSelectionChange = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      setSelection({
        start: textarea.selectionStart,
        end: textarea.selectionEnd,
      })
    }
  }, [])

  const applyAIAssist = useCallback((type: AIAssistType) => {
    // In production, this would call the AI service
    console.log('Applying AI assist:', type, 'on selection:', selection)
    setShowAIAssist(false)
  }, [selection])

  const scopeOptions: { value: RefinementScope; label: string; icon: React.ReactNode }[] = [
    { value: 'sentence', label: 'Sentence', icon: <Minimize2 className="h-3 w-3" /> },
    { value: 'paragraph', label: 'Paragraph', icon: <Scissors className="h-3 w-3" /> },
    { value: 'scene', label: 'Scene', icon: <Layers className="h-3 w-3" /> },
    { value: 'chapter', label: 'Chapter', icon: <Maximize2 className="h-3 w-3" /> },
  ]

  const aiAssistOptions: { value: AIAssistType; label: string }[] = [
    { value: 'suggest-improvements', label: 'Suggest Improvements' },
    { value: 'fix-continuity', label: 'Fix Continuity' },
    { value: 'enhance-dialogue', label: 'Enhance Dialogue' },
    { value: 'improve-pacing', label: 'Improve Pacing' },
    { value: 'fix-grammar', label: 'Fix Grammar' },
    { value: 'match-tone', label: 'Match Tone' },
    { value: 'expand-contract', label: 'Expand/Contract' },
  ]

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  const charCount = content.length

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-4">
          {/* Scope Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Scope:</span>
            <div className="flex gap-1">
              {scopeOptions.map((scope) => (
                <Button
                  key={scope.value}
                  variant={selectedScope === scope.value ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedScope(scope.value)}
                  className="text-xs flex items-center gap-1"
                >
                  {scope.icon}
                  {scope.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Undo
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAIAssist(!showAIAssist)}
            className={showAIAssist ? 'bg-accent' : ''}
          >
            <Wand2 className="h-4 w-4 mr-1" />
            AI Assist
          </Button>

          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      {/* AI Assist Panel */}
      {showAIAssist && (
        <div className="px-4 py-3 border-b bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              AI Assistance
            </span>
            {selection && (
              <span className="text-xs text-muted-foreground">
                Selected: {selection.end - selection.start} chars
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {aiAssistOptions.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                size="sm"
                onClick={() => applyAIAssist(option.value)}
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Editor Area */}
      <div className="flex-1 flex">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onSelect={handleSelectionChange}
          className="flex-1 p-4 resize-none outline-none font-mono text-sm leading-relaxed bg-background"
          placeholder="Write your chapter content here..."
          spellCheck={false}
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
        </div>
        
        {selection && (
          <div className="flex items-center gap-2">
            <MessageSquare className="h-3 w-3" />
            <span>Selection: {selection.start}-{selection.end}</span>
          </div>
        )}
      </div>
    </div>
  )
}
