/**
 * Full audit provenance
 * Tracks the complete history and lineage of analysis results
 */

import { AnalysisStage } from '../prompts'
import { Character, TimelineEvent, Theme, Relationship } from '@/lib/db/schema'

export interface ProvenanceEntry {
  id: string
  timestamp: number
  type: 'extraction' | 'merge' | 'transform' | 'validation' | 'export'
  stage: AnalysisStage
  inputs: string[] // IDs of input entities
  outputs: string[] // IDs of output entities
  parameters: Record<string, unknown>
  actor: 'system' | 'user' | 'llm'
  description: string
}

export interface EntityProvenance {
  entityId: string
  entityType: 'character' | 'event' | 'theme' | 'relationship'
  createdAt: number
  createdBy: ProvenanceEntry['id']
  modifiedBy: ProvenanceEntry['id'][]
  lineage: string[] // Chain of derivation
  sourceBatches: number[]
  confidence: number
}

export interface AuditTrail {
  analysisId: string
  startedAt: number
  completedAt?: number
  entries: ProvenanceEntry[]
  entityMap: Map<string, EntityProvenance>
  parameters: {
    provider: string
    model: string
    batchSize: number
    thoroughMode: boolean
  }
}

/**
 * Provenance tracker
 */
export class ProvenanceTracker {
  private trail: AuditTrail
  private entries: ProvenanceEntry[] = []
  private entityMap = new Map<string, EntityProvenance>()
  
  constructor(analysisId: string, parameters: AuditTrail['parameters']) {
    this.trail = {
      analysisId,
      startedAt: Date.now(),
      entries: [],
      entityMap: new Map(),
      parameters,
    }
  }
  
  /**
   * Record extraction from LLM
   */
  recordExtraction<T extends Character | TimelineEvent | Theme | Relationship>(
    stage: AnalysisStage,
    batchIndex: number,
    entities: T[],
    rawResponseHash: string
  ): void {
    const entry: ProvenanceEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      type: 'extraction',
      stage,
      inputs: [rawResponseHash],
      outputs: entities.map(e => e.id),
      parameters: { batchIndex },
      actor: 'llm',
      description: `Extracted ${entities.length} entities from batch ${batchIndex}`,
    }
    
    this.entries.push(entry)
    
