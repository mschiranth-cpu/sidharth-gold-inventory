/**
 * ============================================
 * AUTH CONTEXT
 * ============================================
 *
 * React context for authentication state management.
 * Provides auth state and methods to all components.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type {
  AuthState,
  AuthContextType,
  AuthUser,
  LoginCredentials,
  RegisterData,
} from '../types/auth.types';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  refreshAccessToken,
  getCurrentUser,
  initializeAuth,
  getStoredUser,
  clearTokens,
} from '../services/auth.service';

// ============================================
// INITIAL STATE
// ============================================

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// ============================================
// ACTION TYPES
// ============================================

type AuthAction =
  | { type: 'AUTH_INIT_START' }
  | { type: 'AUTH_INIT_SUCCESS'; payload: AuthUser }
  | { type: 'AUTH_INIT_FAILURE' }
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: AuthUser }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: AuthUser }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_ERROR'; payload: string };

// ============================================
// REDUCER
// ============================================

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_INIT_START':
      return { ...state, isLoading: true };
    case 'AUTH_INIT_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_INIT_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

interface AuthProviderProps {
  children: React.ReactNode;
}

type SessionValidation = { status: 'valid'; user: AuthUser } | { status: 'offline' | 'denied' | 'stale' };

function sameAccessIdentity(previous: AuthUser | null, next: AuthUser) {
  return previous?.id === next.id && previous.role === next.role
    && (previous.department ?? null) === (next.department ?? null);
}

// Initialization and foreground refresh share the same denial/expiry policy.
async function validateSession(isCurrent: () => boolean): Promise<SessionValidation> {
  const readProfile = async (): Promise<SessionValidation> => {
    const response = await getCurrentUser(isCurrent);
    if (!isCurrent()) return { status: 'stale' };
    return response.success && response.data && response.data.isActive !== false
      ? { status: 'valid', user: response.data }
      : { status: 'denied' };
  };
  try {
    return await readProfile();
  } catch (error) {
    if (!isCurrent() || (error as Error | null)?.name === 'AuthSessionChangedError') return { status: 'stale' };
    const status = (error as { response?: { status?: number } } | null)?.response?.status;
    if (status === 403) return { status: 'denied' };
    if (status !== 401) return { status: 'offline' };
    try {
      const refreshed = await refreshAccessToken(isCurrent);
      if (!isCurrent()) return { status: 'stale' };
      if (!refreshed.success) return { status: 'denied' };
      return await readProfile();
    } catch (refreshError) {
      if (!isCurrent() || (refreshError as Error | null)?.name === 'AuthSessionChangedError') return { status: 'stale' };
      // Once the existing token is known to be invalid, a failed renewal cannot
      // restore its cached administrator/role privileges.
      return { status: 'denied' };
    }
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const sessionVersion = useRef(0);
  const currentState = useRef(state);
  currentState.current = state;
  const queryClient = useQueryClient();
  const clearPrivateCache = useCallback(() => {
    // Cancellation prevents even query functions that ignore AbortSignal from
    // committing a late response into a subsequent account's cache.
    void queryClient.cancelQueries();
    queryClient.clear();
  }, [queryClient]);

  // Initialize auth state from storage
  useEffect(() => {
    let active = true;
    const version = ++sessionVersion.current;
    const isCurrent = () => active && version === sessionVersion.current;
    const initAuth = async () => {
      dispatch({ type: 'AUTH_INIT_START' });

      const hasTokens = initializeAuth();
      if (!hasTokens) {
        clearPrivateCache();
        dispatch({ type: 'AUTH_INIT_FAILURE' });
        return;
      }

      // Keep cached roles out of authorized UI until the session is validated.
      const storedUser = getStoredUser();

      const result = await validateSession(isCurrent);
      if (!isCurrent() || result.status === 'stale') return;
      if (result.status === 'valid') {
        clearPrivateCache();
        dispatch({ type: 'AUTH_INIT_SUCCESS', payload: result.user });
      } else if (result.status === 'offline' && storedUser && storedUser.isActive !== false) {
        console.warn('Could not validate token, using stored user');
        dispatch({ type: 'AUTH_INIT_SUCCESS', payload: storedUser });
      } else {
        clearPrivateCache();
        clearTokens();
        dispatch({ type: 'AUTH_INIT_FAILURE' });
      }
    };

    void initAuth();
    return () => { active = false; };
  }, [clearPrivateCache]);

  // Keep role/department/activity current for an open page. Only the visible
  // browser client calls /auth/me; authorization is enforced by every API call.
  useEffect(() => {
    if (!state.isAuthenticated || !state.user || state.isLoading) return;
    let active = true;
    let checking = false;
    let interval: ReturnType<typeof setInterval> | undefined;
    const version = sessionVersion.current;
    const userId = state.user.id;
    const isCurrent = () => active && version === sessionVersion.current;
    const check = async () => {
      if (!isCurrent() || checking || document.visibilityState !== 'visible') return;
      checking = true;
      try {
        const result = await validateSession(isCurrent);
        if (!isCurrent() || result.status === 'stale' || result.status === 'offline') return;
        if (result.status === 'valid' && result.user.id === userId) {
          if (!sameAccessIdentity(currentState.current.user, result.user)) clearPrivateCache();
          dispatch({ type: 'AUTH_INIT_SUCCESS', payload: result.user });
        } else {
          ++sessionVersion.current;
          clearPrivateCache();
          clearTokens();
          dispatch({ type: 'AUTH_INIT_FAILURE' });
        }
      } finally {
        checking = false;
      }
    };
    const schedule = () => {
      if (interval !== undefined) clearInterval(interval);
      interval = document.visibilityState === 'visible' ? setInterval(() => { void check(); }, 30_000) : undefined;
    };
    const onFocus = () => { void check(); };
    const onVisibility = () => {
      schedule();
      if (document.visibilityState === 'visible') void check();
    };
    schedule();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      active = false;
      if (interval !== undefined) clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [state.isAuthenticated, state.user?.id, state.user?.role, state.user?.department, state.isLoading, clearPrivateCache]);

  // Login
  const login = useCallback(async (credentials: LoginCredentials) => {
    const version = ++sessionVersion.current;
    clearPrivateCache();
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await apiLogin(credentials, () => version === sessionVersion.current);
      if (version !== sessionVersion.current) return;

      if (response.success && response.data) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: response.data.user });
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.message || 'Login failed' });
      }
    } catch (error: any) {
      if (version !== sessionVersion.current) return;
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'Login failed. Please try again.';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw error;
    }
  }, [clearPrivateCache]);

  // Register
  const register = useCallback(async (data: RegisterData) => {
    const version = ++sessionVersion.current;
    clearPrivateCache();
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await apiRegister(data);
      if (version !== sessionVersion.current) return;

      if (!response.success) {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.message || 'Registration failed' });
        throw new Error(response.message);
      }

      // Registration successful, but user needs to login
      dispatch({ type: 'AUTH_INIT_FAILURE' });
    } catch (error: any) {
      if (version !== sessionVersion.current) return;
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'Registration failed. Please try again.';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw error;
    }
  }, [clearPrivateCache]);

  // Logout
  const logout = useCallback(async () => {
    ++sessionVersion.current;
    clearPrivateCache();
    dispatch({ type: 'LOGOUT' });
    await apiLogout();
  }, [clearPrivateCache]);

  // Refresh token
  const refreshToken = useCallback(async () => {
    const version = sessionVersion.current;
    const isCurrent = () => version === sessionVersion.current;
    try {
      await refreshAccessToken(isCurrent);
    } catch (error) {
      if (!isCurrent() || (error as Error).name === 'AuthSessionChangedError') return;
      ++sessionVersion.current;
      clearPrivateCache();
      clearTokens();
      dispatch({ type: 'LOGOUT' });
      throw error;
    }
  }, [clearPrivateCache]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Update user
  const updateUser = useCallback((user: AuthUser) => {
    if (!sameAccessIdentity(currentState.current.user, user) || user.isActive === false) {
      ++sessionVersion.current;
      clearPrivateCache();
    }
    if (user.isActive === false) {
      clearTokens();
      dispatch({ type: 'AUTH_INIT_FAILURE' });
      return;
    }
    dispatch({ type: 'UPDATE_USER', payload: user });
  }, [clearPrivateCache]);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    clearError,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================
// HOOK
// ============================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
