import React from 'react'
import './ProgressModal.css'

export interface ProgressModalProps {
  isOpen: boolean
  title: string
  current: number
  total: number
  status: string
  onCancel?: () => void
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  isOpen,
  title,
  current,
  total,
  status,
  onCancel,
}) => {
  if (!isOpen) return null

  const percent = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className="progress-modal-overlay">
      <div className="progress-modal">
        <h3 className="progress-title">{title}</h3>
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${percent}%` }} />
        </div>
        <p className="progress-status">
          {status} ({current} / {total})
        </p>
        {onCancel && (
          <button className="progress-cancel" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
