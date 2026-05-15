/**
 * Unit tests for the bidirectional pieces ↔ carats helpers driven by a
 * SieveSize row. These functions are pure (no DOM, no hooks) so they run
 * directly under vitest with no setup beyond the existing global jsdom env.
 */
import { describe, it, expect } from 'vitest';
import {
  caratsFromPieces,
  describeSieve,
  piecesFromCarats,
  type SieveLike,
} from '../useSieveAutoCalc';

const mesh11: SieveLike = {
  kind: 'MESH',
  piecesPerCaratAvg: 12,
  weightPerPieceCt: 0.078,
  mmFrom: 2.7,
  mmTo: 2.8,
};

const mesh9: SieveLike = {
  kind: 'MESH',
  piecesPerCaratAvg: 20,
  weightPerPieceCt: 0.052,
  mmFrom: 2.3,
  mmTo: 2.4,
};

const single30: SieveLike = {
  kind: 'SINGLE',
  piecesPerCaratAvg: null,
  weightPerPieceCt: 0.3,
  mmFrom: 4.2,
  mmTo: 4.6,
};

describe('useSieveAutoCalc helpers', () => {
  describe('piecesFromCarats — MESH', () => {
    it('rounds carats × piecesPerCaratAvg', () => {
      expect(piecesFromCarats(5, mesh11)).toBe(60);
      expect(piecesFromCarats(5, mesh9)).toBe(100);
    });

    it('rounds half-up correctly', () => {
      expect(piecesFromCarats(0.04, mesh11)).toBe(0);
      expect(piecesFromCarats(0.05, mesh11)).toBe(1);
    });

    it('returns 0 for zero/negative/null carats', () => {
      expect(piecesFromCarats(0, mesh11)).toBe(0);
      expect(piecesFromCarats(-3, mesh11)).toBe(0);
      expect(piecesFromCarats(null, mesh11)).toBe(0);
      expect(piecesFromCarats(undefined, mesh11)).toBe(0);
    });

    it('returns 0 when sieve is missing or has invalid piecesPerCaratAvg', () => {
      expect(piecesFromCarats(5, null)).toBe(0);
      expect(piecesFromCarats(5, undefined)).toBe(0);
      expect(
        piecesFromCarats(5, { ...mesh11, piecesPerCaratAvg: 0 })
      ).toBe(0);
      expect(
        piecesFromCarats(5, { ...mesh11, piecesPerCaratAvg: null })
      ).toBe(0);
    });
  });

  describe('caratsFromPieces — MESH', () => {
    it('returns pieces / piecesPerCaratAvg rounded to 3 decimals', () => {
      expect(caratsFromPieces(60, mesh11)).toBe(5);
      expect(caratsFromPieces(100, mesh9)).toBe(5);
      expect(caratsFromPieces(1, mesh11)).toBe(0.083);
    });

    it('handles fractional values without floating point noise', () => {
      expect(caratsFromPieces(7, mesh11)).toBe(0.583);
    });

    it('returns 0 for non-positive or null pieces', () => {
      expect(caratsFromPieces(0, mesh11)).toBe(0);
      expect(caratsFromPieces(-1, mesh11)).toBe(0);
      expect(caratsFromPieces(null, mesh11)).toBe(0);
      expect(caratsFromPieces(undefined, mesh11)).toBe(0);
    });
  });

  describe('SINGLE rows', () => {
    it('piecesFromCarats divides by weightPerPieceCt', () => {
      expect(piecesFromCarats(0.6, single30)).toBe(2);
      expect(piecesFromCarats(0.3, single30)).toBe(1);
      expect(piecesFromCarats(1.5, single30)).toBe(5);
    });

    it('caratsFromPieces multiplies pieces × weightPerPieceCt', () => {
      expect(caratsFromPieces(2, single30)).toBe(0.6);
      expect(caratsFromPieces(7, single30)).toBe(2.1);
    });

    it('returns 0 when SINGLE row has invalid weightPerPieceCt', () => {
      const bad: SieveLike = {
        ...single30,
        weightPerPieceCt: 0,
      };
      expect(piecesFromCarats(1, bad)).toBe(0);
      expect(caratsFromPieces(1, bad)).toBe(0);
    });
  });

  describe('describeSieve', () => {
    it('formats MESH rows as pcs/ct + mm range', () => {
      expect(describeSieve(mesh11)).toBe('≈ 12 pcs/ct · mm 2.70–2.80');
    });

    it('formats SINGLE rows as ct/stone + mm range', () => {
      expect(describeSieve(single30)).toBe('0.30 ct/stone · mm 4.20–4.60');
    });

    it('returns empty string for null/undefined sieve', () => {
      expect(describeSieve(null)).toBe('');
      expect(describeSieve(undefined)).toBe('');
    });
  });

  describe('round-trip stability', () => {
    it('pcs → cts → pcs preserves value for whole-pieces input', () => {
      // 60 pcs / 12 ppc = 5 ct ; 5 ct × 12 ppc = 60 pcs
      const cts = caratsFromPieces(60, mesh11);
      expect(piecesFromCarats(cts, mesh11)).toBe(60);
    });

    it('cts → pcs → cts may drift within rounding tolerance', () => {
      // 5 ct → 60 pcs → 5 ct (lossless on this row)
      const pcs = piecesFromCarats(5, mesh11);
      expect(caratsFromPieces(pcs, mesh11)).toBe(5);
    });
  });
});
