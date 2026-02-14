/**
 * Image processing utilities
 */

export interface ImageDimensions {
  width: number
  height: number
}

export interface ThumbnailOptions {
  width: number
  height: number
  quality?: number
}

/**
 * Natural sort algorithm for filenames
 * Handles numbers correctly (e.g., page1, page2, page10)
 */
export function naturalSort(a: string, b: string): number {
  const re = /(\d+)|(\D+)/g
  const aParts = a.match(re) || []
  const bParts = b.match(re) || []

  for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
    const aPart = aParts[i]
    const bPart = bParts[i]

    const aNum = parseInt(aPart, 10)
    const bNum = parseInt(bPart, 10)

    if (!isNaN(aNum) && !isNaN(bNum)) {
      if (aNum !== bNum) return aNum - bNum
    } else {
      const cmp = aPart.localeCompare(bPart)
      if (cmp !== 0) return cmp
    }
  }

  return aParts.length - bParts.length
}

/**
 * Generate thumbnail from image
 */
export async function generateThumbnail(
  imageUrl: string,
  options: ThumbnailOptions = { width: 200, height: 280, quality: 0.7 }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = options.width
      canvas.height = options.height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // Calculate cover fit
      const scale = Math.max(
        options.width / img.width,
        options.height / img.height
      )
      const x = (options.width - img.width * scale) / 2
      const y = (options.height - img.height * scale) / 2

      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, options.width, options.height)
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale)

      resolve(canvas.toDataURL('image/webp', options.quality))
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageUrl
  })
}

/**
 * Validate image file
 */
export async function validateImage(file: File): Promise<boolean> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(true)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(false)
    }

    img.src = url
  })
}

/**
 * Detect double-page spread (image wider than tall)
 */
export function isDoublePageSpread(width: number, height: number): boolean {
  return width / height > 1.3
}

/**
 * Get image orientation
 */
export function getImageOrientation(width: number, height: number): 'portrait' | 'landscape' | 'square' {
  if (width === height) return 'square'
  return width > height ? 'landscape' : 'portrait'
}
