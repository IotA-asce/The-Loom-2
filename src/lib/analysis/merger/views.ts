/**
 * Multiple output views
 * Generates different views of merged analysis for downstream components
 */

import { Character, TimelineEvent, Theme, Relationship, Storyline } from '@/lib/db/schema'

export type OutputViewType = 
  | 'anchor_detection'      // For Component 4: Anchor Event Detector
  | 'branch_generation'     // For Component 5: Branch Generator  
  | 'story_continuation'    // For Component 6: Story Continuation Engine
  | 'full_analysis'         // Complete analysis
  | 'summary'               // Brief summary

export interface AnchorDetectionView {
  characters: Array<{
    id: string
    name: string
    importance: Character['importance']
    arcSummary: string
  }>
  events: Array<{
    id: string
    pageNumber: number
    title: string
    significance: TimelineEvent['significance']
    characters: string[]
    downstreamEvents: number
  }>
  causalGraph: {
    nodes: string[]
    edges: Array<{ from: string; to: string; strength: number }>
  }
}

export interface BranchGenerationView {
  worldState: {
    setting: string
    keyFacts: string[]
    activeConflicts: string[]
  }
  characterStates: Array<{
    characterId: string
    currentState: string
    motivations: string[]
    relationships: Array<{
      withCharacter: string
      type: string
    }>
  }>
  anchorPoints: Array<{
    eventId: string
    title: string
    alternatives: string[]
  }>
}

export interface StoryContinuationView {
  narrativeVoice: {
    style: string
    tone: string
    commonPhrases: string[]
  }
  characterVoices: Array<{
    characterId: string
    speechPattern: string
    vocabulary: string[]
  }>
  plotStructure: {
    pacing: 'slow' | 'moderate' | 'fast'
    chapterLength: 'short' | 'medium' | 'long'
    cliffhangerFrequency: number
  }
}

export interface SummaryView {
  title: string
  totalPages: number
  totalCharacters: number
  totalEvents: number
  keyThemes: string[]
  storyArc: string
}

/**
 * View generator
 */
export class AnalysisViewGenerator {
  private storyline: Storyline
  private characters: Character[]
  private events: TimelineEvent[]
  private themes: Theme[]
  private relationships: Relationship[]
  
  constructor(storyline: Storyline) {
    this.storyline = storyline
    this.characters = storyline.characters
    this.events = storyline.timeline
    this.themes = storyline.themes
    this.relationships = storyline.relationships
  }
  
  /**
   * Generate view for specific component
   */
  generateView(type: OutputViewType): unknown {
    switch (type) {
      case 'anchor_detection':
        return this.generateAnchorDetectionView()
      case 'branch_generation':
        return this.generateBranchGenerationView()
      case 'story_continuation':
        return this.generateStoryContinuationView()
      case 'summary':
        return this.generateSummaryView()
      case 'full_analysis':
      default:
        return this.storyline
    }
  }
  
  /**
   * Generate anchor detection view
   */
  private generateAnchorDetectionView(): AnchorDetectionView {
    return {
      characters: this.characters.map(c => ({
        id: c.id,
        name: c.name,
        importance: c.importance,
        arcSummary: this.summarizeCharacterArc(c),
      })),
      events: this.events.map(e => ({
        id: e.id,
        pageNumber: e.pageNumber,
        title: e.title,
        significance: e.significance,
        characters: e.characters,
        downstreamEvents: this.countDownstreamEvents(e),
      })),
      causalGraph: this.buildCausalGraph(),
    }
  }
  
  /**
   * Generate branch generation view
   */
  private generateBranchGenerationView(): BranchGenerationView {
    return {
      worldState: {
        setting: this.inferSetting(),
        keyFacts: this.extractKeyFacts(),
        activeConflicts: this.identifyConflicts(),
      },
      characterStates: this.characters.map(c => ({
        characterId: c.id,
        currentState: this.getCharacterFinalState(c),
        motivations: this.inferMotivations(c),
        relationships: this.getCharacterRelationships(c),
      })),
      anchorPoints: this.events
        .filter(e => e.significance === 'major' || e.significance === 'critical')
        .map(e => ({
          eventId: e.id,
          title: e.title,
          alternatives: this.generateAlternatives(e),
        })),
    }
  }
  
