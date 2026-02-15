/**
 * Anthropic Claude LLM Provider
 * 
 * Implementation of the LLMProvider interface for Anthropic API.
 * Supports Claude 3 models (Opus, Sonnet, Haiku) with streaming.
 */

import type {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  StreamChunk,
  Message,
  MultimodalMessage,
  ProviderCapabilities,
} from './types';
import { LLMErrorCode, type ImageContent } from './types';
import type { LLMProviderConfig } from '@/stores/configStore';
import { LLMError } from '@/lib/errors/llm-error';

/**
 * Anthropic API request structure
 */
interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stream?: boolean;
  stop_sequences?: string[];
  system?: string;
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | Array<
    | { type: 'text'; text: string }
    | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  >;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: 'text'; text: string }>;
  model: string;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface AnthropicStreamEvent {
  type: 'message_start' | 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_delta' | 'message_stop';
  message?: {
    id: string;
    type: string;
    role: string;
    content: unknown[];
    model: string;
    stop_reason: string | null;
    stop_sequence: string | null;
    usage: {
      input_tokens: number;
      output_tokens: number;
    };
  };
  index?: number;
  content_block?: { type: string; text: string };
  delta?: { type: string; text: string; stop_reason: string | null };
  usage?: {
    output_tokens: number;
  };
}

/**
 * Anthropic provider implementation
 */
