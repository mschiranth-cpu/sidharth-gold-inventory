import express, { Express, Request, Response } from 'express';
import { createServer } from 'http';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

import { config } from './config';
import { errorHandler, secureErrorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Production optimization imports
import { performanceConfig } from './config/performance.config';
import { cacheService } from './utils/cache';
import { compressionMiddleware } from './middleware/compression';
import { globalRateLimiter } from './middleware/rateLimiter';
import { performanceMonitor, getMetricsSummary } from './middleware/performanceMonitor';
import { initSentry, sentryUserMiddleware } from './utils/sentry';

// Security imports
import { securityConfig, validateSecurityConfig } from './config/security.config';
import {
  helmetMiddleware,
  corsMiddleware,
  csrfTokenMiddleware,
  sanitizationMiddleware,
  requestTimeoutMiddleware,
  apiKeyMiddleware,
} from './middleware/security';
import { auditMiddleware } from './utils/auditLog';

// API Documentation
import { setupSwagger } from './config/swagger.config';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import { userRoutes } from './modules/users/user.routes';
import ordersRoutes from './modules/orders/orders.routes';
import factoryRoutes from './modules/factory/factory.routes';
import departmentsRoutes from './modules/departments/departments.routes';
import submissionsRoutes, { orderSubmissionRouter } from './modules/submissions/submissions.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import { reportRoutes } from './modules/reports';
import { healthRoutes } from './modules/health/health.routes';
import assignmentRoutes from './modules/assignments/assignment.routes';
import activityRoutes from './modules/activity/activity.routes';
import workersRoutes from './modules/workers/workers.routes';
import { featuresRoutes } from './modules/features';
import { clientsRoutes } from './modules/clients';
import { metalRoutes } from './modules/metal-inventory';
import { partyRoutes } from './modules/party-metal';
import { diamondRoutes } from './modules/diamond-inventory';
import { stoneRoutes } from './modules/stone-inventory';
import { factoryInventoryRoutes } from './modules/factory-inventory';
import { attendanceRoutes } from './modules/attendance';
import { payrollRoutes } from './modules/payroll';
import marketRatesRoutes from './routes/market-rates.routes';
import vendorRoutes from './routes/vendors.routes';

// Import Socket.io setup
import { initializeSocketServer } from './modules/socket/socket.setup';

// Load environment variables
dotenv.config();

const app: Express = express();
const httpServer = createServer(app);

// Initialize Sentry for error tracking (production only)
if (performanceConfig.monitoring.sentry.enabled) {
  initSentry();
  logger.info('📊 Sentry error tracking initialized');
}

// Validate security configuration
const securityErrors = validateSecurityConfig();
if (securityErrors.length > 0) {
  securityErrors.forEach((err) => logger.warn(`⚠️ Security config: ${err}`));
  if (config.nodeEnv === 'production') {
    logger.error('❌ Security configuration errors in production!');
    process.exit(1);
  }
}

// Initialize Socket.io
const io = initializeSocketServer(httpServer);

// Connect to Redis cache (non-blocking)
(async () => {
  try {
    await cacheService.connect();
    logger.info('🔴 Redis cache connected');
  } catch (error) {
    logger.warn('⚠️ Redis cache unavailable - running without cache', { error });
  }
})();

// ============================================
// MIDDLEWARE STACK (Order matters!)
// ============================================

// 1. Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// 2. Request timeout
app.use(requestTimeoutMiddleware);

// 3. Security headers (Helmet with enhanced config)
app.use(helmetMiddleware);

// 4. CORS with whitelist
app.use(corsMiddleware);

// 5. Compression (before other body parsing)
app.use(compressionMiddleware());

// 6. Performance monitoring (tracks response times)
app.use(performanceMonitor());

// 7. Request logging with Morgan
const morganFormat =
  config.nodeEnv === 'production' ? performanceConfig.monitoring.morgan.format : 'dev';
app.use(
  morgan(morganFormat, {
    skip: performanceConfig.monitoring.morgan.skip,
  })
);

// 8. Body parsing with size limits
app.use(express.json({ limit: securityConfig.request.bodyLimit.json }));
app.use(express.urlencoded({ extended: true, limit: securityConfig.request.bodyLimit.urlencoded }));

// 9. Cookie parsing
app.use(cookieParser());

// 10. Input sanitization (XSS, SQL injection prevention)
app.use(sanitizationMiddleware);

// 11. API key validation (for external integrations)
app.use(apiKeyMiddleware);

// 12. CSRF token generation
app.use(csrfTokenMiddleware);

// 13. Audit logging for data modifications
app.use(auditMiddleware);

// 14. Sentry user context (after auth, before routes)
if (performanceConfig.monitoring.sentry.enabled) {
  app.use(sentryUserMiddleware);
}

// 10. Global rate limiting
app.use(globalRateLimiter);

// ============================================
// ROUTES
// ============================================

// Health check routes (no auth required)
app.use('/health', healthRoutes);

// API Documentation (Swagger UI)
setupSwagger(app);
logger.info('📚 API Documentation available at /api-docs');

// API Routes
app.use('/api/auth', authRoutes); // Authentication routes
app.use('/api/users', userRoutes); // User management routes
app.use('/api/orders', ordersRoutes);
app.use('/api/orders/:orderId/departments', departmentsRoutes); // Department tracking (nested under orders)
app.use('/api/orders/:orderId', orderSubmissionRouter); // Submission routes (POST /submit, GET /submission)
app.use('/api/submissions', submissionsRoutes); // Submissions list and management
app.use('/api/notifications', notificationsRoutes); // Notification management (NEW SYSTEM)
app.use('/api/reports', reportRoutes); // Reports and analytics
app.use('/api/factory', factoryRoutes); // Factory statistics and gold tracking
app.use('/api/assignments', assignmentRoutes); // Order assignment and queue management
app.use('/api/activities', activityRoutes); // Activity log and tracking
app.use('/api/workers', workersRoutes); // Worker-specific operations
app.use('/api/features', featuresRoutes); // Feature toggle system (Phase 1)
app.use('/api/clients', clientsRoutes); // Client portal (Phase 1)
app.use('/api/metal', metalRoutes); // Metal inventory (Phase 2)
app.use('/api/parties', partyRoutes); // Party metal inventory (Phase 2)
app.use('/api/diamonds', diamondRoutes); // Diamond inventory (Phase 3)
app.use('/api/stones', stoneRoutes); // Real stone & stone inventory (Phase 3)
app.use('/api/factory-inventory', factoryInventoryRoutes); // Factory inventory (Phase 4)
app.use('/api/attendance', attendanceRoutes); // Attendance system (Phase 5)
app.use('/api/payroll', payrollRoutes); // Payroll system (Phase 5)
app.use('/api/market-rates', marketRatesRoutes); // Live Bangalore bullion rates (scraped from Ambicaa)
app.use('/api/vendors', vendorRoutes); // Vendor master + GST realtime lookup

// ============================================
// FRONTEND (Production SPA)
// ============================================
if (config.nodeEnv === 'production') {
  const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');

  // Self-destructing service worker — must bypass CDN cache
  app.get('/sw.js', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(frontendDistPath, 'sw.js'));
  });

  app.use(
    express.static(frontendDistPath, {
      etag: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      },
    })
  );

  // SPA fallback — only for navigation requests (not static assets or API)
  app.get('*', (req: Request, res: Response, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/socket.io') ||
      req.path.startsWith('/health') ||
      req.path.startsWith('/api-docs') ||
      req.path.match(/\.\w+$/)
    ) {
      next();
      return;
    }
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
      statusCode: 404,
    },
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware (use secure handler in production)
app.use(config.nodeEnv === 'production' ? secureErrorHandler : errorHandler);

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  httpServer.close(async () => {
    logger.info('HTTP server closed');

    // Disconnect Redis
    try {
      await cacheService.disconnect();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection', { error });
    }

    // Log final metrics
    const metrics = getMetricsSummary();
    logger.info('Final performance metrics', metrics);

    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// START SERVER
// ============================================

const PORT = config.port;

// Only start the server if not in test environment
if (config.nodeEnv !== 'test') {
  httpServer.listen(PORT, () => {
    logger.info(`🚀 Server is running on port ${PORT}`);
    logger.info(`📍 Environment: ${config.nodeEnv}`);
    logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
    logger.info(`🔌 WebSocket server ready`);
    logger.info(`⚡ Performance optimizations enabled:`);
    logger.info(
      `   - Compression: ${performanceConfig.compression.enabled ? 'enabled' : 'disabled'}`
    );
    logger.info(
      `   - Rate limiting: ${performanceConfig.rateLimit.enabled ? 'enabled' : 'disabled'}`
    );
    logger.info(`   - Redis caching: ${performanceConfig.redis.enabled ? 'enabled' : 'disabled'}`);
    logger.info(
      `   - Sentry: ${performanceConfig.monitoring.sentry.enabled ? 'enabled' : 'disabled'}`
    );
  });
}

export { app, io };
