import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { Express, Request, Response, NextFunction } from 'express';
import logger from './logger.config';

// =============================================================================
// Sentry Configuration
// =============================================================================

export const initSentry = (app: Express) => {
  if (!process.env.SENTRY_DSN) {
    logger.warn('Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || '1.0.0',
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Profiling
    profilesSampleRate: 0.1,
    
    integrations: [
      // HTTP integration for tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Express integration
      new Sentry.Integrations.Express({ app }),
      // Profiling
      new ProfilingIntegration(),
      // Prisma integration
      new Sentry.Integrations.Prisma({ client: true }),
    ],

    // Filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }

      // Remove sensitive body data
      if (event.request?.data) {
        const sensitiveFields = ['password', 'token', 'secret', 'creditCard'];
        const data = typeof event.request.data === 'string' 
          ? JSON.parse(event.request.data) 
          : event.request.data;
        
        sensitiveFields.forEach(field => {
          if (data[field]) {
            data[field] = '[FILTERED]';
          }
        });
        
        event.request.data = JSON.stringify(data);
      }

      return event;
    },

    // Ignore specific errors
    ignoreErrors: [
      'TokenExpiredError',
      'JsonWebTokenError',
      'ValidationError',
      /^Network request failed$/,
    ],
  });

  logger.info('Sentry initialized', { 
    environment: process.env.NODE_ENV,
    dsn: process.env.SENTRY_DSN.substring(0, 20) + '...',
  });
};

// =============================================================================
// Sentry Middleware
// =============================================================================

export const sentryRequestHandler = Sentry.Handlers.requestHandler({
  // Include user info
  user: ['id', 'email', 'role'],
  // Include IP
  ip: true,
  // Include request data
  request: ['headers', 'method', 'url', 'query_string'],
});

export const sentryTracingHandler = Sentry.Handlers.tracingHandler();

export const sentryErrorHandler = Sentry.Handlers.errorHandler({
  shouldHandleError(error) {
    // Capture 4xx and 5xx errors
    const status = (error as any).status || (error as any).statusCode || 500;
    return status >= 400;
  },
});

// =============================================================================
// User Context Middleware
// =============================================================================

export const setUserContext = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
      role: user.role,
    });

    Sentry.setTag('user.role', user.role);
    Sentry.setTag('user.department', user.departmentId || 'none');
  }

  // Add request ID as tag
  if (req.requestId) {
    Sentry.setTag('request_id', req.requestId);
  }

  next();
};

// =============================================================================
// Manual Error Capture
// =============================================================================

interface ErrorContext {
  user?: { id: string; email: string };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  level?: Sentry.SeverityLevel;
}

export const captureError = (error: Error, context?: ErrorContext) => {
  Sentry.withScope((scope) => {
    if (context?.user) {
      scope.setUser(context.user);
    }
    
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    
    if (context?.level) {
      scope.setLevel(context.level);
    }

    Sentry.captureException(error);
  });
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

// =============================================================================
// Performance Transactions
// =============================================================================

export const startTransaction = (name: string, op: string) => {
  return Sentry.startTransaction({ name, op });
};

export const measureAsync = async <T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> => {
  const transaction = Sentry.startTransaction({ name, op: 'task' });
  
  try {
    const result = await operation();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    throw error;
  } finally {
    transaction.finish();
  }
};

// =============================================================================
// Alert Integration (Slack/Email)
// =============================================================================

export const sendAlert = async (
  title: string,
  message: string,
  severity: 'info' | 'warning' | 'error' | 'critical'
) => {
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  
  if (slackWebhook) {
    const colors = {
      info: '#36a64f',
      warning: '#ffcc00',
      error: '#ff6600',
      critical: '#ff0000',
    };

    try {
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachments: [{
            color: colors[severity],
            title: `[${severity.toUpperCase()}] ${title}`,
            text: message,
            footer: 'Gold Factory Monitoring',
            ts: Math.floor(Date.now() / 1000),
          }],
        }),
      });
    } catch (error) {
      logger.error('Failed to send Slack alert', { error });
    }
  }

  // Also log the alert
  logger[severity === 'critical' ? 'error' : severity](`ALERT: ${title}`, { message });
};

// =============================================================================
// Export Sentry for Direct Access
// =============================================================================

export { Sentry };
