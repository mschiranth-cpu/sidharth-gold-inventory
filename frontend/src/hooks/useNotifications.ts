/**
 * ============================================
 * USE NOTIFICATIONS HOOK
 * ============================================
 *
 * React hook for managing notifications state
 * with real-time Socket.io integration.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { getAccessToken } from '../services/auth.service';
import type { Notification as NotificationModel } from '../services/notifications.service';
import type { NotificationType, NotificationFilters } from '../types/notification.types';
import { SOCKET_EVENTS, NOTIFICATION_CONFIG } from '../types/notification.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

interface UseNotificationsReturn {
  notifications: NotificationModel[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => void;
  addNotification: (notification: NotificationModel) => void;
}

export function useNotifications(): UseNotificationsReturn {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    const stored = localStorage.getItem('notificationSoundEnabled');
    return stored === null ? true : stored === 'true';
  });

  const socketRef = useRef<Socket | null>(null);

  // Update localStorage when sound setting changes
  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem('notificationSoundEnabled', enabled.toString());
  }, []);

  // Get current token
  const getToken = useCallback((): string | null => {
    return getAccessToken();
  }, []);

  // Fetch notifications from API
  const fetchNotifications = useCallback(
    async (filters?: NotificationFilters) => {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filters?.unreadOnly) params.append('unreadOnly', 'true');
        if (filters?.type) params.append('type', filters.type);
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.offset) params.append('offset', filters.offset.toString());

        const response = await fetch(`${API_URL}/notifications?${params}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        // Handle 401 gracefully - user may not be fully authenticated yet
        if (response.status === 401) {
          console.warn('Notifications: Not authenticated yet');
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();

        // Enrich notifications with config
        const enrichedNotifications =
          data.notifications?.map((n: NotificationModel) => ({
            ...n,
            config:
              NOTIFICATION_CONFIG[n.type as NotificationType] || NOTIFICATION_CONFIG.SYSTEM_ALERT,
          })) || [];

        setNotifications(enrichedNotifications);
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        // Don't set error for auth issues - just log
        console.warn('Error fetching notifications:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [getToken]
  );

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      const token = getToken();
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to mark notification as read');
        }

        // Update local state
        setNotifications((prev: NotificationModel[]) =>
          prev.map((n: NotificationModel) =>
            n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        );
        setUnreadCount((prev: number) => Math.max(0, prev - 1));

        // Emit socket event
        if (socketRef.current?.connected) {
          socketRef.current.emit(SOCKET_EVENTS.NOTIFICATION_READ, { notificationId });
        }
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    },
    [getToken]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update local state
      setNotifications((prev: NotificationModel[]) =>
        prev.map((n: NotificationModel) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [getToken]);

  // Clear all notifications from state
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Add a notification to state
  const addNotification = useCallback((notification: NotificationModel) => {
    const enrichedNotification = {
      ...notification,
      config:
        NOTIFICATION_CONFIG[notification.type as NotificationType] ||
        NOTIFICATION_CONFIG.SYSTEM_ALERT,
    };

    setNotifications((prev: NotificationModel[]) => [enrichedNotification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount((prev: number) => prev + 1);
    }
  }, []);

  // Initialize Socket.io connection
  useEffect(() => {
    const token = getToken();
    if (!isAuthenticated || !token || !user) return;

    // Validate token looks like a JWT (has 3 parts separated by dots)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.warn('🔌 Socket: Invalid token format, skipping connection');
      return;
    }

    // Create socket connection
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('🔌 Socket connected');
      setIsConnected(true);

      // Join user room
      socket.emit(SOCKET_EVENTS.JOIN_USER_ROOM, `user:${user.id}`);
    });

    socket.on('disconnect', (reason: string) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error: Error) => {
      // Don't spam console with auth errors
      if (error.message?.includes('authentication') || error.message?.includes('token')) {
        console.warn('🔌 Socket auth error - will retry on next login');
      } else {
        console.error('🔌 Socket connection error:', error.message);
      }
      setIsConnected(false);
    });

    // New notification event
    socket.on(SOCKET_EVENTS.NEW_NOTIFICATION, (notification: NotificationModel) => {
      console.log('🔔 New notification received:', notification);
      addNotification(notification);

      // Play notification sound if enabled
      const isSoundEnabled = localStorage.getItem('notificationSoundEnabled') !== 'false';
      if (isSoundEnabled) {
        playNotificationSound();
      }

      // Show browser notification
      showBrowserNotification(notification);

      // Show toast notification (imported dynamically to avoid circular dependency)
      showToastNotification(notification);
    });

    // Cleanup on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off(SOCKET_EVENTS.NEW_NOTIFICATION);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user, addNotification, getToken]);

  // Fetch notifications on mount (with delay to ensure token is stored)
  useEffect(() => {
    if (isAuthenticated) {
      // Small delay to ensure token is stored in localStorage after login
      const timer = setTimeout(() => {
        const token = getToken();
        if (token) {
          fetchNotifications({ limit: 100 });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isAuthenticated, fetchNotifications, getToken]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    isConnected,
    soundEnabled,
    setSoundEnabled,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    addNotification,
  };
}

// Helper: Play notification sound
function playNotificationSound() {
  try {
    // Try to play MP3 file first
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Fallback to Web Audio API beep if MP3 fails
      playBeepSound();
    });
  } catch {
    // Fallback to Web Audio API beep
    playBeepSound();
  }
}

// Helper: Play beep sound using Web Audio API
function playBeepSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch {
    // Audio not supported
  }
}

// Helper: Show browser notification
function showBrowserNotification(notificationData: NotificationModel) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    new Notification(notificationData.title, {
      body: notificationData.message,
      icon: '/favicon.ico',
      tag: notificationData.id,
    });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification(notificationData.title, {
          body: notificationData.message,
          icon: '/favicon.ico',
          tag: notificationData.id,
        });
      }
    });
  }
}

// Helper: Show toast notification
function showToastNotification(notificationData: NotificationModel): void {
  // Dynamically import toast to avoid circular dependency
  import('react-hot-toast').then(({ default: toast }) => {
    const message = `${notificationData.title}: ${notificationData.message}`;

    // Different toast style based on priority
    if (notificationData.priority === 'CRITICAL') {
      toast.error(message, { duration: 6000, position: 'top-right' });
    } else if (notificationData.priority === 'IMPORTANT') {
      toast(message, {
        duration: 5000,
        position: 'top-right',
        icon: '🟡',
        style: { border: '2px solid #f59e0b' },
      });
    } else if (notificationData.priority === 'SUCCESS') {
      toast.success(message, { duration: 4000, position: 'top-right' });
    } else {
      toast(message, { duration: 4000, position: 'top-right', icon: '🔵' });
    }
  });
}

export default useNotifications;
