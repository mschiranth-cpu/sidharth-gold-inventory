/**
 * ============================================
 * MY WORK PAGE
 * ============================================
 *
 * Page for department workers to view and manage
 * their assigned orders.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { differenceInHours as _differenceInHours, isPast as _isPast } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { ordersService } from '../../modules/orders/services';
import { CurrentAssignmentsCard } from '../../components/CurrentAssignmentsCard';

// ============================================
// TYPES
// ============================================

// WorkOrder type is available from ordersService response

// ============================================
// MAIN COMPONENT
// ============================================

const MyWorkPage: React.FC = () => {
  const { user } = useAuth();
  // Default to 'assigned' for workers
  const [filter, setFilter] = useState<'assigned' | 'all' | 'in-progress' | 'urgent' | 'completed'>(
    'assigned'
  );

  // Fetch IN_FACTORY orders
  const {
    data: ordersResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['my-work-orders'],
    queryFn: async () => {
      const response = await ordersService.getAll({
        page: 1,
        limit: 100,
        filters: {
          status: 'IN_FACTORY',
        },
      });
      return response;
    },
    refetchInterval: 30000,
  });

  // Filter orders assigned to current user
  const myOrders = useMemo(() => {
    if (!ordersResponse?.data || !user) return [];

    return ordersResponse.data.filter((order: any) => {
      // Check if user is assigned to any department in this order
      const isAssigned = order.departmentTracking?.some((dt: any) => dt.assignedTo?.id === user.id);

      // Check if user is working on this order (assigned to IN_PROGRESS department)
      const isWorking = order.departmentTracking?.some(
        (dt: any) => dt.assignedTo?.id === user.id && dt.status === 'IN_PROGRESS'
      );

      // Check if user has completed their work on this order
      const hasCompleted = order.departmentTracking?.some(
        (dt: any) => dt.assignedTo?.id === user.id && dt.status === 'COMPLETED'
      );

      // Check if this is an urgent order assigned to the user
      const isUrgent = isAssigned && order.priority >= 3;

      if (filter === 'assigned') return isAssigned && !hasCompleted;
      if (filter === 'in-progress') return isWorking;
      if (filter === 'urgent') return isUrgent && !hasCompleted;
      if (filter === 'completed') return hasCompleted;
      return isAssigned || isWorking || hasCompleted;
    });
  }, [ordersResponse, user, filter]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
    toast.success('Refreshed');
  }, [refetch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Work</h1>
          <p className="text-gray-500 mt-1">View and manage orders assigned to you</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
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
          {isFetching ? 'Syncing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Assigned Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
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
              <span className="text-sm font-medium text-gray-500">Total Assigned</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {ordersResponse?.data?.filter((o: any) =>
                o.departmentTracking?.some((dt: any) => dt.assignedTo?.id === user?.id)
              ).length || 0}
            </div>
          </div>
        </div>

        {/* In Progress Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/30">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-500">In Progress</span>
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {ordersResponse?.data?.filter((o: any) =>
                o.departmentTracking?.some(
                  (dt: any) => dt.assignedTo?.id === user?.id && dt.status === 'IN_PROGRESS'
                )
              ).length || 0}
            </div>
          </div>
        </div>

        {/* Urgent Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-red-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-100 to-rose-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg shadow-red-500/30">
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
              <span className="text-sm font-medium text-gray-500">Urgent Orders</span>
            </div>
            <div className="text-3xl font-bold text-red-600">
              {ordersResponse?.data?.filter(
                (o: any) =>
                  o.departmentTracking?.some((dt: any) => dt.assignedTo?.id === user?.id) &&
                  o.priority >= 3
              ).length || 0}
            </div>
          </div>
        </div>

        {/* Completed Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/30">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-500">Completed</span>
            </div>
            <div className="text-3xl font-bold text-green-600">
              {ordersResponse?.data?.filter((o: any) =>
                o.departmentTracking?.some(
                  (dt: any) => dt.assignedTo?.id === user?.id && dt.status === 'COMPLETED'
                )
              ).length || 0}
            </div>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-amber-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl shadow-lg shadow-amber-500/30">
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-500">Total Orders</span>
            </div>
            <div className="text-3xl font-bold text-amber-600">
              {ordersResponse?.data?.length || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
        <div className="flex gap-2">
          {[
            { id: 'assigned', label: 'Assigned' },
            { id: 'in-progress', label: 'In Progress' },
            { id: 'urgent', label: 'Urgent' },
            { id: 'completed', label: 'Completed' },
            { id: 'all', label: 'All Orders' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === tab.id
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
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
            <span className="ml-3 text-gray-600">Loading your orders...</span>
          </div>
        </div>
      ) : myOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
            <h3 className="mt-4 text-lg font-medium text-gray-900">No orders assigned</h3>
            <p className="mt-2 text-gray-500">
              You don't have any orders assigned to you yet. Check back later or contact your
              supervisor.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {myOrders.map((order: any) => {
            // Find the department where user is assigned
            const userAssignedDept = order.departmentTracking?.find(
              (dt: any) => dt.assignedTo?.id === user?.id
            );

            return (
              <CurrentAssignmentsCard
                key={order.id}
                order={order}
                userDepartment={userAssignedDept?.departmentName || order.currentDepartment}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyWorkPage;
