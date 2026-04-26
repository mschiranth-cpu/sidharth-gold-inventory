import { Factory } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { WidgetCard } from './WidgetCard';
import type { DepartmentWorkloadRow } from '../../../../types/dashboard.types';

export interface DepartmentWorkloadChartProps {
  data: DepartmentWorkloadRow[] | undefined;
  isLoading?: boolean;
  editMode?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onHide?: () => void;
}

export const DepartmentWorkloadChart = ({
  data,
  isLoading,
  editMode,
  dragHandleProps,
  onHide,
}: DepartmentWorkloadChartProps) => {
  const chartData = data ?? [];
  return (
    <WidgetCard
      tone="pearl"
      title="Department Workload"
      subtitle="Active vs pending pieces across departments"
      icon={<Factory className="w-4 h-4 text-champagne-700" />}
      isLoading={isLoading}
      editMode={editMode}
      dragHandleProps={dragHandleProps}
      onHide={onHide}
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EADDB7" vertical={false} />
            <XAxis
              dataKey="departmentName"
              tick={{ fontSize: 10, fill: '#5C5C66' }}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={50}
            />
            <YAxis tick={{ fontSize: 11, fill: '#5C5C66' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: '#0F0F12',
                border: '1px solid #26262C',
                borderRadius: 8,
                color: '#F8F4ED',
                fontSize: 12,
              }}
              labelStyle={{ color: '#DCC791' }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: '#5C5C66' }} iconType="circle" />
            <Bar dataKey="activeItems" name="Active" stackId="a" fill="#C9A55C" radius={[4, 4, 0, 0]} />
            <Bar
              dataKey="pendingItems"
              name="Pending"
              stackId="a"
              fill="#7A5E2E"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="completedToday"
              name="Done today"
              fill="#1F8A6F"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </WidgetCard>
  );
};

export default DepartmentWorkloadChart;
