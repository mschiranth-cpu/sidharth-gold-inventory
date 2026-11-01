import { act, renderHook, waitFor } from '@testing-library/react';
import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFeatures } from '../../hooks/useFeatures';
const state = vi.hoisted(() => ({ user: { id: 'one', role: 'OFFICE_STAFF', department: null as string | null }, isAuthenticated: true }));
const load = vi.hoisted(() => vi.fn());
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => state }));
vi.mock('../../services/features.service', () => ({ getMyFeatures: load }));
beforeEach(() => { vi.clearAllMocks(); state.user = { id: 'one', role: 'OFFICE_STAFF', department: null }; state.isAuthenticated = true; });
afterEach(() => { vi.useRealTimers(); focusManager.setFocused(undefined); });
describe('Effective permission cache identity', () => {
  it('does not reuse permissions when user, role or department changes', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    load.mockResolvedValue({ METAL_INVENTORY: { hasAccess: true, canRead: true, canWrite: true, canDelete: true } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const hook = renderHook(() => useFeatures(), { wrapper });
    await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(hook.result.current.data).toBeDefined());
    load.mockResolvedValue({ METAL_INVENTORY: { hasAccess: false, canRead: false, canWrite: false, canDelete: false } });
    state.user = { id: 'two', role: 'OFFICE_STAFF', department: null }; hook.rerender();
    expect(hook.result.current.data).toBeUndefined();
    await waitFor(() => expect(hook.result.current.canUsePath('/app/inventory/metal')).toBe(false));
    state.user = { id: 'two', role: 'FACTORY_MANAGER', department: 'CAD' }; hook.rerender();
    expect(hook.result.current.data).toBeUndefined();
    await waitFor(() => expect(load).toHaveBeenCalledTimes(3));
  });
  it('keeps administrator recovery available without depending on the policy endpoint', () => {
    state.user.role = 'ADMIN';
    const client = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const hook = renderHook(() => useFeatures(), { wrapper });
    expect(hook.result.current.canUsePath('/app/admin/features')).toBe(true);
    expect(load).not.toHaveBeenCalled();
  });

  it('refreshes a visible session after another administrator changes its permissions', async () => {
    vi.useFakeTimers(); focusManager.setFocused(true);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    load.mockResolvedValue({ METAL_INVENTORY: { hasAccess: true, canRead: true, canWrite: true, canDelete: true } });
    const hook = renderHook(() => useFeatures(), { wrapper });
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(hook.result.current.canUsePath('/app/inventory/metal')).toBe(true);
    load.mockResolvedValue({ METAL_INVENTORY: { hasAccess: false, canRead: false, canWrite: false, canDelete: false } });
    await act(async () => { await vi.advanceTimersByTimeAsync(30_001); });
    expect(load).toHaveBeenCalledTimes(2);
    expect(hook.result.current.canUsePath('/app/inventory/metal')).toBe(false);
    hook.unmount(); client.clear();
  });

  it('does not poll hidden sessions and checks immediately on returning to a fresh tab', async () => {
    vi.useFakeTimers(); focusManager.setFocused(true);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    load.mockResolvedValue({ METAL_INVENTORY: { hasAccess: true, canRead: true, canWrite: true, canDelete: true } });
    const hook = renderHook(() => useFeatures(), { wrapper });
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    focusManager.setFocused(false);
    await act(async () => { await vi.advanceTimersByTimeAsync(1_000); });
    load.mockResolvedValue({ METAL_INVENTORY: { hasAccess: false, canRead: false, canWrite: false, canDelete: false } });
    await act(async () => { focusManager.setFocused(true); await vi.advanceTimersByTimeAsync(1); });
    expect(load).toHaveBeenCalledTimes(2);
    expect(hook.result.current.canUsePath('/app/inventory/metal')).toBe(false);
    focusManager.setFocused(false);
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(load).toHaveBeenCalledTimes(2);
    hook.unmount(); client.clear();
  });

  it('rechecks a remounted session even if its cached permissions are still fresh', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    load.mockResolvedValue({ METAL_INVENTORY: { hasAccess: true, canRead: true, canWrite: true, canDelete: true } });
    const first = renderHook(() => useFeatures(), { wrapper });
    await waitFor(() => expect(first.result.current.data).toBeDefined());
    first.unmount();
    load.mockResolvedValue({ METAL_INVENTORY: { hasAccess: false, canRead: false, canWrite: false, canDelete: false } });
    const second = renderHook(() => useFeatures(), { wrapper });
    await waitFor(() => expect(second.result.current.canUsePath('/app/inventory/metal')).toBe(false));
    expect(load).toHaveBeenCalledTimes(2);
    second.unmount(); client.clear();
  });

  it('fails closed while checking and intersects access, read and each action bit', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    let resolve!: (value: any) => void;
    load.mockImplementation(() => new Promise((done) => { resolve = done; }));
    const hook = renderHook(() => useFeatures(), { wrapper });
    expect(hook.result.current.canPerform('METAL_INVENTORY', 'write')).toBe(false);
    await act(async () => { resolve({ METAL_INVENTORY: { hasAccess: true, canRead: true, canWrite: false, canDelete: true } }); });
    await waitFor(() => expect(hook.result.current.data).toBeDefined());
    expect(hook.result.current.canPerform('METAL_INVENTORY', 'read')).toBe(true);
    expect(hook.result.current.canPerform('METAL_INVENTORY', 'write')).toBe(false);
    expect(hook.result.current.canPerform('METAL_INVENTORY', 'delete')).toBe(true);
    await act(async () => { client.setQueryData(['my-features', 'one', 'OFFICE_STAFF', null], { METAL_INVENTORY: { hasAccess: false, canRead: true, canWrite: true, canDelete: true } }); });
    await waitFor(() => expect(hook.result.current.canPerform('METAL_INVENTORY', 'read')).toBe(false));
    expect(hook.result.current.canPerform('METAL_INVENTORY', 'write')).toBe(false);
    expect(hook.result.current.canPerform('METAL_INVENTORY', 'delete')).toBe(false);
    hook.unmount(); client.clear();
  });

  it('blocks actions when a refresh fails despite previously allowed cached flags', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    load.mockResolvedValue({ METAL_INVENTORY: { hasAccess: true, canRead: true, canWrite: true, canDelete: true } });
    const hook = renderHook(() => useFeatures(), { wrapper });
    await waitFor(() => expect(hook.result.current.canPerform('METAL_INVENTORY', 'write')).toBe(true));
    load.mockRejectedValue(new Error('policy unavailable'));
    await act(async () => { await hook.result.current.refetch(); });
    await waitFor(() => expect(hook.result.current.isError).toBe(true));
    expect(hook.result.current.canPerform('METAL_INVENTORY', 'read')).toBe(false);
    expect(hook.result.current.canPerform('METAL_INVENTORY', 'write')).toBe(false);
    hook.unmount(); client.clear();
  });
});
