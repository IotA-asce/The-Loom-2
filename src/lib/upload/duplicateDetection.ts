import CryptoJS from 'crypto-js'

export type HashAlgorithm = 'md5' | 'sha256'

export interface FileHash {
  filename: string
  hash: string
  algorithm: HashAlgorithm
}

export interface DuplicateCheckResult {
  isDuplicate: boolean
  existingId?: string
  matchType: 'exact' | 'none'
}

/**
 * Calculate file hash (MD5 or SHA-256)
 */
export async function calculateFileHash(
  file: File,
  algorithm: HashAlgorithm = 'md5'
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any)

  if (algorithm === 'sha256') {
    return CryptoJS.SHA256(wordArray).toString()
  }

  return CryptoJS.MD5(wordArray).toString()
}

/**
 * Calculate hashes for multiple files
 */
export async function calculateHashes(
  files: File[],
  algorithm: HashAlgorithm = 'md5',
  onProgress?: (current: number, total: number) => void
): Promise<FileHash[]> {
  const hashes: FileHash[] = []

  for (let i = 0; i < files.length; i++) {
    const hash = await calculateFileHash(files[i], algorithm)
    hashes.push({
      filename: files[i].name,
      hash,
      algorithm,
    })
    onProgress?.(i + 1, files.length)
  }

  return hashes
}

/**
 * Check if file is duplicate against stored hashes
 */
export function checkDuplicate(
  fileHash: string,
  storedHashes: Map<string, string>
): DuplicateCheckResult {
  for (const [id, hash] of storedHashes.entries()) {
    if (hash === fileHash) {
      return {
        isDuplicate: true,
        existingId: id,
        matchType: 'exact',
      }
    }
  }

  return {
    isDuplicate: false,
    matchType: 'none',
  }
}

/**
 * Find duplicates in a file list
 */
export function findDuplicates(hashes: FileHash[]): Map<string, string[]> {
  const hashMap = new Map<string, string[]>()

  for (const { filename, hash } of hashes) {
    const existing = hashMap.get(hash) || []
    existing.push(filename)
    hashMap.set(hash, existing)
  }

  // Filter to only duplicates
  const duplicates = new Map<string, string[]>()
  for (const [hash, files] of hashMap.entries()) {
    if (files.length > 1) {
      duplicates.set(hash, files)
    }
  }

  return duplicates
}
