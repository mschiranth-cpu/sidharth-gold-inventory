import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Layers,
  PackageCheck,
  AlertTriangle,
  Clock,
  Eye,
  ArrowUpRight,
} from 'lucide-react';

import { useAuth } from '../../../contexts/AuthContext';
import { useOverview, useWorkerOverview } from '../hooks/useDashboardV2';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { USER_ROLE_LABELS } from '../../../types/auth.types';
import type {
  DashboardRange,
  DashboardOverview,
  WorkerDashboardOverview,
} from '../../../types/dashboard.types';

import { HeroBar } from '../components/v2/HeroBar';
import { KpiTile } from '../components/v2/KpiTile';
import { MetalsInProcessHero } from '../components/v2/MetalsInProcessHero';
import { OrdersTrendChart } from '../components/v2/OrdersTrendChart';
import { DepartmentWorkloadChart } from '../components/v2/DepartmentWorkloadChart';
import { OrderStatusDonut } from '../components/v2/OrderStatusDonut';
import { SubmissionsQueueWidget } from '../components/v2/SubmissionsQueueWidget';
import { VendorOutstandingWidget } from '../components/v2/VendorOutstandingWidget';
import { InventorySnapshotWidget } from '../components/v2/InventorySnapshotWidget';
import { AttendanceTodayWidget } from '../components/v2/AttendanceTodayWidget';
import { NotificationsPeekWidget } from '../components/v2/NotificationsPeekWidget';
import { RecentActivityTimeline } from '../components/v2/RecentActivityTimeline';
import { QuickActionsBar } from '../components/v2/QuickActionsBar';
import { WorkerHero } from '../components/v2/WorkerHero';
import { MyAssignmentsWidget } from '../components/v2/MyAssignmentsWidget';
import { MyMetricsRow } from '../components/v2/MyMetricsRow';
import { MyActivityTimeline } from '../components/v2/MyActivityTimeline';

// ============================================
// Sortable wrapper
// ============================================

interface SortableProps {
  id: string;
  className?: string;
  editMode: boolean;
  children: (handleProps: Record<string, unknown>) => React.ReactNode;
}

const SortableItem = ({ id, className, editMode, children }: SortableProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !editMode,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 30 : 'auto',
  };
  const handleProps = { ...attributes, ...listeners };
  return (
    <div ref={setNodeRef} style={style} className={className}>
      {children(handleProps)}
    </div>
  );
};

// ============================================
// Admin/Office/Manager dashboard
// ============================================

const ADMIN_DEFAULT_ORDER = [
  'kpi-strip',
  'metals-attendance',
  'orders-status',
  'workload-submissions',
  'inventory-vendors-notifications',
  'activity-actions',
];

const ADMIN_LABELS: Record<string, string> = {
  'kpi-strip': 'KPI strip',
  'metals-attendance': 'Metals on the floor + Attendance',
  'orders-status': 'Order flow + Status mix',
  'workload-submissions': 'Department workload + Submissions',
  'inventory-vendors-notifications': 'Inventory + Vendors + Notifications',
  'activity-actions': 'Live activity + Quick actions',
};

interface AdminVariantProps {
  data: DashboardOverview | undefined;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => void;
  range: DashboardRange;
  onRangeChange: (r: DashboardRange) => void;
  customFrom: string;
  customTo: string;
  onCustomChange: (from: string, to: string) => void;
  editMode: boolean;
  setEditMode: (b: boolean) => void;
  userId: string;
  userName: string;
  roleLabel: string;
  role: string;
}

