/**
 * ============================================
 * REACT QUERY CONFIGURATION
 * ============================================
 * 
 * Optimized React Query settings for production.
 * Includes cache times, stale settings, and retry logic.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// ============================================
// CACHE TIME CONSTANTS
// ============================================

export const CACHE_TIMES = {
  // Short-lived data (1 minute)
  SHORT: 1 * 60 * 1000,
  
  // Standard data (5 minutes)
  STANDARD: 5 * 60 * 1000,
  
  // Long-lived data (30 minutes)
  LONG: 30 * 60 * 1000,
  
  // Static data (1 hour)
  STATIC: 60 * 60 * 1000,
  
  // Rarely changing data (24 hours)
  RARE: 24 * 60 * 60 * 1000,
} as const;

export const STALE_TIMES = {
  // Immediately stale (always refetch)
  IMMEDIATE: 0,
  
  // Quick refresh (30 seconds)
  QUICK: 30 * 1000,
  
  // Standard stale (2 minutes)
  STANDARD: 2 * 60 * 1000,
  
  // Slow stale (10 minutes)
  SLOW: 10 * 60 * 1000,
  
  // Static content (1 hour)
  STATIC: 60 * 60 * 1000,
} as const;

// ============================================
// QUERY KEYS FACTORY
// ============================================

export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },
  
  // Orders
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
    stats: () => [...queryKeys.orders.all, 'stats'] as const,
    search: (query: string) => [...queryKeys.orders.all, 'search', query] as const,
  },
  
  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    recentOrders: () => [...queryKeys.dashboard.all, 'recentOrders'] as const,
    charts: () => [...queryKeys.dashboard.all, 'charts'] as const,
  },
  
  // Factory / Departments
  factory: {
    all: ['factory'] as const,
    tracking: () => [...queryKeys.factory.all, 'tracking'] as const,
    departments: () => [...queryKeys.factory.all, 'departments'] as const,
    department: (id: string) => [...queryKeys.factory.departments(), id] as const,
  },
  
  // Reports
  reports: {
    all: ['reports'] as const,
    summary: (filters: Record<string, any>) => [...queryKeys.reports.all, 'summary', filters] as const,
    production: (filters: Record<string, any>) => [...queryKeys.reports.all, 'production', filters] as const,
    efficiency: (filters: Record<string, any>) => [...queryKeys.reports.all, 'efficiency', filters] as const,
  },
  
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: () => [...queryKeys.notifications.all, 'list'] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
  },
} as const;

// ============================================
// ERROR HANDLING
// ============================================

interface ApiError {
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
    };
  };
}

function handleQueryError(error: unknown) {
  const apiError = error as ApiError;
  const message = 
    apiError.response?.data?.message || 
    apiError.response?.data?.error || 
    apiError.message || 
    'An error occurred';
  
  // Don't show toast for 401 errors (handled by auth)
  if (apiError.response?.status === 401) {
    return;
  }
  
  // Show toast for other errors
  toast.error(message);
}

function handleMutationError(error: unknown) {
  const apiError = error as ApiError;
  const message = 
    apiError.response?.data?.message || 
    apiError.response?.data?.error || 
    apiError.message || 
    'An error occurred';
  
  toast.error(message);
}

// ============================================
// QUERY CLIENT CONFIGURATION
// ============================================

export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Only show error toasts for queries that have already fetched
        // This prevents showing errors on initial load failures
        if (query.state.data !== undefined) {
          handleQueryError(error);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: handleMutationError,
    }),
    defaultOptions: {
      queries: {
        // Stale time - how long data is considered fresh
        staleTime: STALE_TIMES.STANDARD,
        
        // Cache time - how long data stays in cache after becoming inactive
        gcTime: CACHE_TIMES.STANDARD,
        
        // Retry configuration
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (client errors)
          const apiError = error as ApiError;
          if (apiError.response?.status && apiError.response.status >= 400 && apiError.response.status < 500) {
            return false;
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Refetch configuration
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
        
        // Network mode
        networkMode: 'offlineFirst',
        
        // Structural sharing for better performance
        structuralSharing: true,
      },
      mutations: {
        // Retry mutations once
        retry: 1,
        retryDelay: 1000,
        
        // Network mode
        networkMode: 'offlineFirst',
      },
    },
  });
}

// ============================================
// QUERY OPTIONS FACTORIES
// ============================================

export const queryOptions = {
  // For dashboard data - refresh frequently
  dashboard: {
    staleTime: STALE_TIMES.QUICK,
    gcTime: CACHE_TIMES.SHORT,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  },
  
  // For order lists - moderate refresh
  ordersList: {
    staleTime: STALE_TIMES.STANDARD,
    gcTime: CACHE_TIMES.STANDARD,
  },
  
  // For order details - slightly longer cache
  orderDetail: {
    staleTime: STALE_TIMES.STANDARD,
    gcTime: CACHE_TIMES.LONG,
  },
  
  // For user data - longer cache
  users: {
    staleTime: STALE_TIMES.SLOW,
    gcTime: CACHE_TIMES.LONG,
  },
  
  // For static lookup data
  static: {
    staleTime: STALE_TIMES.STATIC,
    gcTime: CACHE_TIMES.RARE,
  },
  
  // For reports - cache longer due to expensive queries
  reports: {
    staleTime: STALE_TIMES.SLOW,
    gcTime: CACHE_TIMES.LONG,
  },
  
  // For notifications - refresh often
  notifications: {
    staleTime: STALE_TIMES.QUICK,
    gcTime: CACHE_TIMES.SHORT,
    refetchInterval: 60 * 1000, // Refetch every minute
  },
  
  // For search results - short cache
  search: {
    staleTime: STALE_TIMES.IMMEDIATE,
    gcTime: CACHE_TIMES.SHORT,
  },
} as const;

// ============================================
// PREFETCH UTILITIES
// ============================================

export async function prefetchDashboard(queryClient: QueryClient, fetcher: () => Promise<any>) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: fetcher,
    ...queryOptions.dashboard,
  });
}

export async function prefetchOrdersList(
  queryClient: QueryClient, 
  filters: Record<string, any>,
  fetcher: () => Promise<any>
) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: fetcher,
    ...queryOptions.ordersList,
  });
}

export async function prefetchOrderDetail(
  queryClient: QueryClient,
  id: string,
  fetcher: () => Promise<any>
) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: fetcher,
    ...queryOptions.orderDetail,
  });
}

// ============================================
// INVALIDATION UTILITIES
// ============================================

export const invalidateQueries = {
  orders: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
  },
  
  orderDetail: (queryClient: QueryClient, id: string) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(id) });
  },
  
  users: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
  },
  
  dashboard: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  },
  
  factory: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.factory.all });
  },
  
  all: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries();
  },
};

// ============================================
// OPTIMISTIC UPDATE UTILITIES
// ============================================

export function createOptimisticUpdate<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  updater: (oldData: T | undefined) => T
) {
  // Cancel outgoing refetches
  queryClient.cancelQueries({ queryKey });
  
  // Snapshot the previous value
  const previousData = queryClient.getQueryData<T>(queryKey);
  
  // Optimistically update
  queryClient.setQueryData<T>(queryKey, updater);
  
  // Return context for rollback
  return { previousData, queryKey };
}

export function rollbackOptimisticUpdate<T>(
  queryClient: QueryClient,
  context: { previousData: T | undefined; queryKey: readonly unknown[] }
) {
  queryClient.setQueryData(context.queryKey, context.previousData);
}

// ============================================
// SINGLETON QUERY CLIENT
// ============================================

let queryClientInstance: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (!queryClientInstance) {
    queryClientInstance = createQueryClient();
  }
  return queryClientInstance;
}
