import { useQuery } from '@tanstack/react-query';
import { fetchOverview, fetchWorkerOverview } from '../../../services/dashboard.service';
import type { DashboardRange } from '../../../types/dashboard.types';

const REFETCH_MS = 30_000;

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

export const useOverview = ({ range, from, to, enabled = true, paused = false }: UseOverviewParams) =>
  useQuery({
    queryKey: overviewKeys.byRange(range, from, to),
    queryFn: () => fetchOverview({ range, from, to }),
    staleTime: 25_000,
    refetchInterval: paused ? false : REFETCH_MS,
    refetchIntervalInBackground: false,
    enabled,
  });

export const useWorkerOverview = (paused = false) =>
  useQuery({
    queryKey: overviewKeys.worker,
    queryFn: fetchWorkerOverview,
    staleTime: 25_000,
    refetchInterval: paused ? false : REFETCH_MS,
    refetchIntervalInBackground: false,
  });
