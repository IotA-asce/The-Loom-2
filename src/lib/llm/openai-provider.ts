/**
 * OpenAI LLM Provider
 * 
 * Implementation of the LLMProvider interface for OpenAI API.
 * Supports GPT-4 and GPT-3.5 models with streaming.
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
 * OpenAI API request structure
 */
interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  stop?: string[];
  response_format?: { type: 'json_object' };
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
  name?: string;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider implements LLMProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';
  
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    multimodal: true, // GPT-4 Vision
    systemMessages: true,
    maxContextLength: 128000, // GPT-4 Turbo
    functionCalling: true,
    jsonMode: true,
  };
  
  config: LLMProviderConfig;
  private baseUrl = 'https://api.openai.com/v1';

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
      // Try listing models to validate API key
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
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
      const body = this.buildRequestBody(request);
      request.model ?? this.config.defaultModel;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw this.mapError(error, response.status);
      }

      const data: OpenAIResponse = await response.json();
      const choice = data.choices[0];

      if (!choice) {
        throw new LLMError('No response generated', LLMErrorCode.UNKNOWN, { provider: this.id });
      }

      return {
        content: choice.message.content,
        usage: {
          promptTokens: data.usage?.prompt_tokens ?? 0,
          completionTokens: data.usage?.completion_tokens ?? 0,
          totalTokens: data.usage?.total_tokens ?? 0,
        },
        model: data.model,
        finishReason: this.mapFinishReason(choice.finish_reason),
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
    const body = this.buildRequestBody(request, true);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const chunk: OpenAIStreamChunk = JSON.parse(data);
              const choice = chunk.choices?.[0];

              if (choice?.delta?.content) {
                yield {
                  content: choice.delta.content,
                  done: choice.finish_reason !== null,
                  usage: chunk.usage
                    ? {
                        promptTokens: chunk.usage.prompt_tokens,
                        completionTokens: chunk.usage.completion_tokens,
                        totalTokens: chunk.usage.total_tokens,
                      }
                    : undefined,
                };
              } else if (choice?.finish_reason) {
                yield {
                  content: '',
                  done: true,
                  usage: chunk.usage
                    ? {
                        promptTokens: chunk.usage.prompt_tokens,
                        completionTokens: chunk.usage.completion_tokens,
                        totalTokens: chunk.usage.total_tokens,
                      }
                    : undefined,
                };
              }
            } catch {
              // Ignore malformed chunks
            }
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
    // OpenAI tokenizer approximation: ~4 characters per token
    let totalChars = 0;

    for (const msg of messages) {
      if ('content' in msg && typeof msg.content === 'string') {
        totalChars += msg.content.length;
      } else if ('content' in msg && Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === 'text') {
            totalChars += part.text.length;
          } else {
            // GPT-4 Vision: estimate based on image size
            totalChars += 765;
          }
        }
      }
    }

    return Math.ceil(totalChars / 4);
  }

  private buildRequestBody(request: LLMRequest, stream = false): OpenAIRequest {
    const messages: OpenAIMessage[] = [];

    for (const msg of request.messages) {
      if ('content' in msg && typeof msg.content === 'string') {
        messages.push({
          role: msg.role === 'model' ? 'assistant' : msg.role,
          content: msg.content,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(msg as any).name ? { name: (msg as any).name } : {},
        });
      } else if ('content' in msg && Array.isArray(msg.content)) {
        const content: OpenAIMessage['content'] = [];

        for (const part of msg.content) {
          if (part.type === 'text') {
            content.push({ type: 'text', text: part.text });
          } else {
            content.push({
              type: 'image_url',
              image_url: {
                url: `data:${part.mimeType};base64,${part.data}`,
              },
            });
          }
        }

        messages.push({
          role: msg.role === 'model' ? 'assistant' : msg.role,
          content,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(msg as any).name ? { name: (msg as any).name } : {},
        });
      }
    }

    return {
      model: request.model ?? this.config.defaultModel,
      messages,
      max_tokens: request.maxTokens ?? this.config.maxTokens,
      temperature: request.temperature ?? this.config.temperature,
      top_p: request.topP,
      stream,
      stop: request.stopSequences,
      response_format: request.options?.jsonMode ? { type: 'json_object' } : undefined,
    };
  }

  private mapFinishReason(reason: string): LLMResponse['finishReason'] {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'stop';
    }
  }

  private mapError(error: { error?: { code?: string; message?: string; type?: string } }, status: number): LLMError {
    const message = error.error?.message || 'Unknown error';
    const code = error.error?.code;

    if (status === 429 || code === 'rate_limit_exceeded') {
      return new LLMError(message, LLMErrorCode.RATE_LIMIT, { provider: this.id });
    }
    if (status === 401 || status === 403 || code?.includes('auth')) {
      return new LLMError(message, LLMErrorCode.AUTHENTICATION, { provider: this.id });
    }
    if (status === 400) {
      if (message.includes('context') || code === 'context_length_exceeded') {
        return new LLMError(message, LLMErrorCode.CONTEXT_LENGTH, { provider: this.id });
      }
      return new LLMError(message, LLMErrorCode.INVALID_REQUEST, { provider: this.id });
    }
    if (status === 404) {
      return new LLMError(message, LLMErrorCode.MODEL_NOT_FOUND, { provider: this.id });
    }
    if (code === 'content_filter') {
      return new LLMError(message, LLMErrorCode.CONTENT_FILTER, { provider: this.id });
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
