import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { api, apiGet, apiPost } from '../../services/api';
import { login, logout, setTokens } from '../../services/auth.service';

vi.unmock('../../contexts/AuthContext');
vi.unmock('../../services/auth.service');
vi.mock('../../services/api', () => ({ api: { defaults: { headers: { common: {} } } }, apiGet: vi.fn(), apiPost: vi.fn() }));
const first = { id: 'fixture-a', role: 'ADMIN', name: 'Synthetic A', isActive: true };
const second = { id: 'fixture-b', role: 'OFFICE_STAFF', name: 'Synthetic B', isActive: true };
const loggedIn = (user = second) => ({ success: true, data: { user, tokens: { accessToken: 'fixture-b-access', refreshToken: 'fixture-b-refresh' } } });
const credentials = { email: 'fixture@example.test', password: 'synthetic-only' };
function deferred() { let resolve!: (value?: any) => void; let reject!: (reason: any) => void; const promise = new Promise<any>((done, fail) => { resolve = done; reject = fail; }); return { promise, resolve, reject }; }
let auth: ReturnType<typeof useAuth>;
function Session() { auth = useAuth(); return <p data-testid="session">{auth.isAuthenticated ? auth.user?.id : 'signed-out'}</p>; }
async function mount() { const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); render(<QueryClientProvider client={client}><AuthProvider><Session /></AuthProvider></QueryClientProvider>); await waitFor(() => expect(screen.getByTestId('session')).toHaveTextContent('fixture-a')); }
beforeEach(() => {
  vi.resetAllMocks(); const storage = new Map<string, string>();
  vi.mocked(localStorage.getItem).mockImplementation((key) => storage.get(key) ?? null);
  vi.mocked(localStorage.setItem).mockImplementation((key, value) => { storage.set(key, value); });
  vi.mocked(localStorage.removeItem).mockImplementation((key) => { storage.delete(key); });
  vi.mocked(localStorage.clear).mockImplementation(() => { storage.clear(); });
  setTokens('fixture-a-access', 'fixture-a-refresh');
  api.defaults.headers.common['Authorization'] = 'Bearer fixture-a-access';
  vi.mocked(apiGet).mockResolvedValue({ success: true, data: first });
  vi.mocked(apiPost).mockResolvedValue({ success: true });
});

describe('login/logout response ordering with the real auth service', () => {
  it('does not persist a login after its provider session was cancelled by logout', async () => {
    await mount(); const old = deferred();
    vi.mocked(apiPost).mockImplementation((url) => url === '/auth/login' ? old.promise : Promise.resolve({ success: true }) as any);
    let pending!: Promise<void>;
    await act(async () => { pending = auth.login(credentials); });
    await act(async () => { await auth.logout(); });
    await act(async () => { old.resolve(loggedIn()); await pending; });
    expect(screen.getByTestId('session')).toHaveTextContent('signed-out');
    expect(localStorage.getItem('accessToken')).toBeNull(); expect(localStorage.getItem('user')).toBeNull();
    expect(api.defaults.headers.common['Authorization']).toBeUndefined();
  });
  it.each(['success', 'failure'])('keeps a new account when an older logout finishes with %s', async (outcome) => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await mount(); const old = deferred();
      vi.mocked(apiPost).mockImplementation((url) => url === '/auth/logout' ? old.promise : Promise.resolve(loggedIn()) as any);
      let pending!: Promise<void>;
      await act(async () => { pending = auth.logout(); });
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(apiPost).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'fixture-a-refresh' }, expect.objectContaining({ headers: { Authorization: 'Bearer fixture-a-access' } }));
      await act(async () => { await auth.login(credentials); });
      await act(async () => { if (outcome === 'success') old.resolve({ success: true }); else old.reject({ response: { status: 401 } }); await pending; });
      expect(screen.getByTestId('session')).toHaveTextContent('fixture-b');
      expect(localStorage.getItem('accessToken')).toBe('fixture-b-access');
      expect(JSON.parse(localStorage.getItem('user')!).id).toBe('fixture-b');
      expect(api.defaults.headers.common['Authorization']).toBe('Bearer fixture-b-access');
    } finally { errorLog.mockRestore(); }
  });
  it('honors a cancelled login persistence guard at the service boundary', async () => {
    const old = deferred(); let current = true; vi.mocked(apiPost).mockReturnValue(old.promise);
    const pending = login(credentials, () => current); const rejected = expect(pending).rejects.toMatchObject({ name: 'AuthSessionChangedError' });
    current = false; old.resolve(loggedIn()); await rejected;
    expect(localStorage.getItem('accessToken')).toBe('fixture-a-access');
  });
  it('clears a local session synchronously while retaining the captured credentials for server logout', async () => {
    const old = deferred(); vi.mocked(apiPost).mockReturnValue(old.promise);
    const pending = logout();
    expect(localStorage.getItem('accessToken')).toBeNull(); expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    expect(apiPost).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'fixture-a-refresh' }, expect.objectContaining({ headers: { Authorization: 'Bearer fixture-a-access' } }));
    old.resolve({ success: true }); await pending;
  });
});
