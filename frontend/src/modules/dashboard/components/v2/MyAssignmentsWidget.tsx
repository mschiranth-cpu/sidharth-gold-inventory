import { ListChecks } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WidgetCard } from './WidgetCard';
import type { WorkerDashboardOverview } from '../../../../types/dashboard.types';

export interface MyAssignmentsWidgetProps {
  data: WorkerDashboardOverview['myAssignments'] | undefined;
  isLoading?: boolean;
  editMode?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onHide?: () => void;
}

const STATUS_TONE: Record<string, string> = {
  IN_PROGRESS: 'bg-champagne-100 text-champagne-800 border-champagne-300',
  PENDING_ASSIGNMENT: 'bg-pearl text-onyx-500 border-champagne-200',
  NOT_STARTED: 'bg-pearl text-onyx-500 border-champagne-200',
  ON_HOLD: 'bg-accent-ruby/10 text-accent-ruby border-accent-ruby/30',
  COMPLETED: 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/30',
};

const fmtDue = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';

export const MyAssignmentsWidget = ({
  data,
  isLoading,
  editMode,
  dragHandleProps,
  onHide,
}: MyAssignmentsWidgetProps) => {
  const navigate = useNavigate();
  const items = data ?? [];
  return (
    <WidgetCard
      tone="pearl"
      title="My Assignments"
      subtitle={items.length === 0 ? 'No active work assigned' : `${items.length} active`}
      icon={<ListChecks className="w-4 h-4 text-champagne-700" />}
      isLoading={isLoading}
      editMode={editMode}
      dragHandleProps={dragHandleProps}
      onHide={onHide}
    >
      {items.length === 0 && !isLoading ? (
        <div className="text-sm text-onyx-400 py-6 text-center">All caught up.</div>
      ) : (
        <ul className="divide-y divide-champagne-200/60 max-h-80 overflow-y-auto">
          {items.map((a) => (
            <li
              key={a.id}
              className="py-2.5 flex items-center gap-3 hover:bg-champagne-50 rounded-lg px-2 -mx-2 cursor-pointer"
              onClick={() => navigate(`/app/orders/${a.id}`)}
            >
              {a.productPhotoUrl ? (
                <img
                  src={a.productPhotoUrl}
                  alt=""
                  className="w-10 h-10 rounded-md object-cover border border-champagne-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-md bg-champagne-100 border border-champagne-200" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-onyx-900 truncate">{a.orderNumber}</p>
                <p className="text-xs text-onyx-400 truncate">{a.productType ?? '—'}</p>
              </div>
              <div className="text-right shrink-0 space-y-1">
                <span
                  className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                    STATUS_TONE[a.status] ?? STATUS_TONE.NOT_STARTED
                  }`}
                >
                  {a.status.replace(/_/g, ' ')}
                </span>
                <p className="text-[10px] text-onyx-400">Due {fmtDue(a.dueDate)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
};

export default MyAssignmentsWidget;
