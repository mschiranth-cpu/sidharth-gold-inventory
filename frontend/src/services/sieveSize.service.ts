import api from './api';

/**
 * Frontend mirror of the backend `SieveSize` model. Returned by
 * `GET /api/sieve-sizes`. The list is small and effectively immutable;
 * the receive form caches it via React Query for the session.
 */
export interface SieveSize {
  id: number;
  kind: 'MESH' | 'SINGLE';
  code: string;
  sieveCodeFrom: string | null;
  sieveCodeTo: string | null;
  sizeLabel: string | null;
  /** MESH only — drives the auto-calc (pieces ≈ carats × N). */
  piecesPerCaratAvg: number | null;
  /**
   * MESH: average weight of one stone (informational, not used for math).
   * SINGLE: full carat weight of a single stone — used for both directions.
   */
  weightPerPieceCt: number | null;
  mmFrom: number;
  mmTo: number;
  displayOrder: number;
  isActive: boolean;
}

/**
 * Fetch the sieve master list. Defaults to active rows only. Caller should
 * filter to `kind: 'MESH'` for the loose-diamond receive form.
 */
export async function listSieveSizes(opts?: {
  kind?: 'MESH' | 'SINGLE';
  activeOnly?: boolean;
}): Promise<SieveSize[]> {
  const params: Record<string, string> = {};
  if (opts?.kind) params.kind = opts.kind;
  if (opts?.activeOnly === false) params.activeOnly = 'false';
  const r = await api.get('/sieve-sizes', { params });
  return r.data.data;
}
