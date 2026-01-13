/**
 * ============================================
 * HEALTH CHECK ENDPOINT
 * ============================================
 *
 * Comprehensive health check for:
 * - Application status
 * - Database connectivity
 * - Redis connectivity
 * - Memory usage
 * - System info
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { cacheService } from '../../utils/cache';
import { getMetricsSummary } from '../../middleware/performanceMonitor';
import { performanceConfig } from '../../config/performance.config';
import { config } from '../../config';

const router = Router();
const prisma = new PrismaClient();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  checks: {
    database: HealthCheck;
    redis?: HealthCheck;
    memory: HealthCheck;
  };
  metrics?: {
    requestsPerMinute?: number;
    averageResponseTime?: number;
    errorRate?: number;
  };
  system?: {
    nodeVersion: string;
    platform: string;
    cpuUsage?: number;
    memoryUsage: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
  };
}

interface HealthCheck {
  status: 'up' | 'down';
  latency?: number;
  message?: string;
  details?: any;
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: 'up',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedis(): Promise<HealthCheck> {
  if (!performanceConfig.redis.enabled) {
    return {
      status: 'up',
      message: 'Redis disabled',
    };
  }

  const start = Date.now();

  try {
    const info = await cacheService.getInfo();

    return {
      status: info.connected ? 'up' : 'down',
      latency: Date.now() - start,
      message: info.connected ? undefined : 'Redis not connected',
    };
  } catch (error) {
    return {
      status: 'down',
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : 'Redis connection failed',
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): HealthCheck {
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  // Warning if heap usage > 85%
  const isHealthy = heapUsedPercent < 85;

  return {
    status: isHealthy ? 'up' : 'down',
    message: isHealthy ? undefined : `High memory usage: ${heapUsedPercent.toFixed(1)}%`,
    details: {
      heapUsedPercent: heapUsedPercent.toFixed(1),
      heapUsedMB: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
      heapTotalMB: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
    },
  };
}

/**
 * Basic health check - always fast
 */
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

/**
 * Detailed health check with all service checks
 */
router.get('/detailed', async (req: Request, res: Response) => {
  const [dbCheck, redisCheck] = await Promise.all([checkDatabase(), checkRedis()]);

  const memoryCheck = checkMemory();

  // Determine overall status
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  if (dbCheck.status === 'down') {
    overallStatus = 'unhealthy';
  } else if (redisCheck.status === 'down' || memoryCheck.status === 'down') {
    overallStatus = 'degraded';
  }

  // Get memory usage
  const memUsage = process.memoryUsage();

  // Build response
  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: dbCheck,
      redis: performanceConfig.redis.enabled ? redisCheck : undefined,
      memory: memoryCheck,
    },
  };

  // Add detailed info if requested
  if (performanceConfig.monitoring.healthCheck.detailed || req.query.detailed === 'true') {
    const metrics = getMetricsSummary();

    healthStatus.metrics = {
      requestsPerMinute: metrics.totalRequests,
      averageResponseTime: metrics.averageResponseTime,
      errorRate: (metrics.requestsByStatus['5xx'] || 0) / Math.max(metrics.totalRequests, 1),
    };

    healthStatus.system = {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
      },
    };
  }

  // Set appropriate status code
  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

  res.status(statusCode).json(healthStatus);
});

/**
 * Liveness probe - just checks if app is running
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

/**
 * Readiness probe - checks if app is ready to receive traffic
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not ready', message: 'Database not available' });
  }
});

/**
 * Metrics endpoint for monitoring systems
 */
router.get('/metrics', (req: Request, res: Response) => {
  const metrics = getMetricsSummary();
  const memUsage = process.memoryUsage();

  // Prometheus-style metrics format
  const prometheusMetrics = `
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total ${metrics.totalRequests}

# HELP http_request_duration_seconds HTTP request latency
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_avg ${(metrics.averageResponseTime / 1000).toFixed(4)}
http_request_duration_seconds_p50 ${(metrics.p50 / 1000).toFixed(4)}
http_request_duration_seconds_p95 ${(metrics.p95 / 1000).toFixed(4)}
http_request_duration_seconds_p99 ${(metrics.p99 / 1000).toFixed(4)}

# HELP slow_requests_total Slow requests count
# TYPE slow_requests_total counter
slow_requests_total ${metrics.slowRequests}

# HELP nodejs_heap_used_bytes Node.js heap used
# TYPE nodejs_heap_used_bytes gauge
nodejs_heap_used_bytes ${memUsage.heapUsed}

# HELP nodejs_heap_total_bytes Node.js heap total
# TYPE nodejs_heap_total_bytes gauge
nodejs_heap_total_bytes ${memUsage.heapTotal}

# HELP nodejs_external_memory_bytes Node.js external memory
# TYPE nodejs_external_memory_bytes gauge
nodejs_external_memory_bytes ${memUsage.external}

# HELP process_uptime_seconds Process uptime
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${process.uptime().toFixed(0)}
`.trim();

  res.set('Content-Type', 'text/plain');
  res.send(prometheusMetrics);
});

export { router as healthRoutes };
