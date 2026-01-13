/**
 * ============================================
 * AUTH TYPES & INTERFACES
 * ============================================
 * 
 * TypeScript interfaces for authentication system.
 * Defines request/response shapes, JWT payloads, and role types.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Request } from 'express';
import { UserRole } from '@prisma/client';

// ============================================
// RE-EXPORT PRISMA ROLE ENUM
// ============================================

export { UserRole } from '@prisma/client';

// ============================================
// JWT PAYLOAD INTERFACES
// ============================================

/**
 * Access token payload structure
 * Contains essential user info for authorization
 */
export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: 'access';
  iat?: number;  // Issued at (added by JWT)
  exp?: number;  // Expiration (added by JWT)
}

/**
 * Refresh token payload structure
 * Minimal payload for token rotation
 */
export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;  // Unique ID for token invalidation
  type: 'refresh';
  iat?: number;
  exp?: number;
}

// ============================================
// REQUEST INTERFACES
// ============================================

/**
 * Login request body
 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;  // Extended token validity
}

/**
 * User registration request body
 */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  role?: UserRole;  // Only admins can set this
  department?: string;  // Required for DEPARTMENT_WORKER
}

/**
 * Refresh token request body
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Logout request body
 */
export interface LogoutRequest {
  refreshToken?: string;  // Optional: invalidate specific token
  allDevices?: boolean;   // Logout from all devices
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password change request (authenticated users)
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================
// RESPONSE INTERFACES
// ============================================

/**
 * User data returned in auth responses
 * Excludes sensitive fields like password
 */
export interface AuthUserData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

/**
 * Token pair response
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

/**
 * Successful login response
 */
export interface LoginResponse {
  user: AuthUserData;
  tokens: TokenPair;
}

/**
 * Successful registration response
 */
export interface RegisterResponse {
  user: AuthUserData;
  tokens: TokenPair;
  message: string;
}

/**
 * Token refresh response
 */
export interface RefreshResponse {
  tokens: TokenPair;
}

/**
 * Logout response
 */
export interface LogoutResponse {
  message: string;
  loggedOutDevices?: number;
}

// ============================================
// EXTENDED EXPRESS REQUEST
// ============================================

/**
 * Authenticated request with user info attached
 * Used after JWT verification middleware
 */
export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: UserRole;
  };
  tokenId?: string;  // For refresh token operations
}

/**
 * Optional authentication request
 * User may or may not be authenticated
 */
export interface OptionalAuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

// ============================================
// VALIDATION INTERFACES
// ============================================

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'strong' | 'very-strong';
}

/**
 * Password requirements configuration
 */
export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
  specialChars: string;
}

// ============================================
// RATE LIMITING INTERFACES
// ============================================

/**
 * Rate limit tracking for IP/user
 */
export interface RateLimitInfo {
  attempts: number;
  firstAttempt: Date;
  lastAttempt: Date;
  blockedUntil: Date | null;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;      // Time window in milliseconds
  blockDurationMs: number;  // Block duration after max attempts
}

// ============================================
// REFRESH TOKEN STORAGE
// ============================================

/**
 * Stored refresh token metadata
 * Used for token rotation and invalidation
 */
export interface StoredRefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  userAgent?: string;
  ipAddress?: string;
  isRevoked: boolean;
  revokedAt?: Date;
  replacedByTokenId?: string;
}

// ============================================
// ERROR TYPES
// ============================================

/**
 * Auth-specific error codes
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_INACTIVE = 'USER_INACTIVE',
  EMAIL_EXISTS = 'EMAIL_EXISTS',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  PASSWORD_VALIDATION_FAILED = 'PASSWORD_VALIDATION_FAILED',
  PASSWORDS_DONT_MATCH = 'PASSWORDS_DONT_MATCH',
  INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN',
}

/**
 * Custom auth error class
 */
export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string,
    public statusCode: number = 401,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

// ============================================
// ROLE PERMISSION MAPPING
// ============================================

/**
 * Available permissions in the system
 */
export type Permission =
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'orders:read'
  | 'orders:write'
  | 'orders:delete'
  | 'orders:assign'
  | 'factory:read'
  | 'factory:write'
  | 'departments:read'
  | 'departments:write'
  | 'departments:update-status'
  | 'reports:read'
  | 'reports:generate'
  | 'settings:read'
  | 'settings:write';

/**
 * Role-based permission configuration
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'users:read', 'users:write', 'users:delete',
    'orders:read', 'orders:write', 'orders:delete', 'orders:assign',
    'factory:read', 'factory:write',
    'departments:read', 'departments:write', 'departments:update-status',
    'reports:read', 'reports:generate',
    'settings:read', 'settings:write',
  ],
  OFFICE_STAFF: [
    'orders:read', 'orders:write', 'orders:assign',
    'factory:read',
    'departments:read',
    'reports:read',
  ],
  FACTORY_MANAGER: [
    'orders:read', 'orders:assign',
    'factory:read', 'factory:write',
    'departments:read', 'departments:write', 'departments:update-status',
    'reports:read', 'reports:generate',
  ],
  DEPARTMENT_WORKER: [
    'orders:read',
    'departments:read', 'departments:update-status',
  ],
};

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Token type discriminator
 */
export type TokenType = 'access' | 'refresh';

/**
 * Device/session information
 */
export interface SessionInfo {
  tokenId: string;
  userAgent: string;
  ipAddress: string;
  createdAt: Date;
  lastUsedAt: Date;
  isCurrent: boolean;
}
