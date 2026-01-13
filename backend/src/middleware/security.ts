/**
 * ============================================
 * SECURITY MIDDLEWARE
 * ============================================
 *
 * Comprehensive security middleware including:
 * - Helmet configuration
 * - CORS with whitelist
 * - CSRF protection
 * - Input sanitization
 * - Request validation
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import crypto from 'crypto';
import { securityConfig } from '../config/security.config';
import { logger } from '../utils/logger';

// ============================================
// HELMET SECURITY HEADERS MIDDLEWARE
// ============================================

/**
 * Configure Helmet with all security headers
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: securityConfig.helmet.contentSecurityPolicy.enabled
    ? {
        directives: securityConfig.helmet.contentSecurityPolicy.directives,
      }
    : false,
  hsts: securityConfig.helmet.hsts,
  referrerPolicy: securityConfig.helmet.referrerPolicy,
  noSniff: securityConfig.helmet.noSniff,
  xssFilter: securityConfig.helmet.xssFilter,
  hidePoweredBy: securityConfig.helmet.hidePoweredBy,
  frameguard: securityConfig.helmet.frameguard,
  crossOriginEmbedderPolicy: securityConfig.helmet.crossOriginEmbedderPolicy,
  crossOriginResourcePolicy: securityConfig.helmet.crossOriginResourcePolicy,
  crossOriginOpenerPolicy: securityConfig.helmet.crossOriginOpenerPolicy,
  dnsPrefetchControl: securityConfig.helmet.dnsPrefetchControl,
  ieNoOpen: securityConfig.helmet.ieNoOpen,
  originAgentCluster: securityConfig.helmet.originAgentCluster,
  permittedCrossDomainPolicies: securityConfig.helmet.permittedCrossDomainPolicies,
});

// ============================================
// CORS MIDDLEWARE WITH WHITELIST
// ============================================

/**
 * CORS origin validator function
 */
const corsOriginValidator = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
) => {
  // Allow requests with no origin (mobile apps, Postman, etc.)
  if (!origin) {
    callback(null, true);
    return;
  }

  // Check if origin is in whitelist
  if (securityConfig.cors.allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    logger.warn('CORS blocked request from origin:', { origin });
    callback(new Error('Not allowed by CORS'));
  }
};

/**
 * Configure CORS with whitelist
 */
export const corsMiddleware = cors({
  origin: corsOriginValidator,
  methods: securityConfig.cors.methods,
  allowedHeaders: securityConfig.cors.allowedHeaders,
  exposedHeaders: securityConfig.cors.exposedHeaders,
  credentials: securityConfig.cors.credentials,
  maxAge: securityConfig.cors.maxAge,
  optionsSuccessStatus: securityConfig.cors.optionsSuccessStatus,
});

// ============================================
// CSRF PROTECTION MIDDLEWARE
// ============================================

// In-memory CSRF token store (use Redis in production)
const csrfTokens = new Map<string, { token: string; expires: number }>();

/**
 * Generate CSRF token
 */
function generateCsrfToken(): string {
  return crypto.randomBytes(securityConfig.csrf.tokenLength).toString('hex');
}

/**
 * Get session ID from request
 */
function getSessionId(req: Request): string {
  // Try to get from cookie, then from auth header
  return (
    req.cookies?.sessionId ||
    req.headers.authorization?.split(' ')[1]?.substring(0, 16) ||
    req.ip ||
    'anonymous'
  );
}

/**
 * CSRF token generation middleware
 * Generates and sets CSRF token in cookie
 */
export const csrfTokenMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!securityConfig.csrf.enabled) {
    return next();
  }

  const sessionId = getSessionId(req);
  let tokenData = csrfTokens.get(sessionId);

  // Generate new token if expired or doesn't exist
  if (!tokenData || tokenData.expires < Date.now()) {
    const token = generateCsrfToken();
    const expires = Date.now() + securityConfig.csrf.cookie.maxAge;
    tokenData = { token, expires };
    csrfTokens.set(sessionId, tokenData);

    // Set token in cookie
    res.cookie(securityConfig.csrf.cookie.name, token, {
      httpOnly: securityConfig.csrf.cookie.httpOnly,
      secure: securityConfig.csrf.cookie.secure,
      sameSite: securityConfig.csrf.cookie.sameSite,
      maxAge: securityConfig.csrf.cookie.maxAge,
      path: securityConfig.csrf.cookie.path,
    });
  }

  // Also set token in response header for SPA apps
  res.setHeader(securityConfig.csrf.headerName, tokenData.token);

  // Add token to request for use in views/templates
  (req as any).csrfToken = tokenData.token;

  next();
};

/**
 * CSRF validation middleware
 * Validates CSRF token for state-changing requests
 */
