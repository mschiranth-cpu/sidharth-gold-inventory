/**
 * ============================================
 * ENHANCED AUTHENTICATION SERVICE
 * ============================================
 * 
 * Secure authentication features:
 * - httpOnly cookie for refresh tokens
 * - Token rotation on refresh
 * - Token blacklist for logout
 * - 2FA support
 * - Session management
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { securityConfig } from '../config/security.config';
import { cacheService } from '../utils/cache';
import { logger } from '../utils/logger';
import { config } from '../config';

// ============================================
// TYPES
// ============================================

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
  sessionId?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

// ============================================
// TOKEN BLACKLIST (In-memory + Redis)
// ============================================

const memoryBlacklist = new Set<string>();

/**
 * Add token to blacklist
 */
export async function blacklistToken(
  token: string,
  expiresIn: number // seconds
): Promise<void> {
  if (!securityConfig.authentication.tokenBlacklist.enabled) return;

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  try {
    await cacheService.set(`blacklist:${tokenHash}`, true, expiresIn);
  } catch {
    // Redis unavailable, use memory
  }
  
  memoryBlacklist.add(tokenHash);
  
  // Clean up memory blacklist periodically
  setTimeout(() => {
    memoryBlacklist.delete(tokenHash);
  }, expiresIn * 1000);
}

/**
 * Check if token is blacklisted
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  if (!securityConfig.authentication.tokenBlacklist.enabled) return false;

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  // Check memory first
  if (memoryBlacklist.has(tokenHash)) return true;
  
  try {
    const result = await cacheService.get<boolean>(`blacklist:${tokenHash}`);
    return result === true;
  } catch {
    return false;
  }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

const activeSessions = new Map<string, Set<string>>();

/**
 * Create a new session
 */
export function createSession(userId: string): string {
  const sessionId = crypto.randomBytes(32).toString('hex');
  
  if (!activeSessions.has(userId)) {
    activeSessions.set(userId, new Set());
  }
  
  const userSessions = activeSessions.get(userId)!;
  
  // Enforce max concurrent sessions
  const maxSessions = securityConfig.authentication.session.maxConcurrentSessions;
  if (userSessions.size >= maxSessions) {
    // Remove oldest session (first in set)
    const oldest = userSessions.values().next().value;
    if (oldest) {
      userSessions.delete(oldest);
    }
  }
  
  userSessions.add(sessionId);
  
  return sessionId;
}

/**
 * Validate session
 */
export function validateSession(userId: string, sessionId: string): boolean {
  const userSessions = activeSessions.get(userId);
  return userSessions?.has(sessionId) ?? false;
}

/**
 * Invalidate session
 */
export function invalidateSession(userId: string, sessionId: string): void {
  const userSessions = activeSessions.get(userId);
  if (userSessions) {
    userSessions.delete(sessionId);
    if (userSessions.size === 0) {
      activeSessions.delete(userId);
    }
  }
}

/**
 * Invalidate all sessions for user
 */
export function invalidateAllSessions(userId: string): void {
  activeSessions.delete(userId);
}

// ============================================
// TOKEN GENERATION
// ============================================

/**
 * Generate access token
 */
export function generateAccessToken(payload: Omit<TokenPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'access' },
    config.jwtSecret,
    { 
      expiresIn: securityConfig.authentication.jwt.accessToken.expiresIn,
      algorithm: securityConfig.authentication.jwt.accessToken.algorithm,
    }
  );
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: Omit<TokenPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    config.jwtRefreshSecret,
    { 
      expiresIn: securityConfig.authentication.jwt.refreshToken.expiresIn,
    }
  );
}

/**
 * Generate token pair
 */
export function generateTokenPair(
  userId: string,
  email: string,
  role: string
): TokenPair {
  const sessionId = createSession(userId);
  
  const payload = { userId, email, role, sessionId };
  
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  
  // Calculate expiration times
  const accessTokenExp = jwt.decode(accessToken) as { exp: number };
  const refreshTokenExp = jwt.decode(refreshToken) as { exp: number };
  
  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt: new Date(accessTokenExp.exp * 1000),
    refreshTokenExpiresAt: new Date(refreshTokenExp.exp * 1000),
  };
}

