/**
 * ============================================
 * SENTRY ERROR TRACKING INTEGRATION
 * ============================================
 * 
 * Error tracking and performance monitoring:
 * - Automatic error capture
 * - Request tracing
 * - Performance monitoring
 */

import { Express, Request, Response, NextFunction } from 'express';
import { performanceConfig } from '../config/performance.config';
import { logger } from './logger';

// Sentry types (install @sentry/node in production)
interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  profilesSampleRate: number;
}

// Mock Sentry for development (replace with actual @sentry/node in production)
const Sentry = {
  initialized: false,
  
  init(config: SentryConfig) {
    if (config.dsn) {
      this.initialized = true;
      logger.info('Sentry initialized', { 
        environment: config.environment,
        tracesSampleRate: config.tracesSampleRate,
      });
    }
  },
  
  captureException(error: Error, context?: any) {
    if (this.initialized) {
      logger.error('Sentry captured exception:', { 
        error: error.message, 
        stack: error.stack,
        context,
      });
    }
  },
  
  captureMessage(message: string, level?: string) {
    if (this.initialized) {
      logger.info('Sentry captured message:', { message, level });
    }
  },
  
  setUser(user: { id: string; email?: string; role?: string }) {
    // Set user context
  },
  
  setTag(key: string, value: string) {
    // Set tag
  },
  
  setContext(name: string, context: any) {
    // Set extra context
  },
  
  startTransaction(context: { name: string; op: string }) {
    return {
      finish: () => {},
      setTag: (key: string, value: string) => {},
      setData: (key: string, value: any) => {},
    };
  },
  
  Handlers: {
    requestHandler() {
      return (req: Request, res: Response, next: NextFunction) => next();
    },
    tracingHandler() {
      return (req: Request, res: Response, next: NextFunction) => next();
    },
    errorHandler() {
      return (err: Error, req: Request, res: Response, next: NextFunction) => next(err);
    },
  },
};

/**
 * Initialize Sentry
 */
export function initSentry(): void {
  const { sentry } = performanceConfig.monitoring;
  
  if (!sentry.enabled || !sentry.dsn) {
    logger.info('Sentry is disabled or no DSN provided');
    return;
  }

  try {
    Sentry.init({
      dsn: sentry.dsn,
      environment: sentry.environment,
      tracesSampleRate: sentry.tracesSampleRate,
      profilesSampleRate: sentry.profilesSampleRate,
    });
    
    logger.info('✅ Sentry initialized');
  } catch (error) {
    logger.error('Failed to initialize Sentry:', error);
  }
}

/**
 * Add Sentry request handler middleware
 */
export function sentryRequestHandler() {
  return Sentry.Handlers.requestHandler();
}

/**
 * Add Sentry tracing middleware
 */
export function sentryTracingHandler() {
  return Sentry.Handlers.tracingHandler();
}

/**
 * Add Sentry error handler middleware
 */
export function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler();
}

/**
 * Capture exception in Sentry
 */
export function captureException(error: Error, context?: any): void {
  Sentry.captureException(error, context);
}

/**
 * Capture message in Sentry
 */
export function captureMessage(message: string, level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'): void {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for Sentry
 */
export function setUser(user: { id: string; email?: string; role?: string } | null): void {
  if (user) {
    Sentry.setUser(user);
  }
}

/**
 * Set tag for Sentry
 */
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

/**
 * Set extra context for Sentry
 */
export function setContext(name: string, context: Record<string, any>): void {
  Sentry.setContext(name, context);
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({ name, op });
}

/**
 * Express middleware to set user context from request
 */
export function sentryUserMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (user) {
      setUser({
        id: user.id,
        email: user.email,
        role: user.role,
      });
    }
    
    next();
  };
}

/**
 * Wrap async handler with Sentry error capture
 */
export function withSentry<T>(
  handler: (...args: any[]) => Promise<T>
): (...args: any[]) => Promise<T> {
  return async (...args: any[]): Promise<T> => {
    try {
      return await handler(...args);
    } catch (error) {
      captureException(error as Error);
      throw error;
    }
  };
}
