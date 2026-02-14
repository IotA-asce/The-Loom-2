import React from 'react'
import { ChapterSegment } from '@/lib/image/chapterSegmentation'
import './ChapterSegmentationReview.css'

export interface ChapterSegmentationReviewProps {
  segments: ChapterSegment[]
  pageThumbnails: string[]
  _onAdjustBoundary: (segmentIndex: number, newStartPage: number) => void
  onConfirm: () => void
}

export const ChapterSegmentationReview: React.FC<
  ChapterSegmentationReviewProps
> = ({ segments, pageThumbnails, _onAdjustBoundary, onConfirm }) => {
  // @ts-ignore - reserved for future use
  void _onAdjustBoundary
  return (
    <div className="segmentation-review">
      <h3 className="review-title">Review Chapter Segments</h3>
      <p className="review-subtitle">
        Adjust chapter boundaries if needed
      </p>

      <div className="segments-list">
        {segments.map((segment, index) => (
          <div key={index} className="segment-item">
            <div className="segment-header">
              <span className="segment-type">{segment.type}</span>
              <span className="segment-pages">
                Pages {segment.startPage + 1} - {segment.endPage + 1}
              </span>
              <span className="segment-confidence">
                {Math.round(segment.confidence * 100)}% confidence
              </span>
            </div>
            <div className="segment-thumbnails">
              {pageThumbnails
                .slice(segment.startPage, segment.startPage + 3)
                .map((thumb, i) => (
                  <img key={i} src={thumb} alt={`Page ${i}`} />
                ))}
            </div>
          </div>
        ))}
      </div>

      <button className="segment-confirm" onClick={onConfirm}>
        Confirm Segments
      </button>
    </div>
  )
}
