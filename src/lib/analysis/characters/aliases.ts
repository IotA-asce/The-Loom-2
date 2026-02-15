/**
 * Alias resolution system
 * Maps various names to canonical character identities
 */

import { Character } from '@/lib/db/schema'

export interface AliasMapping {
  canonicalName: string
  characterId: string
  aliases: string[]
  nameVariants: string[]
}

export interface AliasResolver {
  resolve(name: string): AliasMapping | undefined
  addMapping(mapping: AliasMapping): void
  getAllAliases(characterId: string): string[]
}

/**
 * Alias resolver implementation
 */
export class CharacterAliasResolver implements AliasResolver {
  private nameToMapping = new Map<string, AliasMapping>()
  private idToMapping = new Map<string, AliasMapping>()
  
  /**
   * Build resolver from character list
   */
  static fromCharacters(characters: Character[]): CharacterAliasResolver {
    const resolver = new CharacterAliasResolver()
    
    for (const char of characters) {
      const mapping: AliasMapping = {
        canonicalName: char.name,
        characterId: char.id,
        aliases: char.aliases,
        nameVariants: generateNameVariants(char.name),
      }
      resolver.addMapping(mapping)
    }
    
    return resolver
  }
  
  /**
   * Resolve a name to its mapping
   */
  resolve(name: string): AliasMapping | undefined {
    const normalized = normalizeName(name)
    
    // Direct lookup
    if (this.nameToMapping.has(normalized)) {
      return this.nameToMapping.get(normalized)
    }
    
    // Fuzzy match
    for (const [key, mapping] of this.nameToMapping) {
      if (isNameMatch(normalized, key)) {
        return mapping
      }
    }
    
    return undefined
  }
  
  /**
   * Add a mapping
   */
  addMapping(mapping: AliasMapping): void {
    // Index by canonical name
    this.nameToMapping.set(normalizeName(mapping.canonicalName), mapping)
    this.idToMapping.set(mapping.characterId, mapping)
    
    // Index by aliases
    for (const alias of mapping.aliases) {
      this.nameToMapping.set(normalizeName(alias), mapping)
    }
    
    // Index by variants
    for (const variant of mapping.nameVariants) {
      this.nameToMapping.set(normalizeName(variant), mapping)
    }
  }
  
  /**
   * Get all aliases for a character
   */
  getAllAliases(characterId: string): string[] {
    const mapping = this.idToMapping.get(characterId)
    if (!mapping) return []
    
    return [
      mapping.canonicalName,
      ...mapping.aliases,
      ...mapping.nameVariants,
    ]
  }
  
  /**
   * Check if a name refers to a known character
   */
  isKnown(name: string): boolean {
    return this.resolve(name) !== undefined
  }
  
  /**
   * Get canonical name for a reference
   */
  getCanonicalName(name: string): string | undefined {
    return this.resolve(name)?.canonicalName
  }
  
  /**
   * Get character ID for a reference
   */
  getCharacterId(name: string): string | undefined {
    return this.resolve(name)?.characterId
  }
}

/**
 * Generate name variants (honorifics, shortened forms, etc.)
 */
function generateNameVariants(name: string): string[] {
  const variants: string[] = []
  const parts = name.split(' ')
  
  // First name only
  if (parts.length > 1) {
    variants.push(parts[0])
  }
  
  // Last name only
  if (parts.length > 1) {
    variants.push(parts[parts.length - 1])
  }
  
  // Common honorifics
  const honorifics = ['-san', '-kun', '-chan', '-sama', '-sensei']
  for (const honorific of honorifics) {
    variants.push(name + honorific)
    if (parts.length > 0) {
      variants.push(parts[0] + honorific)
    }
  }
  
  // Lowercase variant
  variants.push(name.toLowerCase())
  
  return [...new Set(variants)]
}

/**
 * Normalize name for comparison
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s\-_.]+/g, ' ')
    .replace(/\s+/g, ' ')
}

/**
 * Check if two names match (fuzzy)
 */
function isNameMatch(name1: string, name2: string): boolean {
  if (name1 === name2) return true
  
  // Check if one contains the other
  if (name1.includes(name2) || name2.includes(name1)) return true
  
  // Levenshtein distance for minor typos
  const distance = levenshteinDistance(name1, name2)
  const maxLen = Math.max(name1.length, name2.length)
  
  return distance / maxLen < 0.3 // 30% tolerance
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[b.length][a.length]
}

/**
 * Resolve aliases in text
 */
export function resolveAliasesInText(
  text: string,
  resolver: AliasResolver
): Array<{
  start: number
  end: number
  name: string
  characterId?: string
}> {
  const matches: Array<{ start: number; end: number; name: string; characterId?: string }> = []
  
  // Simple word-based extraction (can be improved with NLP)
  const words = text.split(/(\s+)/)
  let position = 0
  
  for (const word of words) {
    if (/\s+/.test(word)) {
      position += word.length
      continue
    }
    
    const mapping = resolver.resolve(word)
    if (mapping) {
      matches.push({
        start: position,
        end: position + word.length,
        name: word,
        characterId: mapping.characterId,
      })
    }
    
    position += word.length
  }
  
  return matches
}
