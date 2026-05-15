/**
 * Unit tests for buildForeignDetails — the pure helper that
 * normalises + validates the foreign-vendor JSON blob written
 * to `vendor.gstDetails.foreignDetails`.
 *
 * These tests do not touch the database; they exercise the
 * regex / normalisation / strip-empty behaviour in isolation
 * so we catch regressions in the validation surface.
 */

import { buildForeignDetails } from '../../src/routes/vendors.routes';

describe('buildForeignDetails', () => {
  describe('null / empty handling', () => {
    it.each([null, undefined, 0, '', false, 'string'])(
      'returns null for non-object input: %p',
      (input) => {
        expect(buildForeignDetails(input as any)).toBeNull();
      },
    );

    it('returns null when every field is blank or whitespace', () => {
      expect(
        buildForeignDetails({
          taxId: '',
          swift: '   ',
          iban: null,
          currency: undefined,
        }),
      ).toBeNull();
    });

    it('strips empty / whitespace fields from the output blob', () => {
      const out = buildForeignDetails({
        taxId: 'TRN-12345',
        bankName: '   ',
        beneficiaryName: '',
        currency: 'USD',
      });
      expect(out).toEqual({ taxId: 'TRN-12345', currency: 'USD' });
      expect(out).not.toHaveProperty('bankName');
      expect(out).not.toHaveProperty('beneficiaryName');
    });
  });

  describe('case normalisation', () => {
    it('uppercases SWIFT, IBAN, currency, and incoterms', () => {
      const out = buildForeignDetails({
        swift: 'emiraedaxxx',
        iban: 'ae070331234567890123456',
        currency: 'aed',
        incoterms: 'fob',
      });
      expect(out).toMatchObject({
        swift: 'EMIRAEDAXXX',
        iban: 'AE070331234567890123456',
        currency: 'AED',
        incoterms: 'FOB',
      });
    });

    it('trims whitespace on string fields', () => {
      const out = buildForeignDetails({
        taxId: '  TRN-12345  ',
        bankName: '\tEmirates NBD\n',
      });
      expect(out).toMatchObject({
        taxId: 'TRN-12345',
        bankName: 'Emirates NBD',
      });
    });
  });

  describe('validation throws', () => {
    it('throws on invalid SWIFT/BIC', () => {
      expect(() => buildForeignDetails({ swift: 'BAD' })).toThrow(/SWIFT/);
    });

    it('throws on invalid IBAN', () => {
      expect(() => buildForeignDetails({ iban: '!!!' })).toThrow(/IBAN/);
    });

    it('throws on non 3-letter currency', () => {
      expect(() => buildForeignDetails({ currency: 'DOLLARS' })).toThrow(/Currency/);
    });

    it('throws on unknown Incoterms', () => {
      expect(() => buildForeignDetails({ incoterms: 'XYZ' })).toThrow(/Incoterms/);
    });

    it('throws on malformed HS code', () => {
      expect(() => buildForeignDetails({ defaultHsCode: 'abc' })).toThrow(/HS code/);
      expect(() => buildForeignDetails({ defaultHsCode: '12' })).toThrow(/HS code/);
    });
  });

  describe('boolean coercion', () => {
    it('keeps real booleans', () => {
      const out = buildForeignDetails({
        taxId: 'X',
        conflictFreeDeclared: true,
        letterOfCreditRequired: false,
      });
      expect(out).toMatchObject({
        conflictFreeDeclared: true,
        letterOfCreditRequired: false,
      });
    });

    it('drops non-boolean truthy / falsy values for boolean fields', () => {
      const out = buildForeignDetails({
        taxId: 'X',
        conflictFreeDeclared: 'yes',
        letterOfCreditRequired: 1,
      });
      expect(out).not.toHaveProperty('conflictFreeDeclared');
      expect(out).not.toHaveProperty('letterOfCreditRequired');
    });
  });

  describe('happy path: full UAE vendor', () => {
    it('returns a clean validated blob', () => {
      const out = buildForeignDetails({
        taxId: '100123456789003',
        taxIdLabel: 'TRN',
        companyRegNo: 'DED-543210',
        bankName: 'Emirates NBD',
        bankAddress: 'Baniyas Road, Deira, Dubai',
        swift: 'EBILAEAD',
        iban: 'AE070331234567890123456',
        accountNumber: '0123456789',
        beneficiaryName: 'Acme Diamonds LLC',
        currency: 'AED',
        incoterms: 'CIF',
        defaultHsCode: '710231',
        countryOfOrigin: 'UAE',
        city: 'Dubai',
        postalCode: '00000',
        kpcNumber: 'KPC-AE-2024-001',
        conflictFreeDeclared: true,
        paymentTerms: '30 days from BL',
        letterOfCreditRequired: false,
      });

      expect(out).toMatchObject({
        taxId: '100123456789003',
        taxIdLabel: 'TRN',
        swift: 'EBILAEAD',
        iban: 'AE070331234567890123456',
        currency: 'AED',
        incoterms: 'CIF',
        defaultHsCode: '710231',
        kpcNumber: 'KPC-AE-2024-001',
        conflictFreeDeclared: true,
        letterOfCreditRequired: false,
      });
    });
  });
});
