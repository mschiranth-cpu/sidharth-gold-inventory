/**
 * ============================================
 * REFRESH INTERVAL CONTEXT
 * ============================================
 *
 * Site-wide auto-refresh cadence. Components that auto-poll (live rates,
 * metal stock, transactions, dashboards) read `intervalMs` from this
 * context instead of hard-coding a number.
 *
 * Persisted in `localStorage` under `ativa.refreshIntervalMs`.
 *
 *   intervalMs === false  → auto-refresh disabled
 *   intervalMs === number → milliseconds between polls
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'ativa.refreshIntervalMs';
const DEFAULT_MS = 30_000;

export type RefreshOption = {
  id: string;
  label: string;
  short: string;
  ms: number | false;
};

export const REFRESH_OPTIONS: RefreshOption[] = [
  { id: '1s', label: 'Every second', short: '1s', ms: 1_000 },
  { id: '5s', label: 'Every 5 seconds', short: '5s', ms: 5_000 },
  { id: '15s', label: 'Every 15 seconds', short: '15s', ms: 15_000 },
  { id: '30s', label: 'Every 30 seconds', short: '30s', ms: 30_000 },
  { id: '60s', label: 'Every minute', short: '1m', ms: 60_000 },
  { id: '5m', label: 'Every 5 minutes', short: '5m', ms: 5 * 60_000 },
  { id: 'off', label: 'Off (manual only)', short: 'Off', ms: false },
];

interface ContextValue {
  intervalMs: number | false;
  option: RefreshOption;
  setIntervalMs: (ms: number | false) => void;
}

const RefreshIntervalContext = createContext<ContextValue | null>(null);

function readStored(): number | false {
  if (typeof window === 'undefined') return DEFAULT_MS;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) return DEFAULT_MS;
  if (raw === 'false') return false;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MS;
}

export function RefreshIntervalProvider({ children }: { children: ReactNode }) {
  const [intervalMs, setIntervalState] = useState<number | false>(() => readStored());

  const setIntervalMs = useCallback((ms: number | false) => {
    setIntervalState(ms);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(ms));
    }
  }, []);

  // Cross-tab sync
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setIntervalState(readStored());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const option = useMemo<RefreshOption>(() => {
    const found = REFRESH_OPTIONS.find((o) => o.ms === intervalMs);
    return found ?? REFRESH_OPTIONS[3]!; // default 30s
  }, [intervalMs]);

  const value = useMemo(
    () => ({ intervalMs, option, setIntervalMs }),
    [intervalMs, option, setIntervalMs]
  );

  return (
    <RefreshIntervalContext.Provider value={value}>
      {children}
    </RefreshIntervalContext.Provider>
  );
}

/**
 * Read the current refresh interval. Safe outside the provider — falls back
 * to the persisted value or default.
 */
export function useRefreshInterval(): number | false {
  const ctx = useContext(RefreshIntervalContext);
  if (ctx) return ctx.intervalMs;
  return readStored();
}

export function useRefreshIntervalControls(): ContextValue {
  const ctx = useContext(RefreshIntervalContext);
  if (!ctx) {
    // Allow standalone usage – returns a no-op setter.
    return {
      intervalMs: readStored(),
      option: REFRESH_OPTIONS[3]!,
      setIntervalMs: () => {},
    };
  }
  return ctx;
}
