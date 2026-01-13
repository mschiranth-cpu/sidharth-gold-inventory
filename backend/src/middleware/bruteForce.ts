/**
 * ============================================
 * BRUTE FORCE PROTECTION MIDDLEWARE
 * ============================================
 * 
 * Protects against brute force login attacks:
 * - Tracks failed login attempts by IP and email
 * - Progressive delays after failed attempts
 * - Account lockout after max attempts
 * - Redis-backed for distributed systems
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { securityConfig } from '../config/security.config';
import { cacheService } from '../utils/cache';
import { logger } from '../utils/logger';

// ============================================
// TYPES
// ============================================

interface LoginAttempt {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

interface BruteForceResult {
  allowed: boolean;
  attemptsRemaining: number;
  lockedUntil: Date | null;
  delay: number;
  message?: string;
}

// ============================================
// IN-MEMORY FALLBACK STORE
// ============================================

const memoryStore = new Map<string, LoginAttempt>();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get client IP address
 */
function getClientIP(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] as string ||
    req.ip ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Generate storage key for tracking attempts
 */
function getAttemptKey(identifier: string, type: 'ip' | 'email'): string {
  return `${securityConfig.bruteForce.keyPrefix}${type}:${identifier}`;
}

/**
 * Get login attempts from storage
 */
async function getAttempts(key: string): Promise<LoginAttempt | null> {
  try {
    // Try Redis first
    const data = await cacheService.get<LoginAttempt>(key);
    if (data) return data;
  } catch {
    // Redis unavailable, use memory store
  }
  
  return memoryStore.get(key) || null;
}

/**
 * Save login attempts to storage
 */
async function saveAttempts(key: string, data: LoginAttempt): Promise<void> {
  const ttl = Math.max(
    securityConfig.bruteForce.attemptWindow,
    securityConfig.bruteForce.lockoutDuration
  ) / 1000; // Convert to seconds for Redis

  try {
    await cacheService.set(key, data, ttl);
  } catch {
    // Redis unavailable, use memory store
  }
  
  memoryStore.set(key, data);
}

/**
 * Delete attempts from storage
 */
async function deleteAttempts(key: string): Promise<void> {
  try {
    await cacheService.delete(key);
  } catch {
    // Redis unavailable
  }
  
  memoryStore.delete(key);
}

/**
 * Calculate progressive delay based on attempt count
 */
function getProgressiveDelay(attemptCount: number): number {
  const delays = securityConfig.bruteForce.progressiveDelays;
  const index = Math.min(attemptCount - 1, delays.length - 1);
  return delays[Math.max(0, index)] || 0;
}

// ============================================
// CORE BRUTE FORCE FUNCTIONS
// ============================================

/**
 * Check if login is allowed (not blocked)
 */
