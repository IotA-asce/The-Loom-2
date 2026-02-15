/**
 * BranchDetailModal Component
 * 
 * Detailed view of branch with full information
 */

import { useState } from 'react'
import type { BranchVariation } from '@/lib/branches/variation/generator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Tabs, TabsContent, TabsList, TabsTrigger,
  Badge,
  ScrollArea,
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { 
  GitBranch, 
  Users, 
  Clock, 
  Sparkles, 
  TrendingUp,
  BookOpen,
  Target,
  CheckCircle2,
  Edit3,
  Play
} from 'lucide-react'

interface BranchDetailModalProps {
  branch: BranchVariation | null
  open: boolean
  onClose: () => void
  onSelect?: () => void
  onEdit?: () => void
  onStartWriting?: () => void
  isSelected?: boolean
}

const moodConfig = {
  hopeful: { color: 'text-green-600', bg: 'bg-green-50', label: 'Hopeful' },
  tragic: { color: 'text-red-600', bg: 'bg-red-50', label: 'Tragic' },
  mixed: { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Mixed' },
  dark: { color: 'text-purple-600', bg: 'bg-purple-50', label: 'Dark' },
}

const consequenceConfig = {
  personal: { icon: Users, label: 'Personal' },
  political: { icon: TrendingUp, label: 'Political' },
  cosmic: { icon: Sparkles, label: 'Cosmic' },
}

export function BranchDetailModal({
  branch,
  open,
  onClose,
  onSelect,
  onEdit,
  onStartWriting,
  isSelected,
}: BranchDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  
  if (!branch) return null
  
  const mood = moodConfig[branch.mood]
  const consequence = consequenceConfig[branch.consequenceType]
  const ConsequenceIcon = consequence.icon
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-muted-foreground" />
                <DialogTitle className="text-xl">{branch.premise.title}</DialogTitle>
              </div>
              <p className="text-muted-foreground mt-1">{branch.premise.subtitle}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge className={cn(mood.bg, mood.color)}>{mood.label}</Badge>
                <Badge variant="outline">{branch.trajectory.endingType} ending</Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <ConsequenceIcon className="w-3 h-3" />
                  {consequence.label}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Clock className="w-5 h-5" />
                {branch.estimatedChapters} chapters
              </div>
              <p className="text-sm text-muted-foreground">Estimated length</p>
            </div>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="mx-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="premise">Premise</TabsTrigger>
            <TabsTrigger value="trajectory">Trajectory</TabsTrigger>
            <TabsTrigger value="characters">Characters</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[50vh]">
            <TabsContent value="overview" className="px-6 py-4 space-y-4">
              {/* What If */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">What If</p>
                <p className="text-lg italic">{branch.premise.whatIf}</p>
              </div>
              
              {/* Hook */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Hook</p>
                <p>{branch.premise.hook}</p>
              </div>
              
              {/* Summary Grid */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Themes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {branch.themeProgression.map(theme => (
                        <Badge key={theme} variant="secondary">{theme}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Complexity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="capitalize">{branch.complexity}</p>
                    <p className="text-sm text-muted-foreground">
                      {branch.trajectory.keyEvents.length} key events
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Consequences */}
              {branch.premise.immediateConsequences.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Immediate Consequences</p>
                  <ul className="space-y-2">
                    {branch.premise.immediateConsequences.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="premise" className="px-6 py-4 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p>{branch.premise.description}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Hook</p>
                <p className="italic">{branch.premise.hook}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">What If</p>
                <p className="text-lg">{branch.premise.whatIf}</p>
              </div>
              
              {branch.premise.longTermImplications.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Long-term Implications</p>
                  <ul className="space-y-1">
                    {branch.premise.longTermImplications.map((imp, i) => (
                      <li key={i} className="text-sm text-muted-foreground">• {imp}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Affected Characters</p>
                <div className="flex flex-wrap gap-2">
                  {branch.premise.affectedCharacters.map(char => (
                    <Badge key={char} variant="outline">{char}</Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="trajectory" className="px-6 py-4 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Summary</p>
                <p>{branch.trajectory.summary}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Key Events</p>
                <div className="space-y-2">
                  {branch.trajectory.keyEvents.map((event, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium text-muted-foreground">{i + 1}</span>
                      <span>{event}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Climax</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{branch.trajectory.climax}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Resolution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{branch.trajectory.resolution}</p>
                    <Badge variant="outline" className="mt-2">
                      {branch.trajectory.endingType}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="characters" className="px-6 py-4 space-y-3">
              {branch.characterArcs.map(arc => (
                <Card key={arc.characterId}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{arc.characterName}</CardTitle>
                      <Badge variant={arc.growth === 'positive' ? 'default' : 'secondary'}>
                        {arc.growth} growth
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Starts:</span>
                        <p>{arc.startingState}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ends:</span>
                        <p>{arc.endingState}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Arc:</span>
                      <p className="text-sm">{arc.arcDescription}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </ScrollArea>
        </Tabs>
        
        {/* Actions */}
        <div className="flex justify-end gap-2 px-6 pb-6 pt-2">
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {onSelect && (
            <Button 
              onClick={onSelect}
              variant={isSelected ? 'secondary' : 'default'}
            >
              {isSelected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Selected
                </>
              ) : (
                'Select This Path'
              )}
            </Button>
          )}
          {isSelected && onStartWriting && (
            <Button onClick={onStartWriting}>
              <Play className="w-4 h-4 mr-2" />
              Start Writing
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
