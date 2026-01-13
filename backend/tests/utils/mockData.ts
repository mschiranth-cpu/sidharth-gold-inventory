/**
 * ============================================
 * MOCK TEST DATA
 * ============================================
 *
 * Sample data for testing API endpoints.
 * All data is type-safe and matches the Prisma schema.
 */

import { UserRole, OrderStatus, DepartmentName, StoneType, DepartmentStatus } from '@prisma/client';

// ============================================
// USER DATA
// ============================================

export const mockUsers = {
  admin: {
    name: 'Admin User',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@goldfactory.test',
    password: 'Admin@123456',
    role: 'ADMIN' as UserRole,
    phone: '+91 9876543210',
  },
  officeStaff: {
    name: 'Office Staff User',
    firstName: 'Office',
    lastName: 'Staff',
    email: 'office@goldfactory.test',
    password: 'Office@123456',
    role: 'OFFICE_STAFF' as UserRole,
    phone: '+91 9876543211',
  },
  factoryManager: {
    name: 'Factory Manager User',
    email: 'factory@goldfactory.test',
    password: 'Factory@123456',
    role: 'FACTORY_MANAGER' as UserRole,
    department: 'CASTING' as DepartmentName,
    phone: '+91 9876543212',
  },
  departmentWorker: {
    name: 'Department Worker User',
    email: 'worker@goldfactory.test',
    password: 'Worker@123456',
    role: 'DEPARTMENT_WORKER' as UserRole,
    department: 'CAD' as DepartmentName,
    phone: '+91 9876543213',
  },
  inactiveUser: {
    name: 'Inactive User',
    email: 'inactive@goldfactory.test',
    password: 'Inactive@123456',
    role: 'DEPARTMENT_WORKER' as UserRole,
    isActive: false,
  },
};

// ============================================
// LOGIN DATA
// ============================================

export const mockLoginData = {
  valid: {
    email: mockUsers.admin.email,
    password: mockUsers.admin.password,
  },
  invalidEmail: {
    email: 'nonexistent@goldfactory.test',
    password: 'Password@123',
  },
  invalidPassword: {
    email: mockUsers.admin.email,
    password: 'WrongPassword@123',
  },
  invalidFormat: {
    email: 'not-an-email',
    password: 'short',
  },
  inactive: {
    email: mockUsers.inactiveUser.email,
    password: mockUsers.inactiveUser.password,
  },
};

// ============================================
// ORDER DATA
// ============================================

export const mockOrders = {
  validOrder: {
    customerName: 'Test Customer',
    customerPhone: '+91 9876543210',
    customerEmail: 'customer@test.com',
    priority: 5,
    orderDetails: {
      goldWeightInitial: 25.5,
      purity: 22,
      goldColor: 'Yellow',
      size: '18 inches',
      quantity: 1,
      productType: 'Necklace',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      additionalDescription: 'Intricate floral pattern',
      specialInstructions: 'Handle with care',
    },
    stones: [
      {
        stoneType: 'DIAMOND' as StoneType,
        weight: 0.5,
        quantity: 10,
        clarity: 'VS1',
        color: 'D',
        cut: 'Round Brilliant',
        setting: 'Prong',
      },
    ],
  },
  minimalOrder: {
    customerName: 'Minimal Customer',
    customerPhone: '+91 9876543211',
    orderDetails: {
      goldWeightInitial: 10.0,
      purity: 18,
      quantity: 1,
      productType: 'Ring',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    },
  },
  highPriorityOrder: {
    customerName: 'VIP Customer',
    customerPhone: '+91 9876543212',
    priority: 10,
    orderDetails: {
      goldWeightInitial: 100.0,
      purity: 24,
      goldColor: 'Yellow',
      quantity: 5,
      productType: 'Bangles',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    },
  },
  invalidOrder: {
    // Missing required fields
    customerName: '',
    orderDetails: {
      goldWeightInitial: -10, // Invalid negative
      purity: 30, // Invalid purity (max 24)
    },
  },
};

// ============================================
// DEPARTMENT TRACKING DATA
// ============================================

export const mockDepartmentData = {
  startDepartment: {
    departmentName: 'CAD' as DepartmentName,
    status: 'IN_PROGRESS' as DepartmentStatus,
    notes: 'Starting CAD design work',
  },
  completeDepartment: {
    status: 'COMPLETED' as DepartmentStatus,
    notes: 'CAD design completed',
    goldWeightOut: 25.3,
    photos: ['https://example.com/photo1.jpg'],
  },
  holdDepartment: {
    status: 'ON_HOLD' as DepartmentStatus,
    notes: 'Waiting for customer approval',
  },
  casting: {
    departmentName: 'CASTING' as DepartmentName,
    departmentType: 'CASTING',
    status: 'IN_PROGRESS' as DepartmentStatus,
    goldWeightIn: 25.5,
    goldWeightOut: 25.3,
    notes: 'Casting in progress',
  },
  setting: {
    departmentName: 'SETTING' as DepartmentName,
    departmentType: 'SETTING',
    status: 'IN_PROGRESS' as DepartmentStatus,
    goldWeightIn: 25.3,
    goldWeightOut: 25.2,
    notes: 'Stone setting in progress',
  },
  departmentWithPhotos: {
    departmentName: 'POLISH_1' as DepartmentName,
    status: 'COMPLETED' as DepartmentStatus,
    photos: [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg',
      'https://example.com/photo3.jpg',
    ],
    notes: 'Polishing completed - photos attached',
    goldWeightOut: 25.2,
  },
};