const AdminDashboard = ({
  data,
  isLoading,
  isFetching,
  refetch,
  range,
  onRangeChange,
  customFrom,
  customTo,
  onCustomChange,
  editMode,
  setEditMode,
  userId,
  userName,
  roleLabel,
  role,
}: AdminVariantProps) => {
  const navigate = useNavigate();
  const layout = useDashboardLayout(userId, ADMIN_DEFAULT_ORDER);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = layout.order.indexOf(String(active.id));
      const newIndex = layout.order.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;
      layout.reorder(arrayMove(layout.order, oldIndex, newIndex));
    },
    [layout]
  );

  const visibleOrder = useMemo(
    () => layout.order.filter((id) => !layout.hidden.includes(id)),
    [layout.order, layout.hidden]
  );

  const renderSection = (id: string, handleProps: Record<string, unknown>) => {
    const dragProps = handleProps;
    const onHide = () => layout.toggleVisibility(id);

    switch (id) {
      case 'kpi-strip':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative">
            {editMode && (
              <button
                type="button"
                {...dragProps}
                className="absolute -top-3 -right-3 z-10 p-1 rounded-full bg-onyx-900 text-pearl shadow-onyx cursor-grab"
                aria-label="Drag KPI strip"
              >
                <Layers className="w-4 h-4" />
              </button>
            )}
            <KpiTile
              label="Total Orders"
              value={(data?.kpis.totalOrders ?? 0).toLocaleString('en-IN')}
              hint={`${data?.kpis.dueTodayCount ?? 0} due today`}
              icon={<Layers className="w-5 h-5" />}
              onDrillDown={() => navigate('/app/orders')}
              isLoading={isLoading}
              sparkline={data?.ordersTrend?.map((d) => d.created)}
            />
            <KpiTile
              label="In Progress"
              value={(data?.kpis.ordersInProgress ?? 0).toLocaleString('en-IN')}
              hint={`${data?.kpis.efficiencyPct ?? 0}% on-time efficiency`}
              icon={<PackageCheck className="w-5 h-5" />}
              tone="champagne"
              onDrillDown={() => navigate('/app/orders?status=IN_FACTORY')}
              isLoading={isLoading}
              sparkline={data?.ordersTrend?.map((d) => Math.max(d.created - d.completed, 0))}
            />
            <KpiTile
              label="Overdue"
              value={(data?.kpis.overdueOrders ?? 0).toLocaleString('en-IN')}
              hint="Past due date"
              icon={<AlertTriangle className="w-5 h-5" />}
              tone={(data?.kpis.overdueOrders ?? 0) > 0 ? 'ruby' : 'pearl'}
              onDrillDown={() => navigate('/app/orders?overdue=1')}
              isLoading={isLoading}
            />
            <KpiTile
              label="Avg. Production"
              value={
                data?.kpis.avgProductionDays != null
                  ? `${data.kpis.avgProductionDays.toFixed(1)}d`
                  : '—'
              }
              hint={`${data?.kpis.completedInRange ?? 0} done in range`}
              icon={<Clock className="w-5 h-5" />}
              tone="emerald"
              onDrillDown={() => navigate('/app/reports')}
              isLoading={isLoading}
              sparkline={data?.ordersTrend?.map((d) => d.completed)}
            />
          </div>
        );

      case 'metals-attendance':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <MetalsInProcessHero
                data={data?.metalsInProcess}
                isLoading={isLoading}
                editMode={editMode}
                dragHandleProps={dragProps}
                onHide={onHide}
              />
            </div>
            <AttendanceTodayWidget
              data={data?.attendanceToday}
              isLoading={isLoading}
              editMode={editMode}
              dragHandleProps={dragProps}
              onHide={onHide}
              onOpen={() => navigate('/app/attendance')}
            />
          </div>
        );

      case 'orders-status':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <OrdersTrendChart
                data={data?.ordersTrend}
                isLoading={isLoading}
                editMode={editMode}
                dragHandleProps={dragProps}
                onHide={onHide}
                onDrillDown={() => navigate('/app/reports')}
                onRangeSelect={(from, to) => navigate(`/app/orders?from=${from}&to=${to}`)}
                onDayClick={(date) => navigate(`/app/orders?from=${date}&to=${date}`)}
              />
            </div>
            <OrderStatusDonut
              data={data?.orderStatusDistribution}
              isLoading={isLoading}
              editMode={editMode}
              dragHandleProps={dragProps}
              onHide={onHide}
            />
          </div>
        );

      case 'workload-submissions':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <DepartmentWorkloadChart
                data={data?.departmentWorkload}
                isLoading={isLoading}
                editMode={editMode}
                dragHandleProps={dragProps}
                onHide={onHide}
              />
            </div>
            <SubmissionsQueueWidget
              data={data?.submissionsQueue}
              isLoading={isLoading}
              editMode={editMode}
              dragHandleProps={dragProps}
              onHide={onHide}
              onOpen={(orderId) => navigate(`/app/orders/${orderId}`)}
            />
          </div>
        );

      case 'inventory-vendors-notifications':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <InventorySnapshotWidget
              data={data?.inventorySnapshot}
              isLoading={isLoading}
              editMode={editMode}
              dragHandleProps={dragProps}
              onHide={onHide}
              onOpen={() => navigate('/app/inventory')}
            />
            <VendorOutstandingWidget
              data={data?.vendorOutstanding}
              isLoading={isLoading}
              editMode={editMode}
              dragHandleProps={dragProps}
              onHide={onHide}
              onOpen={(vendorId) => navigate(`/app/vendors/${vendorId}`)}
            />
            <NotificationsPeekWidget
              data={data?.notifications}
              isLoading={isLoading}
              editMode={editMode}
              dragHandleProps={dragProps}
              onHide={onHide}
              onOpen={() => navigate('/app/notifications')}
            />
          </div>
        );

      case 'activity-actions':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <RecentActivityTimeline
                data={data?.recentActivity}
                isLoading={isLoading}
                editMode={editMode}
                dragHandleProps={dragProps}
                onHide={onHide}
              />
            </div>
            <QuickActionsBar
              role={role}
              editMode={editMode}
              dragHandleProps={dragProps}
              onHide={onHide}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <HeroBar
        userName={userName}
        roleLabel={roleLabel}
        range={range}
        onRangeChange={onRangeChange}
        customFrom={customFrom}
        customTo={customTo}
        onCustomChange={onCustomChange}
        isFetching={isFetching}
        onRefresh={refetch}
        editMode={editMode}
        onToggleEdit={() => setEditMode(!editMode)}
        onResetLayout={layout.reset}
        rates={
          data?.marketRates ?? {
            gold24k: null,
            gold22k: null,
            gold18k: null,
            silver: null,
            platinum: null,
            palladium: null,
            fetchedAt: null,
            healthy: false,
            ageMs: 0,
          }
        }
        generatedAt={data?.meta.generatedAt ?? null}
      />

      {layout.hidden.length > 0 && editMode && (
        <div className="rounded-xl bg-pearl border border-champagne-200 p-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-onyx-500 font-medium flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> Hidden:
          </span>
          {layout.hidden.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => layout.toggleVisibility(id)}
              className="inline-flex items-center gap-1 rounded-full bg-champagne-100 hover:bg-champagne-200 text-onyx-700 px-2.5 py-1"
            >
              <ArrowUpRight className="w-3 h-3" />
              {ADMIN_LABELS[id] ?? id}
            </button>
          ))}
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={visibleOrder} strategy={rectSortingStrategy}>
          <div className="space-y-4">
            {visibleOrder.map((id) => (
              <SortableItem key={id} id={id} editMode={editMode}>
                {(handleProps) => renderSection(id, handleProps)}
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

// ============================================
// Worker dashboard
// ============================================

const WORKER_DEFAULT_ORDER = ['my-metrics', 'my-assignments', 'my-activity', 'quick-actions'];
const WORKER_LABELS: Record<string, string> = {
  'my-metrics': 'My metrics',
  'my-assignments': 'My assignments',
  'my-activity': 'My activity',
  'quick-actions': 'Quick actions',
};

interface WorkerVariantProps {
  data: WorkerDashboardOverview | undefined;
  isLoading: boolean;
  userId: string;
  userName: string;
  editMode: boolean;
  setEditMode: (b: boolean) => void;
}

const WorkerDashboard = ({
  data,
  isLoading,
  userId,
  userName,
  editMode,
  setEditMode,
}: WorkerVariantProps) => {
  const layout = useDashboardLayout(userId, WORKER_DEFAULT_ORDER);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = layout.order.indexOf(String(active.id));
      const newIndex = layout.order.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;
      layout.reorder(arrayMove(layout.order, oldIndex, newIndex));
    },
    [layout]
  );
  const visibleOrder = useMemo(
    () => layout.order.filter((id) => !layout.hidden.includes(id)),
    [layout.order, layout.hidden]
  );

  return (
    <div className="space-y-4">
      <WorkerHero
        userName={userName}
        attendance={
          data?.myAttendanceToday ?? {
            status: 'ABSENT',
            checkInTime: null,
            checkOutTime: null,
          }
        }
        department={data?.myDepartmentRollup.department ?? null}
        rates={
          data?.marketRates ?? {
            gold24k: null,
            gold22k: null,
            gold18k: null,
            silver: null,
            platinum: null,
            palladium: null,
            fetchedAt: null,
            healthy: false,
            ageMs: 0,
          }
        }
        generatedAt={data?.meta.generatedAt ?? null}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditMode(!editMode)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
            editMode
              ? 'bg-gold-leaf-gradient text-onyx-900'
              : 'bg-pearl border border-champagne-300 text-onyx-700 hover:bg-champagne-50'
          }`}
        >
          {editMode ? 'Done' : 'Edit Layout'}
        </button>
      </div>

      {layout.hidden.length > 0 && editMode && (
        <div className="rounded-xl bg-pearl border border-champagne-200 p-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-onyx-500 font-medium">Hidden:</span>
          {layout.hidden.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => layout.toggleVisibility(id)}
              className="inline-flex items-center gap-1 rounded-full bg-champagne-100 text-onyx-700 px-2.5 py-1"
            >
              {WORKER_LABELS[id] ?? id}
            </button>
          ))}
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={visibleOrder} strategy={rectSortingStrategy}>
          <div className="space-y-4">
            {visibleOrder.map((id) => (
              <SortableItem key={id} id={id} editMode={editMode}>
                {(handleProps) => {
                  if (id === 'my-metrics')
                    return (
                      <MyMetricsRow
                        data={data?.myMetrics}
                        rollup={data?.myDepartmentRollup}
                        isLoading={isLoading}
                      />
                    );
                  if (id === 'my-assignments')
                    return (
                      <MyAssignmentsWidget
                        data={data?.myAssignments}
                        isLoading={isLoading}
                        editMode={editMode}
                        dragHandleProps={handleProps}
                        onHide={() => layout.toggleVisibility(id)}
                      />
                    );
                  if (id === 'my-activity')
                    return (
                      <MyActivityTimeline
                        data={data?.myActivity}
                        isLoading={isLoading}
                        editMode={editMode}
                        dragHandleProps={handleProps}
                        onHide={() => layout.toggleVisibility(id)}
                      />
                    );
                  if (id === 'quick-actions')
                    return (
                      <QuickActionsBar
                        role="DEPARTMENT_WORKER"
                        editMode={editMode}
                        dragHandleProps={handleProps}
                        onHide={() => layout.toggleVisibility(id)}
                      />
                    );
                  return null;
                }}
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

// ============================================
// Main page — picks variant based on role
// ============================================

const todayIso = () => new Date().toISOString().slice(0, 10);

export const DashboardV2 = () => {
  const { user } = useAuth();
  const role = user?.role ?? 'CLIENT';
  const isWorker = role === 'DEPARTMENT_WORKER';
  const isClient = role === 'CLIENT';

  const [range, setRange] = useState<DashboardRange>('today');
  const [customFrom, setCustomFrom] = useState<string>(todayIso());
  const [customTo, setCustomTo] = useState<string>(todayIso());
  const [editMode, setEditMode] = useState(false);

  const overview = useOverview({
    range,
    from: range === 'custom' ? customFrom : undefined,
    to: range === 'custom' ? customTo : undefined,
    enabled: !isWorker && !isClient,
    paused: editMode,
  });

  const worker = useWorkerOverview(editMode);

  if (isClient) {
    return (
      <div className="rounded-2xl bg-pearl border border-champagne-200 p-6 text-onyx-700">
        <h1 className="font-display text-xl font-semibold">Welcome</h1>
        <p className="text-sm mt-1 text-onyx-500">
          Your dedicated client portal opens automatically at sign-in.
        </p>
      </div>
    );
  }

  if (isWorker) {
    return (
      <WorkerDashboard
        data={worker.data}
        isLoading={worker.isLoading}
        userId={user?.id ?? 'unknown'}
        userName={user?.name ?? 'Worker'}
        editMode={editMode}
        setEditMode={setEditMode}
      />
    );
  }

  const roleLabel = USER_ROLE_LABELS[role as keyof typeof USER_ROLE_LABELS] ?? role;

  return (
    <AdminDashboard
      data={overview.data}
      isLoading={overview.isLoading}
      isFetching={overview.isFetching}
      refetch={() => overview.refetch()}
      range={range}
      onRangeChange={setRange}
      customFrom={customFrom}
      customTo={customTo}
      onCustomChange={(f, t) => {
        setCustomFrom(f);
        setCustomTo(t);
      }}
      editMode={editMode}
      setEditMode={setEditMode}
      userId={user?.id ?? 'unknown'}
      userName={user?.name ?? 'Team'}
      roleLabel={roleLabel}
      role={role}
    />
  );
};

export default DashboardV2;
