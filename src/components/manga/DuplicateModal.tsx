import React from 'react'
import './DuplicateModal.css'

export type DuplicateAction = 'skip' | 'replace' | 'import'

export interface DuplicateModalProps {
  isOpen: boolean
  fileName: string
  existingTitle: string
  onAction: (action: DuplicateAction) => void
}

export const DuplicateModal: React.FC<DuplicateModalProps> = ({
  isOpen,
  fileName,
  existingTitle,
  onAction,
}) => {
  if (!isOpen) return null

  return (
    <div className="duplicate-modal-overlay">
      <div className="duplicate-modal">
        <h3 className="duplicate-title">Duplicate Detected</h3>
        <p className="duplicate-message">
          <strong>{fileName}</strong> appears to be a duplicate of{' '}
          <strong>{existingTitle}</strong>.
        </p>
        <p className="duplicate-hint">What would you like to do?</p>
        <div className="duplicate-actions">
          <button className="btn-skip" onClick={() => onAction('skip')}>
            Skip
          </button>
          <button className="btn-replace" onClick={() => onAction('replace')}>
            Replace
          </button>
          <button className="btn-import" onClick={() => onAction('import')}>
            Import as New
          </button>
        </div>
      </div>
    </div>
  )
}
