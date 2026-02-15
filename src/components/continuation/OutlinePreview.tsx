/**
 * OutlinePreview component
 * Displays chapter outline with approval workflow
 */

import { useState, useCallback } from 'react'
import { Check, X, Edit3, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui'

interface OutlineScene {
  id: string
  title: string
  summary: string
  characters: string[]
  emotionalArc: string
  dialogueSnippets: string[]
}

interface OutlinePreviewProps {
  chapterNumber: number
  chapterTitle: string
  scenes: OutlineScene[]
  estimatedLength: string
  onApprove: () => void
  onReject: () => void
  onModify: (modifications: string) => void
  onRegenerate: () => void
}

export function OutlinePreview({
  chapterNumber,
  chapterTitle,
  scenes,
  estimatedLength,
  onApprove,
  onReject,
  onModify,
  onRegenerate,
}: OutlinePreviewProps) {
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set())
  const [modificationText, setModificationText] = useState('')
  const [showModificationInput, setShowModificationInput] = useState(false)

  const toggleScene = useCallback((sceneId: string) => {
    setExpandedScenes(prev => {
      const next = new Set(prev)
      if (next.has(sceneId)) {
        next.delete(sceneId)
      } else {
        next.add(sceneId)
      }
      return next
    })
  }, [])

  const handleModify = useCallback(() => {
    if (modificationText.trim()) {
      onModify(modificationText.trim())
      setModificationText('')
      setShowModificationInput(false)
    }
  }, [modificationText, onModify])

  const expandAll = useCallback(() => {
    setExpandedScenes(new Set(scenes.map(s => s.id)))
  }, [scenes])

  const collapseAll = useCallback(() => {
    setExpandedScenes(new Set())
  }, [])

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div>
          <h2 className="text-lg font-semibold">
            Chapter {chapterNumber} Outline
          </h2>
          <p className="text-sm text-muted-foreground">{chapterTitle}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Estimated length</p>
            <p className="text-sm font-medium">{estimatedLength}</p>
          </div>
        </div>
      </div>

      {/* Scene Controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <span className="text-sm text-muted-foreground">
          {scenes.length} scenes
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>
      </div>

      {/* Scenes List */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3 max-w-3xl mx-auto">
          {scenes.map((scene, index) => (
            <div
              key={scene.id}
              className="border rounded-lg overflow-hidden"
            >
              {/* Scene Header */}
              <button
                onClick={() => toggleScene(scene.id)}
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Scene {index + 1}
                  </span>
                  <span className="font-medium">{scene.title}</span>
                </div>
                {expandedScenes.has(scene.id) ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {/* Scene Details */}
              {expandedScenes.has(scene.id) && (
                <div className="px-4 py-3 space-y-3">
                  <p className="text-sm">{scene.summary}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {scene.characters.map(char => (
                      <span
                        key={char}
                        className="px-2 py-1 text-xs bg-secondary rounded-full"
                      >
                        {char}
                      </span>
                    ))}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Emotional Arc:</span> {scene.emotionalArc}
                  </div>

                  {scene.dialogueSnippets.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Dialogue Snippets:
                      </p>
                      {scene.dialogueSnippets.map((snippet, i) => (
                        <p key={i} className="text-sm italic pl-3 border-l-2 border-muted">
                          "{snippet}"
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modification Input */}
      {showModificationInput && (
        <div className="px-4 py-3 border-t bg-muted/50">
          <p className="text-sm font-medium mb-2">Suggest Modifications:</p>
          <textarea
            value={modificationText}
            onChange={(e) => setModificationText(e.target.value)}
            placeholder="Describe the changes you'd like to see..."
            className="w-full h-20 p-2 text-sm border rounded-md resize-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModificationInput(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleModify}>
              Submit Changes
            </Button>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onReject}
            className="text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowModificationInput(!showModificationInput)}
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Modify
          </Button>
          
          <Button variant="outline" onClick={onRegenerate}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Regenerate
          </Button>
        </div>

        <Button onClick={onApprove} className="bg-primary">
          <Check className="h-4 w-4 mr-1" />
          Approve & Continue
        </Button>
      </div>
    </div>
  )
}