// ============================================
// SUBMISSION DATA
// ============================================

export const mockSubmissions = {
  validSubmission: {
    finalGoldWeight: 24.8,
    finalWeight: 25.3,
    finalStoneWeight: 0.5,
    finalPurity: 22,
    numberOfPieces: 1,
    totalWeight: 25.3,
    qualityGrade: 'A',
    qualityNotes: 'Excellent craftsmanship',
    completionPhotos: ['https://example.com/final1.jpg', 'https://example.com/final2.jpg'],
    certificateUrl: 'https://example.com/certificate.pdf',
  },
  withVariance: {
    finalGoldWeight: 23.5,
    finalWeight: 24.0,
    finalStoneWeight: 0.5,
    finalPurity: 22,
    acknowledgeVariance: true,
    qualityNotes: 'Minor variance acknowledged',
    completionPhotos: ['https://example.com/final.jpg'],
  },
  highVarianceSubmission: {
    finalGoldWeight: 20.0, // Significant variance from initial 25.5
    finalStoneWeight: 0.5,
    finalPurity: 22,
    completionPhotos: ['https://example.com/final.jpg'],
    acknowledgeVariance: true, // Required for high variance
    qualityNotes: 'Some gold loss during process',
  },
  missingPhotosSubmission: {
    finalGoldWeight: 24.8,
    finalStoneWeight: 0.5,
    finalPurity: 22,
    // Missing completionPhotos - should fail validation
  },
  invalidSubmission: {
    finalGoldWeight: -10, // Invalid negative weight
    finalPurity: 30, // Invalid purity
    completionPhotos: [],
  },
};

// ============================================
// APPROVAL DATA
// ============================================

export const mockApprovalData = {
  approve: {
    approved: true,
    notes: 'Customer satisfied with the final product',
  },
  reject: {
    approved: false,
    notes: 'Customer requested modifications',
    rejectionReason: 'Customer requested modifications',
  },
};

// ============================================
// FILTER/QUERY DATA
// ============================================

export const mockFilters = {
  pagination: {
    page: 1,
    limit: 10,
  },
  orderFilters: {
    status: 'IN_FACTORY' as OrderStatus,
    priorityMin: 5,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  searchQuery: {
    search: 'Test Customer',
  },
  dateRange: {
    createdFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    createdTo: new Date().toISOString(),
  },
};

// ============================================
// STONE DATA
// ============================================

export const mockStones = {
  diamond: {
    stoneType: 'DIAMOND' as StoneType,
    weight: 1.5,
    quantity: 5,
    clarity: 'VVS1',
    color: 'E',
    cut: 'Princess',
    setting: 'Channel',
  },
  ruby: {
    stoneType: 'RUBY' as StoneType,
    weight: 2.0,
    quantity: 3,
    color: 'Deep Red',
    cut: 'Oval',
    setting: 'Bezel',
  },
  multipleStones: [
    {
      stoneType: 'DIAMOND' as StoneType,
      weight: 0.25,
      quantity: 20,
    },
    {
      stoneType: 'EMERALD' as StoneType,
      weight: 0.5,
      quantity: 4,
    },
  ],
};

// ============================================
// REGISTRATION DATA
// ============================================

export const mockRegistration = {
  valid: {
    name: 'New User',
    email: 'newuser@goldfactory.test',
    password: 'NewUser@123456',
    confirmPassword: 'NewUser@123456',
    phone: '+91 9876543214',
    role: 'DEPARTMENT_WORKER' as UserRole,
  },
  weakPassword: {
    name: 'Weak Password User',
    email: 'weak@goldfactory.test',
    password: '123',
    confirmPassword: '123',
  },
  mismatchPassword: {
    name: 'Mismatch User',
    email: 'mismatch@goldfactory.test',
    password: 'Password@123',
    confirmPassword: 'Different@123',
  },
  duplicateEmail: {
    name: 'Duplicate User',
    email: mockUsers.admin.email, // Already exists
    password: 'Password@123',
    confirmPassword: 'Password@123',
  },
  invalidEmail: {
    name: 'Invalid Email User',
    email: 'not-an-email',
    password: 'Password@123',
    confirmPassword: 'Password@123',
  },
};

// ============================================
// PASSWORD CHANGE DATA
// ============================================

export const mockPasswordChange = {
  valid: {
    currentPassword: mockUsers.admin.password,
    newPassword: 'NewAdmin@123456',
    confirmPassword: 'NewAdmin@123456',
  },
  wrongCurrent: {
    currentPassword: 'WrongPassword@123',
    newPassword: 'NewAdmin@123456',
    confirmPassword: 'NewAdmin@123456',
  },
  mismatch: {
    currentPassword: mockUsers.admin.password,
    newPassword: 'NewAdmin@123456',
    confirmPassword: 'Different@123456',
  },
};
