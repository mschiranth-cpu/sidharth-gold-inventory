/**
 * ============================================
 * PENDING ORDERS REPORT
 * ============================================
 *
 * List of pending orders grouped by department.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ChevronDown, ChevronRight, Clock, AlertCircle, Scale, ExternalLink } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type {
  ReportFilters,
  PendingOrdersReport as PendingOrdersReportType,
  PendingOrdersByDepartment,
} from '../../../../types/report.types';
import { getAccessToken } from '../../../../services/auth.service';

interface PendingOrdersReportProps {
  filters: ReportFilters;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const PRIORITY_COLORS = {
  LOW: { bg: 'bg-gray-100', text: 'text-gray-700' },
  MEDIUM: { bg: 'bg-blue-100', text: 'text-blue-700' },
  HIGH: { bg: 'bg-orange-100', text: 'text-orange-700' },
  URGENT: { bg: 'bg-red-100', text: 'text-red-700' },
};

export const PendingOrdersReport: React.FC<PendingOrdersReportProps> = ({ filters }) => {
  const [report, setReport] = useState<PendingOrdersReportType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const token = getAccessToken();
        const params = new URLSearchParams();

        if (filters.departmentId) params.append('departmentId', filters.departmentId);

        const response = await fetch(`${API_URL}/reports/pending-orders?${params}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch report data');
        }

        const data = await response.json();
        setReport(data.data);

        // Expand all departments by default
        const deptIds = new Set<string>(
          data.data.data.map((d: PendingOrdersByDepartment) => d.departmentId)
        );
        setExpandedDepts(deptIds);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const toggleDepartment = (deptId: string) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) {
        next.delete(deptId);
      } else {
        next.add(deptId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500">Loading pending orders...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!report || report.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <Clock className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-lg font-medium">No pending orders</p>
        <p className="text-sm">All orders have been completed</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4">
          <p className="text-sm text-indigo-600 font-medium">Total Pending</p>
          <p className="text-3xl font-bold text-indigo-700">{report.totalPendingOrders}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-600 font-medium">Critical (Due in 24h)</p>
          </div>
          <p className="text-3xl font-bold text-red-700">{report.criticalOrders}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
          <p className="text-sm text-blue-600 font-medium">Departments with Orders</p>
          <p className="text-3xl font-bold text-blue-700">{report.data.length}</p>
        </div>
      </div>

      {/* Department Groups */}
      <div className="space-y-4">
        {report.data.map((dept) => (
          <div
            key={dept.departmentId}
            className="border border-gray-200 rounded-xl overflow-hidden"
          >
            {/* Department Header */}
            <button
              onClick={() => toggleDepartment(dept.departmentId)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedDepts.has(dept.departmentId) ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
                <span className="font-semibold text-gray-900">{dept.departmentName}</span>
                <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                  {dept.totalOrders} orders
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Scale className="w-4 h-4" />
                {dept.totalWeight.toFixed(2)}g total
              </div>
            </button>

            {/* Orders Table */}
            {expandedDepts.has(dept.departmentId) && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Order
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Customer
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        Priority
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        Due Date
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        Days in Dept
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        Weight
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dept.orders.map((order) => {
                      const priorityConfig = PRIORITY_COLORS[order.priority];
                      const isOverdue = new Date(order.dueDate) < new Date();
                      const isDueSoon =
                        !isOverdue &&
                        new Date(order.dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000);

                      return (
                        <tr
                          key={order.orderId}
                          className={cn('hover:bg-gray-50', isOverdue && 'bg-red-50')}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-indigo-600">
                            {order.orderNumber}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{order.customerName}</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={cn(
                                'inline-flex px-2 py-0.5 text-xs font-medium rounded-full',
                                priorityConfig.bg,
                                priorityConfig.text
                              )}
                            >
                              {order.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={cn(
                                'text-sm',
                                isOverdue
                                  ? 'text-red-600 font-medium'
                                  : isDueSoon
                                  ? 'text-orange-600 font-medium'
                                  : 'text-gray-600'
                              )}
                            >
                              {format(parseISO(order.dueDate), 'MMM d, yyyy')}
                              {isOverdue && ' (Overdue)'}
                              {isDueSoon && ' (Due Soon)'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-600">
                            {order.daysInDepartment} day{order.daysInDepartment !== 1 ? 's' : ''}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-600">
                            {order.totalWeight.toFixed(2)}g
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link
                              to={`/orders/${order.orderId}`}
                              className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                            >
                              View
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingOrdersReport;
