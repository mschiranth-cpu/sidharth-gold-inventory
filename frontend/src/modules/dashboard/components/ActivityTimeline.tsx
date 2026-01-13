/**
 * ============================================
 * ACTIVITY TIMELINE COMPONENT
 * ============================================
 * 
 * Shows recent activity in a timeline format.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { RecentActivity, ActivityType } from '../../../types/dashboard.types';

interface ActivityTimelineProps {
  activities: RecentActivity[];
  isLoading?: boolean;
}

// ============================================
// ACTIVITY ICONS & COLORS
// ============================================

const activityConfig: Record<ActivityType, { icon: React.ReactNode; bgColor: string; iconColor: string }> = {
  order_created: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  order_completed: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    bgColor: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  department_transfer: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  submission_received: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bgColor: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
  weight_recorded: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    bgColor: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
  },
  alert: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
  },
};

// ============================================
// LOADING SKELETON
// ============================================

const ActivitySkeleton: React.FC = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex gap-4 animate-pulse">
        <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    ))}
  </div>
);

// ============================================
// COMPONENT
// ============================================

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <p className="text-sm text-gray-500 mt-0.5">Latest updates from the factory</p>
          </div>
        </div>
        <ActivitySkeleton />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <p className="text-sm text-gray-500 mt-0.5">Latest updates from the factory</p>
        </div>
        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
          View All
        </button>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100"></div>

        <div className="space-y-4">
          {activities.map((activity) => {
            const config = activityConfig[activity.type];
            const timeAgo = formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true });

            return (
              <div key={activity.id} className="relative flex gap-4 group">
                {/* Icon */}
                <div className={`relative z-10 w-8 h-8 ${config.bgColor} rounded-full flex items-center justify-center flex-shrink-0 ${config.iconColor} group-hover:scale-110 transition-transform`}>
                  {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{activity.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{activity.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400">{timeAgo}</span>
                    {activity.user && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs text-gray-500">{activity.user.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ActivityTimeline;
