/**
 * ============================================
 * NOTIFICATION DROPDOWN COMPONENT
 * ============================================
 *
 * Dropdown list showing recent notifications with
 * icons, colors, and mark as read functionality.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send,
  Play,
  User,
  UserPlus,
  PlusCircle,
  Calendar,
  Info,
  X,
  CheckCheck,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';
import type { Notification as NotificationModel } from '../../types/notification.types';
import {
  NotificationType,
  NOTIFICATION_CONFIG,
  NOTIFICATION_COLORS,
} from '../../types/notification.types';

interface NotificationDropdownProps {
  notifications: NotificationModel[];
  unreadCount: number;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  isLoading?: boolean;
}

// Icon mapping for notification types
const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  'plus-circle': PlusCircle,
  'user-plus': UserPlus,
  'check-circle': CheckCircle,
  'alert-triangle': AlertTriangle,
  send: Send,
  play: Play,
  check: Check,
  user: User,
  clock: Clock,
  calendar: Calendar,
  info: Info,
};

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  isLoading = false,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Check if click was on the bell button
        const bellButton = (event.target as HTMLElement).closest('[aria-label*="Notifications"]');
        if (!bellButton) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Handle notification click
  const handleNotificationClick = (notification: NotificationModel) => {
    // Mark as read
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }

    // Navigate to related item
    if (notification.relatedId) {
      switch (notification.type) {
        case NotificationType.ORDER_CREATED:
        case NotificationType.ORDER_ASSIGNED:
        case NotificationType.ORDER_COMPLETED:
        case NotificationType.ORDER_OVERDUE:
        case NotificationType.ORDER_SUBMITTED:
          navigate(`/orders/${notification.relatedId}`);
          break;
        case NotificationType.DEPARTMENT_STARTED:
        case NotificationType.DEPARTMENT_COMPLETED:
        case NotificationType.DEPARTMENT_ASSIGNED:
          navigate(`/factory-tracking`);
          break;
        default:
          // No navigation for system alerts
          break;
      }
      onClose();
    }
  };

  // Get icon component for notification type
  const getIcon = (notification: NotificationModel) => {
    const config = NOTIFICATION_CONFIG[notification.type as NotificationType];
    const iconName = config?.icon || 'info';
    const IconComponent = ICON_MAP[iconName] || Info;
    return IconComponent;
  };

  // Get color classes for notification type
  const getColors = (notification: NotificationModel) => {
    const config = NOTIFICATION_CONFIG[notification.type as NotificationType];
    const colorName = config?.color || 'gray';
    return NOTIFICATION_COLORS[colorName] || NOTIFICATION_COLORS.gray;
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={cn(
        'absolute right-0 top-full mt-2 w-96 max-h-[600px]',
        'bg-white rounded-2xl shadow-2xl border border-gray-100',
        'overflow-hidden z-50',
        'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2',
        'duration-200'
      )}
      role="dialog"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="relative flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white overflow-hidden">
        {/* Decorative orb */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-100/50 to-purple-100/50 rounded-full -translate-y-12 translate-x-12 pointer-events-none" />

        <div className="relative flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-sm">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="relative flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
              title="Mark all as read"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-xl transition-all duration-200"
            aria-label="Close notifications"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto max-h-[500px]">
        {isLoading ? (
          // Loading State
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Loading notifications...</span>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-gray-100">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="font-bold text-gray-900 mb-1">No notifications</h4>
            <p className="text-sm text-gray-500 text-center">
              You're all caught up! Check back later for updates.
            </p>
          </div>
        ) : (
          // Notifications List
          <ul className="divide-y divide-gray-50">
            {notifications.map((notification) => {
              const IconComponent = getIcon(notification);
              const colors = getColors(notification);
              if (!colors) return null;

              return (
                <li
                  key={notification.id}
                  className={cn(
                    'relative px-4 py-3.5 transition-all duration-200',
                    'hover:bg-gradient-to-r hover:from-gray-50 hover:to-white',
                    !notification.isRead && 'bg-gradient-to-r from-indigo-50/50 to-purple-50/30'
                  )}
                >
                  {/* Unread Indicator */}
                  {!notification.isRead && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-sm" />
                  )}

                  <div className="flex gap-3">
                    {/* Icon */}
                    <div
                      className={cn(
                        'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm cursor-pointer',
                        colors.iconBg
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <IconComponent className={cn('w-5 h-5', colors.text)} />
                    </div>

                    {/* Content */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleNotificationClick(notification);
                        }
                      }}
                    >
                      <p
                        className={cn(
                          'text-sm font-medium text-gray-900 mb-0.5',
                          !notification.isRead && 'font-semibold'
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>

                    {/* Mark as Read Button */}
                    {!notification.isRead && (
                      <button
                        onClick={() => onMarkAsRead(notification.id)}
                        className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded-xl transition-all duration-200"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4 text-gray-400 hover:text-green-600" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
          <button
            onClick={() => {
              navigate('/notifications');
              onClose();
            }}
            className="w-full text-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-all duration-200"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
