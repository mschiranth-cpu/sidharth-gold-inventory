/**
 * ============================================
 * CACHE MIDDLEWARE
 * ============================================
 * 
 * Express middleware for caching GET responses:
 * - Automatic cache retrieval
 * - Response caching
 * - Cache invalidation on mutations
 * - ETag support
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import crypto from 'crypto';
import { cacheService } from '../utils/cache';
import { performanceConfig } from '../config/performance.config';
import { logger } from '../utils/logger';

interface CacheOptions {
  ttl?: number;
  keyPrefix?: string;
  generateKey?: (req: Request) => string;
  condition?: (req: Request) => boolean;
}

/**
 * Generate hash for cache key
 */
function generateHash(data: string): string {
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Generate default cache key from request
 */
function defaultKeyGenerator(req: Request): string {
  const userId = (req as any).user?.id || 'anonymous';
  const role = (req as any).user?.role || 'guest';
  const query = JSON.stringify(req.query);
  const path = req.originalUrl.split('?')[0];
  
  return generateHash(`${path}:${userId}:${role}:${query}`);
}

/**
 * Cache middleware for GET requests
 */
export function cacheMiddleware(options: CacheOptions = {}): RequestHandler {
  const {
    ttl = performanceConfig.redis.ttl.default,
    keyPrefix = 'api:',
    generateKey = defaultKeyGenerator,
    condition = () => true,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check condition
    if (!condition(req)) {
      return next();
    }

    // Check if caching is enabled
    if (!cacheService.isAvailable()) {
      return next();
    }

    const cacheKey = `${keyPrefix}${generateKey(req)}`;

    try {
      // Try to get from cache
      const cached = await cacheService.get<{
        data: any;
        headers: Record<string, string>;
        etag: string;
      }>(cacheKey);

      if (cached) {
        // Check ETag for conditional request
        const clientEtag = req.headers['if-none-match'];
        
        if (clientEtag && clientEtag === cached.etag) {
          res.status(304).end();
          return;
        }

        // Return cached response
        res.set('X-Cache', 'HIT');
        res.set('ETag', cached.etag);
        
        Object.entries(cached.headers).forEach(([key, value]) => {
          res.set(key, value);
        });
        
        res.json(cached.data);
        return;
      }

      // Cache miss - intercept response
      res.set('X-Cache', 'MISS');
      
      const originalJson = res.json.bind(res);
      
      res.json = function (data: any) {
        // Generate ETag
        const etag = `W/"${generateHash(JSON.stringify(data))}"`;
        res.set('ETag', etag);

        // Cache the response
        const cacheData = {
          data,
          headers: {
            'Content-Type': 'application/json',
          },
          etag,
        };

        cacheService.set(cacheKey, cacheData, ttl).catch((err) => {
          logger.error('Failed to cache response:', err);
        });

        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Cache invalidation middleware for mutations
 */
export function invalidateCacheMiddleware(patterns: string[]): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Intercept response to invalidate cache on success
    const originalJson = res.json.bind(res);

    res.json = function (data: any) {
      // Only invalidate on successful mutations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        Promise.all(
          patterns.map((pattern) => cacheService.deletePattern(pattern))
        ).catch((err) => {
          logger.error('Failed to invalidate cache:', err);
        });
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Dashboard cache middleware
 */
export const dashboardCacheMiddleware = cacheMiddleware({
  ttl: performanceConfig.redis.ttl.dashboard,
  keyPrefix: 'dashboard:',
  generateKey: (req) => {
    const user = (req as any).user;
    return `${user?.role || 'guest'}:${user?.id || 'anonymous'}`;
  },
});

/**
 * Orders list cache middleware
 */
export const ordersListCacheMiddleware = cacheMiddleware({
  ttl: performanceConfig.redis.ttl.ordersList,
  keyPrefix: 'orders:list:',
});

/**
 * Order detail cache middleware
 */
export const orderDetailCacheMiddleware = cacheMiddleware({
  ttl: performanceConfig.redis.ttl.orderDetail,
  keyPrefix: 'orders:detail:',
  generateKey: (req) => req.params.id || req.params.orderId || 'unknown',
});

/**
 * Reports cache middleware
 */
export const reportsCacheMiddleware = cacheMiddleware({
  ttl: performanceConfig.redis.ttl.reports,
  keyPrefix: 'reports:',
});

/**
 * Invalidate orders cache
 */
export const invalidateOrdersCache = invalidateCacheMiddleware([
  'orders:*',
  'dashboard:*',
]);

/**
 * Invalidate users cache
 */
export const invalidateUsersCache = invalidateCacheMiddleware([
  'users:*',
  'dashboard:*',
]);