export async function checkBruteForce(
  ip: string,
  email?: string
): Promise<BruteForceResult> {
  if (!securityConfig.bruteForce.enabled) {
    return {
      allowed: true,
      attemptsRemaining: Infinity,
      lockedUntil: null,
      delay: 0,
    };
  }

  // Check whitelist
  if (securityConfig.bruteForce.whitelistIPs.includes(ip)) {
    return {
      allowed: true,
      attemptsRemaining: Infinity,
      lockedUntil: null,
      delay: 0,
    };
  }

  const now = Date.now();
  const checks: { key: string; type: 'ip' | 'email' }[] = [];

  // Determine what to check based on config
  if (securityConfig.bruteForce.trackBy === 'ip' || 
      securityConfig.bruteForce.trackBy === 'both') {
    checks.push({ key: getAttemptKey(ip, 'ip'), type: 'ip' });
  }

  if (email && (securityConfig.bruteForce.trackBy === 'email' || 
                securityConfig.bruteForce.trackBy === 'both')) {
    checks.push({ key: getAttemptKey(email.toLowerCase(), 'email'), type: 'email' });
  }

  let maxAttempts = 0;
  let worstLockout: Date | null = null;
  let worstDelay = 0;

  for (const { key } of checks) {
    const attempts = await getAttempts(key);
    
    if (!attempts) continue;

    // Check if currently locked out
    if (attempts.lockedUntil && attempts.lockedUntil > now) {
      const lockoutEnd = new Date(attempts.lockedUntil);
      if (!worstLockout || lockoutEnd > worstLockout) {
        worstLockout = lockoutEnd;
      }
    }

    // Check if attempts window has expired
    if (now - attempts.firstAttempt > securityConfig.bruteForce.attemptWindow) {
      await deleteAttempts(key);
      continue;
    }

    maxAttempts = Math.max(maxAttempts, attempts.count);
    worstDelay = Math.max(worstDelay, getProgressiveDelay(attempts.count));
  }

  // If locked out, deny
  if (worstLockout) {
    const remainingMs = worstLockout.getTime() - now;
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    
    return {
      allowed: false,
      attemptsRemaining: 0,
      lockedUntil: worstLockout,
      delay: 0,
      message: `Account temporarily locked. Try again in ${remainingMinutes} minute(s).`,
    };
  }

  // Check if max attempts reached
  if (maxAttempts >= securityConfig.bruteForce.maxAttempts) {
    const lockoutEnd = new Date(now + securityConfig.bruteForce.lockoutDuration);
    
    return {
      allowed: false,
      attemptsRemaining: 0,
      lockedUntil: lockoutEnd,
      delay: 0,
      message: `Too many failed attempts. Account locked for ${securityConfig.bruteForce.lockoutDuration / 60000} minutes.`,
    };
  }

  return {
    allowed: true,
    attemptsRemaining: securityConfig.bruteForce.maxAttempts - maxAttempts,
    lockedUntil: null,
    delay: worstDelay,
  };
}

/**
 * Record a failed login attempt
 */
export async function recordFailedAttempt(
  ip: string,
  email?: string
): Promise<BruteForceResult> {
  if (!securityConfig.bruteForce.enabled) {
    return {
      allowed: true,
      attemptsRemaining: Infinity,
      lockedUntil: null,
      delay: 0,
    };
  }

  const now = Date.now();
  const updates: { key: string; type: 'ip' | 'email' }[] = [];

  if (securityConfig.bruteForce.trackBy === 'ip' || 
      securityConfig.bruteForce.trackBy === 'both') {
    updates.push({ key: getAttemptKey(ip, 'ip'), type: 'ip' });
  }

  if (email && (securityConfig.bruteForce.trackBy === 'email' || 
                securityConfig.bruteForce.trackBy === 'both')) {
    updates.push({ key: getAttemptKey(email.toLowerCase(), 'email'), type: 'email' });
  }

  let maxAttempts = 0;

  for (const { key, type } of updates) {
    let attempts = await getAttempts(key);

    if (!attempts || now - attempts.firstAttempt > securityConfig.bruteForce.attemptWindow) {
      // Start fresh tracking
      attempts = {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        lockedUntil: null,
      };
    } else {
      // Increment existing
      attempts.count += 1;
      attempts.lastAttempt = now;
    }

    // Check if should lock out
    if (attempts.count >= securityConfig.bruteForce.maxAttempts) {
      attempts.lockedUntil = now + securityConfig.bruteForce.lockoutDuration;
      
      logger.warn('Brute force lockout triggered', {
        type,
        identifier: type === 'ip' ? ip : email,
        attempts: attempts.count,
        lockedUntil: new Date(attempts.lockedUntil).toISOString(),
      });
    }

    await saveAttempts(key, attempts);
    maxAttempts = Math.max(maxAttempts, attempts.count);
  }

  // Notify admin if threshold reached
  if (maxAttempts >= securityConfig.bruteForce.notifyAdminAfter) {
    logger.error('Multiple failed login attempts detected', {
      ip,
      email,
      attempts: maxAttempts,
    });
    // TODO: Send admin notification email/slack
  }

  const attemptsRemaining = Math.max(0, securityConfig.bruteForce.maxAttempts - maxAttempts);
  const locked = maxAttempts >= securityConfig.bruteForce.maxAttempts;

  return {
    allowed: !locked,
    attemptsRemaining,
    lockedUntil: locked ? new Date(now + securityConfig.bruteForce.lockoutDuration) : null,
    delay: getProgressiveDelay(maxAttempts),
    message: locked 
      ? `Too many failed attempts. Account locked for ${securityConfig.bruteForce.lockoutDuration / 60000} minutes.`
      : attemptsRemaining <= 2 
        ? `${attemptsRemaining} attempt(s) remaining before lockout.`
        : undefined,
  };
}

