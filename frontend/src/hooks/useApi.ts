import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';

interface ApiError {
  message: string;
  statusCode: number;
}

// Generic GET hook
export function useApiGet<T>(
  key: string | string[],
  url: string,
  options?: Omit<UseQueryOptions<T, AxiosError<ApiError>>, 'queryKey' | 'queryFn'>
) {
  const queryKey = Array.isArray(key) ? key : [key];
  
  return useQuery<T, AxiosError<ApiError>>({
    queryKey,
    queryFn: () => apiGet<T>(url),
    ...options,
  });
}

// Generic POST hook
export function useApiPost<T, D = unknown>(
  url: string,
  options?: UseMutationOptions<T, AxiosError<ApiError>, D>
) {
  return useMutation<T, AxiosError<ApiError>, D>({
    mutationFn: (data: D) => apiPost<T, D>(url, data),
    ...options,
  });
}

// Generic PUT hook
export function useApiPut<T, D = unknown>(
  url: string,
  options?: UseMutationOptions<T, AxiosError<ApiError>, D>
) {
  return useMutation<T, AxiosError<ApiError>, D>({
    mutationFn: (data: D) => apiPut<T, D>(url, data),
    ...options,
  });
}

// Generic DELETE hook
export function useApiDelete<T>(
  url: string,
  options?: UseMutationOptions<T, AxiosError<ApiError>, void>
) {
  return useMutation<T, AxiosError<ApiError>, void>({
    mutationFn: () => apiDelete<T>(url),
    ...options,
  });
}
