/**
 * ============================================
 * AUTH SERVICE
 * ============================================
 *
 * API functions for authentication operations.
 * Handles login, register, logout, and token refresh.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { api, apiPost, apiGet } from './api';
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  RefreshResponse,
  UserResponse,
  AuthUser,
} from '../types/auth.types';

// ============================================
// TOKEN STORAGE
// ============================================

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

/**
 * Stores authentication tokens
 * Also stores with legacy keys for compatibility
 */
export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  // Also set the token key from localStorage for immediate availability
  localStorage.setItem('token', accessToken);
}

/**
 * Gets the access token
 */
export function getAccessToken(): string | null {
  // Check both possible token keys
  return localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem('token');
}

/**
 * Gets the refresh token
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Clears all auth tokens
 */
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('token');
}

/**
 * Stores user data
 */
export function setStoredUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Gets stored user data
 */
export function getStoredUser(): AuthUser | null {
  const stored = localStorage.getItem(USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Logs in a user
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiPost<AuthResponse>('/auth/login', credentials);

  if (response.success && response.data) {
    const { tokens, user } = response.data;
    setTokens(tokens.accessToken, tokens.refreshToken);
    setStoredUser(user);

    // Update axios default header
    api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  return response;
}

/**
 * Registers a new user (admin only)
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await apiPost<AuthResponse>('/auth/register', data);
  return response;
}

/**
 * Logs out the current user
 */
export async function logout(): Promise<void> {
  try {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await apiPost('/auth/logout', { refreshToken });
    }
  } catch (error) {
    // Continue with local logout even if API call fails
    console.error('Logout API error:', error);
  } finally {
    clearTokens();
    delete api.defaults.headers.common['Authorization'];
  }
}

/**
 * Refreshes the access token
 */
export async function refreshAccessToken(): Promise<RefreshResponse> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await apiPost<RefreshResponse>('/auth/refresh-token', { refreshToken });

  if (response.success && response.data?.tokens) {
    const { tokens } = response.data;
    setTokens(tokens.accessToken, tokens.refreshToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  return response;
}

/**
 * Gets the current user's profile
 */
export async function getCurrentUser(): Promise<UserResponse> {
  const response = await apiGet<UserResponse>('/auth/me');

  if (response.success && response.data) {
    setStoredUser(response.data);
  }

  return response;
}

/**
 * Checks if user is authenticated (has valid tokens)
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

/**
 * Changes the user's password
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ success: boolean; message?: string }> {
  const response = await apiPost<{ message: string }>('/auth/change-password', {
    currentPassword,
    newPassword,
    confirmPassword,
  });
  return { success: true, message: response.message };
}

/**
 * Initializes auth state from storage
 * Returns true if tokens exist
 */
export function initializeAuth(): boolean {
  const token = getAccessToken();
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return true;
  }
  return false;
}
