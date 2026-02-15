/**
 * Branching from any point in generated story
 */

export interface BranchPoint {
  id: string
  storyId: string
  sourceNodeId: string
  sourceChapterId: string
  position: {
    chapterIndex: number
    sceneIndex?: number
    paragraphIndex?: number
  }
  description: string
  createdAt: Date
}

export interface StoryBranch {
  id: string
  name: string
  description: string
  parentBranchId: string | null
  parentPointId: string | null
  divergenceChapterId: string
  chapters: string[] // Ordered chapter IDs
  metadata: {
    createdAt: Date
    lastModified: Date
    chapterCount: number
    wordCount: number
    isActive: boolean
  }
}

export interface BranchTree {
  rootBranchId: string
  branches: Map<string, StoryBranch>
  branchPoints: Map<string, BranchPoint>
}

/**
 * Create a branch point
 */
export function createBranchPoint(
  storyId: string,
  sourceChapterId: string,
  position: BranchPoint['position'],
  description: string
): BranchPoint {
  return {
    id: `bp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    storyId,
    sourceNodeId: sourceChapterId,
    sourceChapterId,
    position,
    description,
    createdAt: new Date(),
  }
}

/**
 * Create a new branch from a branch point
 */
export function createBranch(
  name: string,
  description: string,
  parentBranchId: string | null,
  branchPointId: string | null,
  divergenceChapterId: string
): StoryBranch {
  return {
    id: `branch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    parentBranchId,
    parentPointId: branchPointId,
    divergenceChapterId,
    chapters: [],
    metadata: {
      createdAt: new Date(),
      lastModified: new Date(),
      chapterCount: 0,
      wordCount: 0,
      isActive: true,
    },
  }
}

/**
 * Add chapter to branch
 */
export function addChapterToBranch(
  branch: StoryBranch,
  chapterId: string,
  wordCount: number
): StoryBranch {
  return {
    ...branch,
    chapters: [...branch.chapters, chapterId],
    metadata: {
      ...branch.metadata,
      lastModified: new Date(),
      chapterCount: branch.chapters.length + 1,
      wordCount: branch.metadata.wordCount + wordCount,
    },
  }
}

/**
 * Get branch lineage (from root to this branch)
 */
export function getBranchLineage(
  branchTree: BranchTree,
  branchId: string
): StoryBranch[] {
  const lineage: StoryBranch[] = []
  let current = branchTree.branches.get(branchId)
  
  while (current) {
    lineage.unshift(current)
    current = current.parentBranchId 
      ? branchTree.branches.get(current.parentBranchId)
      : undefined
  }
  
  return lineage
}

/**
 * Get all child branches
 */
export function getChildBranches(
  branchTree: BranchTree,
  parentBranchId: string
): StoryBranch[] {
  const children: StoryBranch[] = []
  
  for (const branch of branchTree.branches.values()) {
    if (branch.parentBranchId === parentBranchId) {
      children.push(branch)
    }
  }
  
  return children
}

/**
 * Get branch tree structure for visualization
 */
export interface BranchTreeNode {
  branch: StoryBranch
  children: BranchTreeNode[]
  depth: number
}

export function getBranchTreeStructure(branchTree: BranchTree): BranchTreeNode[] {
  const buildNode = (branchId: string, depth: number): BranchTreeNode => {
    const branch = branchTree.branches.get(branchId)!
    const children = getChildBranches(branchTree, branchId)
    
    return {
      branch,
      children: children.map(c => buildNode(c.id, depth + 1)),
      depth,
    }
  }
  
  const root = branchTree.branches.get(branchTree.rootBranchId)
  if (!root) return []
  
  return [buildNode(root.id, 0)]
}

/**
 * Merge branches
 */
export function mergeBranches(
  branchTree: BranchTree,
  sourceBranchId: string,
  targetBranchId: string
): { tree: BranchTree; result: 'success' | 'conflict' | 'not-implemented' } {
  // In a full implementation, this would attempt content merging
  // For now, just mark as not implemented
  
  return {
    tree: branchTree,
    result: 'not-implemented',
  }
}

/**
 * Archive branch
 */
export function archiveBranch(branch: StoryBranch): StoryBranch {
  return {
    ...branch,
    metadata: {
      ...branch.metadata,
      isActive: false,
      lastModified: new Date(),
    },
  }
}

/**
 * Reactivate branch
 */
export function reactivateBranch(branch: StoryBranch): StoryBranch {
  return {
    ...branch,
    metadata: {
      ...branch.metadata,
      isActive: true,
      lastModified: new Date(),
    },
  }
}

/**
 * Get branch comparison
 */
export function compareBranches(
  branchA: StoryBranch,
  branchB: StoryBranch
): {
  commonChapters: string[]
  uniqueToA: string[]
  uniqueToB: string[]
  divergencePoint: string | null
} {
  const setA = new Set(branchA.chapters)
  const setB = new Set(branchB.chapters)
  
  const commonChapters: string[] = []
  const uniqueToA: string[] = []
  const uniqueToB: string[] = []
  
  // Find common chapters (in order)
  for (const chapterId of branchA.chapters) {
    if (setB.has(chapterId)) {
      commonChapters.push(chapterId)
    } else {
      uniqueToA.push(chapterId)
    }
  }
  
  for (const chapterId of branchB.chapters) {
    if (!setA.has(chapterId)) {
      uniqueToB.push(chapterId)
    }
  }
  
  return {
    commonChapters,
    uniqueToA,
    uniqueToB,
    divergencePoint: commonChapters.length > 0 
      ? commonChapters[commonChapters.length - 1]
      : null,
  }
}

/**
 * Export branch tree
 */
export function exportBranchTree(branchTree: BranchTree): object {
  return {
    rootBranchId: branchTree.rootBranchId,
    branches: [...branchTree.branches.entries()],
    branchPoints: [...branchTree.branchPoints.entries()],
  }
}

/**
 * Get branch statistics
 */
export function getBranchStats(branch: StoryBranch): {
  totalChapters: number
  estimatedReadTime: number // minutes
  completionPercentage: number
} {
  // Estimate 200 words per minute reading speed
  const estimatedReadTime = Math.ceil(branch.metadata.wordCount / 200)
  
  return {
    totalChapters: branch.metadata.chapterCount,
    estimatedReadTime,
    completionPercentage: 0, // Would be calculated based on story arc
  }
}
