import { Plus, FileSpreadsheet, ClipboardCheck, Users, Boxes } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WidgetCard } from './WidgetCard';

export interface QuickActionsBarProps {
  role: string;
  editMode?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onHide?: () => void;
}

interface Action {
  label: string;
  to: string;
  icon: React.ReactNode;
  roles: string[];
}

const ACTIONS: Action[] = [
  {
    label: 'New Order',
    to: '/app/orders/create',
    icon: <Plus className="w-4 h-4" />,
    roles: ['ADMIN', 'OFFICE_STAFF'],
  },
  {
    label: 'My Orders',
    to: '/app/orders',
    icon: <ClipboardCheck className="w-4 h-4" />,
    roles: ['DEPARTMENT_WORKER'],
  },
  {
    label: 'Reports',
    to: '/app/reports',
    icon: <FileSpreadsheet className="w-4 h-4" />,
    roles: ['ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER'],
  },
  {
    label: 'Submissions',
    to: '/app/submissions',
    icon: <ClipboardCheck className="w-4 h-4" />,
    roles: ['ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER', 'DEPARTMENT_WORKER'],
  },
  {
    label: 'Workers',
    to: '/app/workers',
    icon: <Users className="w-4 h-4" />,
    roles: ['ADMIN', 'FACTORY_MANAGER'],
  },
  {
    label: 'Inventory',
    to: '/app/inventory',
    icon: <Boxes className="w-4 h-4" />,
    roles: ['ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER'],
  },
];

export const QuickActionsBar = ({
  role,
  editMode,
  dragHandleProps,
  onHide,
}: QuickActionsBarProps) => {
  const navigate = useNavigate();
  const allowed = ACTIONS.filter((a) => a.roles.includes(role));
  return (
    <WidgetCard
      tone="onyx"
      title="Quick Actions"
      editMode={editMode}
      dragHandleProps={dragHandleProps}
      onHide={onHide}
    >
      <div className="flex flex-wrap gap-2">
        {allowed.map((a) => (
          <button
            key={a.to}
            type="button"
            onClick={() => navigate(a.to)}
            className="inline-flex items-center gap-1.5 rounded-full bg-onyx-800/70 border border-onyx-600 px-3 py-1.5 text-xs text-pearl hover:bg-onyx-700"
          >
            <span className="text-gold-leaf">{a.icon}</span>
            {a.label}
          </button>
        ))}
        {allowed.length === 0 && (
          <p className="text-xs text-champagne-300/80">No quick actions for your role.</p>
        )}
      </div>
    </WidgetCard>
  );
};

export default QuickActionsBar;