    // Record entity provenance
    for (const entity of entities) {
      this.entityMap.set(entity.id, {
        entityId: entity.id,
        entityType: this.getEntityType(entity),
        createdAt: Date.now(),
        createdBy: entry.id,
        modifiedBy: [],
        lineage: [entry.id],
        sourceBatches: [batchIndex],
        confidence: (entity as { confidence?: number }).confidence || 0.5,
      })
    }
  }
  
  /**
   * Record merge operation
   */
  recordMerge<T extends Character | TimelineEvent>(
    stage: AnalysisStage,
    sourceEntities: T[],
    resultEntities: T[],
    mergeType: 'deduplication' | 'overlap' | 'conflict_resolution'
  ): void {
    const entry: ProvenanceEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      type: 'merge',
      stage,
      inputs: sourceEntities.map(e => e.id),
      outputs: resultEntities.map(e => e.id),
      parameters: { mergeType },
      actor: 'system',
      description: `${mergeType}: ${sourceEntities.length} -> ${resultEntities.length} entities`,
    }
    
    this.entries.push(entry)
    
    // Update provenance for result entities
    for (const entity of resultEntities) {
      const existing = this.entityMap.get(entity.id)
      if (existing) {
        existing.modifiedBy.push(entry.id)
        existing.lineage.push(entry.id)
      }
    }
  }
  
  /**
   * Record transformation
   */
  recordTransform(
    stage: AnalysisStage,
    inputIds: string[],
    outputIds: string[],
    transformType: string,
    parameters?: Record<string, unknown>
  ): void {
    const entry: ProvenanceEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      type: 'transform',
      stage,
      inputs: inputIds,
      outputs: outputIds,
      parameters: parameters || {},
      actor: 'system',
      description: transformType,
    }
    
    this.entries.push(entry)
  }
  
  /**
   * Record validation
   */
  recordValidation(
    stage: AnalysisStage,
    entityIds: string[],
    passed: boolean,
    issues?: string[]
  ): void {
    const entry: ProvenanceEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      type: 'validation',
      stage,
      inputs: entityIds,
      outputs: entityIds,
      parameters: { passed, issues },
      actor: 'system',
      description: passed ? 'Validation passed' : `Validation failed: ${issues?.length} issues`,
    }
    
    this.entries.push(entry)
  }
  
  /**
   * Record export/view generation
   */
  recordExport(
    viewType: string,
    sourceIds: string[],
    userInitiated: boolean = false
  ): void {
    const entry: ProvenanceEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      type: 'export',
      // @ts-expect-error - 'complete' is not a standard stage but valid for provenance
      stage: 'complete',
      inputs: sourceIds,
      outputs: [`view-${viewType}`],
      parameters: { viewType },
      actor: userInitiated ? 'user' : 'system',
      description: `Generated ${viewType} view`,
    }
    
    this.entries.push(entry)
  }
  
  /**
   * Get entity lineage
   */
  getLineage(entityId: string): ProvenanceEntry[] | null {
    const entity = this.entityMap.get(entityId)
    if (!entity) return null
    
    return entity.lineage
      .map(entryId => this.entries.find(e => e.id === entryId))
      .filter((e): e is ProvenanceEntry => e !== undefined)
  }
  
  /**
   * Get entities created in batch
   */
  getBatchEntities(batchIndex: number): EntityProvenance[] {
    return Array.from(this.entityMap.values())
      .filter(e => e.sourceBatches.includes(batchIndex))
  }
  
  /**
   * Get complete audit trail
   */
  getTrail(): AuditTrail {
    return {
      ...this.trail,
      entries: [...this.entries],
      entityMap: new Map(this.entityMap),
    }
  }
  
  /**
   * Finalize trail
   */
  finalize(): AuditTrail {
    this.trail.completedAt = Date.now()
    return this.getTrail()
  }
  
  /**
   * Export trail as report
   */
  exportReport(): {
    analysisId: string
    duration: number
    totalOperations: number
    entitiesCreated: number
    entitiesModified: number
    operationsByStage: Record<AnalysisStage, number>
    operationsByType: Record<ProvenanceEntry['type'], number>
  } {
    const completed = this.trail.completedAt || Date.now()
    const duration = completed - this.trail.startedAt
    
    const operationsByStage: Record<AnalysisStage, number> = {
      overview: 0,
      characters: 0,
      timeline: 0,
      relationships: 0,
      themes: 0,
    }
    
    const operationsByType: Record<ProvenanceEntry['type'], number> = {
      extraction: 0,
      merge: 0,
      transform: 0,
      validation: 0,
      export: 0,
    }
    
    for (const entry of this.entries) {
      operationsByStage[entry.stage]++
      operationsByType[entry.type]++
    }
    
    const entitiesModified = Array.from(this.entityMap.values())
      .filter(e => e.modifiedBy.length > 0).length
    
    return {
      analysisId: this.trail.analysisId,
      duration,
      totalOperations: this.entries.length,
      entitiesCreated: this.entityMap.size,
      entitiesModified,
      operationsByStage,
      operationsByType,
    }
  }
  
  /**
   * Get entity type
   */
  private getEntityType(entity: unknown): EntityProvenance['entityType'] {
    if ('firstAppearance' in (entity as Character)) return 'character'
    if ('pageNumber' in (entity as TimelineEvent)) return 'event'
    if ('keywords' in (entity as Theme)) return 'theme'
    if ('characterA' in (entity as Relationship)) return 'relationship'
    return 'character'
  }
}

/**
 * Create hash of raw response for tracking
 */
export function hashResponse(response: string): string {
  // Simple hash for tracking - in production use proper hashing
  let hash = 0
  for (let i = 0; i < response.length; i++) {
    const char = response.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `resp-${Math.abs(hash).toString(36)}`
}

/**
 * Verify data integrity using provenance
 */
export function verifyIntegrity(
  trail: AuditTrail,
  entityId: string
): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []
  const entity = trail.entityMap.get(entityId)
  
  if (!entity) {
    return { valid: false, issues: ['Entity not found in provenance'] }
  }
  
  // Check lineage completeness
  for (const entryId of entity.lineage) {
    const entry = trail.entries.find(e => e.id === entryId)
    if (!entry) {
      issues.push(`Missing provenance entry: ${entryId}`)
    }
  }
  
  // Check for gaps in modification history
  if (entity.modifiedBy.length > 0) {
    const lastModified = entity.modifiedBy[entity.modifiedBy.length - 1]
    const lastEntry = trail.entries.find(e => e.id === lastModified)
    if (!lastEntry) {
      issues.push('Incomplete modification history')
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
  }
}
