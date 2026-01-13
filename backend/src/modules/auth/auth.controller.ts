/**
 * ============================================
 * AUTH CONTROLLER
 * ============================================
 * 
 * Express controllers for authentication endpoints.
 * Handles HTTP requests and responses for login, register,
 * token refresh, and logout operations.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';
import {
  authenticateUser,
  registerUser,
  refreshTokens,
  logoutUser,
  changePassword,
  generateTokenPair,
  storeRefreshToken,
  validatePassword,
  toAuthUserData,
  recordLoginAttempt,
  PASSWORD_REQUIREMENTS,
} from './auth.service';
import {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  LogoutRequest,
  ChangePasswordRequest,
  AuthenticatedRequest,
  LoginResponse,
  RegisterResponse,
  RefreshResponse,
  LogoutResponse,
  AuthError,
  AuthErrorCode,
} from './auth.types';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extracts client information from request
 * Used for logging and refresh token storage
 */
function getClientInfo(req: Request): { userAgent: string; ipAddress: string } {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const ipAddress = 
    req.ip || 
    req.headers['x-forwarded-for']?.toString().split(',')[0] || 
    req.socket.remoteAddress || 
    'Unknown';
  
  return { userAgent, ipAddress };
}

/**
 * Sends a success response with consistent format
 */
function sendSuccess<T>(res: Response, data: T, message: string, statusCode = 200): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Sends an error response with consistent format
 */
function sendError(
  res: Response, 
  error: AuthError | Error, 
  statusCode = 500
): void {
  if (error instanceof AuthError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      statusCode,
    },
    timestamp: new Date().toISOString(),
  });
}

// ============================================
// LOGIN CONTROLLER
// ============================================

