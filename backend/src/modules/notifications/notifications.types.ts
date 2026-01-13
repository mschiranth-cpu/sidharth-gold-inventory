import { NotificationType, NotificationPriority } from '@prisma/client';

export interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  orderId?: string;
  actionUrl?: string;
  actionLabel?: string;
  expiresAt?: Date;
  metadata?: any;
}

export interface NotificationFilters {
  isRead?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
  userId?: string;
  limit?: number;
  offset?: number;
}

export interface NotificationResponse {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  orderId?: string;
  order?: {
    id: string;
    orderNumber: string;
    customerName: string;
  };
  actionUrl?: string;
  actionLabel?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
  metadata?: any;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

// Socket.IO event constants
export const SOCKET_EVENTS = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',

  // Notification events
  NEW_NOTIFICATION: 'new_notification',
  NOTIFICATION_READ: 'notification_read',
  NOTIFICATIONS_CLEAR: 'notifications_clear',

  // Room events
  JOIN_USER_ROOM: 'join_user_room',
  LEAVE_USER_ROOM: 'leave_user_room',

  // Order events (for real-time updates)
  ORDER_UPDATED: 'order_updated',
  DEPARTMENT_STATUS_CHANGED: 'department_status_changed',
} as const;
