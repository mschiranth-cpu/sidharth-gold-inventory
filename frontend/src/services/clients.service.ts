/**
 * ============================================
 * CLIENT PORTAL SERVICE
 * ============================================
 */

import api from './api';

export interface Client {
  id: string;
  userId: string;
  businessName?: string;
  businessType?: string;
  gstNumber?: string;
  panNumber?: string;
  contactPerson?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  registrationMethod: string;
  approvalStatus: string;
  approvedById?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notifyByEmail: boolean;
  notifyBySms: boolean;
  notifyByWhatsApp: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface ClientOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  approvalStatus?: string;
  rejectionReason?: string;
  createdAt: string;
  orderDetails?: any;
  departmentTracking?: any[];
  comments?: OrderComment[];
  client?: {
    id: string;
    businessName?: string;
    user?: {
      name: string;
      email: string;
    };
  };
}

export interface OrderComment {
  id: string;
  orderId: string;
  userId: string;
  message: string;
  attachments: string[];
  isInternal: boolean;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  user?: {
    name: string;
    role: string;
    avatar?: string;
  };
}

/**
 * Self-register as client
 */
export async function selfRegister(data: {
  email: string;
  password: string;
  name: string;
  businessName?: string;
  phone?: string;
}) {
  const response = await api.post('/clients/register', data);
  return response.data;
}

/**
 * Get my client profile
 */
export async function getMyProfile(): Promise<Client> {
  const response = await api.get('/clients/profile');
  return response.data.data;
}

/**
 * Update client profile
 */
export async function updateProfile(clientId: string, data: Partial<Client>) {
  const response = await api.put(`/clients/profile/${clientId}`, data);
  return response.data.data;
}

/**
 * Create order from client portal
 */
export async function createClientOrder(data: {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  productPhotoUrl?: string;
  goldWeightInitial?: number;
  purity: number;
  goldColor?: string;
  metalType?: string;
  size?: string;
  quantity?: number;
  productType?: string;
  dueDate: Date;
  additionalDescription?: string;
  specialInstructions?: string;
  referenceImages?: string[];
}) {
  const response = await api.post('/clients/orders', data);
  return response.data.data;
}

/**
 * Get my orders
 */
export async function getMyOrders(status?: string): Promise<ClientOrder[]> {
  const params = status ? { status } : {};
  const response = await api.get('/clients/orders', { params });
  return response.data.data;
}

/**
 * Add comment to order
 */
export async function addOrderComment(data: {
  orderId: string;
  message: string;
  attachments?: string[];
}) {
  const response = await api.post('/clients/comments', data);
  return response.data.data;
}

/**
 * Get order comments
 */
export async function getOrderComments(
  orderId: string,
  includeInternal: boolean = false
): Promise<OrderComment[]> {
  const response = await api.get(`/clients/orders/${orderId}/comments`, {
    params: { includeInternal },
  });
  return response.data.data;
}

/**
 * Mark comment as read
 */
export async function markCommentAsRead(commentId: string) {
  const response = await api.put(`/clients/comments/${commentId}/read`);
  return response.data.data;
}

// Admin/Office Staff functions

/**
 * Get all clients (Admin/Staff)
 */
export async function getAllClients(filters?: {
  approvalStatus?: string;
  search?: string;
}): Promise<Client[]> {
  const response = await api.get('/clients', { params: filters });
  return response.data.data;
}

/**
 * Get client by ID (Admin/Staff)
 */
export async function getClientById(clientId: string): Promise<Client> {
  const response = await api.get(`/clients/${clientId}`);
  return response.data.data;
}

/**
 * Approve/reject client (Admin/Staff)
 */
export async function approveClient(data: {
  clientId: string;
  approved: boolean;
  rejectionReason?: string;
}) {
  const response = await api.post('/clients/approve', data);
  return response.data.data;
}

/**
 * Get orders pending approval (Admin/Staff)
 */
export async function getOrdersPendingApproval(): Promise<ClientOrder[]> {
  const response = await api.get('/clients/orders/pending-approval');
  return response.data.data;
}

/**
 * Approve/reject client order (Admin/Staff)
 */
export async function approveClientOrder(
  orderId: string,
  data: {
    approved: boolean;
    rejectionReason?: string;
  }
) {
  const response = await api.post(`/clients/orders/${orderId}/approve`, data);
  return response.data.data;
}
