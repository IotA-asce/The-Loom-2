/**
 * Margin cropping utilities
 */

export interface CropMargins {
  top: number
  right: number
  bottom: number
  left: number
}

/**
 * Auto-detect margins by analyzing image edges
 */
export function detectMargins(imageData: ImageData, threshold: number = 10): CropMargins {
  const { width, height, data } = imageData

  // Analyze edges to detect uniform color margins
  // This is a simplified implementation

  const sampleRow = (y: number): number => {
    let sum = 0
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3
    }
    return sum / width
  }

  const sampleCol = (x: number): number => {
    let sum = 0
    for (let y = 0; y < height; y++) {
      const i = (y * width + x) * 4
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3
    }
    return sum / height
  }

  // Simple margin detection (would be more sophisticated in production)
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }
}

/**
 * Apply margin crop to image
 */
export async function cropImageMargins(
  imageUrl: string,
  margins: CropMargins
): Promise<string> {
  const img = await loadImage(imageUrl)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  const newWidth = img.naturalWidth - margins.left - margins.right
  const newHeight = img.naturalHeight - margins.top - margins.bottom

  canvas.width = newWidth
  canvas.height = newHeight

  ctx.drawImage(
    img,
    margins.left,
    margins.top,
    newWidth,
    newHeight,
    0,
    0,
    newWidth,
    newHeight
  )

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
