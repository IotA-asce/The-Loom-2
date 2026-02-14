/**
 * Secure Input Component
 * 
 * API key input with masking and visibility toggle.
 */

import React, { useState, forwardRef } from 'react';

/**
 * Secure input props
 */
interface SecureInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Input label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  error?: string;
}

/**
 * Secure input component
 */
export const SecureInput = forwardRef<HTMLInputElement, SecureInputProps>(
  ({ label, helperText, error, className, style, ...props }, ref) => {
    const [showValue, setShowValue] = useState(false);

    const containerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      ...style,
    };

    const labelStyle: React.CSSProperties = {
      fontSize: '14px',
      fontWeight: 500,
      color: '#374151',
    };

    const inputContainerStyle: React.CSSProperties = {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
    };

    const inputStyle: React.CSSProperties = {
      width: '100%',
      padding: '8px 40px 8px 12px',
      fontSize: '14px',
      border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
      borderRadius: '6px',
      backgroundColor: '#fff',
      color: '#111827',
      fontFamily: showValue ? 'inherit' : 'monospace',
      ...props.disabled && {
        backgroundColor: '#f3f4f6',
        cursor: 'not-allowed',
      },
    };

    const toggleButtonStyle: React.CSSProperties = {
      position: 'absolute',
      right: '8px',
      top: '50%',
      transform: 'translateY(-50%)',
      padding: '4px',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: '#6b7280',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    const helperTextStyle: React.CSSProperties = {
      fontSize: '12px',
      color: error ? '#ef4444' : '#6b7280',
    };

    return (
      <div style={containerStyle} className={className}>
        {label && <label style={labelStyle}>{label}</label>}
        <div style={inputContainerStyle}>
          <input
            ref={ref}
            type={showValue ? 'text' : 'password'}
            style={inputStyle}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowValue(!showValue)}
            style={toggleButtonStyle}
            tabIndex={-1}
            title={showValue ? 'Hide' : 'Show'}
          >
            {showValue ? '🙈' : '👁️'}
          </button>
        </div>
        {(helperText || error) && (
          <span style={helperTextStyle}>{error || helperText}</span>
        )}
      </div>
    );
  }
);

SecureInput.displayName = 'SecureInput';

export default SecureInput;
