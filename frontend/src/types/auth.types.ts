/**
 * ============================================
 * AUTH TYPES
 * ============================================
 *
 * TypeScript types for frontend authentication.
 * Matches backend auth types.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

// ============================================
// USER ROLE
// ============================================

// UserRole as a const object for runtime access (UserRole.ADMIN, etc.)
export const UserRole = {
  ADMIN: 'ADMIN',
  OFFICE_STAFF: 'OFFICE_STAFF',
  FACTORY_MANAGER: 'FACTORY_MANAGER',
  DEPARTMENT_WORKER: 'DEPARTMENT_WORKER',
} as const;

// Type alias derived from the const object
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  OFFICE_STAFF: 'Office Staff',
  FACTORY_MANAGER: 'Factory Manager',
  DEPARTMENT_WORKER: 'Department Worker',
};

export const USER_ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'bg-purple-100 text-purple-800',
  OFFICE_STAFF: 'bg-blue-100 text-blue-800',
  FACTORY_MANAGER: 'bg-amber-100 text-amber-800',
  DEPARTMENT_WORKER: 'bg-green-100 text-green-800',
};

// ============================================
// AUTH USER
// ============================================

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string | null;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

// ============================================
// AUTH REQUESTS
// ============================================

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  role?: UserRole;
  department?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================
// AUTH RESPONSES
// ============================================

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    tokens: {
      accessToken: string;
      refreshToken: string;
      accessTokenExpiresAt: string;
      refreshTokenExpiresAt: string;
    };
    isFirstLogin?: boolean;
  };
  timestamp: string;
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  data: {
    tokens: {
      accessToken: string;
      refreshToken: string;
      accessTokenExpiresAt: string;
      refreshTokenExpiresAt: string;
    };
  };
  timestamp: string;
}

export interface UserResponse {
  success: boolean;
  message: string;
  data: AuthUser;
  timestamp: string;
}

// ============================================
// AUTH CONTEXT
// ============================================

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: AuthUser) => void;
}

// ============================================
// ROUTE PROTECTION
// ============================================

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Checks if a role has access to a feature
 */
export function hasRole(userRole: UserRole | undefined, allowedRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

/**
 * Gets the default redirect path after login based on role
 */
export function getDefaultRedirectPath(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return '/dashboard';
    case 'OFFICE_STAFF':
      return '/orders';
    case 'FACTORY_MANAGER':
      return '/factory';
    case 'DEPARTMENT_WORKER':
      return '/my-work';
    default:
      return '/dashboard';
  }
}

/**
 * Checks if user can manage other users
 */
export function canManageUsers(role: UserRole): boolean {
  return role === 'ADMIN';
}

/**
 * Checks if user can create orders
 */
export function canCreateOrders(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'OFFICE_STAFF';
}

/**
 * Checks if user can view customer info
 */
export function canViewCustomerInfo(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'OFFICE_STAFF';
}