/**
 * POST /api/auth/login
 * 
 * Authenticates a user with email and password.
 * Returns user data and token pair on success.
 * 
 * Request body:
 * - email: User's email address
 * - password: User's password
 * - rememberMe?: Boolean for extended token validity
 * 
 * Responses:
 * - 200: Successful login with user data and tokens
 * - 401: Invalid credentials
 * - 403: Account deactivated
 * - 429: Too many login attempts
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const loginData: LoginRequest = req.body;
    const { userAgent, ipAddress } = getClientInfo(req);

    // Validate request body
    if (!loginData.email || !loginData.password) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required',
          statusCode: 400,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.info('Login attempt', { 
      email: loginData.email, 
      ip: ipAddress 
    });

    // Authenticate user
    const { user, isFirstLogin } = await authenticateUser(loginData, ipAddress);

    // Generate tokens
    const tokens = generateTokenPair(user, loginData.rememberMe);

    // Store refresh token for rotation
    const refreshDecoded = JSON.parse(
      Buffer.from(tokens.refreshToken.split('.')[1], 'base64').toString()
    );
    storeRefreshToken(
      user.id,
      refreshDecoded.tokenId,
      tokens.refreshTokenExpiresAt,
      userAgent,
      ipAddress
    );

    // Prepare response
    const response: LoginResponse = {
      user: toAuthUserData(user),
      tokens,
    };

    // Add first login flag if applicable
    const responseData = isFirstLogin 
      ? { ...response, isFirstLogin: true }
      : response;

    logger.info('Login successful', { 
      userId: user.id, 
      email: user.email,
      role: user.role,
      isFirstLogin,
    });

    sendSuccess(res, responseData, 'Login successful');
  } catch (error) {
    if (error instanceof AuthError) {
      // Record failed attempt for rate limiting
      const { ipAddress } = getClientInfo(req);
      const email = req.body?.email?.toLowerCase() || '';
      recordLoginAttempt(`login:${email}:${ipAddress}`, false);
      
      sendError(res, error);
      return;
    }

    logger.error('Login error', { error });
    next(error);
  }
}

// ============================================
// REGISTER CONTROLLER
// ============================================

/**
 * POST /api/auth/register
 * 
 * Registers a new user account.
 * Only admins can set roles other than default.
 * 
 * Request body:
 * - name: User's full name
 * - email: User's email address
 * - password: Password (must meet requirements)
 * - confirmPassword: Password confirmation
 * - phone?: Phone number
 * - role?: User role (admin only)
 * - department?: Department for workers
 * 
 * Responses:
 * - 201: User created successfully
 * - 400: Validation errors
 * - 409: Email already exists
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const registerData: RegisterRequest = req.body;
    const { userAgent, ipAddress } = getClientInfo(req);

    // Validate required fields
    if (!registerData.name || !registerData.email || !registerData.password || !registerData.confirmPassword) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name, email, password, and password confirmation are required',
          statusCode: 400,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check if request is from an authenticated admin (for role assignment)
    const authReq = req as AuthenticatedRequest;
    let createdByUserId: string | undefined;

    if (registerData.role && registerData.role !== 'OFFICE_STAFF') {
      // Only admins can assign non-default roles
      if (!authReq.user || authReq.user.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: {
            code: AuthErrorCode.INSUFFICIENT_PERMISSIONS,
            message: 'Only administrators can assign roles',
            statusCode: 403,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }
      createdByUserId = authReq.user.userId;
    }

    logger.info('Registration attempt', { 
      email: registerData.email,
      role: registerData.role || 'OFFICE_STAFF',
    });

    // Register the user
    const user = await registerUser(registerData, createdByUserId);

    // Generate tokens for immediate login
    const tokens = generateTokenPair(user, false);

    // Store refresh token
    const refreshDecoded = JSON.parse(
      Buffer.from(tokens.refreshToken.split('.')[1], 'base64').toString()
    );
    storeRefreshToken(
      user.id,
      refreshDecoded.tokenId,
      tokens.refreshTokenExpiresAt,
      userAgent,
      ipAddress
    );

    // Prepare response
    const response: RegisterResponse = {
      user: toAuthUserData(user),
      tokens,
      message: 'Registration successful. You are now logged in.',
    };

    logger.info('Registration successful', { 
      userId: user.id, 
      email: user.email,
      role: user.role,
    });

    sendSuccess(res, response, 'Registration successful', 201);
  } catch (error) {
    if (error instanceof AuthError) {
      sendError(res, error);
      return;
    }

    logger.error('Registration error', { error });
    next(error);
  }
}

// ============================================
// REFRESH TOKEN CONTROLLER
// ============================================

/**
 * POST /api/auth/refresh-token
 * 
 * Refreshes the access token using a valid refresh token.
 * Implements token rotation for security.
 * 
 * Request body:
 * - refreshToken: Current refresh token
 * 
 * Responses:
 * - 200: New token pair generated
 * - 401: Invalid or expired refresh token
 */
export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken }: RefreshTokenRequest = req.body;
    const { userAgent, ipAddress } = getClientInfo(req);

    // Validate request
    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Refresh token is required',
          statusCode: 400,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.debug('Token refresh attempt', { ip: ipAddress });

    // Refresh tokens (with rotation)
    const { user, tokens } = await refreshTokens(refreshToken, userAgent, ipAddress);

    // Prepare response
    const response: RefreshResponse = {
      tokens,
    };

    logger.debug('Token refresh successful', { userId: user.id });

    sendSuccess(res, response, 'Token refreshed successfully');
  } catch (error) {
    if (error instanceof AuthError) {
      sendError(res, error);
      return;
    }

    logger.error('Token refresh error', { error });
    next(error);
  }
}

// ============================================
// LOGOUT CONTROLLER
// ============================================

