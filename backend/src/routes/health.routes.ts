import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import fs from 'fs';
import path from 'path';
import os from 'os';

const router = Router();
const prisma = new PrismaClient();

// Redis client (lazy initialization)
let redisClient: ReturnType<typeof createClient> | null = null;

const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
  }
  return redisClient;
};

// Metrics storage
const metrics = {
  requestCount: 0,
  errorCount: 0,
  requestDurations: [] as number[],
  startTime: Date.now(),
};

// =============================================================================
// Basic Health Check
// =============================================================================

router.get('/', async (req: Request, res: Response) => {
  const uptime = Math.floor((Date.now() - metrics.startTime) / 1000);
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// =============================================================================
// Detailed Health Check
// =============================================================================

router.get('/detailed', async (req: Request, res: Response) => {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkStorage(),
  ]);

  const results = {
    database: checks[0].status === 'fulfilled' ? checks[0].value : { status: 'error', message: (checks[0] as PromiseRejectedResult).reason?.message },
    redis: checks[1].status === 'fulfilled' ? checks[1].value : { status: 'error', message: (checks[1] as PromiseRejectedResult).reason?.message },
    storage: checks[2].status === 'fulfilled' ? checks[2].value : { status: 'error', message: (checks[2] as PromiseRejectedResult).reason?.message },
  };

  const allHealthy = Object.values(results).every(r => r.status === 'healthy');
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: results,
    system: getSystemMetrics(),
  });
});

// =============================================================================
// Database Health Check
// =============================================================================

