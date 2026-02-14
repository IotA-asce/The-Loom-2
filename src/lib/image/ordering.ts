/**
 * Page ordering and sorting utilities
 */

import { naturalSort } from './processing'

export interface PageOrderOptions {
  reverse?: boolean
  folderFirst?: boolean
}

export interface OrderedPage {
  id: string
  name: string
  path: string
  folder?: string
  order: number
}

/**
 * Extract numeric value from filename for sorting
 */
export function extractPageNumber(filename: string): number {
  const matches = filename.match(/(\d+)/)
  return matches ? parseInt(matches[1], 10) : 0
}

/**
 * Sort pages by natural order
 */
export function sortPagesByNaturalOrder(pages: OrderedPage[]): OrderedPage[] {
  return [...pages].sort((a, b) => naturalSort(a.name, b.name))
}

/**
 * Sort pages with folder + file ordering
 */
export function sortPagesWithFolders(
  pages: OrderedPage[],
  options: PageOrderOptions = {}
): OrderedPage[] {
  const { folderFirst = true } = options

  return [...pages].sort((a, b) => {
    const folderA = a.folder || ''
    const folderB = b.folder || ''

    if (folderFirst && folderA !== folderB) {
      return naturalSort(folderA, folderB)
    }

    return naturalSort(a.name, b.name)
  })
}

/**
 * Reverse page order (for right-to-left manga)
 */
export function reversePageOrder(pages: OrderedPage[]): OrderedPage[] {
  return [...pages].reverse().map((page, index) => ({
    ...page,
    order: index,
  }))
}

/**
 * Reorder pages manually
 */
export function reorderPages(
  pages: OrderedPage[],
  fromIndex: number,
  toIndex: number
): OrderedPage[] {
  const result = [...pages]
  const [removed] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, removed)

  return result.map((page, index) => ({
    ...page,
    order: index,
  }))
}

/**
 * Apply complete ordering (sort + reverse)
 */
export function applyPageOrdering(
  pages: OrderedPage[],
  options: PageOrderOptions = {}
): OrderedPage[] {
  let ordered = sortPagesByNaturalOrder(pages)

  if (options.folderFirst) {
    ordered = sortPagesWithFolders(ordered, options)
  }

  if (options.reverse) {
    ordered = reversePageOrder(ordered)
  }

  return ordered.map((page, index) => ({
    ...page,
    order: index,
  }))
}
