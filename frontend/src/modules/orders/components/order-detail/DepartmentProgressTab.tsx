/**
 * ============================================
 * DEPARTMENT PROGRESS TAB - ORDER DETAIL PAGE
 * ============================================
 * 
 * List view of all departments showing status,
 * assigned person, duration, and actions.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React from 'react';
import { format, parseISO } from 'date-fns';
import { OrderDetail, OrderDepartmentProgress } from '../../types';

interface DepartmentProgressTabProps {
  order: OrderDetail;
  canEdit: boolean;
  onAssignWorker?: (departmentId: string) => void;
  onMarkComplete?: (departmentId: string) => void;
}

const DepartmentProgressTab: React.FC<DepartmentProgressTabProps> = ({
  order,
  canEdit,
  onAssignWorker,
  onMarkComplete,
}) => {
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
    }
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return hours > 0 ? `${days}d ${hours}h` : `${days} days`;
  };

  const formatTimestamp = (dateStr: string) => {
    return format(parseISO(dateStr), 'MMM dd, h:mm a');
  };

  const getStatusBadge = (status: OrderDepartmentProgress['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Completed
          </span>
        );
      case 'current':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            In Progress
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pending
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-400 border border-gray-200 border-dashed">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
            Skipped
          </span>
        );
    }
  };

  const sortedProgress = [...order.departmentProgress].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-gray-600">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gray-300" />
          <span className="text-gray-600">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-dashed border-gray-300" />
          <span className="text-gray-600">Skipped</span>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Timestamps
              </th>
              {canEdit && (
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedProgress.map((dept, index) => (
              <tr 
                key={dept.departmentId} 
                className={`
                  ${dept.status === 'current' ? 'bg-indigo-50' : ''}
                  ${dept.status === 'skipped' ? 'bg-gray-50 opacity-60' : ''}
                  hover:bg-gray-50 transition-colors
                `}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium
                    ${dept.status === 'completed' ? 'bg-green-100 text-green-700' :
                      dept.status === 'current' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-gray-100 text-gray-500'}
                  `}>
                    {index + 1}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{dept.displayName}</div>
                  {dept.notes && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]" title={dept.notes}>
                      {dept.notes}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(dept.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {dept.assignedWorker ? (
                    <div className="flex items-center gap-2">
                      {dept.assignedWorker.avatar ? (
                        <img 
                          src={dept.assignedWorker.avatar} 
                          alt={dept.assignedWorker.name}
                          className="w-7 h-7 rounded-full"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {dept.assignedWorker.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{dept.assignedWorker.name}</p>
                        <p className="text-xs text-gray-500">{dept.assignedWorker.role}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Not assigned</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {dept.duration !== undefined ? (
                    <span className="text-sm text-gray-900 font-medium">
                      {formatDuration(dept.duration)}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs space-y-1">
                    {dept.enteredAt && (
                      <div className="text-gray-500">
                        <span className="text-gray-400">In:</span> {formatTimestamp(dept.enteredAt)}
                      </div>
                    )}
                    {dept.exitedAt && (
                      <div className="text-gray-500">
                        <span className="text-gray-400">Out:</span> {formatTimestamp(dept.exitedAt)}
                      </div>
                    )}
                    {!dept.enteredAt && !dept.exitedAt && (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </td>
                {canEdit && (
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!dept.assignedWorker && dept.status !== 'completed' && dept.status !== 'skipped' && (
                        <button
                          onClick={() => onAssignWorker?.(dept.departmentId)}
                          className="text-xs px-2 py-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded"
                        >
                          Assign
                        </button>
                      )}
                      {dept.status === 'current' && (
                        <button
                          onClick={() => onMarkComplete?.(dept.departmentId)}
                          className="text-xs px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded font-medium"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {sortedProgress.map((dept, index) => (
          <div 
            key={dept.departmentId}
            className={`
              bg-white rounded-xl border p-4
              ${dept.status === 'current' ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'}
              ${dept.status === 'skipped' ? 'opacity-60' : ''}
            `}
          >
            <div className="flex items-start gap-3">
              <span className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0
                ${dept.status === 'completed' ? 'bg-green-100 text-green-700' :
                  dept.status === 'current' ? 'bg-indigo-100 text-indigo-700' :
                  'bg-gray-100 text-gray-500'}
              `}>
                {index + 1}
              </span>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-gray-900">{dept.displayName}</h4>
                  {getStatusBadge(dept.status)}
                </div>

                {dept.assignedWorker && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                      <span className="text-[10px] font-medium text-white">
                        {dept.assignedWorker.name.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">{dept.assignedWorker.name}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                  {dept.duration !== undefined && (
                    <span>Duration: {formatDuration(dept.duration)}</span>
                  )}
                  {dept.enteredAt && (
                    <span>Entered: {formatTimestamp(dept.enteredAt)}</span>
                  )}
                </div>

                {dept.notes && (
                  <p className="text-sm text-gray-600 mt-2 italic">"{dept.notes}"</p>
                )}

                {canEdit && dept.status === 'current' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => onMarkComplete?.(dept.departmentId)}
                      className="flex-1 text-sm px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-medium"
                    >
                      Mark Complete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepartmentProgressTab;