  /**
   * Generate story continuation view
   */
  private generateStoryContinuationView(): StoryContinuationView {
    return {
      narrativeVoice: {
        style: this.analyzeNarrativeStyle(),
        tone: this.analyzeTone(),
        commonPhrases: this.extractCommonPhrases(),
      },
      characterVoices: this.characters.map(c => ({
        characterId: c.id,
        speechPattern: this.analyzeSpeechPattern(c),
        vocabulary: this.extractVocabulary(c),
      })),
      plotStructure: {
        pacing: this.analyzePacing(),
        chapterLength: this.estimateChapterLength(),
        cliffhangerFrequency: this.calculateCliffhangerFrequency(),
      },
    }
  }
  
  /**
   * Generate summary view
   */
  private generateSummaryView(): SummaryView {
    return {
      title: 'Story Analysis Summary',
      totalPages: Math.max(...this.events.map(e => e.pageNumber), 0),
      totalCharacters: this.characters.length,
      totalEvents: this.events.length,
      keyThemes: this.themes.map(t => t.name),
      storyArc: this.identifyStoryArc(),
    }
  }
  
  // Helper methods
  
  private summarizeCharacterArc(character: Character): string {
    const events = this.events.filter(e => e.characters.includes(character.id))
    const significant = events.filter(e => 
      e.significance === 'major' || e.significance === 'critical'
    )
    
    if (significant.length === 0) {
      return `${character.name} appears in ${events.length} events`
    }
    
    return `${character.name}: ${significant.length} significant events, ${character.importance} role`
  }
  
  private countDownstreamEvents(event: TimelineEvent): number {
    // Simple approximation: events with higher page numbers
    return this.events.filter(e => e.pageNumber > event.pageNumber).length
  }
  
  private buildCausalGraph(): AnchorDetectionView['causalGraph'] {
    const nodes = this.events.map(e => e.id)
    const edges: AnchorDetectionView['causalGraph']['edges'] = []
    
    // Simple causal inference based on character overlap and sequence
    for (let i = 0; i < this.events.length; i++) {
      for (let j = i + 1; j < this.events.length; j++) {
        const a = this.events[i]
        const b = this.events[j]
        
        const sharedChars = a.characters.filter(c => b.characters.includes(c))
        if (sharedChars.length > 0 && b.pageNumber > a.pageNumber) {
          edges.push({
            from: a.id,
            to: b.id,
            strength: sharedChars.length / Math.max(a.characters.length, b.characters.length),
          })
        }
      }
    }
    
    return { nodes, edges }
  }
  
  private inferSetting(): string {
    // Infer from themes and descriptions
    const themeNames = this.themes.map(t => t.name.toLowerCase())
    
    if (themeNames.some(t => t.includes('fantasy') || t.includes('magic'))) {
      return 'Fantasy world'
    }
    if (themeNames.some(t => t.includes('sci-fi') || t.includes('future'))) {
      return 'Science fiction setting'
    }
    if (themeNames.some(t => t.includes('school') || t.includes('academy'))) {
      return 'School/academy setting'
    }
    
    return 'Contemporary or unspecified setting'
  }
  
  private extractKeyFacts(): string[] {
    return this.events
      .filter(e => e.significance === 'critical')
      .slice(0, 5)
      .map(e => e.title)
  }
  
  private identifyConflicts(): string[] {
    const conflicts: string[] = []
    
    for (const rel of this.relationships) {
      if (rel.type.includes('enemy') || rel.type.includes('rival')) {
        conflicts.push(`${rel.characterA} vs ${rel.characterB}`)
      }
    }
    
    return conflicts.slice(0, 5)
  }
  
  private getCharacterFinalState(character: Character): string {
    const lastEvent = this.events
      .filter(e => e.characters.includes(character.id))
      .sort((a, b) => b.pageNumber - a.pageNumber)[0]
    
    return lastEvent ? `Last seen: ${lastEvent.title}` : 'Unknown'
  }
  
  private inferMotivations(character: Character): string[] {
    // Extract from character description
    const motivations: string[] = []
    
    if (character.personality) {
      if (character.personality.includes('ambition')) motivations.push('ambition')
      if (character.personality.includes('revenge')) motivations.push('revenge')
      if (character.personality.includes('protect')) motivations.push('protection')
    }
    
    return motivations.length > 0 ? motivations : ['unknown']
  }
  
