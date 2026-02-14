import React from 'react'
import './MangaCard.css'

export interface MangaCardProps {
  title: string
  author?: string
  chapterCount: number
  coverUrl?: string
  status: 'new' | 'analyzing' | 'analyzed'
  onClick?: () => void
}

export const MangaCard: React.FC<MangaCardProps> = ({
  title,
  author,
  chapterCount,
  coverUrl,
  status,
  onClick,
}) => {
  const statusLabels = {
    new: 'New',
    analyzing: 'Analyzing...',
    analyzed: 'Analyzed',
  }

  const statusClasses = {
    new: 'status-new',
    analyzing: 'status-analyzing',
    analyzed: 'status-analyzed',
  }

  return (
    <div className="manga-card" onClick={onClick}>
      <div className="manga-cover">
        {coverUrl ? (
          <img src={coverUrl} alt={title} loading="lazy" />
        ) : (
          <div className="manga-cover-placeholder">📖</div>
        )}
        <span className={`manga-status ${statusClasses[status]}`}>
          {statusLabels[status]}
        </span>
      </div>
      <div className="manga-info">
        <h4 className="manga-title">{title}</h4>
        {author && <p className="manga-author">{author}</p>}
        <p className="manga-chapters">{chapterCount} chapters</p>
      </div>
    </div>
  )
}
