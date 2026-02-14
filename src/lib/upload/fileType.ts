/**
 * File type detection utility for manga uploads
 */

export type FileType = 'cbz' | 'cbr' | 'pdf' | 'image' | 'unknown'

export interface FileTypeInfo {
  type: FileType
  mimeType: string
  extension: string
}

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.tiff']

const MIME_TYPES: Record<string, string> = {
  cbz: 'application/vnd.comicbook+zip',
  cbr: 'application/vnd.comicbook-rar',
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
}

/**
 * Detect file type from filename and/or content
 */
export function detectFileType(filename: string): FileTypeInfo {
  const lowerName = filename.toLowerCase()
  const extension = lowerName.substring(lowerName.lastIndexOf('.'))

  // Archive formats
  if (lowerName.endsWith('.cbz') || lowerName.endsWith('.zip')) {
    return { type: 'cbz', mimeType: MIME_TYPES.cbz, extension }
  }

  if (lowerName.endsWith('.cbr') || lowerName.endsWith('.rar')) {
    return { type: 'cbr', mimeType: MIME_TYPES.cbr, extension }
  }

  // PDF
  if (lowerName.endsWith('.pdf')) {
    return { type: 'pdf', mimeType: MIME_TYPES.pdf, extension }
  }

  // Images
  if (IMAGE_EXTENSIONS.some(ext => lowerName.endsWith(ext))) {
    const ext = extension.replace('.', '')
    return {
      type: 'image',
      mimeType: MIME_TYPES[ext] || 'image/unknown',
      extension,
    }
  }

  return { type: 'unknown', mimeType: 'application/octet-stream', extension }
}

/**
 * Check if file is a supported manga format
 */
export function isSupportedMangaFile(filename: string): boolean {
  const info = detectFileType(filename)
  return info.type !== 'unknown'
}

/**
 * Get all supported file extensions
 */
export function getSupportedExtensions(): string[] {
  return ['.cbz', '.zip', '.cbr', '.rar', '.pdf', ...IMAGE_EXTENSIONS]
}

/**
 * Validate file size (max 500MB for archives, 50MB for images)
 */
export function validateFileSize(file: File): { valid: boolean; error?: string } {
  const info = detectFileType(file.name)
  const maxSize = info.type === 'image' ? 50 * 1024 * 1024 : 500 * 1024 * 1024

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB`,
    }
  }

  return { valid: true }
}
