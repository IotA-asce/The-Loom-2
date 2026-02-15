/**
 * Library organization by branch tree structure
 */

import type { StoryBranch } from './branching'

export interface LibraryItem {
  id: string
  type: 'branch' | 'chapter' | 'character' | 'world'
  name: string
  description: string
  tags: string[]
  branchId?: string
  parentId?: string
  metadata: {
    createdAt: Date
    lastModified: Date
    wordCount: number
  }
}

export interface LibraryFolder {
  id: string
  name: string
  type: 'root' | 'branch-group' | 'character-group' | 'custom'
  items: LibraryItem[]
  children: LibraryFolder[]
}

export interface Library {
  root: LibraryFolder
  flatItems: Map<string, LibraryItem>
}

/**
 * Create library from branch tree
 */
export function createLibraryFromBranches(branches: StoryBranch[]): Library {
  const root: LibraryFolder = {
    id: 'root',
    name: 'Story Library',
    type: 'root',
    items: [],
    children: [],
  }
  
  const flatItems = new Map<string, LibraryItem>()
  
  // Organize branches
  const branchesFolder: LibraryFolder = {
    id: 'branches',
    name: 'Branches',
    type: 'branch-group',
    items: [],
    children: [],
  }
  
  // Find root branches (no parent)
  const rootBranches = branches.filter(b => !b.parentBranchId)
  
  for (const branch of rootBranches) {
    const item: LibraryItem = {
      id: branch.id,
      type: 'branch',
      name: branch.name,
      description: branch.description,
      tags: ['branch', branch.metadata.isActive ? 'active' : 'archived'],
      metadata: {
        createdAt: branch.metadata.createdAt,
        lastModified: branch.metadata.lastModified,
        wordCount: branch.metadata.wordCount,
      },
    }
    
    branchesFolder.items.push(item)
    flatItems.set(item.id, item)
    
    // Add child branches
    const childBranches = branches.filter(b => b.parentBranchId === branch.id)
    if (childBranches.length > 0) {
      const childFolder: LibraryFolder = {
        id: `branch-${branch.id}-children`,
        name: `${branch.name} Variants`,
        type: 'branch-group',
        items: [],
        children: [],
      }
      
      for (const child of childBranches) {
        const childItem: LibraryItem = {
          id: child.id,
          type: 'branch',
          name: child.name,
          description: child.description,
          tags: ['branch', 'variant', child.metadata.isActive ? 'active' : 'archived'],
          branchId: branch.id,
          metadata: {
            createdAt: child.metadata.createdAt,
            lastModified: child.metadata.lastModified,
            wordCount: child.metadata.wordCount,
          },
        }
        
        childFolder.items.push(childItem)
        flatItems.set(childItem.id, childItem)
      }
      
      branchesFolder.children.push(childFolder)
    }
  }
  
  root.children.push(branchesFolder)
  
  return {
    root,
    flatItems,
  }
}

/**
 * Add item to library
 */
export function addToLibrary(
  library: Library,
  item: LibraryItem,
  parentFolderId?: string
): Library {
  const flatItems = new Map(library.flatItems)
  flatItems.set(item.id, item)
  
  if (!parentFolderId) {
    library.root.items.push(item)
  } else {
    // Find parent folder and add
    const folder = findFolder(library.root, parentFolderId)
    if (folder) {
      folder.items.push(item)
    }
  }
  
  return {
    ...library,
    flatItems,
  }
}

function findFolder(root: LibraryFolder, id: string): LibraryFolder | null {
  if (root.id === id) return root
  
  for (const child of root.children) {
    const found = findFolder(child, id)
    if (found) return found
  }
  
  return null
}

/**
 * Create custom folder
 */
export function createFolder(
  library: Library,
  name: string,
  parentId?: string
): Library {
  const folder: LibraryFolder = {
    id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    type: 'custom',
    items: [],
    children: [],
  }
  
  const parent = parentId ? findFolder(library.root, parentId) : library.root
  if (parent) {
    parent.children.push(folder)
  }
  
  return library
}

/**
 * Tag an item
 */
export function tagLibraryItem(
  library: Library,
  itemId: string,
  tag: string
): Library {
  const item = library.flatItems.get(itemId)
  if (!item) return library
  
  if (item.tags.includes(tag)) return library
  
  const flatItems = new Map(library.flatItems)
  flatItems.set(itemId, {
    ...item,
    tags: [...item.tags, tag],
  })
  
  return {
    ...library,
    flatItems,
  }
}

/**
 * Search library
 */
export function searchLibrary(
  library: Library,
  query: string,
  filters?: {
    types?: LibraryItem['type'][]
    tags?: string[]
  }
): LibraryItem[] {
  const results: LibraryItem[] = []
  const lowerQuery = query.toLowerCase()
  
  for (const item of library.flatItems.values()) {
    // Text search
    const matchesQuery = 
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery)
    
    if (!matchesQuery) continue
    
    // Type filter
    if (filters?.types && !filters.types.includes(item.type)) {
      continue
    }
    
    // Tag filter
    if (filters?.tags && !filters.tags.every(t => item.tags.includes(t))) {
      continue
    }
    
    results.push(item)
  }
  
  return results
}

/**
 * Get items by tag
 */
export function getItemsByTag(
  library: Library,
  tag: string
): LibraryItem[] {
  return [...library.flatItems.values()].filter(i => i.tags.includes(tag))
}

/**
 * Get recent items
 */
export function getRecentItems(
  library: Library,
  limit: number = 10
): LibraryItem[] {
  return [...library.flatItems.values()]
    .sort((a, b) => b.metadata.lastModified.getTime() - a.metadata.lastModified.getTime())
    .slice(0, limit)
}

/**
 * Export library structure
 */
export function exportLibraryStructure(library: Library): object {
  return {
    root: exportFolder(library.root),
  }
}

function exportFolder(folder: LibraryFolder): object {
  return {
    id: folder.id,
    name: folder.name,
    type: folder.type,
    items: folder.items.map(i => i.id),
    children: folder.children.map(exportFolder),
  }
}

/**
 * Get library statistics
 */
export function getLibraryStats(library: Library): {
  totalItems: number
  byType: Record<string, number>
  totalWordCount: number
  byTag: Record<string, number>
} {
  const byType: Record<string, number> = {}
  const byTag: Record<string, number> = {}
  let totalWordCount = 0
  
  for (const item of library.flatItems.values()) {
    byType[item.type] = (byType[item.type] || 0) + 1
    totalWordCount += item.metadata.wordCount
    
    for (const tag of item.tags) {
      byTag[tag] = (byTag[tag] || 0) + 1
    }
  }
  
  return {
    totalItems: library.flatItems.size,
    byType,
    totalWordCount,
    byTag,
  }
}
