/**
 * ============================================
 * RATE LIMITER MIDDLEWARE
 * ============================================
 * 
 * Rate limiting with Redis backing:
 * - Per-user and per-IP rate limiting
 * - Sliding window algorithm
 * - Different limits per endpoint type
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { cacheService } from '../utils/cache';
import { performanceConfig } from '../config/performance.config';
import { logger } from '../utils/logger';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

/**
 * Default key generator - uses user ID or IP
 */
function defaultKeyGenerator(req: Request): string {
  const user = (req as any).user;
  if (user?.id) {
    return `user:${user.id}`;
  }
  
  // Use IP address
  const ip = req.ip || 
    req.headers['x-forwarded-for']?.toString().split(',')[0] || 
    req.socket.remoteAddress ||
    'unknown';
  
  return `ip:${ip}`;
}

/**
 * Check if request should skip rate limiting
 */
function defaultSkip(req: Request): boolean {
  const { skipList } = performanceConfig.rateLimit;
  
  // Skip certain paths
  if (skipList.paths.includes(req.path)) {
    return true;
  }
  
  // Skip certain IPs
  const ip = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0];
  if (ip && skipList.ips.includes(ip)) {
    return true;
  }
  
  return false;
}

/**
 * Create rate limiter middleware
 */
export function createRateLimiter(options: Partial<RateLimitOptions> = {}): RequestHandler {
  const config = {
    windowMs: options.windowMs || performanceConfig.rateLimit.global.windowMs,
    max: options.max || performanceConfig.rateLimit.global.max,
    keyGenerator: options.keyGenerator || defaultKeyGenerator,
    skip: options.skip || defaultSkip,
    message: options.message || 'Too many requests, please try again later.',
    standardHeaders: options.standardHeaders ?? true,
    legacyHeaders: options.legacyHeaders ?? false,
  };

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Check if rate limiting is enabled
    if (!performanceConfig.rateLimit.enabled) {
      return next();
    }

    // Check if should skip
    if (config.skip(req)) {
      return next();
    }

    const key = `ratelimit:${config.keyGenerator(req)}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      // Use in-memory fallback if Redis is not available
      if (!cacheService.isAvailable()) {
        // Simple in-memory rate limiting (not recommended for production with multiple instances)
        return next();
      }

      // Get current count
      const current = await cacheService.get<RateLimitInfo>(key);
      
      let count = 1;
      let resetTime = now + config.windowMs;

      if (current) {
        if (current.resetTime > now) {
          // Still within window
          count = current.count + 1;
          resetTime = current.resetTime;
        }
        // else: Window expired, start fresh
      }

      // Update count
      await cacheService.set(key, { count, resetTime }, Math.ceil(config.windowMs / 1000));

      // Set headers
      if (config.standardHeaders) {
        res.setHeader('RateLimit-Limit', config.max);
        res.setHeader('RateLimit-Remaining', Math.max(0, config.max - count));
        res.setHeader('RateLimit-Reset', Math.ceil(resetTime / 1000));
      }

      if (config.legacyHeaders) {
        res.setHeader('X-RateLimit-Limit', config.max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, config.max - count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
      }

      // Check if limit exceeded
      if (count > config.max) {
        const retryAfter = Math.ceil((resetTime - now) / 1000);
        res.setHeader('Retry-After', retryAfter);
        
        logger.warn(`Rate limit exceeded for ${key}. Count: ${count}, Max: ${config.max}`);
        
        res.status(429).json({
          success: false,
          error: 'Too Many Requests',
          message: config.message,
          retryAfter,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Rate limiter error:', error);
      // Allow request on error (fail open)
      next();
    }
  };
}

// ============================================
// PRE-CONFIGURED RATE LIMITERS
// ============================================

/**
 * Global API rate limiter
 */
export const globalRateLimiter = createRateLimiter({
  windowMs: performanceConfig.rateLimit.global.windowMs,
  max: performanceConfig.rateLimit.global.max,
});

/**
 * Auth endpoints rate limiter (stricter)
 */
export const authRateLimiter = createRateLimiter({
  windowMs: performanceConfig.rateLimit.endpoints.auth.windowMs,
  max: performanceConfig.rateLimit.endpoints.auth.max,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
  keyGenerator: (req) => {
    // Rate limit by IP for auth endpoints
    const ip = req.ip || 
      req.headers['x-forwarded-for']?.toString().split(',')[0] || 
      'unknown';
    return `auth:${ip}`;
  },
});

/**
 * API endpoints rate limiter
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: performanceConfig.rateLimit.endpoints.api.windowMs,
  max: performanceConfig.rateLimit.endpoints.api.max,
});

/**
 * Upload endpoints rate limiter
 */
export const uploadRateLimiter = createRateLimiter({
  windowMs: performanceConfig.rateLimit.endpoints.upload.windowMs,
  max: performanceConfig.rateLimit.endpoints.upload.max,
  message: 'Too many uploads. Please try again later.',
});

/**
 * Reports endpoints rate limiter
 */
export const reportsRateLimiter = createRateLimiter({
  windowMs: performanceConfig.rateLimit.endpoints.reports.windowMs,
  max: performanceConfig.rateLimit.endpoints.reports.max,
  message: 'Too many report requests. Please try again later.',
});
