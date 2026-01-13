/**
 * ============================================
 * KANBAN COLUMN COMPONENT
 * ============================================
 *
 * Single department column for the Kanban board.
 * Acts as a drop zone for draggable cards.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { KanbanDepartment, KanbanOrder } from '../types';
import KanbanCard from './KanbanCard';

interface KanbanColumnProps {
  department: KanbanDepartment;
  orders: KanbanOrder[];
  onCardClick: (order: KanbanOrder) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ department, orders, onCardClick }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: department.id,
    data: {
      department,
      type: 'column',
    },
  });

  return (
    <div className="flex flex-col min-w-[280px] max-w-[280px] h-full">
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-3 px-2 py-2 bg-white rounded-lg shadow-sm border border-gray-100">
        <div className={`w-3 h-3 rounded-full ${department.color} shadow-sm`} />
        <h3 className="font-semibold text-gray-900 text-sm tracking-tight">
          {department.displayName}
        </h3>
        <span className="ml-auto px-2.5 py-1 text-xs font-bold bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-full shadow-sm border border-gray-200">
          {orders.length}
        </span>
      </div>

      {/* Column Body - Droppable Area */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 rounded-xl p-3 transition-all duration-300 ease-in-out overflow-y-auto
          border-2 border-dashed
          ${
            isOver
              ? 'bg-gradient-to-b from-indigo-50 via-indigo-50 to-purple-50 border-indigo-400 shadow-xl scale-[1.02] kanban-drop-zone-active'
              : 'bg-gradient-to-b from-gray-50 to-gray-100 border-gray-200 hover:border-gray-300 hover:shadow-md'
          }
        `}
        style={{
          minHeight: '400px',
          ...(isOver && {
            boxShadow:
              'inset 0 0 30px rgba(99, 102, 241, 0.15), 0 8px 30px rgba(99, 102, 241, 0.2)',
          }),
        }}
      >
        {orders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
            <svg
              className="w-10 h-10 mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-sm">No orders</p>
            <p className="text-xs">Drop orders here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((order, index) => (
              <div
                key={order.id}
                style={{
                  animationDelay: `${index * 30}ms`,
                }}
              >
                <KanbanCard order={order} onClick={() => onCardClick(order)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Column Footer Stats */}
      <div className="mt-3 px-2 py-2 flex items-center justify-between text-xs bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-gray-600 font-medium">
            {orders.filter((o) => o.status === 'IN_PROGRESS').length} in progress
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-gray-600 font-medium">
            {
              orders.filter((o) => {
                const dueDate = new Date(o.dueDate);
                return dueDate < new Date();
              }).length
            }{' '}
            overdue
          </span>
        </div>
      </div>
    </div>
  );
};

export default KanbanColumn;
