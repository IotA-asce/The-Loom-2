declare module 'unrar-js' {
  export interface UnrarResult {
    files: Record<string, ArrayBuffer>
  }
  export function unrar(buffer: ArrayBuffer): UnrarResult
}