export const csrfValidationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!securityConfig.csrf.enabled) {
    return next();
  }

  // Skip validation for excluded paths
  if (securityConfig.csrf.excludePaths.some((path) => req.path.startsWith(path))) {
    return next();
  }

  // Skip validation for safe methods
  if (!securityConfig.csrf.protectedMethods.includes(req.method)) {
    return next();
  }

  const sessionId = getSessionId(req);
  const tokenData = csrfTokens.get(sessionId);

  // Get token from header or body
  const requestToken =
    (req.headers[securityConfig.csrf.headerName.toLowerCase()] as string) || req.body?._csrf;

  // Validate token
  if (!tokenData || !requestToken || tokenData.token !== requestToken) {
    logger.warn('CSRF validation failed', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_ERROR',
        message: 'Invalid or missing CSRF token',
        statusCode: 403,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Rotate token after successful validation
  const newToken = generateCsrfToken();
  const expires = Date.now() + securityConfig.csrf.cookie.maxAge;
  csrfTokens.set(sessionId, { token: newToken, expires });

  res.cookie(securityConfig.csrf.cookie.name, newToken, {
    httpOnly: securityConfig.csrf.cookie.httpOnly,
    secure: securityConfig.csrf.cookie.secure,
    sameSite: securityConfig.csrf.cookie.sameSite,
    maxAge: securityConfig.csrf.cookie.maxAge,
    path: securityConfig.csrf.cookie.path,
  });

  next();
};

// Cleanup expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expires < now) {
      csrfTokens.delete(key);
    }
  }
}, 60000); // Every minute

// ============================================
// INPUT SANITIZATION MIDDLEWARE
// ============================================

/**
 * Escape HTML entities to prevent XSS
 */
function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  return str.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char]);
}

/**
 * Strip HTML tags
 */
function stripTags(str: string, whitelist: string[] = []): string {
  if (whitelist.length === 0) {
    return str.replace(/<[^>]*>/g, '');
  }

  const whitelistPattern = whitelist.join('|');
  const regex = new RegExp(`<(?!\/?(?:${whitelistPattern})\\b)[^>]*>`, 'gi');
  return str.replace(regex, '');
}

/**
 * Check for SQL injection patterns
 */
function hasSqlInjection(value: string): boolean {
  if (!securityConfig.sanitization.sqlInjection.enabled) return false;

  const lowerValue = value.toLowerCase();

  // Check for common SQL keywords in suspicious contexts
  const sqlKeywords = [
    'select',
    'insert',
    'update',
    'delete',
    'drop',
    'union',
    'alter',
    'create',
    'truncate',
  ];
  const suspiciousPatterns = [
    /'\s*(or|and)\s*'?\d*\s*[=<>]/i,
    /;\s*(select|insert|update|delete|drop)/i,
    /--\s*$/,
    /\/\*.*\*\//,
    /'.*?'.*?(or|and).*?'.*?'/i,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(value));
}

/**
 * Check for NoSQL injection patterns
 */
function hasNoSqlInjection(value: any): boolean {
  if (!securityConfig.sanitization.noSqlInjection.enabled) return false;

  if (typeof value === 'string') {
    return securityConfig.sanitization.noSqlInjection.blockedPatterns.some((pattern) =>
      value.includes(pattern)
    );
  }

  if (typeof value === 'object' && value !== null) {
    const keys = Object.keys(value);
    return keys.some((key) => key.startsWith('$'));
  }

  return false;
}

/**
 * Check for path traversal patterns
 */
function hasPathTraversal(value: string): boolean {
  if (!securityConfig.sanitization.pathTraversal.enabled) return false;

  return securityConfig.sanitization.pathTraversal.patterns.some((pattern) => pattern.test(value));
}

/**
 * Sanitize a single value
 */
function sanitizeValue(value: any, fieldName?: string): any {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    let sanitized = value;

    // Skip length limits for base64 data URLs (images, files)
    // These are already validated by Zod schemas and need to preserve full data
    if (sanitized.startsWith('data:')) {
      return sanitized;
    }

    // Trim whitespace
    sanitized = sanitized.trim();

    // Check field length limits
    const limit =
      fieldName && (securityConfig.sanitization.fieldLimits as any)[fieldName]
        ? (securityConfig.sanitization.fieldLimits as any)[fieldName]
        : securityConfig.sanitization.fieldLimits.default;

    if (sanitized.length > limit) {
      sanitized = sanitized.substring(0, limit);
    }

    // XSS protection
    if (securityConfig.sanitization.xss.enabled) {
      if (securityConfig.sanitization.xss.stripTags) {
        sanitized = stripTags(sanitized, securityConfig.sanitization.xss.whitelistTags);
      }
      if (securityConfig.sanitization.xss.encodeEntities) {
        // Only encode if it looks like it contains HTML
        if (/<[^>]*>/.test(sanitized)) {
          sanitized = escapeHtml(sanitized);
        }
      }
    }

    return sanitized;
  }

  if (Array.isArray(value)) {
    // Pass the field name to array items so they use the correct limit
    return value.map((item) => sanitizeValue(item, fieldName));
  }

  if (typeof value === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val, key);
    }
    return sanitized;
  }

  return value;
}

