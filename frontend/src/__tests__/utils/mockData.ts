/**
 * ============================================
 * MOCK DATA FOR TESTING
 * ============================================
 * 
 * Sample data matching the application's types
 * for use in component tests.
 */

// ============================================
// USER DATA
// ============================================

export const mockUsersData = {
  admin: {
    id: 'user-admin-1',
    name: 'Admin User',
    email: 'admin@goldfactory.com',
    role: 'ADMIN' as const,
    department: null,
    phone: '+91 9876543210',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2025-01-09T10:30:00Z',
  },
  officeStaff: {
    id: 'user-office-1',
    name: 'Office Staff',
    email: 'office@goldfactory.com',
    role: 'OFFICE_STAFF' as const,
    department: null,
    phone: '+91 9876543211',
    isActive: true,
    createdAt: '2024-01-15T00:00:00Z',
    lastLoginAt: '2025-01-09T09:00:00Z',
  },
  factoryManager: {
    id: 'user-factory-1',
    name: 'Factory Manager',
    email: 'factory@goldfactory.com',
    role: 'FACTORY_MANAGER' as const,
    department: null,
    phone: '+91 9876543212',
    isActive: true,
    createdAt: '2024-02-01T00:00:00Z',
    lastLoginAt: '2025-01-09T08:00:00Z',
  },
  worker: {
    id: 'user-worker-1',
    name: 'Department Worker',
    email: 'worker@goldfactory.com',
    role: 'DEPARTMENT_WORKER' as const,
    department: 'MOULDING',
    phone: '+91 9876543213',
    isActive: true,
    createdAt: '2024-03-01T00:00:00Z',
    lastLoginAt: '2025-01-09T07:30:00Z',
  },
};

// ============================================
// ORDER DATA
// ============================================

