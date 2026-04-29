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
    pan: noGst && !panValid ? 'PAN must look like AAAAA9999A' : undefined,
    pincode: noGst && !pincodeValid ? 'Pincode must be 6 digits' : undefined,
    dealsIn:
      // Archive intent intentionally clears all categories — skip the
      // ≥1 rule when the user explicitly chose to archive.
      !archiveIntent && dealsInValue.length === 0
        ? 'Pick at least one supply category (or this vendor will not appear in any Receive form)'
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
      if (noGst) {
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
          {/* No GST toggle */}
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

          {/* GST mode */}
          {!noGst && (
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

          {/* Manual fields (No-GST mode) */}
          {noGst && (
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
