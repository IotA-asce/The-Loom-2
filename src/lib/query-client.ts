/**
 * React Query Client Configuration
 * 
 * Configures the QueryClient with sensible defaults for The Loom 2.
 * Includes retry logic, caching, and error handling.
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
// Toast notifications will be integrated here in the future

/**
 * Default retry function with exponential backoff
 * Retries 3 times for network errors, not for 4xx errors
 */
const defaultRetryFn = (failureCount: number, error: Error): boolean => {
  // Don't retry on client errors (4xx)
  if (error.message.includes('4')) {
    return false;
  }
  // Retry up to 3 times for other errors
  return failureCount < 3;
};

/**
 * Create a new QueryClient instance
 */
export const createQueryClient = (): QueryClient => {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Show toast for errors on important queries
        if (query.meta?.showError !== false) {
          console.error(`Query error: ${query.queryKey}`, error);
        }
      },
    }),
    mutationCache: new MutationCache({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onError: (_error, _variables, _context, _mutation) => {
        console.error('Mutation error:', _error);
      },
    }),
    defaultOptions: {
      queries: {
        // Stale time - data is considered fresh for 5 minutes
        staleTime: 1000 * 60 * 5,
        // GC time - unused data is kept for 10 minutes
        gcTime: 1000 * 60 * 10,
        // Retry configuration
        retry: defaultRetryFn,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch behavior
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,
        // Error handling
        throwOnError: false,
      },
      mutations: {
        retry: false,
        throwOnError: false,
      },
    },
  });
};

/**
 * Singleton QueryClient instance
 */
let queryClientInstance: QueryClient | null = null;

/**
 * Get the QueryClient instance (creates if not exists)
 */
export const getQueryClient = (): QueryClient => {
  if (!queryClientInstance) {
    queryClientInstance = createQueryClient();
  }
  return queryClientInstance;
};

/**
 * Reset the QueryClient (useful for testing)
 */
export const resetQueryClient = (): void => {
  queryClientInstance?.clear();
  queryClientInstance = null;
};

/**
 * Query keys factory for consistent key management
 */
export const queryKeys = {
  manga: {
    all: ['manga'] as const,
    list: () => [...queryKeys.manga.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.manga.all, 'detail', id] as const,
    chapters: (id: string) => [...queryKeys.manga.all, 'chapters', id] as const,
  },
  storyline: {
    all: ['storyline'] as const,
    detail: (mangaId: string) => [...queryKeys.storyline.all, 'detail', mangaId] as const,
    characters: (mangaId: string) => [...queryKeys.storyline.all, 'characters', mangaId] as const,
    timeline: (mangaId: string) => [...queryKeys.storyline.all, 'timeline', mangaId] as const,
  },
  anchor: {
    all: ['anchor'] as const,
    list: (mangaId: string) => [...queryKeys.anchor.all, 'list', mangaId] as const,
    detail: (id: string) => [...queryKeys.anchor.all, 'detail', id] as const,
  },
  branch: {
    all: ['branch'] as const,
    list: (anchorId: string) => [...queryKeys.branch.all, 'list', anchorId] as const,
    detail: (id: string) => [...queryKeys.branch.all, 'detail', id] as const,
  },
  analysis: {
    all: ['analysis'] as const,
    progress: (mangaId: string) => [...queryKeys.analysis.all, 'progress', mangaId] as const,
    results: (mangaId: string) => [...queryKeys.analysis.all, 'results', mangaId] as const,
  },
};

/**
 * Common mutation options
 */
export const mutationOptions = {
  withToast: <TData, TVariables>(
    successMessage: string | ((data: TData, variables: TVariables) => string),
    errorMessage: string | ((error: Error, variables: TVariables) => string) = 'Operation failed'
  ) => ({
    onSuccess: (data: TData, variables: TVariables) => {
      const message = typeof successMessage === 'function' 
        ? successMessage(data, variables) 
        : successMessage;
      // Toast will be shown via UIStore
      console.log('Success:', message);
    },
    onError: (error: Error, variables: TVariables) => {
      const message = typeof errorMessage === 'function'
        ? errorMessage(error, variables)
        : errorMessage;
      console.error('Error:', message);
    },
  }),
};