  private getCharacterRelationships(character: Character): Array<{ withCharacter: string; type: string }> {
    return this.relationships
      .filter(r => r.characterA === character.id || r.characterB === character.id)
      .map(r => ({
        withCharacter: r.characterA === character.id ? r.characterB : r.characterA,
        type: r.type,
      }))
  }
  
  private generateAlternatives(event: TimelineEvent): string[] {
    // Generate potential "what if" alternatives
    return [
      `What if ${event.title.toLowerCase()} didn't happen?`,
      `What if the outcome was different?`,
      `What if another character intervened?`,
    ]
  }
  
  private analyzeNarrativeStyle(): string {
    // Analyze from event descriptions
    const totalLength = this.events.reduce((sum, e) => sum + e.description.length, 0)
    const avgLength = totalLength / this.events.length
    
    if (avgLength > 200) return 'Descriptive, detailed'
    if (avgLength < 100) return 'Concise, action-focused'
    return 'Balanced narrative'
  }
  
  private analyzeTone(): string {
    // Simple keyword analysis
    const allText = this.events.map(e => e.description).join(' ').toLowerCase()
    
    const darkIndicators = ['death', 'dark', 'sad', 'tragic', 'loss']
    const lightIndicators = ['happy', 'joy', 'love', 'hope', 'comedy']
    
    const darkCount = darkIndicators.filter(w => allText.includes(w)).length
    const lightCount = lightIndicators.filter(w => allText.includes(w)).length
    
    if (darkCount > lightCount * 2) return 'Dark, serious'
    if (lightCount > darkCount * 2) return 'Light, optimistic'
    return 'Mixed tone'
  }
  
  private extractCommonPhrases(): string[] {
    // Simplified - would need more text for real analysis
    return ['common phrase extraction would require full text']
  }
  
  private analyzeSpeechPattern(character: Character): string {
    return character.personality || 'Neutral speech pattern'
  }
  
  private extractVocabulary(character: Character): string[] {
    // Would need dialogue samples
    return []
  }
  
  private analyzePacing(): 'slow' | 'moderate' | 'fast' {
    const eventDensity = this.events.length / Math.max(...this.events.map(e => e.pageNumber), 1)
    
    if (eventDensity < 0.1) return 'slow'
    if (eventDensity > 0.3) return 'fast'
    return 'moderate'
  }
  
  private estimateChapterLength(): 'short' | 'medium' | 'long' {
    const avgEventSpacing = this.calculateAverageEventSpacing()
    
    if (avgEventSpacing < 10) return 'short'
    if (avgEventSpacing > 30) return 'long'
    return 'medium'
  }
  
  private calculateAverageEventSpacing(): number {
    if (this.events.length < 2) return 0
    
    const sorted = [...this.events].sort((a, b) => a.pageNumber - b.pageNumber)
    let totalGap = 0
    
    for (let i = 1; i < sorted.length; i++) {
      totalGap += sorted[i].pageNumber - sorted[i - 1].pageNumber
    }
    
    return totalGap / (sorted.length - 1)
  }
  
  private calculateCliffhangerFrequency(): number {
    // Estimate based on event distribution
    return 0.3 // Placeholder
  }
  
  private identifyStoryArc(): string {
    const significantEvents = this.events.filter(e => 
      e.significance === 'major' || e.significance === 'critical'
    )
    
    if (significantEvents.length < 3) return 'Simple linear narrative'
    if (significantEvents.length > 10) return 'Complex multi-arc narrative'
    return 'Standard three-act structure'
  }
}

/**
 * Generate all views at once
 */
export function generateAllViews(storyline: Storyline): Record<OutputViewType, unknown> {
  const generator = new AnalysisViewGenerator(storyline)
  
  return {
    anchor_detection: generator.generateView('anchor_detection'),
    branch_generation: generator.generateView('branch_generation'),
    story_continuation: generator.generateView('story_continuation'),
    full_analysis: generator.generateView('full_analysis'),
    summary: generator.generateView('summary'),
  }
}
