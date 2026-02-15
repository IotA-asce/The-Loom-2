/**
 * Privacy-first export-only sharing
 */

import type { ExportResult } from './export-formats'

export interface ShareConfig {
  includeMetadata: boolean
  includeAuthorNotes: boolean
  includeVersionHistory: boolean
  watermarkText?: string
  expirationDays?: number
  password?: string
}

export interface SharedStory {
  id: string
  title: string
  content: string | Blob
  format: string
  config: ShareConfig
  metadata: {
    createdAt: Date
    expiresAt?: Date
    accessCount: number
    lastAccessed?: Date
  }
  url?: string
}

/**
 * Create shareable story
 */
export function createShareableStory(
  title: string,
  exportResult: ExportResult,
  config: ShareConfig
): SharedStory {
  let content = exportResult.content
  
  // Add watermark if specified
  if (config.watermarkText) {
    content = addWatermark(content, config.watermarkText, exportResult.format)
  }
  
  // Remove metadata if not requested
  if (!config.includeMetadata && typeof content === 'string') {
    content = removeMetadata(content, exportResult.format)
  }
  
  const shared: SharedStory = {
    id: `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    content,
    format: exportResult.format,
    config,
    metadata: {
      createdAt: new Date(),
      accessCount: 0,
    },
  }
  
  // Set expiration if specified
  if (config.expirationDays) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + config.expirationDays)
    shared.metadata.expiresAt = expiresAt
  }
  
  return shared
}

function addWatermark(content: string | Blob, watermark: string, format: string): string | Blob {
  if (typeof content !== 'string') return content
  
  switch (format) {
    case 'txt':
      return `\n${'='.repeat(50)}\n${watermark}\n${'='.repeat(50)}\n\n${content}`
    case 'md':
      return `\n---\n*${watermark}*\n---\n\n${content}`
    case 'html':
      return content.replace('</body>', `<div class="watermark">${watermark}</div></body>`)
    default:
      return content
  }
}

function removeMetadata(content: string, format: string): string {
  switch (format) {
    case 'txt':
      return content.replace(/By [^\n]+/g, '').replace(/Created: [^\n]+/g, '')
    case 'md':
      return content.replace(/<!--[\s\S]*?-->/g, '')
    case 'html':
      return content.replace(/<meta[^>]*>/gi, '')
    default:
      return content
  }
}

/**
 * Generate share URL
 */
export function generateShareUrl(shared: SharedStory, baseUrl: string): string {
  const url = `${baseUrl}/share/${shared.id}`
  shared.url = url
  return url
}

/**
 * Access shared story
 */
export function accessSharedStory(shared: SharedStory): { 
  success: boolean
  content?: string | Blob
  error?: string
} {
  // Check expiration
  if (shared.metadata.expiresAt && new Date() > shared.metadata.expiresAt) {
    return { success: false, error: 'Share link has expired' }
  }
  
  // Update access stats
  shared.metadata.accessCount++
  shared.metadata.lastAccessed = new Date()
  
  return { success: true, content: shared.content }
}

/**
 * Verify password
 */
export function verifyPassword(shared: SharedStory, password: string): boolean {
  if (!shared.config.password) return true
  return shared.config.password === password
}

/**
 * Revoke share
 */
export function revokeShare(shared: SharedStory): SharedStory {
  return {
    ...shared,
    metadata: {
      ...shared.metadata,
      expiresAt: new Date(), // Expire immediately
    },
  }
}

/**
 * Get share statistics
 */
export function getShareStats(shared: SharedStory): {
  createdAt: Date
  expiresAt?: Date
  accessCount: number
  lastAccessed?: Date
  isExpired: boolean
} {
  return {
    createdAt: shared.metadata.createdAt,
    expiresAt: shared.metadata.expiresAt,
    accessCount: shared.metadata.accessCount,
    lastAccessed: shared.metadata.lastAccessed,
    isExpired: shared.metadata.expiresAt ? new Date() > shared.metadata.expiresAt : false,
  }
}

/**
 * Create export package (multiple formats)
 */
export interface ExportPackage {
  id: string
  title: string
  exports: ExportResult[]
  createdAt: Date
}

export function createExportPackage(
  title: string,
  exports: ExportResult[]
): ExportPackage {
  return {
    id: `package-${Date.now()}`,
    title,
    exports,
    createdAt: new Date(),
  }
}

/**
 * Download export package as ZIP
 */
export function downloadExportPackage(pkg: ExportPackage): void {
  // In production, use JSZip to create actual ZIP
  // For now, download first file only
  if (pkg.exports.length > 0) {
    const export_ = pkg.exports[0]
    const blob = new Blob([export_.content], { type: export_.mimeType })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = export_.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    URL.revokeObjectURL(url)
  }
}

/**
 * Privacy check
 */
export function checkPrivacyCompliance(content: string): {
  compliant: boolean
  issues: string[]
} {
  const issues: string[] = []
  
  // Check for potential PII patterns
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/
  
  if (emailPattern.test(content)) {
    issues.push('Potential email addresses found')
  }
  
  if (phonePattern.test(content)) {
    issues.push('Potential phone numbers found')
  }
  
  return {
    compliant: issues.length === 0,
    issues,
  }
}

/**
 * Sanitize for sharing
 */
export function sanitizeForSharing(content: string): string {
  // Remove potential PII
  return content
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
}
