/**
 * Version retention system
 */

import type { Chapter } from '@/lib/db/schema'

export interface VersionRetentionPolicy {
  maxVersions: number // 0 = unlimited
  retentionPeriod: number // days, 0 = forever
  autoPrune: boolean
  keepApproved: boolean
  keepTagged: boolean
}

export interface RetainedVersion {
  id: string
  chapterId: string
  versionNumber: number
  content: string
  metadata: {
    createdAt: Date
    author: 'user' | 'ai'
    isApproved: boolean
    tags: string[]
    description: string
  }
  storage: {
    compressed: boolean
    size: number
    checksum: string
  }
}

/**
 * Default retention policies
 */
export const RETENTION_POLICIES = {
  all: {
    maxVersions: 0,
    retentionPeriod: 0,
    autoPrune: false,
    keepApproved: true,
    keepTagged: true,
  } as VersionRetentionPolicy,
  
  moderate: {
    maxVersions: 50,
    retentionPeriod: 365,
    autoPrune: true,
    keepApproved: true,
    keepTagged: true,
  } as VersionRetentionPolicy,
  
  minimal: {
    maxVersions: 10,
    retentionPeriod: 90,
    autoPrune: true,
    keepApproved: true,
    keepTagged: false,
  } as VersionRetentionPolicy,
}

/**
 * Create a retained version
 */
export function createRetainedVersion(
  chapter: Chapter,
  content: string,
  options: {
    author?: 'user' | 'ai'
    isApproved?: boolean
    tags?: string[]
    description?: string
  } = {}
): RetainedVersion {
  const versionNumber = (chapter as Chapter & { version?: number }).version ?? 1
  
  return {
    id: `ver-${chapter.id ?? 'unknown'}-${versionNumber}-${Date.now()}`,
    chapterId: chapter.id ?? '',
    versionNumber,
    content,
    metadata: {
      createdAt: new Date(),
      author: options.author || 'ai',
      isApproved: options.isApproved || false,
      tags: options.tags || [],
      description: options.description || `Version ${versionNumber}`,
    },
    storage: {
      compressed: false,
      size: new Blob([content]).size,
      checksum: computeChecksum(content),
    },
  }
}

function computeChecksum(content: string): string {
  // Simple checksum - would use proper hash in production
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}

/**
 * Apply retention policy
 */
export function applyRetentionPolicy(
  versions: RetainedVersion[],
  policy: VersionRetentionPolicy
): { keep: RetainedVersion[]; remove: RetainedVersion[] } {
  let candidates = [...versions]
  
  // Sort by date (newest first)
  candidates.sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime())
  
  const keep: RetainedVersion[] = []
  const remove: RetainedVersion[] = []
  
  // Always keep approved versions if policy says so
  if (policy.keepApproved) {
    const approved = candidates.filter(v => v.metadata.isApproved)
    keep.push(...approved)
    candidates = candidates.filter(v => !v.metadata.isApproved)
  }
  
  // Always keep tagged versions if policy says so
  if (policy.keepTagged) {
    const tagged = candidates.filter(v => v.metadata.tags.length > 0)
    keep.push(...tagged)
    candidates = candidates.filter(v => v.metadata.tags.length === 0)
  }
  
  // Apply max versions limit
  if (policy.maxVersions > 0) {
    const remainingSlots = Math.max(0, policy.maxVersions - keep.length)
    keep.push(...candidates.slice(0, remainingSlots))
    remove.push(...candidates.slice(remainingSlots))
  } else {
    keep.push(...candidates)
  }
  
  // Apply retention period
  if (policy.retentionPeriod > 0) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriod)
    
    const expired = keep.filter(v => v.metadata.createdAt < cutoffDate)
    keep.push(...expired)
    // Don't actually remove - just mark for archival
  }
  
  return { keep, remove }
}

/**
 * Tag a version
 */
export function tagVersion(
  version: RetainedVersion,
  tag: string
): RetainedVersion {
  if (version.metadata.tags.includes(tag)) {
    return version
  }
  
  return {
    ...version,
    metadata: {
      ...version.metadata,
      tags: [...version.metadata.tags, tag],
    },
  }
}

/**
 * Untag a version
 */
export function untagVersion(
  version: RetainedVersion,
  tag: string
): RetainedVersion {
  return {
    ...version,
    metadata: {
      ...version.metadata,
      tags: version.metadata.tags.filter(t => t !== tag),
    },
  }
}

/**
 * Mark version as approved
 */
export function approveVersion(version: RetainedVersion): RetainedVersion {
  return {
    ...version,
    metadata: {
      ...version.metadata,
      isApproved: true,
    },
  }
}

/**
 * Find version by tag
 */
export function findVersionsByTag(
  versions: RetainedVersion[],
  tag: string
): RetainedVersion[] {
  return versions.filter(v => v.metadata.tags.includes(tag))
}

/**
 * Compare two versions
 */
export function compareVersions(
  versionA: RetainedVersion,
  versionB: RetainedVersion
): {
  contentDiff: string
  metadataChanges: Array<{ field: string; old: unknown; new: unknown }>
} {
  // Simple diff - would use proper diff in production
  const diff: string[] = []
  
  if (versionA.content !== versionB.content) {
    diff.push('Content differs')
  }
  
  const metadataChanges: Array<{ field: string; old: unknown; new: unknown }> = []
  
  if (versionA.metadata.isApproved !== versionB.metadata.isApproved) {
    metadataChanges.push({
      field: 'approved',
      old: versionA.metadata.isApproved,
      new: versionB.metadata.isApproved,
    })
  }
  
  return {
    contentDiff: diff.join('\n'),
    metadataChanges,
  }
}

/**
 * Get version statistics
 */
export function getVersionStats(versions: RetainedVersion[]): {
  total: number
  approved: number
  byAuthor: Record<string, number>
  byTag: Record<string, number>
  totalSize: number
} {
  const stats = {
    total: versions.length,
    approved: versions.filter(v => v.metadata.isApproved).length,
    byAuthor: {} as Record<string, number>,
    byTag: {} as Record<string, number>,
    totalSize: versions.reduce((sum, v) => sum + v.storage.size, 0),
  }
  
  for (const version of versions) {
    stats.byAuthor[version.metadata.author] = 
      (stats.byAuthor[version.metadata.author] || 0) + 1
    
    for (const tag of version.metadata.tags) {
      stats.byTag[tag] = (stats.byTag[tag] || 0) + 1
    }
  }
  
  return stats
}

/**
 * Export version for backup
 */
export function exportVersion(version: RetainedVersion): object {
  return {
    ...version,
    metadata: {
      ...version.metadata,
      createdAt: version.metadata.createdAt.toISOString(),
    },
  }
}
