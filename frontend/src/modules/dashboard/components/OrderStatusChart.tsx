/**
 * ============================================
 * ORDER STATUS PIE CHART
 * ============================================
 *
 * Pie chart showing distribution of order statuses.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ChartContainer, { ChartSkeleton } from './ChartContainer';
import type { OrderStatusDistribution } from '../../../types/dashboard.types';

interface OrderStatusChartProps {
  data: OrderStatusDistribution[];
  isLoading?: boolean;
}

// Custom tooltip
const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: OrderStatusDistribution }>;
}) => {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0];
  if (!item) return null;

  const total = item.payload ? 248 : 0; // Total orders
  const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.payload.color }}></div>
        <span className="font-semibold text-gray-900">{item.name}</span>
      </div>
      <p className="text-sm text-gray-600">
        {item.value} orders ({percentage}%)
      </p>
    </div>
  );
};

// Custom legend
const CustomLegend = ({
  payload,
}: {
  payload?: Array<{ value: string; color: string; payload: { count: number } }>;
}) => {
  if (!payload) return null;

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
          <span className="text-sm text-gray-600">
            {entry.value}: <span className="font-medium text-gray-900">{entry.payload.count}</span>
          </span>
        </div>
      ))}
    </div>
  );
};

const OrderStatusChart: React.FC<OrderStatusChartProps> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <ChartContainer title="Order Status" subtitle="Distribution by status">
        <ChartSkeleton height="h-80" />
      </ChartContainer>
    );
  }

  const totalOrders = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <ChartContainer title="Order Status" subtitle="Distribution by status">
      <div className="h-80 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={105}
              paddingAngle={2}
              dataKey="count"
              nameKey="status"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} verticalAlign="bottom" />
          </PieChart>
        </ResponsiveContainer>

        {/* Center text - positioned on top */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          style={{ paddingBottom: '100px' }}
        >
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-900">{totalOrders}</p>
            <p className="text-sm text-gray-500 mt-1">Total Orders</p>
          </div>
        </div>
      </div>
    </ChartContainer>
  );
};

export default OrderStatusChart;
