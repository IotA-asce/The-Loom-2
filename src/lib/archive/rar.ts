import { unrar } from 'unrar-js'

export interface ExtractRarOptions {
  onProgress?: (current: number, total: number) => void
  onFile?: (name: string, data: Uint8Array) => void
  filter?: (name: string) => boolean
}

export interface ExtractedFile {
  name: string
  path: string
  data: Uint8Array
}

/**
 * Extract CBR/RAR file contents
 */
export async function extractRar(
  arrayBuffer: ArrayBuffer,
  options: ExtractRarOptions = {}
): Promise<ExtractedFile[]> {
  const { onProgress, onFile, filter } = options

  const files: ExtractedFile[] = []

  try {
    const result = unrar(arrayBuffer)

    if (!result || !result.files) {
      throw new Error('Failed to extract RAR archive')
    }

    const entries = Object.entries(result.files)
    const filteredEntries = filter
      ? entries.filter(([name]) => filter(name))
      : entries

    const total = filteredEntries.length

    for (let i = 0; i < filteredEntries.length; i++) {
      const [fileName, fileData] = filteredEntries[i]

      if (typeof fileData === 'object' && fileData !== null) {
        const data = new Uint8Array(fileData as ArrayBuffer)

        const extractedFile: ExtractedFile = {
          name: fileName.split('/').pop() || fileName,
          path: fileName,
          data,
        }

        files.push(extractedFile)
        onFile?.(fileName, data)
        onProgress?.(i + 1, total)
      }
    }
  } catch (error) {
    console.warn('RAR extraction failed, may need native support:', error)
    throw error
  }

  return files
}

/**
 * Get list of image files from RAR
 */
export function listRarImages(arrayBuffer: ArrayBuffer): string[] {
  try {
    const result = unrar(arrayBuffer)
    if (!result || !result.files) return []

    return Object.keys(result.files).filter(name => {
      const lower = name.toLowerCase()
      return /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(lower)
    })
  } catch {
    return []
  }
}

/**
 * Validate CBR/RAR file
 */
export function isValidRar(arrayBuffer: ArrayBuffer): boolean {
  try {
    const result = unrar(arrayBuffer)
    return result && result.files && Object.keys(result.files).length > 0
  } catch {
    return false
  }
}
