/**
 * LLM Provider Types
 * 
 * Core type definitions for the LLM provider abstraction layer.
 * Defines interfaces for providers, requests, responses, and token tracking.
 */

import type { LLMProviderConfig } from '@/stores/configStore';

/**
 * Message role types
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'model';

/**
 * Individual message in a conversation
 */
export interface Message {
  role: MessageRole;
  content: string;
  name?: string;
  timestamp?: number;
}

/**
 * Image content for multimodal requests
 */
export interface ImageContent {
  type: 'image';
  data: string; // base64 encoded
  mimeType: string;
}

/**
 * Text content
 */
export interface TextContent {
  type: 'text';
  text: string;
}

/**
 * Content part for multimodal messages
 */
export type ContentPart = TextContent | ImageContent;

/**
 * Multimodal message with mixed content
 */
export interface MultimodalMessage {
  role: MessageRole;
  content: ContentPart[];
}

/**
 * LLM request parameters
 */
export interface LLMRequest {
  /** Messages for the conversation */
  messages: Message[] | MultimodalMessage[];
  /** Model to use (defaults to provider's default) */
  model?: string;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Temperature for sampling (0-2) */
  temperature?: number;
  /** Top-p sampling */
  topP?: number;
  /** Stop sequences */
  stopSequences?: string[];
  /** Request timeout in milliseconds */
  timeoutMs?: number;
  /** Whether to stream the response */
  stream?: boolean;
  /** Additional provider-specific options */
  options?: Record<string, unknown>;
}

/**
 * Token usage information
 */
export interface TokenUsage {
  /** Prompt/input tokens */
  promptTokens: number;
  /** Completion/output tokens */
  completionTokens: number;
  /** Total tokens used */
  totalTokens: number;
}

/**
 * LLM response
 */
export interface LLMResponse {
  /** Generated content */
  content: string;
  /** Token usage statistics */
  usage: TokenUsage;
  /** Model used for generation */
  model: string;
  /** Finish reason */
  finishReason: 'stop' | 'length' | 'content_filter' | 'error';
  /** Response timestamp */
  timestamp: number;
  /** Raw response for debugging */
  raw?: unknown;
}

/**
 * Streaming response chunk
 */
export interface StreamChunk {
  /** Chunk content (may be partial) */
  content: string;
  /** Whether this is the final chunk */
  done: boolean;
  /** Token usage (only present in final chunk) */
  usage?: TokenUsage;
}

/**
 * Provider capability flags
 */
export interface ProviderCapabilities {
  /** Supports streaming responses */
  streaming: boolean;
  /** Supports multimodal (image) inputs */
  multimodal: boolean;
  /** Supports system messages */
  systemMessages: boolean;
  /** Maximum context length in tokens */
  maxContextLength: number;
  /** Supports function calling */
  functionCalling: boolean;
  /** Supports JSON mode */
  jsonMode: boolean;
}

/**
 * Request metrics for tracking
 */
export interface RequestMetrics {
  /** Request start timestamp */
  startTime: number;
  /** Request end timestamp */
  endTime?: number;
  /** Time to first token (for streaming) */
  timeToFirstToken?: number;
  /** Total duration in milliseconds */
  duration?: number;
  /** Number of retries attempted */
  retryCount: number;
  /** Whether the request succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * LLM Provider interface
 * 
 * All LLM providers must implement this interface for consistent usage
 * across the application.
 */
export interface LLMProvider {
  /** Provider unique identifier */
  readonly id: string;
  
  /** Provider display name */
  readonly name: string;
  
  /** Provider capabilities */
  readonly capabilities: ProviderCapabilities;
  
  /** Current configuration */
  config: LLMProviderConfig;
  
  /**
   * Check if the provider is properly configured and ready to use
   */
  isConfigured(): boolean;
  
  /**
   * Validate the API key/configuration
   * @returns Validation result with optional error message
   */
  validateConfig(): Promise<{ valid: boolean; error?: string }>;
  
  /**
   * Send a completion request
   * @param request - The LLM request
   * @returns Promise resolving to the response
   */
  complete(request: LLMRequest): Promise<LLMResponse>;
  
  /**
   * Send a streaming completion request
   * @param request - The LLM request (must have stream: true)
   * @returns Async generator yielding stream chunks
   */
  stream(request: LLMRequest): AsyncGenerator<StreamChunk, void, unknown>;
  
  /**
   * Get available models for this provider
   */
  getAvailableModels(): string[];
  
  /**
   * Update provider configuration
   */
  updateConfig(config: Partial<LLMProviderConfig>): void;
  
  /**
   * Get estimated token count for messages
   * @param messages - Messages to count
   */
  estimateTokenCount(messages: Message[] | MultimodalMessage[]): number;
  
  /**
   * Analyze images with a prompt
   * @param images - Array of image URLs or base64 data
   * @param prompt - Analysis prompt
   * @returns Analysis result as string
   */
  analyzeImages(images: string[], prompt: string): Promise<string>;
}

/**
 * Provider factory function type
 */
export type ProviderFactory = (config: LLMProviderConfig) => LLMProvider;

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds */
  initialDelayMs: number;
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** Whether to retry on rate limit errors */
  retryOnRateLimit: boolean;
}

/**
 * Default retry configuration
 */
export const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryOnRateLimit: true,
};

/**
 * Error codes for LLM operations
 */
export enum LLMErrorCode {
  UNKNOWN = 'UNKNOWN_ERROR',
  API_ERROR = 'API_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  INVALID_REQUEST = 'INVALID_REQUEST',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  TIMEOUT = 'TIMEOUT',
  NETWORK = 'NETWORK_ERROR',
  CONTENT_FILTER = 'CONTENT_FILTER',
  CONTEXT_LENGTH = 'CONTEXT_LENGTH_EXCEEDED',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
}