export const mockOrdersData = [
  {
    id: 'order-1',
    orderNumber: 'ORD-2026-1001',
    customerName: 'Arjun Jewellers',
    customerPhone: '+91 9988776655',
    customerEmail: 'arjun@jewellers.com',
    productImage: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100&h=100&fit=crop',
    status: 'IN_PROGRESS' as const,
    priority: 'HIGH' as const,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    grossWeight: 25.5,
    metalType: 'GOLD' as const,
    purity: '22K',
    department: { id: '1', name: 'Setting' },
    currentStep: 'Stone Setting',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'order-2',
    orderNumber: 'ORD-2026-1002',
    customerName: 'Gold Palace',
    customerPhone: '+91 9988776656',
    customerEmail: 'contact@goldpalace.com',
    status: 'PENDING' as const,
    priority: 'NORMAL' as const,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    grossWeight: 15.0,
    metalType: 'GOLD' as const,
    purity: '18K',
    department: { id: '2', name: 'CAD' },
    currentStep: 'CAD Design',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'order-3',
    orderNumber: 'ORD-2026-1003',
    customerName: 'Diamond House',
    customerPhone: '+91 9988776657',
    customerEmail: 'info@diamondhouse.com',
    status: 'COMPLETED' as const,
    priority: 'LOW' as const,
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    grossWeight: 50.0,
    metalType: 'GOLD' as const,
    purity: '22K',
    department: { id: '3', name: 'Quality Control' },
    currentStep: 'Final QC',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'order-4',
    orderNumber: 'ORD-2026-1004',
    customerName: 'Royal Gems',
    customerPhone: '+91 9988776658',
    status: 'DRAFT' as const,
    priority: 'URGENT' as const,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    grossWeight: 8.5,
    metalType: 'SILVER' as const,
    purity: '14K',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'order-5',
    orderNumber: 'ORD-2026-1005',
    customerName: 'Silver Touch',
    customerPhone: '+91 9988776659',
    status: 'QUALITY_CHECK' as const,
    priority: 'NORMAL' as const,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    grossWeight: 35.0,
    metalType: 'PLATINUM' as const,
    purity: '24K',
    department: { id: '4', name: 'Polish' },
    currentStep: 'Final Polish',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================
// KANBAN DATA
// ============================================

export const mockKanbanOrders = [
  {
    id: 'kanban-1',
    orderNumber: 'ORD-2026-1001',
    customerName: 'Arjun Jewellers',
    priority: 'HIGH' as const,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    currentDepartment: 'cad',
    status: 'IN_PROGRESS' as const,
    grossWeight: 25.5,
    purity: '22K',
    metalType: 'GOLD' as const,
    assignedWorker: { id: 'w1', name: 'Rajesh Kumar', department: 'CAD' },
    enteredDepartmentAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'kanban-2',
    orderNumber: 'ORD-2026-1002',
    customerName: 'Gold Palace',
    priority: 'NORMAL' as const,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    currentDepartment: 'print',
    status: 'WAITING' as const,
    grossWeight: 15.0,
    purity: '18K',
    metalType: 'GOLD' as const,
    enteredDepartmentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'kanban-3',
    orderNumber: 'ORD-2026-1003',
    customerName: 'Diamond House',
    priority: 'URGENT' as const,
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    currentDepartment: 'casting',
    status: 'IN_PROGRESS' as const,
    grossWeight: 50.0,
    purity: '22K',
    metalType: 'GOLD' as const,
    assignedWorker: { id: 'w2', name: 'Priya Sharma', department: 'Casting' },
    enteredDepartmentAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'kanban-4',
    orderNumber: 'ORD-2026-1004',
    customerName: 'Royal Gems',
    priority: 'LOW' as const,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    currentDepartment: 'polish1',
    status: 'COMPLETED' as const,
    grossWeight: 8.5,
    purity: '14K',
    metalType: 'SILVER' as const,
    enteredDepartmentAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockKanbanDepartments = [
  { id: 'cad', name: 'CAD', displayName: 'CAD Design' },
  { id: 'print', name: 'Print', displayName: '3D Print' },
  { id: 'casting', name: 'Casting', displayName: 'Casting' },
  { id: 'polish1', name: 'Polish 1', displayName: 'Initial Polish' },
  { id: 'setting', name: 'Setting', displayName: 'Stone Setting' },
  { id: 'polish2', name: 'Polish 2', displayName: 'Final Polish' },
  { id: 'qc', name: 'QC', displayName: 'Quality Control' },
];

// ============================================
// DASHBOARD DATA
// ============================================

export const mockDashboardData = {
  metrics: {
    totalOrders: 156,
    ordersInProgress: 42,
    completedToday: 8,
    pendingApproval: 5,
  },
  orderStatusDistribution: [
    { name: 'Draft', value: 12, color: '#9CA3AF' },
    { name: 'Pending', value: 25, color: '#FBBF24' },
    { name: 'In Progress', value: 42, color: '#3B82F6' },
    { name: 'Quality Check', value: 15, color: '#8B5CF6' },
    { name: 'Completed', value: 52, color: '#10B981' },
    { name: 'Delivered', value: 10, color: '#059669' },
  ],
  departmentWorkload: [
    { department: 'CAD', orders: 8, workers: 3 },
    { department: 'Print', orders: 5, workers: 2 },
    { department: 'Casting', orders: 12, workers: 4 },
    { department: 'Polish', orders: 9, workers: 3 },
    { department: 'Setting', orders: 6, workers: 2 },
    { department: 'QC', orders: 2, workers: 1 },
  ],
  recentActivity: [
    {
      id: 'activity-1',
      type: 'order_created',
      message: 'New order ORD-2026-1001 created',
      user: 'Admin User',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'activity-2',
      type: 'status_changed',
      message: 'Order ORD-2026-0998 moved to Polish',
      user: 'Factory Manager',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'activity-3',
      type: 'order_completed',
      message: 'Order ORD-2026-0995 completed',
      user: 'Department Worker',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

// ============================================
// SUBMISSION DATA
// ============================================

export const mockSubmissions = [
  {
    id: 'submission-1',
    orderId: 'order-1',
    orderNumber: 'ORD-2026-1001',
    finalWeight: 24.8,
    initialWeight: 25.5,
    variancePercentage: 2.7,
    status: 'PENDING' as const,
    submittedBy: 'Factory Manager',
    submittedAt: new Date().toISOString(),
    notes: 'Minor gold loss during polishing',
  },
  {
    id: 'submission-2',
    orderId: 'order-2',
    orderNumber: 'ORD-2026-1002',
    finalWeight: 14.5,
    initialWeight: 15.0,
    variancePercentage: 3.3,
    status: 'APPROVED' as const,
    submittedBy: 'Factory Manager',
    submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    approvedBy: 'Admin User',
    approvedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================
// AUTH TOKENS
// ============================================

export const mockTokens = {
  accessToken: 'mock-access-token-12345',
  refreshToken: 'mock-refresh-token-67890',
  expiresIn: 3600,
};

// ============================================
// API RESPONSES
// ============================================

export const mockApiResponses = {
  loginSuccess: {
    success: true,
    data: {
      user: mockUsersData.admin,
      ...mockTokens,
    },
    message: 'Login successful',
  },
  loginFailure: {
    success: false,
    message: 'Invalid email or password',
  },
  ordersListSuccess: {
    success: true,
    data: mockOrdersData,
    pagination: {
      total: 47,
      page: 1,
      limit: 10,
      totalPages: 5,
    },
  },
  dashboardSuccess: {
    success: true,
    data: mockDashboardData,
  },
  createOrderSuccess: {
    success: true,
    data: mockOrdersData[0],
    message: 'Order created successfully',
  },
};

// ============================================
// FORM DATA
// ============================================

export const mockFormData = {
  validLogin: {
    email: 'admin@goldfactory.com',
    password: 'Password@123',
    rememberMe: false,
  },
  invalidLogin: {
    email: 'invalid@email',
    password: '123',
  },
  validOrder: {
    basicInfo: {
      orderNumber: 'ORD-2026-TEST',
      customerName: 'Test Customer',
      customerPhone: '+91 9876543210',
      customerEmail: 'test@customer.com',
    },
    goldDetails: {
      metalType: 'GOLD',
      grossWeight: 25.5,
      purity: '22K',
    },
    stoneDetails: {
      hasStones: false,
      stones: [],
    },
    additionalInfo: {
      size: '18',
      priority: 'NORMAL',
      description: 'Test order description',
    },
  },
};
