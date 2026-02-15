/**
 * Extract anchor event details for branch context
 */

import type { AnchorEvent, AlternativeOutcome } from '@/lib/db/schema'

export interface AnchorDetails {
  id: string
  title: string
  description: string
  type: AnchorEvent['type']
  significance: AnchorEvent['significance']
  pageNumber: number
  selectedAlternative: AlternativeOutcome
  allAlternatives: AlternativeOutcome[]
  characters: string[]
}

/**
 * Extract anchor event details for branch generation
 */
export function extractAnchorDetails(
  anchor: AnchorEvent,
  selectedAlternativeId: string
): AnchorDetails {
  const selectedAlternative = anchor.alternatives.find(
    a => a.id === selectedAlternativeId
  )
  
  if (!selectedAlternative) {
    throw new Error(`Alternative ${selectedAlternativeId} not found for anchor ${anchor.id}`)
  }
  
  return {
    id: anchor.id!,
    title: anchor.title,
    description: anchor.description,
    type: anchor.type,
    significance: anchor.significance,
    pageNumber: anchor.pageNumber,
    selectedAlternative,
    allAlternatives: anchor.alternatives,
    characters: anchor.characters,
  }
}

/**
 * Get anchor type description for context
 */
export function getAnchorTypeDescription(type: AnchorEvent['type']): string {
  const descriptions: Record<AnchorEvent['type'], string> = {
    decision: 'A critical choice point where characters must decide between options',
    coincidence: 'An unexpected event that occurs by chance',
    revelation: 'A moment of discovery where hidden information is revealed',
    betrayal: 'An act of disloyalty or breaking trust',
    sacrifice: 'A moment where something valuable is given up',
    encounter: 'A significant meeting between characters',
    conflict: 'A clash between opposing forces or interests',
    transformation: 'A fundamental change in character or situation',
    mystery: 'An unexplained event that creates intrigue',
 }
  
  return descriptions[type]
}
