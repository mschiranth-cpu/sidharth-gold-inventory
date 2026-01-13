// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  departmentId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'WORKER' | 'VIEWER';

// Department types
export interface Department {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    inventory: number;
    orders: number;
  };
}

// Inventory types
export interface Inventory {
  id: string;
  itemCode: string;
  name: string;
  description: string | null;
  goldType: GoldType;
  purity: number;
  weightGrams: number;
  quantity: number;
  pricePerGram: number;
  departmentId: string;
  status: InventoryStatus;
  createdAt: string;
  updatedAt: string;
}

export type GoldType =
  | 'RAW_GOLD'
  | 'GOLD_BAR'
  | 'GOLD_COIN'
  | 'JEWELRY'
  | 'SCRAP_GOLD'
  | 'GOLD_DUST';

export type InventoryStatus = 'AVAILABLE' | 'RESERVED' | 'IN_PRODUCTION' | 'SOLD' | 'DAMAGED';

// Order types
export interface Order {
  id: string;
  orderNumber: string;
  customerId: string | null;
  userId: string;
  departmentId: string;
  status: OrderStatus;
  totalWeight: number;
  totalAmount: number;
  notes: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  inventoryId: string;
  quantity: number;
  weightGrams: number;
  pricePerGram: number;
  totalPrice: number;
}

export type OrderStatus = 'DRAFT' | 'IN_FACTORY' | 'COMPLETED';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: LoginResponse) => void;
  logout: () => void;
}
