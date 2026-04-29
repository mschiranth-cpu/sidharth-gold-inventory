/**
 * Shared Add/Edit Vendor modal.
 *
 * Two modes:
 *  - Default (GST mode): GSTIN at top → debounced live fetch → all fields auto-
 *    populated read-only below; only Name + Phone are user-editable.
 *  - "No GST" mode: hide GSTIN; all structural fields become manually editable.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Vendor,
  VendorInput,
  GstDetails,
  ManualVendorDetails,
  VendorDealsCategory,
  VENDOR_DEALS_CATEGORIES,
  VENDOR_DEALS_LABELS,
  ForeignVendorDetails,
  CURRENCY_BY_COUNTRY,
  TAX_ID_LABEL_BY_COUNTRY,
  INCOTERMS_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
  HS_CODE_BY_DEALS,
  createVendor,
  updateVendor,
  lookupGstin,
  getNextVendorCode,
} from '../services/vendor.service';
import Button from './common/Button';
import PhoneInput, { validatePhone } from './common/PhoneInput';
import { isLiveSource, sourceLabel, statusBadgeClass, formatGstDate } from './GstInfoCard';
import {
  CubeIcon,
  CubeTransparentIcon,
  SparklesIcon,
  ArchiveBoxIcon,
  GlobeAltIcon,
  BuildingLibraryIcon,
  TruckIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

/**
 * Display metadata for the 4 supply-category checkbox cards. Order is
 * deliberate: matches the order of the Receive… pages in the sidebar.
 */
const DEALS_CATEGORY_META: Record<
  VendorDealsCategory,
  { Icon: typeof CubeIcon; tint: string; ring: string }
> = {
  METAL: {
    Icon: CubeIcon,
    tint: 'bg-amber-50 text-amber-700 border-amber-200',
    ring: 'ring-amber-300 bg-amber-100',
  },
  DIAMOND: {
    Icon: CubeTransparentIcon,
    tint: 'bg-sky-50 text-sky-700 border-sky-200',
    ring: 'ring-sky-300 bg-sky-100',
  },
  REAL_STONE: {
    Icon: SparklesIcon,
    tint: 'bg-violet-50 text-violet-700 border-violet-200',
    ring: 'ring-violet-300 bg-violet-100',
  },
  STONE_PACKET: {
    Icon: ArchiveBoxIcon,
    tint: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ring: 'ring-emerald-300 bg-emerald-100',
  },
};

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const PINCODE_REGEX = /^[0-9]{6}$/;
// Practical email regex — catches the common typos without rejecting valid
// addresses with +tags or sub-domains.
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/**
 * Country options surfaced in the vendor form. India sits on top because
 * ≥ 99% of vendors are local; the rest are common precious-stone hubs.
 * Anything outside this list can be typed via the free-text fallback.
 */
const COUNTRY_OPTIONS = [
  'India',
  'United Arab Emirates',
  'Singapore',
  'Hong Kong',
  'Thailand',
  'United Kingdom',
  'United States',
  'Belgium',
  'Switzerland',
  'Sri Lanka',
  'Other',
];

const STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
  '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur',
  '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
  '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '25': 'Daman and Diu', '26': 'Dadra and Nagar Haveli', '27': 'Maharashtra', '28': 'Andhra Pradesh',
  '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu',
  '34': 'Puducherry', '35': 'Andaman and Nicobar Islands', '36': 'Telangana', '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh',
};

interface VendorFormModalProps {
  vendor: Vendor | null;
  onClose: () => void;
  onSaved: (vendor: Vendor) => void;
}

