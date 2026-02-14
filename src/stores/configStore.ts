/**
 * Config Store
 * 
 * Manages LLM provider configurations and API keys.
 * API keys are encrypted before storage.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { STORAGE_KEY_PREFIX } from './base';
import { encryptData, decryptData } from '@/lib/crypto';

/**
 * Individual LLM provider configuration
 */
export interface LLMProviderConfig {
  /** Unique identifier for the provider */
  id: string;
  /** Display name */
  name: string;
  /** Provider type */
  type: 'gemini' | 'openai' | 'anthropic';
  /** API key (encrypted when stored) */
  apiKey: string;
  /** Base URL for API requests (optional, for custom endpoints) */
  baseUrl?: string;
  /** Default model for this provider */
  defaultModel: string;
  /** Available models */
  availableModels: string[];
  /** Whether this provider is enabled */
  enabled: boolean;
  /** Request timeout in milliseconds */
  timeoutMs: number;
  /** Max tokens per request */
  maxTokens: number;
  /** Temperature setting */
  temperature: number;
  /** Created timestamp */
  createdAt: number;
  /** Last updated timestamp */
  updatedAt: number;
}

/**
 * Config state interface
 */
export interface ConfigState {
  // Provider configurations
  providers: LLMProviderConfig[];
  
  // Active provider selection
  activeProviderId: string | null;
  
  // Provider CRUD operations
  addProvider: (provider: Omit<LLMProviderConfig, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateProvider: (id: string, updates: Partial<Omit<LLMProviderConfig, 'id' | 'createdAt'>>) => void;
  removeProvider: (id: string) => void;
  
  // Active provider
  setActiveProvider: (id: string | null) => void;
  getActiveProvider: () => LLMProviderConfig | undefined;
  
  // API key management
  updateApiKey: (id: string, apiKey: string) => void;
  getDecryptedApiKey: (id: string) => string | null;
  
  // Validation
  testProvider: (id: string) => Promise<{ success: boolean; message: string }>;
  
  // Reset
  reset: () => void;
}

/**
 * Generate unique ID
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Default provider configurations
 */
const defaultProviders: LLMProviderConfig[] = [
  {
    id: 'default-gemini',
    name: 'Google Gemini',
    type: 'gemini',
    apiKey: '',
    defaultModel: 'gemini-2.0-flash-exp',
    availableModels: [
      'gemini-2.0-flash-exp',
      'gemini-2.0-flash-thinking-exp-01-21',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
    ],
    enabled: true,
    timeoutMs: 60000,
    maxTokens: 8192,
    temperature: 0.7,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'default-openai',
    name: 'OpenAI',
    type: 'openai',
    apiKey: '',
    defaultModel: 'gpt-4o',
    availableModels: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
    ],
    enabled: false,
    timeoutMs: 60000,
    maxTokens: 4096,
    temperature: 0.7,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'default-anthropic',
    name: 'Anthropic Claude',
    type: 'anthropic',
    apiKey: '',
    defaultModel: 'claude-3-5-sonnet-latest',
    availableModels: [
      'claude-3-5-sonnet-latest',
      'claude-3-5-haiku-latest',
      'claude-3-opus-latest',
    ],
    enabled: false,
    timeoutMs: 60000,
    maxTokens: 4096,
    temperature: 0.7,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

/**
 * Encrypt sensitive fields before storage
 */
const encryptProvider = (provider: LLMProviderConfig): LLMProviderConfig => {
  if (!provider.apiKey || provider.apiKey.startsWith('enc:')) {
    return provider;
  }
  return {
    ...provider,
    apiKey: encryptData(provider.apiKey),
  };
};

/**
 * Config store with encrypted persistence
 */
export const useConfigStore = create<ConfigState>()(
  devtools(
    persist(
      (set, get) => ({
        providers: defaultProviders,
        activeProviderId: 'default-gemini',
        
        addProvider: (provider) => {
          const id = generateId();
          const newProvider: LLMProviderConfig = {
            ...provider,
            id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          set(
            { providers: [...get().providers, newProvider] },
            false,
            'addProvider'
          );
          return id;
        },
        
        updateProvider: (id, updates) => {
          set(
            {
              providers: get().providers.map((p) =>
                p.id === id
                  ? { ...p, ...updates, updatedAt: Date.now() }
                  : p
              ),
            },
            false,
            'updateProvider'
          );
        },
        
        removeProvider: (id) => {
          const { providers, activeProviderId } = get();
          const newProviders = providers.filter((p) => p.id !== id);
          const updates: Partial<ConfigState> = { providers: newProviders };
          
          // Clear active provider if it was removed
          if (activeProviderId === id) {
            updates.activeProviderId = newProviders.find((p) => p.enabled)?.id ?? null;
          }
          
          set(updates, false, 'removeProvider');
        },
        
        setActiveProvider: (id) => {
          set({ activeProviderId: id }, false, 'setActiveProvider');
        },
        
        getActiveProvider: () => {
          const { providers, activeProviderId } = get();
          if (!activeProviderId) return undefined;
          return providers.find((p) => p.id === activeProviderId);
        },
        
        updateApiKey: (id, apiKey) => {
          get().updateProvider(id, { apiKey });
        },
        
        getDecryptedApiKey: (id) => {
          const provider = get().providers.find((p) => p.id === id);
          if (!provider?.apiKey) return null;
          if (provider.apiKey.startsWith('enc:')) {
            return decryptData(provider.apiKey);
          }
          return provider.apiKey;
        },
        
        testProvider: async (id) => {
          const provider = get().providers.find((p) => p.id === id);
          if (!provider) {
            return { success: false, message: 'Provider not found' };
          }
          
          const apiKey = get().getDecryptedApiKey(id);
          if (!apiKey) {
            return { success: false, message: 'API key not configured' };
          }
          
          // This will be implemented with actual provider tests
          // For now, return a placeholder
          return { success: true, message: 'Connection test pending implementation' };
        },
        
        reset: () => {
          set(
            { providers: defaultProviders, activeProviderId: 'default-gemini' },
            false,
            'resetConfig'
          );
        },
      }),
      {
        name: `${STORAGE_KEY_PREFIX}config`,
        version: 1,
        partialize: (state) => ({
          providers: state.providers.map(encryptProvider),
          activeProviderId: state.activeProviderId,
        }),
      }
    ),
    {
      name: 'ConfigStore',
      enabled: import.meta.env.DEV,
    }
  )
);
