/**
 * Analysis Viewer
 * Tabbed interface with 5 views (Summary, Timeline, Characters, Themes, Relationships)
 */

import { useState } from 'react'
import { 
  FileText, Clock, Users, Palette, Network,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Download, Printer, FileJson, FileCode
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export type AnalysisTab = 'summary' | 'timeline' | 'characters' | 'themes' | 'relationships'

export interface AnalysisData {
  summary: {
    title: string
    author: string
    totalPages: number
    chapterCount: number
    keyEvents: string[]
    overallTone: string
  }
  timeline: TimelineEvent[]
  characters: Character[]
  themes: Theme[]
  relationships: Relationship[]
}

export interface TimelineEvent {
  id: string
  page: number
  chapter?: number
  title: string
  description: string
  characters: string[]
  significance: 'minor' | 'moderate' | 'major' | 'critical'
}

export interface Character {
  id: string
  name: string
  aliases: string[]
  firstAppearance: number
  description: string
  personality: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  imageUrl?: string
}

export interface Theme {
  id: string
  name: string
  description: string
  keywords: string[]
  occurrences: number
  relatedEvents: string[]
}

export interface Relationship {
  id: string
  characterA: string
  characterB: string
  type: string
  description: string
  evolution: Array<{ page: number; state: string }>
}

// ============================================================================
// Analysis Viewer
// ============================================================================

interface AnalysisViewerProps {
  data: AnalysisData
  className?: string
}

export function AnalysisViewer({ data, className }: AnalysisViewerProps) {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('summary')

  const tabs: { id: AnalysisTab; label: string; icon: React.ReactNode }[] = [
    { id: 'summary', label: 'Summary', icon: <FileText className="h-4 w-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock className="h-4 w-4" /> },
    { id: 'characters', label: 'Characters', icon: <Users className="h-4 w-4" /> },
    { id: 'themes', label: 'Themes', icon: <Palette className="h-4 w-4" /> },
    { id: 'relationships', label: 'Relationships', icon: <Network className="h-4 w-4" /> },
  ]

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header with Tabs */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Export Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <FileJson className="h-4 w-4 mr-1" />
            JSON
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <FileCode className="h-4 w-4 mr-1" />
            PDF
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'summary' && <SummaryView data={data.summary} />}
        {activeTab === 'timeline' && <TimelineView events={data.timeline} />}
        {activeTab === 'characters' && <CharactersView characters={data.characters} />}
        {activeTab === 'themes' && <ThemesView themes={data.themes} />}
        {activeTab === 'relationships' && <RelationshipsView relationships={data.relationships} characters={data.characters} />}
      </div>
    </div>
  )
}

// ============================================================================
// Summary View
// ============================================================================

