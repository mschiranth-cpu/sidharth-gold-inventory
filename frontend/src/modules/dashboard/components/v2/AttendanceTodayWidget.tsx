import { Users } from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import type { AttendanceTodayBreakdown } from '../../../../types/dashboard.types';

export interface AttendanceTodayWidgetProps {
  data: AttendanceTodayBreakdown | undefined;
  isLoading?: boolean;
  editMode?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onHide?: () => void;
  onOpen?: () => void;
}

export const AttendanceTodayWidget = ({
  data,
  isLoading,
  editMode,
  dragHandleProps,
  onHide,
  onOpen,
}: AttendanceTodayWidgetProps) => {
  const present = data?.present ?? 0;
  const absent = data?.absent ?? 0;
  const onLeave = data?.onLeave ?? 0;
  const total = data?.totalEmployees ?? 0;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
  return (
    <WidgetCard
      tone="champagne"
      title="Today's Attendance"
      icon={<Users className="w-4 h-4 text-champagne-800" />}
      isLoading={isLoading}
      editMode={editMode}
      dragHandleProps={dragHandleProps}
      onHide={onHide}
      action={
        onOpen && (
          <button onClick={onOpen} className="text-xs text-champagne-800 hover:underline">
            Open
          </button>
        )
      }
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-display text-3xl font-semibold text-onyx-900 tabular-nums">{pct}%</p>
          <p className="text-xs text-onyx-500">
            {present} of {total} present
          </p>
        </div>
        <div className="text-xs space-y-1 text-right">
          <Row label="Present" value={present} dot="bg-accent-emerald" />
          <Row label="On Leave" value={onLeave} dot="bg-champagne-600" />
          <Row label="Absent" value={absent} dot="bg-accent-ruby" />
        </div>
      </div>
      <div className="mt-3 h-2 rounded-full bg-pearl/70 overflow-hidden flex">
        <div className="bg-accent-emerald" style={{ width: `${pct}%` }} />
        <div
          className="bg-champagne-600"
          style={{ width: total ? `${(onLeave / total) * 100}%` : '0%' }}
        />
        <div
          className="bg-accent-ruby"
          style={{ width: total ? `${(absent / total) * 100}%` : '0%' }}
        />
      </div>
    </WidgetCard>
  );
};

const Row = ({ label, value, dot }: { label: string; value: number; dot: string }) => (
  <div className="flex items-center gap-2 justify-end text-onyx-700">
    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
    <span>{label}</span>
    <span className="tabular-nums font-semibold">{value}</span>
  </div>
);

export default AttendanceTodayWidget;
