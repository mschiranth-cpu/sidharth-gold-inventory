import { OrderStatus } from '../../../types';

export interface CreateOrderRequest {
  customerId?: string;
  departmentId: string;
  notes?: string;
  items: {
    inventoryId: string;
    quantity: number;
  }[];
}

export interface UpdateOrderDetailsRequest {
  goldWeightInitial?: number;
  purity?: number;
  goldColor?: string;
  metalType?: 'GOLD' | 'SILVER' | 'PLATINUM';
  metalFinish?: string;
  customFinish?: string;
  size?: string;
  quantity?: number;
  productType?: string;
  customProductType?: string;
  dueDate?: string;
  additionalDescription?: string;
  specialInstructions?: string;
  referenceImages?: string[];
}

export interface UpdateStoneRequest {
  stoneType: string;
  stoneName?: string;
  customType?: string;
  weight: number;
  quantity?: number;
  color?: string;
  clarity?: string;
  cut?: string;
  shape?: string;
  customShape?: string;
  setting?: string;
  customSetting?: string;
  notes?: string;
}

export interface UpdateOrderRequest {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  productPhotoUrl?: string;
  status?: OrderStatus;
  priority?: number;
  orderDetails?: UpdateOrderDetailsRequest;
  stones?: UpdateStoneRequest[];
}

export interface OrderFilters {
  status?: OrderStatus | '';
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  assignedToId?: string;
}

export interface OrderListParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: OrderFilters;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  productImage?: string;
  status: OrderStatus;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  dueDate: string;
  grossWeight: number;
  metalType: 'GOLD' | 'SILVER' | 'PLATINUM';
  metalFinish?: string;
  customFinish?: string;
  purity: string;
  department?: {
    id: string;
    name: string;
  };
  currentStep?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersListResponse {
  orders: OrderListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// ORDER DETAIL PAGE TYPES
// ============================================

export interface OrderDetailWorker {
  id: string;
  name: string;
  avatar?: string;
  role: string;
}

export interface OrderDepartmentProgress {
  departmentId: string;
  departmentName: string;
  displayName: string;
  order: number;
  status: 'completed' | 'current' | 'pending' | 'skipped';
  assignedWorker?: OrderDetailWorker;
  enteredAt?: string;
  exitedAt?: string;
  duration?: number; // in minutes
  notes?: string;
}

export interface OrderFile {
  id: string;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  fileType: 'image' | 'document' | 'video';
  category: 'product' | 'department' | 'completion' | 'reference' | 'other';
  uploadedBy: string;
  uploadedAt: string;
  departmentId?: string;
  departmentName?: string;
  size: number; // bytes
}

export interface OrderActivityLog {
  id: string;
  action:
    | 'created'
    | 'updated'
    | 'status_changed'
    | 'department_changed'
    | 'file_uploaded'
    | 'note_added'
    | 'assigned'
    | 'completed';
  description: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: string;
  metadata?: {
    oldValue?: string;
    newValue?: string;
    departmentId?: string;
    departmentName?: string;
    fileId?: string;
    fileName?: string;
  };
}

export interface OrderStone {
  id: string;
  type: string;
  shape: string;
  size: string;
  quantity: number;
  weight: number;
  color?: string;
  clarity?: string;
  setting?: string;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;

  // Customer Info (visible to office staff only)
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;

  // Order Status
  status: OrderStatus;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

  // Dates
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  estimatedCompletionDate?: string;
  completedAt?: string;

  // Product Details
  productName?: string;
  productDescription?: string;
  productImage?: string;
  productImages?: string[];
  category?: string;
  subcategory?: string;
  size?: string;
  quantity?: number;

  // Gold/Metal Details
  metalType: 'GOLD' | 'SILVER' | 'PLATINUM';
  metalFinish?: string;
  customFinish?: string;
  purity: string;
  grossWeight: number;
  netWeight?: number;
  wastePercentage?: number;

  // Stone Details
  hasStones: boolean;
  stones?: OrderStone[];
  totalStoneWeight?: number;

  // Pricing (office only)
  makingCharges?: number;
  stoneCharges?: number;
  additionalCharges?: number;
  totalAmount?: number;
  advanceReceived?: number;
  balanceDue?: number;

  // Department Tracking
  currentDepartment?: {
    id: string;
    name: string;
    displayName: string;
  };
  departmentProgress: OrderDepartmentProgress[];

  // Files
  files: OrderFile[];

  // Activity
  activityLog: OrderActivityLog[];

  // Additional
  notes?: string;
  specialInstructions?: string;
  createdBy: {
    id: string;
    name: string;
  };
  assignedTo?: OrderDetailWorker;
}
