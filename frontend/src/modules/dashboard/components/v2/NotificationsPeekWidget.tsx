import { Bell } from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import type { NotificationPeekItem } from '../../../../types/dashboard.types';

export interface NotificationsPeekWidgetProps {
  data: NotificationPeekItem[] | undefined;
  isLoading?: boolean;
  editMode?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onHide?: () => void;
  onOpen?: () => void;
}

const PRIORITY: Record<string, string> = {
  HIGH: 'border-accent-ruby/40 bg-accent-ruby/5',
  URGENT: 'border-accent-ruby/40 bg-accent-ruby/10',
  MEDIUM: 'border-champagne-300 bg-champagne-50',
  LOW: 'border-champagne-200 bg-pearl',
};

const ago = (s: string) => {
  const ms = Date.now() - new Date(s).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

export const NotificationsPeekWidget = ({
  data,
  isLoading,
  editMode,
  dragHandleProps,
  onHide,
  onOpen,
}: NotificationsPeekWidgetProps) => {
  const items = data ?? [];
  return (
    <WidgetCard
      tone="pearl"
      title="Notifications"
      subtitle={items.length === 0 ? "You're all caught up" : `${items.length} unread`}
      icon={<Bell className="w-4 h-4 text-champagne-700" />}
      isLoading={isLoading}
      editMode={editMode}
      dragHandleProps={dragHandleProps}
      onHide={onHide}
      action={
        onOpen && (
          <button onClick={onOpen} className="text-xs text-champagne-700 hover:underline">
            View all
          </button>
        )
      }
    >
      {items.length === 0 && !isLoading ? (
        <div className="text-sm text-onyx-400 py-6 text-center">No new notifications.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-lg border p-2.5 text-sm ${PRIORITY[n.priority ?? 'LOW'] ?? PRIORITY.LOW}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-onyx-900 truncate">{n.title}</p>
                <span className="text-[10px] text-onyx-400 shrink-0">{ago(n.createdAt)}</span>
              </div>
              <p className="text-xs text-onyx-500 mt-0.5 line-clamp-2">{n.message}</p>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
};

export default NotificationsPeekWidget;
