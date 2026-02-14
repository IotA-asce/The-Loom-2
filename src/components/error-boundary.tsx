/**
 * Error Boundary Component
 * 
 * React error boundary for catching and gracefully handling errors.
 * Provides fallback UI and error reporting.
 */

import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { AppError } from '@/lib/errors';
import { errorLogger } from '@/lib/errors/logger';

/**
 * Error boundary props
 */
interface ErrorBoundaryProps {
  /** Children to render */
  children: ReactNode;
  /** Fallback component to render on error */
  fallback?: ReactNode;
  /** Custom fallback component with error details */
  FallbackComponent?: React.ComponentType<{
    error: Error;
    resetError: () => void;
    errorInfo?: ErrorInfo;
  }>;
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Keys to reset error boundary when changed */
  resetKeys?: unknown[];
}

/**
 * Error boundary state
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Default fallback component
 */
const DefaultFallback: React.FC<{
  error: Error;
  resetError: () => void;
  errorInfo?: ErrorInfo;
}> = ({ error, resetError, errorInfo }) => (
  <div
    style={{
      padding: '20px',
      margin: '20px',
      border: '1px solid #ff6b6b',
      borderRadius: '8px',
      backgroundColor: '#fff5f5',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}
  >
    <h2 style={{ color: '#c53030', marginTop: 0 }}>Something went wrong</h2>
    <p style={{ color: '#742a2a' }}>
      An error occurred in this component. You can try to recover or reload the page.
    </p>
    
    <details style={{ marginTop: '16px', cursor: 'pointer' }}>
      <summary style={{ color: '#742a2a', fontWeight: 500 }}>
        Error details
      </summary>
      <pre
        style={{
          marginTop: '12px',
          padding: '12px',
          backgroundColor: '#fed7d7',
          borderRadius: '4px',
          fontSize: '12px',
          overflow: 'auto',
          maxHeight: '300px',
        }}
      >
        {error.name}: {error.message}
        {'\n'}
        {error.stack}
        {errorInfo?.componentStack && (
          <>
            {'\n\n'}Component Stack:{'\n'}
            {errorInfo.componentStack}
          </>
        )}
      </pre>
    </details>
    
    <div style={{ marginTop: '16px' }}>
      <button
        onClick={resetError}
        style={{
          padding: '8px 16px',
          backgroundColor: '#c53030',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        Try Again
      </button>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginLeft: '8px',
          padding: '8px 16px',
          backgroundColor: 'transparent',
          color: '#c53030',
          border: '1px solid #c53030',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        Reload Page
      </button>
    </div>
  </div>
);

/**
 * Error Boundary component
 * 
 * Catches errors in child components and renders a fallback UI.
 * Logs errors for debugging and provides recovery options.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error info
    this.setState({ errorInfo });

    // Log the error
    const appError = error instanceof AppError
      ? error
      : new AppError(error.message, 'REACT_ERROR', {
          context: {
            componentStack: errorInfo.componentStack,
          },
          cause: error,
        });
    
    errorLogger.error(appError);

    // Call onError callback if provided
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { hasError } = this.state;
    const { resetKeys } = this.props;

    // Reset error boundary if resetKeys changed
    if (hasError && resetKeys && resetKeys !== prevProps.resetKeys) {
      const hasKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );
      
      if (hasKeyChanged) {
        this.resetError();
      }
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, FallbackComponent } = this.props;

    if (!hasError || !error) {
      return children;
    }

    // Custom fallback component
    if (FallbackComponent) {
      return (
        <FallbackComponent
          error={error}
          resetError={this.resetError}
          errorInfo={errorInfo ?? undefined}
        />
      );
    }

    // Simple fallback node
    if (fallback) {
      return fallback;
    }

    // Default fallback
    return (
      <DefaultFallback
        error={error}
        resetError={this.resetError}
        errorInfo={errorInfo ?? undefined}
      />
    );
  }
}

/**
 * withErrorBoundary HOC
 * 
 * Wraps a component with an error boundary.
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> => {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * useErrorBoundary hook
 * 
 * Provides a way to reset the error boundary from child components.
 */
export const useErrorBoundary = (): { resetBoundary: () => void } => {
  // This is a placeholder - in real implementation, this would use context
  // to communicate with the parent error boundary
  return {
    resetBoundary: () => {
      console.warn('useErrorBoundary: No error boundary found in parent tree');
    },
  };
};
