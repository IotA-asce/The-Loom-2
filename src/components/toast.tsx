/**
 * Toast Notification System
 * 
 * Toast notifications for user feedback.
 * Auto-dismiss with progress indicator.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useUIStore, type Toast } from '@/stores/uiStore';

/**
 * Toast component
 */
const ToastItem: React.FC<{
  toast: Toast;
  onRemove: (id: string) => void;
}> = ({ toast, onRemove }) => {
  const [progress, setProgress] = useState(100);
  const duration = toast.duration ?? 5000;

  useEffect(() => {
    if (duration <= 0) return;

    const startTime = Date.now();
    const endTime = startTime + duration;

    const updateProgress = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const newProgress = (remaining / duration) * 100;
      setProgress(newProgress);

      if (remaining > 0) {
        requestAnimationFrame(updateProgress);
      }
    };

    const animationFrame = requestAnimationFrame(updateProgress);
    const timeout = setTimeout(() => onRemove(toast.id), duration);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(timeout);
    };
  }, [toast.id, duration, onRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '!';
      case 'info':
        return 'ℹ';
      default:
        return '•';
    }
  };

  const getStyles = () => {
    const base = {
      padding: '12px 16px',
      borderRadius: '8px',
      color: '#fff',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      minWidth: '300px',
      maxWidth: '500px',
      position: 'relative' as const,
      overflow: 'hidden',
    };

    const colors = {
      success: { backgroundColor: '#10b981' },
      error: { backgroundColor: '#ef4444' },
      warning: { backgroundColor: '#f59e0b' },
      info: { backgroundColor: '#3b82f6' },
    };

    return { ...base, ...colors[toast.type] };
  };

  return (
    <div style={getStyles()}>
      {/* Icon */}
      <div
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          flexShrink: 0,
        }}
      >
        {getIcon()}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', lineHeight: 1.4 }}>{toast.message}</div>
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              onRemove(toast.id);
            }}
            style={{
              marginTop: '8px',
              padding: '4px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.6)',
          cursor: 'pointer',
          fontSize: '16px',
          lineHeight: 1,
          padding: 0,
          flexShrink: 0,
        }}
      >
        ×
      </button>

      {/* Progress bar */}
      {duration > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '3px',
            width: `${progress}%`,
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            transition: 'width 0.1s linear',
          }}
        />
      )}
    </div>
  );
};

/**
 * Toast container component
 */
export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  const handleRemove = useCallback(
    (id: string) => {
      removeToast(id);
    },
    [removeToast]
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={toast} onRemove={handleRemove} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
