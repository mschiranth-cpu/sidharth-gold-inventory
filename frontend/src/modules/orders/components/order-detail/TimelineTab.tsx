/**
 * ============================================
 * TIMELINE TAB - ORDER DETAIL PAGE
 * ============================================
 *
 * Visual timeline showing the order's journey
 * through departments with timestamps and durations.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React from 'react';
import { format, parseISO } from 'date-fns';
import { OrderDetail, OrderDepartmentProgress } from '../../types';

interface TimelineTabProps {
  order: OrderDetail;
}

const TimelineTab: React.FC<TimelineTabProps> = ({ order }) => {
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return `${days}d ${hours}h`;
  };

  const formatTimestamp = (dateStr: string) => {
    return format(parseISO(dateStr), 'MMM dd, yyyy h:mm a');
  };

  const getStatusConfig = (status: OrderDepartmentProgress['status']) => {
    switch (status) {
      case 'completed':
        return {
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ),
          bg: 'bg-green-500',
          border: 'border-green-500',
          text: 'text-green-600',
          line: 'bg-green-500',
        };
      case 'current':
        return {
          icon: (
            <svg
              className="w-5 h-5 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          ),
          bg: 'bg-indigo-500',
          border: 'border-indigo-500',
          text: 'text-indigo-600',
          line: 'bg-gray-300',
        };
      case 'pending':
        return {
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          bg: 'bg-gray-200',
          border: 'border-gray-300',
          text: 'text-gray-400',
          line: 'bg-gray-200',
        };
      case 'skipped':
        return {
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          ),
          bg: 'bg-gray-100',
          border: 'border-gray-300 border-dashed',
          text: 'text-gray-400',
          line: 'bg-gray-200 border-dashed',
        };
    }
  };

  const sortedProgress = [...order.departmentProgress].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Stages Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="relative">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Total Stages</p>
            <p className="text-3xl font-bold text-gray-900">{order.departmentProgress.length}</p>
          </div>
        </div>

        {/* Completed Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-emerald-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="relative">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Completed</p>
            <p className="text-3xl font-bold text-emerald-600">
              {order.departmentProgress.filter((d) => d.status === 'completed').length}
            </p>
          </div>
        </div>

        {/* Current Stage Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="relative">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Current Stage</p>
            <p className="text-xl font-bold text-blue-600">
              {order.currentDepartment?.displayName || 'Not Started'}
            </p>
          </div>
        </div>

        {/* Total Time Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-100 to-violet-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="relative">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Total Time</p>
            <p className="text-3xl font-bold text-purple-600">
              {formatDuration(
                order.departmentProgress
                  .filter((d) => d.duration)
                  .reduce((sum, d) => sum + (d.duration || 0), 0)
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Production Journey</h3>

        <div className="relative">
          {sortedProgress.map((dept, index) => {
            const config = getStatusConfig(dept.status);
            const isLast = index === sortedProgress.length - 1;

            return (
              <div key={dept.departmentId} className="relative pb-8 last:pb-0">
                {/* Connecting Line */}
                {!isLast && (
                  <div className={`absolute left-5 top-10 w-0.5 h-full ${config.line}`} />
                )}

                <div className="flex gap-4">
                  {/* Status Icon */}
                  <div
                    className={`
                    flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                    ${config.bg} text-white z-10
                  `}
                  >
                    {config.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`
                      bg-gray-50 rounded-xl p-4 border
                      ${
                        dept.status === 'current'
                          ? 'border-indigo-300 bg-indigo-50'
                          : 'border-gray-200'
                      }
                    `}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className={`font-semibold ${config.text}`}>
                          {dept.displayName}
                          {dept.status === 'current' && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                              In Progress
                            </span>
                          )}
                          {dept.status === 'skipped' && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                              Skipped
                            </span>
                          )}
                        </h4>

                        {dept.duration !== undefined && (
                          <span className="text-sm font-medium text-gray-500">
                            Duration: {formatDuration(dept.duration)}
                          </span>
                        )}
                      </div>

                      {/* Timestamps */}
                      <div className="mt-2 flex flex-wrap gap-4 text-sm">
                        {dept.enteredAt && (
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                              />
                            </svg>
                            <span>Entered: {formatTimestamp(dept.enteredAt)}</span>
                          </div>
                        )}
                        {dept.exitedAt && (
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            <span>Exited: {formatTimestamp(dept.exitedAt)}</span>
                          </div>
                        )}
                      </div>

                      {/* Worker & Notes */}
                      {(dept.assignedWorker || dept.notes) && (
                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                          {dept.assignedWorker && (
                            <div className="flex items-center gap-2">
                              {dept.assignedWorker.avatar ? (
                                <img
                                  src={dept.assignedWorker.avatar}
                                  alt={dept.assignedWorker.name}
                                  className="w-6 h-6 rounded-full"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-600">
                                    {dept.assignedWorker.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <span className="text-sm text-gray-600">
                                {dept.assignedWorker.name}
                              </span>
                              <span className="text-xs text-gray-400">
                                {dept.assignedWorker.role}
                              </span>
                            </div>
                          )}
                          {dept.notes && (
                            <p className="text-sm text-gray-600 italic">"{dept.notes}"</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Horizontal Progress Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Overview</h3>

        <div className="relative">
          {/* Background track */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            {/* Completed portion */}
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
              style={{
                width: `${
                  (order.departmentProgress.filter((d) => d.status === 'completed').length /
                    order.departmentProgress.length) *
                  100
                }%`,
              }}
            />
          </div>

          {/* Department markers */}
          <div className="flex justify-between mt-3">
            {sortedProgress.map((dept) => {
              const config = getStatusConfig(dept.status);
              return (
                <div key={dept.departmentId} className="flex flex-col items-center">
                  <div
                    className={`
                    w-4 h-4 rounded-full border-2 -mt-5
                    ${
                      dept.status === 'completed'
                        ? 'bg-green-500 border-green-500'
                        : dept.status === 'current'
                        ? 'bg-indigo-500 border-indigo-500'
                        : 'bg-white border-gray-300'
                    }
                  `}
                  />
                  <span className={`text-xs mt-2 ${config.text} hidden md:block`}>
                    {dept.displayName.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineTab;
