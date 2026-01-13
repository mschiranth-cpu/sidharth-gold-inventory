/**
 * ============================================
 * AUTH SERVICE
 * ============================================
 *
 * Business logic for authentication operations.
 * Handles password hashing, JWT generation, token rotation,
 * and user authentication flows.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient, User, UserRole, DepartmentName } from '@prisma/client';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenPair,
  AuthUserData,
  LoginRequest,
  RegisterRequest,
  PasswordValidationResult,
  PasswordRequirements,
  AuthError,
  AuthErrorCode,
  StoredRefreshToken,
  RateLimitInfo,
  RateLimitConfig,
} from './auth.types';

// ============================================
// PRISMA CLIENT INSTANCE
// ============================================

const prisma = new PrismaClient();

// ============================================
// CONFIGURATION CONSTANTS
// ============================================

/**
 * Password hashing configuration
 * Using bcrypt with salt rounds of 12 for strong security
 */
const SALT_ROUNDS = 12;

/**
 * JWT token expiration times
 */
const TOKEN_EXPIRY = {
  ACCESS: '15m', // Short-lived access token
  ACCESS_REMEMBER: '1d', // Extended access when "remember me" is checked
  REFRESH: '7d', // Refresh token validity
  REFRESH_REMEMBER: '30d', // Extended refresh when "remember me" is checked
};

/**
 * Password requirements configuration
 */
export const PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

/**
 * Rate limiting configuration for login attempts
 */
export const RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 30 * 60 * 1000, // 30 minutes block
};

// ============================================
// IN-MEMORY STORES (Use Redis in production)
// ============================================

/**
 * Rate limit tracking by IP/email
 * NOTE: In production, use Redis for distributed rate limiting
 */
const rateLimitStore = new Map<string, RateLimitInfo>();

/**
 * Refresh token store
 * NOTE: In production, store in database or Redis
 */
const refreshTokenStore = new Map<string, StoredRefreshToken>();

// ============================================
// PASSWORD UTILITIES
// ============================================

/**
 * Validates password against security requirements
 *
 * @param password - Password to validate
 * @returns Validation result with errors and strength
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Check minimum length
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  } else {
    score += password.length >= 12 ? 2 : 1;
  }

  // Check uppercase requirement
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score += 1;
  }

  // Check lowercase requirement
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score += 1;
  }

  // Check number requirement
  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (/[0-9]/.test(password)) {
    score += 1;
  }

  // Check special character requirement
  const specialCharRegex = new RegExp(
    `[${PASSWORD_REQUIREMENTS.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`
  );
  if (PASSWORD_REQUIREMENTS.requireSpecialChar && !specialCharRegex.test(password)) {
    errors.push(
      'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)'
    );
  } else if (specialCharRegex.test(password)) {
    score += 1;
  }

  // Check for common patterns (optional additional security)
  if (/^(password|123456|qwerty)/i.test(password)) {
    errors.push('Password is too common');
    score = Math.max(0, score - 2);
  }

  // Determine password strength
  let strength: PasswordValidationResult['strength'];
  if (score <= 2) {
    strength = 'weak';
  } else if (score <= 3) {
    strength = 'fair';
  } else if (score <= 5) {
    strength = 'strong';
  } else {
    strength = 'very-strong';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Hashes a password using bcrypt
 *
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a plain text password with a hash
 *
 * @param password - Plain text password
 * @param hash - Stored password hash
 * @returns True if passwords match
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================
// JWT TOKEN UTILITIES
// ============================================

/**
 * Generates an access token for a user
 *
 * @param user - User object
 * @param rememberMe - Extended token validity
 * @returns Access token string
 */
export function generateAccessToken(
  user: Pick<User, 'id' | 'email' | 'role'>,
  rememberMe = false
): string {
  const payload: AccessTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: 'access',
  };

  const expiresIn = rememberMe ? TOKEN_EXPIRY.ACCESS_REMEMBER : TOKEN_EXPIRY.ACCESS;

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Generates a refresh token for a user
 *
 * @param userId - User ID
 * @param rememberMe - Extended token validity
 * @returns Object with token and metadata
 */
