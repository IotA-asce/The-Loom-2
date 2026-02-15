/**
 * AnchorDetailModal Component
 * 
 * Detailed view of anchor with alternatives
 */

import { useState } from 'react'
import type { AnchorEvent, AlternativeOutcome } from '@/lib/db/schema'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Tabs, TabsContent, TabsList, TabsTrigger,
  Badge,
  ScrollArea,
} from '@/components/ui'
import {
  GitBranch,
  Users,
  MapPin,
  Sparkles,
  ChevronRight,
  Plus,
  Edit3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MouseEvent } from 'react'

interface AnchorDetailModalProps {
  anchor: AnchorEvent | null
  open: boolean
  onClose: () => void
  onAddAlternative?: () => void
  onEditAlternative?: (alt: AlternativeOutcome) => void
  onSelectAlternative?: (altId: string) => void
}

const typeLabels: Record<string, string> = {
  decision: 'Decision Point',
  coincidence: 'Coincidence',
  revelation: 'Revelation',
  betrayal: 'Betrayal',
  sacrifice: 'Sacrifice',
  encounter: 'Encounter',
  conflict: 'Conflict',
  transformation: 'Transformation',
  mystery: 'Mystery',
}

export function AnchorDetailModal({
  anchor,
  open,
  onClose,
  onAddAlternative,
  onEditAlternative,
  onSelectAlternative,
}: AnchorDetailModalProps) {
  const [selectedAltId, setSelectedAltId] = useState<string | null>(null)
  
  if (!anchor) return null
  
  const selectedAlt = anchor.alternatives.find(a => a.id === selectedAltId) || 
                      anchor.alternatives[0]
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl">{anchor.title}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="outline">{typeLabels[anchor.type]}</Badge>
                <Badge variant="outline" className={cn(
                  anchor.significance === 'critical' && 'border-red-500 text-red-600',
                  anchor.significance === 'major' && 'border-orange-500 text-orange-600',
                  anchor.significance === 'moderate' && 'border-blue-500 text-blue-600',
                )}>
                  {anchor.significance}
                </Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  Page {anchor.pageNumber}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                {(anchor.branchingPotential.score * 100).toFixed(0)}%
              </div>
              <p className="text-sm text-muted-foreground">Branching Potential</p>
            </div>
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="flex-1">
          <TabsList className="mx-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="alternatives">
              Alternatives ({anchor.alternatives.length})
            </TabsTrigger>
            <TabsTrigger value="characters">Characters</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[50vh]">
            <TabsContent value="overview" className="px-6 py-4 space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground">{anchor.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    Branching Factors
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Narrative Weight</span>
                      <span>{(anchor.branchingPotential.narrativeWeight * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Character Impact</span>
                      <span>{(anchor.branchingPotential.characterImpact * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">World Impact</span>
                      <span>{(anchor.branchingPotential.worldImpact * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Complexity</span>
                      <span className="capitalize">{anchor.branchingPotential.complexity}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-muted">
                  <h4 className="font-medium mb-2">Detection Info</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className="capitalize">{anchor.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confidence</span>
                      <span>{(anchor.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Alternatives</span>
                      <span>{anchor.alternatives.length}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {anchor.userNotes && (
                <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                  <h4 className="font-medium mb-1 text-yellow-800">Notes</h4>
                  <p className="text-sm text-yellow-700">{anchor.userNotes}</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="alternatives" className="px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Possible Outcomes</h4>
                {onAddAlternative && (
                  <Button size="sm" variant="outline" onClick={onAddAlternative}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Alternative
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {anchor.alternatives.map((alt, idx) => (
                  <div
                    key={alt.id}
                    className={cn(
                      'p-4 rounded-lg border cursor-pointer transition-colors',
                      selectedAltId === alt.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => setSelectedAltId(alt.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary">Option {idx + 1}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {alt.affectedCharacters.length} characters affected
                          </span>
                        </div>
                        <p>{alt.description}</p>
                        
                        {alt.consequences.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground mb-1">Consequences:</p>
                            <ul className="text-sm space-y-1">
                              {alt.consequences.map((c, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
                                  {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      {onEditAlternative && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => { 
                            e.stopPropagation()
                            onEditAlternative(alt)
                          }}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    {onSelectAlternative && (
                      <Button
                        className="mt-3 w-full"
                        size="sm"
                        onClick={(e: MouseEvent) => {
                          e.stopPropagation()
                          onSelectAlternative(alt.id)
                        }}
                      >
                        Select This Path
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="characters" className="px-6 py-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5" />
                <h4 className="font-medium">Involved Characters</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {anchor.characters.map(charId => (
                  <Badge key={charId} variant="secondary">{charId}</Badge>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
