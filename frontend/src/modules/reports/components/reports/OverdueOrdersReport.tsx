/**
 * ============================================
 * OVERDUE ORDERS REPORT
 * ============================================
 *
 * List of overdue orders with escalation levels.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  AlertTriangle,
  AlertCircle,
  XCircle,
  Flame,
  ExternalLink,
  TrendingUp,
  User,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type {
  ReportFilters,
  OverdueOrdersReport as OverdueOrdersReportType,
  EscalationLevel,
} from '../../../../types/report.types';
import { getAccessToken } from '../../../../services/auth.service';

interface OverdueOrdersReportProps {
  filters: ReportFilters;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const ESCALATION_CONFIG: Record<
  EscalationLevel,
  {
    icon: React.FC<{ className?: string }>;
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  WARNING: {
    icon: AlertCircle,
    label: 'Warning (1-2 days)',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
  },
  CRITICAL: {
    icon: AlertTriangle,
    label: 'Critical (3-5 days)',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
  },
  SEVERE: {
    icon: XCircle,
    label: 'Severe (6-10 days)',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
  },
  EMERGENCY: {
    icon: Flame,
    label: 'Emergency (10+ days)',
    color: 'text-red-800',
    bgColor: 'bg-red-200',
    borderColor: 'border-red-400',
  },
};

export const OverdueOrdersReport: React.FC<OverdueOrdersReportProps> = ({ filters }) => {
  const [report, setReport] = useState<OverdueOrdersReportType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<EscalationLevel | 'ALL'>('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const token = getAccessToken();
        const params = new URLSearchParams();

        if (filters.departmentId) params.append('departmentId', filters.departmentId);
        if (filters.workerId) params.append('workerId', filters.workerId);

        const response = await fetch(`${API_URL}/reports/overdue-orders?${params}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch report data');
        }

        const data = await response.json();
        setReport(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500">Loading overdue orders...</span>
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
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-green-600" />
        </div>
        <p className="text-lg font-medium text-green-600">No Overdue Orders!</p>
        <p className="text-sm text-gray-500">All orders are on track</p>
      </div>
    );
  }

  const filteredOrders =
    filterLevel === 'ALL'
      ? report.data
      : report.data.filter((o) => o.escalationLevel === filterLevel);

  return (
    <div className="space-y-6">
      {/* Escalation Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(Object.keys(ESCALATION_CONFIG) as EscalationLevel[]).map((level) => {
          const config = ESCALATION_CONFIG[level];
          const Icon = config.icon;
          const count =
            report.byEscalation[level.toLowerCase() as keyof typeof report.byEscalation];

          return (
            <button
              key={level}
              onClick={() => setFilterLevel(filterLevel === level ? 'ALL' : level)}
              className={cn(
                'p-4 rounded-xl border-2 transition-all',
                filterLevel === level
                  ? `${config.borderColor} ${config.bgColor}`
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', config.bgColor)}>
                  <Icon className={cn('w-5 h-5', config.color)} />
                </div>
                <div className="text-left">
                  <p className={cn('text-2xl font-bold', config.color)}>{count}</p>
                  <p className="text-xs text-gray-500">{level}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Overdue Card */}
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-500">Total Overdue</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{report.totalOverdue}</div>
          </div>
        </div>

        {/* Avg. Days Overdue Card */}
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-500">Avg. Days Overdue</span>
            </div>
            <div className="text-3xl font-bold text-red-600">{report.averageDaysOverdue}</div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-end gap-2 p-4 bg-gray-50 rounded-xl">
        <span className="text-sm text-gray-500">Filter:</span>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value as EscalationLevel | 'ALL')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All Levels</option>
          {(Object.keys(ESCALATION_CONFIG) as EscalationLevel[]).map((level) => (
            <option key={level} value={level}>
              {ESCALATION_CONFIG[level].label}
            </option>
          ))}
        </select>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.map((order) => {
          const config = ESCALATION_CONFIG[order.escalationLevel];
          const Icon = config.icon;

          return (
            <div
              key={order.orderId}
              className={cn(
                'p-4 rounded-xl border-2 transition-all hover:shadow-md',
                config.borderColor,
                config.bgColor
              )}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className={cn('p-3 rounded-lg bg-white/50')}>
                    <Icon className={cn('w-6 h-6', config.color)} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        to={`/orders/${order.orderId}`}
                        className="text-lg font-semibold text-gray-900 hover:text-indigo-600"
                      >
                        {order.orderNumber}
                      </Link>
                      <span
                        className={cn(
                          'px-2 py-0.5 text-xs font-medium rounded-full',
                          config.bgColor,
                          config.color
                        )}
                      >
                        {order.escalationLevel}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{order.customerName}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>Due: {format(parseISO(order.dueDate), 'MMM d, yyyy')}</span>
                      <span className={cn('font-medium', config.color)}>
                        {order.daysOverdue} day{order.daysOverdue !== 1 ? 's' : ''} overdue
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:items-end">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <TrendingUp className="w-4 h-4" />
                    {order.currentDepartment}
                  </div>
                  {order.assignedWorker && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      {order.assignedWorker}
                    </div>
                  )}
                  <Link
                    to={`/orders/${order.orderId}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors"
                  >
                    View Details
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <p>No orders match the selected filter</p>
        </div>
      )}
    </div>
  );
};

export default OverdueOrdersReport;
