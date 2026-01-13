/**
 * ============================================
 * DASHBOARD PAGE
 * ============================================
 *
 * Main dashboard page with metrics, charts, and activity timeline.
 * Uses React Query for data fetching with loading skeletons.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, isBefore } from 'date-fns';
import { useAuth } from '../../../contexts/AuthContext';
import { useDashboardData } from '../hooks/useDashboard';
import {
  MetricCard,
  MetricCardSkeleton,
  DepartmentWorkloadChart,
  OrderStatusChart,
  ActivityTimeline,
} from '../components';
import { ordersService } from '../../orders/services';

// ============================================
// METRIC ICONS
// ============================================

const ClipboardIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    />
  </svg>
);

const SpinnerIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ExclamationIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// ============================================
// COMPONENT
// ============================================

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isWorker = user?.role === 'DEPARTMENT_WORKER';
  const { data, isLoading, error, refetch, isFetching } = useDashboardData({ enabled: !isWorker });

  // Fetch worker-specific data
  const { data: workerOrders, isLoading: workerLoading } = useQuery({
    queryKey: ['worker-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return { data: [], pagination: {} };
      // Use assignedToId as a query parameter (not in filters object)
      const queryFilters: any = { assignedToId: user.id };
      return await ordersService.getAll({
        page: 1,
        limit: 50,
        filters: queryFilters,
      });
    },
    enabled: isWorker && !!user?.id,
    staleTime: 30000,
  });

  // Process worker metrics
  const workerMetrics = useMemo(() => {
    if (!workerOrders?.data) return { total: 0, inProgress: 0, completedToday: 0, overdue: 0 };

    const orders = workerOrders.data;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      total: orders.length,
      inProgress: orders.filter((o: any) => o.status === 'IN_FACTORY' || o.status === 'IN_PROGRESS')
        .length,
      completedToday: orders.filter((o: any) => {
        if (o.status !== 'COMPLETED') return false;
        const updated = new Date(o.updatedAt);
        return updated >= today;
      }).length,
      overdue: orders.filter((o: any) => {
        if (o.status === 'COMPLETED' || o.status === 'DELIVERED') return false;
        const due = new Date(o.dueDate);
        return due < new Date();
      }).length,
    };
  }, [workerOrders]);

  // Get current assignments (top 5)
  const currentAssignments = useMemo(() => {
    if (!workerOrders?.data) return [];
    return workerOrders.data
      .filter((o: any) => o.status !== 'COMPLETED' && o.status !== 'DELIVERED')
      .slice(0, 5);
  }, [workerOrders]);

  // Get recent activity (last 5 completed or updated)
  const workerActivity = useMemo(() => {
    if (!workerOrders?.data) return [];
    return [...workerOrders.data]
      .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map((order: any) => ({
        id: order.id,
        type: 'order_updated' as const,
        title: `Order ${order.orderNumber}`,
        description: `Status: ${order.status}`,
        timestamp: order.updatedAt,
      }));
  }, [workerOrders]);

  // Get current hour for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Format date
  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header - Enhanced */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-gray-500 font-medium">{formatDate()}</p>
        </div>
        <div className="flex items-center gap-3">
          {!isWorker && (
            <>
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className={`
                  group inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl
                  transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                  ${
                    isFetching
                      ? 'text-indigo-700 bg-indigo-100 border border-indigo-200 cursor-wait'
                      : 'text-gray-700 bg-white/90 backdrop-blur-sm border border-gray-200/50 hover:bg-white hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10'
                  }
                `}
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-500 ${
                    isFetching ? 'animate-spin' : 'group-hover:rotate-180'
                  }`}
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
              <button
                onClick={() => navigate('/orders/new')}
                className="
                  group inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white
                  bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-600 rounded-xl
                  hover:from-indigo-600 hover:via-purple-600 hover:to-violet-700
                  shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40
                  transform hover:scale-[1.02] active:scale-[0.98]
                  transition-all duration-300
                "
              >
                <svg
                  className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                New Order
              </button>
            </>
          )}
        </div>
      </div>

      {/* WORKER DASHBOARD */}
      {isWorker && (
        <>
          {/* Worker Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            {workerLoading ? (
              <>
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
              </>
            ) : (
              <>
                <MetricCard
                  title="My Total Orders"
                  value={workerMetrics.total}
                  icon={<ClipboardIcon className="w-6 h-6 text-white" />}
                  color="blue"
                />
                <MetricCard
                  title="In Progress"
                  value={workerMetrics.inProgress}
                  icon={<SpinnerIcon className="w-6 h-6 text-white" />}
                  color="gold"
                />
                <MetricCard
                  title="Completed Today"
                  value={workerMetrics.completedToday}
                  icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
                  color="green"
                />
                <MetricCard
                  title="Overdue"
                  value={workerMetrics.overdue}
                  icon={<ExclamationIcon className="w-6 h-6 text-white" />}
                  color="red"
                />
              </>
            )}
          </div>

          {/* Department Context */}
          {user?.department && (
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-600 rounded-3xl p-6 shadow-2xl shadow-indigo-500/30">
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-indigo-100 text-sm font-semibold uppercase tracking-wide">
                    Your Department
                  </p>
                  <p className="text-2xl font-bold mt-1">{user.department}</p>
                </div>
                <div className="text-center">
                  <p className="text-indigo-100 text-sm font-semibold uppercase tracking-wide">
                    Active Items
                  </p>
                  <p className="text-3xl font-bold mt-1">{workerMetrics.inProgress}</p>
                </div>
                <div className="text-center">
                  <p className="text-indigo-100 text-sm font-semibold uppercase tracking-wide">
                    Completed
                  </p>
                  <p className="text-3xl font-bold mt-1">{workerMetrics.completedToday}</p>
                </div>
              </div>
            </div>
          )}

          {/* Current Assignments */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
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
              </span>
              My Current Assignments
            </h3>
            {workerLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : currentAssignments.length > 0 ? (
              <div className="space-y-3">
                {currentAssignments.map((order: any) => {
                  const dueDate = parseISO(order.dueDate);
                  const isOverdue = isBefore(dueDate, new Date()) && order.status !== 'COMPLETED';
                  return (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        {order.productPhotoUrl || order.productImage ? (
                          <img
                            src={order.productPhotoUrl || order.productImage}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">
                          {order.productType || 'Manufacturing details pending'}
                        </p>
                      </div>
                      <div className="text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'IN_PROGRESS' || order.status === 'IN_FACTORY'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-medium ${
                            isOverdue ? 'text-red-600' : 'text-gray-600'
                          }`}
                        >
                          {format(dueDate, 'MMM d')}
                        </p>
                        {isOverdue && <p className="text-xs text-red-500">Overdue</p>}
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-gray-300"
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
                <p className="font-medium">No active assignments</p>
                <p className="text-sm mt-1">You're all caught up!</p>
              </div>
            )}
          </div>

          {/* Worker Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
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
                </span>
                My Recent Activity
              </h3>
              {workerLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : workerActivity.length > 0 ? (
                <div className="space-y-4">
                  {workerActivity.map((activity: any) => (
                    <div
                      key={activity.id}
                      className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-indigo-600"
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
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(parseISO(activity.timestamp), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">No recent activity</p>
              )}
            </div>

            {/* Quick Actions for Workers - kept existing */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-gray-100/50 hover:shadow-xl transition-all duration-300">
              <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-orange-500 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
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
                </span>
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/orders')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group shadow-sm hover:shadow-md"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
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
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">View Orders</p>
                    <p className="text-sm text-gray-500">Manage all orders</p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-300 ml-auto group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => navigate('/factory-tracking')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 transition-all duration-300 group shadow-sm hover:shadow-md"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Factory Status</p>
                    <p className="text-sm text-gray-500">Check department progress</p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-300 ml-auto group-hover:text-purple-500 group-hover:translate-x-1 transition-all duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Error State - Enhanced (admin only) */}
      {!isWorker && error && (
        <div className="p-5 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-2xl flex items-start gap-4 shadow-lg shadow-red-500/10">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
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
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Failed to load dashboard data</p>
            <p className="text-sm text-red-600 mt-1">{error.message}</p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 text-sm font-semibold text-red-600 hover:text-white hover:bg-red-500 rounded-xl transition-all duration-200"
          >
            Try again
          </button>
        </div>
      )}

      {/* Metric Cards - Enhanced Grid (admin only) */}
      {!isWorker && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {isLoading ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : data ? (
            <>
              <MetricCard
                title="Total Orders"
                value={data.metrics.totalOrders}
                change={{ value: 12, percentage: 8.2, isPositive: true }}
                icon={<ClipboardIcon className="w-6 h-6 text-white" />}
                color="gold"
              />
              <MetricCard
                title="In Progress"
                value={data.metrics.ordersInProgress}
                change={{ value: 5, percentage: 3.1, isPositive: true }}
                icon={<SpinnerIcon className="w-6 h-6 text-white" />}
                color="blue"
              />
              <MetricCard
                title="Completed Today"
                value={data.metrics.completedToday}
                change={{ value: 2, percentage: 15.4, isPositive: true }}
                icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
                color="green"
              />
              <MetricCard
                title="Overdue"
                value={data.metrics.overdueOrders}
                change={{ value: 2, percentage: 40, isPositive: false }}
                icon={<ExclamationIcon className="w-6 h-6 text-white" />}
                color="red"
              />
            </>
          ) : null}
        </div>
      )}

      {/* Quick Stats Bar - Enhanced with Glassmorphism (admin only) */}
      {!isWorker && data && !isLoading && (
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-600 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-500/30">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-600/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>

          <div className="relative grid grid-cols-2 lg:grid-cols-6 gap-4 lg:gap-6">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm mb-3 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">🥇</span>
              </div>
              <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wide">
                Gold in Process
              </p>
              <p className="text-white text-2xl font-bold mt-1">
                {data.metrics.totalGoldInProcess.toLocaleString()}g
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm mb-3 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">🥈</span>
              </div>
              <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wide">
                Silver in Process
              </p>
              <p className="text-white text-2xl font-bold mt-1">
                {data.metrics.totalSilverInProcess.toLocaleString()}g
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm mb-3 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">✨</span>
              </div>
              <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wide">
                Platinum in Process
              </p>
              <p className="text-white text-2xl font-bold mt-1">
                {data.metrics.totalPlatinumInProcess.toLocaleString()}g
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm mb-3 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-6 h-6 text-white"
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
              <p className="text-indigo-100 text-sm font-semibold uppercase tracking-wide">
                Pending Submissions
              </p>
              <p className="text-white text-3xl font-bold mt-1">
                {data.metrics.pendingSubmissions}
              </p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm mb-3 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-6 h-6 text-white"
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
              </div>
              <p className="text-indigo-100 text-sm font-semibold uppercase tracking-wide">
                Active Departments
              </p>
              <p className="text-white text-3xl font-bold mt-1">{data.departmentWorkload.length}</p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm mb-3 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <p className="text-indigo-100 text-sm font-semibold uppercase tracking-wide">
                Efficiency Rate
              </p>
              <p className="text-white text-3xl font-bold mt-1">
                {data.metrics.totalOrders > 0
                  ? (
                      ((data.metrics.totalOrders - data.metrics.overdueOrders) /
                        data.metrics.totalOrders) *
                      100
                    ).toFixed(1)
                  : '0.0'}
                %
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row - Enhanced (admin only) */}
      {!isWorker && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Workload Chart - Takes 2 columns */}
          <div className="lg:col-span-2">
            <DepartmentWorkloadChart data={data?.departmentWorkload || []} isLoading={isLoading} />
          </div>

          {/* Order Status Chart */}
          <OrderStatusChart data={data?.orderStatusDistribution || []} isLoading={isLoading} />
        </div>
      )}

      {/* Activity Timeline & Quick Actions - Enhanced (admin only) */}
      {!isWorker && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity - Takes 2 columns */}
          <div className="lg:col-span-2">
            <ActivityTimeline activities={data?.recentActivity || []} isLoading={isLoading} />
          </div>

          {/* Quick Actions - Enhanced */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-gray-100/50 hover:shadow-xl transition-all duration-300">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-orange-500 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
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
              </span>
              Quick Actions
            </h3>
            <div className="space-y-3">
              {!isWorker && (
                <button
                  onClick={() => navigate('/orders/new')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-indigo-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-orange-50 transition-all duration-300 group shadow-sm hover:shadow-md"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-orange-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform duration-300">
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
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Create Order</p>
                    <p className="text-sm text-gray-500">Add a new jewelry order</p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-300 ml-auto group-hover:text-indigo-500 group-hover:translate-x-1 transition-all duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}

              <button
                onClick={() => navigate('/orders')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
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
                <div className="text-left">
                  <p className="font-semibold text-gray-900">View Orders</p>
                  <p className="text-sm text-gray-500">Manage all orders</p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-300 ml-auto group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <button
                onClick={() => navigate('/factory-tracking')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 transition-all duration-300 group shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Factory Status</p>
                  <p className="text-sm text-gray-500">Check department progress</p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-300 ml-auto group-hover:text-purple-500 group-hover:translate-x-1 transition-all duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              {!isWorker && (
                <button
                  onClick={() => navigate('/reports')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-emerald-300 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all duration-300 group shadow-sm hover:shadow-md"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
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
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Reports</p>
                    <p className="text-sm text-gray-500">View analytics & reports</p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-300 ml-auto group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
