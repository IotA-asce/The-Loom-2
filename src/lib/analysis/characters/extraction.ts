/**
 * Character extraction from analysis responses
 * Extracts and normalizes character data
 */

import { Character } from '@/lib/db/schema'
import { ParsedCharacter } from '../parser/validation'

export interface ExtractionContext {
  batchIndex: number
  pageOffset: number
  existingCharacters: Map<string, Character>
}

export interface ExtractedCharacter extends Character {
  sourceBatch: number
  extractionConfidence: number
  isNew: boolean
}

/**
 * Extract characters from parsed data
 */
export function extractCharacters(
  parsed: ParsedCharacter[],
  context: ExtractionContext
): ExtractedCharacter[] {
  return parsed.map(parsedChar => {
    const existing = findExistingCharacter(parsedChar, context.existingCharacters)
    const isNew = !existing
    
    const character: ExtractedCharacter = {
      id: existing?.id || generateCharacterId(parsedChar),
      name: normalizeName(parsedChar.name),
      aliases: normalizeAliases(parsedChar.aliases),
      description: parsedChar.description,
      firstAppearance: existing?.firstAppearance ?? 
        (parsedChar.firstAppearance + context.pageOffset),
      importance: parsedChar.importance,
      appearance: parsedChar.appearance,
      personality: parsedChar.personality,
      sourceBatch: context.batchIndex,
      extractionConfidence: parsedChar.confidence || 0.5,
      isNew,
    }
    
    return character
  })
}

/**
 * Generate unique character ID
 */
function generateCharacterId(character: ParsedCharacter): string {
  const normalized = character.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  
  return `char-${normalized}-${Date.now().toString(36)}`
}

/**
 * Find existing character by name or alias
 */
function findExistingCharacter(
  parsed: ParsedCharacter,
  existing: Map<string, Character>
): Character | undefined {
  const normalizedName = normalizeName(parsed.name).toLowerCase()
  
  for (const char of existing.values()) {
    // Direct name match
    if (char.name.toLowerCase() === normalizedName) {
      return char
    }
    
    // Alias match
    if (char.aliases.some(alias => 
      alias.toLowerCase() === normalizedName
    )) {
      return char
    }
    
    // Parsed aliases match existing name/aliases
    for (const alias of parsed.aliases) {
      const normalizedAlias = alias.toLowerCase()
      if (char.name.toLowerCase() === normalizedAlias ||
          char.aliases.some(a => a.toLowerCase() === normalizedAlias)) {
        return char
      }
    }
  }
  
  return undefined
}

/**
 * Normalize character name
 */
function normalizeName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Normalize aliases
 */
function normalizeAliases(aliases: string[]): string[] {
  return [...new Set(aliases.map(normalizeName).filter(a => a.length > 0))]
}

/**
 * Merge character data from multiple batches
 */
export function mergeCharacterData(
  characters: ExtractedCharacter[]
): Map<string, ExtractedCharacter> {
  const merged = new Map<string, ExtractedCharacter>()
  
  for (const char of characters) {
    const existing = merged.get(char.id)
    
    if (!existing) {
      merged.set(char.id, char)
    } else {
      // Merge data, keeping earliest appearance and highest confidence
      merged.set(char.id, {
        ...existing,
        // Keep earlier first appearance
        firstAppearance: Math.min(existing.firstAppearance, char.firstAppearance),
        // Merge aliases
        aliases: [...new Set([...existing.aliases, ...char.aliases])],
        // Keep higher confidence description
        description: char.extractionConfidence > existing.extractionConfidence
          ? char.description
          : existing.description,
        // Update confidence
        extractionConfidence: Math.max(existing.extractionConfidence, char.extractionConfidence),
      })
    }
  }
  
  return merged
}

/**
 * Character extraction statistics
 */
export interface ExtractionStats {
  totalExtracted: number
  newCharacters: number
  existingCharacters: number
  confidenceDistribution: Record<string, number>
}

/**
 * Calculate extraction statistics
 */
export function calculateStats(characters: ExtractedCharacter[]): ExtractionStats {
  const stats: ExtractionStats = {
    totalExtracted: characters.length,
    newCharacters: characters.filter(c => c.isNew).length,
    existingCharacters: characters.filter(c => !c.isNew).length,
    confidenceDistribution: {},
  }
  
  // Calculate confidence distribution
  const ranges = ['0.0-0.2', '0.2-0.4', '0.4-0.6', '0.6-0.8', '0.8-1.0']
  for (const range of ranges) {
    stats.confidenceDistribution[range] = 0
  }
  
  for (const char of characters) {
    const confidence = char.extractionConfidence
    if (confidence < 0.2) stats.confidenceDistribution['0.0-0.2']++
    else if (confidence < 0.4) stats.confidenceDistribution['0.2-0.4']++
    else if (confidence < 0.6) stats.confidenceDistribution['0.4-0.6']++
    else if (confidence < 0.8) stats.confidenceDistribution['0.6-0.8']++
    else stats.confidenceDistribution['0.8-1.0']++
  }
  
  return stats
}
