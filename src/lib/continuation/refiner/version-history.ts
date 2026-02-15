/**
 * Branching version history system
 */

import type { RefinementIteration, RefinementSession } from './iteration'

export interface VersionNode {
  id: string
  sessionId: string
  iterationNumber: number
  content: string
  parentId: string | null
  children: string[]
  metadata: {
    timestamp: Date
    description: string
    author: 'user' | 'ai'
    approved: boolean
  }
}

export interface VersionTree {
  rootId: string
  nodes: Map<string, VersionNode>
  currentNodeId: string
}

/**
 * Create version tree from session
 */
export function createVersionTree(session: RefinementSession): VersionTree {
  const nodes = new Map<string, VersionNode>()
  let parentId: string | null = null
  
  for (const iteration of session.iterations) {
    const node: VersionNode = {
      id: `node-${iteration.id}`,
      sessionId: session.id,
      iterationNumber: iteration.number,
      content: iteration.newContent,
      parentId,
      children: [],
      metadata: {
        timestamp: iteration.timestamp,
        description: iteration.instruction,
        author: 'ai',
        approved: iteration.userApproved,
      },
    }
    
    nodes.set(node.id, node)
    
    // Link to parent
    if (parentId) {
      const parent = nodes.get(parentId)
      if (parent) {
        parent.children.push(node.id)
      }
    }
    
    if (iteration.userApproved) {
      parentId = node.id
    }
  }
  
  // Find root
  let rootId = ''
  for (const [id, node] of nodes) {
    if (node.parentId === null) {
      rootId = id
      break
    }
  }
  
  // Find current (last approved or last iteration)
  let currentNodeId = rootId
  for (const [id, node] of nodes) {
    if (node.metadata.approved || node.children.length === 0) {
      currentNodeId = id
    }
  }
  
  return {
    rootId,
    nodes,
    currentNodeId,
  }
}

/**
 * Branch from a node
 */
export function branchFromNode(
  tree: VersionTree,
  fromNodeId: string,
  newContent: string,
  description: string
): { tree: VersionTree; newNodeId: string } {
  const fromNode = tree.nodes.get(fromNodeId)
  if (!fromNode) {
    throw new Error(`Node ${fromNodeId} not found`)
  }
  
  const newNode: VersionNode = {
    id: `node-branch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sessionId: fromNode.sessionId,
    iterationNumber: fromNode.iterationNumber + 1,
    content: newContent,
    parentId: fromNodeId,
    children: [],
    metadata: {
      timestamp: new Date(),
      description,
      author: 'user',
      approved: true,
    },
  }
  
  const nodes = new Map(tree.nodes)
  nodes.set(newNode.id, newNode)
  
  // Add to parent's children
  const parent = nodes.get(fromNodeId)
  if (parent) {
    parent.children.push(newNode.id)
  }
  
  return {
    tree: {
      ...tree,
      nodes,
      currentNodeId: newNode.id,
    },
    newNodeId: newNode.id,
  }
}

/**
 * Get version path (from root to current)
 */
export function getVersionPath(tree: VersionTree, nodeId?: string): VersionNode[] {
  const path: VersionNode[] = []
  const targetId = nodeId || tree.currentNodeId
  
  let current = tree.nodes.get(targetId)
  while (current) {
    path.unshift(current)
    current = current.parentId ? tree.nodes.get(current.parentId) : undefined
  }
  
  return path
}

/**
 * Get all branches from a node
 */
export function getBranches(tree: VersionTree, fromNodeId?: string): VersionNode[][] {
  const startId = fromNodeId || tree.rootId
  const startNode = tree.nodes.get(startId)
  
  if (!startNode || startNode.children.length === 0) {
    return []
  }
  
  const branches: VersionNode[][] = []
  
  for (const childId of startNode.children) {
    const branch = getBranchToLeaf(tree, childId)
    branches.push(branch)
  }
  
  return branches
}

function getBranchToLeaf(tree: VersionTree, startId: string): VersionNode[] {
  const branch: VersionNode[] = []
  let current = tree.nodes.get(startId)
  
  while (current) {
    branch.push(current)
    
    if (current.children.length === 0) {
      break
    }
    
    // Follow first child (main branch)
    current = tree.nodes.get(current.children[0])
  }
  
  return branch
}

/**
 * Compare two versions
 */
export function compareVersions(
  tree: VersionTree,
  nodeAId: string,
  nodeBId: string
): { 
  nodeA: VersionNode
  nodeB: VersionNode
  commonAncestor: VersionNode | null
  divergedAt: Date | null
} {
  const nodeA = tree.nodes.get(nodeAId)!
  const nodeB = tree.nodes.get(nodeBId)!
  
  const pathA = getVersionPath(tree, nodeAId)
  const pathB = getVersionPath(tree, nodeBId)
  
  // Find common ancestor
  let commonAncestor: VersionNode | null = null
  
  for (let i = 0; i < Math.min(pathA.length, pathB.length); i++) {
    if (pathA[i].id === pathB[i].id) {
      commonAncestor = pathA[i]
    } else {
      break
    }
  }
  
  return {
    nodeA,
    nodeB,
    commonAncestor,
    divergedAt: commonAncestor?.metadata.timestamp || null,
  }
}

/**
 * Get version statistics
 */
export function getVersionStats(tree: VersionTree): {
  totalVersions: number
  totalBranches: number
  maxDepth: number
  approvedVersions: number
} {
  let totalBranches = 0
  let maxDepth = 0
  let approvedVersions = 0
  
  for (const node of tree.nodes.values()) {
    if (node.children.length > 1) {
      totalBranches += node.children.length - 1
    }
    
    if (node.metadata.approved) {
      approvedVersions++
    }
    
    const depth = getVersionPath(tree, node.id).length
    maxDepth = Math.max(maxDepth, depth)
  }
  
  return {
    totalVersions: tree.nodes.size,
    totalBranches,
    maxDepth,
    approvedVersions,
  }
}

/**
 * Export version tree
 */
export function exportVersionTree(tree: VersionTree): object {
  return {
    rootId: tree.rootId,
    currentNodeId: tree.currentNodeId,
    nodes: [...tree.nodes.entries()],
  }
}

/**
 * Find version by description
 */
export function findVersionByDescription(
  tree: VersionTree,
  searchTerm: string
): VersionNode[] {
  const results: VersionNode[] = []
  
  for (const node of tree.nodes.values()) {
    if (node.metadata.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      results.push(node)
    }
  }
  
  return results
}

/**
 * Merge branches (simplified - just pick one)
 */
export function mergeBranches(
  tree: VersionTree,
  sourceNodeId: string,
  targetNodeId: string,
  resolution: 'source' | 'target' | 'manual'
): VersionTree {
  // In a full implementation, this would allow merging content
  // For now, just mark the merge in metadata
  
  const nodes = new Map(tree.nodes)
  const sourceNode = nodes.get(sourceNodeId)
  
  if (sourceNode) {
    nodes.set(sourceNodeId, {
      ...sourceNode,
      metadata: {
        ...sourceNode.metadata,
        description: `${sourceNode.metadata.description} (merged into ${targetNodeId})`,
      },
    })
  }
  
  return {
    ...tree,
    nodes,
  }
}
