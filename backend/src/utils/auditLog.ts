/**
 * ============================================
 * AUDIT LOGGING SYSTEM
 * ============================================
 *
 * Comprehensive audit logging for security and compliance:
 * - Track all data modifications
 * - User authentication events
 * - Security events
 * - File operations
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { securityConfig } from '../config/security.config';
import { logger } from './logger';

// ============================================
// TYPES
// ============================================

export enum AuditAction {
  // Authentication
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  TWO_FACTOR_ENABLE = 'TWO_FACTOR_ENABLE',
  TWO_FACTOR_DISABLE = 'TWO_FACTOR_DISABLE',

  // Authorization
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',

  // Data Operations
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  BULK_CREATE = 'BULK_CREATE',
  BULK_UPDATE = 'BULK_UPDATE',
  BULK_DELETE = 'BULK_DELETE',

  // File Operations
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_DOWNLOAD = 'FILE_DOWNLOAD',
  FILE_DELETE = 'FILE_DELETE',

  // System Events
  CONFIG_CHANGE = 'CONFIG_CHANGE',
  SYSTEM_START = 'SYSTEM_START',
  SYSTEM_SHUTDOWN = 'SYSTEM_SHUTDOWN',

  // Security Events
  BRUTE_FORCE_LOCKOUT = 'BRUTE_FORCE_LOCKOUT',
  CSRF_VIOLATION = 'CSRF_VIOLATION',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
}

export enum AuditResource {
  USER = 'USER',
  ORDER = 'ORDER',
  SUBMISSION = 'SUBMISSION',
  DEPARTMENT = 'DEPARTMENT',
  NOTIFICATION = 'NOTIFICATION',
  REPORT = 'REPORT',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
  AUTH = 'AUTH',
}

export interface AuditLogEntry {
  id?: string;
  timestamp: Date;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress: string;
  userAgent: string;
  method: string;
  path: string;
  statusCode?: number;
  requestBody?: any;
  changes?: {
    before?: any;
    after?: any;
    fields?: string[];
  };
  metadata?: Record<string, any>;
  duration?: number;
  success: boolean;
  errorMessage?: string;
}

// ============================================
// AUDIT LOG STORAGE
// ============================================

// In-memory buffer for batching writes
const auditBuffer: AuditLogEntry[] = [];
const BUFFER_FLUSH_SIZE = 100;
const BUFFER_FLUSH_INTERVAL = 10000; // 10 seconds

// Prisma client (lazy loaded)
let prisma: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Mask sensitive fields in data
 */
function maskSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const masked = Array.isArray(data) ? [...data] : { ...data };

  for (const key of Object.keys(masked)) {
    const lowerKey = key.toLowerCase();
    if (securityConfig.auditLog.maskedFields.some((field) => lowerKey.includes(field))) {
      masked[key] = '***REDACTED***';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }

  return masked;
}

/**
 * Extract user info from request
 */
function getUserFromRequest(req: Request): {
  userId?: string;
  userEmail?: string;
  userRole?: string;
} {
  const user = (req as any).user;
  return {
    userId: user?.userId || user?.id,
    userEmail: user?.email,
    userRole: user?.role,
  };
}

/**
 * Get client IP address
 */
function getClientIP(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.ip ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Calculate changes between before and after states
 */
export function calculateChanges(
  before: Record<string, any> | null | undefined,
  after: Record<string, any> | null | undefined
): { before?: any; after?: any; fields: string[] } {
  const fields: string[] = [];
  const beforeChanges: Record<string, any> = {};
  const afterChanges: Record<string, any> = {};

  if (!before && !after) return { fields: [] };

  if (!before) {
    return { after: maskSensitiveData(after), fields: Object.keys(after || {}) };
  }

  if (!after) {
    return { before: maskSensitiveData(before), fields: Object.keys(before) };
  }

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      fields.push(key);
      beforeChanges[key] = before[key];
      afterChanges[key] = after[key];
    }
  }

  return {
    before: maskSensitiveData(beforeChanges),
    after: maskSensitiveData(afterChanges),
    fields,
  };
}

// ============================================
// CORE AUDIT FUNCTIONS
// ============================================

/**
 * Write audit log entry
 */
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  if (!securityConfig.auditLog.enabled) return;

  try {
    // Add to buffer
    auditBuffer.push({
      ...entry,
      timestamp: entry.timestamp || new Date(),
      requestBody: entry.requestBody ? maskSensitiveData(entry.requestBody) : undefined,
    });

    // Flush if buffer is full
    if (auditBuffer.length >= BUFFER_FLUSH_SIZE) {
      await flushAuditBuffer();
    }
  } catch (error) {
    logger.error('Failed to write audit log', { error, entry });
  }
}

/**
 * Flush audit buffer to storage
 */
