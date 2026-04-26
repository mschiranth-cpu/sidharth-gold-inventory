import { KpiTile } from './KpiTile';
import type { WorkerDashboardOverview } from '../../../../types/dashboard.types';

export interface MyMetricsRowProps {
  data: WorkerDashboardOverview['myMetrics'] | undefined;
  rollup?: WorkerDashboardOverview['myDepartmentRollup'];
  isLoading?: boolean;
}

export const MyMetricsRow = ({ data, rollup, isLoading }: MyMetricsRowProps) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    <KpiTile
      label="My Active"
      value={data?.inProgress ?? 0}
      hint={`${data?.total ?? 0} total assigned`}
      isLoading={isLoading}
    />
    <KpiTile
      label="Completed Today"
      value={data?.completedToday ?? 0}
      tone="emerald"
      isLoading={isLoading}
    />
    <KpiTile
      label="My Overdue"
      value={data?.overdue ?? 0}
      tone={(data?.overdue ?? 0) > 0 ? 'ruby' : 'pearl'}
      isLoading={isLoading}
    />
    <KpiTile
      label={rollup?.department ? `${rollup.department} active` : 'Department active'}
      value={rollup?.activeItems ?? 0}
      hint={`${rollup?.completedToday ?? 0} done today`}
      tone="champagne"
      isLoading={isLoading}
    />
  </div>
);

export default MyMetricsRow;
