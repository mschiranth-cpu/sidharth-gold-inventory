/**
 * Dashboard service — V2 single aggregator endpoint.
 */

import { apiGet } from './api';
import type {
  DashboardOverview,
  WorkerDashboardOverview,
  DashboardRange,
} from '../types/dashboard.types';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface FetchOverviewParams {
  range?: DashboardRange;
  from?: string;
  to?: string;
}

export const fetchOverview = async (
  params: FetchOverviewParams = {}
): Promise<DashboardOverview> => {
  const qp = new URLSearchParams();
  qp.set('range', params.range ?? 'today');
  if (params.from) qp.set('from', params.from);
  if (params.to) qp.set('to', params.to);
  const res = await apiGet<ApiEnvelope<DashboardOverview>>(`/dashboard/overview?${qp.toString()}`);
  return (res as any)?.data ?? (res as unknown as DashboardOverview);
};

export const fetchWorkerOverview = async (): Promise<WorkerDashboardOverview> => {
  const res = await apiGet<ApiEnvelope<WorkerDashboardOverview>>(`/dashboard/worker-overview`);
  return (res as any)?.data ?? (res as unknown as WorkerDashboardOverview);
};