async function flushAuditBuffer(): Promise<void> {
  if (auditBuffer.length === 0) return;

  const entries = [...auditBuffer];
  auditBuffer.length = 0; // Clear buffer

  try {
    if (
      securityConfig.auditLog.storage === 'database' ||
      securityConfig.auditLog.storage === 'both'
    ) {
      await writeToDatabase(entries);
    }

    if (securityConfig.auditLog.storage === 'file' || securityConfig.auditLog.storage === 'both') {
      await writeToFile(entries);
    }
  } catch (error) {
    logger.error('Failed to flush audit buffer', { error });
    // Re-add entries to buffer for retry
    auditBuffer.push(...entries);
  }
}

/**
 * Write entries to database
 */
async function writeToDatabase(entries: AuditLogEntry[]): Promise<void> {
  try {
    const db = getPrisma();

    // Note: This assumes an AuditLog table exists in your schema
    // You may need to create this table
    await db.$executeRaw`
      INSERT INTO "AuditLog" 
        ("timestamp", "action", "resource", "resourceId", "userId", "userEmail", 
         "userRole", "ipAddress", "userAgent", "method", "path", "statusCode",
         "requestBody", "changes", "metadata", "duration", "success", "errorMessage")
      VALUES ${entries
        .map(
          (e) => `(
        '${e.timestamp.toISOString()}',
        '${e.action}',
        '${e.resource}',
        ${e.resourceId ? `'${e.resourceId}'` : 'NULL'},
        ${e.userId ? `'${e.userId}'` : 'NULL'},
        ${e.userEmail ? `'${e.userEmail}'` : 'NULL'},
        ${e.userRole ? `'${e.userRole}'` : 'NULL'},
        '${e.ipAddress}',
        '${e.userAgent?.replace(/'/g, "''")}',
        '${e.method}',
        '${e.path}',
        ${e.statusCode || 'NULL'},
        ${e.requestBody ? `'${JSON.stringify(e.requestBody).replace(/'/g, "''")}'` : 'NULL'},
        ${e.changes ? `'${JSON.stringify(e.changes).replace(/'/g, "''")}'` : 'NULL'},
        ${e.metadata ? `'${JSON.stringify(e.metadata).replace(/'/g, "''")}'` : 'NULL'},
        ${e.duration || 'NULL'},
        ${e.success},
        ${e.errorMessage ? `'${e.errorMessage.replace(/'/g, "''")}'` : 'NULL'}
      )`
        )
        .join(',')}
    `;
  } catch (error) {
    // If table doesn't exist, log to file instead
    logger.warn('Failed to write audit log to database, using file fallback', { error });
    await writeToFile(entries);
  }
}

/**
 * Write entries to file
 */
async function writeToFile(entries: AuditLogEntry[]): Promise<void> {
  const filePath = securityConfig.auditLog.filePath;
  const dir = path.dirname(filePath);

  try {
    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Check file size for rotation
    try {
      const stats = await fs.stat(filePath);
      if (stats.size >= securityConfig.auditLog.maxFileSize) {
        // Rotate file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await fs.rename(filePath, `${filePath}.${timestamp}`);
      }
    } catch {
      // File doesn't exist yet, that's fine
    }

    // Append entries
    const lines = entries.map((e) => JSON.stringify(e)).join('\n') + '\n';
    await fs.appendFile(filePath, lines, 'utf8');
  } catch (error) {
    logger.error('Failed to write audit log to file', { error, filePath });
  }
}

// Flush buffer periodically
setInterval(flushAuditBuffer, BUFFER_FLUSH_INTERVAL);

// Flush on process exit
process.on('beforeExit', async () => {
  await flushAuditBuffer();
});

// ============================================
// EXPRESS MIDDLEWARE
// ============================================

/**
 * Audit logging middleware
 */
export const auditMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!securityConfig.auditLog.enabled) {
    return next();
  }

  const startTime = Date.now();
  const user = getUserFromRequest(req);

  // Store original end function
  const originalEnd = res.end;

  // Override end to capture response
  res.end = function (this: Response, ...args: any[]) {
    const duration = Date.now() - startTime;

    // Determine action based on method
    let action: AuditAction;
    switch (req.method) {
      case 'POST':
        action = AuditAction.CREATE;
        break;
      case 'PUT':
      case 'PATCH':
        action = AuditAction.UPDATE;
        break;
      case 'DELETE':
        action = AuditAction.DELETE;
        break;
      default:
        action = AuditAction.READ;
    }

    // Determine resource from path
    let resource = AuditResource.SYSTEM;
    if (req.path.includes('/orders')) resource = AuditResource.ORDER;
    else if (req.path.includes('/users')) resource = AuditResource.USER;
    else if (req.path.includes('/auth')) resource = AuditResource.AUTH;
    else if (req.path.includes('/submissions')) resource = AuditResource.SUBMISSION;
    else if (req.path.includes('/departments')) resource = AuditResource.DEPARTMENT;
    else if (req.path.includes('/notifications')) resource = AuditResource.NOTIFICATION;
    else if (req.path.includes('/reports')) resource = AuditResource.REPORT;

    // Only log data-modifying operations or if configured
    const shouldLog =
      (securityConfig.auditLog.events.dataCreate && req.method === 'POST') ||
      (securityConfig.auditLog.events.dataUpdate && ['PUT', 'PATCH'].includes(req.method)) ||
      (securityConfig.auditLog.events.dataDelete && req.method === 'DELETE');

    if (shouldLog) {
      const entry: AuditLogEntry = {
        timestamp: new Date(),
        action,
        resource,
        resourceId: req.params.id || req.params.orderId || req.params.userId,
        ...user,
        ipAddress: getClientIP(req),
        userAgent: req.headers['user-agent'] || 'unknown',
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        requestBody: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : undefined,
        duration,
        success: res.statusCode < 400,
      };

      writeAuditLog(entry);
    }

    // Call original end
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (originalEnd as (...args: any[]) => any).apply(this, args);
  };

  next();
};

