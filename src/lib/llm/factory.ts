/**
 * LLM Provider Factory
 * 
 * Factory pattern for creating LLM provider instances.
 * Handles provider registration, instantiation, and fallback logic.
 */

import type { LLMProvider, LLMRequest, LLMResponse, StreamChunk, RetryConfig } from './types';
import { defaultRetryConfig, LLMErrorCode } from './types';
import type { LLMProviderConfig } from '@/stores/configStore';
import { GeminiProvider } from './gemini-provider';
import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';
import { LLMError } from '@/lib/errors/llm-error';
import { NetworkError, TimeoutError } from '@/lib/errors/network-error';
import { sleep } from '@/lib/utils';

/**
 * Provider constructor type
 */
type ProviderConstructor = new (config: LLMProviderConfig) => LLMProvider;

/**
 * Provider registry entry
 */
interface ProviderEntry {
  type: string;
  constructor: ProviderConstructor;
}

/**
 * LLM Provider Factory
 * 
 * Creates and manages LLM provider instances with automatic fallback support.
 */
export class LLMProviderFactory {
  private static providers: Map<string, ProviderEntry> = new Map();
  private static instances: Map<string, LLMProvider> = new Map();

  /**
   * Register built-in providers
   */
  static registerBuiltinProviders(): void {
    this.register('gemini', GeminiProvider);
    this.register('openai', OpenAIProvider);
    this.register('anthropic', AnthropicProvider);
  }

  /**
   * Register a provider type
   */
  static register(type: string, constructor: ProviderConstructor): void {
    this.providers.set(type, { type, constructor });
  }

  /**
   * Create a provider instance
   */
  static create(config: LLMProviderConfig): LLMProvider {
    const entry = this.providers.get(config.type);
    
    if (!entry) {
      throw new LLMError(
        `Unknown provider type: ${config.type}`,
        LLMErrorCode.UNKNOWN
      );
    }

    const instance = new entry.constructor(config);
    this.instances.set(config.id, instance);
    return instance;
  }

  /**
   * Get a cached provider instance
   */
  static get(id: string): LLMProvider | undefined {
    return this.instances.get(id);
  }

  /**
   * Get or create a provider instance
   */
  static getOrCreate(config: LLMProviderConfig): LLMProvider {
    const existing = this.instances.get(config.id);
    if (existing) {
      existing.updateConfig(config);
      return existing;
    }
    return this.create(config);
  }

  /**
   * Remove a provider instance from cache
   */
  static remove(id: string): void {
    this.instances.delete(id);
  }

  /**
   * Clear all provider instances
   */
  static clear(): void {
    this.instances.clear();
  }

  /**
   * Get available provider types
   */
  static getAvailableTypes(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider type is registered
   */
  static isRegistered(type: string): boolean {
    return this.providers.has(type);
  }
}

// Register built-in providers on module load
LLMProviderFactory.registerBuiltinProviders();

/**
 * LLM Service with fallback support
 * 
 * Handles provider selection, retry logic, and automatic fallback.
 */
export class LLMService {
  private providers: LLMProvider[];
  private retryConfig: RetryConfig;
  private currentIndex = 0;
  private tokenUsage: Map<string, { prompt: number; completion: number }> = new Map();

  constructor(
    providers: LLMProvider[],
    retryConfig: Partial<RetryConfig> = {}
  ) {
    if (providers.length === 0) {
      throw new LLMError('At least one provider is required', LLMErrorCode.UNKNOWN);
    }
    
    this.providers = providers.filter((p) => p.isConfigured());
    
    if (this.providers.length === 0) {
      throw new LLMError('No configured providers available', LLMErrorCode.UNKNOWN);
    }
    
    this.retryConfig = { ...defaultRetryConfig, ...retryConfig };
  }

  /**
   * Get the current active provider
   */
  getCurrentProvider(): LLMProvider {
    return this.providers[this.currentIndex];
  }

  /**
   * Get all available providers
   */
  getProviders(): LLMProvider[] {
    return [...this.providers];
  }

  /**
   * Switch to next provider (fallback)
   */
  switchToNextProvider(): boolean {
    if (this.currentIndex < this.providers.length - 1) {
      this.currentIndex++;
      return true;
    }
    return false;
  }

  /**
   * Reset to primary provider
   */
  resetToPrimary(): void {
    this.currentIndex = 0;
  }

  /**
   * Send a completion request with retry and fallback
   */
  async complete(request: LLMRequest): Promise<LLMResponse> {
    let lastError: Error | undefined;
    let retryCount = 0;

    while (this.currentIndex < this.providers.length) {
      const provider = this.getCurrentProvider();
      
      try {
        const response = await this.executeWithRetry(provider, request, retryCount);
        this.trackTokenUsage(provider.id, response.usage);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if we should try fallback
        if (this.shouldFallback(error)) {
          if (this.switchToNextProvider()) {
            retryCount = 0; // Reset retry count for new provider
            continue;
          }
        }
        
        throw error;
      }
    }

    throw lastError || new LLMError('All providers failed', LLMErrorCode.UNKNOWN);
  }

