/**
 * Individual image file loading utilities
 */

export interface LoadedImage {
  name: string
  dataUrl: string
  width: number
  height: number
  size: number
  type: string
}

export interface LoadImageOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

/**
 * Load an image file and get its dimensions
 */
export function loadImageFile(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        name: file.name,
        dataUrl: url,
        width: img.width,
        height: img.height,
        size: file.size,
        type: file.type,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Failed to load image: ${file.name}`))
    }

    img.src = url
  })
}

/**
 * Load multiple image files
 */
export async function loadImageFiles(
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<LoadedImage[]> {
  const images: LoadedImage[] = []

  for (let i = 0; i < files.length; i++) {
    const image = await loadImageFile(files[i])
    images.push(image)
    onProgress?.(i + 1, files.length)
  }

  return images
}

/**
 * Resize image to fit within max dimensions
 */
export function resizeImage(
  image: LoadedImage,
  options: LoadImageOptions = {}
): Promise<string> {
  const { maxWidth = 1920, maxHeight = 1080, quality = 0.85 } = options

  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      let { width, height } = img

      // Calculate new dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      // Determine output format
      const outputFormat = image.type === 'image/png' ? 'image/png' : 'image/jpeg'
      resolve(canvas.toDataURL(outputFormat, quality))
    }

    img.onerror = () => reject(new Error('Failed to resize image'))
    img.src = image.dataUrl
  })
}

/**
 * Check if file is a supported image
 */
export function isSupportedImage(file: File): boolean {
  const supported = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  return supported.includes(file.type)
}