// ============================================
// COOKIE MANAGEMENT
// ============================================

/**
 * Set refresh token as httpOnly cookie
 */
export function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  const cookieConfig = securityConfig.authentication.cookies.refreshToken;
  
  res.cookie(cookieConfig.name, refreshToken, {
    httpOnly: cookieConfig.httpOnly,
    secure: cookieConfig.secure,
    sameSite: cookieConfig.sameSite,
    path: cookieConfig.path,
    maxAge: cookieConfig.maxAge,
  });
}

/**
 * Set access token as httpOnly cookie (optional, for cookie-based auth)
 */
export function setAccessTokenCookie(res: Response, accessToken: string): void {
  const cookieConfig = securityConfig.authentication.cookies.accessToken;
  
  res.cookie(cookieConfig.name, accessToken, {
    httpOnly: cookieConfig.httpOnly,
    secure: cookieConfig.secure,
    sameSite: cookieConfig.sameSite,
    path: cookieConfig.path,
    maxAge: cookieConfig.maxAge,
  });
}

/**
 * Clear auth cookies
 */
export function clearAuthCookies(res: Response): void {
  res.clearCookie(securityConfig.authentication.cookies.refreshToken.name, {
    path: securityConfig.authentication.cookies.refreshToken.path,
  });
  res.clearCookie(securityConfig.authentication.cookies.accessToken.name, {
    path: securityConfig.authentication.cookies.accessToken.path,
  });
}

// ============================================
// TOKEN VERIFICATION
// ============================================

/**
 * Verify and decode access token
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    // Check blacklist
    if (await isTokenBlacklisted(token)) {
      return null;
    }
    
    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
    
    // Verify token type
    if (decoded.type !== 'access') {
      return null;
    }
    
    // Verify session is still valid
    if (!validateSession(decoded.userId, decoded.sessionId)) {
      return null;
    }
    
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Verify and decode refresh token
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    // Check blacklist
    if (await isTokenBlacklisted(token)) {
      return null;
    }
    
    const decoded = jwt.verify(token, config.jwtRefreshSecret) as TokenPayload;
    
    // Verify token type
    if (decoded.type !== 'refresh') {
      return null;
    }
    
    // Verify session is still valid
    if (!validateSession(decoded.userId, decoded.sessionId)) {
      return null;
    }
    
    return decoded;
  } catch {
    return null;
  }
}

// ============================================
// EXPRESS MIDDLEWARE
// ============================================

/**
 * Enhanced authentication middleware
 */