/**
 * Input sanitization middleware
 */
export const sanitizationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!securityConfig.sanitization.enabled) {
    return next();
  }

  const checkInjection = (value: any, path: string): boolean => {
    if (typeof value === 'string') {
      if (hasSqlInjection(value)) {
        logger.warn('SQL injection attempt detected', {
          path,
          ip: req.ip,
          value: value.substring(0, 100),
        });
        return true;
      }
      if (hasPathTraversal(value)) {
        logger.warn('Path traversal attempt detected', {
          path,
          ip: req.ip,
          value: value.substring(0, 100),
        });
        return true;
      }
    }
    if (hasNoSqlInjection(value)) {
      logger.warn('NoSQL injection attempt detected', { path, ip: req.ip });
      return true;
    }
    return false;
  };

  // Check and sanitize body
  if (req.body && typeof req.body === 'object') {
    for (const [key, value] of Object.entries(req.body)) {
      if (checkInjection(value, `body.${key}`)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'SECURITY_ERROR',
            message: 'Invalid input detected',
            statusCode: 400,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }
    req.body = sanitizeValue(req.body);
  }

  // Check and sanitize query params
  if (req.query && typeof req.query === 'object') {
    for (const [key, value] of Object.entries(req.query)) {
      if (checkInjection(value, `query.${key}`)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'SECURITY_ERROR',
            message: 'Invalid input detected',
            statusCode: 400,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }
    req.query = sanitizeValue(req.query);
  }

  // Check URL params
  if (req.params && typeof req.params === 'object') {
    for (const [key, value] of Object.entries(req.params)) {
      if (checkInjection(value, `params.${key}`)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'SECURITY_ERROR',
            message: 'Invalid input detected',
            statusCode: 400,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }
  }

  next();
};

// ============================================
// REQUEST TIMEOUT MIDDLEWARE
// ============================================

/**
 * Request timeout middleware
 */
export const requestTimeoutMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const timeout = securityConfig.request.timeout;

  // Set timeout
  req.setTimeout(timeout, () => {
    if (!res.headersSent) {
      logger.warn('Request timeout', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        timeout,
      });

      res.status(408).json({
        success: false,
        error: {
          code: 'REQUEST_TIMEOUT',
          message: 'Request took too long to process',
          statusCode: 408,
        },
        timestamp: new Date().toISOString(),
      });
    }
  });

  next();
};

// ============================================
// API KEY VALIDATION MIDDLEWARE
// ============================================

/**
 * API key validation middleware
 */
export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!securityConfig.apiKeys.enabled) {
    return next();
  }

  const apiKey = req.headers[securityConfig.apiKeys.headerName.toLowerCase()] as string;

  if (!apiKey) {
    // No API key provided, continue to JWT auth
    return next();
  }

  // Validate API key format
  if (!apiKey.startsWith(securityConfig.apiKeys.keyPrefix)) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key format',
        statusCode: 401,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // TODO: Validate API key against database
  // For now, this is a placeholder that should be implemented
  // with actual API key storage and validation

  // Mark request as API key authenticated
  (req as any).apiKeyAuth = true;
  (req as any).apiKeyScopes = securityConfig.apiKeys.defaultScopes;

  next();
};

// ============================================
// SECURITY HEADERS LOGGER
// ============================================

/**
 * Log security headers for debugging
 */
export const securityHeadersLogger = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'development' && process.env.DEBUG_SECURITY === 'true') {
    res.on('finish', () => {
      const securityHeaders = [
        'Content-Security-Policy',
        'Strict-Transport-Security',
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Referrer-Policy',
      ];

      const headers: Record<string, string | undefined> = {};
      securityHeaders.forEach((header) => {
        headers[header] = res.getHeader(header) as string | undefined;
      });

      logger.debug('Security headers', { path: req.path, headers });
    });
  }
  next();
};

export default {
  helmetMiddleware,
  corsMiddleware,
  csrfTokenMiddleware,
  csrfValidationMiddleware,
  sanitizationMiddleware,
  requestTimeoutMiddleware,
  apiKeyMiddleware,
  securityHeadersLogger,
};
