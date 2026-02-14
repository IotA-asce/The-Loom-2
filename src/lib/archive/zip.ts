import JSZip from 'jszip'

export interface ExtractZipOptions {
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
 * Extract CBZ/ZIP file contents
 */
export async function extractZip(
  arrayBuffer: ArrayBuffer,
  options: ExtractZipOptions = {}
): Promise<ExtractedFile[]> {
  const { onProgress, onFile, filter } = options
  const zip = await JSZip.loadAsync(arrayBuffer)

  const files: ExtractedFile[] = []
  const fileNames = Object.keys(zip.files).filter(name => !zip.files[name].dir)

  const filteredNames = filter ? fileNames.filter(filter) : fileNames
  const total = filteredNames.length

  for (let i = 0; i < filteredNames.length; i++) {
    const fileName = filteredNames[i]
    const zipEntry = zip.files[fileName]

    const data = await zipEntry.async('uint8array')

    const extractedFile: ExtractedFile = {
      name: fileName.split('/').pop() || fileName,
      path: fileName,
      data,
    }

    files.push(extractedFile)
    onFile?.(fileName, data)
    onProgress?.(i + 1, total)
  }

  return files
}

/**
 * Get list of image files from ZIP
 */
export async function listZipImages(arrayBuffer: ArrayBuffer): Promise<string[]> {
  const zip = await JSZip.loadAsync(arrayBuffer)

  return Object.keys(zip.files).filter(name => {
    if (zip.files[name].dir) return false
    const lower = name.toLowerCase()
    return /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(lower)
  })
}

/**
 * Extract single file from ZIP
 */
export async function extractZipFile(
  arrayBuffer: ArrayBuffer,
  filePath: string
): Promise<Uint8Array | null> {
  const zip = await JSZip.loadAsync(arrayBuffer)
  const file = zip.files[filePath]

  if (!file || file.dir) return null

  return await file.async('uint8array')
}

/**
 * Validate CBZ/ZIP file
 */
export async function isValidZip(arrayBuffer: ArrayBuffer): Promise<boolean> {
  try {
    await JSZip.loadAsync(arrayBuffer)
    return true
  } catch {
    return false
  }
}
