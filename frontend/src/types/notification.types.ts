/**
 * ============================================
 * NOTIFICATION TYPES - FRONTEND
 * ============================================
 * 
 * TypeScript interfaces for notification system.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

export enum NotificationType {
  // Order Events
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_ASSIGNED = 'ORDER_ASSIGNED',
  ORDER_COMPLETED = 'ORDER_COMPLETED',
  ORDER_OVERDUE = 'ORDER_OVERDUE',
  ORDER_SUBMITTED = 'ORDER_SUBMITTED',
  
  // Department Events
  DEPARTMENT_STARTED = 'DEPARTMENT_STARTED',
  DEPARTMENT_COMPLETED = 'DEPARTMENT_COMPLETED',
  DEPARTMENT_ASSIGNED = 'DEPARTMENT_ASSIGNED',
  
  // Due Date Events
  DUE_DATE_REMINDER = 'DUE_DATE_REMINDER',
  DUE_DATE_TODAY = 'DUE_DATE_TODAY',
  
  // System Events
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  config?: NotificationConfig;
  metadata?: Record<string, any>;
}

export interface NotificationConfig {
  icon: string;
  color: string;
  priority: number;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface NotificationFilters {
  unreadOnly?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

// Socket Events
export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  NEW_NOTIFICATION: 'new_notification',
  NOTIFICATION_READ: 'notification_read',
  NOTIFICATIONS_CLEAR: 'notifications_clear',
  JOIN_USER_ROOM: 'join_user_room',
  LEAVE_USER_ROOM: 'leave_user_room',
  ORDER_UPDATED: 'order_updated',
  DEPARTMENT_STATUS_CHANGED: 'department_status_changed',
} as const;

// Notification Icon and Color Configuration
export const NOTIFICATION_CONFIG: Record<NotificationType, NotificationConfig> = {
  [NotificationType.ORDER_CREATED]: { icon: 'plus-circle', color: 'green', priority: 1 },
  [NotificationType.ORDER_ASSIGNED]: { icon: 'user-plus', color: 'blue', priority: 2 },
  [NotificationType.ORDER_COMPLETED]: { icon: 'check-circle', color: 'green', priority: 2 },
  [NotificationType.ORDER_OVERDUE]: { icon: 'alert-triangle', color: 'red', priority: 5 },
  [NotificationType.ORDER_SUBMITTED]: { icon: 'send', color: 'purple', priority: 3 },
  [NotificationType.DEPARTMENT_STARTED]: { icon: 'play', color: 'amber', priority: 2 },
  [NotificationType.DEPARTMENT_COMPLETED]: { icon: 'check', color: 'green', priority: 2 },
  [NotificationType.DEPARTMENT_ASSIGNED]: { icon: 'user', color: 'blue', priority: 3 },
  [NotificationType.DUE_DATE_REMINDER]: { icon: 'clock', color: 'orange', priority: 4 },
  [NotificationType.DUE_DATE_TODAY]: { icon: 'calendar', color: 'red', priority: 5 },
  [NotificationType.SYSTEM_ALERT]: { icon: 'info', color: 'gray', priority: 1 },
};

// Color classes for each notification color
export const NOTIFICATION_COLORS: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  green: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    iconBg: 'bg-green-100',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    iconBg: 'bg-red-100',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    iconBg: 'bg-orange-100',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    iconBg: 'bg-purple-100',
  },
  gray: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    iconBg: 'bg-gray-100',
  },
};
