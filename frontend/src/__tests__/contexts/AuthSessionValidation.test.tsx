import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import * as authService from '../../services/auth.service';
import Sidebar from '../../components/layout/Sidebar';

vi.unmock('../../contexts/AuthContext');
vi.mock('../../hooks/useFeatures', () => ({ useFeatures: () => ({ canUsePath: () => true }) }));

vi.mock('../../services/auth.service', () => ({
  login: vi.fn(), register: vi.fn(), logout: vi.fn(),
  refreshAccessToken: vi.fn(), getCurrentUser: vi.fn(),
  initializeAuth: vi.fn(), getStoredUser: vi.fn(), clearTokens: vi.fn(),
}));

const cachedAdmin = { id: 'session-fixture', name: 'Fixture', email: 'fixture@example.test', role: 'ADMIN', isActive: true };
let currentAuth: ReturnType<typeof useAuth>;

function Session() {
  const state = useAuth();
  currentAuth = state;
  return <div data-testid="session">{state.isLoading ? 'validating' : state.isAuthenticated ? `${state.user?.id}:${state.user?.role}:${state.user?.department ?? ''}` : 'signed-out'}</div>;
}
function mount(sidebar = false) { const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); return render(<QueryClientProvider client={client}><MemoryRouter><AuthProvider><Session />{sidebar && <Sidebar sidebarOpen={false} setSidebarOpen={() => {}} />}</AuthProvider></MemoryRouter></QueryClientProvider>); }

describe('restored session validation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(authService.initializeAuth).mockReturnValue(true);
    vi.mocked(authService.getStoredUser).mockReturnValue(cachedAdmin as any);
  });

  it('clears a cached administrator when validation and refresh reject the session', async () => {
    vi.mocked(authService.getCurrentUser).mockRejectedValue({ response: { status: 401 } });
    vi.mocked(authService.refreshAccessToken).mockRejectedValue(new Error('revoked'));
    mount();
    await waitFor(() => expect(screen.getByTestId('session')).toHaveTextContent('signed-out'));
    expect(authService.clearTokens).toHaveBeenCalledOnce();
  });

  it('uses the current role after successfully refreshing a cached session', async () => {
    vi.mocked(authService.getCurrentUser)
      .mockRejectedValueOnce({ response: { status: 401 } })
      .mockResolvedValueOnce({ success: true, data: { ...cachedAdmin, role: 'OFFICE_STAFF' } } as any);
    vi.mocked(authService.refreshAccessToken).mockResolvedValue({ success: true } as any);
    mount();
    await waitFor(() => expect(screen.getByTestId('session')).toHaveTextContent('OFFICE_STAFF'));
    expect(authService.clearTokens).not.toHaveBeenCalled();
  });

  it('does not render a cached administrator while current-role validation is pending', async () => {
    let resolve!: (value: any) => void;
    vi.mocked(authService.getCurrentUser).mockImplementation(() => new Promise((done) => { resolve = done; }));
    mount();
    expect(screen.getByTestId('session')).toHaveTextContent('validating');
    expect(screen.getByTestId('session')).not.toHaveTextContent('ADMIN');
    resolve({ success: true, data: { ...cachedAdmin, role: 'OFFICE_STAFF' } });
    await waitFor(() => expect(screen.getByTestId('session')).toHaveTextContent('OFFICE_STAFF'));
  });

  it('clears a forbidden cached session without attempting refresh', async () => {
    vi.mocked(authService.getCurrentUser).mockRejectedValue({ response: { status: 403 } });
    mount();
    await waitFor(() => expect(screen.getByTestId('session')).toHaveTextContent('signed-out'));
    expect(authService.refreshAccessToken).not.toHaveBeenCalled();
  });

  it('preserves offline profile fallback for a server error, without treating it as authorization', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(authService.getCurrentUser).mockRejectedValue({ response: { status: 503 } });
    mount();
    await waitFor(() => expect(warning).toHaveBeenCalled());
    expect(screen.getByTestId('session')).toHaveTextContent('ADMIN');
    expect(authService.clearTokens).not.toHaveBeenCalled();
    warning.mockRestore();
  });

  it('does not restore an already-disabled stored profile while the server is unavailable', async () => {
    vi.mocked(authService.getStoredUser).mockReturnValue({ ...cachedAdmin, isActive: false } as any);
    vi.mocked(authService.getCurrentUser).mockRejectedValue({ response: { status: 503 } });
    mount(); await waitFor(() => expect(screen.getByTestId('session')).toHaveTextContent('signed-out'));
    expect(authService.clearTokens).toHaveBeenCalledOnce();
  });

  it.each([
    { success: false },
    { success: true, data: { ...cachedAdmin, isActive: false } },
  ])('rejects a failed or inactive profile response despite cached credentials', async (response) => {
    vi.mocked(authService.getCurrentUser).mockResolvedValue(response as any);
    mount();
    await waitFor(() => expect(screen.getByTestId('session')).toHaveTextContent('signed-out'));
    expect(authService.clearTokens).toHaveBeenCalledOnce();
  });
});