export function generateRefreshToken(
  userId: string,
  rememberMe = false
): {
  token: string;
  tokenId: string;
  expiresAt: Date;
} {
  const tokenId = crypto.randomUUID();

  const payload: RefreshTokenPayload = {
    userId,
    tokenId,
    type: 'refresh',
  };

  const expiresIn = rememberMe ? TOKEN_EXPIRY.REFRESH_REMEMBER : TOKEN_EXPIRY.REFRESH;
  const token = jwt.sign(payload, config.jwtSecret, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  });

  // Calculate expiration date
  const decoded = jwt.decode(token) as RefreshTokenPayload;
  const expiresAt = new Date((decoded.exp || 0) * 1000);

  return { token, tokenId, expiresAt };
}

/**
 * Generates both access and refresh tokens
 *
 * @param user - User object
 * @param rememberMe - Extended token validity
 * @returns Token pair with expiration dates
 */
export function generateTokenPair(
  user: Pick<User, 'id' | 'email' | 'role'>,
  rememberMe = false
): TokenPair {
  const accessToken = generateAccessToken(user, rememberMe);
  const { token: refreshToken, expiresAt: refreshTokenExpiresAt } = generateRefreshToken(
    user.id,
    rememberMe
  );

  // Calculate access token expiration
  const accessDecoded = jwt.decode(accessToken) as AccessTokenPayload;
  const accessTokenExpiresAt = new Date((accessDecoded.exp || 0) * 1000);

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  };
}

/**
 * Verifies and decodes an access token
 *
 * @param token - JWT access token
 * @returns Decoded payload
 * @throws AuthError if token is invalid or expired
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AccessTokenPayload;

    if (decoded.type !== 'access') {
      throw new AuthError(AuthErrorCode.INVALID_TOKEN, 'Invalid token type', 401);
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError(AuthErrorCode.TOKEN_EXPIRED, 'Access token has expired', 401);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthError(AuthErrorCode.INVALID_TOKEN, 'Invalid access token', 401);
    }
    throw error;
  }
}

/**
 * Verifies and decodes a refresh token
 *
 * @param token - JWT refresh token
 * @returns Decoded payload
 * @throws AuthError if token is invalid or expired
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as RefreshTokenPayload;

    if (decoded.type !== 'refresh') {
      throw new AuthError(AuthErrorCode.INVALID_REFRESH_TOKEN, 'Invalid token type', 401);
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError(AuthErrorCode.TOKEN_EXPIRED, 'Refresh token has expired', 401);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthError(AuthErrorCode.INVALID_REFRESH_TOKEN, 'Invalid refresh token', 401);
    }
    throw error;
  }
}

// ============================================
// REFRESH TOKEN STORAGE (In-Memory)
// ============================================

/**
 * Stores a refresh token for later validation
 * Implements token rotation by invalidating old tokens
 *
 * @param userId - User ID
 * @param tokenId - Unique token ID
 * @param expiresAt - Token expiration
 * @param userAgent - Client user agent
 * @param ipAddress - Client IP address
 */
export function storeRefreshToken(
  userId: string,
  tokenId: string,
  expiresAt: Date,
  userAgent?: string,
  ipAddress?: string
): void {
  const tokenHash = crypto.createHash('sha256').update(tokenId).digest('hex');

  const storedToken: StoredRefreshToken = {
    id: tokenId,
    userId,
    tokenHash,
    expiresAt,
    createdAt: new Date(),
    userAgent,
    ipAddress,
    isRevoked: false,
  };

  refreshTokenStore.set(tokenId, storedToken);

  logger.debug(`Stored refresh token for user ${userId}`, { tokenId });
}

/**
 * Validates a stored refresh token
 *
 * @param tokenId - Token ID to validate
 * @returns Stored token data or null if invalid
 */
export function getStoredRefreshToken(tokenId: string): StoredRefreshToken | null {
  const token = refreshTokenStore.get(tokenId);

  if (!token) {
    logger.debug(`Refresh token not found: ${tokenId}`);
    return null;
  }

  if (token.isRevoked) {
    logger.warn(`Attempted to use revoked refresh token: ${tokenId}`);
    return null;
  }

  if (new Date() > token.expiresAt) {
    logger.debug(`Refresh token expired: ${tokenId}`);
    refreshTokenStore.delete(tokenId);
    return null;
  }

  return token;
}