/**
 * Record a successful login (reset attempts)
 */
export async function recordSuccessfulLogin(
  ip: string,
  email?: string
): Promise<void> {
  if (!securityConfig.bruteForce.enabled) return;

  if (securityConfig.bruteForce.trackBy === 'ip' || 
      securityConfig.bruteForce.trackBy === 'both') {
    await deleteAttempts(getAttemptKey(ip, 'ip'));
  }

  if (email && (securityConfig.bruteForce.trackBy === 'email' || 
                securityConfig.bruteForce.trackBy === 'both')) {
    await deleteAttempts(getAttemptKey(email.toLowerCase(), 'email'));
  }
}

// ============================================
// EXPRESS MIDDLEWARE
// ============================================

/**
 * Brute force protection middleware for login routes
 */
export const bruteForceMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!securityConfig.bruteForce.enabled) {
    return next();
  }

  const ip = getClientIP(req);
  const email = req.body?.email;

  try {
    const result = await checkBruteForce(ip, email);

    if (!result.allowed) {
      logger.warn('Brute force protection blocked request', {
        ip,
        email,
        lockedUntil: result.lockedUntil?.toISOString(),
      });

      res.status(429).json({
        success: false,
        error: {
          code: 'TOO_MANY_ATTEMPTS',
          message: result.message || 'Too many failed attempts. Please try again later.',
          statusCode: 429,
          retryAfter: result.lockedUntil?.toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Apply progressive delay if needed
    if (result.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, result.delay));
    }

    // Attach helper functions to request for use in login handler
    (req as any).bruteForce = {
      recordSuccess: () => recordSuccessfulLogin(ip, email),
      recordFailure: () => recordFailedAttempt(ip, email),
      attemptsRemaining: result.attemptsRemaining,
    };

    next();
  } catch (error) {
    logger.error('Brute force middleware error', { error });
    // Don't block on errors, continue to login
    next();
  }
};

/**
 * Admin endpoint to manually unlock an IP or email
 */
export async function unlockAccount(
  identifier: string,
  type: 'ip' | 'email'
): Promise<boolean> {
  const key = getAttemptKey(identifier, type);
  await deleteAttempts(key);
  
  logger.info('Account manually unlocked', { identifier, type });
  return true;
}

/**
 * Get current lockout status for an identifier
 */
export async function getLockoutStatus(
  identifier: string,
  type: 'ip' | 'email'
): Promise<{
  locked: boolean;
  attempts: number;
  lockedUntil: Date | null;
  remainingTime: number;
}> {
  const key = getAttemptKey(identifier, type);
  const attempts = await getAttempts(key);
  
  if (!attempts) {
    return {
      locked: false,
      attempts: 0,
      lockedUntil: null,
      remainingTime: 0,
    };
  }

  const now = Date.now();
  const locked = !!(attempts.lockedUntil && attempts.lockedUntil > now);
  
  return {
    locked,
    attempts: attempts.count,
    lockedUntil: attempts.lockedUntil ? new Date(attempts.lockedUntil) : null,
    remainingTime: locked ? Math.max(0, attempts.lockedUntil! - now) : 0,
  };
}

// ============================================
// CLEANUP
// ============================================

// Cleanup expired entries from memory store periodically
setInterval(() => {
  const now = Date.now();
  const expiryWindow = Math.max(
    securityConfig.bruteForce.attemptWindow,
    securityConfig.bruteForce.lockoutDuration
  );

  for (const [key, value] of memoryStore.entries()) {
    if (now - value.lastAttempt > expiryWindow) {
      memoryStore.delete(key);
    }
  }
}, 60000); // Every minute

export default bruteForceMiddleware;
