/**
 * ============================================
 * AUTH ROUTES
 * ============================================
 * 
 * Express router for authentication endpoints.
 * Defines routes for login, register, token refresh,
 * logout, and password management.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Router } from 'express';
import {
  login,
  register,
  refreshToken,
  logout,
  getCurrentUser,
  handleChangePassword,
  getPasswordRequirements,
  handleValidatePassword,
} from './auth.controller';
import {
  authenticate,
  optionalAuth,
  loginRateLimiter,
  createRateLimiter,
  requireRoles,
} from './auth.middleware';

// ============================================
// ROUTER INITIALIZATION
// ============================================

const router = Router();

// ============================================
// RATE LIMITERS
// ============================================

/**
 * General API rate limiter
 * 100 requests per minute per IP
 */
const generalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,        // 1 minute
  maxRequests: 100,
  message: 'Too many requests. Please slow down.',
});

/**
 * Strict rate limiter for sensitive operations
 * 10 requests per minute per IP
 */
const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,        // 1 minute
  maxRequests: 10,
  message: 'Too many attempts. Please wait before trying again.',
});

// Apply general rate limiter to all routes
router.use(generalRateLimiter);

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * POST /api/auth/login
 * 
 * Authenticates a user and returns tokens.
 * Protected by login-specific rate limiter.
 * 
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "Password@123",
 *   "rememberMe": false
 * }
 * 
 * Success response (200):
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "user": { id, name, email, role, ... },
 *     "tokens": {
 *       "accessToken": "...",
 *       "refreshToken": "...",
 *       "accessTokenExpiresAt": "...",
 *       "refreshTokenExpiresAt": "..."
 *     }
 *   }
 * }
 */
router.post('/login', loginRateLimiter, login);

/**
 * POST /api/auth/register
 * 
 * Registers a new user account.
 * Public registration creates OFFICE_STAFF by default.
 * Admins can create users with any role via authenticated request.
 * 
 * Request body:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "Password@123",
 *   "confirmPassword": "Password@123",
 *   "phone": "+91 9876543210",
 *   "role": "OFFICE_STAFF",        // Optional, admin only
 *   "department": "CAD"            // Required for DEPARTMENT_WORKER
 * }
 * 
 * Success response (201):
 * {
 *   "success": true,
 *   "message": "Registration successful",
 *   "data": {
 *     "user": { id, name, email, role, ... },
 *     "tokens": { ... },
 *     "message": "Registration successful. You are now logged in."
 *   }
 * }
 */
router.post('/register', strictRateLimiter, optionalAuth, register);

/**
 * POST /api/auth/refresh-token
 * 
 * Refreshes the access token using a valid refresh token.
 * Implements token rotation for enhanced security.
 * 
 * Request body:
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
 * }
 * 
 * Success response (200):
 * {
 *   "success": true,
 *   "message": "Token refreshed successfully",
 *   "data": {
 *     "tokens": {
 *       "accessToken": "new-access-token...",
 *       "refreshToken": "new-refresh-token...",
 *       "accessTokenExpiresAt": "...",
 *       "refreshTokenExpiresAt": "..."
 *     }
 *   }
 * }
 */
router.post('/refresh-token', strictRateLimiter, refreshToken);

/**
 * GET /api/auth/password-requirements
 * 
 * Returns password requirements for client-side validation.
 * Public endpoint - no authentication needed.
 * 
 * Success response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "minLength": 8,
 *     "requireUppercase": true,
 *     "requireLowercase": true,
 *     "requireNumber": true,
 *     "requireSpecialChar": true,
 *     "specialChars": "!@#$%^&*()_+-=[]{}|;:,.<>?"
 *   }
 * }
 */
router.get('/password-requirements', getPasswordRequirements);

/**
 * POST /api/auth/validate-password
 * 
 * Validates a password against requirements without saving.
 * Useful for real-time password strength feedback.
 * 
 * Request body:
 * {
 *   "password": "TestPassword123!"
 * }
 * 
 * Success response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "isValid": true,
 *     "errors": [],
 *     "strength": "strong"
 *   }
 * }
 */
