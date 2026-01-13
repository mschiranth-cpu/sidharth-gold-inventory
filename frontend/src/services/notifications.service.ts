import api from './api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  priority: 'CRITICAL' | 'IMPORTANT' | 'INFO' | 'SUCCESS';
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
  readAt?: string;
  createdAt: string;
  expiresAt?: string;
  metadata?: any;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

/**
 * Get notifications for the current user
 */
export async function getNotifications(params?: {
  isRead?: boolean;
  type?: string;
  priority?: string;
  limit?: number;
  offset?: number;
}): Promise<NotificationsResponse> {
  const queryParams = new URLSearchParams();

  if (params?.isRead !== undefined) queryParams.append('isRead', String(params.isRead));
  if (params?.type) queryParams.append('type', params.type);
  if (params?.priority) queryParams.append('priority', params.priority);
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.offset) queryParams.append('offset', String(params.offset));

  const response = await api.get<NotificationsResponse>(`/notifications?${queryParams.toString()}`);
  return response.data;
}

/**
 * Get unread notifications count
 */
export async function getUnreadCount(): Promise<UnreadCountResponse> {
  const response = await api.get<UnreadCountResponse>('/notifications/unread-count');
  return response.data;
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<Notification> {
  const response = await api.patch<Notification>(`/notifications/${notificationId}/read`);
  return response.data;
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<{ count: number }> {
  const response = await api.post<{ count: number }>('/notifications/mark-all-read');
  return response.data;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await api.delete(`/notifications/${notificationId}`);
}
