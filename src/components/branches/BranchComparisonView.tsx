/**
 * BranchComparisonView Component
 * 
 * Side-by-side comparison of branches
 */

import { useState } from 'react'
import type { BranchVariation } from '@/lib/branches/variation/generator'
import type { ComparisonDimension } from '@/lib/branches/comparison/dimensions'
import { 
  compareBranches, 
  type BranchComparison,
  calculateCharacterFateSimilarity,
  generateDetailedView,
  type DetailLevel
} from '@/lib/branches/comparison'
import { Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

interface BranchComparisonViewProps {
  branches: BranchVariation[]
  onClose?: () => void
}

const dimensionLabels: Record<ComparisonDimension, string> = {
  'premise-similarity': 'Premise',
  'character-fates': 'Characters',
  'theme-alignment': 'Themes',
  'ending-contrast': 'Ending',
  'emotional-arc': 'Emotion',
  'consequence-scope': 'Stakes',
  'narrative-structure': 'Structure',
  'reader-experience': 'Experience',
}

export function BranchComparisonView({ branches, onClose }: BranchComparisonViewProps) {
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('moderate')
  const [selectedTab, setSelectedTab] = useState('overview')
  
  if (branches.length < 2) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Select at least 2 branches to compare
      </div>
    )
  }
  
  // Generate comparisons for all pairs
  const comparisons: BranchComparison[] = []
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      comparisons.push(compareBranches(branches[i], branches[j]))
    }
  }
  
  const avgSimilarity = comparisons.length > 0
    ? comparisons.reduce((sum, c) => sum + c.overallSimilarity, 0) / comparisons.length
    : 0
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Branch Comparison</h3>
          <p className="text-sm text-muted-foreground">
            Comparing {branches.length} branches
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {(avgSimilarity * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-muted-foreground">Similarity</div>
        </div>
      </div>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
          <TabsTrigger value="characters">Characters</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Branch summary cards */}
          <div className="grid grid-cols-2 gap-4">
            {branches.map((branch, idx) => (
              <Card key={branch.id}>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Branch {idx + 1}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium">{branch.premise.title}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{branch.mood}</Badge>
                    <Badge variant="outline">{branch.consequenceType}</Badge>
                    <Badge variant="outline">{branch.trajectory.endingType}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {branch.estimatedChapters} chapters • {branch.characterArcs.length} characters
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Key differences */}
          {comparisons[0]?.keyDifferences.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Key Differences</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {comparisons[0].keyDifferences.map((diff, i) => (
                    <li key={i}>{diff}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Dimensions Tab */}
        <TabsContent value="dimensions">
          <div className="space-y-3">
            {comparisons[0] && Object.entries(comparisons[0].dimensions).map(([key, dim]) => (
              <div key={key} className="flex items-center gap-4 p-3 rounded-lg border">
                <div className="w-32 text-sm font-medium">
                  {dimensionLabels[key as ComparisonDimension]}
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        'h-full rounded-full transition-all',
                        dim.similarity > 0.7 ? 'bg-green-500' :
                        dim.similarity > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                      )}
                      style={{ width: `${dim.similarity * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-12 text-right text-sm">
                  {(dim.similarity * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        {/* Characters Tab */}
        <TabsContent value="characters">
          {branches.length === 2 && (
            <CharacterFateComparison branchA={branches[0]} branchB={branches[1]} />
          )}
          {branches.length > 2 && (
            <div className="text-center text-muted-foreground py-8">
              Character comparison for 2+ branches coming soon
            </div>
          )}
        </TabsContent>
        
        {/* Details Tab */}
        <TabsContent value="details">
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              {(['summary', 'moderate', 'full'] as DetailLevel[]).map(level => (
                <button
                  key={level}
                  onClick={() => setDetailLevel(level)}
                  className={cn(
                    'px-3 py-1 text-sm rounded-md transition-colors',
                    detailLevel === level
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
            
            {branches.length === 2 && (
              <DetailedComparison 
                branchA={branches[0]} 
                branchB={branches[1]} 
                level={detailLevel}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CharacterFateComparison({ 
  branchA, 
  branchB 
}: { 
  branchA: BranchVariation
  branchB: BranchVariation 
}) {
  const fateMatrix = calculateCharacterFateSimilarity(branchA, branchB)
  
  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        Overall similarity: {(fateMatrix.overallSimilarity * 100).toFixed(0)}%
      </div>
      
      {fateMatrix.characters.map(char => (
        <div 
          key={char.characterId}
          className={cn(
            'p-3 rounded-lg border',
            char.fateSimilarity > 0.7 ? 'bg-green-50 border-green-200' :
            char.fateSimilarity > 0.4 ? 'bg-yellow-50 border-yellow-200' :
            'bg-red-50 border-red-200'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">{char.characterName}</span>
            <Badge variant={char.fateSimilarity > 0.7 ? 'default' : 'secondary'}>
              {(char.fateSimilarity * 100).toFixed(0)}%
            </Badge>
          </div>
          <div className="mt-2 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Branch A:</span>
              <span>{char.branchAState}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Branch B:</span>
              <span>{char.branchBState}</span>
            </div>
          </div>
          {char.fateDivergence !== 'none' && (
            <div className="mt-2 text-xs">
              {char.implications.map((imp, i) => (
                <p key={i} className="text-muted-foreground">• {imp}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function DetailedComparison({ 
  branchA, 
  branchB, 
  level 
}: { 
  branchA: BranchVariation
  branchB: BranchVariation
  level: DetailLevel
}) {
  const view = generateDetailedView(branchA, branchB, level)
  
  return (
    <div className="space-y-4">
      {view.sections.filter(s => view.visibleDimensions.includes(s.dimension)).map(section => (
        <Card key={section.dimension}>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{section.title}</CardTitle>
              <Badge 
                variant={section.similarity > 0.7 ? 'default' : 'secondary'}
              >
                {(section.similarity * 100).toFixed(0)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-3">{section.summary}</p>
            <div className="space-y-1">
              {section.details.map((detail, i) => (
                <p key={i} className="text-sm text-muted-foreground">{detail}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