export default function VendorFormModal({ vendor, onClose, onSaved }: VendorFormModalProps) {
  // Existing vendor with no gstNumber → start in No-GST mode
  const initialNoGst = !!vendor && !vendor.gstNumber;
  const [noGst, setNoGst] = useState<boolean>(initialNoGst);

  const [form, setForm] = useState<VendorInput>({
    name: vendor?.name ?? '',
    phone: vendor?.phone ?? '',
    email: vendor?.email ?? vendor?.gstDetails?.email ?? '',
    country:
      vendor?.country ??
      vendor?.gstDetails?.country ??
      // Default to India for new vendors. GSTIN-bearing vendors are India-
      // only by definition; for No-GST vendors India is still the 99% case
      // and the user can switch to another country if needed.
      'India',
    gstNumber: vendor?.gstNumber ?? '',
    address: vendor?.address ?? '',
    // New vendors default to all 4 supply categories pre-checked (matches
    // server POST default and the migration backfill). Existing vendors
    // come from `vendor.dealsIn`; if the API didn't return it (legacy
    // shape) we fall back to all-4 so they don't accidentally get archived.
    dealsIn: vendor
      ? (vendor.dealsIn && vendor.dealsIn.length > 0
        ? [...vendor.dealsIn]
        : (vendor.dealsIn === undefined ? [...VENDOR_DEALS_CATEGORIES] : []))
      : [...VENDOR_DEALS_CATEGORIES],
  });
  const [previewCode, setPreviewCode] = useState<string>(vendor?.uniqueCode ?? '…');

  // Manual fields (used in noGst mode). Pre-fill from existing gstDetails.
  const [manual, setManual] = useState<ManualVendorDetails>({
    legalName: vendor?.gstDetails?.legalName ?? '',
    tradeName: vendor?.gstDetails?.tradeName ?? '',
    state: vendor?.gstDetails?.state ?? '',
    stateCode: vendor?.gstDetails?.stateCode ?? '',
    pan: vendor?.gstDetails?.pan ?? '',
    city: vendor?.gstDetails?.city ?? '',
    pincode: vendor?.gstDetails?.pincode ?? '',
  });

  // Foreign vendor details — only relevant when country !== India. Stashed on
  // the gstDetails JSON blob server-side; pre-fill from the existing vendor.
  const initialForeign: ForeignVendorDetails = vendor?.gstDetails?.foreignDetails ?? {};
  const [foreign, setForeign] = useState<ForeignVendorDetails>(initialForeign);
  // Track whether the user has manually edited the currency or HS code so we
  // don't keep stomping their value on every dealsIn / country change.
  const currencyTouched = useRef<boolean>(!!initialForeign.currency);
  const hsCodeTouched = useRef<boolean>(!!initialForeign.defaultHsCode);
  const taxLabelTouched = useRef<boolean>(!!initialForeign.taxIdLabel);
  // Whether the optional Export details accordion is expanded. Auto-opens
  // for foreign vendors so the user sees the new fields immediately.
  const [foreignExpanded, setForeignExpanded] = useState<boolean>(
    !!initialForeign.taxId || !!initialForeign.bankName || !!initialForeign.swift,
  );

  useEffect(() => {
    if (vendor) return;
    let cancelled = false;
    getNextVendorCode()
      .then((c) => { if (!cancelled) setPreviewCode(c); })
      .catch(() => { if (!cancelled) setPreviewCode('VEN-001'); });
    return () => { cancelled = true; };
  }, [vendor]);

  const [gstDetails, setGstDetails] = useState<GstDetails | null>(vendor?.gstDetails ?? null);
  const [gstStatus, setGstStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [gstError, setGstError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  // "Archive" intent — when true, the next save submits `dealsIn: []`
  // (vendor stays in DB + transaction history but disappears from every
  // Receive-form dropdown). Bypasses the ≥1-category UI validation.
  // Reset on every form interaction except the dedicated Archive button.
  const [archiveIntent, setArchiveIntent] = useState(false);
  // Snapshot of name pre-auto-fill so the user can revert.
  const autoFillSnapshot = useRef<{ name: string; address: string } | null>(null);
  const autoFilledValues = useRef<{ name: string; address: string } | null>(null);

  const gstinUpper = (form.gstNumber || '').toUpperCase().trim();
  const gstinValid = useMemo(() => GSTIN_REGEX.test(gstinUpper), [gstinUpper]);

  // Debounced GST auto-fetch (only when not in No-GST mode).
  useEffect(() => {
    if (noGst) return;
    if (!gstinValid) {
      if (gstinUpper.length === 0) {
        setGstStatus('idle'); setGstError(null); setGstDetails(null);
        autoFillSnapshot.current = null; autoFilledValues.current = null;
      } else {
        setGstStatus('idle');
      }
      return;
    }
    let cancelled = false;
    setGstStatus('loading');
    setGstError(null);
    const t = window.setTimeout(async () => {
      try {
        const d = await lookupGstin(gstinUpper);
        if (cancelled) return;
        setGstDetails(d);
        setGstStatus('ok');
        // Auto-fill Name + Address if blank (user can override).
        setForm((f) => {
          const gstName = d.legalName || d.tradeName || '';
          const willFillName = !f.name?.trim() && !!gstName;
          const willFillAddr = !f.address?.trim() && !!d.address;
          if (willFillName || willFillAddr) {
            autoFillSnapshot.current = { name: f.name || '', address: f.address || '' };
          }
          const nextName = willFillName ? gstName : f.name;
          const nextAddr = willFillAddr ? d.address || '' : f.address;
          if (willFillName || willFillAddr) {
            autoFilledValues.current = { name: nextName, address: nextAddr || '' };
          }
          return { ...f, name: nextName, address: nextAddr };
        });
      } catch (e: any) {
        if (cancelled) return;
        setGstStatus('error');
        setGstError(e?.response?.data?.error || e?.message || 'Lookup failed');
      }
    }, 500);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [gstinUpper, gstinValid, noGst]);

  const useGstDetails = () => {
    if (!gstDetails) return;
    if (!autoFillSnapshot.current) {
      autoFillSnapshot.current = { name: form.name || '', address: form.address || '' };
    }
    const gstName = gstDetails.legalName || gstDetails.tradeName || '';
    const nextName = gstName || form.name;
    const nextAddr = gstDetails.address || form.address;
    autoFilledValues.current = { name: nextName, address: nextAddr || '' };
    setForm((f) => ({ ...f, name: nextName, address: nextAddr }));
  };

  const revertAutoFill = () => {
    const snap = autoFillSnapshot.current;
    if (!snap) return;
    setForm((f) => ({ ...f, name: snap.name, address: snap.address }));
    autoFillSnapshot.current = null;
    autoFilledValues.current = null;
  };

  const onNameChange = (v: string) => {
    setForm((f) => ({ ...f, name: v }));
    const af = autoFilledValues.current;
    if (af && v !== af.name) { autoFillSnapshot.current = null; autoFilledValues.current = null; }
  };
  const onAddressChange = (v: string) => {
    setForm((f) => ({ ...f, address: v }));
    const af = autoFilledValues.current;
    if (af && v !== af.address) { autoFillSnapshot.current = null; autoFilledValues.current = null; }
  };

  const onStateCodeChange = (code: string) => {
    setManual((m) => ({ ...m, stateCode: code, state: STATE_CODES[code] || m.state || '' }));
  };

  const toggleNoGst = (checked: boolean) => {
    setNoGst(checked);
    if (checked) {
      setForm((f) => ({ ...f, gstNumber: '' }));
      setGstDetails(null);
      setGstStatus('idle');
      setGstError(null);
      autoFillSnapshot.current = null;
      autoFilledValues.current = null;
    }
  };

  const panUpper = (manual.pan || '').toUpperCase().trim();
  const panValid = panUpper.length === 0 || PAN_REGEX.test(panUpper);
  const pincodeValid = !manual.pincode || PINCODE_REGEX.test(manual.pincode);
  const emailTrim = (form.email || '').trim();
  const emailValid = emailTrim.length === 0 || EMAIL_REGEX.test(emailTrim);

  // GSTIN is India-only by definition (state codes 01–38 are all Indian
  // states). The moment a valid GSTIN is entered we lock Country to India
  // so users can’t introduce a contradictory value downstream.
  useEffect(() => {
    if (!noGst && gstinValid && form.country !== 'India') {
      setForm((f) => ({ ...f, country: 'India' }));
    }
  }, [noGst, gstinValid]); // eslint-disable-line react-hooks/exhaustive-deps

  // True when the vendor is international: drives the Export / International
  // Details section, hides Indian-only manual fields, and makes the GSTIN
  // input irrelevant. Also forces No-GST so server-side validation is happy.
  const isForeign = useMemo(() => {
    const c = (form.country || '').trim();
    return c.length > 0 && c !== 'India';
  }, [form.country]);

  // When user picks a non-India country, force No-GST mode (clears GSTIN)
  // and auto-open the Export accordion. When they switch back to India, we
  // leave the foreign blob in state so toggling back/forward is non-destructive
  // until they save.
  useEffect(() => {
    if (isForeign) {
      if (!noGst) {
        setNoGst(true);
        setForm((f) => ({ ...f, gstNumber: '' }));
        setGstDetails(null);
        setGstStatus('idle');
        setGstError(null);
      }
      setForeignExpanded(true);
    }
  }, [isForeign]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-default currency + Tax-ID label when the user picks a country, but
  // only if they haven't already overridden them (currencyTouched / labelTouched).
  // We additionally track the LAST auto-applied value per field so that when
  // the user switches between two foreign countries (e.g. UAE → USA) and the
  // current field value still matches the previous country's auto-default,
  // we transparently update it to the new country's default. Manual edits
  // are preserved because `currencyTouched=true` blocks the auto-update path.
  const lastAutoCurrency = useRef<string | undefined>(undefined);
  const lastAutoTaxLabel = useRef<string | undefined>(undefined);
  const lastAutoOriginCountry = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!isForeign) return;
    const c = form.country || '';
    setForeign((fd) => {
      const next = { ...fd };
      // Currency: auto-update if untouched OR if the live value still equals
      // the previous auto-applied value (i.e. the user never changed it).
      const cur = CURRENCY_BY_COUNTRY[c];
      if (cur && (!currencyTouched.current || fd.currency === lastAutoCurrency.current)) {
        next.currency = cur;
        lastAutoCurrency.current = cur;
      }
      const lbl = TAX_ID_LABEL_BY_COUNTRY[c];
      if (lbl && (!taxLabelTouched.current || fd.taxIdLabel === lastAutoTaxLabel.current)) {
        next.taxIdLabel = lbl;
        lastAutoTaxLabel.current = lbl;
      }
      // Country-of-origin: blank → fill; matches previous country → update.
      if (!next.countryOfOrigin || next.countryOfOrigin === lastAutoOriginCountry.current) {
        next.countryOfOrigin = c;
        lastAutoOriginCountry.current = c;
      }
      return next;
    });
  }, [isForeign, form.country]);

  // Auto-suggest HS code from supply categories — first matched category wins.
  useEffect(() => {
    if (!isForeign || hsCodeTouched.current) return;
    const cats = form.dealsIn ?? [];
    const first = cats.find((c) => HS_CODE_BY_DEALS[c]);
    if (first) {
      setForeign((fd) => ({ ...fd, defaultHsCode: HS_CODE_BY_DEALS[first].code }));
    }
  }, [isForeign, form.dealsIn]);

  // KPC (Kimberley Process Certificate) is required when the vendor supplies
  // diamonds or stone packets — used to certify conflict-free origin on
  // import. We only enforce it for foreign vendors.
  const requiresKpc = isForeign && (form.dealsIn ?? []).some(
    (c) => c === 'DIAMOND' || c === 'STONE_PACKET',
  );

  // Field-level error map; computed every render so it stays in sync.
  const dealsInValue = form.dealsIn ?? [];
  const errors: Record<string, string | undefined> = {
    name: !form.name.trim() ? 'Vendor name is required' : undefined,
    phone: validatePhone(form.phone) || undefined,
    email: !emailValid ? 'Enter a valid email (e.g. name@company.com)' : undefined,
    gstin:
      !noGst && gstinUpper.length > 0 && !gstinValid
        ? 'Enter a valid 15-character GSTIN (or tick “Vendor does not have GST”)'
        : undefined,
    pan: noGst && !isForeign && !panValid ? 'PAN must look like AAAAA9999A' : undefined,
    pincode: noGst && !isForeign && !pincodeValid ? 'Pincode must be 6 digits' : undefined,
    dealsIn:
      // Archive intent intentionally clears all categories — skip the
      // ≥1 rule when the user explicitly chose to archive.
      !archiveIntent && dealsInValue.length === 0
        ? 'Pick at least one supply category (or this vendor will not appear in any Receive form)'
        : undefined,
    // Foreign-vendor validations: only enforced when country !== India so
    // domestic flows are unchanged. Required fields are the bare minimum
    // needed to remit a wire payment + clear customs.
    foreignTaxId:
      isForeign && !(foreign.taxId || '').trim()
        ? `${foreign.taxIdLabel || 'Tax ID'} is required for international vendors`
        : undefined,
    foreignBankName:
      isForeign && !(foreign.bankName || '').trim()
        ? 'Bank Name is required for international vendors'
        : undefined,
    foreignSwift:
      isForeign && !(foreign.swift || '').trim()
        ? 'SWIFT/BIC is required for international wire transfers'
        : isForeign && foreign.swift && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/i.test(foreign.swift)
        ? 'SWIFT/BIC must be 8 or 11 chars (e.g. CHASUS33XXX)'
        : undefined,
    foreignIban:
      isForeign && foreign.iban && !/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/i.test(foreign.iban)
        ? 'IBAN should start with 2-letter country + 2 digits (e.g. GB29NWBK60161331926819)'
        : undefined,
    foreignCurrency:
      isForeign && !(foreign.currency || '').trim()
        ? 'Currency is required (e.g. USD, EUR, AED)'
        : undefined,
    foreignBeneficiary:
      isForeign && !(foreign.beneficiaryName || '').trim()
        ? 'Beneficiary Name is required for wire transfers'
        : undefined,
    foreignKpc:
      requiresKpc && !(foreign.kpcNumber || '').trim()
        ? 'Kimberley Process Certificate # is required when importing diamonds / stone packets'
        : undefined,
    foreignHsCode:
      isForeign && foreign.defaultHsCode && !/^\d{4,10}$/.test(foreign.defaultHsCode)
        ? 'HS code must be 4–10 digits'
        : undefined,
  };
  const errorList = Object.entries(errors).filter(([, v]) => !!v) as [string, string][];
  const showErr = (k: string) => (touched[k] || showAllErrors) && !!errors[k];

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload: VendorInput = {
        name: form.name.trim(),
        phone: form.phone?.trim() || undefined,
        email: emailTrim || undefined,
        country: (form.country || '').trim() || undefined,
        gstNumber: noGst ? undefined : (gstinUpper || undefined),
        address: form.address?.trim() || undefined,
        // Archive intent forces empty array regardless of any leftover
        // checkbox state — single source of truth for the soft-archive
        // path so it can never silently revert.
        dealsIn: archiveIntent ? [] : dealsInValue,
      };
      if (noGst && !isForeign) {
        const m: ManualVendorDetails = {
          legalName: manual.legalName?.trim() || undefined,
          tradeName: manual.tradeName?.trim() || undefined,
          state: manual.state?.trim() || undefined,
          stateCode: manual.stateCode?.trim() || undefined,
          pan: panUpper || undefined,
          city: manual.city?.trim() || undefined,
          pincode: manual.pincode?.trim() || undefined,
        };
        payload.manualDetails = m;
      }
      // Foreign vendor: ship the sanitized blob; pass null to clear when the
      // user switched the country back to India on an existing foreign vendor.
      if (isForeign) {
        payload.foreignDetails = {
          taxId: foreign.taxId?.trim() || undefined,
          taxIdLabel: foreign.taxIdLabel?.trim() || undefined,
          companyRegNo: foreign.companyRegNo?.trim() || undefined,
          bankName: foreign.bankName?.trim() || undefined,
          bankAddress: foreign.bankAddress?.trim() || undefined,
          swift: foreign.swift?.toUpperCase().trim() || undefined,
          iban: foreign.iban?.toUpperCase().trim() || undefined,
          accountNumber: foreign.accountNumber?.trim() || undefined,
          routingCode: foreign.routingCode?.trim() || undefined,
          beneficiaryName: foreign.beneficiaryName?.trim() || undefined,
          intermediaryBank: foreign.intermediaryBank?.trim() || undefined,
          currency: foreign.currency?.toUpperCase().trim() || undefined,
          incoterms: foreign.incoterms?.toUpperCase().trim() || undefined,
          defaultHsCode: foreign.defaultHsCode?.trim() || undefined,
          countryOfOrigin: foreign.countryOfOrigin?.trim() || undefined,
          city: foreign.city?.trim() || undefined,
          state: foreign.state?.trim() || undefined,
          postalCode: foreign.postalCode?.trim() || undefined,
          kpcNumber: foreign.kpcNumber?.trim() || undefined,
          conflictFreeDeclared: foreign.conflictFreeDeclared || undefined,
          paymentTerms: foreign.paymentTerms?.trim() || undefined,
          letterOfCreditRequired: foreign.letterOfCreditRequired || undefined,
        };
      } else if (vendor?.gstDetails?.foreignDetails) {
        // Existing foreign blob but user switched back to India → clear it.
        payload.foreignDetails = null;
      }
      if (vendor) return updateVendor(vendor.id, payload);
      return createVendor(payload);
    },
    onSuccess: (saved) => onSaved(saved),
    onError: (e: any) => setSubmitError(e?.response?.data?.error || 'Save failed'),
  });

  const isValid = errorList.length === 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {vendor ? 'Edit Vendor' : 'Add Vendor'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitError(null);
            if (!isValid) {
              setShowAllErrors(true);
              // Focus the first invalid field for accessibility.
              const first = errorList[0]?.[0];
              const el =
                first
                  ? (document.querySelector(`[data-field="${first}"]`) as HTMLElement | null)
                  : null;
              el?.focus();
              return;
            }
            saveMut.mutate();
          }}
          className="p-6 space-y-4"
        >
          {/* No GST toggle — hidden for international vendors (irrelevant) */}
          {!isForeign && (
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={noGst}
                onChange={(e) => toggleNoGst(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-champagne-700 focus:ring-champagne-600"
              />
              <span className="text-sm font-medium text-gray-800">
                Vendor does not have GST
              </span>
              <span className="ml-auto text-[11px] text-gray-500">
                {noGst ? 'Enter all details manually' : 'GSTIN auto-fetches everything'}
              </span>
            </label>
          )}

          {/* Foreign vendor banner — visible whenever country !== India */}
          {isForeign && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200">
              <GlobeAltIcon className="w-6 h-6 text-sky-700 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-sky-900">
                  International vendor — GSTIN not applicable
                </p>
                <p className="text-xs text-sky-800 mt-0.5">
                  Fill the <strong>Export / International Details</strong> section below for banking,
                  customs, and compliance fields needed for cross-border purchases.
                </p>
              </div>
            </div>
          )}

          {/* GST mode — hidden for international vendors */}
          {!noGst && !isForeign && (
            <Field label="GSTIN *" hint="15-character GST number — fields below auto-populate" error={showErr('gstin') ? errors.gstin : undefined}>
              <div className="relative">
                <input
                  data-field="gstin"
                  value={form.gstNumber}
                  onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })}
                  onBlur={() => setTouched((t) => ({ ...t, gstin: true }))}
                  maxLength={15}
                  className={`w-full px-4 py-2.5 pr-32 rounded-lg border font-mono uppercase text-sm focus:ring-2 focus:border-transparent ${
                    gstinUpper.length === 0 ? 'border-gray-300 focus:ring-champagne-600'
                      : gstinValid ? 'border-emerald-400 focus:ring-emerald-500'
                      : 'border-red-400 focus:ring-red-500'
                  }`}
                  placeholder="29AABCU9603R1ZX"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">
                  {gstStatus === 'loading' && (
                    <span className="text-champagne-700 flex items-center gap-1">
                      <span className="inline-block w-3 h-3 border-2 border-champagne-600 border-t-transparent rounded-full animate-spin" />
                      Fetching…
                    </span>
                  )}
                  {gstStatus === 'ok' && gstDetails && isLiveSource(gstDetails.source) && (
                    <span className="text-emerald-600 font-semibold">✓ Live verified</span>
                  )}
                  {gstStatus === 'ok' && gstDetails && !isLiveSource(gstDetails.source) && (
                    <span className="text-slate-500 font-semibold">Format valid</span>
                  )}
                  {gstStatus === 'error' && <span className="text-red-600 font-semibold">✗ Failed</span>}
                  {gstStatus === 'idle' && gstinUpper.length > 0 && !gstinValid && (
                    <span className="text-red-500">Invalid format</span>
                  )}
                </div>
              </div>
              {gstError && <p className="mt-1 text-xs text-red-600">{gstError}</p>}

              {gstStatus === 'loading' && !gstDetails && gstinValid && (
                <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="h-3 w-1/3 bg-slate-200 rounded animate-pulse" />
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-3 bg-slate-200 rounded animate-pulse" />
                    ))}
                  </div>
                </div>
              )}

              {gstDetails && gstStatus !== 'error' && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm overflow-hidden">
                  <div className="px-4 py-2 bg-white/60 border-b border-emerald-100 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">
                      Auto-populated from GST
                    </span>
                    {gstDetails.status && (
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadgeClass(gstDetails.status)}`}>
                        {gstDetails.status}
                      </span>
                    )}
                    <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-champagne-50 text-champagne-800 border border-champagne-200">
                      {isLiveSource(gstDetails.source) && <span>✓</span>}
                      {sourceLabel(gstDetails.source)}
                    </span>
                  </div>

                  {gstDetails.notice && (
                    <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-800">
                      ⚠ {gstDetails.notice}
                    </div>
                  )}

                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                    <ReadOnly label="Legal Name" value={gstDetails.legalName} />
                    <ReadOnly label="Trade Name" value={gstDetails.tradeName} />
                    <ReadOnly
                      label="State"
                      value={gstDetails.state ? `${gstDetails.state}${gstDetails.stateCode ? ` (${gstDetails.stateCode})` : ''}` : null}
                    />
                    <ReadOnly label="PAN" value={gstDetails.pan} mono />
                    <ReadOnly label="City / District" value={gstDetails.city} />
                    <ReadOnly label="Pincode" value={gstDetails.pincode} mono />
                    {gstDetails.businessType && (
                      <ReadOnly label="Business Type" value={gstDetails.businessType} />
                    )}
                    {gstDetails.registrationDate && (
                      <ReadOnly label="Registered" value={formatGstDate(gstDetails.registrationDate)} />
                    )}
                  </div>
                </div>
              )}
            </Field>
          )}

          {/* Manual fields (No-GST mode, India only) */}
          {noGst && !isForeign && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500">
                Vendor Details (manual entry)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Legal Name">
                  <ManualInput value={manual.legalName} onChange={(v) => setManual((m) => ({ ...m, legalName: v }))} />
                </Field>
                <Field label="Trade Name">
                  <ManualInput value={manual.tradeName} onChange={(v) => setManual((m) => ({ ...m, tradeName: v }))} />
                </Field>
                <Field label="State">
                  <select
                    value={manual.stateCode || ''}
                    onChange={(e) => onStateCodeChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-champagne-600 focus:border-transparent bg-white text-sm"
                  >
                    <option value="">— Select State —</option>
                    {Object.entries(STATE_CODES).map(([code, name]) => (
                      <option key={code} value={code}>{name} ({code})</option>
                    ))}
                  </select>
                </Field>
                <Field label="PAN" error={showErr('pan') ? errors.pan : undefined}>
                  <input
                    data-field="pan"
                    value={manual.pan || ''}
                    onChange={(e) => setManual((m) => ({ ...m, pan: e.target.value.toUpperCase() }))}
                    onBlur={() => setTouched((t) => ({ ...t, pan: true }))}
                    maxLength={10}
                    placeholder="AAAAA9999A"
                    className={`w-full px-4 py-2.5 rounded-lg border font-mono uppercase text-sm focus:ring-2 focus:border-transparent ${
                      panValid ? 'border-gray-300 focus:ring-champagne-600' : 'border-red-400 focus:ring-red-500'
                    }`}
                  />
                </Field>
                <Field label="City / District">
                  <ManualInput value={manual.city} onChange={(v) => setManual((m) => ({ ...m, city: v }))} />
                </Field>
                <Field label="Pincode" error={showErr('pincode') ? errors.pincode : undefined}>
                  <input
                    data-field="pincode"
                    value={manual.pincode || ''}
                    onChange={(e) => setManual((m) => ({ ...m, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    onBlur={() => setTouched((t) => ({ ...t, pincode: true }))}
                    placeholder="560001"
                    className={`w-full px-4 py-2.5 rounded-lg border font-mono text-sm focus:ring-2 focus:border-transparent ${
                      pincodeValid ? 'border-gray-300 focus:ring-champagne-600' : 'border-red-400 focus:ring-red-500'
                    }`}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Always editable: Name + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Name *"
              hint={!noGst && gstDetails?.legalName && !showErr('name') ? 'Defaulted from GST — edit if needed' : undefined}
              error={showErr('name') ? errors.name : undefined}
            >
              <input
                data-field="name"
                value={form.name}
                onChange={(e) => onNameChange(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:border-transparent text-sm ${
                  showErr('name') ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-champagne-600'
                }`}
                placeholder="Vendor display name"
              />
            </Field>
            <Field
              label="Phone Number *"
              hint={!showErr('phone') ? 'Pick country, then enter digits only' : undefined}
              error={showErr('phone') ? errors.phone : undefined}
            >
              <PhoneInput
                dataField="phone"
                value={form.phone || ''}
                onChange={(v) => setForm({ ...form, phone: v })}
                onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                hasError={showErr('phone')}
              />
            </Field>
          </div>

          {/* Email + Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Email"
              hint={!showErr('email') ? 'Optional — used for invoice copies & alerts' : undefined}
              error={showErr('email') ? errors.email : undefined}
            >
              <input
                data-field="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                placeholder="vendor@company.com"
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:border-transparent text-sm ${
                  showErr('email')
                    ? 'border-red-400 focus:ring-red-500'
                    : emailTrim && emailValid
                    ? 'border-emerald-400 focus:ring-emerald-500'
                    : 'border-gray-300 focus:ring-champagne-600'
                }`}
              />
            </Field>
            <Field
              label="Country"
              hint={
                !noGst && gstinValid
                  ? 'Auto-set from GSTIN — Indian registration'
                  : isForeign
                  ? 'International vendor — Export details required below'
                  : 'Defaults to India — change for international vendors'
              }
            >
              <select
                data-field="country"
                value={form.country || ''}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                disabled={!noGst && gstinValid}
                aria-disabled={!noGst && gstinValid}
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:border-transparent text-sm bg-white ${
                  !noGst && gstinValid
                    ? 'border-emerald-300 bg-emerald-50/50 cursor-not-allowed'
                    : 'border-gray-300 focus:ring-champagne-600'
                }`}
              >
                <option value="">— Select Country —</option>
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Supply Categories — drives which Receive forms list this vendor */}
          <Field
            label="Supply Categories *"
            hint={
              dealsInValue.length === 0
                ? undefined
                : 'Vendor will appear only in the Receive forms ticked here'
            }
            error={showErr('dealsIn') ? errors.dealsIn : undefined}
          >
            <div
              role="group"
              aria-label="Supply categories"
              data-field="dealsIn"
              tabIndex={-1}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2 outline-none"
            >
              {VENDOR_DEALS_CATEGORIES.map((key) => {
                const meta = DEALS_CATEGORY_META[key];
                const checked = dealsInValue.includes(key);
                const Icon = meta.Icon;
                return (
                  <label
                    key={key}
                    className={`group relative flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-3 min-h-[80px] cursor-pointer select-none transition-all focus-within:ring-2 focus-within:ring-offset-1 ${
                      checked
                        ? `${meta.ring} border-current shadow-sm`
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={(e) => {
                        setTouched((t) => ({ ...t, dealsIn: true }));
                        setForm((f) => {
                          const cur = new Set(f.dealsIn ?? []);
                          if (e.target.checked) cur.add(key);
                          else cur.delete(key);
                          return { ...f, dealsIn: Array.from(cur) as VendorDealsCategory[] };
                        });
                      }}
                    />
                    <Icon
                      className={`w-6 h-6 ${
                        checked ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                      aria-hidden="true"
                    />
                    <span
                      className={`text-xs font-semibold ${
                        checked ? 'text-slate-900' : 'text-slate-600'
                      }`}
                    >
                      {VENDOR_DEALS_LABELS[key]}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                        checked
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-white border-slate-300 text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                  </label>
                );
              })}
            </div>
            {dealsInValue.length === 0 && (
              <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                ⚠ This vendor will <strong>not</strong> appear in any Receive form until at least
                one category is selected.
              </p>
            )}
          </Field>

          <Field
            label="Address"
            hint={!noGst && gstDetails?.address ? 'Defaulted from GST — edit if needed' : undefined}
          >
            <textarea
              value={form.address}
              onChange={(e) => onAddressChange(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-champagne-600 focus:border-transparent resize-none text-sm"
              placeholder="Street, City, State, PIN"
            />
          </Field>

          <Field label="Unique Code" hint={vendor ? 'Auto-generated and immutable' : 'Auto-generated on save'}>
            <input
              readOnly
              value={previewCode}
              tabIndex={-1}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-100 text-gray-700 font-mono cursor-not-allowed select-all text-sm"
            />
          </Field>

          {/* ----------------------------------------------------------------
              Export / International Details — only shown when country !== India.
              Collapsible to keep the modal lean for the 99% domestic case.
          ---------------------------------------------------------------- */}
          {isForeign && (
            <div className="rounded-xl border-2 border-sky-200 bg-gradient-to-br from-sky-50/50 to-white overflow-hidden">
              <button
                type="button"
                onClick={() => setForeignExpanded((v) => !v)}
                aria-expanded={foreignExpanded}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-sky-50/70 transition focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-inset min-h-[56px]"
              >
                <GlobeAltIcon className="w-5 h-5 text-sky-700 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-sky-900">
                    Export / International Details
                  </p>
                  <p className="text-[11px] text-sky-700">
                    Banking, customs, and compliance for cross-border purchases
                  </p>
                </div>
                <ChevronDownIcon
                  className={`w-5 h-5 text-sky-700 transition-transform ${
                    foreignExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {foreignExpanded && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Identity & Tax */}
                  <ForeignSection title="Identity & Tax" Icon={ShieldCheckIcon} accent="indigo">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field
                        label={`${foreign.taxIdLabel || 'Tax ID'} *`}
                        hint="Foreign tax registration (EIN / VAT / TRN / ABN). No format check."
                        error={showErr('foreignTaxId') ? errors.foreignTaxId : undefined}
                      >
                        <input
                          data-field="foreignTaxId"
                          value={foreign.taxId || ''}
                          onChange={(e) => setForeign((f) => ({ ...f, taxId: e.target.value }))}
                          onBlur={() => setTouched((t) => ({ ...t, foreignTaxId: true }))}
                          placeholder="e.g. 84-1234567 / GB123456789"
                          className={`w-full px-4 py-2.5 rounded-lg border font-mono text-sm focus:ring-2 focus:border-transparent ${
                            showErr('foreignTaxId')
                              ? 'border-red-400 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-sky-500'
                          }`}
                        />
                      </Field>
                      <Field label="Tax ID Label" hint="Auto-suggested from country — edit if needed">
                        <input
                          value={foreign.taxIdLabel || ''}
                          onChange={(e) => {
                            taxLabelTouched.current = true;
                            setForeign((f) => ({ ...f, taxIdLabel: e.target.value }));
                          }}
                          placeholder="EIN / VAT / TRN / ABN"
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                        />
                      </Field>
                      <Field label="Company Registration #" hint="Optional — corporate filing number">
                        <input
                          value={foreign.companyRegNo || ''}
                          onChange={(e) => setForeign((f) => ({ ...f, companyRegNo: e.target.value }))}
                          placeholder="e.g. 12345678 / KvK 1234567"
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                        />
                      </Field>
                    </div>

                    {/* International address detail */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                      <Field label="City">
                        <input
                          value={foreign.city || ''}
                          onChange={(e) => setForeign((f) => ({ ...f, city: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                        />
                      </Field>
                      <Field label="State / Province">
                        <input
                          value={foreign.state || ''}
                          onChange={(e) => setForeign((f) => ({ ...f, state: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                        />
                      </Field>
                      <Field label="Postal / ZIP Code">
                        <input
                          value={foreign.postalCode || ''}
                          onChange={(e) => setForeign((f) => ({ ...f, postalCode: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                        />
                      </Field>
                    </div>
                  </ForeignSection>

                  {/* Banking / Wire transfer */}
                  <ForeignSection title="Banking & Wire Transfer" Icon={BuildingLibraryIcon} accent="emerald">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field
                        label="Bank Name *"
                        error={showErr('foreignBankName') ? errors.foreignBankName : undefined}
                      >
                        <input
                          data-field="foreignBankName"
                          value={foreign.bankName || ''}
                          onChange={(e) => setForeign((f) => ({ ...f, bankName: e.target.value }))}
                          onBlur={() => setTouched((t) => ({ ...t, foreignBankName: true }))}
                          placeholder="e.g. HSBC Hong Kong"
                          className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:ring-2 focus:border-transparent ${
                            showErr('foreignBankName')
                              ? 'border-red-400 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-emerald-500'
                          }`}
                        />
                      </Field>
                      <Field
                        label="Beneficiary Name *"
                        hint="Account holder exactly as on bank records"
                        error={showErr('foreignBeneficiary') ? errors.foreignBeneficiary : undefined}
                      >
                        <input
                          data-field="foreignBeneficiary"
                          value={foreign.beneficiaryName || ''}
                          onChange={(e) => setForeign((f) => ({ ...f, beneficiaryName: e.target.value }))}
                          onBlur={() => setTouched((t) => ({ ...t, foreignBeneficiary: true }))}
                          className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:ring-2 focus:border-transparent ${
                            showErr('foreignBeneficiary')
                              ? 'border-red-400 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-emerald-500'
                          }`}
                        />
                      </Field>
                      <Field
                        label="SWIFT / BIC *"
                        hint="8 or 11 chars (e.g. CHASUS33XXX)"
                        error={showErr('foreignSwift') ? errors.foreignSwift : undefined}
                      >
                        <input
                          data-field="foreignSwift"
                          value={foreign.swift || ''}
                          onChange={(e) => setForeign((f) => ({ ...f, swift: e.target.value.toUpperCase() }))}
                          onBlur={() => setTouched((t) => ({ ...t, foreignSwift: true }))}
                          maxLength={11}
                          placeholder="CHASUS33XXX"
                          className={`w-full px-4 py-2.5 rounded-lg border font-mono uppercase text-sm focus:ring-2 focus:border-transparent ${
                            showErr('foreignSwift')
                              ? 'border-red-400 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-emerald-500'
                          }`}
                        />
                      </Field>
                      <Field
                        label="IBAN"
                        hint="UK / EU / UAE — leave blank for US/HK/SG accounts"
                        error={showErr('foreignIban') ? errors.foreignIban : undefined}
                      >
                        <input
                          data-field="foreignIban"
                          value={foreign.iban || ''}
                          onChange={(e) => setForeign((f) => ({ ...f, iban: e.target.value.toUpperCase() }))}
                          onBlur={() => setTouched((t) => ({ ...t, foreignIban: true }))}
                          maxLength={34}
                          placeholder="GB29NWBK60161331926819"
                          className={`w-full px-4 py-2.5 rounded-lg border font-mono uppercase text-sm focus:ring-2 focus:border-transparent ${
                            showErr('foreignIban')
                              ? 'border-red-400 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-emerald-500'
                          }`}
                        />
                      </Field>
                      <Field label="Account Number" hint="If different from IBAN (US / HK / SG / etc.)">
                        <input
                          value={foreign.accountNumber || ''}
                          onChange={(e) => setForeign((f) => ({ ...f, accountNumber: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
                        />
                      </Field>
                      <Field label="Routing / Sort / BSB / Transit" hint="ABA (US) · Sort (UK) · BSB (AU) · Transit (CA)">
                        <input
                          value={foreign.routingCode || ''}
                          onChange={(e) => setForeign((f) => ({ ...f, routingCode: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
                        />
                      </Field>
                      <Field
                        label="Currency *"
                        hint="ISO-4217 (auto-defaulted from country)"
                        error={showErr('foreignCurrency') ? errors.foreignCurrency : undefined}
                      >
                        <input
                          data-field="foreignCurrency"
                          value={foreign.currency || ''}
                          onChange={(e) => {
                            currencyTouched.current = true;
                            setForeign((f) => ({ ...f, currency: e.target.value.toUpperCase() }));
                          }}
                          onBlur={() => setTouched((t) => ({ ...t, foreignCurrency: true }))}
                          maxLength={3}
                          placeholder="USD"
                          className={`w-full px-4 py-2.5 rounded-lg border font-mono uppercase text-sm focus:ring-2 focus:border-transparent ${
                            showErr('foreignCurrency')
                              ? 'border-red-400 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-emerald-500'
                          }`}
                        />
                      </Field>
                      <Field label="Intermediary Bank" hint="Optional — for chained wire transfers">
                        <input
                          value={foreign.intermediaryBank || ''}
                          onChange={(e) => setForeign((f) => ({ ...f, intermediaryBank: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                        />
                      </Field>
                    </div>
                    <Field label="Bank Address" hint="Full bank branch address">
                      <textarea
                        value={foreign.bankAddress || ''}
                        onChange={(e) => setForeign((f) => ({ ...f, bankAddress: e.target.value }))}
                        rows={2}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm"
                      />
                    </Field>
                  </ForeignSection>

                  {/* Customs & Shipping */}
                  <ForeignSection title="Customs & Shipping" Icon={TruckIcon} accent="amber">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Field label="Incoterms (2020)" hint="Who pays freight / insurance / duties">
                        <select
                          value={foreign.incoterms || ''}
                          onChange={(e) => setForeign((f) => ({ ...f, incoterms: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-sm"
                        >
                          <option value="">— Select —</option>
                          {INCOTERMS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </Field>
                      <Field
                        label="Default HS Code"
                        hint="Auto-suggested from supply categories"
                        error={showErr('foreignHsCode') ? errors.foreignHsCode : undefined}
                      >
                        <input
                          data-field="foreignHsCode"
                          value={foreign.defaultHsCode || ''}
                          onChange={(e) => {
                            hsCodeTouched.current = true;
                            setForeign((f) => ({ ...f, defaultHsCode: e.target.value.replace(/\D/g, '').slice(0, 10) }));
                          }}
                          onBlur={() => setTouched((t) => ({ ...t, foreignHsCode: true }))}
                          placeholder="7102"
                          className={`w-full px-4 py-2.5 rounded-lg border font-mono text-sm focus:ring-2 focus:border-transparent ${
                            showErr('foreignHsCode')
                              ? 'border-red-400 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-amber-500'
                          }`}
                        />
                      </Field>
                      <Field label="Country of Origin" hint="Where goods originate">
                        <input
                          value={foreign.countryOfOrigin || ''}
                          onChange={(e) => setForeign((f) => ({ ...f, countryOfOrigin: e.target.value }))}
                          placeholder={form.country || ''}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                        />
                      </Field>
                    </div>
                  </ForeignSection>

                  {/* Compliance + Commercial */}
                  <ForeignSection title="Compliance & Commercial Terms" Icon={BanknotesIcon} accent="violet">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {requiresKpc && (
                        <Field
                          label="Kimberley Process Certificate # *"
                          hint="Required for diamond / stone packet imports"
                          error={showErr('foreignKpc') ? errors.foreignKpc : undefined}
                        >
                          <input
                            data-field="foreignKpc"
                            value={foreign.kpcNumber || ''}
                            onChange={(e) => setForeign((f) => ({ ...f, kpcNumber: e.target.value }))}
                            onBlur={() => setTouched((t) => ({ ...t, foreignKpc: true }))}
                            placeholder="e.g. IN/2024/12345"
                            className={`w-full px-4 py-2.5 rounded-lg border font-mono text-sm focus:ring-2 focus:border-transparent ${
                              showErr('foreignKpc')
                                ? 'border-red-400 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-violet-500'
                            }`}
                          />
                        </Field>
                      )}
                      <Field label="Payment Terms" hint="When payment is due to vendor">
                        <input
                          list="paymentTermsList"
                          value={foreign.paymentTerms || ''}
                          onChange={(e) => setForeign((f) => ({ ...f, paymentTerms: e.target.value }))}
                          placeholder="e.g. Net 30 / 50% Advance"
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                        />
                        <datalist id="paymentTermsList">
                          {PAYMENT_TERMS_OPTIONS.map((p) => (
                            <option key={p} value={p} />
                          ))}
                        </datalist>
                      </Field>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 mt-2">
                      <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 border border-violet-200 cursor-pointer select-none flex-1 min-h-[44px]">
                        <input
                          type="checkbox"
                          checked={!!foreign.conflictFreeDeclared}
                          onChange={(e) => setForeign((f) => ({ ...f, conflictFreeDeclared: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-300 text-violet-700 focus:ring-violet-600"
                        />
                        <span className="text-sm font-medium text-gray-800">
                          Vendor declares all goods are conflict-free
                        </span>
                      </label>
                      <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 border border-violet-200 cursor-pointer select-none flex-1 min-h-[44px]">
                        <input
                          type="checkbox"
                          checked={!!foreign.letterOfCreditRequired}
                          onChange={(e) => setForeign((f) => ({ ...f, letterOfCreditRequired: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-300 text-violet-700 focus:ring-violet-600"
                        />
                        <span className="text-sm font-medium text-gray-800">
                          Letter of Credit (LC) required for shipments
                        </span>
                      </label>
                    </div>
                  </ForeignSection>
                </div>
              )}
            </div>
          )}

          {/* GST card actions */}
          {!noGst && gstDetails && gstStatus === 'ok' && (
            <div className="flex flex-wrap items-center justify-end gap-2 -mt-2">
              {autoFillSnapshot.current && (
                <button
                  type="button"
                  onClick={revertAutoFill}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                >
                  ↶ Revert auto-fill
                </button>
              )}
              <button
                type="button"
                onClick={useGstDetails}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700"
              >
                Re-apply GST values to Name / Address
              </button>
            </div>
          )}

          {showAllErrors && errorList.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <p className="font-semibold mb-1">Please fix the following before saving:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {errorList.map(([k, msg]) => (
                  <li key={k}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{submitError}</div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 pt-2">
            {vendor && dealsInValue.length > 0 && (
              <button
                type="button"
                disabled={saveMut.isPending}
                onClick={() => {
                  // Confirm the soft-archive intent (it's reversible — admin
                  // can re-tick categories later — but staff might click it by
                  // mistake, so guard with a synchronous confirm).
                  const ok = window.confirm(
                    `Archive "${vendor.name}"?\n\n` +
                      `• Vendor stays in the database and on every existing transaction.\n` +
                      `• They will NOT appear in any Receive form (Metal/Diamond/Real Stone/Stone Packet).\n` +
                      `• You can un-archive any time by editing this vendor and re-ticking categories.\n\n` +
                      `Continue?`,
                  );
                  if (!ok) return;
                  setArchiveIntent(true);
                  // Visually reflect the new state before submit so the
                  // warning chip + chips state are accurate if the request
                  // is slow / fails.
                  setForm((f) => ({ ...f, dealsIn: [] }));
                  setSubmitError(null);
                  // Submit on next tick so React commits the state changes
                  // before the mutation reads them.
                  setTimeout(() => saveMut.mutate(), 0);
                }}
                className="sm:mr-auto px-3 py-2 rounded-lg text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300 hover:bg-amber-100 disabled:opacity-50"
                title="Soft-archive: hide from all Receive forms while keeping history intact"
              >
                📦 Archive vendor
              </button>
            )}
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={saveMut.isPending} disabled={saveMut.isPending}>
              {vendor ? 'Save Changes' : 'Create Vendor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Read-only display of a single GST-derived field. Renders an em-dash when
 * the value is missing rather than collapsing the row, so the grid stays
 * predictable.
 */
function ReadOnly({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">{label}</span>
      {value ? (
        <span
          className={`text-sm text-gray-900 font-medium ${mono ? 'font-mono' : ''} truncate`}
          title={value}
        >
          {value}
        </span>
      ) : (
        <span className="text-sm text-gray-400">—</span>
      )}
    </div>
  );
}

function ManualInput({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-champagne-600 focus:border-transparent bg-white text-sm"
    />
  );
}

/**
 * Visual sub-card inside the Export / International Details accordion.
 * Keeps the four logical groups (Identity, Banking, Customs, Compliance)
 * visually separated without burying the user in deeply-nested layouts.
 */
function ForeignSection({
  title,
  Icon,
  accent,
  children,
}: {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: 'indigo' | 'emerald' | 'amber' | 'violet';
  children: React.ReactNode;
}) {
  const headerCls: Record<typeof accent, string> = {
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    violet: 'bg-violet-50 border-violet-200 text-violet-900',
  };
  return (
    <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <header
        className={`flex items-center gap-2 px-3 py-2 border-b ${headerCls[accent]}`}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <h4 className="text-xs font-bold uppercase tracking-wider">{title}</h4>
      </header>
      <div className="p-3 space-y-3">{children}</div>
    </section>
  );
}
