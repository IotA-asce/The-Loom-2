/**
 * AIAssistPanel component
 * Interactive AI assistance for refinement
 */

import { useState, useCallback } from 'react'
import { 
  Sparkles, Send, Loader2, ThumbsUp, ThumbsDown,
  MessageSquare, Wand2, X, ChevronDown, ChevronUp 
} from 'lucide-react'
import { Button } from '@/components/ui'

type AIAssistType =
  | 'suggest-improvements'
  | 'fix-continuity'
  | 'enhance-dialogue'
  | 'improve-pacing'
  | 'fix-grammar'
  | 'match-tone'
  | 'expand-contract'

interface AISuggestion {
  id: string
  type: AIAssistType
  description: string
  original?: string
  replacement?: string
  explanation: string
  confidence: 'high' | 'medium' | 'low'
}

interface AIAssistPanelProps {
  isOpen: boolean
  onClose: () => void
  selectedText?: string
  contextText?: string
  onApplySuggestion: (suggestion: AISuggestion) => void
  onRejectSuggestion: (suggestionId: string) => void
}

export function AIAssistPanel({
  isOpen,
  onClose,
  selectedText,
  contextText,
  onApplySuggestion,
  onRejectSuggestion,
}: AIAssistPanelProps) {
  const [activeTab, setActiveTab] = useState<'quick' | 'chat'>('quick')
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([])
  const [chatInput, setChatInput] = useState('')
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null)

  const quickActions: { type: AIAssistType; label: string; icon: React.ReactNode }[] = [
    { type: 'suggest-improvements', label: 'Improve', icon: <Sparkles className="h-4 w-4" /> },
    { type: 'fix-continuity', label: 'Fix Continuity', icon: <Wand2 className="h-4 w-4" /> },
    { type: 'enhance-dialogue', label: 'Enhance Dialogue', icon: <MessageSquare className="h-4 w-4" /> },
    { type: 'improve-pacing', label: 'Fix Pacing', icon: <Loader2 className="h-4 w-4" /> },
    { type: 'fix-grammar', label: 'Fix Grammar', icon: <Wand2 className="h-4 w-4" /> },
    { type: 'match-tone', label: 'Match Tone', icon: <Sparkles className="h-4 w-4" /> },
    { type: 'expand-contract', label: 'Expand/Contract', icon: <Wand2 className="h-4 w-4" /> },
  ]

  const handleQuickAction = useCallback(async (type: AIAssistType) => {
    setIsGenerating(true)
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const mockSuggestion: AISuggestion = {
      id: `sugg-${Date.now()}`,
      type,
      description: getSuggestionDescription(type),
      original: selectedText,
      replacement: getMockReplacement(type, selectedText),
      explanation: getMockExplanation(type),
      confidence: Math.random() > 0.5 ? 'high' : 'medium',
    }
    
    setSuggestions(prev => [mockSuggestion, ...prev])
    setIsGenerating(false)
  }, [selectedText])

  const handleChatSubmit = useCallback(async () => {
    if (!chatInput.trim()) return
    
    const userMessage = chatInput.trim()
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatInput('')
    setIsGenerating(true)
    
    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setChatMessages(prev => [...prev, { 
      role: 'ai', 
      content: `I'll help you with: "${userMessage}". ${getMockChatResponse()}` 
    }])
    setIsGenerating(false)
  }, [chatInput])

  const handleApply = useCallback((suggestion: AISuggestion) => {
    onApplySuggestion(suggestion)
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
  }, [onApplySuggestion])

  const handleReject = useCallback((suggestionId: string) => {
    onRejectSuggestion(suggestionId)
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
  }, [onRejectSuggestion])

  if (!isOpen) return null

  return (
    <div className="w-80 border-l bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <h3 className="font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Assist
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('quick')}
          className={`
            flex-1 py-2 text-sm font-medium transition-colors
            ${activeTab === 'quick' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}
          `}
        >
          Quick Actions
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`
            flex-1 py-2 text-sm font-medium transition-colors
            ${activeTab === 'chat' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}
          `}
        >
          Chat
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'quick' ? (
          <div className="p-3 space-y-3">
            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map(action => (
                <Button
                  key={action.type}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action.type)}
                  disabled={isGenerating}
                  className="justify-start text-xs"
                >
                  {action.icon}
                  <span className="ml-1">{action.label}</span>
                </Button>
              ))}
            </div>

            {/* Selection Info */}
            {selectedText && (
              <div className="p-2 bg-muted rounded text-xs">
                <p className="text-muted-foreground mb-1">Selected:</p>
                <p className="truncate">"{selectedText}"</p>
              </div>
            )}

            {/* Suggestions */}
            <div className="space-y-2">
              {isGenerating && (
                <div className="flex items-center justify-center py-4 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </div>
              )}

              {suggestions.map(suggestion => (
                <div
                  key={suggestion.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedSuggestion(
                      expandedSuggestion === suggestion.id ? null : suggestion.id
                    )}
                    className="w-full flex items-center justify-between p-2 bg-muted/30 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`
                        text-xs px-1.5 py-0.5 rounded
                        ${suggestion.confidence === 'high' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                      `}>
                        {suggestion.confidence}
                      </span>
                      <span className="text-sm font-medium">{suggestion.description}</span>
                    </div>
                    {expandedSuggestion === suggestion.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {expandedSuggestion === suggestion.id && (
                    <div className="p-3 space-y-2 text-sm">
                      {suggestion.original && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Original:</p>
                          <p className="text-red-600 line-through">{suggestion.original}</p>
                        </div>
                      )}
                      {suggestion.replacement && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Suggestion:</p>
                          <p className="text-green-600">{suggestion.replacement}</p>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">{suggestion.explanation}</p>
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApply(suggestion)}
                          className="flex-1"
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Apply
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReject(suggestion.id)}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Ask me anything about your writing...
                </p>
              )}
              
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`
                    p-2 rounded-lg text-sm
                    ${msg.role === 'user' ? 'bg-primary text-primary-foreground ml-4' : 'bg-muted mr-4'}
                  `}
                >
                  {msg.content}
                </div>
              ))}
              
              {isGenerating && (
                <div className="flex items-center text-muted-foreground text-sm">
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  Thinking...
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                  placeholder="Ask for help..."
                  className="flex-1 px-3 py-2 text-sm border rounded-md"
                />
                <Button
                  size="icon"
                  onClick={handleChatSubmit}
                  disabled={!chatInput.trim() || isGenerating}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Mock helpers
function getSuggestionDescription(type: AIAssistType): string {
  const descriptions: Record<AIAssistType, string> = {
    'suggest-improvements': 'Style improvement',
    'fix-continuity': 'Continuity fix',
    'enhance-dialogue': 'Dialogue enhancement',
    'improve-pacing': 'Pacing adjustment',
    'fix-grammar': 'Grammar correction',
    'match-tone': 'Tone matching',
    'expand-contract': 'Length adjustment',
  }
  return descriptions[type]
}

function getMockReplacement(type: AIAssistType, original?: string): string {
  if (!original) return 'Suggested text here...'
  
  switch (type) {
    case 'fix-grammar':
      return original.replace(/\s+/, ' ').trim()
    case 'enhance-dialogue':
      return `"${original.replace(/"/g, '')}" she said, her voice trembling.`
    default:
      return `${original} [improved]`
  }
}

function getMockExplanation(type: AIAssistType): string {
  const explanations: Record<AIAssistType, string> = {
    'suggest-improvements': 'This change improves the flow and clarity of the sentence.',
    'fix-continuity': 'Fixes a potential continuity issue with the character knowledge.',
    'enhance-dialogue': 'Adds an action beat to make the dialogue more engaging.',
    'improve-pacing': 'Shortens the sentence for better pacing in this action scene.',
    'fix-grammar': 'Corrects a grammatical error.',
    'match-tone': 'Adjusts the language to better match the established tone.',
    'expand-contract': 'Adjusts the length to match your preferences.',
  }
  return explanations[type]
}

function getMockChatResponse(): string {
  const responses = [
    'I\'ve analyzed your text and found a few areas that could be strengthened.',
    'This section works well, but you might consider adding more sensory details.',
    'The character voice is consistent here. Great job!',
    'I noticed a potential plot point that could be foreshadowed earlier.',
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}
