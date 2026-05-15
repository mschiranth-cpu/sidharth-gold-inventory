/**
 * Unit tests for the vendor credit-period helpers.
 *
 * These tests are pure (no DB, no Prisma client) — they pin the
 * resolution precedence used by every PURCHASE flow:
 *   - explicit override > vendor.paymentDueDays > foreign "NET N" > 0
 * and exercise the date-math edge cases used by computeDueDate.
 */

import { resolveVendorDueDays, computeDueDate } from '../../src/utils/credit';

describe('resolveVendorDueDays', () => {
  it('returns 0 for null / undefined vendor', () => {
    expect(resolveVendorDueDays(null)).toBe(0);
    expect(resolveVendorDueDays(undefined)).toBe(0);
  });

  it('returns 0 when no fields are set', () => {
    expect(resolveVendorDueDays({})).toBe(0);
  });

  it('uses explicit paymentDueDays when present and valid', () => {
    expect(resolveVendorDueDays({ paymentDueDays: 30 })).toBe(30);
    expect(resolveVendorDueDays({ paymentDueDays: 0 })).toBe(0);
    expect(resolveVendorDueDays({ paymentDueDays: 365 })).toBe(365);
  });

  it('floors fractional paymentDueDays', () => {
    expect(resolveVendorDueDays({ paymentDueDays: 30.7 })).toBe(30);
  });

  it('ignores negative or NaN paymentDueDays', () => {
    expect(resolveVendorDueDays({ paymentDueDays: -5 })).toBe(0);
    expect(resolveVendorDueDays({ paymentDueDays: NaN })).toBe(0);
  });

  describe('foreign vendor "NET N" fallback', () => {
    it('parses "NET 30" → 30', () => {
      expect(
        resolveVendorDueDays({
          paymentDueDays: null,
          gstDetails: { foreignDetails: { paymentTerms: 'NET 30' } },
        })
      ).toBe(30);
    });

    it('parses lowercase / extra whitespace', () => {
      expect(
        resolveVendorDueDays({
          gstDetails: { foreignDetails: { paymentTerms: 'net  60' } },
        })
      ).toBe(60);
    });

    it('returns 0 for unparseable terms', () => {
      expect(
        resolveVendorDueDays({
          gstDetails: { foreignDetails: { paymentTerms: 'on receipt' } },
        })
      ).toBe(0);
    });

    it('paymentDueDays takes precedence over foreign terms', () => {
      expect(
        resolveVendorDueDays({
          paymentDueDays: 15,
          gstDetails: { foreignDetails: { paymentTerms: 'NET 90' } },
        })
      ).toBe(15);
    });

    it('survives malformed gstDetails', () => {
      expect(resolveVendorDueDays({ gstDetails: 'not-an-object' })).toBe(0);
      expect(resolveVendorDueDays({ gstDetails: [] })).toBe(0);
      expect(resolveVendorDueDays({ gstDetails: { foreignDetails: 'oops' } })).toBe(0);
    });
  });
});

describe('computeDueDate', () => {
  // 2026-05-15 in UTC — a Friday — used as the canonical base date so the
  // expected outputs are stable across time zones (compared via getTime()).
  const base = new Date('2026-05-15T00:00:00.000Z');

  it('adds vendor.paymentDueDays to the transaction date', () => {
    const result = computeDueDate(base, { paymentDueDays: 30 });
    const expected = new Date(base.getTime());
    expected.setDate(expected.getDate() + 30);
    expect(result.getTime()).toBe(expected.getTime());
  });

  it('returns the transaction date when vendor has no credit terms', () => {
    const result = computeDueDate(base, { paymentDueDays: 0 });
    expect(result.getTime()).toBe(base.getTime());
  });

  it('treats null vendor as 0 days (due on receipt)', () => {
    const result = computeDueDate(base, null);
    expect(result.getTime()).toBe(base.getTime());
  });

  it('explicit override takes precedence over vendor default', () => {
    const override = new Date('2026-12-31T00:00:00.000Z');
    const result = computeDueDate(base, { paymentDueDays: 30 }, override);
    expect(result.getTime()).toBe(override.getTime());
  });

  it('accepts string override (ISO format)', () => {
    const result = computeDueDate(base, { paymentDueDays: 30 }, '2026-06-01');
    expect(result.toISOString().slice(0, 10)).toBe('2026-06-01');
  });

  it('ignores empty-string override and falls back to vendor default', () => {
    const result = computeDueDate(base, { paymentDueDays: 7 }, '');
    const expected = new Date(base.getTime());
    expected.setDate(expected.getDate() + 7);
    expect(result.getTime()).toBe(expected.getTime());
  });

  it('ignores invalid override (NaN date) and falls back', () => {
    const result = computeDueDate(base, { paymentDueDays: 14 }, 'not-a-date');
    const expected = new Date(base.getTime());
    expected.setDate(expected.getDate() + 14);
    expect(result.getTime()).toBe(expected.getTime());
  });

  it('handles month rollovers correctly', () => {
    // Jan 20 + 30 days = Feb 19
    const jan20 = new Date('2026-01-20T00:00:00.000Z');
    const result = computeDueDate(jan20, { paymentDueDays: 30 });
    expect(result.toISOString().slice(0, 10)).toBe('2026-02-19');
  });

  it('handles year rollovers correctly', () => {
    const dec20 = new Date('2026-12-20T00:00:00.000Z');
    const result = computeDueDate(dec20, { paymentDueDays: 30 });
    expect(result.toISOString().slice(0, 10)).toBe('2027-01-19');
  });

  it('falls back to "now" when transactionDate is invalid', () => {
    const result = computeDueDate('not-a-date' as any, { paymentDueDays: 0 });
    // Should be roughly "now" — sanity check that it's a valid Date.
    expect(Number.isNaN(result.getTime())).toBe(false);
  });

  it('does not mutate the input transaction date', () => {
    const input = new Date(base.getTime());
    const before = input.getTime();
    computeDueDate(input, { paymentDueDays: 30 });
    expect(input.getTime()).toBe(before);
  });

  it('parses string transaction date', () => {
    const result = computeDueDate('2026-05-15T00:00:00.000Z', { paymentDueDays: 10 });
    expect(result.toISOString().slice(0, 10)).toBe('2026-05-25');
  });

  it('uses foreign-vendor NET terms when paymentDueDays missing', () => {
    const result = computeDueDate(base, {
      gstDetails: { foreignDetails: { paymentTerms: 'NET 45' } },
    });
    const expected = new Date(base.getTime());
    expected.setDate(expected.getDate() + 45);
    expect(result.getTime()).toBe(expected.getTime());
  });
});
