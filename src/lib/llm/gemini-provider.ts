/**
 * Google Gemini LLM Provider
 * 
 * Implementation of the LLMProvider interface for Google Gemini API.
 * Supports multimodal inputs, streaming, and the full Gemini feature set.
 */

import type {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  StreamChunk,
  Message,
  MultimodalMessage,
  ProviderCapabilities,
  RequestMetrics,
} from './types';
import { LLMErrorCode, type ImageContent } from './types';
import type { LLMProviderConfig } from '@/stores/configStore';
import { LLMError } from '@/lib/errors/llm-error';

/**
 * Gemini API request structure
 */
interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig?: {
    temperature?: number;
    topP?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
  };
  safetySettings?: GeminiSafetySetting[];
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

interface GeminiSafetySetting {
  category: string;
  threshold: string;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason: string;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  modelVersion: string;
}

interface GeminiStreamChunk {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * Gemini provider implementation
 */
export class GeminiProvider implements LLMProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini';
  
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    multimodal: true,
    systemMessages: true,
    maxContextLength: 1000000, // 1M tokens for Gemini 1.5 Pro
    functionCalling: true,
    jsonMode: true,
  };
  
  config: LLMProviderConfig;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  
  constructor(config: LLMProviderConfig) {
    this.config = config;
  }
  
  isConfigured(): boolean {
    return Boolean(this.config.apiKey && this.config.enabled);
  }
  
  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    if (!this.config.apiKey) {
      return { valid: false, error: 'API key is required' };
    }
    
    try {
      // Try a simple request to validate the API key
      const response = await this.makeRequest('models/gemini-1.5-flash:generateContent', {
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        generationConfig: { maxOutputTokens: 1 },
      });
      
      if (response.ok) {
        return { valid: true };
      }
      
      const error = await response.json();
      return { 
        valid: false, 
        error: error.error?.message || 'Invalid API key' 
      };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }
  
  async complete(request: LLMRequest): Promise<LLMResponse> {
    const metrics: RequestMetrics = {
      startTime: Date.now(),
      retryCount: 0,
      success: false,
    };
    
    try {
      const body = this.buildRequestBody(request);
      const modelName = this.getModelName(request.model);
      
      const response = await this.makeRequest(`models/${modelName}:generateContent`, body);
      
      if (!response.ok) {
        const error = await response.json();
        throw this.mapError(error, response.status);
      }
      
      const data: GeminiResponse = await response.json();
      metrics.endTime = Date.now();
      metrics.success = true;
      
      const candidate = data.candidates[0];
      if (!candidate) {
        throw new LLMError('No response generated', LLMErrorCode.UNKNOWN);
      }
      
      return {
        content: candidate.content.parts.map((p) => p.text).join(''),
        usage: {
          promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
          completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
          totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
        },
        model: data.modelVersion || modelName,
        finishReason: this.mapFinishReason(candidate.finishReason),
        timestamp: Date.now(),
        raw: data,
      };
    } catch (error) {
      metrics.endTime = Date.now();
      metrics.error = error instanceof Error ? error.message : 'Unknown error';
      
      if (error instanceof LLMError) {
        throw error;
      }
      throw new LLMError(
        error instanceof Error ? error.message : 'Request failed',
        LLMErrorCode.UNKNOWN
      );
    }
  }
  
  async *stream(request: LLMRequest): AsyncGenerator<StreamChunk, void, unknown> {
    const body = this.buildRequestBody(request);
    const modelName = this.getModelName(request.model);
    
    const response = await this.makeRequest(
      `models/${modelName}:streamGenerateContent?alt=sse`,
      body
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw this.mapError(error, response.status);
    }
    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new LLMError('No response body', LLMErrorCode.UNKNOWN);
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
              const chunk: GeminiStreamChunk = JSON.parse(data);
              const candidate = chunk.candidates?.[0];
              
              if (candidate?.content?.parts) {
                yield {
                  content: candidate.content.parts.map((p) => p.text).join(''),
                  done: candidate.finishReason !== undefined,
                  usage: chunk.usageMetadata
                    ? {
                        promptTokens: chunk.usageMetadata.promptTokenCount,
                        completionTokens: chunk.usageMetadata.candidatesTokenCount,
                        totalTokens: chunk.usageMetadata.totalTokenCount,
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
  }
  
  estimateTokenCount(messages: Message[] | MultimodalMessage[]): number {
    // Rough estimation: ~4 characters per token for English text
    let totalChars = 0;
    
    for (const msg of messages) {
      if ('content' in msg && typeof msg.content === 'string') {
        totalChars += msg.content.length;
      } else if ('content' in msg && Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === 'text') {
            totalChars += part.text.length;
          } else {
            // Estimate 258 tokens for images
            totalChars += 258 * 4;
          }
        }
      }
    }
    
    return Math.ceil(totalChars / 4);
  }
  
  private buildRequestBody(request: LLMRequest): GeminiRequest {
    const contents: GeminiContent[] = [];
    
    // Convert messages to Gemini format
    for (const msg of request.messages) {
      if ('content' in msg && typeof msg.content === 'string') {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      } else if ('content' in msg && Array.isArray(msg.content)) {
        const parts: GeminiPart[] = [];
        
        for (const part of msg.content) {
          if (part.type === 'text') {
            parts.push({ text: part.text });
          } else {
            parts.push({
              inlineData: {
                mimeType: part.mimeType,
                data: part.data,
              },
            });
          }
        }
        
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts,
        });
      }
    }
    
    return {
      contents,
      generationConfig: {
        temperature: request.temperature ?? this.config.temperature,
        topP: request.topP ?? 0.95,
        maxOutputTokens: request.maxTokens ?? this.config.maxTokens,
        stopSequences: request.stopSequences,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_NONE',
        },
      ],
    };
  }
  
  private async makeRequest(endpoint: string, body: unknown): Promise<Response> {
    const url = `${this.baseUrl}/${endpoint}&key=${this.config.apiKey}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
    
    try {
      return await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new LLMError('Request timeout', LLMErrorCode.TIMEOUT);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  private getModelName(model?: string): string {
    return model ?? this.config.defaultModel;
  }
  
  private mapFinishReason(reason: string): LLMResponse['finishReason'] {
    switch (reason) {
      case 'STOP':
        return 'stop';
      case 'MAX_TOKENS':
        return 'length';
      case 'SAFETY':
        return 'content_filter';
      default:
        return 'stop';
    }
  }
  
  private mapError(error: { error?: { code?: number; message?: string; status?: string } }, status: number): LLMError {
    const message = error.error?.message || 'Unknown error';
    
    if (status === 429) {
      return new LLMError(message, LLMErrorCode.RATE_LIMIT);
    }
    if (status === 401 || status === 403) {
      return new LLMError(message, LLMErrorCode.AUTHENTICATION);
    }
    if (status === 400) {
      if (message.includes('context')) {
        return new LLMError(message, LLMErrorCode.CONTEXT_LENGTH);
      }
      return new LLMError(message, LLMErrorCode.INVALID_REQUEST);
    }
    if (status === 404) {
      return new LLMError(message, LLMErrorCode.MODEL_NOT_FOUND);
    }
    
    return new LLMError(message, LLMErrorCode.API_ERROR);
  }
  
  /**
   * Analyze images with a prompt
   */
  async analyzeImages(images: string[], prompt: string): Promise<string> {
    // Convert images to multimodal message format
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
