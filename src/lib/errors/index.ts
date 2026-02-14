/**
 * Error Module Exports
 * 
 * Centralized export point for all error classes and utilities.
 */

// Base error
export { AppError, type ErrorContext, type SerializedError, type ErrorSeverity } from './base-error';
export { LogLevel, errorLogger, setLogLevel, getLogLevel, type LogEntry } from './logger';

// Network errors
export {
  NetworkError,
  TimeoutError,
  ConnectionError,
  RateLimitError,
  createNetworkError,
  HttpStatusCategory,
  getStatusCategory,
} from './network-error';

// LLM errors
export { LLMError, ContextLengthError, TokenBudgetError } from './llm-error';

// Validation errors
export {
  ValidationError,
  RequiredFieldError,
  TypeMismatchError,
  RangeError,
  FormatError,
  type ValidationErrorDetail,
} from './validation-error';

/**
 * Error handler type
 */
export type ErrorHandler = (error: Error) => void;

/**
 * Global error handler registry
 */
const errorHandlers: ErrorHandler[] = [];

/**
 * Register a global error handler
 */
export const registerErrorHandler = (handler: ErrorHandler): (() => void) => {
  errorHandlers.push(handler);
  return () => {
    const index = errorHandlers.indexOf(handler);
    if (index !== -1) {
      errorHandlers.splice(index, 1);
    }
  };
};

/**
 * Process an error through all registered handlers
 */
export const handleError = (error: Error): void => {
  for (const handler of errorHandlers) {
    try {
      handler(error);
    } catch (e) {
      console.error('Error handler failed:', e);
    }
  }
};

/**
 * Determine if an error is a specific error type
 */
export const isErrorType = <T extends Error>(
  error: unknown,
  ErrorClass: new (...args: never[]) => T
): error is T => {
  return error instanceof ErrorClass;
};

/**
 * Safely get error message
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};

/**
 * Safely get error stack
 */
export const getErrorStack = (error: unknown): string | undefined => {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
};