router.post('/validate-password', handleValidatePassword);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

/**
 * POST /api/auth/logout
 * 
 * Logs out the current user.
 * Revokes refresh tokens to prevent future use.
 * 
 * Headers:
 * - Authorization: Bearer <access-token>
 * 
 * Request body (optional):
 * {
 *   "refreshToken": "current-refresh-token",  // Revoke specific token
 *   "allDevices": true                        // Logout from all devices
 * }
 * 
 * Success response (200):
 * {
 *   "success": true,
 *   "message": "Logged out successfully",
 *   "data": {
 *     "message": "Logged out successfully",
 *     "loggedOutDevices": 3  // Only if allDevices: true
 *   }
 * }
 */
router.post('/logout', authenticate, logout);

/**
 * GET /api/auth/me
 * 
 * Returns the current authenticated user's profile.
 * 
 * Headers:
 * - Authorization: Bearer <access-token>
 * 
 * Success response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "role": "ADMIN",
 *     "department": null,
 *     "phone": "+91 9876543210",
 *     "isActive": true,
 *     "createdAt": "2024-01-01T00:00:00Z",
 *     "lastLoginAt": "2024-01-09T12:00:00Z"
 *   }
 * }
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * POST /api/auth/change-password
 * 
 * Changes the authenticated user's password.
 * Revokes all refresh tokens (forces re-login on all devices).
 * 
 * Headers:
 * - Authorization: Bearer <access-token>
 * 
 * Request body:
 * {
 *   "currentPassword": "OldPassword@123",
 *   "newPassword": "NewPassword@456",
 *   "confirmPassword": "NewPassword@456"
 * }
 * 
 * Success response (200):
 * {
 *   "success": true,
 *   "message": "Password changed successfully. Please log in again on all devices.",
 *   "data": {
 *     "loggedOutFromAllDevices": true
 *   }
 * }
 */
router.post('/change-password', authenticate, strictRateLimiter, handleChangePassword);

// ============================================
// ADMIN-ONLY ROUTES
// ============================================

/**
 * POST /api/auth/create-user
 * 
 * Admin endpoint to create new users with any role.
 * Uses the same register logic but requires ADMIN role.
 * 
 * Headers:
 * - Authorization: Bearer <admin-access-token>
 * 
 * Request body:
 * {
 *   "name": "New Worker",
 *   "email": "worker@factory.com",
 *   "password": "Password@123",
 *   "confirmPassword": "Password@123",
 *   "phone": "+91 9876543210",
 *   "role": "DEPARTMENT_WORKER",
 *   "department": "CAD"
 * }
 * 
 * Success response (201):
 * Same as /register
 */
router.post(
  '/create-user',
  authenticate,
  requireRoles('ADMIN'),
  strictRateLimiter,
  register
);

// ============================================
// EXPORT ROUTER
// ============================================

export default router;

// ============================================
// ROUTE DOCUMENTATION SUMMARY
// ============================================

/**
 * Authentication Routes Summary:
 * 
 * PUBLIC ROUTES (No auth required):
 * --------------------------------
 * POST   /api/auth/login               - User login
 * POST   /api/auth/register            - User registration
 * POST   /api/auth/refresh-token       - Refresh access token
 * GET    /api/auth/password-requirements - Get password rules
 * POST   /api/auth/validate-password   - Validate password strength
 * 
 * PROTECTED ROUTES (Auth required):
 * ---------------------------------
 * POST   /api/auth/logout              - User logout
 * GET    /api/auth/me                  - Get current user
 * POST   /api/auth/change-password     - Change password
 * 
 * ADMIN ROUTES (Admin role required):
 * -----------------------------------
 * POST   /api/auth/create-user         - Create user with any role
 * 
 * Rate Limiting:
 * - General: 100 requests/minute
 * - Login: 5 attempts/15 min, then 30 min block
 * - Sensitive ops: 10 requests/minute
 */
