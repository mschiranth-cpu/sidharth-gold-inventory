import axios, { AxiosError, AxiosHeaders, AxiosInstance, AxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    const authorization = config.headers.get('Authorization');
    const inheritedAuthorization = api.defaults.headers.common.Authorization ?? api.defaults.headers.common.authorization;
    if (!token) {
      delete api.defaults.headers.common.Authorization;
      delete api.defaults.headers.common.authorization;
      if (inheritedAuthorization !== undefined && authorization === inheritedAuthorization) {
        config.headers.delete('Authorization');
      }
    } else if (!config.headers.has('Authorization') || authorization === inheritedAuthorization) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Only handle 401 (Unauthorized - not authenticated), not 403 (Forbidden - authenticated but not authorized)
    if (error.response?.status === 401) {
      // Don't redirect for auth validation endpoints - let AuthContext handle it
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/me') || url.includes('/auth/refresh') || url.includes('/auth/logout');
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const authorization = AxiosHeaders.from(error.config?.headers).get('Authorization');

      if (!isAuthEndpoint && token && authorization === `Bearer ${token}` && !window.location.pathname.includes('/login')) {
        // Clear tokens and redirect only for non-auth endpoints
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        delete api.defaults.headers.common.Authorization;
        delete api.defaults.headers.common.authorization;
        window.location.href = '/login';
      }
    }
    // For 403, just return the error - let the component/route handle authorization
    return Promise.reject(error);
  }
);

// Generic API functions
export const apiGet = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await api.get<T>(url, config);
  return response.data;
};

export const apiPost = async <T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await api.post<T>(url, data, config);
  return response.data;
};

export const apiPut = async <T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await api.put<T>(url, data, config);
  return response.data;
};

export const apiPatch = async <T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await api.patch<T>(url, data, config);
  return response.data;
};

export const apiDelete = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await api.delete<T>(url, config);
  return response.data;
};

export default api;
