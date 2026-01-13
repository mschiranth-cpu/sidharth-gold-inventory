/**
 * ============================================
 * PERFORMANCE MONITORING MIDDLEWARE
 * ============================================
 * 
 * Track and log request performance:
 * - Response times
 * - Slow request detection
 * - Request metrics
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { performanceConfig } from '../config/performance.config';
import { logger } from '../utils/logger';

interface RequestMetrics {
  path: string;
  method: string;
  statusCode: number;
  responseTime: number;
  contentLength: number;
  timestamp: Date;
  userId?: string;
  userRole?: string;
  ip: string;
}

// In-memory metrics storage (for basic monitoring)
// In production, use Prometheus/Grafana or similar
const metricsStore: {
  requests: RequestMetrics[];
  histogram: Map<string, number[]>;
} = {
  requests: [],
  histogram: new Map(),
};

// Keep only last 1000 requests in memory
const MAX_STORED_REQUESTS = 1000;

/**
 * Performance monitoring middleware
 */
export function performanceMonitor(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!performanceConfig.monitoring.performance.enabled) {
      return next();
    }

    const startTime = process.hrtime.bigint();
    const startMem = process.memoryUsage();

    // Override res.end to capture timing
    const originalEnd = res.end.bind(res);
    
    res.end = function(chunk?: any, encoding?: any, callback?: any): Response {
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1e6; // Convert to milliseconds

      // Get content length
      const contentLength = parseInt(res.get('content-length') || '0', 10);

      // Build metrics
      const metrics: RequestMetrics = {
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime,
        contentLength,
        timestamp: new Date(),
        userId: (req as any).user?.id,
        userRole: (req as any).user?.role,
        ip: req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0] || 'unknown',
      };

      // Store metrics
      storeMetrics(metrics);

      // Log slow requests
      if (
        performanceConfig.monitoring.performance.logSlowRequests &&
        responseTime > performanceConfig.monitoring.performance.slowThreshold
      ) {
        logger.warn('Slow request detected', {
          ...metrics,
          threshold: performanceConfig.monitoring.performance.slowThreshold,
        });
      }

      // Set timing header
      res.setHeader('X-Response-Time', `${responseTime.toFixed(2)}ms`);
      res.setHeader('Server-Timing', `total;dur=${responseTime.toFixed(2)}`);

      return originalEnd(chunk, encoding, callback);
    } as any;

    next();
  };
}

/**
 * Store metrics
 */
function storeMetrics(metrics: RequestMetrics): void {
  // Add to recent requests
  metricsStore.requests.push(metrics);
  
  // Trim if too many
  if (metricsStore.requests.length > MAX_STORED_REQUESTS) {
    metricsStore.requests = metricsStore.requests.slice(-MAX_STORED_REQUESTS);
  }

  // Update histogram
  const bucket = getBucket(metrics.responseTime);
  const key = `${metrics.method}:${metrics.path}`;
  
  if (!metricsStore.histogram.has(key)) {
    metricsStore.histogram.set(key, new Array(performanceConfig.monitoring.performance.histogramBuckets.length + 1).fill(0));
  }
  
  const histogram = metricsStore.histogram.get(key)!;
  histogram[bucket]++;
}

/**
 * Get histogram bucket for response time
 */
function getBucket(responseTime: number): number {
  const buckets = performanceConfig.monitoring.performance.histogramBuckets;
  const seconds = responseTime / 1000;
  
  for (let i = 0; i < buckets.length; i++) {
    if (seconds <= buckets[i]) {
      return i;
    }
  }
  
  return buckets.length; // Overflow bucket
}

/**
 * Get performance metrics summary
 */
export function getMetricsSummary(): {
  totalRequests: number;
  averageResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
  slowRequests: number;
  requestsByStatus: Record<string, number>;
  requestsByMethod: Record<string, number>;
  topEndpoints: Array<{ path: string; count: number; avgTime: number }>;
} {
  const requests = metricsStore.requests;
  
  if (requests.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      slowRequests: 0,
      requestsByStatus: {},
      requestsByMethod: {},
      topEndpoints: [],
    };
  }

  // Sort response times
  const responseTimes = requests.map((r) => r.responseTime).sort((a, b) => a - b);
  
  // Calculate percentiles
  const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)];
  const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
  const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];

  // Count by status
  const requestsByStatus: Record<string, number> = {};
  const requestsByMethod: Record<string, number> = {};
  const endpointStats: Record<string, { count: number; totalTime: number }> = {};

  let slowRequests = 0;
  let totalTime = 0;

  for (const req of requests) {
    totalTime += req.responseTime;
    
    if (req.responseTime > performanceConfig.monitoring.performance.slowThreshold) {
      slowRequests++;
    }

    // By status
    const statusGroup = `${Math.floor(req.statusCode / 100)}xx`;
    requestsByStatus[statusGroup] = (requestsByStatus[statusGroup] || 0) + 1;

    // By method
    requestsByMethod[req.method] = (requestsByMethod[req.method] || 0) + 1;

    // By endpoint
    const key = `${req.method} ${req.path}`;
    if (!endpointStats[key]) {
      endpointStats[key] = { count: 0, totalTime: 0 };
    }
    endpointStats[key].count++;
    endpointStats[key].totalTime += req.responseTime;
  }

  // Top endpoints
  const topEndpoints = Object.entries(endpointStats)
    .map(([path, stats]) => ({
      path,
      count: stats.count,
      avgTime: stats.totalTime / stats.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalRequests: requests.length,
    averageResponseTime: totalTime / requests.length,
    p50,
    p95,
    p99,
    slowRequests,
    requestsByStatus,
    requestsByMethod,
    topEndpoints,
  };
}

/**
 * Clear metrics (for testing)
 */
export function clearMetrics(): void {
  metricsStore.requests = [];
  metricsStore.histogram.clear();
}
