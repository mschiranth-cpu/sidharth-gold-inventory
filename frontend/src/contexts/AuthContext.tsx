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

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
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

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = async () => {
      dispatch({ type: 'AUTH_INIT_START' });

      const hasTokens = initializeAuth();
      if (!hasTokens) {
        dispatch({ type: 'AUTH_INIT_FAILURE' });
        return;
      }

      // Try to get stored user first for faster initial render
      const storedUser = getStoredUser();
      if (storedUser) {
        // Use stored user immediately - we have valid tokens
        dispatch({ type: 'AUTH_INIT_SUCCESS', payload: storedUser });
      }

      // Validate token by fetching current user (in background, don't block)
      try {
        const response = await getCurrentUser();
        if (response.success && response.data) {
          dispatch({ type: 'AUTH_INIT_SUCCESS', payload: response.data });
        } else if (!storedUser) {
          // Only clear if we don't have stored user
          clearTokens();
          dispatch({ type: 'AUTH_INIT_FAILURE' });
        }
        // If we have stored user but API fails, keep using stored user
      } catch (error) {
        // If we have stored user, keep them logged in
        if (storedUser) {
          console.warn('Could not validate token, using stored user');
          return;
        }

        // Try to refresh token only if no stored user
        try {
          await refreshAccessToken();
          const response = await getCurrentUser();
          if (response.success && response.data) {
            dispatch({ type: 'AUTH_INIT_SUCCESS', payload: response.data });
          } else {
            clearTokens();
            dispatch({ type: 'AUTH_INIT_FAILURE' });
          }
        } catch {
          clearTokens();
          dispatch({ type: 'AUTH_INIT_FAILURE' });
        }
      }
    };

    initAuth();
  }, []);

  // Login
  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await apiLogin(credentials);

      if (response.success && response.data) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: response.data.user });
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.message || 'Login failed' });
      }
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'Login failed. Please try again.';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw error;
    }
  }, []);

  // Register
  const register = useCallback(async (data: RegisterData) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await apiRegister(data);

      if (!response.success) {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.message || 'Registration failed' });
        throw new Error(response.message);
      }

      // Registration successful, but user needs to login
      dispatch({ type: 'AUTH_INIT_FAILURE' });
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'Registration failed. Please try again.';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw error;
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  // Refresh token
  const refreshToken = useCallback(async () => {
    try {
      await refreshAccessToken();
    } catch (error) {
      dispatch({ type: 'LOGOUT' });
      throw error;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Update user
  const updateUser = useCallback((user: AuthUser) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  }, []);

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
