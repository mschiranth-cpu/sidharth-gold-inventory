import type { SieveSize } from '../services/sieveSize.service';

/**
 * Pure helpers for bidirectional pieces ↔ carats conversion driven by a
 * SieveSize row. Kept as plain functions (not a hook) so the same logic can
 * power both ReceiveDiamondPage and the upcoming Diamond PO line editor.
 *
 * Conversion math:
 *   - MESH:    pieces = round(carats × piecesPerCaratAvg)
 *              carats = pieces / piecesPerCaratAvg  (3 decimals)
 *   - SINGLE:  pieces = round(carats / weightPerPieceCt)
 *              carats = pieces × weightPerPieceCt   (3 decimals)
 *
 * Returns NaN-safe defaults for missing/zero inputs so the caller can pipe
 * the result straight into a controlled `<input type="number">`.
 */

export function piecesFromCarats(
  carats: number | null | undefined,
  sieve: SieveSize | null | undefined
): number {
  if (!sieve || !carats || carats <= 0) return 0;
  if (sieve.kind === 'MESH') {
    if (!sieve.piecesPerCaratAvg || sieve.piecesPerCaratAvg <= 0) return 0;
    return Math.max(0, Math.round(carats * sieve.piecesPerCaratAvg));
  }
  // SINGLE — pieces = carats / weightPerPieceCt
  if (!sieve.weightPerPieceCt || sieve.weightPerPieceCt <= 0) return 0;
  return Math.max(0, Math.round(carats / sieve.weightPerPieceCt));
}

export function caratsFromPieces(
  pieces: number | null | undefined,
  sieve: SieveSize | null | undefined
): number {
  if (!sieve || !pieces || pieces <= 0) return 0;
  if (sieve.kind === 'MESH') {
    if (!sieve.piecesPerCaratAvg || sieve.piecesPerCaratAvg <= 0) return 0;
    return Math.round((pieces / sieve.piecesPerCaratAvg) * 1000) / 1000;
  }
  // SINGLE — carats = pieces × weightPerPieceCt
  if (!sieve.weightPerPieceCt || sieve.weightPerPieceCt <= 0) return 0;
  return Math.round(pieces * sieve.weightPerPieceCt * 1000) / 1000;
}

export function describeSieve(sieve: SieveSize | null | undefined): string {
  if (!sieve) return '';
  if (sieve.kind === 'MESH') {
    const ppc = sieve.piecesPerCaratAvg ?? 0;
    return `≈ ${ppc} pcs/ct · mm ${sieve.mmFrom.toFixed(2)}–${sieve.mmTo.toFixed(2)}`;
  }
  const w = sieve.weightPerPieceCt ?? 0;
  return `${w.toFixed(2)} ct/stone · mm ${sieve.mmFrom.toFixed(2)}–${sieve.mmTo.toFixed(2)}`;
}