/**
 * POST /api/auth/logout
 * 
 * Logs out the current user by invalidating tokens.
 * 
 * Request body:
 * - refreshToken?: Specific token to revoke
 * - allDevices?: Logout from all devices
 * 
 * Responses:
 * - 200: Logout successful
 */
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { refreshToken, allDevices }: LogoutRequest = req.body;

    // User ID from authenticated request
    const userId = authReq.user?.userId;

    if (!userId) {
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

    // Logout user
    const loggedOutDevices = await logoutUser(userId, refreshToken, allDevices);

    // Prepare response
    const response: LogoutResponse = {
      message: allDevices 
        ? 'Logged out from all devices' 
        : 'Logged out successfully',
      loggedOutDevices: allDevices ? loggedOutDevices : undefined,
    };

    logger.info('Logout successful', { 
      userId, 
      allDevices, 
      loggedOutDevices 
    });

    sendSuccess(res, response, response.message);
  } catch (error) {
    logger.error('Logout error', { error });
    next(error);
  }
}

// ============================================
// GET CURRENT USER CONTROLLER
// ============================================

/**
 * GET /api/auth/me
 * 
 * Returns the current authenticated user's information.
 * 
 * Responses:
 * - 200: User data
 * - 401: Not authenticated
 */
export async function getCurrentUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { getUserById } = await import('./auth.service');

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

    // Get fresh user data from database
    const user = await getUserById(authReq.user.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: AuthErrorCode.USER_NOT_FOUND,
          message: 'User not found',
          statusCode: 404,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    sendSuccess(res, toAuthUserData(user), 'User data retrieved');
  } catch (error) {
    logger.error('Get current user error', { error });
    next(error);
  }
}

// ============================================
// CHANGE PASSWORD CONTROLLER
// ============================================

/**
 * POST /api/auth/change-password
 * 
 * Changes the authenticated user's password.
 * Requires current password verification.
 * 
 * Request body:
 * - currentPassword: Current password
 * - newPassword: New password (must meet requirements)
 * - confirmPassword: New password confirmation
 * 
 * Responses:
 * - 200: Password changed successfully
 * - 400: Validation errors
 * - 401: Current password incorrect
 */
export async function handleChangePassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { currentPassword, newPassword, confirmPassword }: ChangePasswordRequest = req.body;

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

    // Validate request
    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Current password, new password, and confirmation are required',
          statusCode: 400,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        error: {
          code: AuthErrorCode.PASSWORDS_DONT_MATCH,
          message: 'New passwords do not match',
          statusCode: 400,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check password isn't the same
    if (currentPassword === newPassword) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'New password must be different from current password',
          statusCode: 400,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Change password
    await changePassword(authReq.user.userId, currentPassword, newPassword);

    logger.info('Password changed', { userId: authReq.user.userId });

    sendSuccess(
      res, 
      { loggedOutFromAllDevices: true },
      'Password changed successfully. Please log in again on all devices.'
    );
  } catch (error) {
    if (error instanceof AuthError) {
      sendError(res, error);
      return;
    }

    logger.error('Change password error', { error });
    next(error);
  }
}

// ============================================
// GET PASSWORD REQUIREMENTS CONTROLLER
// ============================================

/**
 * GET /api/auth/password-requirements
 * 
 * Returns the password requirements for the system.
 * Useful for client-side validation.
 * 
 * Responses:
 * - 200: Password requirements object
 */
export function getPasswordRequirements(
  req: Request,
  res: Response
): void {
  sendSuccess(res, PASSWORD_REQUIREMENTS, 'Password requirements retrieved');
}

// ============================================
// VALIDATE PASSWORD CONTROLLER
// ============================================

/**
 * POST /api/auth/validate-password
 * 
 * Validates a password against requirements without saving.
 * Useful for client-side password strength indicator.
 * 
 * Request body:
 * - password: Password to validate
 * 
 * Responses:
 * - 200: Validation result with errors and strength
 */
export function handleValidatePassword(
  req: Request,
  res: Response
): void {
  const { password } = req.body;

  if (!password) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Password is required',
        statusCode: 400,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const result = validatePassword(password);
  sendSuccess(res, result, 'Password validated');
}
