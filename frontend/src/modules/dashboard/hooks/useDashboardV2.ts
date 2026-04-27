import { useQuery } from '@tanstack/react-query';
import { fetchOverview, fetchWorkerOverview } from '../../../services/dashboard.service';
import type { DashboardRange } from '../../../types/dashboard.types';
import { useRefreshInterval } from '../../../contexts/RefreshIntervalContext';

const FALLBACK_MS = 30_000;

export interface UseOverviewParams {
  range: DashboardRange;
  from?: string;
  to?: string;
  enabled?: boolean;
  paused?: boolean;
}

export const overviewKeys = {
  all: ['dashboard-overview'] as const,
  byRange: (range: DashboardRange, from?: string, to?: string) =>
    ['dashboard-overview', range, from ?? null, to ?? null] as const,
  worker: ['dashboard-worker-overview'] as const,
};

export const useOverview = ({ range, from, to, enabled = true, paused = false }: UseOverviewParams) => {
  const intervalMs = useRefreshInterval();
  const effective = intervalMs === false ? false : intervalMs;
  return useQuery({
    queryKey: overviewKeys.byRange(range, from, to),
    queryFn: () => fetchOverview({ range, from, to }),
    staleTime: Math.min(25_000, effective === false ? FALLBACK_MS : Math.max(1_000, effective - 1_000)),
    refetchInterval: paused ? false : effective,
    refetchIntervalInBackground: false,
    enabled,
  });
};

export const useWorkerOverview = (paused = false) => {
  const intervalMs = useRefreshInterval();
  const effective = intervalMs === false ? false : intervalMs;
  return useQuery({
    queryKey: overviewKeys.worker,
    queryFn: fetchWorkerOverview,
    staleTime: Math.min(25_000, effective === false ? FALLBACK_MS : Math.max(1_000, effective - 1_000)),
    refetchInterval: paused ? false : effective,
    refetchIntervalInBackground: false,
  });
};
