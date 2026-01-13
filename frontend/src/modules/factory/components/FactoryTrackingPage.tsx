/**
 * ============================================
 * FACTORY TRACKING PAGE - KANBAN BOARD
 * ============================================
 *
 * Kanban-style board for tracking orders across
 * factory departments with drag and drop.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { useQuery } from '@tanstack/react-query';
import { parseISO, addDays, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';
import toast from 'react-hot-toast';

import {
  KanbanOrder,
  KanbanState,
  KanbanFilters,
  KANBAN_DEPARTMENTS,
  DepartmentTransition,
} from '../types';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import OrderDetailModal from './OrderDetailModal';
import { ordersService } from '../../orders/services';
import assignmentService from '../../../services/assignment.service';
import { apiGet } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { ErrorBoundary } from '../../../components/common';

// ============================================
// API DATA TRANSFORMATION
// ============================================

// Map backend department names to kanban department IDs
// Backend uses uppercase enum values: CAD, PRINT, CASTING, etc.
const DEPARTMENT_NAME_MAP: Record<string, string> = {
  CAD: 'CAD',
  PRINT: 'PRINT',
  CASTING: 'CASTING',
  FILLING: 'FILLING',
  MEENA: 'MEENA',
  POLISH_1: 'POLISH_1',
  SETTING: 'SETTING',
  POLISH_2: 'POLISH_2',
  ADDITIONAL: 'ADDITIONAL',
};

// Priority mapping from number to string
const PRIORITY_MAP: Record<number, 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'> = {
  0: 'LOW',
  1: 'NORMAL',
  2: 'HIGH',
  3: 'URGENT',
  4: 'URGENT',
  5: 'URGENT',
};

// Transform API order to Kanban order
const transformOrderToKanban = (order: any): KanbanOrder => {
  // Get current department from the order - backend returns uppercase enum values
  const currentDept = order.currentDepartment || 'CAD';
  // Use the department directly since backend and frontend now use same IDs
  const deptId = DEPARTMENT_NAME_MAP[currentDept] || currentDept;

  // Find tracking for current department (for assigned worker and other data)
  const currentDeptTracking = order.departmentTracking?.find(
    (dt: any) => dt.departmentName === currentDept
  );

  // Find in-progress tracking specifically (for backwards compatibility)
  const currentTracking = order.departmentTracking?.find(
    (dt: any) => dt.departmentName === currentDept && dt.status === 'IN_PROGRESS'
  );

  // Build history from department tracking (only available in detail view)
  const history: DepartmentTransition[] = (order.departmentTracking || [])
    .filter((dt: any) => dt.status === 'COMPLETED' || dt.status === 'IN_PROGRESS')
    .map((dt: any) => ({
      departmentId: DEPARTMENT_NAME_MAP[dt.departmentName] || dt.departmentName,
      departmentName:
        KANBAN_DEPARTMENTS.find((d) => d.name === dt.departmentName || d.id === dt.departmentName)
          ?.displayName || dt.departmentName,
      enteredAt: dt.startedAt || order.createdAt,
      exitedAt: dt.completedAt || undefined,
      workerId: dt.assignedTo?.id,
      workerName: dt.assignedTo?.name,
    }));

  // Determine status:
  // - Check if tracking status is PENDING_ASSIGNMENT
  // - If we have departmentTracking data (from detail view), use that
  // - Otherwise, consider orders with completionPercentage > 0 as IN_PROGRESS
  // - Orders in first department (CAD) with 0% are WAITING
  const trackingStatus = currentDeptTracking?.status;
  const isPending = trackingStatus === 'PENDING_ASSIGNMENT';
  const hasProgress = order.completionPercentage > 0;
  const status = isPending
    ? 'PENDING_ASSIGNMENT'
    : currentTracking
    ? 'IN_PROGRESS'
    : hasProgress
    ? 'IN_PROGRESS'
    : 'WAITING';

  // Use backend-calculated progress percentage
  const workProgress = currentDeptTracking?.completionPercentage ?? 0;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName || 'Customer',
    productImage: order.productPhotoUrl || undefined,
    priority:
      typeof order.priority === 'number'
        ? PRIORITY_MAP[order.priority] || 'NORMAL'
        : order.priority,
    dueDate: order.dueDate || order.orderDetails?.dueDate || new Date().toISOString(),
    currentDepartment: deptId,
    assignedWorker: currentDeptTracking?.assignedTo
      ? {
          id: currentDeptTracking.assignedTo.id,
          name: currentDeptTracking.assignedTo.name,
          department: currentDept,
        }
      : undefined,
    enteredDepartmentAt: currentDeptTracking?.startedAt || order.createdAt,
    status,
    workProgress,
    grossWeight: order.orderDetails?.goldWeightInitial || 0,
    purity: order.orderDetails?.purity || '22K',
    metalType: order.orderDetails?.metalType || 'GOLD',
    metalFinish: order.orderDetails?.metalFinish,
    customFinish: order.orderDetails?.customFinish,
    notes: order.orderDetails?.specialInstructions || undefined,
    history,
  };
};

// ============================================
// MAIN COMPONENT
// ============================================

const FactoryTrackingPage: React.FC = () => {
  // Get URL search params
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isWorker = user?.role === 'DEPARTMENT_WORKER';

  // State
  const [kanbanState, setKanbanState] = useState<KanbanState>({});
  const [activeOrder, setActiveOrder] = useState<KanbanOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<KanbanOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [filters, setFilters] = useState<KanbanFilters>({
    dueDateRange: 'all',
    workerId: searchParams.get('workerId') || undefined,
    departmentId: searchParams.get('department') || undefined,
  });
  const kanbanContainerRef = React.useRef<HTMLDivElement>(null);
  const [showFilters, setShowFilters] = useState(
    !!searchParams.get('department') || !!searchParams.get('workerId')
  );

  // Sensors for drag and drop (disabled for workers)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch orders from real API
  const {
    data: ordersResponse,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['kanban-orders'],
    queryFn: async () => {
      // Fetch IN_FACTORY orders for kanban board
      // Backend limits to max 100 per request
      const response = await ordersService.getAll({
        page: 1,
        limit: 100,
        filters: {
          status: 'IN_FACTORY',
        },
      });
      return response;
    },
    refetchInterval: 30000, // Poll every 30 seconds for real-time updates
  });

  // Fetch all workers for the filter dropdown
  const { data: workersData } = useQuery({
    queryKey: ['all-workers'],
    queryFn: async () => {
      const response = await apiGet<any>('/users/workers');
      return response.data || [];
    },
  });

  // Transform API response to KanbanOrder format
  const orders = useMemo(() => {
    if (!ordersResponse?.data) {
      return [];
    }
    return ordersResponse.data.map(transformOrderToKanban);
  }, [ordersResponse]);

  // Calculate worker order counts
  const workerOrderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((order) => {
      if (order.assignedWorker?.id) {
        counts[order.assignedWorker.id] = (counts[order.assignedWorker.id] || 0) + 1;
      }
    });
    return counts;
  }, [orders]);

  // Calculate department order counts
  const departmentOrderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((order) => {
      if (order.currentDepartment) {
        counts[order.currentDepartment] = (counts[order.currentDepartment] || 0) + 1;
      }
    });
    return counts;
  }, [orders]);

  // Group orders by department
  useEffect(() => {
    if (orders) {
      const grouped: KanbanState = {};

      // If department filter is active, only show that department
      const departmentsToShow = filters.departmentId
        ? KANBAN_DEPARTMENTS.filter((dept) => dept.id === filters.departmentId)
        : KANBAN_DEPARTMENTS;

      departmentsToShow.forEach((dept) => {
        grouped[dept.id] = [];
      });

      orders.forEach((order) => {
        const deptOrders = grouped[order.currentDepartment];
        if (deptOrders) {
          deptOrders.push(order);
        }
      });

      setKanbanState(grouped);
    }
  }, [orders, filters.departmentId]);

  // Apply filters
  const filteredKanbanState = useMemo(() => {
    const result: KanbanState = {};
    const now = new Date();
    const today = startOfDay(now);
    const weekFromNow = addDays(today, 7);

    Object.entries(kanbanState).forEach(([deptId, deptOrders]) => {
      result[deptId] = deptOrders.filter((order) => {
        // Worker filter
        if (filters.workerId && order.assignedWorker?.id !== filters.workerId) {
          return false;
        }

        // Priority filter
        if (filters.priority && order.priority !== filters.priority) {
          return false;
        }

        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          if (
            !order.orderNumber.toLowerCase().includes(searchLower) &&
            !order.customerName.toLowerCase().includes(searchLower)
          ) {
            return false;
          }
        }

        // Due date range filter
        if (filters.dueDateRange && filters.dueDateRange !== 'all') {
          const dueDate = parseISO(order.dueDate);

          switch (filters.dueDateRange) {
            case 'overdue':
              if (!isBefore(dueDate, today)) return false;
              break;
            case 'today':
              if (isBefore(dueDate, today) || isAfter(dueDate, endOfDay(now))) return false;
              break;
            case 'week':
              if (isBefore(dueDate, today) || isAfter(dueDate, weekFromNow)) return false;
              break;
          }
        }

        return true;
      });
    });

    return result;
  }, [kanbanState, filters]);

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const order = active.data.current?.order as KanbanOrder;
    setActiveOrder(order);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveOrder(null);

    if (!over) return;

    const orderId = active.id as string;
    const newDepartmentId = over.id as string;

    // Find current department
    let currentDeptId: string | null = null;
    Object.entries(kanbanState).forEach(([deptId, deptOrders]) => {
      if (deptOrders.find((o) => o.id === orderId)) {
        currentDeptId = deptId;
      }
    });

    if (
      currentDeptId &&
      currentDeptId !== newDepartmentId &&
      KANBAN_DEPARTMENTS.find((d) => d.id === newDepartmentId)
    ) {
      try {
        // Save scroll position before refetch
        const scrollPosition = kanbanContainerRef.current?.scrollLeft || 0;

        // Call backend API to move the order
        await assignmentService.moveToDepartment(orderId, newDepartmentId);

        // Refresh data from backend
        await refetch();

        // Restore scroll position after refetch
        if (kanbanContainerRef.current) {
          // Use requestAnimationFrame to ensure DOM is updated before scrolling
          requestAnimationFrame(() => {
            if (kanbanContainerRef.current) {
              kanbanContainerRef.current.scrollLeft = scrollPosition;
            }
          });
        }

        const toDept = KANBAN_DEPARTMENTS.find((d) => d.id === newDepartmentId);
        toast.success(`Order moved to ${toDept?.displayName || newDepartmentId}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to move order');
      }
    }
  };

  const handleCardClick = useCallback((order: KanbanOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  }, []);

  const handleMoveOrder = useCallback(
    async (orderId: string, newDepartmentId: string) => {
      // Find current department
      let currentDeptId: string | null = null;
      Object.entries(kanbanState).forEach(([deptId, deptOrders]) => {
        if (deptOrders.find((o) => o.id === orderId)) {
          currentDeptId = deptId;
        }
      });

      if (currentDeptId && currentDeptId !== newDepartmentId) {
        try {
          setIsModalOpen(false);

          // Save scroll position before refetch
          const scrollPosition = kanbanContainerRef.current?.scrollLeft || 0;

          // Call backend API to move the order
          await assignmentService.moveToDepartment(orderId, newDepartmentId);

          // Refresh data from backend (this will update the UI)
          await refetch();

          // Restore scroll position after refetch
          if (kanbanContainerRef.current) {
            // Use requestAnimationFrame to ensure DOM is updated before scrolling
            requestAnimationFrame(() => {
              if (kanbanContainerRef.current) {
                kanbanContainerRef.current.scrollLeft = scrollPosition;
              }
            });
          }

          const toDept = KANBAN_DEPARTMENTS.find((d) => d.id === newDepartmentId);
          toast.success(`Order moved to ${toDept?.displayName || newDepartmentId}`);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Failed to move order');
        }
      }
    },
    [kanbanState, refetch]
  );

  const clearFilters = () => {
    setFilters({ dueDateRange: 'all' });
    setShowDepartmentDropdown(false);
    setShowWorkerDropdown(false);
  };

  // Calculate stats
  const stats = useMemo(() => {
    const allOrders = Object.values(kanbanState).flat();
    const now = new Date();

    return {
      total: allOrders.length,
      inProgress: allOrders.filter((o) => o.status === 'IN_PROGRESS').length,
      overdue: allOrders.filter((o) => isBefore(parseISO(o.dueDate), now)).length,
      urgent: allOrders.filter((o) => o.priority === 'URGENT').length,
    };
  }, [kanbanState]);

  const hasActiveFilters =
    filters.workerId ||
    filters.priority ||
    filters.search ||
    (filters.dueDateRange && filters.dueDateRange !== 'all') ||
    filters.departmentId;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-indigo-500 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-gray-500">Loading factory tracking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Factory Tracking</h1>
            {isWorker && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                View Only
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-1 font-medium">
            {isWorker
              ? 'View order status and department progress'
              : 'Drag orders between departments to update their status'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={() => refetch()}
            className="group p-2.5 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl text-gray-600 hover:from-indigo-50 hover:to-white hover:border-indigo-300 hover:text-indigo-600 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
            title="Refresh"
          >
            <svg
              className="w-5 h-5 transition-transform group-hover:rotate-180 duration-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
              hasActiveFilters
                ? 'border-indigo-400 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700'
                : 'border-gray-200 bg-gradient-to-br from-gray-50 to-white text-gray-700 hover:from-indigo-50 hover:to-white hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filters
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-white text-indigo-600 text-xs font-bold flex items-center justify-center shadow-inner">
                {
                  [
                    filters.workerId,
                    filters.priority,
                    filters.search,
                    filters.dueDateRange !== 'all' && filters.dueDateRange,
                    filters.departmentId,
                  ].filter(Boolean).length
                }
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
              <svg
                className="w-5 h-5 text-white"
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
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-600 font-medium">Total Orders</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm">
              <svg
                className="w-5 h-5 text-white"
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
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              <p className="text-xs text-gray-600 font-medium">In Progress</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-sm">
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
              <p className="text-xs text-gray-600 font-medium">Overdue</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-sm">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.urgent}</p>
              <p className="text-xs text-gray-600 font-medium">Urgent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Search</label>
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Order # or customer..."
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Department Filter */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-left flex items-center justify-between"
                >
                  <span className="text-gray-900">
                    {filters.departmentId
                      ? KANBAN_DEPARTMENTS.find((d) => d.id === filters.departmentId)?.displayName
                      : 'All Departments'}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      showDepartmentDropdown ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showDepartmentDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDepartmentDropdown(false)}
                    />
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setFilters({ ...filters, departmentId: undefined });
                          setShowDepartmentDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-indigo-50 transition-colors text-gray-900 font-medium"
                      >
                        All Departments
                      </button>
                      {KANBAN_DEPARTMENTS.map((dept) => {
                        const orderCount = departmentOrderCounts[dept.id] || 0;
                        return (
                          <button
                            key={dept.id}
                            type="button"
                            onClick={() => {
                              setFilters({ ...filters, departmentId: dept.id });
                              setShowDepartmentDropdown(false);
                            }}
                            className={`w-full px-3 py-2 text-left hover:bg-indigo-50 transition-colors flex items-center justify-between ${
                              filters.departmentId === dept.id ? 'bg-indigo-100' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: dept.color }}
                              />
                              <span className="text-gray-900">{dept.displayName}</span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {orderCount} {orderCount === 1 ? 'order' : 'orders'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Worker Filter */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Assigned Worker
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowWorkerDropdown(!showWorkerDropdown)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-left flex items-center justify-between"
                >
                  <span className="text-gray-900">
                    {filters.workerId
                      ? workersData?.find((w: any) => w.id === filters.workerId)?.name +
                        ` (${workerOrderCounts[filters.workerId] || 0} ${
                          workerOrderCounts[filters.workerId] === 1 ? 'order' : 'orders'
                        })`
                      : 'All Workers'}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      showWorkerDropdown ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showWorkerDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowWorkerDropdown(false)}
                    />
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setFilters({ ...filters, workerId: undefined });
                          setShowWorkerDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-indigo-50 transition-colors text-gray-900 font-medium"
                      >
                        All Workers
                      </button>
                      {workersData?.map((worker: any) => {
                        const orderCount = workerOrderCounts[worker.id] || 0;
                        return (
                          <button
                            key={worker.id}
                            type="button"
                            onClick={() => {
                              setFilters({ ...filters, workerId: worker.id });
                              setShowWorkerDropdown(false);
                            }}
                            className={`w-full px-3 py-2 text-left hover:bg-indigo-50 transition-colors flex items-center justify-between ${
                              filters.workerId === worker.id ? 'bg-indigo-100' : ''
                            }`}
                          >
                            <span className="text-gray-900">{worker.name}</span>
                            <span className="text-sm text-gray-500">
                              {orderCount} {orderCount === 1 ? 'order' : 'orders'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Due Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
              <select
                value={filters.dueDateRange || 'all'}
                onChange={(e) => setFilters({ ...filters, dueDateRange: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Dates</option>
                <option value="overdue">Overdue</option>
                <option value="today">Due Today</option>
                <option value="week">Due This Week</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select
                value={filters.priority || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    priority: (e.target.value || undefined) as
                      | 'LOW'
                      | 'NORMAL'
                      | 'HIGH'
                      | 'URGENT'
                      | undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-6 scroll-smooth" ref={kanbanContainerRef}>
        {isWorker ? (
          /* Read-only mode for workers - no drag and drop */
          <div className="flex gap-4 min-w-max h-full transition-all duration-300 ease-in-out">
            {KANBAN_DEPARTMENTS.map((dept) => (
              <KanbanColumn
                key={dept.id}
                department={dept}
                orders={filteredKanbanState[dept.id] || []}
                onCardClick={handleCardClick}
              />
            ))}
          </div>
        ) : (
          /* Interactive mode for Admin/Manager - with drag and drop */
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 min-w-max h-full transition-all duration-300 ease-in-out">
              {KANBAN_DEPARTMENTS.map((dept) => (
                <KanbanColumn
                  key={dept.id}
                  department={dept}
                  orders={filteredKanbanState[dept.id] || []}
                  onCardClick={handleCardClick}
                />
              ))}
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeOrder ? (
                <div className="opacity-90 transform rotate-3">
                  <KanbanCard order={activeOrder} onClick={() => {}} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onMoveOrder={handleMoveOrder}
      />

      {/* Mobile Scroll Hint */}
      <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
        Scroll horizontally to see all departments
      </div>
    </div>
  );
};

// Wrap with Error Boundary
const FactoryTrackingPageWithErrorBoundary = () => (
  <ErrorBoundary>
    <FactoryTrackingPage />
  </ErrorBoundary>
);

export default FactoryTrackingPageWithErrorBoundary;