// ============================================
// SPECIFIC AUDIT LOGGERS
// ============================================

/**
 * Log authentication event
 */
export async function logAuthEvent(
  action: AuditAction,
  req: Request,
  success: boolean,
  details?: Record<string, any>
): Promise<void> {
  if (!securityConfig.auditLog.events.authentication) return;

  const user = getUserFromRequest(req);

  await writeAuditLog({
    timestamp: new Date(),
    action,
    resource: AuditResource.AUTH,
    ...user,
    ipAddress: getClientIP(req),
    userAgent: req.headers['user-agent'] || 'unknown',
    method: req.method,
    path: req.path,
    success,
    metadata: details,
  });
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  action: AuditAction,
  req: Request,
  details?: Record<string, any>
): Promise<void> {
  if (!securityConfig.auditLog.events.securityEvent) return;

  const user = getUserFromRequest(req);

  await writeAuditLog({
    timestamp: new Date(),
    action,
    resource: AuditResource.SYSTEM,
    ...user,
    ipAddress: getClientIP(req),
    userAgent: req.headers['user-agent'] || 'unknown',
    method: req.method,
    path: req.path,
    success: false,
    metadata: details,
  });
}

/**
 * Log data modification
 */
export async function logDataChange(
  action: AuditAction,
  resource: AuditResource,
  resourceId: string,
  req: Request,
  before?: any,
  after?: any
): Promise<void> {
  if (
    !securityConfig.auditLog.events.dataUpdate &&
    !securityConfig.auditLog.events.dataCreate &&
    !securityConfig.auditLog.events.dataDelete
  )
    return;

  const user = getUserFromRequest(req);

  await writeAuditLog({
    timestamp: new Date(),
    action,
    resource,
    resourceId,
    ...user,
    ipAddress: getClientIP(req),
    userAgent: req.headers['user-agent'] || 'unknown',
    method: req.method,
    path: req.path,
    changes: calculateChanges(before, after),
    success: true,
  });
}

/**
 * Log file operation
 */
export async function logFileOperation(
  action: AuditAction,
  req: Request,
  filename: string,
  success: boolean,
  details?: Record<string, any>
): Promise<void> {
  if (!securityConfig.auditLog.events.fileUpload) return;

  const user = getUserFromRequest(req);

  await writeAuditLog({
    timestamp: new Date(),
    action,
    resource: AuditResource.FILE,
    resourceId: filename,
    ...user,
    ipAddress: getClientIP(req),
    userAgent: req.headers['user-agent'] || 'unknown',
    method: req.method,
    path: req.path,
    success,
    metadata: details,
  });
}

// ============================================
// QUERY FUNCTIONS
// ============================================

/**
 * Query audit logs
 */
export async function queryAuditLogs(options: {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  resourceId?: string;
  success?: boolean;
  limit?: number;
  offset?: number;
}): Promise<AuditLogEntry[]> {
  // Implementation depends on storage type
  // This is a placeholder for database query
  try {
    const db = getPrisma();
    const logs = await db.$queryRaw<AuditLogEntry[]>`
      SELECT * FROM "AuditLog"
      WHERE 1=1
      ${options.startDate ? `AND timestamp >= '${options.startDate.toISOString()}'` : ''}
      ${options.endDate ? `AND timestamp <= '${options.endDate.toISOString()}'` : ''}
      ${options.userId ? `AND "userId" = '${options.userId}'` : ''}
      ${options.action ? `AND action = '${options.action}'` : ''}
      ${options.resource ? `AND resource = '${options.resource}'` : ''}
      ${options.resourceId ? `AND "resourceId" = '${options.resourceId}'` : ''}
      ${options.success !== undefined ? `AND success = ${options.success}` : ''}
      ORDER BY timestamp DESC
      LIMIT ${options.limit || 100}
      OFFSET ${options.offset || 0}
    `;
    return logs;
  } catch {
    return [];
  }
}

export default {
  writeAuditLog,
  auditMiddleware,
  logAuthEvent,
  logSecurityEvent,
  logDataChange,
  logFileOperation,
  queryAuditLogs,
  calculateChanges,
  AuditAction,
  AuditResource,
};
