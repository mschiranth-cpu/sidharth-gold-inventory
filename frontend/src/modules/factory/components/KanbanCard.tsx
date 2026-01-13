/**
 * ============================================
 * KANBAN CARD COMPONENT
 * ============================================
 *
 * Individual order card for the Kanban board.
 * Shows order details, priority, and time in department.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { format, parseISO, differenceInHours, differenceInDays, isBefore, addDays } from 'date-fns';
import { KanbanOrder, PRIORITY_BORDER_COLORS, PRIORITY_BG_COLORS } from '../types';
import { formatMetalFinish } from '../../../types/order.types';

interface KanbanCardProps {
  order: KanbanOrder;
  onClick: () => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ order, onClick }) => {
  // Calculate time in current department
  const timeInDepartment = useMemo(() => {
    const enteredAt = parseISO(order.enteredDepartmentAt);
    const now = new Date();
    const hours = differenceInHours(now, enteredAt);
    const days = differenceInDays(now, enteredAt);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h`;
  }, [order.enteredDepartmentAt]);

  // Determine due date status
  const dueDateStatus = useMemo(() => {
    const dueDate = parseISO(order.dueDate);
    const now = new Date();
    const tomorrow = addDays(now, 1);
    const threeDays = addDays(now, 3);

    if (isBefore(dueDate, now)) {
      return 'overdue';
    } else if (isBefore(dueDate, tomorrow)) {
      return 'due-today';
    } else if (isBefore(dueDate, threeDays)) {
      return 'due-soon';
    }
    return 'normal';
  }, [order.dueDate]);

  const dueDateColor = {
    overdue: 'text-red-600 bg-red-50',
    'due-today': 'text-orange-600 bg-orange-50',
    'due-soon': 'text-yellow-600 bg-yellow-50',
    normal: 'text-gray-600 bg-gray-50',
  }[dueDateStatus];

  // Check if order needs assignment (either PENDING_ASSIGNMENT status or no worker assigned)
  const needsAssignment = order.status === 'PENDING_ASSIGNMENT' || !order.assignedWorker;

  const cardBorderColor =
    dueDateStatus === 'overdue'
      ? 'border-l-red-500'
      : dueDateStatus === 'due-today'
      ? 'border-l-orange-500'
      : needsAssignment
      ? 'border-l-yellow-500'
      : PRIORITY_BORDER_COLORS[order.priority];

  // Make pending/unassigned orders non-draggable
  const isDraggingDisabled = needsAssignment;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
    data: {
      order,
      type: 'order',
    },
    disabled: isDraggingDisabled,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        ...(isDragging && {
          boxShadow: '0 20px 50px rgba(99, 102, 241, 0.5), 0 0 30px rgba(139, 92, 246, 0.3)',
        }),
      }}
      {...(!isDraggingDisabled ? listeners : {})}
      {...(!isDraggingDisabled ? attributes : {})}
      onClick={onClick}
      className={`
        group relative
        bg-white rounded-xl border border-gray-200 border-l-4 ${cardBorderColor}
        ${needsAssignment ? 'border-2 border-dashed border-yellow-300 bg-yellow-50/30' : ''}
        p-3 mb-2 cursor-pointer
        hover:shadow-xl hover:shadow-indigo-100 hover:border-indigo-300 hover:-translate-y-1.5
        transition-all duration-300 ease-in-out
        transform will-change-transform
        ${
          isDragging
            ? 'opacity-90 shadow-2xl scale-110 rotate-3 z-50 ring-2 ring-indigo-400 ring-opacity-60 blur-0 kanban-card-dragging cursor-grabbing'
            : 'opacity-100 hover:ring-2 hover:ring-indigo-400 hover:bg-indigo-50/50'
        }
      `}
    >
      {/* Blue Glow Overlay - Appears on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-400/10 group-hover:to-purple-400/10 rounded-xl transition-all duration-300 pointer-events-none" />

      {/* Card Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-indigo-700 transition-colors">
              {order.orderNumber}
            </p>
            <p className="text-xs text-gray-500 truncate">{order.customerName}</p>

            {/* Meta Info - moved under header */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors font-medium">
                {order.grossWeight}g {order.purity} {order.metalType}
              </span>
              {order.metalFinish && (
                <span className="text-xs text-indigo-600 group-hover:text-indigo-700 transition-colors font-medium">
                  {formatMetalFinish(order.metalFinish, order.customFinish)}
                </span>
              )}
              <span
                className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  PRIORITY_BG_COLORS[order.priority]
                }`}
              >
                {order.priority}
              </span>
            </div>
          </div>

          {/* Product Image - positioned to not overlap text */}
          <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 ring-2 ring-transparent group-hover:ring-indigo-200 transition-all self-start">
            {order.productImage ? (
              <img
                src={order.productImage}
                alt=""
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                draggable={false}
                onError={(e) => {
                  // Hide broken image and show fallback
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div
              className={`w-full h-full flex items-center justify-center text-gray-400 ${
                order.productImage ? 'hidden' : ''
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="space-y-2">
          {/* Progress Bar - show whenever worker is assigned */}
          {order.assignedWorker && order.workProgress !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium">Progress</span>
                <span className="text-indigo-600 font-semibold">{order.workProgress}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${order.workProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            {/* Assigned Worker */}
            {order.assignedWorker ? (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-medium overflow-hidden">
                  {order.assignedWorker.avatar ? (
                    <img
                      src={order.assignedWorker.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    order.assignedWorker.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-xs text-gray-600 truncate max-w-[60px]">
                  {order.assignedWorker.name.split(' ')[0]}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-gray-400">
                <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <span className="text-xs">Unassigned</span>
              </div>
            )}

            {/* Time & Due Date */}
            <div className="flex items-center gap-2">
              {/* Time in Department */}
              <div className="flex items-center gap-1 text-gray-500" title="Time in department">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-xs">{timeInDepartment}</span>
              </div>

              {/* Due Date */}
              <span className={`text-xs px-1.5 py-0.5 rounded ${dueDateColor}`}>
                {dueDateStatus === 'overdue' ? 'Overdue' : format(parseISO(order.dueDate), 'MMM d')}
              </span>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        {order.status === 'IN_PROGRESS' && (
          <div className="mt-2 flex items-center gap-1.5 bg-green-50 group-hover:bg-green-100 transition-colors rounded px-2 py-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-600 font-medium">In Progress</span>
          </div>
        )}
        {needsAssignment && (
          <div className="mt-2 flex items-center gap-1.5 bg-yellow-50 border border-yellow-300 group-hover:bg-yellow-100 transition-colors rounded px-2 py-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-xs text-yellow-700 font-semibold">Pending Assignment</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanCard;
