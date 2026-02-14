/**
 * Archive extraction progress tracking
 */

export interface ProgressCallback {
  (current: number, total: number, fileName?: string): void
}

export interface ExtractionProgress {
  current: number
  total: number
  percent: number
  fileName?: string
}

export class ProgressTracker {
  private current = 0
  private total = 0
  private callbacks: ProgressCallback[] = []

  constructor(total: number) {
    this.total = total
  }

  addCallback(callback: ProgressCallback): () => void {
    this.callbacks.push(callback)
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  increment(fileName?: string): void {
    this.current++
    this.notify(fileName)
  }

  private notify(fileName?: string): void {
    const progress: ExtractionProgress = {
      current: this.current,
      total: this.total,
      percent: Math.round((this.current / this.total) * 100),
      fileName,
    }

    this.callbacks.forEach(cb => cb(progress.current, progress.total, fileName))
  }

  getProgress(): ExtractionProgress {
    return {
      current: this.current,
      total: this.total,
      percent: Math.round((this.current / this.total) * 100),
    }
  }
}
