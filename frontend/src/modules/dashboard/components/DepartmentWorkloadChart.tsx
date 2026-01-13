/**
 * ============================================
 * DEPARTMENT WORKLOAD CHART
 * ============================================
 * 
 * Bar chart showing workload across departments.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import ChartContainer, { ChartSkeleton } from './ChartContainer';
import type { DepartmentWorkload } from '../../../types/dashboard.types';

interface DepartmentWorkloadChartProps {
  data: DepartmentWorkload[];
  isLoading?: boolean;
}

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-3 min-w-[160px]">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map((item, index) => (
        <div key={index} className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            ></div>
            <span className="text-gray-600">{item.name}</span>
          </div>
          <span className="font-medium text-gray-900">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

const DepartmentWorkloadChart: React.FC<DepartmentWorkloadChartProps> = ({
  data,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <ChartContainer title="Department Workload" subtitle="Current items in each department">
        <ChartSkeleton height="h-80" />
      </ChartContainer>
    );
  }

  return (
    <ChartContainer 
      title="Department Workload" 
      subtitle="Current items in each department"
      action={
        <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
          <option>This Week</option>
          <option>This Month</option>
          <option>Last 7 Days</option>
        </select>
      }
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis 
              dataKey="departmentName" 
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis 
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Bar 
              dataKey="activeItems" 
              name="Active" 
              fill="#F59E0B" 
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
            <Bar 
              dataKey="pendingItems" 
              name="Pending" 
              fill="#60A5FA" 
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
            <Bar 
              dataKey="completedToday" 
              name="Completed" 
              fill="#34D399" 
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
};

export default DepartmentWorkloadChart;
