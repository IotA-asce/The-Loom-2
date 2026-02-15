/**
 * Per-character knowledge database
 */

export interface KnowledgeEntry {
  id: string
  characterId: string
  fact: string
  source: 'observed' | 'told' | 'inferred' | 'assumed'
  sourceChapterId?: string
  confidence: 'certain' | 'likely' | 'uncertain'
  timestamp: Date
  revealedInChapter?: string
}

export interface CharacterKnowledge {
  characterId: string
  characterName: string
  knownFacts: Map<string, KnowledgeEntry>
  beliefs: Map<string, KnowledgeEntry> // What they think they know (may be wrong)
  secrets: Map<string, KnowledgeEntry> // Things they know but haven't shared
}

/**
 * Knowledge database for all characters
 */
export class CharacterKnowledgeDatabase {
  private knowledge = new Map<string, CharacterKnowledge>()
  
  /**
   * Initialize knowledge for a character
   */
  initializeCharacter(characterId: string, characterName: string): void {
    this.knowledge.set(characterId, {
      characterId,
      characterName,
      knownFacts: new Map(),
      beliefs: new Map(),
      secrets: new Map(),
    })
  }
  
  /**
   * Add knowledge to a character
   */
  addKnowledge(
    characterId: string,
    fact: string,
    options: {
      source?: KnowledgeEntry['source']
      sourceChapterId?: string
      confidence?: KnowledgeEntry['confidence']
      isSecret?: boolean
    } = {}
  ): KnowledgeEntry {
    let character = this.knowledge.get(characterId)
    if (!character) {
      this.initializeCharacter(characterId, characterId)
      character = this.knowledge.get(characterId)!
    }
    
    const entry: KnowledgeEntry = {
      id: `k-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      characterId,
      fact,
      source: options.source || 'observed',
      sourceChapterId: options.sourceChapterId,
      confidence: options.confidence || 'certain',
      timestamp: new Date(),
    }
    
    if (options.isSecret) {
      character.secrets.set(fact, entry)
    } else {
      character.knownFacts.set(fact, entry)
    }
    
    return entry
  }
  
  /**
   * Get all known facts for a character
   */
  getKnownFacts(characterId: string): KnowledgeEntry[] {
    const character = this.knowledge.get(characterId)
    if (!character) return []
    
    return [...character.knownFacts.values()]
  }
  
  /**
   * Get all beliefs for a character
   */
  getBeliefs(characterId: string): KnowledgeEntry[] {
    const character = this.knowledge.get(characterId)
    if (!character) return []
    
    return [...character.beliefs.values()]
  }
  
  /**
   * Get all secrets for a character
   */
  getSecrets(characterId: string): KnowledgeEntry[] {
    const character = this.knowledge.get(characterId)
    if (!character) return []
    
    return [...character.secrets.values()]
  }
  
  /**
   * Check if character knows a fact
   */
  knows(characterId: string, fact: string): boolean {
    const character = this.knowledge.get(characterId)
    if (!character) return false
    
    return character.knownFacts.has(fact) || character.beliefs.has(fact)
  }
  
  /**
   * Reveal a secret
   */
  revealSecret(
    characterId: string,
    fact: string,
    revealedInChapter: string
  ): boolean {
    const character = this.knowledge.get(characterId)
    if (!character) return false
    
    const secret = character.secrets.get(fact)
    if (!secret) return false
    
    secret.revealedInChapter = revealedInChapter
    character.knownFacts.set(fact, secret)
    character.secrets.delete(fact)
    
    return true
  }
  
  /**
   * Share knowledge between characters
   */
  shareKnowledge(
    fromCharacterId: string,
    toCharacterId: string,
    fact: string,
    chapterId: string
  ): boolean {
    const fromCharacter = this.knowledge.get(fromCharacterId)
    if (!fromCharacter) return false
    
    const factEntry = fromCharacter.knownFacts.get(fact)
    if (!factEntry) return false
    
    this.addKnowledge(toCharacterId, fact, {
      source: 'told',
      sourceChapterId: chapterId,
      confidence: factEntry.confidence,
    })
    
    return true
  }
  
  /**
   * Get shared knowledge between characters
   */
  getSharedKnowledge(characterIds: string[]): string[] {
    const allFacts = new Set<string>()
    const characterFacts = new Map<string, Set<string>>()
    
    for (const charId of characterIds) {
      const character = this.knowledge.get(charId)
      if (character) {
        const facts = new Set([...character.knownFacts.keys()])
        characterFacts.set(charId, facts)
        
        for (const fact of facts) {
          allFacts.add(fact)
        }
      }
    }
    
    // Return facts known by all
    const shared: string[] = []
    for (const fact of allFacts) {
      const knownByAll = characterIds.every(charId => 
        characterFacts.get(charId)?.has(fact)
      )
      if (knownByAll) {
        shared.push(fact)
      }
    }
    
    return shared
  }
  
  /**
   * Get unique knowledge (secrets) for a character
   */
  getUniqueKnowledge(characterId: string): string[] {
    const character = this.knowledge.get(characterId)
    if (!character) return []
    
    const unique: string[] = []
    
    for (const [fact, _] of character.knownFacts) {
      // Check if any other character knows this
      let knownByOthers = false
      
      for (const [otherId, otherChar] of this.knowledge) {
        if (otherId !== characterId && otherChar.knownFacts.has(fact)) {
          knownByOthers = true
          break
        }
      }
      
      if (!knownByOthers) {
        unique.push(fact)
      }
    }
    
    return unique
  }
  
  /**
   * Export knowledge for a character
   */
  exportCharacterKnowledge(characterId: string): object {
    const character = this.knowledge.get(characterId)
    if (!character) return {}
    
    return {
      characterId,
      characterName: character.characterName,
      knownFacts: [...character.knownFacts.entries()],
      beliefs: [...character.beliefs.entries()],
      secrets: [...character.secrets.entries()].map(([k, v]) => [k, { ...v, fact: '[REDACTED]' }]),
    }
  }
  
  /**
   * Get knowledge timeline
   */
  getKnowledgeTimeline(characterId: string): KnowledgeEntry[] {
    const facts = this.getKnownFacts(characterId)
    
    return facts.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }
  
  /**
   * Validate dialogue knowledge
   */
  validateDialogueKnowledge(
    characterId: string,
    dialogue: string
  ): { valid: boolean; unknownReferences: string[] } {
    const character = this.knowledge.get(characterId)
    if (!character) return { valid: false, unknownReferences: [] }
    
    const unknownReferences: string[] = []
    
    // Check each known fact
    for (const [fact, _] of character.knownFacts) {
      if (dialogue.toLowerCase().includes(fact.toLowerCase())) {
        // Referenced fact is known - OK
        continue
      }
    }
    
    // Check for references to facts the character doesn't know
    for (const [charId, charKnowledge] of this.knowledge) {
      if (charId === characterId) continue
      
      for (const [fact, _] of charKnowledge.knownFacts) {
        if (dialogue.toLowerCase().includes(fact.toLowerCase()) && 
            !character.knownFacts.has(fact)) {
          unknownReferences.push(fact)
        }
      }
    }
    
    return {
      valid: unknownReferences.length === 0,
      unknownReferences,
    }
  }
}

/**
 * Create knowledge database from chapters
 */
export function createKnowledgeDatabaseFromChapters(
  chapters: Array<{ characters: string[]; summary: string; id: string }>
): CharacterKnowledgeDatabase {
  const db = new CharacterKnowledgeDatabase()
  
  for (const chapter of chapters) {
    // Initialize all characters
    for (const charId of chapter.characters) {
      if (!db.getKnownFacts(charId).length) {
        db.initializeCharacter(charId, charId)
      }
    }
    
    // Extract and assign knowledge from chapter summary
    // In real implementation, use NLP to extract facts
    const extractedFacts = extractFactsFromText(chapter.summary)
    
    for (const fact of extractedFacts) {
      for (const charId of chapter.characters) {
        db.addKnowledge(charId, fact, {
          source: 'observed',
          sourceChapterId: chapter.id,
        })
      }
    }
  }
  
  return db
}

function extractFactsFromText(text: string): string[] {
  // Simplified fact extraction
  const facts: string[] = []
  
  // Look for "X is Y" or "X did Y" patterns
  const matches = text.match(/\b(\w+)\s+(is|did|was|has|said)\s+([^.,]+)/gi)
  if (matches) {
    facts.push(...matches)
  }
  
  return facts.slice(0, 10) // Limit facts per chapter
}
