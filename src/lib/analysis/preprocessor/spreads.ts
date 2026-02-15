/**
 * Double-page spread handling
 */

export interface SpreadInfo {
  isSpread: boolean
  leftPage?: number
  rightPage?: number
  shouldSplit: boolean
}

/**
 * Detect if image is a double-page spread
 */
export function detectDoublePageSpread(
  width: number,
  height: number,
  threshold: number = 1.3
): boolean {
  return width / height > threshold
}

/**
 * Split double-page spread into two images
 */
export async function splitSpread(
  imageUrl: string,
  pageNumbers: [number, number]
): Promise<[string, string]> {
  const img = await loadImage(imageUrl)

  const halfWidth = Math.floor(img.naturalWidth / 2)
  const height = img.naturalHeight

  // Left page (right side of spread in RTL manga)
  const leftCanvas = document.createElement('canvas')
  leftCanvas.width = halfWidth
  leftCanvas.height = height
  const leftCtx = leftCanvas.getContext('2d')!
  leftCtx.drawImage(img, halfWidth, 0, halfWidth, height, 0, 0, halfWidth, height)

  // Right page (left side of spread in RTL manga)
  const rightCanvas = document.createElement('canvas')
  rightCanvas.width = halfWidth
  rightCanvas.height = height
  const rightCtx = rightCanvas.getContext('2d')!
  rightCtx.drawImage(img, 0, 0, halfWidth, height, 0, 0, halfWidth, height)

  return [leftCanvas.toDataURL('image/webp'), rightCanvas.toDataURL('image/webp')]
}

/**
 * Handle spread based on user preference
 */
export async function handleSpread(
  imageUrl: string,
  width: number,
  height: number,
  options: { splitSpreads?: boolean } = {}
): Promise<string | [string, string]> {
  const isSpread = detectDoublePageSpread(width, height)

  if (!isSpread || !options.splitSpreads) {
    return imageUrl
  }

  return splitSpread(imageUrl, [0, 1])
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
