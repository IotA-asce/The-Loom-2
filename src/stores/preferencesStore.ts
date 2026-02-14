/**
 * Preferences Store
 * 
 * Manages user preferences including theme, default LLM provider, and language settings.
 * Persisted to localStorage for persistence across sessions.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { STORAGE_KEY_PREFIX } from './base';

/**
 * Available theme modes
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Available UI languages
 */
export type Language = 'en' | 'ja' | 'zh' | 'ko' | 'es' | 'fr' | 'de';

/**
 * Available LLM providers for default selection
 */
export type LLMProviderId = 'gemini' | 'openai' | 'anthropic';

/**
 * Preferences state interface
 */
export interface PreferencesState {
  // Theme settings
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  
  // LLM settings
  defaultLLMProvider: LLMProviderId;
  setDefaultLLMProvider: (provider: LLMProviderId) => void;
  
  // Language settings
  language: Language;
  setLanguage: (language: Language) => void;
  
  // Analysis preferences
  analysisSpeed: 'fast' | 'balanced' | 'thorough';
  setAnalysisSpeed: (speed: 'fast' | 'balanced' | 'thorough') => void;
  
  // Display preferences
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Reset to defaults
  reset: () => void;
}

/**
 * Default preferences
 */
const defaultPreferences: Omit<
  PreferencesState,
  | 'setTheme'
  | 'setDefaultLLMProvider'
  | 'setLanguage'
  | 'setAnalysisSpeed'
  | 'setSidebarCollapsed'
  | 'reset'
> = {
  theme: 'system',
  defaultLLMProvider: 'gemini',
  language: 'en',
  analysisSpeed: 'balanced',
  sidebarCollapsed: false,
};

/**
 * Preferences store with persistence
 */
export const usePreferencesStore = create<PreferencesState>()(
  devtools(
    persist(
      (set) => ({
        ...defaultPreferences,
        
        setTheme: (theme) => {
          set({ theme }, false, 'setTheme');
        },
        
        setDefaultLLMProvider: (defaultLLMProvider) => {
          set({ defaultLLMProvider }, false, 'setDefaultLLMProvider');
        },
        
        setLanguage: (language) => {
          set({ language }, false, 'setLanguage');
        },
        
        setAnalysisSpeed: (analysisSpeed) => {
          set({ analysisSpeed }, false, 'setAnalysisSpeed');
        },
        
        setSidebarCollapsed: (sidebarCollapsed) => {
          set({ sidebarCollapsed }, false, 'setSidebarCollapsed');
        },
        
        reset: () => {
          set(defaultPreferences, false, 'resetPreferences');
        },
      }),
      {
        name: `${STORAGE_KEY_PREFIX}preferences`,
        version: 1,
      }
    ),
    {
      name: 'PreferencesStore',
      enabled: import.meta.env.DEV,
    }
  )
);

/**
 * Selector hooks for optimized re-renders
 */
export const useTheme = () => usePreferencesStore((state) => state.theme);
export const useDefaultLLMProvider = () =>
  usePreferencesStore((state) => state.defaultLLMProvider);
export const useLanguage = () => usePreferencesStore((state) => state.language);
export const useAnalysisSpeed = () =>
  usePreferencesStore((state) => state.analysisSpeed);
export const useSidebarCollapsed = () =>
  usePreferencesStore((state) => state.sidebarCollapsed);
