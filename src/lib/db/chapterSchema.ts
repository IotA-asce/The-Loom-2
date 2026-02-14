/**
 * Chapter schema extension for database
 */

import { DBSchema } from 'idb'

export interface ChapterRecord {
  id: string
  mangaId: string
  number: number
  title?: string
  startPage: number
  endPage: number
  pageCount: number
  type: 'chapter' | 'cover' | 'bonus' | 'volume'
  createdAt: Date
  updatedAt: Date
}

export interface PageRecord {
  id: string
  chapterId: string
  mangaId: string
  pageNumber: number
  imageData?: Blob
  thumbnailData?: Blob
  width?: number
  height?: number
  isDoublePage: boolean
}

export interface ChapterSchema extends DBSchema {
  chapters: {
    key: string
    value: ChapterRecord
    indexes: {
      'by-manga': string
      'by-number': [string, number]
    }
  }
  pages: {
    key: string
    value: PageRecord
    indexes: {
      'by-chapter': string
      'by-manga': string
      'by-page-number': [string, number]
    }
  }
}

/**
 * Save manga with chapters and pages
 */
export interface MangaImportData {
  manga: {
    title: string
    author?: string
    description?: string
    totalPages: number
    coverImage?: Blob
  }
  chapters: Omit<ChapterRecord, 'id' | 'mangaId' | 'createdAt' | 'updatedAt'>[]
  pages: Omit<PageRecord, 'id' | 'chapterId' | 'mangaId'>[]
}
