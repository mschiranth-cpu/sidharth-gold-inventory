import { Activity } from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import type { RecentActivityItem } from '../../../../types/dashboard.types';

export interface RecentActivityTimelineProps {
  data: RecentActivityItem[] | undefined;
  isLoading?: boolean;
  editMode?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onHide?: () => void;
  emptyText?: string;
}

const ago = (s: string) => {
  const ms = Date.now() - new Date(s).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

export const RecentActivityTimeline = ({
  data,
  isLoading,
  editMode,
  dragHandleProps,
  onHide,
  emptyText = 'No recent activity yet.',
}: RecentActivityTimelineProps) => {
  const items = data ?? [];
  return (
    <WidgetCard
      tone="pearl"
      title="Live Activity"
      icon={<Activity className="w-4 h-4 text-champagne-700" />}
      isLoading={isLoading}
      editMode={editMode}
      dragHandleProps={dragHandleProps}
      onHide={onHide}
    >
      {items.length === 0 && !isLoading ? (
        <div className="text-sm text-onyx-400 py-6 text-center">{emptyText}</div>
      ) : (
        <ol className="relative">
          <span
            className="absolute top-2 bottom-2 w-px bg-champagne-200"
            style={{ left: '5px' }}
            aria-hidden
          />
          {items.map((a) => (
            <li key={a.id} className="relative flex items-start gap-3 py-2">
              <span
                className="mt-1.5 shrink-0 w-2.5 h-2.5 rounded-full bg-gold-leaf ring-4 ring-pearl"
                aria-hidden
              />
              <div className="flex-1 min-w-0 flex items-start justify-between gap-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-onyx-900 truncate">{a.title}</p>
                  {a.description && (
                    <p className="text-xs text-onyx-500 line-clamp-2">{a.description}</p>
                  )}
                  <p className="text-[11px] text-onyx-400 mt-0.5">
                    {a.userName ?? 'System'}
                    {a.orderNumber ? ` · ${a.orderNumber}` : ''}
                  </p>
                </div>
                <span className="text-[11px] text-onyx-400 shrink-0">{ago(a.createdAt)}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </WidgetCard>
  );
};

export default RecentActivityTimeline;