export const enhancedAuthenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Try to get token from Authorization header
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    // Fallback to cookie
    if (!token) {
      token = req.cookies?.[securityConfig.authentication.cookies.accessToken.name];
    }
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Access denied. No token provided.',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    const payload = await verifyAccessToken(token);
    
    if (!payload) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token.',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    req.user = payload;
    req.sessionId = payload.sessionId;
    
    next();
  } catch (error) {
    logger.error('Authentication error', { error });
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed.',
        statusCode: 401,
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Token rotation on refresh
 */
export const handleTokenRefresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get refresh token from cookie or body
    let refreshToken = req.cookies?.[securityConfig.authentication.cookies.refreshToken.name];
    
    if (!refreshToken) {
      refreshToken = req.body?.refreshToken;
    }
    
    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: 'No refresh token provided.',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    const payload = await verifyRefreshToken(refreshToken);
    
    if (!payload) {
      clearAuthCookies(res);
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token.',
          statusCode: 401,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    // Blacklist old refresh token if rotation is enabled
    if (securityConfig.authentication.jwt.refreshToken.rotateOnUse) {
      const decoded = jwt.decode(refreshToken) as { exp: number };
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
      await blacklistToken(refreshToken, Math.max(expiresIn, 0));
    }
    
    // Generate new token pair
    const tokens = generateTokenPair(payload.userId, payload.email, payload.role);
    
    // Set new refresh token cookie
    setRefreshTokenCookie(res, tokens.refreshToken);
    
    // Attach to request for controller use
    (req as any).newTokens = tokens;
    (req as any).tokenPayload = payload;
    
    next();
  } catch (error) {
    logger.error('Token refresh error', { error });
    clearAuthCookies(res);
    res.status(401).json({
      success: false,
      error: {
        code: 'REFRESH_ERROR',
        message: 'Failed to refresh token.',
        statusCode: 401,
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Logout handler
 */
export const handleLogout = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Get tokens
    const accessToken = req.headers.authorization?.replace('Bearer ', '') ||
      req.cookies?.[securityConfig.authentication.cookies.accessToken.name];
    
    const refreshToken = req.cookies?.[securityConfig.authentication.cookies.refreshToken.name] ||
      req.body?.refreshToken;
    
    // Blacklist tokens
    if (accessToken) {
      const decoded = jwt.decode(accessToken) as { exp?: number } | null;
      if (decoded?.exp) {
        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
        await blacklistToken(accessToken, Math.max(expiresIn, 0));
      }
    }
    
    if (refreshToken) {
      const decoded = jwt.decode(refreshToken) as { exp?: number } | null;
      if (decoded?.exp) {
        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
        await blacklistToken(refreshToken, Math.max(expiresIn, 0));
      }
    }
    
    // Invalidate session
    if (req.user?.userId && req.sessionId) {
      invalidateSession(req.user.userId, req.sessionId);
    }
    
    // Clear cookies
    clearAuthCookies(res);
    
    res.json({
      success: true,
      message: 'Logged out successfully.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Logout error', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_ERROR',
        message: 'Failed to logout.',
        statusCode: 500,
      },
      timestamp: new Date().toISOString(),
    });
  }
};

// ============================================
// 2FA UTILITIES
// ============================================

/**
 * Generate TOTP secret
 */
export function generate2FASecret(): { secret: string; otpauthUrl: string } {
  const secret = crypto.randomBytes(20).toString('base32');
  const issuer = encodeURIComponent(securityConfig.authentication.twoFactor.issuer);
  const otpauthUrl = `otpauth://totp/${issuer}?secret=${secret}&issuer=${issuer}&algorithm=${securityConfig.authentication.twoFactor.algorithm}&digits=${securityConfig.authentication.twoFactor.digits}&period=${securityConfig.authentication.twoFactor.period}`;
  
  return { secret, otpauthUrl };
}

/**
 * Verify TOTP token
 */
export function verify2FAToken(secret: string, token: string): boolean {
  // This is a simplified TOTP verification
  // In production, use a library like 'otplib' for proper implementation
  const config2FA = securityConfig.authentication.twoFactor;
  const window = config2FA.window;
  const period = config2FA.period;
  const now = Math.floor(Date.now() / 1000);
  
  for (let i = -window; i <= window; i++) {
    const counter = Math.floor((now + i * period) / period);
    const expectedToken = generateTOTP(secret, counter, config2FA.digits);
    if (expectedToken === token) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generate TOTP (simplified - use otplib in production)
 */
function generateTOTP(secret: string, counter: number, digits: number): string {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  
  const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base32'));
  hmac.update(buffer);
  const hash = hmac.digest();
  
  const offset = hash[hash.length - 1] & 0x0f;
  const code = (
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)
  ) % Math.pow(10, digits);
  
  return code.toString().padStart(digits, '0');
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(): string[] {
  const { count, length } = securityConfig.authentication.twoFactor.backupCodes;
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(length / 2).toString('hex').toUpperCase();
    codes.push(code);
  }
  
  return codes;
}

// ============================================
// EXPORTS
// ============================================

export default {
  // Token management
  generateTokenPair,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  blacklistToken,
  isTokenBlacklisted,
  
  // Cookie management
  setRefreshTokenCookie,
  setAccessTokenCookie,
  clearAuthCookies,
  
  // Session management
  createSession,
  validateSession,
  invalidateSession,
  invalidateAllSessions,
  
  // Middleware
  enhancedAuthenticate,
  handleTokenRefresh,
  handleLogout,
  
  // 2FA
  generate2FASecret,
  verify2FAToken,
  generateBackupCodes,
};
