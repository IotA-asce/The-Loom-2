/**
 * File reader utility with progress tracking
 */

export interface ReadFileOptions {
  onProgress?: (loaded: number, total: number) => void
  onError?: (error: Error) => void
  abortSignal?: AbortSignal
}

export interface ReadFileResult {
  data: ArrayBuffer | string
  file: File
}

/**
 * Read file as ArrayBuffer with progress tracking
 */
export function readFileAsArrayBuffer(
  file: File,
  options: ReadFileOptions = {}
): Promise<ReadFileResult> {
  const { onProgress, onError, abortSignal } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onprogress = event => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded, event.total)
      }
    }

    reader.onload = () => {
      resolve({
        data: reader.result as ArrayBuffer,
        file,
      })
    }

    reader.onerror = () => {
      const error = new Error(`Failed to read file: ${file.name}`)
      onError?.(error)
      reject(error)
    }

    reader.onabort = () => {
      const error = new Error(`File reading aborted: ${file.name}`)
      reject(error)
    }

    abortSignal?.addEventListener('abort', () => {
      reader.abort()
    })

    reader.readAsArrayBuffer(file)
  })
}

/**
 * Read file as Data URL with progress tracking
 */
export function readFileAsDataURL(
  file: File,
  options: ReadFileOptions = {}
): Promise<ReadFileResult> {
  const { onProgress, onError, abortSignal } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onprogress = event => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded, event.total)
      }
    }

    reader.onload = () => {
      resolve({
        data: reader.result as string,
        file,
      })
    }

    reader.onerror = () => {
      const error = new Error(`Failed to read file: ${file.name}`)
      onError?.(error)
      reject(error)
    }

    reader.onabort = () => {
      const error = new Error(`File reading aborted: ${file.name}`)
      reject(error)
    }

    abortSignal?.addEventListener('abort', () => {
      reader.abort()
    })

    reader.readAsDataURL(file)
  })
}

/**
 * Read multiple files with combined progress
 */
export async function readMultipleFiles(
  files: File[],
  options: ReadFileOptions & { asDataURL?: boolean } = {}
): Promise<ReadFileResult[]> {
  const { onProgress, asDataURL = false } = options
  const results: ReadFileResult[] = []

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  let loadedSize = 0

  for (const file of files) {
    const readFn = asDataURL ? readFileAsDataURL : readFileAsArrayBuffer
    const result = await readFn(file, {
      ...options,
      onProgress: (loaded, _total) => {
        const currentLoaded = loadedSize + loaded
        onProgress?.(currentLoaded, totalSize)
      },
    })

    loadedSize += file.size
    results.push(result)
  }

  return results
}

/**
 * Create a blob URL from a file
 */
export function createObjectURL(file: File | Blob): string {
  return URL.createObjectURL(file)
}

/**
 * Revoke a blob URL to free memory
 */
export function revokeObjectURL(url: string): void {
  URL.revokeObjectURL(url)
}
