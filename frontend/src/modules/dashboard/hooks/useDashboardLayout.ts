import { useCallback, useEffect, useState } from 'react';

export interface DashboardWidgetState {
  id: string;
  visible: boolean;
}

export interface DashboardLayoutState {
  order: string[];
  hidden: string[];
}

const STORAGE_PREFIX = 'ativa.dashboard.layout.v1.';

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readLayout = (userId: string, defaults: string[]): DashboardLayoutState => {
  if (!isBrowser) return { order: defaults, hidden: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + userId);
    if (!raw) return { order: defaults, hidden: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.order)) return { order: defaults, hidden: [] };
    const sanitizedOrder: string[] = [
      ...parsed.order.filter((id: unknown): id is string => typeof id === 'string' && defaults.includes(id)),
      ...defaults.filter((id) => !parsed.order.includes(id)),
    ];
    const hidden: string[] = Array.isArray(parsed.hidden)
      ? parsed.hidden.filter((id: unknown): id is string => typeof id === 'string' && defaults.includes(id))
      : [];
    return { order: sanitizedOrder, hidden };
  } catch {
    return { order: defaults, hidden: [] };
  }
};

const writeLayout = (userId: string, state: DashboardLayoutState) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
};

export const useDashboardLayout = (userId: string | undefined, defaultOrder: string[]) => {
  const effectiveUserId = userId ?? 'anonymous';
  const [state, setState] = useState<DashboardLayoutState>(() =>
    readLayout(effectiveUserId, defaultOrder)
  );

  useEffect(() => {
    setState(readLayout(effectiveUserId, defaultOrder));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUserId]);

  const persist = useCallback(
    (next: DashboardLayoutState) => {
      setState(next);
      writeLayout(effectiveUserId, next);
    },
    [effectiveUserId]
  );

  const reorder = useCallback(
    (next: string[]) => persist({ order: next, hidden: state.hidden }),
    [persist, state.hidden]
  );

  const toggleVisibility = useCallback(
    (id: string) => {
      const isHidden = state.hidden.includes(id);
      const nextHidden = isHidden ? state.hidden.filter((x) => x !== id) : [...state.hidden, id];
      persist({ order: state.order, hidden: nextHidden });
    },
    [persist, state.hidden, state.order]
  );

  const reset = useCallback(() => {
    persist({ order: defaultOrder, hidden: [] });
  }, [persist, defaultOrder]);

  return {
    order: state.order,
    hidden: state.hidden,
    reorder,
    toggleVisibility,
    reset,
  };
};
