import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, apiGet, apiPost } from '../../services/api';
import { clearTokens, getCurrentUser, refreshAccessToken, setTokens } from '../../services/auth.service';

vi.unmock('../../services/auth.service');
vi.mock('../../services/api', () => ({ api: { defaults: { headers: { common: {} } } }, apiGet: vi.fn(), apiPost: vi.fn() }));
const user = { id: 'fixture', role: 'ADMIN', name: 'Synthetic fixture' };
const profile = { success: true, data: user };
const refreshed = { success: true, data: { tokens: { accessToken: 'fixture-renewed-access', refreshToken: 'fixture-renewed-refresh' } } };
function deferred() { let resolve!: (value: any) => void; const promise = new Promise<any>((done) => { resolve = done; }); return { promise, resolve }; }
beforeEach(() => {
  vi.resetAllMocks();
  const storage = new Map<string, string>();
  vi.mocked(localStorage.getItem).mockImplementation((key) => storage.get(key) ?? null);
  vi.mocked(localStorage.setItem).mockImplementation((key, value) => { storage.set(key, value); });
  vi.mocked(localStorage.removeItem).mockImplementation((key) => { storage.delete(key); });
  vi.mocked(localStorage.clear).mockImplementation(() => { storage.clear(); });
  setTokens('fixture-old-access', 'fixture-old-refresh');
  delete api.defaults.headers.common['Authorization'];
});

describe('auth response persistence belongs to its current session', () => {
  it('keeps existing no-argument profile and refresh callers compatible', async () => {
    vi.mocked(apiGet).mockResolvedValue(profile); await getCurrentUser();
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(user);
    vi.mocked(apiPost).mockResolvedValue(refreshed); await refreshAccessToken();
    expect(localStorage.getItem('accessToken')).toBe('fixture-renewed-access');
    expect(api.defaults.headers.common['Authorization']).toBe('Bearer fixture-renewed-access');
  });
  it.each(['cancelled', 'changed-token', 'signed-out'])('never persists an old profile after its session is %s', async (kind) => {
    const old = deferred(); let current = true; vi.mocked(apiGet).mockReturnValue(old.promise);
    const result = getCurrentUser(() => current); const rejected = expect(result).rejects.toMatchObject({ name: 'AuthSessionChangedError' });
    if (kind === 'cancelled') current = false;
    if (kind === 'changed-token') setTokens('fixture-new-account-access', 'fixture-new-account-refresh');
    if (kind === 'signed-out') clearTokens();
    old.resolve(profile); await rejected;
    expect(localStorage.getItem('user')).toBeNull();
  });
  it.each(['cancelled', 'changed-token', 'signed-out'])('never restores stale tokens after its session is %s', async (kind) => {
    const old = deferred(); let current = true; vi.mocked(apiPost).mockReturnValue(old.promise);
    const result = refreshAccessToken(() => current); const rejected = expect(result).rejects.toMatchObject({ name: 'AuthSessionChangedError' });
    if (kind === 'cancelled') current = false;
    if (kind === 'changed-token') setTokens('fixture-new-account-access', 'fixture-new-account-refresh');
    if (kind === 'signed-out') clearTokens();
    old.resolve(refreshed); await rejected;
    expect(localStorage.getItem('accessToken')).toBe(kind === 'signed-out' ? null : kind === 'changed-token' ? 'fixture-new-account-access' : 'fixture-old-access');
    expect(api.defaults.headers.common['Authorization']).toBeUndefined();
  });
  it('does not start a request after its guard has already expired', async () => {
    await expect(getCurrentUser(() => false)).rejects.toMatchObject({ name: 'AuthSessionChangedError' });
    await expect(refreshAccessToken(() => false)).rejects.toMatchObject({ name: 'AuthSessionChangedError' });
    expect(apiGet).not.toHaveBeenCalled(); expect(apiPost).not.toHaveBeenCalled();
  });
});
