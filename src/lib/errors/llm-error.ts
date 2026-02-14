/**
 * LLM Error Classes
 * 
 * Errors specific to LLM operations and provider interactions.
 */

import { AppError, ErrorSeverity } from './base-error';
import { LLMErrorCode } from '@/lib/llm/types';

/**
 * LLM error class
 */
export class LLMError extends AppError {
  /** LLM-specific error code */
  readonly llmCode: LLMErrorCode;
  
  /** Provider that raised the error */
  readonly provider?: string;
  
  /** Model being used */
  readonly model?: string;
  
  /** Token usage if available */
  readonly tokenUsage?: {
    prompt: number;
    completion: number;
  };

  constructor(
    message: string,
    llmCode: LLMErrorCode = LLMErrorCode.UNKNOWN,
    options: {
      provider?: string;
      model?: string;
      tokenUsage?: { prompt: number; completion: number };
      severity?: ErrorSeverity;
      context?: Record<string, unknown>;
      cause?: Error;
    } = {}
  ) {
    super(message, `LLM_${llmCode}`, {
      severity: options.severity ?? 'error',
      context: {
        ...options.context,
        llmCode,
        provider: options.provider,
        model: options.model,
      },
      cause: options.cause,
    });
    
    this.llmCode = llmCode;
    this.provider = options.provider;
    this.model = options.model;
    this.tokenUsage = options.tokenUsage;
  }

  /**
   * Check if error is a rate limit error
   */
  isRateLimit(): boolean {
    return this.llmCode === LLMErrorCode.RATE_LIMIT;
  }

  /**
   * Check if error is an authentication error
   */
  isAuthentication(): boolean {
    return this.llmCode === LLMErrorCode.AUTHENTICATION;
  }

  /**
   * Check if error is a context length error
   */
  isContextLength(): boolean {
    return this.llmCode === LLMErrorCode.CONTEXT_LENGTH;
  }

  /**
   * Check if the request should be retried
   */
  shouldRetry(): boolean {
    return [
      LLMErrorCode.RATE_LIMIT,
      LLMErrorCode.TIMEOUT,
      LLMErrorCode.NETWORK,
      LLMErrorCode.API_ERROR,
    ].includes(this.llmCode);
  }

  /**
   * Get user-friendly message
   */
  getUserMessage(): string {
    switch (this.llmCode) {
      case LLMErrorCode.RATE_LIMIT:
        return 'Too many requests. Please wait a moment and try again.';
      case LLMErrorCode.AUTHENTICATION:
        return 'API key is invalid or expired. Please check your settings.';
      case LLMErrorCode.CONTEXT_LENGTH:
        return 'The content is too long for this model. Try reducing the input.';
      case LLMErrorCode.TIMEOUT:
        return 'The request timed out. Please try again.';
      case LLMErrorCode.NETWORK:
        return 'Network error. Please check your connection.';
      case LLMErrorCode.CONTENT_FILTER:
        return 'The content was filtered by the provider safety settings.';
      case LLMErrorCode.MODEL_NOT_FOUND:
        return 'The selected model is not available. Please choose another.';
      default:
        return 'An error occurred with the AI service. Please try again.';
    }
  }
}

/**
 * Context length exceeded error
 */
export class ContextLengthError extends LLMError {
  /** Maximum context length for the model */
  readonly maxLength: number;
  
  /** Actual content length */
  readonly actualLength: number;

  constructor(
    maxLength: number,
    actualLength: number,
    options: Omit<ConstructorParameters<typeof LLMError>[2], 'severity'> = {}
  ) {
    super(
      `Context length exceeded: ${actualLength} > ${maxLength}`,
      LLMErrorCode.CONTEXT_LENGTH,
      {
        ...options,
        severity: 'warning',
      }
    );
    this.maxLength = maxLength;
    this.actualLength = actualLength;
  }

  /**
   * Get suggested truncation percentage
   */
  getSuggestedTruncation(): number {
    return Math.ceil(((this.actualLength - this.maxLength) / this.actualLength) * 100);
  }
}

/**
 * Token budget exceeded error
 */
export class TokenBudgetError extends LLMError {
  readonly used: number;
  readonly budget: number;

  constructor(
    used: number,
    budget: number,
    options: ConstructorParameters<typeof LLMError>[2] = {}
  ) {
    super(
      `Token budget exceeded: ${used} / ${budget}`,
      LLMErrorCode.UNKNOWN,
      options
    );
    this.used = used;
    this.budget = budget;
  }
}