  /**
   * Send a streaming request with retry and fallback
   */
  async *stream(request: LLMRequest): AsyncGenerator<StreamChunk, void, unknown> {
    let retryCount = 0;

    while (this.currentIndex < this.providers.length) {
      const provider = this.getCurrentProvider();
      
      try {
        const generator = this.executeStreamWithRetry(provider, request, retryCount);
        
        for await (const chunk of generator) {
          yield chunk;
        }
        return;
      } catch (error) {
        // Check if we should try fallback
        if (this.shouldFallback(error)) {
          if (this.switchToNextProvider()) {
            retryCount = 0;
            continue;
          }
        }
        
        throw error;
      }
    }

    throw new LLMError('All providers failed', LLMErrorCode.UNKNOWN);
  }

  /**
   * Get token usage statistics
   */
  getTokenUsage(providerId?: string): { prompt: number; completion: number } {
    if (providerId) {
      return this.tokenUsage.get(providerId) ?? { prompt: 0, completion: 0 };
    }
    
    let total = { prompt: 0, completion: 0 };
    for (const usage of this.tokenUsage.values()) {
      total.prompt += usage.prompt;
      total.completion += usage.completion;
    }
    return total;
  }

  /**
   * Reset token usage statistics
   */
  resetTokenUsage(): void {
    this.tokenUsage.clear();
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry(
    provider: LLMProvider,
    request: LLMRequest,
    initialRetryCount: number
  ): Promise<LLMResponse> {
    let retryCount = initialRetryCount;
    
    while (retryCount <= this.retryConfig.maxRetries) {
      try {
        return await provider.complete(request);
      } catch (error) {
        if (!this.shouldRetry(error, retryCount)) {
          throw error;
        }
        
        retryCount++;
        const delay = this.calculateDelay(retryCount);
        await sleep(delay);
      }
    }
    
    throw new LLMError('Max retries exceeded', LLMErrorCode.UNKNOWN);
  }

  /**
   * Execute streaming request with retry logic
   */
  private async *executeStreamWithRetry(
    provider: LLMProvider,
    request: LLMRequest,
    initialRetryCount: number
  ): AsyncGenerator<StreamChunk, void, unknown> {
    let retryCount = initialRetryCount;
    
    while (retryCount <= this.retryConfig.maxRetries) {
      try {
        const generator = provider.stream(request);
        
        for await (const chunk of generator) {
          yield chunk;
        }
        return;
      } catch (error) {
        if (!this.shouldRetry(error, retryCount)) {
          throw error;
        }
        
        retryCount++;
        const delay = this.calculateDelay(retryCount);
        await sleep(delay);
      }
    }
    
    throw new LLMError('Max retries exceeded', LLMErrorCode.UNKNOWN);
  }

  /**
   * Check if error warrants a retry
   */
  private shouldRetry(error: unknown, retryCount: number): boolean {
    if (retryCount >= this.retryConfig.maxRetries) {
      return false;
    }
    
    // LLM errors
    if (error instanceof LLMError) {
      return error.shouldRetry();
    }
    
    // Network errors
    if (error instanceof NetworkError) {
      return error.shouldRetry();
    }
    
    if (error instanceof TimeoutError) {
      return true;
    }
    
    // Check for rate limit
    if (error instanceof Error && error.message.includes('429')) {
      return this.retryConfig.retryOnRateLimit;
    }
    
    return false;
  }

  /**
   * Check if we should fallback to next provider
   */
  private shouldFallback(error: unknown): boolean {
    // Don't fallback for client errors
    if (error instanceof LLMError) {
      if (error.llmCode === LLMErrorCode.INVALID_REQUEST ||
          error.llmCode === LLMErrorCode.AUTHENTICATION ||
          error.llmCode === LLMErrorCode.CONTEXT_LENGTH) {
        return false;
      }
      return error.shouldRetry();
    }
    
    return true;
  }

  /**
   * Calculate delay with exponential backoff
   */
  private calculateDelay(retryCount: number): number {
    const delay = Math.min(
      this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffMultiplier, retryCount - 1),
      this.retryConfig.maxDelayMs
    );
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Track token usage
   */
  private trackTokenUsage(providerId: string, usage: { promptTokens: number; completionTokens: number }): void {
    const current = this.tokenUsage.get(providerId) ?? { prompt: 0, completion: 0 };
    current.prompt += usage.promptTokens;
    current.completion += usage.completionTokens;
    this.tokenUsage.set(providerId, current);
  }
}

/**
 * Create an LLM service from provider configurations
 */
export const createLLMService = (
  configs: LLMProviderConfig[],
  retryConfig?: Partial<RetryConfig>
): LLMService => {
  const providers = configs
    .filter((config) => config.enabled)
    .map((config) => LLMProviderFactory.getOrCreate(config));
  
  return new LLMService(providers, retryConfig);
};
