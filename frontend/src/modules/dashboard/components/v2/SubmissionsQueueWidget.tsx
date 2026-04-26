import { Inbox } from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import type { SubmissionQueueItem } from '../../../../types/dashboard.types';

export interface SubmissionsQueueWidgetProps {
  data: SubmissionQueueItem[] | undefined;
  isLoading?: boolean;
  editMode?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onHide?: () => void;
  onOpen?: (orderId: string) => void;
}

const fmtTime = (s: string) =>
  new Date(s).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

export const SubmissionsQueueWidget = ({
  data,
  isLoading,
  editMode,
  dragHandleProps,
  onHide,
  onOpen,
}: SubmissionsQueueWidgetProps) => {
  const items = data ?? [];
  return (
    <WidgetCard
      tone="pearl"
      title="Submissions Awaiting Approval"
      subtitle={items.length === 0 ? 'Queue is clear' : `${items.length} pending`}
      icon={<Inbox className="w-4 h-4 text-champagne-700" />}
      isLoading={isLoading}
      editMode={editMode}
      dragHandleProps={dragHandleProps}
      onHide={onHide}
    >
      {items.length === 0 && !isLoading ? (
        <div className="text-sm text-onyx-400 py-6 text-center">No submissions waiting.</div>
      ) : (
        <ul className="divide-y divide-champagne-200/60">
          {items.map((s) => (
            <li
              key={s.id}
              className="py-2.5 flex items-center justify-between gap-3 text-sm hover:bg-champagne-50 rounded-lg px-2 -mx-2 cursor-pointer"
              onClick={() => onOpen?.(s.orderId)}
            >
              <div className="min-w-0">
                <p className="font-medium text-onyx-900 truncate">{s.orderNumber}</p>
                <p className="text-xs text-onyx-400 truncate">
                  {s.customerName} · by {s.submittedByName}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs tabular-nums text-onyx-700">
                  {s.finalGoldWeight.toFixed(2)} g
                </p>
                <p className="text-[10px] text-onyx-400">{fmtTime(s.submittedAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
};

export default SubmissionsQueueWidget;
