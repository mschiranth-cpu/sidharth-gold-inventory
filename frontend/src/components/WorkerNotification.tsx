/**
 * ============================================
 * WORKER NOTIFICATION COMPONENT
 * ============================================
 *
 * Displays toast notification when worker logs in with pending assignments
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { workersService } from '../services/workers.service';

const STORAGE_KEY = 'worker-toast-shown-today';

/**
 * Check if toast was already shown today
 */
const wasShownToday = (): boolean => {
  const lastShown = localStorage.getItem(STORAGE_KEY);
  if (!lastShown) return false;

  const lastShownDate = new Date(lastShown);
  const today = new Date();

  return (
    lastShownDate.getDate() === today.getDate() &&
    lastShownDate.getMonth() === today.getMonth() &&
    lastShownDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Mark toast as shown today
 */
const markShownToday = (): void => {
  localStorage.setItem(STORAGE_KEY, new Date().toISOString());
};

export const WorkerNotification: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toastShownRef = useRef(false);

  const isWorker = user?.role === 'DEPARTMENT_WORKER';

  // Query pending assignments count
  const { data } = useQuery({
    queryKey: ['worker-pending-assignments'],
    queryFn: () => workersService.getPendingAssignmentsCount(),
    enabled: isAuthenticated && isWorker && !wasShownToday() && !toastShownRef.current,
    staleTime: Infinity, // Only fetch once per session
    retry: false,
  });

  useEffect(() => {
    // Only show toast once per session and if not shown today
    if (data?.data?.hasAssignments && isWorker && !toastShownRef.current && !wasShownToday()) {
      const count = data.data.count;

      toast.success(
        (t) => (
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {count === 1 ? '1 assignment' : `${count} assignments`} waiting!
              </p>
              <p className="text-sm text-gray-600 mt-0.5">Click to view your work</p>
            </div>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                navigate('/orders');
              }}
              className="ml-2 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              View
            </button>
          </div>
        ),
        {
          duration: 8000, // Show for 8 seconds
          position: 'top-right',
          icon: '📋',
          style: {
            background: '#fff',
            color: '#333',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e5e7eb',
            maxWidth: '400px',
          },
        }
      );

      toastShownRef.current = true;
      markShownToday();
    }
  }, [data, isWorker, navigate]);

  return null; // This component doesn't render anything
};
