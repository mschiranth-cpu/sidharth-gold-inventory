/**
 * ============================================
 * VISUAL TIMELINE COMPONENT
 * ============================================
 *
 * Displays activities in a visual timeline format
 * with animated vertical line and event dots.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React from 'react';
import { format, parseISO, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { OrderActivityLog } from '../../types';

interface VisualTimelineProps {
  activities: OrderActivityLog[];
}

const VisualTimeline: React.FC<VisualTimelineProps> = ({ activities }) => {
  const getActionColor = (action: OrderActivityLog['action']): string => {
    switch (action) {
      case 'created':
        return 'green'; // Green for creation
      case 'completed':
        return 'green'; // Green for completion
      case 'updated':
        return 'yellow'; // Yellow for updates
      case 'status_changed':
        return 'yellow'; // Yellow for status changes
      case 'department_changed':
        return 'blue'; // Blue for department moves
      case 'assigned':
        return 'blue'; // Blue for assignments
      case 'file_uploaded':
        return 'cyan'; // Cyan for file uploads
      case 'note_added':
        return 'gray'; // Gray for notes
      default:
        return 'gray';
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { dot: string; ring: string; line: string; bg: string }> = {
      green: {
        dot: 'bg-green-500',
        ring: 'ring-green-200',
        line: 'bg-green-200',
        bg: 'bg-green-50',
      },
      blue: {
        dot: 'bg-blue-500',
        ring: 'ring-blue-200',
        line: 'bg-blue-200',
        bg: 'bg-blue-50',
      },
      yellow: {
        dot: 'bg-yellow-500',
        ring: 'ring-yellow-200',
        line: 'bg-yellow-200',
        bg: 'bg-yellow-50',
      },
      cyan: {
        dot: 'bg-cyan-500',
        ring: 'ring-cyan-200',
        line: 'bg-cyan-200',
        bg: 'bg-cyan-50',
      },
      gray: {
        dot: 'bg-gray-400',
        ring: 'ring-gray-200',
        line: 'bg-gray-200',
        bg: 'bg-gray-50',
      },
    };
    return colorMap[color] || colorMap.gray;
  };

  const getActionIcon = (action: OrderActivityLog['action']) => {
    switch (action) {
      case 'created':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        );
      case 'updated':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        );
      case 'status_changed':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        );
      case 'department_changed':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        );
      case 'file_uploaded':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        );
      case 'note_added':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        );
      case 'assigned':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          />
        );
      case 'completed':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        );
      default:
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        );
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    }
    if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM dd, yyyy h:mm a');
  };

  const formatRelativeTime = (dateStr: string) => {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  };

  // Group activities by date for section headers
  const groupedActivities = activities.reduce((groups, activity) => {
    const dateKey = format(parseISO(activity.timestamp), 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
    return groups;
  }, {} as Record<string, OrderActivityLog[]>);

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM dd, yyyy');
  };

  return (
    <div className="space-y-8">
      {Object.entries(groupedActivities).map(([dateKey, dateActivities]) => {
        if (!dateActivities || dateActivities.length === 0) return null;

        return (
          <div key={dateKey}>
            {/* Date Header */}
            <div className="flex items-center gap-3 mb-6">
              <h3 className="text-sm font-semibold text-gray-900">
                {getDateLabel(dateActivities[0]?.timestamp || dateKey)}
              </h3>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
            </div>

            {/* Timeline */}
            <div className="relative pl-4 sm:pl-8">
              {/* Vertical Line */}
              <div className="absolute left-1.5 sm:left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-300 via-gray-200 to-transparent" />

              {/* Timeline Events */}
              <div className="space-y-8">
                {dateActivities.map((activity, index) => {
                  const color = getActionColor(activity.action);
                  const colors = getColorClasses(color);

                  if (!colors) return null; // TypeScript safety

                  return (
                    <div
                      key={activity.id}
                      className="relative animate-fadeInUp"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Timeline Dot */}
                      <div className="absolute -left-6 sm:-left-8 top-1 flex items-center justify-center">
                        <div
                          className={`relative w-6 sm:w-8 h-6 sm:h-8 rounded-full ${colors.dot} ring-4 ${colors.ring} shadow-md flex items-center justify-center animate-pulse-gentle`}
                        >
                          <svg
                            className="w-3 sm:w-4 h-3 sm:h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            {getActionIcon(activity.action)}
                          </svg>
                        </div>
                      </div>

                      {/* Content Card - Mobile responsive */}
                      <div
                        className={`${
                          colors.bg
                        } rounded-lg sm:rounded-xl p-3 sm:p-4 border-l-4 ${colors.dot.replace(
                          'bg-',
                          'border-'
                        )} shadow-sm hover:shadow-md transition-all duration-300`}
                      >
                        {/* Header - Mobile responsive */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-2">
                          <div className="flex-1 min-w-0">
                            {/* User Info */}
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                              {activity.userAvatar ? (
                                <img
                                  src={activity.userAvatar}
                                  alt={activity.userName}
                                  className="w-5 sm:w-6 h-5 sm:h-6 rounded-full ring-2 ring-white flex-shrink-0"
                                />
                              ) : (
                                <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center ring-2 ring-white flex-shrink-0">
                                  <span className="text-xs font-medium text-white">
                                    {activity.userName.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <span className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                                {activity.userName}
                              </span>
                            </div>

                            {/* Description */}
                            <p className="text-gray-700 leading-relaxed text-xs sm:text-sm">
                              {activity.description}
                            </p>
                          </div>

                          {/* Timestamp */}
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span
                              className="text-xs text-gray-500 whitespace-nowrap"
                              title={formatTimestamp(activity.timestamp)}
                            >
                              {formatRelativeTime(activity.timestamp)}
                            </span>
                            <span className="text-xs text-gray-400 mt-0.5">
                              {format(parseISO(activity.timestamp), 'h:mm a')}
                            </span>
                          </div>
                        </div>

                        {/* Metadata - Mobile responsive */}
                        {activity.metadata && (
                          <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                            {activity.metadata.oldValue && activity.metadata.newValue && (
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg text-sm shadow-sm">
                                <span className="line-through text-gray-400">
                                  {activity.metadata.oldValue}
                                </span>
                                <svg
                                  className="w-4 h-4 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                                  />
                                </svg>
                                <span className="font-medium text-gray-900">
                                  {activity.metadata.newValue}
                                </span>
                              </div>
                            )}
                            {activity.metadata.departmentName && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-sm shadow-sm">
                                <svg
                                  className="w-4 h-4 text-indigo-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                  />
                                </svg>
                                <span className="font-medium text-gray-900">
                                  {activity.metadata.departmentName}
                                </span>
                              </span>
                            )}
                            {activity.metadata.fileName && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-sm shadow-sm">
                                <svg
                                  className="w-4 h-4 text-cyan-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                  />
                                </svg>
                                <span className="font-medium text-gray-900">
                                  {activity.metadata.fileName}
                                </span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out forwards;
        }

        @keyframes pulseGentle {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .animate-pulse-gentle {
          animation: pulseGentle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default VisualTimeline;
