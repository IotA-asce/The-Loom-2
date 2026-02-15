/**
 * Image format optimization utilities
 */

export interface OptimizationOptions {
  format?: 'webp' | 'jpeg' | 'png'
  quality?: number
  maxWidth?: number
  maxHeight?: number
}

/**
 * Convert image to optimized format (WebP preferred)
 */
export async function optimizeImageFormat(
  source: HTMLImageElement | string,
  options: OptimizationOptions = {}
): Promise<string> {
  const {
    format = 'webp',
    quality = 0.85,
    maxWidth = 1920,
    maxHeight = 1080,
  } = options

  const img =
    typeof source === 'string'
      ? await loadImage(source)
      : (source as HTMLImageElement)

  // Calculate dimensions
  let { width, height } = img
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height)
    width *= ratio
    height *= ratio
  }

  // Create canvas
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  ctx.drawImage(img, 0, 0, width, height)

  // Convert to target format
  const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'png' ? 'image/png' : 'image/webp'

  return canvas.toDataURL(mimeType, quality)
}

/**
 * Load image from URL
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

/**
 * Calculate optimal compression for target file size
 */
export function calculateOptimalQuality(
  currentSize: number,
  targetSize: number
): number {
  if (currentSize <= targetSize) return 0.95

  const ratio = targetSize / currentSize
  return Math.max(0.5, Math.min(0.95, ratio * 0.9))
}

/**
 * Check if browser supports WebP
 */
export function supportsWebP(): boolean {
  const canvas = document.createElement('canvas')
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
}

/**
 * Get optimal format based on browser support
 */
export function getOptimalFormat(): 'webp' | 'jpeg' {
  return supportsWebP() ? 'webp' : 'jpeg'
}
