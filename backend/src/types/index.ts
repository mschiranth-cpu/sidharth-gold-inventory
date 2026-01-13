import { Request } from 'express';

// Extended Request with user info
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Pagination types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// API Response types
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    statusCode: number;
    details?: unknown;
  };
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Gold types
export type GoldType = 
  | 'RAW_GOLD'
  | 'GOLD_BAR'
  | 'GOLD_COIN'
  | 'JEWELRY'
  | 'SCRAP_GOLD'
  | 'GOLD_DUST';

// Inventory status
export type InventoryStatus = 
  | 'AVAILABLE'
  | 'RESERVED'
  | 'IN_PRODUCTION'
  | 'SOLD'
  | 'DAMAGED';

// Order status
export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PRODUCTION'
  | 'QUALITY_CHECK'
  | 'COMPLETED'
  | 'SHIPPED'
  | 'CANCELLED';

// User roles
export type UserRole = 'ADMIN' | 'MANAGER' | 'WORKER' | 'VIEWER';

// Movement types
export type MovementType = 
  | 'INCOMING'
  | 'OUTGOING'
  | 'TRANSFER'
  | 'ADJUSTMENT'
  | 'RETURN';