describe('foreground session synchronization', () => {
  let visibility: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    vi.resetAllMocks(); vi.useFakeTimers();
    visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    vi.mocked(authService.initializeAuth).mockReturnValue(true);
    vi.mocked(authService.getStoredUser).mockReturnValue(cachedAdmin as any);
    vi.mocked(authService.getCurrentUser).mockResolvedValue({ success: true, data: cachedAdmin } as any);
  });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
  async function start(sidebar = false) { await act(async () => { mount(sidebar); }); }
  async function focus() { await act(async () => { window.dispatchEvent(new Event('focus')); }); }

  it('updates an active administrator role and department and removes administrator navigation within 30 seconds', async () => {
    await start(true); expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument();
    vi.mocked(authService.getCurrentUser).mockResolvedValue({ success: true, data: { ...cachedAdmin, role: 'DEPARTMENT_WORKER', department: 'POLISHING' } } as any);
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(screen.getByTestId('session')).toHaveTextContent('DEPARTMENT_WORKER:POLISHING');
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
  });
  it('signs out a disabled active account and stops further background requests', async () => {
    await start(); vi.mocked(authService.getCurrentUser).mockResolvedValue({ success: true, data: { ...cachedAdmin, isActive: false } } as any);
    await focus(); expect(screen.getByTestId('session')).toHaveTextContent('signed-out');
    expect(authService.clearTokens).toHaveBeenCalledOnce();
    await act(async () => { await vi.advanceTimersByTimeAsync(90_000); });
    expect(authService.getCurrentUser).toHaveBeenCalledTimes(2);
  });
  it('tries the normal refresh once on 401 and clears a subsequently denied session', async () => {
    await start(); vi.mocked(authService.getCurrentUser).mockRejectedValueOnce({ response: { status: 401 } }).mockRejectedValueOnce({ response: { status: 403 } });
    vi.mocked(authService.refreshAccessToken).mockResolvedValue({ success: true } as any);
    await focus(); expect(authService.refreshAccessToken).toHaveBeenCalledOnce();
    expect(screen.getByTestId('session')).toHaveTextContent('signed-out');
    expect(authService.clearTokens).toHaveBeenCalledOnce();
  });
  it.each([{ response: { status: 503 } }, new Error('Network Error')])('retains the current session during an unavailable-server check', async (error) => {
    await start(); vi.mocked(authService.getCurrentUser).mockRejectedValue(error);
    await focus(); expect(screen.getByTestId('session')).toHaveTextContent('ADMIN');
    expect(authService.getCurrentUser).toHaveBeenCalledTimes(2);
    expect(authService.clearTokens).not.toHaveBeenCalled();
  });
  it('does not poll while hidden and refreshes on returning visible or focused', async () => {
    await start(); visibility.mockReturnValue('hidden');
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); await vi.advanceTimersByTimeAsync(120_000); window.dispatchEvent(new Event('focus')); });
    expect(authService.getCurrentUser).toHaveBeenCalledTimes(1);
    visibility.mockReturnValue('visible'); await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(authService.getCurrentUser).toHaveBeenCalledTimes(2);
    await focus(); expect(authService.getCurrentUser).toHaveBeenCalledTimes(3);
  });
  it('coalesces focus and timer checks while one validation is in flight', async () => {
    await start(); let resolve!: (value: any) => void;
    vi.mocked(authService.getCurrentUser).mockImplementation(() => new Promise((done) => { resolve = done; }));
    await focus(); await focus(); await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(authService.getCurrentUser).toHaveBeenCalledTimes(2);
    await act(async () => { resolve({ success: true, data: cachedAdmin }); });
  });
  it('does not let a late response restore an account after logout', async () => {
    await start(); let resolve!: (value: any) => void;
    vi.mocked(authService.getCurrentUser).mockImplementation(() => new Promise((done) => { resolve = done; }));
    await focus(); await act(async () => { await currentAuth.logout(); });
    await act(async () => { resolve({ success: true, data: cachedAdmin }); });
    expect(screen.getByTestId('session')).toHaveTextContent('signed-out');
  });
  it('ignores an old account validation after another user logs in', async () => {
    await start(); let reject!: (reason: any) => void;
    vi.mocked(authService.getCurrentUser).mockImplementation(() => new Promise((_done, fail) => { reject = fail; }));
    await focus(); vi.mocked(authService.login).mockResolvedValue({ success: true, data: { user: { ...cachedAdmin, id: 'new-user', role: 'OFFICE_STAFF' } } } as any);
    await act(async () => { await currentAuth.login({ email: 'new@example.test', password: 'synthetic' }); });
    await act(async () => { reject({ response: { status: 403 } }); });
    expect(screen.getByTestId('session')).toHaveTextContent('new-user:OFFICE_STAFF');
    expect(authService.clearTokens).not.toHaveBeenCalled();
  });
});
