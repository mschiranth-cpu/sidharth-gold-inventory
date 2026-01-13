import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

// =============================================================================
// Configuration
// =============================================================================

const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '../../logs');
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// =============================================================================
// Custom Formats
// =============================================================================

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
    const reqId = requestId ? `[${requestId}]` : '';
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level.toUpperCase().padEnd(5)} ${reqId} ${message}${metaStr}`;
  })
);

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// =============================================================================
// Transports
// =============================================================================

// Console transport (colorized for development)
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize({ all: true }),
    customFormat
  ),
});

// Error log file (errors only)
const errorFileTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '30d',
  format: jsonFormat,
});

// Combined log file (all levels)
const combinedFileTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '50m',
  maxFiles: '14d',
  format: jsonFormat,
});

// Access log file (HTTP requests)
const accessFileTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, 'access-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '50m',
  maxFiles: '7d',
  format: jsonFormat,
});

// =============================================================================
// Logger Instance
// =============================================================================

const logger = winston.createLogger({
  level: LOG_LEVEL,
  defaultMeta: { service: 'gold-factory-api' },
  transports: [
    consoleTransport,
    errorFileTransport,
    combinedFileTransport,
  ],
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(LOG_DIR, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(LOG_DIR, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
    }),
  ],
});

// Access logger (separate instance)
const accessLogger = winston.createLogger({
  level: 'info',
  transports: [accessFileTransport],
});

// =============================================================================
// Request ID Middleware
// =============================================================================

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// =============================================================================
// Request Logging Middleware
// =============================================================================

export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log request
  const requestLog = {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?.id,
  };

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const responseLog = {
      ...requestLog,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length'),
    };

    // Log level based on status code
    if (res.statusCode >= 500) {
      accessLogger.error('Request completed', responseLog);
    } else if (res.statusCode >= 400) {
      accessLogger.warn('Request completed', responseLog);
    } else {
      accessLogger.info('Request completed', responseLog);
    }
  });

  next();
};

// =============================================================================
// Child Logger Factory
// =============================================================================

export const createChildLogger = (module: string) => {
  return logger.child({ module });
};

// =============================================================================
// Utility Functions
// =============================================================================

export const logWithRequestId = (requestId: string) => ({
  info: (message: string, meta?: object) => logger.info(message, { requestId, ...meta }),
  warn: (message: string, meta?: object) => logger.warn(message, { requestId, ...meta }),
  error: (message: string, meta?: object) => logger.error(message, { requestId, ...meta }),
  debug: (message: string, meta?: object) => logger.debug(message, { requestId, ...meta }),
});

// =============================================================================
// Export
// =============================================================================

export default logger;
