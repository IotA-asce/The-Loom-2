/**
 * Base Store Types and Utilities
 * 
 * Shared types and utilities for all Zustand stores.
 * Provides common patterns for store creation and middleware.
 */

import type { StateCreator } from 'zustand';
import type { devtools, persist } from 'zustand/middleware';

/**
 * Type for store creator with DevTools support
 */
export type DevToolsConfig = Parameters<typeof devtools>[1];

/**
 * Type for store creator with Persistence support
 */
export type PersistConfig<T> = Parameters<typeof persist<T>>[1];

/**
 * Base store creator type combining all middleware
 */
export type StoreCreator<T> = StateCreator<
  T,
  [['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  T
>;

/**
 * Standard store set function type
 */
export type StoreSet<T> = (
  partial: T | Partial<T> | ((state: T) => T | Partial<T>),
  replace?: boolean,
  action?: string
) => void;

/**
 * Standard store get function type
 */
export type StoreGet<T> = () => T;

/**
 * Store with reset capability
 */
export interface ResettableStore {
  reset: () => void;
}

/**
 * Common store status
 */
export type StoreStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Base state interface with status tracking
 */
export interface BaseState {
  status: StoreStatus;
  error: string | null;
  setStatus: (status: StoreStatus) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

/**
 * Helper to create base state
 */
export const createBaseState = <T extends object>(
  set: StoreSet<T & BaseState>
): BaseState => ({
  status: 'idle',
  error: null,
  setStatus: (status) => set({ status } as Partial<T & BaseState>, false, 'setStatus'),
  setError: (error) => set({ error } as Partial<T & BaseState>, false, 'setError'),
  clearError: () => set({ error: null } as Partial<T & BaseState>, false, 'clearError'),
});

/**
 * DevTools configuration defaults
 */
export const defaultDevToolsConfig: DevToolsConfig = {
  name: 'The Loom 2 Store',
  enabled: process.env.NODE_ENV === 'development',
};

/**
 * Storage key prefix for persistence
 */
export const STORAGE_KEY_PREFIX = 'loom2-';
