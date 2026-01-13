/**
 * ============================================
 * DEPARTMENT EFFICIENCY CHART
 * ============================================
 *
 * Horizontal bar chart showing average time
 * and efficiency per department.
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
import { Award, Clock, TrendingUp } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type { ReportFilters, DepartmentEfficiencyReport } from '../../../../types/report.types';
import { getAccessToken } from '../../../../services/auth.service';

interface DepartmentEfficiencyChartProps {
  filters: ReportFilters;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Color scale for efficiency score
function getEfficiencyColor(score: number): string {
  if (score >= 80) return '#22c55e'; // green
  if (score >= 60) return '#84cc16'; // lime
  if (score >= 40) return '#eab308'; // yellow
  if (score >= 20) return '#f97316'; // orange
  return '#ef4444'; // red
}

export const DepartmentEfficiencyChart: React.FC<DepartmentEfficiencyChartProps> = ({
  filters,
}) => {
  const [report, setReport] = useState<DepartmentEfficiencyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const response = await fetch(`${API_URL}/reports/department-efficiency?${params}`, {
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
          <span className="text-gray-500">Loading chart data...</span>
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
      <div className="flex items-center justify-center h-96 text-gray-500">
        <p>No department data available for the selected period</p>
      </div>
    );
  }

  // Prepare chart data
  const chartData = report.data.map((d) => ({
    name: d.departmentName,
    avgTime: d.averageTimeHours,
    efficiency: d.efficiencyScore,
    completed: d.ordersCompleted,
    inProgress: d.ordersInProgress,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Fastest Department Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-emerald-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg shadow-emerald-500/30">
                <Award className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-500">Fastest Department</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">{report.fastestDepartment}</div>
          </div>
        </div>

        {/* Avg. Time Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-500">Avg. Time (All Depts)</span>
            </div>
            <div className="text-2xl font-bold text-indigo-600">
              {report.overallAverageTime} hours
            </div>
          </div>
        </div>

        {/* Needs Improvement Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-red-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-100 to-rose-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg shadow-red-500/30">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-500">Needs Improvement</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{report.slowestDepartment}</div>
          </div>
        </div>
      </div>

      {/* Efficiency Score Chart */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-4">Efficiency Score by Department</h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: '#374151' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                width={90}
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
                  return [value, name];
                }}
              />
              <Bar dataKey="efficiency" name="Efficiency" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getEfficiencyColor(entry.efficiency)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Average Time Chart */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-4">Average Processing Time (Hours)</h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: '#374151' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value: number) => [`${value} hours`, 'Avg. Time']}
              />
              <Bar dataKey="avgTime" name="Avg. Time" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Details Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Department
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Completed
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                In Progress
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Avg. Time
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Efficiency
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {report.data.map((dept) => (
              <tr key={dept.departmentId} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {dept.departmentName}
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-600">
                  {dept.ordersCompleted}
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-600">
                  {dept.ordersInProgress}
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-600">
                  {dept.averageTimeHours}h
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      dept.efficiencyScore >= 80
                        ? 'bg-green-100 text-green-800'
                        : dept.efficiencyScore >= 60
                        ? 'bg-lime-100 text-lime-800'
                        : dept.efficiencyScore >= 40
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    )}
                  >
                    {dept.efficiencyScore}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DepartmentEfficiencyChart;
