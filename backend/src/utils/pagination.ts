/**
 * ============================================
 * CURSOR-BASED PAGINATION UTILITIES
 * ============================================
 * 
 * Efficient pagination for large datasets:
 * - Cursor-based pagination (recommended for large datasets)
 * - Offset-based pagination (fallback)
 * - Consistent pagination response format
 */

import { performanceConfig } from '../config/performance.config';
import crypto from 'crypto';

// ============================================
// TYPES
// ============================================

export interface PaginationParams {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
  // Fallback offset pagination
  page?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total?: number;
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
    prevCursor?: string;
    // Offset pagination info
    page?: number;
    totalPages?: number;
  };
}

export interface CursorData {
  id: string;
  createdAt?: string;
  sortField?: string;
  sortValue?: any;
}

// ============================================
// CURSOR ENCODING/DECODING
// ============================================

/**
 * Encode cursor data to base64 string
 */
export function encodeCursor(data: CursorData): string {
  const json = JSON.stringify(data);
  return Buffer.from(json).toString('base64url');
}

/**
 * Decode cursor string to cursor data
 */
export function decodeCursor(cursor: string): CursorData | null {
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Create cursor from item
 */
export function createCursor(
  item: { id: string; createdAt?: Date | string },
  sortField?: string,
  sortValue?: any
): string {
  return encodeCursor({
    id: item.id,
    createdAt: item.createdAt?.toString(),
    sortField,
    sortValue,
  });
}

// ============================================
// PRISMA PAGINATION HELPERS
// ============================================

/**
 * Get Prisma pagination args for cursor-based pagination
 */
export function getPrismaCursorPaginationArgs(params: PaginationParams): {
  take: number;
  skip?: number;
  cursor?: { id: string };
  orderBy: any;
} {
  const limit = Math.min(
    params.limit || performanceConfig.pagination.defaultLimit,
    performanceConfig.pagination.maxLimit
  );

  const result: any = {
    take: limit + 1, // Take one extra to determine if there's more
    orderBy: { createdAt: 'desc' },
  };

  if (params.cursor) {
    const cursorData = decodeCursor(params.cursor);
    if (cursorData) {
      result.cursor = { id: cursorData.id };
      result.skip = 1; // Skip the cursor item itself
    }
  }

  return result;
}

/**
 * Get Prisma pagination args for offset-based pagination
 */
export function getPrismaOffsetPaginationArgs(params: PaginationParams): {
  take: number;
  skip: number;
} {
  const limit = Math.min(
    params.limit || performanceConfig.pagination.defaultLimit,
    performanceConfig.pagination.maxLimit
  );

  const page = Math.max(params.page || 1, 1);
  const skip = params.offset ?? (page - 1) * limit;

  return {
    take: limit,
    skip,
  };
}

/**
 * Format cursor-based pagination result
 */
export function formatCursorPaginationResult<T extends { id: string; createdAt?: Date | string }>(
  items: T[],
  limit: number,
  total?: number
): PaginatedResult<T> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;

  const pagination: PaginatedResult<T>['pagination'] = {
    limit,
    hasMore,
  };

  if (total !== undefined) {
    pagination.total = total;
  }

  if (data.length > 0) {
    pagination.nextCursor = hasMore ? createCursor(data[data.length - 1]) : undefined;
    pagination.prevCursor = createCursor(data[0]);
  }

  return { data, pagination };
}

/**
 * Format offset-based pagination result
 */
export function formatOffsetPaginationResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data: items,
    pagination: {
      total,
      limit,
      page,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

// ============================================
// UNIFIED PAGINATION HANDLER
// ============================================

/**
 * Parse pagination parameters from request query
 */
export function parsePaginationParams(query: Record<string, any>): PaginationParams {
  const useCursor = performanceConfig.pagination.useCursor;
  
  return {
    cursor: query.cursor as string | undefined,
    limit: query.limit ? parseInt(query.limit, 10) : undefined,
    direction: query.direction as 'forward' | 'backward' | undefined,
    page: query.page ? parseInt(query.page, 10) : undefined,
    offset: query.offset ? parseInt(query.offset, 10) : undefined,
  };
}

/**
 * Get appropriate pagination args based on config
 */
export function getPaginationArgs(params: PaginationParams): {
  take: number;
  skip?: number;
  cursor?: { id: string };
  orderBy?: any;
  useCursor: boolean;
} {
  const useCursor = performanceConfig.pagination.useCursor && !params.page;

  if (useCursor && (params.cursor || !params.page)) {
    const cursorArgs = getPrismaCursorPaginationArgs(params);
    return { ...cursorArgs, useCursor: true };
  }

  const offsetArgs = getPrismaOffsetPaginationArgs(params);
  return { ...offsetArgs, useCursor: false };
}

/**
 * Format pagination result based on method used
 */
export function formatPaginationResult<T extends { id: string; createdAt?: Date | string }>(
  items: T[],
  params: {
    useCursor: boolean;
    limit: number;
    page?: number;
    total?: number;
  }
): PaginatedResult<T> {
  if (params.useCursor) {
    return formatCursorPaginationResult(items, params.limit, params.total);
  }

  return formatOffsetPaginationResult(
    items,
    params.total || items.length,
    params.page || 1,
    params.limit
  );
}

// ============================================
// QUERY OPTIMIZATION HELPERS
// ============================================

/**
 * Generate select object to fetch only needed fields
 * Helps avoid N+1 queries and over-fetching
 */
export function selectFields<T extends string>(
  fields: T[],
  additionalFields?: Record<string, boolean>
): Record<T | string, boolean> {
  const select: Record<string, boolean> = {};
  
  for (const field of fields) {
    select[field] = true;
  }
  
  if (additionalFields) {
    Object.assign(select, additionalFields);
  }
  
  return select;
}

/**
 * Common order select fields (minimal for list views)
 */
export const orderListFields = selectFields([
  'id',
  'orderNumber',
  'customerName',
  'status',
  'priority',
  'createdAt',
  'updatedAt',
]);

/**
 * Order detail select fields (full details)
 */
export const orderDetailFields = selectFields(
  [
    'id',
    'orderNumber',
    'customerName',
    'customerPhone',
    'customerEmail',
    'productPhotoUrl',
    'status',
    'priority',
    'createdById',
    'createdAt',
    'updatedAt',
  ],
  {
    orderDetails: true,
    stones: true,
    departmentTracking: true,
    finalSubmission: true,
  }
);

/**
 * User list select fields
 */
export const userListFields = selectFields([
  'id',
  'name',
  'email',
  'role',
  'department',
  'isActive',
  'createdAt',
]);