function SummaryView({ data }: { data: AnalysisData['summary'] }) {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">{data.title}</h2>
        <p className="text-lg text-muted-foreground">by {data.author}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Pages" value={data.totalPages.toString()} />
        <StatCard label="Chapters" value={data.chapterCount.toString()} />
        <StatCard label="Overall Tone" value={data.overallTone} />
      </div>

      <section>
        <h3 className="text-lg font-semibold mb-3">Key Events</h3>
        <ul className="space-y-2">
          {data.keyEvents.map((event, index) => (
            <li key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">
                {index + 1}
              </span>
              <span>{event}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-4 bg-card border rounded-xl">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

// ============================================================================
// Timeline View
// ============================================================================

function TimelineView({ events }: { events: TimelineEvent[] }) {
  const [zoom, setZoom] = useState(1)
  const [scrollPosition, setScrollPosition] = useState(0)

  const significanceColors = {
    minor: 'bg-gray-400',
    moderate: 'bg-blue-400',
    major: 'bg-orange-400',
    critical: 'bg-red-500',
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(2, z + 0.25))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative overflow-x-auto pb-4">
        <div 
          className="flex gap-4 min-w-max px-4"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'left top' }}
        >
          {events.map((event, index) => (
            <div 
              key={event.id}
              className="flex-shrink-0 w-64 p-4 bg-card border rounded-xl hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={cn('w-3 h-3 rounded-full', significanceColors[event.significance])} />
                <span className="text-sm text-muted-foreground">Page {event.page}</span>
              </div>
              <h4 className="font-semibold mb-1">{event.title}</h4>
              <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
              <div className="flex flex-wrap gap-1">
                {event.characters.map(char => (
                  <span key={char} className="text-xs px-2 py-0.5 bg-muted rounded-full">
                    {char}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <span className="font-medium">Significance:</span>
        {Object.entries(significanceColors).map(([level, color]) => (
          <span key={level} className="flex items-center gap-1">
            <span className={cn('w-2 h-2 rounded-full', color)} />
            <span className="capitalize">{level}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Characters View
// ============================================================================

function CharactersView({ characters }: { characters: Character[] }) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)

  const roles = {
    protagonist: 'Protagonists',
    antagonist: 'Antagonists',
    supporting: 'Supporting',
    minor: 'Minor',
  }

  const charactersByRole = characters.reduce((acc, char) => {
    if (!acc[char.role]) acc[char.role] = []
    acc[char.role].push(char)
    return acc
  }, {} as Record<string, Character[]>)

  if (selectedCharacter) {
    return (
      <CharacterDetail 
        character={selectedCharacter} 
        onBack={() => setSelectedCharacter(null)}
      />
    )
  }

  return (
    <div className="space-y-8">
      {Object.entries(roles).map(([role, label]) => {
        const roleCharacters = charactersByRole[role] || []
        if (roleCharacters.length === 0) return null

        return (
          <section key={role}>
            <h3 className="text-lg font-semibold mb-3 capitalize">{label}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {roleCharacters.map(char => (
                <button
                  key={char.id}
                  onClick={() => setSelectedCharacter(char)}
                  className="text-left p-4 bg-card border rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-3 flex items-center justify-center">
                    {char.imageUrl ? (
                      <img src={char.imageUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <Users className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <h4 className="font-semibold text-center">{char.name}</h4>
                  {char.aliases.length > 0 && (
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      aka {char.aliases.join(', ')}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function CharacterDetail({ character, onBack }: { character: Character; onBack: () => void }) {
  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Characters
      </Button>

      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
            {character.imageUrl ? (
              <img src={character.imageUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <Users className="h-12 w-12 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold">{character.name}</h2>
            {character.aliases.length > 0 && (
              <p className="text-muted-foreground">
                Also known as: {character.aliases.join(', ')}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              First appearance: Page {character.firstAppearance}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <section>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground">{character.description}</p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Personality</h3>
            <p className="text-muted-foreground">{character.personality}</p>
          </section>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Themes View
// ============================================================================

function ThemesView({ themes }: { themes: Theme[] }) {
  return (
    <div className="grid gap-4">
      {themes.map(theme => (
        <div key={theme.id} className="bg-card border rounded-xl p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-semibold">{theme.name}</h3>
            <span className="text-sm text-muted-foreground">
              {theme.occurrences} occurrences
            </span>
          </div>

          <p className="text-muted-foreground mb-4">{theme.description}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {theme.keywords.map(keyword => (
              <span 
                key={keyword} 
                className="px-2 py-1 bg-primary/10 text-primary text-sm rounded-full"
              >
                {keyword}
              </span>
            ))}
          </div>

          {theme.relatedEvents.length > 0 && (
            <div>
              <span className="text-sm font-medium">Related Events:</span>
              <span className="text-sm text-muted-foreground ml-2">
                {theme.relatedEvents.join(', ')}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Relationships View
// ============================================================================

function RelationshipsView({ 
  relationships, 
  characters 
}: { 
  relationships: Relationship[]
  characters: Character[]
}) {
  const getCharacterName = (id: string) => {
    return characters.find(c => c.id === id)?.name || id
  }

  return (
    <div className="space-y-4">
      {relationships.map(rel => (
        <div key={rel.id} className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="font-semibold">{getCharacterName(rel.characterA)}</span>
              <span className="text-muted-foreground">↔</span>
              <span className="font-semibold">{getCharacterName(rel.characterB)}</span>
            </div>
            <span className="px-3 py-1 bg-muted rounded-full text-sm">
              {rel.type}
            </span>
          </div>

          <p className="text-muted-foreground mb-4">{rel.description}</p>

          {rel.evolution.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Evolution</h4>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {rel.evolution.map((ev, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-muted rounded-lg text-sm whitespace-nowrap">
                      Page {ev.page}: {ev.state}
                    </span>
                    {index < rel.evolution.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
