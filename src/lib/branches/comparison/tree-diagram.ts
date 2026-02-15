/**
 * Tree diagram visualization for branch comparison
 */

import type { BranchVariation } from '../variation/generator'

export interface TreeNode {
  id: string
  type: 'root' | 'anchor' | 'branch' | 'event' | 'climax' | 'ending'
  label: string
  description?: string
  metadata?: {
    mood?: string
    endingType?: string
    chapterCount?: number
  }
  children: TreeNode[]
}

export interface TreeDiagram {
  root: TreeNode
  branches: BranchVariation[]
  layout: 'vertical' | 'horizontal' | 'radial'
  depth: number
}

/**
 * Generate tree diagram for branch comparison
 */
export function generateTreeDiagram(
  anchorTitle: string,
  branches: BranchVariation[],
  layout: TreeDiagram['layout'] = 'vertical'
): TreeDiagram {
  const root: TreeNode = {
    id: 'root',
    type: 'root',
    label: anchorTitle,
    children: [],
  }
  
  for (const branch of branches) {
    const branchNode = createBranchNode(branch)
    root.children.push(branchNode)
  }
  
  return {
    root,
    branches,
    layout,
    depth: calculateDepth(root),
  }
}

function createBranchNode(branch: BranchVariation): TreeNode {
  const events: TreeNode[] = branch.trajectory.keyEvents.map((event, idx) => ({
    id: `${branch.id}-event-${idx}`,
    type: 'event',
    label: event,
    children: [],
  }))
  
  const climaxNode: TreeNode = {
    id: `${branch.id}-climax`,
    type: 'climax',
    label: 'Climax',
    description: branch.trajectory.climax,
    children: [],
  }
  
  const endingNode: TreeNode = {
    id: `${branch.id}-ending`,
    type: 'ending',
    label: branch.trajectory.endingType,
    description: branch.trajectory.resolution,
    metadata: {
      mood: branch.mood,
      endingType: branch.trajectory.endingType,
      chapterCount: branch.estimatedChapters,
    },
    children: [],
  }
  
  // Structure: Events -> Climax -> Ending
  if (events.length > 0) {
    // Connect events in sequence
    for (let i = 0; i < events.length - 1; i++) {
      events[i].children.push(events[i + 1])
    }
    events[events.length - 1].children.push(climaxNode)
  }
  climaxNode.children.push(endingNode)
  
  const branchNode: TreeNode = {
    id: branch.id,
    type: 'branch',
    label: branch.premise.title,
    description: branch.premise.subtitle,
    metadata: {
      mood: branch.mood,
      chapterCount: branch.estimatedChapters,
    },
    children: events.length > 0 ? [events[0]] : [climaxNode],
  }
  
  return branchNode
}

function calculateDepth(node: TreeNode, currentDepth: number = 0): number {
  if (node.children.length === 0) {
    return currentDepth
  }
  
  const childDepths = node.children.map(child => 
    calculateDepth(child, currentDepth + 1)
  )
  return Math.max(...childDepths)
}

/**
 * Convert tree to Mermaid diagram format
 */
