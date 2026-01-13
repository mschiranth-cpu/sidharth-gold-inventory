/**
 * ============================================
 * REDIS CACHE SERVICE
 * ============================================
 *
 * Redis client configuration and cache utilities:
 * - Connection management
 * - Cache get/set/delete operations
 * - Cache invalidation patterns
 */

import { createClient, RedisClientType } from 'redis';
import { performanceConfig } from '../config/performance.config';
import { logger } from './logger';

type RedisClient = RedisClientType;

class CacheService {
  private client: RedisClient | null = null;
  private isConnected = false;

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    if (!performanceConfig.redis.enabled) {
      logger.info('Redis caching is disabled');
      return;
    }

    try {
      this.client = createClient({
        socket: {
          host: performanceConfig.redis.host,
          port: performanceConfig.redis.port,
        },
        password: performanceConfig.redis.password,
        database: performanceConfig.redis.db,
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting...');
      });

      await this.client.connect();
      this.isConnected = true;
      logger.info(
        `✅ Redis connected to ${performanceConfig.redis.host}:${performanceConfig.redis.port}`
      );
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      this.isConnected = false;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis disconnected');
    }
  }

  /**
   * Get prefixed key
   */
  private getKey(key: string): string {
    return `${performanceConfig.redis.keyPrefix}${key}`;
  }

  /**
   * Check if cache is available
   */
  isAvailable(): boolean {
    return performanceConfig.redis.enabled && this.isConnected && this.client !== null;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) return null;

    try {
      const value = await this.client!.get(this.getKey(key));
      if (value && typeof value === 'string') {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      logger.error(`Cache GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const serialized = JSON.stringify(value);
      const ttl = ttlSeconds || performanceConfig.redis.ttl.default;

      await this.client!.setEx(this.getKey(key), ttl, serialized);
      return true;
    } catch (error) {
      logger.error(`Cache SET error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      await this.client!.del(this.getKey(key));
      return true;
    } catch (error) {
      logger.error(`Cache DELETE error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.isAvailable()) return 0;

    try {
      const keys = await this.client!.keys(this.getKey(pattern));
      if (keys.length > 0) {
        await this.client!.del(keys);
      }
      return keys.length;
    } catch (error) {
      logger.error(`Cache DELETE PATTERN error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const result = await this.client!.exists(this.getKey(key));
      return result === 1;
    } catch (error) {
      logger.error(`Cache EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set key expiration
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      await this.client!.expire(this.getKey(key), ttlSeconds);
      return true;
    } catch (error) {
      logger.error(`Cache EXPIRE error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    if (!this.isAvailable()) return -1;

    try {
      return await this.client!.ttl(this.getKey(key));
    } catch (error) {
      logger.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Increment a value
   */
  async incr(key: string): Promise<number> {
    if (!this.isAvailable()) return 0;

    try {
      return await this.client!.incr(this.getKey(key));
    } catch (error) {
      logger.error(`Cache INCR error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get multiple values
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.isAvailable()) return keys.map(() => null);

    try {
      const prefixedKeys = keys.map((k) => this.getKey(k));
      const values = await this.client!.mGet(prefixedKeys);
      return values.map((v) => (v && typeof v === 'string' ? JSON.parse(v) : null));
    } catch (error) {
      logger.error('Cache MGET error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple values
   */
  async mset(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const pipeline = this.client!.multi();

      for (const { key, value, ttl } of entries) {
        const serialized = JSON.stringify(value);
        const expiry = ttl || performanceConfig.redis.ttl.default;
        pipeline.setEx(this.getKey(key), expiry, serialized);
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Cache MSET error:', error);
      return false;
    }
  }

  /**
   * Cache aside pattern - get or set
   */
  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch from source
    const value = await fetchFn();

    // Store in cache
    await this.set(key, value, ttlSeconds);

    return value;
  }

  // ============================================
  // SPECIFIC CACHE OPERATIONS
  // ============================================

  /**
   * Cache session data
   */
  async cacheSession(userId: string, sessionData: any): Promise<boolean> {
    const key = performanceConfig.redis.keys.session(userId);
    return this.set(key, sessionData, performanceConfig.redis.ttl.session);
  }

  /**
   * Get session data
   */
  async getSession<T>(userId: string): Promise<T | null> {
    const key = performanceConfig.redis.keys.session(userId);
    return this.get<T>(key);
  }

  /**
   * Invalidate session
   */
  async invalidateSession(userId: string): Promise<boolean> {
    const key = performanceConfig.redis.keys.session(userId);
    return this.delete(key);
  }

  /**
   * Cache access token (for blacklisting)
   */
  async cacheToken(token: string, data: any): Promise<boolean> {
    const key = performanceConfig.redis.keys.token(token);
    return this.set(key, data, performanceConfig.redis.ttl.token);
  }

  /**
   * Blacklist token
   */
  async blacklistToken(token: string, expiresIn: number): Promise<boolean> {
    const key = `blacklist:${token}`;
    return this.set(key, { blacklisted: true }, expiresIn);
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;
    return this.exists(key);
  }

  /**
   * Cache dashboard metrics
   */
  async cacheDashboard(userId: string, role: string, metrics: any): Promise<boolean> {
    const key = performanceConfig.redis.keys.dashboard(userId, role);
    return this.set(key, metrics, performanceConfig.redis.ttl.dashboard);
  }

  /**
   * Get dashboard metrics
   */
  async getDashboard<T>(userId: string, role: string): Promise<T | null> {
    const key = performanceConfig.redis.keys.dashboard(userId, role);
    return this.get<T>(key);
  }

  /**
   * Invalidate dashboard cache
   */
  async invalidateDashboard(): Promise<number> {
    return this.deletePattern('dashboard:*');
  }

  /**
   * Cache orders list
   */
  async cacheOrdersList(queryHash: string, orders: any): Promise<boolean> {
    const key = performanceConfig.redis.keys.ordersList(queryHash);
    return this.set(key, orders, performanceConfig.redis.ttl.ordersList);
  }

  /**
   * Get orders list
   */
  async getOrdersList<T>(queryHash: string): Promise<T | null> {
    const key = performanceConfig.redis.keys.ordersList(queryHash);
    return this.get<T>(key);
  }

  /**
   * Invalidate orders cache
   */
  async invalidateOrders(): Promise<number> {
    const listDeleted = await this.deletePattern('orders:list:*');
    const detailDeleted = await this.deletePattern('orders:detail:*');
    return listDeleted + detailDeleted;
  }

  /**
   * Cache order detail
   */
  async cacheOrderDetail(orderId: string, order: any): Promise<boolean> {
    const key = performanceConfig.redis.keys.orderDetail(orderId);
    return this.set(key, order, performanceConfig.redis.ttl.orderDetail);
  }

  /**
   * Get order detail
   */
  async getOrderDetail<T>(orderId: string): Promise<T | null> {
    const key = performanceConfig.redis.keys.orderDetail(orderId);
    return this.get<T>(key);
  }

  /**
   * Invalidate order detail
   */
  async invalidateOrderDetail(orderId: string): Promise<boolean> {
    const key = performanceConfig.redis.keys.orderDetail(orderId);
    return this.delete(key);
  }

  /**
   * Get Redis info for health check
   */
  async getInfo(): Promise<{ connected: boolean; info?: string }> {
    if (!this.isAvailable()) {
      return { connected: false };
    }

    try {
      const info = await this.client!.info('server');
      return { connected: true, info };
    } catch (error) {
      return { connected: false };
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
