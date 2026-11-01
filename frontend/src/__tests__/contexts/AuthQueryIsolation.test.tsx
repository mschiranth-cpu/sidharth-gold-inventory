import { act, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import * as service from '../../services/auth.service';

vi.unmock('../../contexts/AuthContext');
vi.mock('../../services/auth.service', () => ({ login: vi.fn(), register: vi.fn(), logout: vi.fn(), refreshAccessToken: vi.fn(), getCurrentUser: vi.fn(), initializeAuth: vi.fn(), getStoredUser: vi.fn(), clearTokens: vi.fn() }));
const first = { id: 'fixture-a', role: 'ADMIN', department: null, isActive: true };
const second = { id: 'fixture-b', role: 'CLIENT', department: null, isActive: true };
const keys = ['client-profile', 'client-orders', 'my-payslips', 'my-leaves', 'my-attendance'];
let auth: ReturnType<typeof useAuth>;
function CachedValue({ name }: { name: string }) {
  const { user } = useAuth();
  const result = useQuery({ queryKey: [name], queryFn: () => Promise.resolve(`${user!.id}:${name}`), staleTime: 120_000 });
  return <p data-testid={name}>{result.data ?? 'loading'}</p>;
}
function Session({ reads = false }: { reads?: boolean }) {
  auth = useAuth();
  return <><p data-testid="identity">{auth.isAuthenticated ? auth.user?.id : 'signed-out'}</p>{reads && auth.isAuthenticated && !auth.isLoading && keys.map((key) => <CachedValue key={key} name={key} />)}</>;
}
async function mount(client: QueryClient, reads = false) { render(<QueryClientProvider client={client}><AuthProvider><Session reads={reads} /></AuthProvider></QueryClientProvider>); await waitFor(() => expect(screen.getByTestId('identity')).toHaveTextContent('fixture-a')); }
function prime(client: QueryClient) { for (const key of keys) client.setQueryData([key], `private-a:${key}`); }
function expectEmpty(client: QueryClient) { for (const key of keys) expect(client.getQueryData([key])).toBeUndefined(); }
function client() { return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } }); }
async function loginSecond() { await act(async () => { await auth.login({ email: 'fixture@example.test', password: 'synthetic-only' }); }); }
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(service.initializeAuth).mockReturnValue(true);
  vi.mocked(service.getStoredUser).mockReturnValue(first as any);
  vi.mocked(service.getCurrentUser).mockResolvedValue({ success: true, data: first } as any);
  vi.mocked(service.login).mockResolvedValue({ success: true, data: { user: second } } as any);
});

describe('private React Query data follows the authenticated identity', () => {
  it('refetches reused profile/orders/payslip/leave/attendance keys for the next account instead of rendering the prior account', async () => {
    const cache = client(); await mount(cache, true);
    await waitFor(() => { for (const key of keys) expect(screen.getByTestId(key)).toHaveTextContent(`fixture-a:${key}`); });
    await loginSecond();
    await waitFor(() => { for (const key of keys) expect(screen.getByTestId(key)).toHaveTextContent(`fixture-b:${key}`); });
    expect(screen.queryByText(/fixture-a:client-profile/)).not.toBeInTheDocument();
  });
  it('cancels a query that ignores AbortSignal and prevents its late old-account value from replacing new-account data', async () => {
    const cache = client(); await mount(cache); prime(cache);
    let resolve!: (value: string) => void;
    const old = cache.fetchQuery({ queryKey: ['slow-private'], queryFn: () => new Promise<string>((done) => { resolve = done; }) }).catch(() => undefined);
    await act(async () => { await auth.logout(); }); expectEmpty(cache);
    await loginSecond(); cache.setQueryData(['slow-private'], 'private-b');
    resolve('private-a'); await old; await Promise.resolve();
    expect(cache.getQueryData(['slow-private'])).toBe('private-b');
  });
  it.each([{ role: 'OFFICE_STAFF', department: null }, { role: 'ADMIN', department: 'POLISHING' }])('clears prior access-scoped data before exposing a current role or department change', async (change) => {
    const cache = client(); await mount(cache); prime(cache);
    vi.mocked(service.getCurrentUser).mockResolvedValue({ success: true, data: { ...first, ...change } } as any);
    await act(async () => { window.dispatchEvent(new Event('focus')); }); expectEmpty(cache);
    expect(auth.user?.role).toBe(change.role); expect(auth.user?.department).toBe(change.department);
  });
  it('clears private cached data on a definitive current-session denial', async () => {
    const cache = client(); await mount(cache); prime(cache);
    vi.mocked(service.getCurrentUser).mockRejectedValue({ response: { status: 403 } });
    await act(async () => { window.dispatchEvent(new Event('focus')); }); expectEmpty(cache);
    expect(screen.getByTestId('identity')).toHaveTextContent('signed-out');
  });
  it('retains same-account cached data during an unknown network/server failure', async () => {
    const cache = client(); await mount(cache); prime(cache);
    vi.mocked(service.getCurrentUser).mockRejectedValue({ response: { status: 503 } });
    await act(async () => { window.dispatchEvent(new Event('focus')); });
    for (const key of keys) expect(cache.getQueryData([key])).toBe(`private-a:${key}`);
    expect(screen.getByTestId('identity')).toHaveTextContent('fixture-a');
  });
  it('clears cache for an explicit identity/scope update but preserves it for an ordinary same-scope profile edit', async () => {
    const cache = client(); await mount(cache); prime(cache);
    await act(async () => { auth.updateUser({ ...first, name: 'Changed display name' } as any); });
    expect(cache.getQueryData(['client-profile'])).toBe('private-a:client-profile');
    await act(async () => { auth.updateUser(second as any); }); expectEmpty(cache);
  });
});
