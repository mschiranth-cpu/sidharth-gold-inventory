import { AxiosError, AxiosHeaders } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../services/api';

vi.unmock('../../services/api');

const originalAdapter = api.defaults.adapter;
let storage: Map<string, string>;
let location: { pathname: string; href: string };
function storeSession(name: string) {
  storage.set('token', name);
  storage.set('accessToken', name);
  storage.set('refreshToken', name + '-refresh');
  storage.set('user', JSON.stringify({ id: name }));
}
function rejectResponse(config: any, status: number) {
  return new AxiosError('Synthetic HTTP ' + status, 'ERR_BAD_RESPONSE', config, undefined,
    { status, statusText: 'Synthetic response', headers: {}, config, data: {} });
}
beforeEach(() => {
  vi.clearAllMocks();
  storage = new Map(); storeSession('current-session');
  vi.mocked(localStorage.getItem).mockImplementation((key) => storage.get(key) ?? null);
  vi.mocked(localStorage.setItem).mockImplementation((key, value) => { storage.set(key, value); });
  vi.mocked(localStorage.removeItem).mockImplementation((key) => { storage.delete(key); });
  location = { pathname: '/app/dashboard', href: '/app/dashboard' };
  vi.stubGlobal('window', { location });
  api.defaults.headers.common.Authorization = 'Bearer current-session';
});
afterEach(() => {
  api.defaults.adapter = originalAdapter;
  delete api.defaults.headers.common.Authorization;
  vi.unstubAllGlobals();
});

describe('Axios session request isolation', () => {
  it.each(['Authorization', 'authorization'])('preserves explicit %s captured for an old logout while a new account is current', async (header) => {
    const adapter = vi.fn(async (config: any) => ({ data: {}, status: 200, statusText: 'OK', headers: {}, config }));
    api.defaults.adapter = adapter;
    await api.post('/auth/logout', { refreshToken: 'old-session-refresh' }, { headers: { [header]: 'Bearer old-session' } });
    expect(AxiosHeaders.from(adapter.mock.calls[0]![0].headers).get('Authorization')).toBe('Bearer old-session');
    expect(storage.get('token')).toBe('current-session');
  });

  it('respects an explicit empty logout header instead of attaching the new account token', async () => {
    const adapter = vi.fn(async (config: any) => ({ data: {}, status: 200, statusText: 'OK', headers: {}, config }));
    api.defaults.adapter = adapter;
    await api.post('/auth/logout', {}, { headers: { Authorization: '' } });
    expect(AxiosHeaders.from(adapter.mock.calls[0]![0].headers).get('Authorization')).toBe('');
  });

  it('removes an inherited stale default when storage is empty', async () => {
    storage.clear();
    const adapter = vi.fn(async (config: any) => ({ data: {}, status: 200, statusText: 'OK', headers: {}, config }));
    api.defaults.adapter = adapter;
    await api.get('/synthetic/protected');
    expect(AxiosHeaders.from(adapter.mock.calls[0]![0].headers).has('Authorization')).toBe(false);
    expect(api.defaults.headers.common.Authorization).toBeUndefined();
  });

  it('adds the current stored access token when there is no default header', async () => {
    delete api.defaults.headers.common.Authorization;
    storage.delete('token');
    const adapter = vi.fn(async (config: any) => ({ data: {}, status: 200, statusText: 'OK', headers: {}, config }));
    api.defaults.adapter = adapter;
    await api.get('/synthetic/protected');
    expect(AxiosHeaders.from(adapter.mock.calls[0]![0].headers).get('Authorization')).toBe('Bearer current-session');
  });

  it('does not let an old request 401 clear or redirect a newer account', async () => {
    let fail!: () => void;
    api.defaults.adapter = (config) => new Promise((_resolve, reject) => { fail = () => reject(rejectResponse(config, 401)); });
    const pending = api.get('/synthetic/protected');
    const rejected = expect(pending).rejects.toMatchObject({ response: { status: 401 } });
    await vi.waitFor(() => expect(fail).toBeDefined());
    storeSession('new-session'); api.defaults.headers.common.Authorization = 'Bearer new-session';
    fail(); await rejected;
    expect(storage.get('token')).toBe('new-session');
    expect(storage.get('refreshToken')).toBe('new-session-refresh');
    expect(storage.get('user')).toBe(JSON.stringify({ id: 'new-session' }));
    expect(api.defaults.headers.common.Authorization).toBe('Bearer new-session');
    expect(location.href).toBe('/app/dashboard');
  });

  it('clears an ordinary denied current session and redirects to login', async () => {
    api.defaults.adapter = async (config) => { throw rejectResponse(config, 401); };
    await expect(api.get('/synthetic/protected')).rejects.toMatchObject({ response: { status: 401 } });
    expect(storage.size).toBe(0);
    expect(api.defaults.headers.common.Authorization).toBeUndefined();
    expect(location.href).toBe('/login');
  });

  it.each(['/auth/me', '/auth/refresh-token', '/auth/logout'])('leaves %s 401 handling with the auth owner', async (url) => {
    api.defaults.adapter = async (config) => { throw rejectResponse(config, 401); };
    await expect(api.post(url, {})).rejects.toMatchObject({ response: { status: 401 } });
    expect(storage.get('token')).toBe('current-session');
    expect(location.href).toBe('/app/dashboard');
  });

  it('keeps a current 403 local to the requesting feature', async () => {
    api.defaults.adapter = async (config) => { throw rejectResponse(config, 403); };
    await expect(api.get('/synthetic/protected')).rejects.toMatchObject({ response: { status: 403 } });
    expect(storage.get('token')).toBe('current-session');
    expect(location.href).toBe('/app/dashboard');
  });
});
