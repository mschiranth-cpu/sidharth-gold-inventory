import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../config';
import { securityConfig } from '../config/security.config';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string | undefined;
}

export class ApiError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;
  code?: string | undefined;

  constructor(statusCode: number, message: string, isOperational = true, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Sensitive information patterns to redact
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /authorization/i,
  /cookie/i,
  /session/i,
  /credit.?card/i,
  /ssn/i,
  /social.?security/i,
];

// Internal error messages that should not be exposed
const INTERNAL_ERROR_PATTERNS = [
  /prisma/i,
  /database/i,
  /sql/i,
  /connection/i,
  /econnrefused/i,
  /enotfound/i,
  /timeout/i,
  /redis/i,
  /memory/i,
];

/**
 * Sanitize error message for production
 */
function sanitizeErrorMessage(message: string, isProduction: boolean): string {
  if (!isProduction) return message;

  // Check if message contains internal details
  if (INTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(message))) {
    return securityConfig.errors.genericMessage;
  }

  // Redact any sensitive information
  let sanitized = message;
  SENSITIVE_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });

  return sanitized;
}

/**
 * Get error code from error
 */
function getErrorCode(err: AppError): string {
  if (err.code) return err.code;

  switch (err.statusCode) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'UNPROCESSABLE_ENTITY';
    case 429:
      return 'TOO_MANY_REQUESTS';
    case 500:
      return 'INTERNAL_ERROR';
    default:
      return 'ERROR';
  }
}

/**
 * Standard error handler (original)
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log the error
  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  if (err.stack) {
    logger.error(err.stack);
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
  });
};

/**
 * Secure error handler - sanitizes error messages in production
 */
export const secureErrorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isProduction = config.nodeEnv === 'production';
  const statusCode = err.statusCode || 500;
  const code = getErrorCode(err);

  // Original message for logging
  const originalMessage = err.message || 'Internal Server Error';

  // Sanitized message for response
  const clientMessage = sanitizeErrorMessage(originalMessage, isProduction);

  // Log the full error (server-side only)
  logger.error('Request error', {
    statusCode,
    code,
    message: originalMessage,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.userId,
    userAgent: req.headers['user-agent'],
    isOperational: err.isOperational ?? true,
  });

  // Log stack trace for non-operational errors
  if (!err.isOperational && err.stack) {
    logger.error('Error stack trace', { stack: err.stack });
  }

  // Determine what to expose
  const exposeDetails = !isProduction || securityConfig.errors.exposedErrorCodes.includes(code);

  // Build response
  const response: any = {
    success: false,
    error: {
      code,
      message: exposeDetails ? clientMessage : securityConfig.errors.genericMessage,
      statusCode,
    },
    timestamp: new Date().toISOString(),
  };

  // Add stack trace in development
  if (securityConfig.errors.exposeStackTrace && err.stack) {
    response.error.stack = err.stack;
  }

  // Add request ID if available (for support tickets)
  const requestId = req.headers['x-request-id'] || (req as any).requestId;
  if (requestId) {
    response.error.requestId = requestId;
  }

  res.status(statusCode).json(response);
};

// Not found error
export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new ApiError(404, `Not Found - ${req.originalUrl}`, true, 'NOT_FOUND');
  next(error);
};

// Async handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
