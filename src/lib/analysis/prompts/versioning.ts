/**
 * Prompt versioning system
 */

export interface PromptVersion {
  version: string
  createdAt: Date
  description: string
  content: string
}

export class PromptVersionManager {
  private versions: Map<string, PromptVersion[]> = new Map()

  /**
   * Add a new version for a prompt type
   */
  addVersion(promptType: string, version: PromptVersion): void {
    const existing = this.versions.get(promptType) || []
    existing.push(version)
    this.versions.set(promptType, existing)
  }

  /**
   * Get latest version for a prompt type
   */
  getLatest(promptType: string): PromptVersion | undefined {
    const versions = this.versions.get(promptType)
    if (!versions || versions.length === 0) return undefined
    return versions[versions.length - 1]
  }

  /**
   * Get specific version
   */
  getVersion(promptType: string, version: string): PromptVersion | undefined {
    const versions = this.versions.get(promptType)
    return versions?.find(v => v.version === version)
  }

  /**
   * List all versions for a prompt type
   */
  listVersions(promptType: string): PromptVersion[] {
    return this.versions.get(promptType) || []
  }

  /**
   * Compare two versions
   */
  compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number)
    const parts2 = v2.split('.').map(Number)

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0
      const p2 = parts2[i] || 0
      if (p1 !== p2) return p1 - p2
    }

    return 0
  }
}

export const promptVersionManager = new PromptVersionManager()