router.get('/db', async (req: Request, res: Response) => {
  try {
    const result = await checkDatabase();
    res.status(result.status === 'healthy' ? 200 : 503).json(result);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

async function checkDatabase() {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    
    // Get connection pool info
    const connectionInfo = await prisma.$queryRaw<any[]>`
      SELECT count(*) as active_connections 
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;
    
    return {
      status: 'healthy' as const,
      latency: `${latency}ms`,
      connections: connectionInfo[0]?.active_connections || 'unknown',
    };
  } catch (error) {
    return {
      status: 'error' as const,
      message: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

// =============================================================================
// Redis Health Check
// =============================================================================

router.get('/redis', async (req: Request, res: Response) => {
  try {
    const result = await checkRedis();
    res.status(result.status === 'healthy' ? 200 : 503).json(result);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

async function checkRedis() {
  const start = Date.now();
  try {
    const client = await getRedisClient();
    await client.ping();
    const latency = Date.now() - start;
    
    const info = await client.info('memory');
    const usedMemory = info.match(/used_memory_human:(\S+)/)?.[1] || 'unknown';
    
    return {
      status: 'healthy' as const,
      latency: `${latency}ms`,
      memory: usedMemory,
    };
  } catch (error) {
    return {
      status: 'error' as const,
      message: error instanceof Error ? error.message : 'Redis connection failed',
    };
  }
}

// =============================================================================
// Storage Health Check
// =============================================================================

router.get('/storage', async (req: Request, res: Response) => {
  try {
    const result = await checkStorage();
    res.status(result.status === 'healthy' ? 200 : 503).json(result);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

async function checkStorage() {
  const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
  
  try {
    // Check if directory exists and is writable
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Test write
    const testFile = path.join(uploadDir, '.health-check');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    
    // Get disk usage (Linux/Mac)
    let diskUsage = 'unknown';
    try {
      const stats = fs.statfsSync(uploadDir);
      const totalBytes = stats.blocks * stats.bsize;
      const freeBytes = stats.bfree * stats.bsize;
      const usedPercent = Math.round((1 - freeBytes / totalBytes) * 100);
      diskUsage = `${usedPercent}% used`;
    } catch {
      // statfsSync not available on all platforms
    }
    
    return {
      status: 'healthy' as const,
      path: uploadDir,
      writable: true,
      diskUsage,
    };
  } catch (error) {
    return {
      status: 'error' as const,
      message: error instanceof Error ? error.message : 'Storage check failed',
    };
  }
}

// =============================================================================
// System Metrics
// =============================================================================

function getSystemMetrics() {
  const cpus = os.cpus();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  
  // Calculate CPU usage
  const cpuUsage = cpus.reduce((acc, cpu) => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
    const idle = cpu.times.idle;
    return acc + ((total - idle) / total) * 100;
  }, 0) / cpus.length;
  
  return {
    cpu: {
      cores: cpus.length,
      usage: `${cpuUsage.toFixed(1)}%`,
      model: cpus[0]?.model || 'unknown',
    },
    memory: {
      total: formatBytes(totalMemory),
      free: formatBytes(freeMemory),
      used: formatBytes(totalMemory - freeMemory),
      usage: `${((1 - freeMemory / totalMemory) * 100).toFixed(1)}%`,
    },
    process: {
      pid: process.pid,
      uptime: `${Math.floor(process.uptime())}s`,
      memory: formatBytes(process.memoryUsage().heapUsed),
    },
    platform: {
      os: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
    },
  };
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(1)}${units[i]}`;
}

// =============================================================================
// Prometheus Metrics
// =============================================================================

router.get('/metrics', async (req: Request, res: Response) => {
  const systemMetrics = getSystemMetrics();
  const dbCheck = await checkDatabase().catch(() => ({ status: 'error', latency: '-1ms' }));
  const redisCheck = await checkRedis().catch(() => ({ status: 'error', latency: '-1ms' }));
  
  const avgDuration = metrics.requestDurations.length > 0
    ? metrics.requestDurations.reduce((a, b) => a + b, 0) / metrics.requestDurations.length
    : 0;
  
  // Prometheus format
  const prometheusMetrics = `
# HELP gold_factory_up Service availability
# TYPE gold_factory_up gauge
gold_factory_up 1

# HELP gold_factory_requests_total Total HTTP requests
# TYPE gold_factory_requests_total counter
gold_factory_requests_total ${metrics.requestCount}

# HELP gold_factory_errors_total Total errors
# TYPE gold_factory_errors_total counter
gold_factory_errors_total ${metrics.errorCount}

# HELP gold_factory_request_duration_avg Average request duration in ms
# TYPE gold_factory_request_duration_avg gauge
gold_factory_request_duration_avg ${avgDuration.toFixed(2)}

# HELP gold_factory_db_up Database availability
# TYPE gold_factory_db_up gauge
gold_factory_db_up ${dbCheck.status === 'healthy' ? 1 : 0}

# HELP gold_factory_db_latency_ms Database latency in milliseconds
# TYPE gold_factory_db_latency_ms gauge
gold_factory_db_latency_ms ${parseInt(dbCheck.latency || '0')}

# HELP gold_factory_redis_up Redis availability
# TYPE gold_factory_redis_up gauge
gold_factory_redis_up ${redisCheck.status === 'healthy' ? 1 : 0}

# HELP gold_factory_memory_usage_bytes Process memory usage
# TYPE gold_factory_memory_usage_bytes gauge
gold_factory_memory_usage_bytes ${process.memoryUsage().heapUsed}

# HELP gold_factory_cpu_usage_percent CPU usage percentage
# TYPE gold_factory_cpu_usage_percent gauge
gold_factory_cpu_usage_percent ${parseFloat(systemMetrics.cpu.usage)}

# HELP node_memory_total_bytes Total system memory
# TYPE node_memory_total_bytes gauge
node_memory_total_bytes ${os.totalmem()}

# HELP node_memory_free_bytes Free system memory
# TYPE node_memory_free_bytes gauge
node_memory_free_bytes ${os.freemem()}
`.trim();

  res.set('Content-Type', 'text/plain');
  res.send(prometheusMetrics);
});

// =============================================================================
// Metrics Collection Middleware
// =============================================================================

export const metricsMiddleware = (req: Request, res: Response, next: Function) => {
  const start = Date.now();
  metrics.requestCount++;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.requestDurations.push(duration);
    
    // Keep only last 1000 durations
    if (metrics.requestDurations.length > 1000) {
      metrics.requestDurations.shift();
    }
    
    if (res.statusCode >= 400) {
      metrics.errorCount++;
    }
  });
  
  next();
};

export default router;
