import React from 'react'
import { MangaCard } from './MangaCard'
import './LibraryGrid.css'

export interface MangaItem {
  id: string
  title: string
  author?: string
  chapterCount: number
  coverUrl?: string
  status: 'new' | 'analyzing' | 'analyzed'
}

export interface LibraryGridProps {
  manga: MangaItem[]
  onMangaClick?: (id: string) => void
  onAddNew?: () => void
}

export const LibraryGrid: React.FC<LibraryGridProps> = ({
  manga,
  onMangaClick,
  onAddNew,
}) => {
  return (
    <div className="library-grid">
      {manga.map(item => (
        <MangaCard
          key={item.id}
          title={item.title}
          author={item.author}
          chapterCount={item.chapterCount}
          coverUrl={item.coverUrl}
          status={item.status}
          onClick={() => onMangaClick?.(item.id)}
        />
      ))}
      <div className="library-add-card" onClick={onAddNew}>
        <div className="library-add-icon">+</div>
        <span>Add Manga</span>
      </div>
    </div>
  )
}
