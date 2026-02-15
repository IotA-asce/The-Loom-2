/**
 * Auto-rotation detection and correction
 */

export interface RotationResult {
  angle: number
  confidence: number
  shouldRotate: boolean
}

/**
 * Detect if image needs rotation
 * Uses text orientation detection (placeholder)
 */
export function detectRotation(imageData: ImageData): RotationResult {
  // Placeholder for rotation detection
  // In production, would analyze text orientation, panel layout, etc.

  // Simplified: assume no rotation needed
  return {
    angle: 0,
    confidence: 0.9,
    shouldRotate: false,
  }
}

/**
 * Apply rotation to image
 */
export async function rotateImage(imageUrl: string, angle: number): Promise<string> {
  if (angle === 0) return imageUrl

  const img = await loadImage(imageUrl)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  // Calculate new dimensions for arbitrary rotation
  const rad = (angle * Math.PI) / 180
  const sin = Math.abs(Math.sin(rad))
  const cos = Math.abs(Math.cos(rad))

  canvas.width = img.naturalWidth * cos + img.naturalHeight * sin
  canvas.height = img.naturalWidth * sin + img.naturalHeight * cos

  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate(rad)
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)

  return canvas.toDataURL('image/webp')
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}