/**
 * Revokes a specific refresh token
 *
 * @param tokenId - Token ID to revoke
 * @returns True if token was found and revoked
 */
export function revokeRefreshToken(tokenId: string): boolean {
  const token = refreshTokenStore.get(tokenId);

  if (!token) {
    return false;
  }

  token.isRevoked = true;
  token.revokedAt = new Date();
  refreshTokenStore.set(tokenId, token);

  logger.info(`Revoked refresh token: ${tokenId}`);
  return true;
}

/**
 * Revokes all refresh tokens for a user
 * Used for "logout from all devices" functionality
 *
 * @param userId - User ID
 * @returns Number of tokens revoked
 */
export function revokeAllUserRefreshTokens(userId: string): number {
  let revokedCount = 0;

  refreshTokenStore.forEach((token, tokenId) => {
    if (token.userId === userId && !token.isRevoked) {
      token.isRevoked = true;
      token.revokedAt = new Date();
      refreshTokenStore.set(tokenId, token);
      revokedCount++;
    }
  });

  logger.info(`Revoked ${revokedCount} refresh tokens for user ${userId}`);
  return revokedCount;
}

/**
 * Rotates a refresh token (invalidate old, create new)
 * Implements refresh token rotation for enhanced security
 *
 * @param oldTokenId - Current token ID
 * @param userId - User ID
 * @param rememberMe - Extended validity
 * @param userAgent - Client user agent
 * @param ipAddress - Client IP
 * @returns New refresh token data
 */
export function rotateRefreshToken(
  oldTokenId: string,
  userId: string,
  rememberMe = false,
  userAgent?: string,
  ipAddress?: string
): { token: string; tokenId: string; expiresAt: Date } {
  // Revoke old token
  const oldToken = refreshTokenStore.get(oldTokenId);
  if (oldToken) {
    oldToken.isRevoked = true;
    oldToken.revokedAt = new Date();
  }

  // Generate new token
  const newToken = generateRefreshToken(userId, rememberMe);

  // Link old token to new one (for security audit)
  if (oldToken) {
    oldToken.replacedByTokenId = newToken.tokenId;
    refreshTokenStore.set(oldTokenId, oldToken);
  }

  // Store new token
  storeRefreshToken(userId, newToken.tokenId, newToken.expiresAt, userAgent, ipAddress);

  logger.debug(`Rotated refresh token for user ${userId}`, {
    oldTokenId,
    newTokenId: newToken.tokenId,
  });

  return newToken;
}

// ============================================
// RATE LIMITING
// ============================================

/**
 * Checks if login attempt is rate limited
 *
 * @param key - Rate limit key (IP or email)
 * @returns Object with rate limit status and remaining time
 */
export function checkRateLimit(key: string): {
  isLimited: boolean;
  remainingAttempts: number;
  retryAfter?: number;
} {
  const now = new Date();
  const info = rateLimitStore.get(key);

  if (!info) {
    return { isLimited: false, remainingAttempts: RATE_LIMIT_CONFIG.maxAttempts };
  }

  // Check if block is still active
  if (info.blockedUntil && now < info.blockedUntil) {
    const retryAfter = Math.ceil((info.blockedUntil.getTime() - now.getTime()) / 1000);
    return { isLimited: true, remainingAttempts: 0, retryAfter };
  }

  // Check if window has expired
  const windowStart = new Date(now.getTime() - RATE_LIMIT_CONFIG.windowMs);
  if (info.firstAttempt < windowStart) {
    // Reset the counter
    rateLimitStore.delete(key);
    return { isLimited: false, remainingAttempts: RATE_LIMIT_CONFIG.maxAttempts };
  }

  const remainingAttempts = RATE_LIMIT_CONFIG.maxAttempts - info.attempts;
  return { isLimited: remainingAttempts <= 0, remainingAttempts: Math.max(0, remainingAttempts) };
}

/**
 * Records a login attempt for rate limiting
 *
 * @param key - Rate limit key (IP or email)
 * @param success - Whether login was successful
 */
