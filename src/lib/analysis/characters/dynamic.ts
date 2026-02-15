/**
 * Dynamic character introduction
 * Handles characters introduced mid-story
 */

import { Character } from '@/lib/db/schema'
import { generateDescriptiveId, parseVisualDescription } from './ids'

export interface IntroductionContext {
  batchIndex: number
  pageNumber: number
  sceneDescription?: string
  visualContext?: string
}

export interface IntroductionResult {
  character: Character
  isNew: boolean
  confidence: number
  introductionType: 'named' | 'descriptive' | 'cameo'
}

/**
 * Dynamic character introducer
 */
export class DynamicCharacterIntroducer {
  private knownCharacters = new Map<string, Character>()
  private introducedAt = new Map<string, number>()
  
  /**
   * Initialize with existing characters
   */
  initialize(characters: Character[]): void {
    for (const char of characters) {
      this.knownCharacters.set(char.id, char)
      this.knownCharacters.set(char.name.toLowerCase(), char)
      
      for (const alias of char.aliases) {
        this.knownCharacters.set(alias.toLowerCase(), char)
      }
    }
  }
  
  /**
   * Process potential character introduction
   */
  introduce(
    candidate: Partial<Character>,
    context: IntroductionContext
  ): IntroductionResult {
    // Check if already known
    const existing = this.findExisting(candidate)
    
    if (existing) {
      return {
        character: existing,
        isNew: false,
        confidence: 0.9,
        introductionType: this.getIntroductionType(existing),
      }
    }
    
    // Determine introduction type
    const hasName = candidate.name && candidate.name.length > 0 && 
      !candidate.name.toLowerCase().includes('unknown')
    
    let character: Character
    let introductionType: IntroductionResult['introductionType']
    let confidence: number
    
    if (hasName) {
      // Named character introduction
      character = this.createNamedCharacter(candidate, context)
      introductionType = 'named'
      confidence = 0.8
    } else if (candidate.description) {
      // Descriptive introduction for unnamed character
      character = this.createDescriptiveCharacter(candidate, context)
      introductionType = 'descriptive'
      confidence = 0.6
    } else {
      // Cameo/minor appearance
      character = this.createCameoCharacter(candidate, context)
      introductionType = 'cameo'
      confidence = 0.4
    }
    
    // Register new character
    this.knownCharacters.set(character.id, character)
    this.knownCharacters.set(character.name.toLowerCase(), character)
    this.introducedAt.set(character.id, context.pageNumber)
    
    return {
      character,
      isNew: true,
      confidence,
      introductionType,
    }
  }
  
  /**
   * Find existing character matching candidate
   */
  private findExisting(candidate: Partial<Character>): Character | undefined {
    if (candidate.name) {
      const byName = this.knownCharacters.get(candidate.name.toLowerCase())
      if (byName) return byName
    }
    
    if (candidate.aliases) {
      for (const alias of candidate.aliases) {
        const byAlias = this.knownCharacters.get(alias.toLowerCase())
        if (byAlias) return byAlias
      }
    }
    
    return undefined
  }
  
  /**
   * Create named character
   */
  private createNamedCharacter(
    candidate: Partial<Character>,
    context: IntroductionContext
  ): Character {
    const id = candidate.id || this.generateId(candidate.name!)
    
    return {
      id,
      name: candidate.name!,
      aliases: candidate.aliases || [],
      description: candidate.description || 'Character introduced mid-story',
      firstAppearance: context.pageNumber,
      importance: candidate.importance || 'supporting',
      appearance: candidate.appearance,
      personality: candidate.personality,
    }
  }
  
  /**
   * Create descriptive character (unnamed)
   */
  private createDescriptiveCharacter(
    candidate: Partial<Character>,
    context: IntroductionContext
  ): Character {
    const descriptor = parseVisualDescription(candidate.description || '')
    const descriptiveId = generateDescriptiveId(descriptor)
    
    return {
      id: descriptiveId.id,
      name: descriptiveId.displayName,
      aliases: candidate.aliases || [],
      description: candidate.description || 'Unnamed character',
      firstAppearance: context.pageNumber,
      importance: 'minor',
      appearance: candidate.appearance || candidate.description,
      personality: candidate.personality,
    }
  }
  
  /**
   * Create cameo character
   */
  private createCameoCharacter(
    candidate: Partial<Character>,
    context: IntroductionContext
  ): Character {
    const pageRef = `page-${context.pageNumber}`
    
    return {
      id: `char-cameo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: candidate.name || `Background Figure (${pageRef})`,
      aliases: [],
      description: candidate.description || 'Brief appearance in background',
      firstAppearance: context.pageNumber,
      importance: 'minor',
    }
  }
  
  /**
   * Generate character ID
   */
  private generateId(name: string): string {
    const normalized = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
    
    return `char-${normalized}-${Date.now().toString(36)}`
  }
  
  /**
   * Get introduction type for existing character
   */
  private getIntroductionType(character: Character): IntroductionResult['introductionType'] {
    if (character.name.toLowerCase().includes('character') ||
        character.name.toLowerCase().includes('figure')) {
      return 'descriptive'
    }
    if (character.importance === 'minor' && !character.personality) {
      return 'cameo'
    }
    return 'named'
  }
  
  /**
   * Check if character was introduced at specific page
   */
  wasIntroducedAt(characterId: string, pageNumber: number): boolean {
    return this.introducedAt.get(characterId) === pageNumber
  }
  
  /**
   * Get introduction page for character
   */
  getIntroductionPage(characterId: string): number | undefined {
    return this.introducedAt.get(characterId)
  }
  
  /**
   * Get all characters introduced after a page
   */
  getCharactersIntroducedAfter(pageNumber: number): Character[] {
    const result: Character[] = []
    
    for (const [id, introPage] of this.introducedAt) {
      if (introPage > pageNumber) {
        const char = this.knownCharacters.get(id)
        if (char) result.push(char)
      }
    }
    
    return result
  }
  
  /**
   * Get introduction statistics
   */
  getStatistics(): {
    totalIntroduced: number
    byType: Record<string, number>
    byImportance: Record<string, number>
  } {
    const stats = {
      totalIntroduced: this.knownCharacters.size / 3, // Approximate (stored by id, name, aliases)
      byType: { named: 0, descriptive: 0, cameo: 0 },
      byImportance: { major: 0, supporting: 0, minor: 0 },
    }
    
    const seen = new Set<string>()
    
    for (const char of this.knownCharacters.values()) {
      if (seen.has(char.id)) continue
      seen.add(char.id)
      
      // Type (approximate based on name)
      if (char.name.toLowerCase().includes('character') || 
          char.name.toLowerCase().includes('figure')) {
        stats.byType.descriptive++
      } else if (char.importance === 'minor' && !char.personality) {
        stats.byType.cameo++
      } else {
        stats.byType.named++
      }
      
      // Importance
      stats.byImportance[char.importance]++
    }
    
    return stats
  }
}
