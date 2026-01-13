/**
 * ============================================
 * AUTH MIDDLEWARE
 * ============================================
 * 
 * Express middleware for authentication and authorization.
 * Handles JWT verification, role-based access control (RBAC),
 * and request protection.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { logger } from '../../utils/logger';
import {
  verifyAccessToken,
  checkRateLimit,
  recordLoginAttempt,
  getUserById,
} from './auth.service';
import {
  AuthenticatedRequest,
  OptionalAuthRequest,
  AuthError,
  AuthErrorCode,
  Permission,
  ROLE_PERMISSIONS,
} from './auth.types';

// ============================================
// TOKEN EXTRACTION
// ============================================

/**
 * Extracts JWT token from request headers
 * Supports both Authorization header and cookies
 * 
 * @param req - Express request object
 * @returns Token string or null
 */
function extractToken(req: Request): string | null {
  // Check Authorization header first (preferred method)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies as fallback
  const cookieToken = req.cookies?.accessToken;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

/**
 * Middleware to authenticate requests using JWT
 * Attaches user info to request object if valid token is provided
 * 
 * Usage:
 * ```typescript
 * router.get('/protected', authenticate, (req, res) => {
 *   const userId = (req as AuthenticatedRequest).user.userId;
 * });
 * ```
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: AuthErrorCode.INVALID_TOKEN,
          message: 'Authentication required. Please provide a valid access token.',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Verify and decode the token
    const decoded = verifyAccessToken(token);

    // Attach user info to request
    (req as AuthenticatedRequest).user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    logger.debug('Request authenticated', {
      userId: decoded.userId,
      email: decoded.email,
      path: req.path,
    });

    next();
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.error('Authentication error', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during authentication',
        statusCode: 500,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if valid token is provided, but doesn't fail if not
 * Useful for routes that behave differently for authenticated users
 * 
 * Usage:
 * ```typescript
 * router.get('/public', optionalAuth, (req, res) => {
 *   const user = (req as OptionalAuthRequest).user;
 *   if (user) {
 *     // Show personalized content
 *   }
 * });
 * ```
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = verifyAccessToken(token);
      (req as OptionalAuthRequest).user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    }

    next();
  } catch {
    // Token is invalid, but that's okay for optional auth
    // Just continue without user info
    next();
  }
}

// ============================================
// AUTHORIZATION MIDDLEWARE (RBAC)
// ============================================

/**
 * Middleware factory for role-based access control
 * Restricts access to users with specific roles
 * 
 * Usage:
 * ```typescript
 * router.delete('/user/:id', 
 *   authenticate, 
 *   requireRoles('ADMIN'), 
 *   deleteUserController
 * );
 * 
 * router.get('/factory/stats',
 *   authenticate,
 *   requireRoles('ADMIN', 'FACTORY_MANAGER'),
 *   getStatsController
 * );
 * ```
 * 
 * @param allowedRoles - Roles that can access the route
 * @returns Express middleware
 */
export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    // Check if user is authenticated
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: AuthErrorCode.INVALID_TOKEN,
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check if user has required role
    if (!allowedRoles.includes(authReq.user.role)) {
      logger.warn('Access denied - insufficient role', {
        userId: authReq.user.userId,
        userRole: authReq.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
      });

      res.status(403).json({
        success: false,
        error: {
          code: AuthErrorCode.INSUFFICIENT_PERMISSIONS,
          message: 'You do not have permission to access this resource',
          statusCode: 403,
          requiredRoles: allowedRoles,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

/**
 * Middleware factory for permission-based access control
 * More granular than role-based, checks specific permissions
 * 
 * Usage:
 * ```typescript
 * router.post('/orders',
 *   authenticate,
 *   requirePermissions('orders:write'),
 *   createOrderController
 * );
 * 
 * router.delete('/orders/:id',
 *   authenticate,
 *   requirePermissions('orders:delete'),
 *   deleteOrderController
 * );
 * ```
 * 
 * @param requiredPermissions - Permissions needed (ALL must be present)
 * @returns Express middleware
 */
export function requirePermissions(...requiredPermissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    // Check if user is authenticated
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: AuthErrorCode.INVALID_TOKEN,
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Get user's permissions based on role
    const userPermissions = ROLE_PERMISSIONS[authReq.user.role] || [];

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(
      (permission) => userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(
        (permission) => !userPermissions.includes(permission)
      );

      logger.warn('Access denied - insufficient permissions', {
        userId: authReq.user.userId,
        userRole: authReq.user.role,
        requiredPermissions,
        missingPermissions,
        path: req.path,
      });

      res.status(403).json({
        success: false,
        error: {
          code: AuthErrorCode.INSUFFICIENT_PERMISSIONS,
          message: 'You do not have the required permissions for this action',
          statusCode: 403,
          missingPermissions,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

/**
 * Middleware factory to check ANY of the specified permissions
 * Passes if user has at least one of the required permissions
 * 
 * Usage:
 * ```typescript
 * router.get('/reports',
 *   authenticate,
 *   requireAnyPermission('reports:read', 'reports:generate'),
 *   getReportsController
 * );
 * ```
 * 
 * @param permissions - Any of these permissions allows access
 * @returns Express middleware
 */
export function requireAnyPermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: AuthErrorCode.INVALID_TOKEN,
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const userPermissions = ROLE_PERMISSIONS[authReq.user.role] || [];
    const hasAnyPermission = permissions.some(
      (permission) => userPermissions.includes(permission)
    );

    if (!hasAnyPermission) {
      res.status(403).json({
        success: false,
        error: {
          code: AuthErrorCode.INSUFFICIENT_PERMISSIONS,
          message: 'You do not have any of the required permissions',
          statusCode: 403,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

// ============================================
// RESOURCE OWNERSHIP MIDDLEWARE
// ============================================

/**
 * Middleware factory for resource ownership validation
 * Allows access only if the user owns the resource or is an admin
 * 
 * Usage:
 * ```typescript
 * router.put('/users/:id',
 *   authenticate,
 *   requireOwnershipOrAdmin('id'),  // 'id' is the route param
 *   updateUserController
 * );
 * ```
 * 
 * @param userIdParam - Name of the route parameter containing user ID
 * @returns Express middleware
 */
export function requireOwnershipOrAdmin(userIdParam: string = 'id') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: AuthErrorCode.INVALID_TOKEN,
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const resourceUserId = req.params[userIdParam];

    // Admins can access any resource
    if (authReq.user.role === 'ADMIN') {
      next();
      return;
    }

    // Check if user owns the resource
    if (authReq.user.userId !== resourceUserId) {
      logger.warn('Access denied - not resource owner', {
        userId: authReq.user.userId,
        resourceUserId,
        path: req.path,
      });

      res.status(403).json({
        success: false,
        error: {
          code: AuthErrorCode.INSUFFICIENT_PERMISSIONS,
          message: 'You can only access your own resources',
          statusCode: 403,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

// ============================================
// RATE LIMITING MIDDLEWARE
// ============================================

/**
 * Rate limiting middleware for login endpoints
 * Prevents brute force attacks by limiting login attempts
 * 
 * Usage:
 * ```typescript
 * router.post('/login', loginRateLimiter, loginController);
 * ```
 */
export function loginRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Get client IP (handle proxies)
  const ip = req.ip || 
    req.headers['x-forwarded-for']?.toString().split(',')[0] || 
    req.socket.remoteAddress || 
    'unknown';

  // Get email from request body for more targeted limiting
  const email = req.body?.email?.toLowerCase() || '';
  const rateLimitKey = `login:${email}:${ip}`;

  const rateLimit = checkRateLimit(rateLimitKey);

  if (rateLimit.isLimited) {
    logger.warn('Rate limit exceeded for login', { ip, email });

    res.status(429).json({
      success: false,
      error: {
        code: AuthErrorCode.RATE_LIMIT_EXCEEDED,
        message: `Too many login attempts. Please try again in ${rateLimit.retryAfter} seconds.`,
        statusCode: 429,
        retryAfter: rateLimit.retryAfter,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Add remaining attempts to response headers
  res.setHeader('X-RateLimit-Remaining', rateLimit.remainingAttempts.toString());
  
  next();
}

/**
 * Generic rate limiter factory
 * Creates a rate limiter for any endpoint
 * 
 * Usage:
 * ```typescript
 * const apiLimiter = createRateLimiter({
 *   windowMs: 60 * 1000,  // 1 minute
 *   maxRequests: 100,
 * });
 * router.use('/api', apiLimiter);
 * ```
 */
export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  message?: string;
}) {
  const store = new Map<string, { count: number; resetAt: Date }>();

  // Cleanup old entries periodically
  setInterval(() => {
    const now = new Date();
    store.forEach((value, key) => {
      if (now > value.resetAt) {
        store.delete(key);
      }
    });
  }, options.windowMs);

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = options.keyGenerator?.(req) || 
      req.ip || 
      req.headers['x-forwarded-for']?.toString().split(',')[0] || 
      'unknown';

    const now = new Date();
    let entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      entry = {
        count: 1,
        resetAt: new Date(now.getTime() + options.windowMs),
      };
      store.set(key, entry);
    } else {
      entry.count++;
    }

    const remaining = Math.max(0, options.maxRequests - entry.count);
    const resetSeconds = Math.ceil((entry.resetAt.getTime() - now.getTime()) / 1000);

    res.setHeader('X-RateLimit-Limit', options.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', resetSeconds.toString());

    if (entry.count > options.maxRequests) {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: options.message || 'Too many requests. Please try again later.',
          statusCode: 429,
          retryAfter: resetSeconds,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

// ============================================
// USER STATUS VERIFICATION
// ============================================

/**
 * Middleware to verify user is still active in database
 * Use for sensitive operations where token validity isn't enough
 * 
 * Usage:
 * ```typescript
 * router.post('/sensitive-action',
 *   authenticate,
 *   verifyActiveUser,
 *   sensitiveActionController
 * );
 * ```
 */
export async function verifyActiveUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: AuthErrorCode.INVALID_TOKEN,
          message: 'Authentication required',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check current user status in database
    const user = await getUserById(authReq.user.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: AuthErrorCode.USER_NOT_FOUND,
          message: 'User account not found',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: {
          code: AuthErrorCode.USER_INACTIVE,
          message: 'Your account has been deactivated',
          statusCode: 403,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Update user info with fresh data
    authReq.user.role = user.role;

    next();
  } catch (error) {
    logger.error('Error verifying user status', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while verifying user status',
        statusCode: 500,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================
// HELPER EXPORTS
// ============================================

/**
 * Utility to check if a user has a specific permission
 * Can be used in controllers for conditional logic
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Utility to get all permissions for a role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role is an admin role
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'ADMIN';
}

/**
 * Check if a role has factory access
 */
export function hasFactoryAccess(role: UserRole): boolean {
  return ['ADMIN', 'FACTORY_MANAGER', 'DEPARTMENT_WORKER'].includes(role);
}
