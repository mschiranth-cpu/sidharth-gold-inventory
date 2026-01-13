/**
 * ============================================
 * PERFORMANCE CONFIGURATION
 * ============================================
 * 
 * Central configuration for all production optimizations:
 * - Database connection pooling
 * - Redis caching settings
 * - Rate limiting
 * - Compression
 * - Image optimization
 * - Monitoring
 */

import dotenv from 'dotenv';
dotenv.config();

export const performanceConfig = {
  // ============================================
  // DATABASE OPTIMIZATION
  // ============================================
  database: {
    // Connection pool settings
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      acquireTimeout: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '30000', 10),
      idleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '10000', 10),
    },
    // Query settings
    queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000', 10),
    // Statement cache
    statementCacheSize: parseInt(process.env.DB_STATEMENT_CACHE || '100', 10),
  },

  // ============================================
  // REDIS CACHING
  // ============================================
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'gold_inv:',
    
    // Cache TTL settings (in seconds)
    ttl: {
      default: 300, // 5 minutes
      session: 86400, // 24 hours
      token: 900, // 15 minutes (match JWT expiry)
      refreshToken: 604800, // 7 days
      dashboard: 300, // 5 minutes
      ordersList: 60, // 1 minute
      orderDetail: 120, // 2 minutes
      userList: 300, // 5 minutes
      reports: 600, // 10 minutes
      departments: 300, // 5 minutes
    },
    
    // Cache keys patterns
    keys: {
      session: (userId: string) => `session:${userId}`,
      token: (token: string) => `token:${token}`,
      refreshToken: (token: string) => `refresh:${token}`,
      dashboard: (userId: string, role: string) => `dashboard:${role}:${userId}`,
      ordersList: (query: string) => `orders:list:${query}`,
      orderDetail: (orderId: string) => `orders:detail:${orderId}`,
      userDetail: (userId: string) => `users:detail:${userId}`,
      departments: () => `departments:all`,
      reports: (reportType: string, params: string) => `reports:${reportType}:${params}`,
    },
  },

  // ============================================
  // RATE LIMITING
  // ============================================
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    
    // Global rate limit
    global: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10), // requests per window
    },
    
    // Per-endpoint rate limits
    endpoints: {
      auth: {
        windowMs: 900000, // 15 minutes
        max: 10, // 10 login attempts per 15 minutes
      },
      api: {
        windowMs: 60000, // 1 minute
        max: 100, // 100 requests per minute
      },
      upload: {
        windowMs: 60000, // 1 minute
        max: 10, // 10 uploads per minute
      },
      reports: {
        windowMs: 60000, // 1 minute
        max: 20, // 20 report requests per minute
      },
    },
    
    // Skip rate limiting for certain conditions
    skipList: {
      ips: (process.env.RATE_LIMIT_SKIP_IPS || '').split(',').filter(Boolean),
      paths: ['/health', '/api/health'],
    },
  },

  // ============================================
  // COMPRESSION
  // ============================================
  compression: {
    enabled: process.env.COMPRESSION_ENABLED !== 'false',
    level: parseInt(process.env.COMPRESSION_LEVEL || '6', 10), // 1-9
    threshold: parseInt(process.env.COMPRESSION_THRESHOLD || '1024', 10), // bytes
    memLevel: parseInt(process.env.COMPRESSION_MEM_LEVEL || '8', 10), // 1-9
    filter: (req: any, res: any) => {
      // Don't compress responses with this header
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Use compression filter
      return true;
    },
  },

  // ============================================
  // IMAGE OPTIMIZATION
  // ============================================
  images: {
    maxFileSize: parseInt(process.env.IMAGE_MAX_SIZE || '10485760', 10), // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    
    // Resize settings
    resize: {
      enabled: true,
      maxWidth: parseInt(process.env.IMAGE_MAX_WIDTH || '1920', 10),
      maxHeight: parseInt(process.env.IMAGE_MAX_HEIGHT || '1080', 10),
      thumbnail: {
        width: 200,
        height: 200,
      },
      medium: {
        width: 800,
        height: 600,
      },
    },
    
    // Compression settings
    compression: {
      quality: parseInt(process.env.IMAGE_QUALITY || '80', 10), // 1-100
      convertToWebP: process.env.IMAGE_CONVERT_WEBP !== 'false',
    },
    
    // Storage
    storage: {
      type: process.env.IMAGE_STORAGE || 'local', // 'local' | 's3' | 'cloudinary'
      localPath: process.env.IMAGE_LOCAL_PATH || './uploads',
      cdnUrl: process.env.CDN_URL || '',
    },
  },

  // ============================================
  // PAGINATION
  // ============================================
  pagination: {
    defaultLimit: parseInt(process.env.PAGINATION_DEFAULT_LIMIT || '20', 10),
    maxLimit: parseInt(process.env.PAGINATION_MAX_LIMIT || '100', 10),
    useCursor: process.env.PAGINATION_USE_CURSOR !== 'false', // Use cursor-based pagination
  },

  // ============================================
  // ETAG / CONDITIONAL REQUESTS
  // ============================================
  etag: {
    enabled: process.env.ETAG_ENABLED !== 'false',
    weak: true, // Use weak ETags
  },

  // ============================================
  // MONITORING
  // ============================================
  monitoring: {
    // Morgan logging
    morgan: {
      format: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
      skip: (req: any, res: any) => {
        // Skip health check logging in production
        if (process.env.NODE_ENV === 'production' && req.path === '/health') {
          return true;
        }
        return false;
      },
    },
    
    // Performance tracking
    performance: {
      enabled: process.env.PERF_MONITORING_ENABLED !== 'false',
      slowThreshold: parseInt(process.env.PERF_SLOW_THRESHOLD || '1000', 10), // ms
      logSlowRequests: true,
      histogramBuckets: [0.1, 0.5, 1, 2, 5, 10], // seconds
    },
    
    // Sentry error tracking
    sentry: {
      enabled: process.env.SENTRY_ENABLED === 'true',
      dsn: process.env.SENTRY_DSN || '',
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
    },
    
    // Health check
    healthCheck: {
      path: '/health',
      detailed: process.env.HEALTH_CHECK_DETAILED === 'true',
      includeDbCheck: true,
      includeRedisCheck: true,
    },
  },

  // ============================================
  // SECURITY HEADERS
  // ============================================
  security: {
    helmet: {
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' as const },
    },
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
      credentials: true,
      maxAge: 86400, // 24 hours
    },
  },
};

// Export type for TypeScript
export type PerformanceConfig = typeof performanceConfig;

// Freeze config to prevent modifications
Object.freeze(performanceConfig);
Object.freeze(performanceConfig.database);
Object.freeze(performanceConfig.redis);
Object.freeze(performanceConfig.rateLimit);
Object.freeze(performanceConfig.compression);
Object.freeze(performanceConfig.images);
Object.freeze(performanceConfig.pagination);
Object.freeze(performanceConfig.monitoring);
