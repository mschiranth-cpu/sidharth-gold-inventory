import { PieChart as PieIcon } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { WidgetCard } from './WidgetCard';
import type { OrderStatusSlice } from '../../../../types/dashboard.types';

export interface OrderStatusDonutProps {
  data: OrderStatusSlice[] | undefined;
  isLoading?: boolean;
  editMode?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onHide?: () => void;
}

const FALLBACK = '#C9A55C';

export const OrderStatusDonut = ({
  data,
  isLoading,
  editMode,
  dragHandleProps,
  onHide,
}: OrderStatusDonutProps) => {
  const slices = data ?? [];
  const total = slices.reduce((s, x) => s + x.count, 0);
  return (
    <WidgetCard
      tone="pearl"
      title="Order Status Mix"
      subtitle={`${total.toLocaleString('en-IN')} total orders`}
      icon={<PieIcon className="w-4 h-4 text-champagne-700" />}
      isLoading={isLoading}
      editMode={editMode}
      dragHandleProps={dragHandleProps}
      onHide={onHide}
    >
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="count"
              nameKey="status"
              innerRadius={50}
              outerRadius={85}
              paddingAngle={2}
              stroke="none"
            >
              {slices.map((s, i) => (
                <Cell key={i} fill={s.color || FALLBACK} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#0F0F12',
                border: '1px solid #26262C',
                borderRadius: 8,
                color: '#F8F4ED',
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: '#5C5C66' }} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </WidgetCard>
  );
};

export default OrderStatusDonut;
