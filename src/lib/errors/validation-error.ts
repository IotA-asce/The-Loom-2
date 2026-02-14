/**
 * Validation Error Classes
 * 
 * Errors related to data validation, schema validation, and user input.
 */

import { AppError } from './base-error';

/**
 * Validation error details
 */
export interface ValidationErrorDetail {
  /** Field path (e.g., 'user.email') */
  path: string;
  
  /** Error message */
  message: string;
  
  /** Error code */
  code: string;
  
  /** Actual value (optional) */
  value?: unknown;
  
  /** Expected value/type (optional) */
  expected?: unknown;
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  /** Validation error details */
  readonly details: ValidationErrorDetail[];
  
  /** Schema name if applicable */
  readonly schema?: string;

  constructor(
    message: string = 'Validation failed',
    details: ValidationErrorDetail | ValidationErrorDetail[] = [],
    options: {
      schema?: string;
      context?: Record<string, unknown>;
    } = {}
  ) {
    const detailArray = Array.isArray(details) ? details : [details];
    
    super(message, 'VALIDATION_ERROR', {
      severity: 'warning',
      context: {
        ...options.context,
        schema: options.schema,
        details: detailArray,
      },
    });
    
    this.details = detailArray;
    this.schema = options.schema;
  }

  /**
   * Get errors for a specific field
   */
  getFieldErrors(path: string): ValidationErrorDetail[] {
    return this.details.filter((d) => d.path === path || d.path.startsWith(`${path}.`));
  }

  /**
   * Get all field paths with errors
   */
  getErrorFields(): string[] {
    return [...new Set(this.details.map((d) => d.path))];
  }

  /**
   * Format errors for display
   */
  formatErrors(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    
    for (const detail of this.details) {
      if (!result[detail.path]) {
        result[detail.path] = [];
      }
      result[detail.path].push(detail.message);
    }
    
    return result;
  }

  /**
   * Create error from Zod validation result
   */
  static fromZodError(zodError: { issues: Array<{ path: (string | number)[]; message: string; code: string }> }): ValidationError {
    const details: ValidationErrorDetail[] = zodError.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));
    
    return new ValidationError('Validation failed', details);
  }
}

/**
 * Required field error
 */
export class RequiredFieldError extends ValidationError {
  constructor(field: string, options: { context?: Record<string, unknown> } = {}) {
    super(
      `Field '${field}' is required`,
      {
        path: field,
        message: 'This field is required',
        code: 'REQUIRED',
      },
      options
    );
    this.code = 'REQUIRED_FIELD';
  }
}

/**
 * Type mismatch error
 */
export class TypeMismatchError extends ValidationError {
  constructor(
    field: string,
    expected: string,
    actual: unknown,
    options: { context?: Record<string, unknown> } = {}
  ) {
    super(
      `Field '${field}' must be of type ${expected}`,
      {
        path: field,
        message: `Expected ${expected}, got ${typeof actual}`,
        code: 'TYPE_MISMATCH',
        value: actual,
        expected,
      },
      options
    );
    this.code = 'TYPE_MISMATCH';
  }
}

/**
 * Range error
 */
export class RangeError extends ValidationError {
  constructor(
    field: string,
    value: number,
    min?: number,
    max?: number,
    options: { context?: Record<string, unknown> } = {}
  ) {
    let message: string;
    let code: string;
    
    if (min !== undefined && max !== undefined) {
      message = `Must be between ${min} and ${max}`;
      code = 'RANGE';
    } else if (min !== undefined) {
      message = `Must be at least ${min}`;
      code = 'MIN';
    } else if (max !== undefined) {
      message = `Must be at most ${max}`;
      code = 'MAX';
    } else {
      message = 'Invalid range';
      code = 'RANGE';
    }
    
    super(
      `Field '${field}' out of range`,
      {
        path: field,
        message,
        code,
        value,
        expected: { min, max },
      },
      options
    );
    this.code = 'RANGE_ERROR';
  }
}

/**
 * Format error
 */
export class FormatError extends ValidationError {
  constructor(
    field: string,
    format: string,
    value: unknown,
    options: { context?: Record<string, unknown> } = {}
  ) {
    super(
      `Field '${field}' has invalid format`,
      {
        path: field,
        message: `Must match format: ${format}`,
        code: 'FORMAT',
        value,
        expected: format,
      },
      options
    );
    this.code = 'FORMAT_ERROR';
  }
}
