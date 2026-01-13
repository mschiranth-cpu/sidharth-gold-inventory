/**
 * ============================================
 * CUSTOM TEST RENDER UTILITIES
 * ============================================
 *
 * Custom render function with all providers wrapped:
 * - React Query
 * - React Router
 * - Auth Context
 */

import React, { ReactElement, ReactNode, createContext, useContext } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

// ============================================
// QUERY CLIENT FOR TESTS
// ============================================

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ============================================
// MOCK AUTH CONTEXT
// ============================================

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OFFICE_STAFF' | 'FACTORY_MANAGER' | 'DEPARTMENT_WORKER';
  department?: string;
  isActive: boolean;
}

export const mockUsers: Record<string, MockUser> = {
  admin: {
    id: 'user-admin-1',
    name: 'Admin User',
    email: 'admin@goldfactory.com',
    role: 'ADMIN',
    isActive: true,
  },
  officeStaff: {
    id: 'user-office-1',
    name: 'Office Staff',
    email: 'office@goldfactory.com',
    role: 'OFFICE_STAFF',
    isActive: true,
  },
  factoryManager: {
    id: 'user-factory-1',
    name: 'Factory Manager',
    email: 'factory@goldfactory.com',
    role: 'FACTORY_MANAGER',
    isActive: true,
  },
  worker: {
    id: 'user-worker-1',
    name: 'Department Worker',
    email: 'worker@goldfactory.com',
    role: 'DEPARTMENT_WORKER',
    department: 'MOULDING',
    isActive: true,
  },
};

// Create a mock auth context that matches the real AuthContextType
interface MockAuthContextValue {
  user: MockUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string; rememberMe?: boolean }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  register?: (data: unknown) => Promise<void>;
  refreshToken?: () => Promise<void>;
  updateUser?: (user: MockUser) => void;
}

// Create our own context that will be used by the MockAuthProvider
const TestAuthContext = createContext<MockAuthContextValue | undefined>(undefined);

// Export a mock useAuth hook that tests can use
export function useTestAuth(): MockAuthContextValue {
  const context = useContext(TestAuthContext);
  if (context === undefined) {
    throw new Error('useTestAuth must be used within a MockAuthProvider');
  }
  return context;
}

export function MockAuthProvider({
  children,
  user = null,
  isAuthenticated = false,
  isLoading = false,
  error = null,
  onLogin,
  onLogout,
}: {
  children: ReactNode;
  user?: MockUser | null;
  isAuthenticated?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onLogin?: (credentials: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => Promise<void>;
  onLogout?: () => Promise<void>;
}) {
  const value: MockAuthContextValue = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: onLogin || vi.fn().mockResolvedValue(undefined),
    logout: onLogout || vi.fn().mockResolvedValue(undefined),
    clearError: vi.fn(),
    register: vi.fn().mockResolvedValue(undefined),
    refreshToken: vi.fn().mockResolvedValue(undefined),
    updateUser: vi.fn(),
  };

  return <TestAuthContext.Provider value={value}>{children}</TestAuthContext.Provider>;
}

// ============================================
// IMPORT MOCKED AUTH CONTEXT
// ============================================

// Import the mocked AuthContext module which is mocked in setup.ts
// These imports will receive the mocked versions
import * as AuthContextModule from '../../contexts/AuthContext';

// Type assertion to access the mock helpers added in setup.ts
const mockedAuthModule = AuthContextModule as typeof AuthContextModule & {
  __setMockAuthValue?: (value: unknown) => void;
  __resetMockAuthValue?: () => void;
};

/**
 * Set mock auth values for tests.
 * Call this before rendering components that use useAuth.
 */
export function setMockAuthValue(
  value: Partial<{
    user: MockUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (credentials: {
      email: string;
      password: string;
      rememberMe?: boolean;
    }) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
  }>
) {
  if (mockedAuthModule.__setMockAuthValue) {
    mockedAuthModule.__setMockAuthValue(value);
  }
}

/**
 * Reset mock auth values to defaults.
 * Call this in beforeEach or afterEach.
 */
export function resetMockAuthValue() {
  if (mockedAuthModule.__resetMockAuthValue) {
    mockedAuthModule.__resetMockAuthValue();
  }
}

// ============================================
// WRAPPER COMPONENTS
// ============================================

interface AllProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
  user?: MockUser | null;
  isAuthenticated?: boolean;
  isLoading?: boolean;
  error?: string | null;
  initialRoute?: string;
  useMemoryRouter?: boolean;
}

function AllProviders({
  children,
  queryClient,
  user = null,
  isAuthenticated = false,
  isLoading = false,
  error = null,
  initialRoute = '/',
  useMemoryRouter = false,
}: AllProvidersProps) {
  const client = queryClient || createTestQueryClient();

  // Set the mock auth values before rendering
  setMockAuthValue({
    user,
    isAuthenticated,
    isLoading,
    error,
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    clearError: vi.fn(),
  });

  const content = <QueryClientProvider client={client}>{children}</QueryClientProvider>;

  if (useMemoryRouter) {
    return <MemoryRouter initialEntries={[initialRoute]}>{content}</MemoryRouter>;
  }

  return <BrowserRouter>{content}</BrowserRouter>;
}

// ============================================
// CUSTOM RENDER FUNCTION
// ============================================

export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  user?: MockUser | null;
  isAuthenticated?: boolean;
  isLoading?: boolean;
  error?: string | null;
  initialRoute?: string;
  useMemoryRouter?: boolean;
}

export function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  const {
    queryClient,
    user,
    isAuthenticated,
    isLoading,
    error,
    initialRoute,
    useMemoryRouter,
    ...renderOptions
  } = options;

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AllProviders
      queryClient={queryClient}
      user={user}
      isAuthenticated={isAuthenticated}
      isLoading={isLoading}
      error={error}
      initialRoute={initialRoute}
      useMemoryRouter={useMemoryRouter}
    >
      {children}
    </AllProviders>
  );

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// ============================================
// RENDER WITH ROUTE
// ============================================

export interface RenderWithRouteOptions extends CustomRenderOptions {
  path?: string;
  route?: string;
}

export function renderWithRoute(
  ui: ReactElement,
  options: RenderWithRouteOptions = {}
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  const { path = '/', route = '/', ...rest } = options;

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AllProviders {...rest} useMemoryRouter initialRoute={route}>
      <Routes>
        <Route path={path} element={children} />
      </Routes>
    </AllProviders>
  );

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper }),
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Wait for loading state to complete
 */
export async function waitForLoadingToFinish() {
  const { screen, waitFor } = await import('@testing-library/react');
  await waitFor(() => {
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });
}

/**
 * Create a deferred promise for async testing
 */
export function createDeferred<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (reason?: unknown) => void = () => {};

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Wait for specified time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { userEvent };
export { customRender as render };