export function toMermaidDiagram(tree: TreeDiagram): string {
  const lines: string[] = []
  lines.push('graph TD')
  
  function addNode(node: TreeNode, parentId?: string) {
    // Sanitize ID for Mermaid
    const safeId = node.id.replace(/[^a-zA-Z0-9]/g, '_')
    
    // Create node with label
    const label = node.label.length > 30 
      ? node.label.substring(0, 27) + '...'
      : node.label
    
    let nodeStyle = ''
    switch (node.type) {
      case 'root':
        nodeStyle = `[${label}]`
        break
      case 'branch':
        nodeStyle = `{{${label}}}`
        break
      case 'climax':
        nodeStyle = `((${label}))`
        break
      case 'ending':
        nodeStyle = `[/${label}/]`
        break
      default:
        nodeStyle = `[${label}]`
    }
    
    lines.push(`    ${safeId}${nodeStyle}`)
    
    // Add connection to parent
    if (parentId) {
      const safeParentId = parentId.replace(/[^a-zA-Z0-9]/g, '_')
      lines.push(`    ${safeParentId} --> ${safeId}`)
    }
    
    // Process children
    for (const child of node.children) {
      addNode(child, node.id)
    }
  }
  
  addNode(tree.root)
  
  // Add styling
  lines.push('    classDef root fill:#f9f,stroke:#333,stroke-width:4px')
  lines.push('    classDef branch fill:#bbf,stroke:#333,stroke-width:2px')
  lines.push('    classDef climax fill:#fbb,stroke:#333,stroke-width:2px')
  lines.push('    classDef ending fill:#bfb,stroke:#333,stroke-width:2px')
  lines.push(`    class ${tree.root.id.replace(/[^a-zA-Z0-9]/g, '_')} root`)
  
  return lines.join('\n')
}

/**
 * Convert tree to ASCII art
 */
export function toAsciiTree(tree: TreeDiagram): string {
  const lines: string[] = []
  
  function renderNode(node: TreeNode, prefix: string = '', isLast: boolean = true): void {
    const connector = isLast ? '└── ' : '├── '
    lines.push(`${prefix}${connector}${node.label}`)
    
    const newPrefix = prefix + (isLast ? '    ' : '│   ')
    
    for (let i = 0; i < node.children.length; i++) {
      renderNode(node.children[i], newPrefix, i === node.children.length - 1)
    }
  }
  
  lines.push(tree.root.label)
  for (let i = 0; i < tree.root.children.length; i++) {
    renderNode(tree.root.children[i], '', i === tree.root.children.length - 1)
  }
  
  return lines.join('\n')
}

/**
 * Generate side-by-side comparison view
 */
export function generateSideBySideView(
  branches: BranchVariation[]
): string {
  const lines: string[] = []
  
  lines.push('# Branch Comparison')
  lines.push('')
  
  // Headers
  const headers = branches.map((b, i) => `Branch ${i + 1}: ${b.premise.title}`)
  lines.push('| Aspect | ' + headers.join(' | ') + ' |')
  lines.push('|--------|' + headers.map(() => '--------').join('|') + '|')
  
  // Rows
  const rows = [
    ['Premise', ...branches.map(b => b.premise.whatIf)],
    ['Mood', ...branches.map(b => b.mood)],
    ['Consequences', ...branches.map(b => b.consequenceType)],
    ['Ending', ...branches.map(b => b.trajectory.endingType)],
    ['Chapters', ...branches.map(b => `${b.estimatedChapters}`)],
    ['Characters', ...branches.map(b => `${b.characterArcs.length}`)],
    ['Themes', ...branches.map(b => b.themeProgression.slice(0, 2).join(', '))],
  ]
  
  for (const row of rows) {
    lines.push('| ' + row.join(' | ') + ' |')
  }
  
  return lines.join('\n')
}

/**
 * Find divergence point between branches
 */
export function findDivergencePoint(
  branches: BranchVariation[]
): {
  commonElements: string[]
  divergenceIndex: number
  divergentPaths: string[][]
} {
  if (branches.length < 2) {
    return {
      commonElements: branches[0]?.trajectory.keyEvents || [],
      divergenceIndex: 0,
      divergentPaths: [],
    }
  }
  
  // Find common prefix
  const eventLists = branches.map(b => b.trajectory.keyEvents)
  let commonIndex = 0
  
  while (commonIndex < Math.min(...eventLists.map(e => e.length))) {
    const event = eventLists[0][commonIndex]
    const allMatch = eventLists.every(list => list[commonIndex] === event)
    if (!allMatch) break
    commonIndex++
  }
  
  return {
    commonElements: eventLists[0].slice(0, commonIndex),
    divergenceIndex: commonIndex,
    divergentPaths: eventLists.map(list => list.slice(commonIndex)),
  }
}
