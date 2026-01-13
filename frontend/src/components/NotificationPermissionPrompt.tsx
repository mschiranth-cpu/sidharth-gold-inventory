/**
 * ============================================
 * NOTIFICATION PERMISSION PROMPT
 * ============================================
 *
 * Component that requests browser notification permission
 * on first visit. Shows a friendly prompt that can be dismissed.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

export default function NotificationPermissionPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    const hasAsked = localStorage.getItem('notificationPermissionAsked');
    const isSupported = 'Notification' in window;
    const needsPermission = isSupported && Notification.permission === 'default';

    if (!hasAsked && needsPermission) {
      // Show prompt after a short delay
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // 3 seconds after page load

      return () => clearTimeout(timer);
    }

    return undefined;
  }, []);

  const handleAllow = async () => {
    try {
      const permission = await Notification.requestPermission();
      localStorage.setItem('notificationPermissionAsked', 'true');

      if (permission === 'granted') {
        // Show a test notification
        new Notification('Notifications Enabled! 🎉', {
          body: 'You will now receive real-time notifications for order updates.',
          icon: '/favicon.ico',
        });
      }

      setShowPrompt(false);
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notificationPermissionAsked', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 p-2 bg-indigo-100 rounded-full">
            <Bell className="w-5 h-5 text-indigo-600" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Enable Notifications?</h3>
            <p className="text-sm text-gray-600 mb-3">
              Get notified instantly when you're assigned new work orders.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAllow}
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition-colors"
              >
                Allow
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
