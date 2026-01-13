import { PrismaClient, NotificationType, NotificationPriority } from '@prisma/client';
import { Server as SocketServer } from 'socket.io';
import {
  CreateNotificationDTO,
  NotificationFilters,
  NotificationResponse,
  UnreadCountResponse,
  SOCKET_EVENTS,
} from './notifications.types';

const prisma = new PrismaClient();

// Socket.io server instance (set by socket setup)
let io: SocketServer | null = null;

/**
 * Set the Socket.io server instance
 */
export function setSocketServer(socketServer: SocketServer): void {
  io = socketServer;
  console.log('Socket.io server connected to notification service');
}

/**
 * Create a new notification
 */
export async function createNotification(
  data: CreateNotificationDTO
): Promise<NotificationResponse> {
  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      priority: data.priority || NotificationPriority.INFO,
      title: data.title,
      message: data.message,
      orderId: data.orderId,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel,
      expiresAt: data.expiresAt,
      metadata: data.metadata,
    },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
        },
      },
    },
  });

  // Emit socket event for real-time notification
  if (io) {
    io.to(`user:${data.userId}`).emit(SOCKET_EVENTS.NEW_NOTIFICATION, {
      notification,
    });
  }

  return notification as NotificationResponse;
}

/**
 * Get notifications for a user with filters
 */
export async function getNotifications(
  filters: NotificationFilters
): Promise<{ notifications: NotificationResponse[]; total: number }> {
  const where: any = {};

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.isRead !== undefined) {
    where.isRead = filters.isRead;
  }

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  // Get total count
  const total = await prisma.notification.count({ where });

  // Get notifications with pagination
  const notifications = await prisma.notification.findMany({
    where,
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: filters.limit || 50,
    skip: filters.offset || 0,
  });

  return {
    notifications: notifications as NotificationResponse[],
    total,
  };
}

/**
 * Get unread notifications count for a user
 */
export async function getUnreadCount(userId: string): Promise<UnreadCountResponse> {
  const unreadCount = await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });

  return { unreadCount };
}

/**
 * Mark a notification as read
 */
export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<NotificationResponse> {
  const notification = await prisma.notification.update({
    where: {
      id: notificationId,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
        },
      },
    },
  });

  // Emit socket event for real-time update
  if (io) {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.NOTIFICATION_READ, {
      notificationId,
    });
  }

  return notification as NotificationResponse;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<{ count: number }> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  // Emit socket event for real-time update
  if (io) {
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.NOTIFICATIONS_CLEAR, {
      userId,
    });
  }

  return { count: result.count };
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  await prisma.notification.delete({
    where: {
      id: notificationId,
    },
  });
}

/**
 * Delete old notifications (cleanup job)
 */
export async function deleteExpiredNotifications(): Promise<{ count: number }> {
  const result = await prisma.notification.deleteMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
    },
  });

  return { count: result.count };
}

/**
 * Helper: Create notification for new worker assignment
 */
export async function createAssignmentNotification(
  workerId: string,
  orderId: string,
  orderNumber: string,
  isUrgent: boolean = false
): Promise<NotificationResponse> {
  return createNotification({
    userId: workerId,
    type: isUrgent ? NotificationType.URGENT_ASSIGNMENT : NotificationType.NEW_ASSIGNMENT,
    priority: isUrgent ? NotificationPriority.IMPORTANT : NotificationPriority.INFO,
    title: isUrgent ? '🔥 Urgent Assignment!' : '📦 New Assignment',
    message: `You have been assigned to work on order ${orderNumber}`,
    orderId,
    actionUrl: `/orders/${orderId}/work`,
    actionLabel: 'Start Work',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expires in 30 days
  });
}

/**
 * Helper: Create notification for work approval
 */
export async function createWorkApprovedNotification(
  workerId: string,
  orderId: string,
  orderNumber: string,
  departmentName: string
): Promise<NotificationResponse> {
  return createNotification({
    userId: workerId,
    type: NotificationType.WORK_APPROVED,
    priority: NotificationPriority.SUCCESS,
    title: '✅ Work Approved',
    message: `Your ${departmentName} work on order ${orderNumber} has been approved`,
    orderId,
    actionUrl: `/orders/${orderId}`,
    actionLabel: 'View Order',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
  });
}

/**
 * Helper: Create notification for work rejection
 */
export async function createWorkRejectedNotification(
  workerId: string,
  orderId: string,
  orderNumber: string,
  departmentName: string,
  reason: string
): Promise<NotificationResponse> {
  return createNotification({
    userId: workerId,
    type: NotificationType.WORK_REJECTED,
    priority: NotificationPriority.CRITICAL,
    title: '⚠️ Work Needs Revision',
    message: `Your ${departmentName} work on order ${orderNumber} needs revision. Reason: ${reason}`,
    orderId,
    actionUrl: `/orders/${orderId}/work`,
    actionLabel: 'Review Work',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
    metadata: { reason, departmentName },
  });
}

/**
 * Helper: Create notification for order completion (for admins)
 */
export async function createOrderCompletedNotification(
  adminIds: string[],
  orderId: string,
  orderNumber: string,
  customerName: string
): Promise<void> {
  const promises = adminIds.map((adminId) =>
    createNotification({
      userId: adminId,
      type: NotificationType.ORDER_COMPLETED,
      priority: NotificationPriority.SUCCESS,
      title: '🎉 Order Completed',
      message: `Order ${orderNumber} for ${customerName} has been completed`,
      orderId,
      actionUrl: `/orders/${orderId}`,
      actionLabel: 'View Order',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
  );

  await Promise.all(promises);
}
