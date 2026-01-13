/**
 * ============================================
 * NOTIFICATION BELL COMPONENT
 * ============================================
 *
 * Bell icon with unread count badge for header.
 * Toggles the notification dropdown on click.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React from 'react';
import { Bell } from 'lucide-react';
import { cn } from '../../lib/utils';
import { withErrorBoundary } from '../common';

interface NotificationBellProps {
  unreadCount: number;
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  unreadCount,
  isOpen,
  onClick,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative p-2.5 rounded-xl transition-all duration-200',
        'hover:bg-gray-100 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500',
        isOpen && 'bg-gradient-to-br from-indigo-50 to-purple-50 shadow-md',
        className
      )}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      <Bell
        className={cn(
          'w-5 h-5 text-gray-600 transition-colors',
          isOpen && 'text-indigo-600',
          unreadCount > 0 && 'animate-subtle-shake'
        )}
      />

      {/* Unread Count Badge */}
      {unreadCount > 0 && (
        <span
          className={cn(
            'absolute -top-0.5 -right-0.5 min-w-[20px] h-5',
            'flex items-center justify-center',
            'bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold rounded-full',
            'px-1.5 shadow-lg shadow-red-500/30',
            'animate-badge-pop'
          )}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {/* Connection indicator (optional) */}
      {/* <span
        className={cn(
          'absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full',
          isConnected ? 'bg-green-500' : 'bg-red-500'
        )}
      /> */}
    </button>
  );
};

// Add to tailwind.config.js or inline styles for animations:
// @keyframes subtle-shake {
//   0%, 100% { transform: rotate(0deg); }
//   25% { transform: rotate(-10deg); }
//   75% { transform: rotate(10deg); }
// }
//
// @keyframes badge-pop {
//   0% { transform: scale(0); }
//   50% { transform: scale(1.2); }
//   100% { transform: scale(1); }
// }

// Wrap with Error Boundary HOC
export default withErrorBoundary(
  NotificationBell,
  <div className="relative p-2.5 rounded-xl bg-gray-100">
    <Bell className="w-5 h-5 text-gray-400" />
  </div>
);
