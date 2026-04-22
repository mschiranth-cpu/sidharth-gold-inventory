/**
 * ============================================
 * CLIENT PORTAL SERVICE
 * ============================================
 */

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '../../utils/logger';
import {
  CreateClientRequest,
  UpdateClientRequest,
  ApproveClientRequest,
  ClientOrderRequest,
  OrderCommentRequest,
} from './clients.types';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

/**
 * Create a new client account
 */
export async function createClient(data: CreateClientRequest, createdById?: string) {
  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  // Create user with CLIENT role
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: UserRole.CLIENT,
      isActive: true,
    },
  });

  // Create client profile
  const client = await prisma.client.create({
    data: {
      userId: user.id,
      businessName: data.businessName,
      businessType: data.businessType,
      gstNumber: data.gstNumber,
      panNumber: data.panNumber,
      contactPerson: data.contactPerson,
      phone: data.phone,
      alternatePhone: data.alternatePhone,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      registrationMethod: data.registrationMethod || 'ADMIN_CREATED',
      approvalStatus: data.registrationMethod === 'SELF_REGISTERED' ? 'PENDING' : 'APPROVED',
      approvedById: data.registrationMethod === 'ADMIN_CREATED' ? createdById : undefined,
      approvedAt: data.registrationMethod === 'ADMIN_CREATED' ? new Date() : undefined,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  logger.info('Client created', { clientId: client.id, userId: user.id });
  return client;
}

/**
 * Get all clients (Admin/Office Staff)
 */
export async function getAllClients(filters?: { approvalStatus?: string; search?: string }) {
  const where: any = {};

  if (filters?.approvalStatus) {
    where.approvalStatus = filters.approvalStatus;
  }

  if (filters?.search) {
    where.OR = [
      { businessName: { contains: filters.search, mode: 'insensitive' } },
      { user: { name: { contains: filters.search, mode: 'insensitive' } } },
      { user: { email: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  return await prisma.client.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      },
      orders: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          createdAt: true,
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get client by user ID
 */
export async function getClientByUserId(userId: string) {
  return await prisma.client.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
  });
}

/**
 * Get client by ID
 */
export async function getClientById(clientId: string) {
  return await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
      orders: {
        include: {
          orderDetails: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

/**
 * Update client profile
 */
export async function updateClient(clientId: string, data: UpdateClientRequest) {
  return await prisma.client.update({
    where: { id: clientId },
    data,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

/**
 * Approve or reject client registration
 */
export async function approveClient(data: ApproveClientRequest, approvedById: string) {
  return await prisma.client.update({
    where: { id: data.clientId },
    data: {
      approvalStatus: data.approved ? 'APPROVED' : 'REJECTED',
      approvedById: approvedById,
      approvedAt: new Date(),
      rejectionReason: data.approved ? null : data.rejectionReason,
    },
    include: {
      user: true,
    },
  });
}

/**
 * Create order from client portal
 */
export async function createClientOrder(
  clientId: string,
  userId: string,
  data: ClientOrderRequest
) {
  // Generate order number
  const lastOrder = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { orderNumber: true },
  });

  const year = new Date().getFullYear();
  const lastNumber = lastOrder?.orderNumber.match(/\d+$/)?.[0] || '0';
  const nextNumber = (parseInt(lastNumber) + 1).toString().padStart(5, '0');
  const orderNumber = `ORD-${year}-${nextNumber}`;

  // Create order with PENDING_APPROVAL status
  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      productPhotoUrl: data.productPhotoUrl,
      priority: data.priority || 0,
      status: 'DRAFT',
      createdById: userId,
      clientId: clientId,
      orderSource: 'CLIENT_PORTAL',
      approvalStatus: 'PENDING_APPROVAL',
      orderDetails: {
        create: {
          goldWeightInitial: data.goldWeightInitial,
          purity: data.purity,
          goldColor: data.goldColor,
          metalType: data.metalType || 'GOLD',
          size: data.size,
          quantity: data.quantity || 1,
          productType: data.productType,
          dueDate: data.dueDate,
          additionalDescription: data.additionalDescription,
          specialInstructions: data.specialInstructions,
          referenceImages: data.referenceImages || [],
          cadFiles: [],
          enteredById: userId,
        },
      },
    },
    include: {
      orderDetails: true,
      client: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  logger.info('Client order created', { orderId: order.id, clientId });
  return order;
}

/**
 * Get client orders
 */
export async function getClientOrders(clientId: string, filters?: { status?: string }) {
  const where: any = { clientId };

  if (filters?.status) {
    where.status = filters.status;
  }

  return await prisma.order.findMany({
    where,
    include: {
      orderDetails: true,
      departmentTracking: {
        include: {
          assignedTo: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { sequenceOrder: 'asc' },
      },
      comments: {
        where: { isInternal: false },
        include: {
          user: {
            select: {
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get orders pending approval (Office Staff/Admin)
 */
export async function getOrdersPendingApproval() {
  return await prisma.order.findMany({
    where: {
      orderSource: 'CLIENT_PORTAL',
      approvalStatus: 'PENDING_APPROVAL',
    },
    include: {
      orderDetails: true,
      client: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Approve or reject client order
 */
export async function approveClientOrder(
  orderId: string,
  approved: boolean,
  approvedById: string,
  rejectionReason?: string
) {
  return await prisma.order.update({
    where: { id: orderId },
    data: {
      approvalStatus: approved ? 'APPROVED' : 'REJECTED',
      approvedById,
      approvedAt: new Date(),
      rejectionReason: approved ? null : rejectionReason,
      status: approved ? 'DRAFT' : 'DRAFT', // Keep as DRAFT even if approved, staff will move to IN_FACTORY
    },
    include: {
      orderDetails: true,
      client: {
        include: {
          user: true,
        },
      },
    },
  });
}

/**
 * Add comment to order
 */
export async function addOrderComment(userId: string, data: OrderCommentRequest) {
  return await prisma.orderComment.create({
    data: {
      orderId: data.orderId,
      userId: userId,
      message: data.message,
      attachments: data.attachments || [],
      isInternal: data.isInternal || false,
    },
    include: {
      user: {
        select: {
          name: true,
          role: true,
        },
      },
    },
  });
}

/**
 * Get order comments
 */
export async function getOrderComments(orderId: string, includeInternal: boolean = false) {
  const where: any = { orderId };

  if (!includeInternal) {
    where.isInternal = false;
  }

  return await prisma.orderComment.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          role: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Mark comment as read
 */
export async function markCommentAsRead(commentId: string) {
  return await prisma.orderComment.update({
    where: { id: commentId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}
