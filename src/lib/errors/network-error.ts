/**
 * Network Error Classes
 * 
 * Errors related to network operations, HTTP requests, and connectivity.
 */

import { AppError, ErrorSeverity } from './base-error';

/**
 * HTTP status code categories
 */
export enum HttpStatusCategory {
  INFORMATIONAL = '1xx',
  SUCCESS = '2xx',
  REDIRECTION = '3xx',
  CLIENT_ERROR = '4xx',
  SERVER_ERROR = '5xx',
  UNKNOWN = 'unknown',
}

/**
 * Get HTTP status category
 */
export const getStatusCategory = (status: number): HttpStatusCategory => {
  if (status >= 100 && status < 200) return HttpStatusCategory.INFORMATIONAL;
  if (status >= 200 && status < 300) return HttpStatusCategory.SUCCESS;
  if (status >= 300 && status < 400) return HttpStatusCategory.REDIRECTION;
  if (status >= 400 && status < 500) return HttpStatusCategory.CLIENT_ERROR;
  if (status >= 500 && status < 600) return HttpStatusCategory.SERVER_ERROR;
  return HttpStatusCategory.UNKNOWN;
};

/**
 * Network error base class
 */
export class NetworkError extends AppError {
  /** HTTP status code if applicable */
  readonly statusCode?: number;
  
  /** URL that was being accessed */
  readonly url?: string;
  
  /** Request method */
  readonly method?: string;
  
  /** Whether the request was retried */
  readonly retried: boolean;

  constructor(
    message: string,
    options: {
      statusCode?: number;
      url?: string;
      method?: string;
      retried?: boolean;
      severity?: ErrorSeverity;
      context?: Record<string, unknown>;
      cause?: Error;
    } = {}
  ) {
    super(message, 'NETWORK_ERROR', {
      severity: options.severity ?? 'error',
      context: {
        ...options.context,
        statusCode: options.statusCode as unknown as string,
        url: options.url,
        method: options.method,
        retried: options.retried,
      },
      cause: options.cause,
    });
    
    this.statusCode = options.statusCode;
    this.url = options.url;
    this.method = options.method;
    this.retried = options.retried ?? false;
  }

  /**
   * Check if error is a client error (4xx)
   */
  isClientError(): boolean {
    return this.statusCode !== undefined && this.statusCode >= 400 && this.statusCode < 500;
  }

  /**
   * Check if error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.statusCode !== undefined && this.statusCode >= 500 && this.statusCode < 600;
  }

  /**
   * Check if the request should be retried
   */
  shouldRetry(): boolean {
    if (this.retried) return false;
    // Retry on server errors, timeouts, or network failures
    return this.isServerError() || 
           this.statusCode === 429 || // Rate limit
           this.statusCode === undefined;
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends NetworkError {
  /** Timeout duration in milliseconds */
  readonly timeoutMs: number;

  constructor(
    message: string = 'Request timeout',
    timeoutMs: number = 0,
    options: Omit<ConstructorParameters<typeof NetworkError>[1], 'severity'> = {}
  ) {
    super(message, {
      ...options,
      severity: 'warning',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).code = 'TIMEOUT_ERROR';
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Connection error
 */
export class ConnectionError extends NetworkError {
  constructor(
    message: string = 'Connection failed',
    options: ConstructorParameters<typeof NetworkError>[1] = {}
  ) {
    super(message, {
      ...options,
      severity: 'error',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).code = 'CONNECTION_ERROR';
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends NetworkError {
  /** Retry after timestamp */
  readonly retryAfter?: number;

  constructor(
    message: string = 'Rate limit exceeded',
    options: ConstructorParameters<typeof NetworkError>[1] & { retryAfter?: number } = {}
  ) {
    super(message, {
      ...options,
      statusCode: 429,
      severity: 'warning',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).code = 'RATE_LIMIT_ERROR';
    this.retryAfter = options.retryAfter;
  }

  /**
   * Get milliseconds to wait before retrying
   */
  getRetryDelay(): number {
    if (this.retryAfter) {
      return Math.max(0, this.retryAfter - Date.now());
    }
    // Default to 60 seconds
    return 60000;
  }
}

/**
 * Create appropriate network error from fetch Response
 */
export const createNetworkError = (
  response: Response,
  url: string,
  method: string
): NetworkError => {
  const status = response.status;
  const category = getStatusCategory(status);
  
  if (status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    return new RateLimitError(response.statusText, {
      statusCode: status,
      url,
      method,
      retryAfter: retryAfter ? Date.now() + parseInt(retryAfter, 10) * 1000 : undefined,
    });
  }
  
  if (category === HttpStatusCategory.CLIENT_ERROR) {
    return new NetworkError(response.statusText, {
      statusCode: status,
      url,
      method,
      severity: 'warning',
    });
  }
  
  return new NetworkError(response.statusText, {
    statusCode: status,
    url,
    method,
  });
};