export class AnthropicProvider implements LLMProvider {
  readonly id = 'anthropic';
  readonly name = 'Anthropic Claude';

  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    multimodal: true, // Claude 3 Vision
    systemMessages: true,
    maxContextLength: 200000, // Claude 3
    functionCalling: false, // Not yet available
    jsonMode: false, // Not yet available
  };

  config: LLMProviderConfig;
  private baseUrl = 'https://api.anthropic.com/v1';
  private apiVersion = '2023-06-01';

  constructor(config: LLMProviderConfig) {
    this.config = config;
    if (config.baseUrl) {
      this.baseUrl = config.baseUrl;
    }
  }

  isConfigured(): boolean {
    return Boolean(this.config.apiKey && this.config.enabled);
  }

  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    if (!this.config.apiKey) {
      return { valid: false, error: 'API key is required' };
    }

    try {
      // Try a minimal completion to validate the API key
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'anthropic-version': this.apiVersion,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.defaultModel,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });

      if (response.ok) {
        return { valid: true };
      }

      const error = await response.json();
      return {
        valid: false,
        error: error.error?.message || 'Invalid API key',
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    try {
      const { body, systemMessage } = this.buildRequestBody(request);

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'anthropic-version': this.apiVersion,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...body,
          system: systemMessage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw this.mapError(error, response.status);
      }

      const data: AnthropicResponse = await response.json();
      const content = data.content.find((c) => c.type === 'text');

      if (!content) {
        throw new LLMError('No text content in response', LLMErrorCode.UNKNOWN, { provider: this.id });
      }

      return {
        content: content.text,
        usage: {
          promptTokens: data.usage?.input_tokens ?? 0,
          completionTokens: data.usage?.output_tokens ?? 0,
          totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
        },
        model: data.model,
        finishReason: this.mapFinishReason(data.stop_reason),
        timestamp: Date.now(),
        raw: data,
      };
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      throw new LLMError(
        error instanceof Error ? error.message : 'Request failed',
        LLMErrorCode.UNKNOWN,
        { provider: this.id }
      );
    }
  }

  async *stream(request: LLMRequest): AsyncGenerator<StreamChunk, void, unknown> {
    const { body, systemMessage } = this.buildRequestBody(request, true);

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'anthropic-version': this.apiVersion,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        system: systemMessage,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw this.mapError(error, response.status);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new LLMError('No response body', LLMErrorCode.UNKNOWN, { provider: this.id });
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let accumulatedContent = '';
    let inputTokens = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const event: AnthropicStreamEvent = JSON.parse(data);

            if (event.type === 'message_start' && event.message) {
              inputTokens = event.message.usage.input_tokens;
            }

            if (event.type === 'content_block_delta' && event.delta?.text) {
              accumulatedContent += event.delta.text;
              yield {
                content: event.delta.text,
                done: false,
              };
            }

            if (event.type === 'message_delta') {
              const outputTokens = event.usage?.output_tokens ?? 0;
              yield {
                content: '',
                done: true,
                usage: {
                  promptTokens: inputTokens,
                  completionTokens: outputTokens,
                  totalTokens: inputTokens + outputTokens,
                },
              };
            }

            if (event.type === 'message_stop') {
              yield {
                content: '',
                done: true,
              };
            }
          } catch {
            // Ignore malformed events
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  getAvailableModels(): string[] {
    return this.config.availableModels;
  }

  updateConfig(config: Partial<LLMProviderConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.baseUrl) {
      this.baseUrl = config.baseUrl;
    }
  }

  estimateTokenCount(messages: Message[] | MultimodalMessage[]): number {
    // Claude tokenizer approximation: ~4 characters per token
    let totalChars = 0;

    for (const msg of messages) {
      if ('content' in msg && typeof msg.content === 'string') {
        totalChars += msg.content.length;
      } else if ('content' in msg && Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === 'text') {
            totalChars += part.text.length;
          } else {
            // Claude 3 Vision images
            totalChars += 1600;
          }
        }
      }
    }

    return Math.ceil(totalChars / 4);
  }

  private buildRequestBody(
    request: LLMRequest,
    stream = false
  ): { body: Omit<AnthropicRequest, 'system'>; systemMessage?: string } {
    const messages: AnthropicMessage[] = [];
    let systemMessage: string | undefined;

    for (const msg of request.messages) {
      if (msg.role === 'system') {
        if ('content' in msg && typeof msg.content === 'string') {
          systemMessage = msg.content;
        }
        continue;
      }

      if ('content' in msg && typeof msg.content === 'string') {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      } else if ('content' in msg && Array.isArray(msg.content)) {
        const content: AnthropicMessage['content'] = [];

        for (const part of msg.content) {
          if (part.type === 'text') {
            content.push({ type: 'text', text: part.text });
          } else {
            content.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: part.mimeType,
                data: part.data,
              },
            });
          }
        }

        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content,
        });
      }
    }

    return {
      body: {
        model: request.model ?? this.config.defaultModel,
        messages,
        max_tokens: request.maxTokens ?? this.config.maxTokens,
        temperature: request.temperature ?? this.config.temperature,
        top_p: request.topP,
        stream,
        stop_sequences: request.stopSequences,
      },
      systemMessage,
    };
  }

  private mapFinishReason(reason: string | null): LLMResponse['finishReason'] {
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      default:
        return 'stop';
    }
  }

  private mapError(error: { error?: { type?: string; message?: string } }, status: number): LLMError {
    const message = error.error?.message || 'Unknown error';
    const type = error.error?.type;

    if (status === 429 || type === 'rate_limit_error') {
      return new LLMError(message, LLMErrorCode.RATE_LIMIT, { provider: this.id });
    }
    if (status === 401 || type === 'authentication_error') {
      return new LLMError(message, LLMErrorCode.AUTHENTICATION, { provider: this.id });
    }
    if (type === 'invalid_request_error') {
      if (message.includes('context') || message.includes('token')) {
        return new LLMError(message, LLMErrorCode.CONTEXT_LENGTH, { provider: this.id });
      }
      return new LLMError(message, LLMErrorCode.INVALID_REQUEST, { provider: this.id });
    }
    if (status === 404 || type === 'not_found_error') {
      return new LLMError(message, LLMErrorCode.MODEL_NOT_FOUND, { provider: this.id });
    }

    return new LLMError(message, LLMErrorCode.API_ERROR, { provider: this.id });
  }
  
  /**
   * Analyze images with a prompt
   */
  async analyzeImages(images: string[], prompt: string): Promise<string> {
    const messages: MultimodalMessage[] = [
      {
        role: 'user',
        content: [
          ...images.map((img): ImageContent => ({
            type: 'image',
            data: img.startsWith('data:') ? img.split(',')[1] : img,
            mimeType: 'image/jpeg',
          })),
          { type: 'text', text: prompt },
        ],
      },
    ];
    
    const response = await this.complete({ messages });
    return response.content;
  }
}
