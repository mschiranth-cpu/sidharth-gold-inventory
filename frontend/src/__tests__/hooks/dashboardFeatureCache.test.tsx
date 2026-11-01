import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOverview, useWorkerOverview } from '../../modules/dashboard/hooks/useDashboardV2';
const auth = vi.hoisted(() => ({ user: { id: 'admin', role: 'ADMIN', department: null as string | null } }));
const calls = vi.hoisted(() => ({ fetchOverview: vi.fn(), fetchWorkerOverview: vi.fn() }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('../../contexts/RefreshIntervalContext', () => ({ useRefreshInterval: () => false }));
vi.mock('../../services/dashboard.service', () => calls);
function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
beforeEach(() => { vi.clearAllMocks(); auth.user = { id: 'admin', role: 'ADMIN', department: null }; });
describe('Dashboard response cache isolation', () => {
  it('never serves an earlier account inventory payload after a user switch', async () => {
    calls.fetchOverview.mockResolvedValue({ inventorySnapshot: { metalStockGrams: 987 } });
    const hook = renderHook(() => useOverview({ range: 'today' }), { wrapper: wrapper() });
    await waitFor(() => expect(hook.result.current.data?.inventorySnapshot.metalStockGrams).toBe(987));
    calls.fetchOverview.mockResolvedValue({ inventorySnapshot: { metalStockGrams: null } });
    auth.user = { id: 'staff', role: 'OFFICE_STAFF', department: 'CAD' }; hook.rerender();
    expect(hook.result.current.data).toBeUndefined();
    await waitFor(() => expect(hook.result.current.data?.inventorySnapshot.metalStockGrams).toBeNull());
  });
  it('loads the personal worker overview only for a worker account', async () => {
    calls.fetchWorkerOverview.mockResolvedValue({ myAttendanceToday: null });
    const hook = renderHook(() => useWorkerOverview(), { wrapper: wrapper() });
    expect(calls.fetchWorkerOverview).not.toHaveBeenCalled();
    auth.user = { id: 'worker', role: 'DEPARTMENT_WORKER', department: 'CAD' }; hook.rerender();
    await waitFor(() => expect(calls.fetchWorkerOverview).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(hook.result.current.data?.myAttendanceToday).toBeNull());
  });
});