export function recordLoginAttempt(key: string, success: boolean): void {
  const now = new Date();
  let info = rateLimitStore.get(key);

  if (success) {
    // Clear rate limit on successful login
    rateLimitStore.delete(key);
    return;
  }

  if (!info) {
    info = {
      attempts: 1,
      firstAttempt: now,
      lastAttempt: now,
      blockedUntil: null,
    };
  } else {
    info.attempts++;
    info.lastAttempt = now;

    // Block if max attempts exceeded
    if (info.attempts >= RATE_LIMIT_CONFIG.maxAttempts) {
      info.blockedUntil = new Date(now.getTime() + RATE_LIMIT_CONFIG.blockDurationMs);
      logger.warn(
        `Rate limit exceeded for ${key}, blocked until ${info.blockedUntil.toISOString()}`
      );
    }
  }

  rateLimitStore.set(key, info);
}

// ============================================
// USER AUTHENTICATION SERVICES
// ============================================

/**
 * Transforms a Prisma User to AuthUserData (excludes sensitive fields)
 */
export function toAuthUserData(user: User): AuthUserData {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    phone: user.phone,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

/**
 * Authenticates a user with email and password
 *
 * @param credentials - Login credentials
 * @param ipAddress - Client IP for rate limiting
 * @returns Authenticated user or throws error
 */
export async function authenticateUser(
  credentials: LoginRequest,
  ipAddress?: string
): Promise<{ user: User; isFirstLogin: boolean }> {
  const { email, password } = credentials;
  const rateLimitKey = `login:${email}:${ipAddress || 'unknown'}`;

  // Check rate limit
  const rateLimit = checkRateLimit(rateLimitKey);
  if (rateLimit.isLimited) {
    throw new AuthError(
      AuthErrorCode.RATE_LIMIT_EXCEEDED,
      `Too many login attempts. Please try again in ${rateLimit.retryAfter} seconds.`,
      429,
      { retryAfter: rateLimit.retryAfter }
    );
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    recordLoginAttempt(rateLimitKey, false);
    throw new AuthError(AuthErrorCode.INVALID_CREDENTIALS, 'Invalid email or password', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    recordLoginAttempt(rateLimitKey, false);
    throw new AuthError(
      AuthErrorCode.USER_INACTIVE,
      'Your account has been deactivated. Please contact an administrator.',
      403
    );
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    recordLoginAttempt(rateLimitKey, false);
    throw new AuthError(AuthErrorCode.INVALID_CREDENTIALS, 'Invalid email or password', 401);
  }

  // Clear rate limit on successful login
  recordLoginAttempt(rateLimitKey, true);

  // Check if this is first login
  const isFirstLogin = user.lastLoginAt === null;

  // Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  logger.info(`User logged in: ${user.email}`, { userId: user.id, role: user.role });

  return { user, isFirstLogin };
}

/**
 * Registers a new user
 *
 * @param data - Registration data
 * @param createdByUserId - ID of admin creating the user (optional)
 * @returns Created user
 */
export async function registerUser(data: RegisterRequest, createdByUserId?: string): Promise<User> {
  const { name, email, password, confirmPassword, phone, role, department } = data;

  // Validate passwords match
  if (password !== confirmPassword) {
    throw new AuthError(AuthErrorCode.PASSWORDS_DONT_MATCH, 'Passwords do not match', 400);
  }

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    throw new AuthError(
      AuthErrorCode.PASSWORD_VALIDATION_FAILED,
      'Password does not meet requirements',
      400,
      { errors: passwordValidation.errors }
    );
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (existingUser) {
    throw new AuthError(
      AuthErrorCode.EMAIL_EXISTS,
      'An account with this email already exists',
      409
    );
  }

  // Validate department worker has department assigned
  if (role === 'DEPARTMENT_WORKER' && !department) {
    throw new AuthError(
      AuthErrorCode.PASSWORD_VALIDATION_FAILED,
      'Department workers must be assigned to a department',
      400
    );
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const newUser = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone?.trim() || null,
      role: role || 'OFFICE_STAFF', // Default role
      department: (department as DepartmentName) || null,
      isActive: true,
    },
  });

  logger.info(`New user registered: ${newUser.email}`, {
    userId: newUser.id,
    role: newUser.role,
    createdBy: createdByUserId,
  });

  return newUser;
}

/**
 * Refreshes tokens using a valid refresh token
 * Implements token rotation for security
 *
 * @param refreshToken - Current refresh token
 * @param userAgent - Client user agent
 * @param ipAddress - Client IP
 * @returns New token pair
 */
