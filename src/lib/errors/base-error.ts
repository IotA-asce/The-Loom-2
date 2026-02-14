/**
 * Base Application Error Class
 * 
 * All application errors extend this class for consistent error handling,
 * logging, and user feedback.
 */

/**
 * Error severity levels
 */
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

/**
 * Error context for additional debugging information
 */
export interface ErrorContext extends Record<string, unknown> {
  /** Component or module where error occurred */
  component?: string;
  /** Operation being performed */
  operation?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** User action that triggered the error */
  userAction?: string;
  /** Timestamp when error occurred */
  timestamp: number;
}

/**
 * Serialized error for storage/transmission
 */
export interface SerializedError {
  name: string;
  message: string;
  code: string;
  severity: ErrorSeverity;
  stack?: string;
  context: ErrorContext;
  recoverable: boolean;
}

/**
 * Base application error class
 */
export class AppError extends Error {
  /** Error code for categorization */
  readonly code: string;
  
  /** Error severity level */
  readonly severity: ErrorSeverity;
  
  /** Error context */
  readonly context: ErrorContext;
  
  /** Whether the error is recoverable */
  readonly recoverable: boolean;
  
  /** Original error if wrapped */
  readonly cause?: Error;

  constructor(
    message: string,
    code: string = 'APP_ERROR',
    options: {
      severity?: ErrorSeverity;
      context?: Partial<ErrorContext>;
      recoverable?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.severity = options.severity ?? 'error';
    this.context = {
      timestamp: Date.now(),
      ...options.context,
    };
    this.recoverable = options.recoverable ?? true;
    this.cause = options.cause;

    // Maintain proper stack trace (V8 environments)
    if ('captureStackTrace' in Error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serialize error for storage or transmission
   */
  serialize(): SerializedError {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      stack: this.stack,
      context: this.context,
      recoverable: this.recoverable,
    };
  }

  /**
   * Create error from serialized data
   */
  static deserialize(data: SerializedError): AppError {
    const error = new AppError(data.message, data.code, {
      severity: data.severity,
      context: data.context,
      recoverable: data.recoverable,
    });
    error.stack = data.stack;
    return error;
  }

  /**
   * Get a user-friendly error message
   */
  getUserMessage(): string {
    return this.message;
  }

  /**
   * Check if error is of a specific code
   */
  is(code: string): boolean {
    return this.code === code;
  }

  /**
   * Convert to string for logging
   */
  toString(): string {
    return `[${this.code}] ${this.name}: ${this.message}`;
  }
}
