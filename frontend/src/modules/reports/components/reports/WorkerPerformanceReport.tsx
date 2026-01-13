/**
 * ============================================
 * WORKER PERFORMANCE REPORT
 * ============================================
 *
 * Report showing worker performance metrics
 * with orders handled and efficiency scores.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Trophy, Users, Target, Star } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type {
  ReportFilters,
  WorkerPerformanceReport as WorkerPerformanceReportType,
} from '../../../../types/report.types';
import { getAccessToken } from '../../../../services/auth.service';

interface WorkerPerformanceReportProps {
  filters: ReportFilters;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Color scale for efficiency score
function getEfficiencyColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#84cc16';
  if (score >= 40) return '#eab308';
  if (score >= 20) return '#f97316';
  return '#ef4444';
}

function getEfficiencyBadge(score: number): { label: string; color: string; bg: string } {
  if (score >= 90) return { label: 'Excellent', color: 'text-green-700', bg: 'bg-green-100' };
  if (score >= 75) return { label: 'Good', color: 'text-lime-700', bg: 'bg-lime-100' };
  if (score >= 50) return { label: 'Average', color: 'text-yellow-700', bg: 'bg-yellow-100' };
  if (score >= 25) return { label: 'Below Avg', color: 'text-orange-700', bg: 'bg-orange-100' };
  return { label: 'Needs Work', color: 'text-red-700', bg: 'bg-red-100' };
}

export const WorkerPerformanceReport: React.FC<WorkerPerformanceReportProps> = ({ filters }) => {
  const [report, setReport] = useState<WorkerPerformanceReportType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'efficiency' | 'orders' | 'onTime'>('efficiency');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const token = getAccessToken();
        const params = new URLSearchParams({
          startDate: filters.startDate,
          endDate: filters.endDate,
        });

        if (filters.departmentId) params.append('departmentId', filters.departmentId);
        if (filters.workerId) params.append('workerId', filters.workerId);

        const response = await fetch(`${API_URL}/reports/worker-performance?${params}`, {
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
          <span className="text-gray-500">Loading worker performance...</span>
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
        <Users className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-lg font-medium">No worker data available</p>
        <p className="text-sm">No work tracked during this period</p>
      </div>
    );
  }

  // Sort workers
  const sortedWorkers = [...report.data].sort((a, b) => {
    if (sortBy === 'efficiency') return b.efficiencyScore - a.efficiencyScore;
    if (sortBy === 'orders') return b.ordersCompleted - a.ordersCompleted;
    return b.efficiencyScore - a.efficiencyScore;
  });

  // Chart data
  const chartData = sortedWorkers.slice(0, 10).map((w) => ({
    name: w.workerName.split(' ')[0], // First name only for chart
    efficiency: w.efficiencyScore,
    orders: w.ordersCompleted,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Top Performer Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-500">Top Performer</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{report.topPerformer}</div>
          </div>
        </div>

        {/* Total Orders Completed Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/30">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-500">Total Orders Completed</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{report.totalOrdersCompleted}</div>
          </div>
        </div>

        {/* Avg. Efficiency Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-100 to-violet-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg shadow-purple-500/30">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-500">Avg. Efficiency</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{report.averageEfficiency}%</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Worker Efficiency Comparison</h4>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#374151' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'efficiency') return [`${value}%`, 'Efficiency Score'];
                  return [value, 'Orders Handled'];
                }}
              />
              <Bar dataKey="efficiency" name="Efficiency" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getEfficiencyColor(entry.efficiency)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Worker Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Worker Details</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="efficiency">Efficiency Score</option>
              <option value="orders">Orders Handled</option>
              <option value="onTime">On-Time Rate</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Worker
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Department
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Orders
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Completed
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Avg Time
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  On-Time
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Efficiency
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedWorkers.map((worker, index) => {
                const badge = getEfficiencyBadge(worker.efficiencyScore);

                return (
                  <tr key={worker.workerId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {index === 0 && (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Trophy className="w-4 h-4 text-indigo-600" />
                          </div>
                        )}
                        {index === 1 && (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-bold text-gray-600">2</span>
                          </div>
                        )}
                        {index === 2 && (
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <span className="text-sm font-bold text-orange-600">3</span>
                          </div>
                        )}
                        {index > 2 && (
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-sm text-gray-500">{index + 1}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-sm">
                          {worker.workerName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        <span className="font-medium text-gray-900">{worker.workerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{worker.department}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900 font-medium">
                      {worker.ordersCompleted}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-green-600">
                      {worker.ordersCompleted}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {worker.averageTimeHours}h
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex px-2 py-0.5 text-xs font-medium rounded-full',
                          worker.efficiencyScore >= 80
                            ? 'bg-green-100 text-green-700'
                            : worker.efficiencyScore >= 60
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        )}
                      >
                        {worker.efficiencyScore}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'w-4 h-4',
                                i < Math.round(worker.efficiencyScore / 20)
                                  ? 'text-indigo-400 fill-indigo-400'
                                  : 'text-gray-200'
                              )}
                            />
                          ))}
                        </div>
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs font-medium rounded-full',
                            badge.bg,
                            badge.color
                          )}
                        >
                          {worker.efficiencyScore}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkerPerformanceReport;
