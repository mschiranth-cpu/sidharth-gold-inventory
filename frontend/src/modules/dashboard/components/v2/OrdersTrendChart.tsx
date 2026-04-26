import { TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Brush,
} from 'recharts';
import { WidgetCard } from './WidgetCard';
import type { OrdersTrendBucket } from '../../../../types/dashboard.types';

export interface OrdersTrendChartProps {
  data: OrdersTrendBucket[] | undefined;
  isLoading?: boolean;
  editMode?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onHide?: () => void;
  onDrillDown?: () => void;
  onRangeSelect?: (from: string, to: string) => void;
  onDayClick?: (date: string) => void;
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

export const OrdersTrendChart = ({
  data,
  isLoading,
  editMode,
  dragHandleProps,
  onHide,
  onDrillDown,
  onRangeSelect,
  onDayClick,
}: OrdersTrendChartProps) => {
  const chartData = (data ?? []).map((d) => ({ ...d, dateLabel: fmtDate(d.date) }));
  const showBrush = chartData.length >= 7;

  const handleBrushChange = (range: { startIndex?: number; endIndex?: number }) => {
    if (!onRangeSelect || range.startIndex == null || range.endIndex == null) return;
    const from = chartData[range.startIndex]?.date;
    const to = chartData[range.endIndex]?.date;
    if (from && to) onRangeSelect(from, to);
  };

  const handleAreaClick = (e: { activeLabel?: string; activePayload?: Array<{ payload: { date: string } }> }) => {
    if (!onDayClick) return;
    const date = e?.activePayload?.[0]?.payload?.date;
    if (date) onDayClick(date);
  };

  return (
    <WidgetCard
      tone="pearl"
      title="Order Flow"
      subtitle={showBrush ? 'Drag the brush to scope · Click a day to drill' : 'Created vs completed'}
      icon={<TrendingUp className="w-4 h-4 text-champagne-700" />}
      isLoading={isLoading}
      editMode={editMode}
      dragHandleProps={dragHandleProps}
      onHide={onHide}
      action={
        onDrillDown && (
          <button
            type="button"
            onClick={onDrillDown}
            className="text-xs text-champagne-700 hover:underline"
          >
            Open
          </button>
        )
      }
    >
      <div className={showBrush ? 'h-72' : 'h-56'}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 8, left: -20, bottom: 0 }}
            onClick={handleAreaClick}
          >
            <defs>
              <linearGradient id="ordersCreated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C9A55C" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#C9A55C" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="ordersCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1F8A6F" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#1F8A6F" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EADDB7" vertical={false} />
            <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#5C5C66' }} />
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
            <Area
              type="monotone"
              dataKey="created"
              stroke="#C9A55C"
              strokeWidth={2}
              fill="url(#ordersCreated)"
              name="Created"
              activeDot={{ r: 5, style: { cursor: 'pointer' } }}
            />
            <Area
              type="monotone"
              dataKey="completed"
              stroke="#1F8A6F"
              strokeWidth={2}
              fill="url(#ordersCompleted)"
              name="Completed"
              activeDot={{ r: 5, style: { cursor: 'pointer' } }}
            />
            {showBrush && (
              <Brush
                dataKey="dateLabel"
                height={22}
                stroke="#C9A55C"
                fill="#FBF7EF"
                travellerWidth={8}
                onChange={handleBrushChange}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </WidgetCard>
  );
};

export default OrdersTrendChart;