export async function refreshTokens(
  refreshToken: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ user: User; tokens: TokenPair }> {
  // Verify the refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // Check if token is stored and valid
  const storedToken = getStoredRefreshToken(decoded.tokenId);
  if (!storedToken) {
    throw new AuthError(
      AuthErrorCode.TOKEN_REVOKED,
      'Refresh token has been revoked or is invalid',
      401
    );
  }

  // Get fresh user data
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) {
    throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found', 401);
  }

  if (!user.isActive) {
    throw new AuthError(AuthErrorCode.USER_INACTIVE, 'User account has been deactivated', 403);
  }

  // Rotate refresh token
  const newRefreshToken = rotateRefreshToken(decoded.tokenId, user.id, false, userAgent, ipAddress);

  // Generate new access token
  const accessToken = generateAccessToken(user);
  const accessDecoded = jwt.decode(accessToken) as AccessTokenPayload;

  const tokens: TokenPair = {
    accessToken,
    refreshToken: newRefreshToken.token,
    accessTokenExpiresAt: new Date((accessDecoded.exp || 0) * 1000),
    refreshTokenExpiresAt: newRefreshToken.expiresAt,
  };

  logger.debug(`Tokens refreshed for user ${user.email}`);

  return { user, tokens };
}

/**
 * Logs out a user by revoking tokens
 *
 * @param userId - User ID
 * @param refreshToken - Current refresh token (optional)
 * @param allDevices - Logout from all devices
 * @returns Number of sessions logged out
 */
export async function logoutUser(
  userId: string,
  refreshToken?: string,
  allDevices = false
): Promise<number> {
  if (allDevices) {
    // Revoke all refresh tokens for the user
    const revokedCount = revokeAllUserRefreshTokens(userId);
    logger.info(`User logged out from all devices: ${userId}`, { sessions: revokedCount });
    return revokedCount;
  }

  if (refreshToken) {
    // Revoke specific refresh token
    try {
      const decoded = verifyRefreshToken(refreshToken);
      revokeRefreshToken(decoded.tokenId);
      logger.info(`User logged out: ${userId}`);
      return 1;
    } catch {
      // Token might already be invalid, that's okay
      return 0;
    }
  }

  return 0;
}

/**
 * Changes a user's password
 *
 * @param userId - User ID
 * @param currentPassword - Current password
 * @param newPassword - New password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found', 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new AuthError(AuthErrorCode.INVALID_CREDENTIALS, 'Current password is incorrect', 401);
  }

  // Validate new password
  const validation = validatePassword(newPassword);
  if (!validation.isValid) {
    throw new AuthError(
      AuthErrorCode.PASSWORD_VALIDATION_FAILED,
      'New password does not meet requirements',
      400,
      { errors: validation.errors }
    );
  }

  // Hash and update password
  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  // Revoke all refresh tokens (force re-login on all devices)
  revokeAllUserRefreshTokens(userId);

  logger.info(`Password changed for user ${userId}`);
}

/**
 * Gets a user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id: userId },
  });
}

// ============================================
// CLEANUP FUNCTIONS
// ============================================

/**
 * Cleans up expired tokens and rate limit entries
 * Should be run periodically (e.g., via cron job)
 */
export function cleanupExpiredData(): void {
  const now = new Date();
  let tokensRemoved = 0;
  let rateLimitsRemoved = 0;

  // Clean expired refresh tokens
  refreshTokenStore.forEach((token, tokenId) => {
    if (now > token.expiresAt) {
      refreshTokenStore.delete(tokenId);
      tokensRemoved++;
    }
  });

  // Clean expired rate limits
  const windowStart = new Date(now.getTime() - RATE_LIMIT_CONFIG.windowMs);
  rateLimitStore.forEach((info, key) => {
    if (info.lastAttempt < windowStart && (!info.blockedUntil || now > info.blockedUntil)) {
      rateLimitStore.delete(key);
      rateLimitsRemoved++;
    }
  });

  if (tokensRemoved > 0 || rateLimitsRemoved > 0) {
    logger.debug(`Cleanup: removed ${tokensRemoved} tokens, ${rateLimitsRemoved} rate limits`);
  }
}

// Run cleanup every 15 minutes
setInterval(cleanupExpiredData, 15 * 60 * 1000);
