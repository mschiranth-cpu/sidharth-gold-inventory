/**
 * ============================================
 * RECEIVE METAL PAGE
 * ============================================
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createMetalTransaction } from '../../services/metal.service';
import { listVendors, type Vendor, type VendorDealsCategory, VENDOR_DEALS_LABELS } from '../../services/vendor.service';
import Button from '../../components/common/Button';
import LiveMetalRatesCard from '../../components/LiveMetalRatesCard';
import VendorFormModal from '../../components/VendorFormModal';

// Red asterisk for required-field labels
const Req = () => <span className="text-accent-ruby ml-0.5">*</span>;

interface FieldErrors {
  vendor?: string;
  metalType?: string;
  purity?: string;
  form?: string;
  grossWeight?: string;
  rate?: string;
  paymentMode?: string;
  paymentStatus?: string;
  amountPaid?: string;
  paymentSplit?: string;
}

export default function ReceiveMetalPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    metalType: 'GOLD',
    purity: 24,
    form: 'BAR',
    grossWeight: 0,
    rate: 0,
    referenceNumber: '',
    notes: '',
    // Defaults to today; user can pick any date via the calendar dropdown.
    transactionDate: new Date().toISOString().slice(0, 10),
    // Payment / billing
    isBillable: true,
    paymentMode: 'CASH',           // 'CASH' | 'NEFT' | 'BOTH'
    paymentStatus: 'COMPLETE',     // 'COMPLETE' | 'HALF' | 'PENDING'
    amountPaid: 0,
    cashAmount: 0,
    neftAmount: 0,
    neftUtr: '',
    neftBank: '',
    neftDate: '',                  // yyyy-mm-dd from <input type="date">
    creditApplied: 0,              // vendor credit to apply to this purchase
  });
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Single source of truth for total price (was previously recomputed inline).
  const totalPrice = useMemo(() => {
    const pureWeight = (formData.grossWeight * formData.purity) / 24;
    return pureWeight * formData.rate;
  }, [formData.grossWeight, formData.purity, formData.rate]);

  // When paymentStatus or totalPrice changes, sync amountPaid for COMPLETE/PENDING.
  // HALF leaves amountPaid alone (user-controlled).
  // BOTH mode is driven by its own effect below — skip here so we don't clobber
  // an over-payment split (e.g. cash 60 + neft 60 on a ₹100 total).
  // Note: `isBillable` is now a pure tax-classification tag; payment behavior
  // runs identically for both billable and non-billable purchases.
  useEffect(() => {
    if (formData.paymentMode === 'BOTH') return;
    if (formData.paymentStatus === 'COMPLETE') {
      setFormData((prev) =>
        prev.amountPaid === totalPrice ? prev : { ...prev, amountPaid: totalPrice }
      );
    } else if (formData.paymentStatus === 'PENDING') {
      setFormData((prev) => (prev.amountPaid === 0 ? prev : { ...prev, amountPaid: 0 }));
    }
  }, [totalPrice, formData.paymentStatus, formData.paymentMode]);

  // BOTH mode: cash + neft inputs ARE the payment, so derive status + amountPaid
  // from their sum. (CASH/NEFT modes are driven by the status segmented buttons.)
  useEffect(() => {
    if (formData.paymentMode !== 'BOTH' || totalPrice <= 0) return;
    const split = (formData.cashAmount || 0) + (formData.neftAmount || 0);
    let nextStatus: string;
    if (split <= 0) nextStatus = 'PENDING';
    else if (split + 0.01 >= totalPrice) nextStatus = 'COMPLETE';
    else nextStatus = 'HALF';
    setFormData((prev) =>
      prev.paymentStatus === nextStatus && prev.amountPaid === split
        ? prev
        : { ...prev, paymentStatus: nextStatus, amountPaid: split }
    );
  }, [
    formData.cashAmount,
    formData.neftAmount,
    formData.paymentMode,
    totalPrice,
  ]);

  const createMutation = useMutation({
    mutationFn: createMetalTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metal-stock'] });
      queryClient.invalidateQueries({ queryKey: ['metal-stock-summary'] });
      navigate('/app/inventory/metal');
    },
  });

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (!selectedVendor) e.vendor = 'Vendor is required — please select one to continue';
    if (!formData.metalType) e.metalType = 'Metal Type is required';
    if (!formData.purity) e.purity = 'Purity is required';
    if (!formData.form) e.form = 'Form is required';
    if (!formData.grossWeight || formData.grossWeight <= 0)
      e.grossWeight = 'Gross Weight must be greater than 0';
    if (!formData.rate || formData.rate <= 0)
      e.rate = 'Rate per Gram is required and must be greater than 0';

    // Payment validation runs for every purchase — isBillable is a tax tag.
    if (totalPrice > 0) {
      if (!formData.paymentMode) e.paymentMode = 'Payment Mode is required';
      if (!formData.paymentStatus) e.paymentStatus = 'Payment Status is required';
      // BOTH split & HALF amount are allowed to over-pay; the excess is
      // routed to vendor credit by the backend. We only require that some
      // value is entered when the user explicitly chose HALF in CASH/NEFT
      // single-mode (BOTH derives amountPaid from cash+neft sum).
      if (formData.paymentStatus === 'HALF' && formData.paymentMode !== 'BOTH') {
        if (formData.amountPaid <= 0) {
          e.amountPaid = 'Amount Paid must be greater than 0';
        }
      }
    }
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) {
      setShowErrorModal(true);
      return;
    }
    const vendorTag = selectedVendor
      ? `[Vendor: ${selectedVendor.name} (${selectedVendor.uniqueCode})]`
      : '';
    const composedNotes = [vendorTag, formData.notes].filter(Boolean).join('\n');
    const isNeft = formData.paymentMode === 'NEFT' || formData.paymentMode === 'BOTH';
    const payload: Record<string, unknown> = {
      transactionType: 'PURCHASE',
      metalType: formData.metalType,
      purity: formData.purity,
      form: formData.form,
      grossWeight: formData.grossWeight,
      rate: formData.rate,
      vendorId: selectedVendor?.id,
      notes: composedNotes,
      referenceNumber: formData.referenceNumber,
      isBillable: formData.isBillable,
      transactionDate: formData.transactionDate
        ? new Date(formData.transactionDate).toISOString()
        : undefined,
    };
    // Always send payment fields. `isBillable` is preserved on the row purely
    // as a tax-classification tag for Excel exports.
    payload.paymentMode = formData.paymentMode;
    payload.paymentStatus = formData.paymentStatus;
    payload.amountPaid = formData.amountPaid;
    if (formData.creditApplied > 0) {
      payload.creditApplied = formData.creditApplied;
    }
    if (formData.paymentMode === 'BOTH') {
      payload.cashAmount = formData.cashAmount;
      payload.neftAmount = formData.neftAmount;
    }
    if (isNeft) {
      if (formData.neftUtr) payload.neftUtr = formData.neftUtr;
      if (formData.neftBank) payload.neftBank = formData.neftBank;
      if (formData.neftDate) payload.neftDate = new Date(formData.neftDate).toISOString();
    }
    createMutation.mutate(payload);
  };

  const inputClass = (hasError?: string) =>
    `w-full px-4 py-3 rounded-xl border ${
      hasError ? 'border-accent-ruby/50 focus:ring-accent-ruby' : 'border-champagne-300 focus:ring-champagne-500'
    } focus:ring-2 focus:border-transparent`;

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-onyx-900 mb-2">Receive Metal</h1>
          <p className="text-onyx-500">Record metal received from supplier</p>
        </div>

        {/* Vendor selector — must be picked before the rest of the form unlocks */}
        <VendorSelector
          selected={selectedVendor}
          onSelect={(v) => {
            setSelectedVendor(v);
            if (v) setErrors((prev) => ({ ...prev, vendor: undefined }));
          }}
          error={errors.vendor}
          dealsIn="METAL"
        />

        {!selectedVendor && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg p-10 border-2 border-dashed border-champagne-200 text-center">
            <p className="text-onyx-400">
              Select a vendor above to continue recording the receipt.
            </p>
          </div>
        )}

        {selectedVendor && (
          <>
            {/* Live market rates — click "Use this rate" to auto-fill */}
            <LiveMetalRatesCard
              selectedMetal={formData.metalType as 'GOLD' | 'SILVER' | 'PLATINUM' | 'PALLADIUM'}
              selectedPurity={formData.purity}
              onUseRate={(rate) => setFormData((prev) => ({ ...prev, rate }))}
            />

            <div className="bg-white rounded-2xl shadow-lg p-8 border border-champagne-100">
          {createMutation.isError && (
            <div className="mb-6 p-4 bg-red-50 border border-accent-ruby/30 rounded-xl text-accent-ruby text-sm">
              Failed to record transaction
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-onyx-700 mb-2">
                  Metal Type<Req />
                </label>
                <select
                  value={formData.metalType}
                  onChange={(e) => setFormData({ ...formData, metalType: e.target.value })}
                  className={inputClass(errors.metalType)}
                >
                  <option value="GOLD">Gold</option>
                  <option value="SILVER">Silver</option>
                  <option value="PLATINUM">Platinum</option>
                  <option value="PALLADIUM">Palladium</option>
                </select>
                {errors.metalType && (
                  <p className="mt-1 text-xs text-accent-ruby">{errors.metalType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-onyx-700 mb-2">
                  Purity (Karat)<Req />
                </label>
                <select
                  value={formData.purity}
                  onChange={(e) => setFormData({ ...formData, purity: parseFloat(e.target.value) })}
                  className={inputClass(errors.purity)}
                >
                  <option value="24">24K</option>
                  <option value="22">22K</option>
                  <option value="18">18K</option>
                  <option value="14">14K</option>
                </select>
                {errors.purity && <p className="mt-1 text-xs text-accent-ruby">{errors.purity}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-onyx-700 mb-2">
                  Form<Req />
                </label>
                <select
                  value={formData.form}
                  onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                  className={inputClass(errors.form)}
                >
                  <option value="BAR">Bar</option>
                  <option value="WIRE">Wire</option>
                  <option value="SHEET">Sheet</option>
                  <option value="GRAIN">Grain</option>
                  <option value="SCRAP">Scrap</option>
                </select>
                {errors.form && <p className="mt-1 text-xs text-accent-ruby">{errors.form}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-onyx-700 mb-2">
                  Gross Weight (grams)<Req />
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.grossWeight}
                  onChange={(e) =>
                    setFormData({ ...formData, grossWeight: parseFloat(e.target.value) })
                  }
                  className={inputClass(errors.grossWeight)}
                />
                {errors.grossWeight && (
                  <p className="mt-1 text-xs text-accent-ruby">{errors.grossWeight}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-onyx-700 mb-2">
                  Rate per Gram (₹)<Req />
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                  className={inputClass(errors.rate)}
                />
                {errors.rate && <p className="mt-1 text-xs text-accent-ruby">{errors.rate}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-onyx-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  className={inputClass()}
                  placeholder="Invoice/Bill number"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-onyx-700 mb-2">
                  Transaction Date<Req />
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.transactionDate}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) =>
                      setFormData({ ...formData, transactionDate: e.target.value })
                    }
                    className={`${inputClass()} pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                  />
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-champagne-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="mt-1 text-xs text-onyx-400">
                  Defaults to today. Pick a past date to back-date the entry.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-onyx-700 mb-2">Notes</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className={inputClass()}
                placeholder="Any additional notes..."
              />
            </div>

            {/* Calculated Pure Weight & Total Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-champagne-50 rounded-xl border border-champagne-200">
                <p className="text-sm text-onyx-700 mb-1">Calculated Pure Weight:</p>
                <p className="text-2xl font-bold text-onyx-900">
                  {((formData.grossWeight * formData.purity) / 24).toFixed(3)} grams
                </p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="text-sm text-onyx-700 mb-1">Total Price:</p>
                <p className="text-2xl font-bold text-accent-emerald">
                  ₹
                  {totalPrice.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-onyx-500 mt-1">
                  {((formData.grossWeight * formData.purity) / 24).toFixed(3)} g × ₹
                  {formData.rate.toLocaleString('en-IN')}/g
                </p>
              </div>
            </div>

            {/* Billing & Payment */}
            <BillingPaymentCard
              formData={formData}
              setFormData={setFormData}
              totalPrice={totalPrice}
              vendorHasGstin={Boolean(selectedVendor?.gstNumber)}
              vendorCredit={selectedVendor?.creditBalance ?? 0}
              vendorName={selectedVendor?.name ?? null}
              errors={errors}
            />

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate('/app/inventory/metal')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={createMutation.isPending}
                className="flex-1"
              >
                Record Receipt
              </Button>
            </div>
          </form>
        </div>
          </>
        )}
      </div>

      {/* Validation error modal */}
      {showErrorModal && Object.keys(errors).length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowErrorModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-accent-ruby"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-onyx-900">Please fix these errors</h3>
                <p className="text-sm text-onyx-500 mt-1">
                  The form has {Object.keys(errors).length} validation issue
                  {Object.keys(errors).length === 1 ? '' : 's'}.
                </p>
              </div>
            </div>
            <ul className="space-y-2 mb-6 pl-4">
              {Object.entries(errors).map(([field, msg]) => (
                <li key={field} className="text-sm text-accent-ruby list-disc">
                  {msg}
                </li>
              ))}
            </ul>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="primary"
                onClick={() => setShowErrorModal(false)}
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// VendorSelector — searchable, keyboard-navigable picker
// ============================================

interface VendorSelectorProps {
  selected: Vendor | null;
  onSelect: (v: Vendor | null) => void;
  error?: string;
  /**
   * Restrict the dropdown to vendors flagged for this supply category.
   * Omit on Edit…Modal usage so historical vendors stay selectable even
   * if they've since been narrowed/archived.
   */
  dealsIn?: VendorDealsCategory;
}

export function VendorSelector({ selected, onSelect, error, dealsIn }: VendorSelectorProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const { data: vendors = [], isLoading } = useQuery({
    // Cache key includes the category so different Receive pages don't
    // share each other's filtered results. Prefix-based invalidation
    // (`['vendors']`) still busts every variant correctly.
    queryKey: ['vendors', dealsIn ?? null],
    queryFn: () => listVendors(undefined, dealsIn),
    staleTime: 60_000,
  });

  // 250ms debounce on search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Reset highlight when filter changes
  useEffect(() => {
    setHighlightIndex(0);
  }, [debounced]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Autofocus search when dropdown opens
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => searchInputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  const filtered = useMemo(() => {
    if (!debounced) return vendors;
    return vendors.filter((v) => {
      const haystack = [
        v.name,
        v.uniqueCode,
        v.phone,
        v.gstNumber,
        v.address,
        v.gstDetails?.legalName,
        v.gstDetails?.tradeName,
        v.gstDetails?.state,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(debounced);
    });
  }, [vendors, debounced]);

  // Auto-scroll highlighted row into view
  useEffect(() => {
    if (!open) return;
    const ul = listRef.current;
    if (!ul) return;
    const row = ul.children[highlightIndex] as HTMLElement | undefined;
    row?.scrollIntoView({ block: 'nearest' });
  }, [highlightIndex, open, filtered.length]);

  const choose = (v: Vendor) => {
    onSelect(v);
    setOpen(false);
    setSearch('');
    setDebounced('');
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlightIndex]) choose(filtered[highlightIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  };

  const triggerBorder = error
    ? 'border-accent-ruby/50 focus:ring-accent-ruby'
    : 'border-champagne-300 focus:ring-champagne-500';

  return (
    <div ref={containerRef} className="relative mb-6">
      <label className="block text-sm font-semibold text-onyx-700 mb-2">
        Vendor<Req />
      </label>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        className={`w-full px-4 py-3 rounded-xl border ${triggerBorder} bg-white text-left flex items-center justify-between focus:ring-2 focus:border-transparent`}
      >
        <span className={selected ? 'text-onyx-900' : 'text-onyx-300'}>
          {selected ? `${selected.name} (${selected.uniqueCode})` : 'Select a vendor…'}
        </span>
        <svg
          className={`w-5 h-5 text-onyx-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {error && <p className="mt-1 text-xs text-accent-ruby">{error}</p>}

      {open && (
        <div className="absolute z-40 mt-2 w-full bg-white rounded-xl shadow-2xl border border-champagne-200 overflow-hidden">
          <div className="p-3 border-b border-champagne-100">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="Search by name, code, phone, GSTIN, address…"
              className="w-full px-3 py-2 rounded-lg border border-champagne-200 focus:outline-none focus:ring-2 focus:ring-champagne-500 focus:border-transparent text-sm"
            />
          </div>

          {isLoading ? (
            <div className="p-6 text-center text-sm text-onyx-400">Loading vendors…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-onyx-500 space-y-2">
              {vendors.length === 0 && dealsIn ? (
                <>
                  <p>
                    No vendors registered for{' '}
                    <strong>{VENDOR_DEALS_LABELS[dealsIn]}</strong>.
                  </p>
                  <p className="text-xs text-onyx-400">
                    Open the Vendors page and tick this supply category for the
                    relevant vendor, or{' '}
                    <button
                      type="button"
                      className="text-champagne-700 hover:underline font-medium"
                      onClick={() => setShowAddModal(true)}
                    >
                      add a new vendor
                    </button>
                    .
                  </p>
                </>
              ) : vendors.length === 0 ? (
                <>
                  No vendors yet —{' '}
                  <button
                    type="button"
                    className="text-champagne-700 hover:underline font-medium"
                    onClick={() => setShowAddModal(true)}
                  >
                    Add New Vendor
                  </button>
                </>
              ) : (
                <>
                  No matches —{' '}
                  <button
                    type="button"
                    className="text-champagne-700 hover:underline font-medium"
                    onClick={() => setShowAddModal(true)}
                  >
                    Add New Vendor
                  </button>
                </>
              )}
            </div>
          ) : (
            <ul ref={listRef} className="max-h-72 overflow-y-auto">
              {filtered.map((v, idx) => {
                const active = idx === highlightIndex;
                return (
                  <li
                    key={v.id}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    onClick={() => choose(v)}
                    className={`px-4 py-3 cursor-pointer border-b border-champagne-100 last:border-b-0 ${
                      active ? 'bg-champagne-50' : 'hover:bg-pearl'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-onyx-900">{v.name}</span>
                      <span className="text-xs text-onyx-400">{v.uniqueCode}</span>
                    </div>
                    <div className="text-xs text-onyx-400 mt-0.5 flex flex-wrap gap-x-3">
                      {v.phone && <span>📞 {v.phone}</span>}
                      {v.gstNumber && <span>GSTIN: {v.gstNumber}</span>}
                      {v.gstDetails?.state && <span>{v.gstDetails.state}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-champagne-100 p-2">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="w-full px-3 py-2 text-sm font-medium text-champagne-700 hover:bg-champagne-50 rounded-lg flex items-center justify-center gap-1"
            >
              <span className="text-lg leading-none">+</span> Add New Vendor
            </button>
          </div>
        </div>
      )}

      {selected && (
        <div className="mt-4 p-5 bg-champagne-50 rounded-xl border border-champagne-200">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-onyx-900">Selected vendor</h3>
            <button
              type="button"
              className="text-xs text-champagne-800 hover:underline font-medium"
              onClick={() => onSelect(null)}
            >
              Change vendor
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <InfoRow label="Name" value={selected.name} />
            <InfoRow label="Code" value={selected.uniqueCode} />
            <InfoRow label="Phone" value={selected.phone} />
            <InfoRow label="GSTIN" value={selected.gstNumber} />
            <InfoRow label="State" value={selected.gstDetails?.state} />
            <InfoRow label="State Code" value={selected.gstDetails?.stateCode} />
            <InfoRow label="Legal Name" value={selected.gstDetails?.legalName} />
            <InfoRow label="Trade Name" value={selected.gstDetails?.tradeName} />
            <InfoRow
              label="Address"
              value={selected.address || selected.gstDetails?.address}
              full
            />
          </div>
        </div>
      )}

      {showAddModal && (
        <VendorFormModal
          vendor={null}
          onClose={() => setShowAddModal(false)}
          onSaved={(newVendor) => {
            setShowAddModal(false);
            setOpen(false);
            setSearch('');
            setDebounced('');
            qc.invalidateQueries({ queryKey: ['vendors'] });
            onSelect(newVendor as Vendor);
          }}
        />
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  full,
}: {
  label: string;
  value?: string | null;
  full?: boolean;
}) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <span className="text-onyx-400">{label}: </span>
      <span className="text-onyx-900">{value || '—'}</span>
    </div>
  );
}

// ============================================
// Billing & Payment card
// ============================================
type BillingFormData = {
  isBillable: boolean;
  paymentMode: string;
  paymentStatus: string;
  amountPaid: number;
  cashAmount: number;
  neftAmount: number;
  neftUtr: string;
  neftBank: string;
  neftDate: string;
};

interface BillingPaymentCardProps {
  formData: BillingFormData & Record<string, unknown>;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  totalPrice: number;
  vendorHasGstin: boolean;
  vendorCredit: number;
  vendorName: string | null;
  errors: {
    paymentMode?: string;
    paymentStatus?: string;
    amountPaid?: string;
    paymentSplit?: string;
  };
}

export function BillingPaymentCard({
  formData,
  setFormData,
  totalPrice,
  vendorHasGstin,
  vendorCredit,
  vendorName,
  errors,
}: BillingPaymentCardProps) {
  const set = (patch: Partial<BillingFormData> & { creditApplied?: number }) =>
    setFormData((prev: any) => ({ ...prev, ...patch }));
  const num = (v: string) => parseFloat(v) || 0;
  const fmt = (n: number) =>
    n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const isNeft = formData.paymentMode === 'NEFT' || formData.paymentMode === 'BOTH';

  // Effective paid combines cash/NEFT/amountPaid + credit applied.
  // For HALF/PENDING: amountPaid is authoritative. For COMPLETE: amountPaid = totalPrice.
  // Credit is added on top to compute over-payment.
  const creditApplied = (formData as any).creditApplied || 0;
  const cashOrNeftPaid = formData.amountPaid || 0;
  const effectivePaid = cashOrNeftPaid + creditApplied;
  const balanceDue = Math.max(totalPrice - effectivePaid, 0);
  const overPaid = Math.max(effectivePaid - totalPrice, 0);

  // Cap creditApplied to min(vendorCredit, totalPrice - cashOrNeftPaid).
  const maxApplicableCredit = Math.max(0, Math.min(vendorCredit, totalPrice - cashOrNeftPaid));

  const segBtn = (active: boolean) =>
    `flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition border ${
      active
        ? 'bg-champagne-700 text-white border-champagne-700 shadow-sm'
        : 'bg-white text-onyx-700 border-champagne-300 hover:bg-pearl'
    }`;

  const inputCls =
    'w-full px-4 py-2.5 rounded-xl border border-champagne-300 focus:ring-2 focus:ring-champagne-500 focus:border-transparent';

  return (
    <div className="p-5 bg-white rounded-xl border border-champagne-200 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-onyx-900">Billing &amp; Payment</h3>
          <p className="text-xs text-onyx-400 mt-0.5">
            Vendor balance, credit, and payment tracking work the same for both
            options. The Billable / Non-Billable label is only used to filter
            rows in the Excel export for Income Tax filing.
          </p>
        </div>
      </div>

      {/* Billable / Non-Billable tax tag */}
      <div className="flex gap-2">
        <button type="button" className={segBtn(formData.isBillable)} onClick={() => set({ isBillable: true })}>
          Billable
        </button>
        <button type="button" className={segBtn(!formData.isBillable)} onClick={() => set({ isBillable: false })}>
          Non-Billable
        </button>
      </div>

      <p className="text-xs text-onyx-400 -mt-1">
        {formData.isBillable
          ? 'Billable: included in the Income-Tax Excel export.'
          : "Non-Billable: still affects vendor balance, but excluded from the Income-Tax Excel export."}
      </p>

      <>
          {!vendorHasGstin && formData.isBillable && (
            <div className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
              ⚠ This vendor has no GSTIN on file. Are you sure this should be tagged Billable?
            </div>
          )}

          {/* Vendor credit panel — only when vendor has a non-zero balance. */}
          {vendorCredit > 0.01 && (
            <div className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-accent-emerald">
                  <span className="font-semibold">{vendorName ?? 'Vendor'} has ₹{fmt(vendorCredit)} in credit.</span>
                  <span className="text-accent-emerald ml-1">Apply some toward this purchase?</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={maxApplicableCredit}
                    step="0.01"
                    value={creditApplied || ''}
                    onChange={(e) =>
                      set({
                        creditApplied: Math.min(num(e.target.value), maxApplicableCredit),
                      })
                    }
                    placeholder="0"
                    className="w-32 px-3 py-1.5 rounded-lg border border-emerald-300 text-sm focus:ring-2 focus:ring-accent-emerald"
                  />
                  <button
                    type="button"
                    onClick={() => set({ creditApplied: maxApplicableCredit })}
                    className="text-xs font-medium text-accent-emerald hover:text-accent-emerald underline"
                  >
                    Apply max
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Payment Mode */}
          <div>
            <label className="block text-sm font-semibold text-onyx-700 mb-2">Payment Mode</label>
            <div className="flex gap-2">
              {(['CASH', 'NEFT', 'BOTH'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={segBtn(formData.paymentMode === m)}
                  onClick={() => set({ paymentMode: m })}
                >
                  {m === 'CASH' ? 'Cash' : m === 'NEFT' ? 'NEFT' : 'Both'}
                </button>
              ))}
            </div>
            {errors.paymentMode && <p className="text-xs text-accent-ruby mt-1">{errors.paymentMode}</p>}
          </div>

          {formData.paymentMode === 'BOTH' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-onyx-500 mb-1">Cash Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.cashAmount || ''}
                    onChange={(e) => set({ cashAmount: num(e.target.value) })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-onyx-500 mb-1">NEFT Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.neftAmount || ''}
                    onChange={(e) => set({ neftAmount: num(e.target.value) })}
                    className={inputCls}
                  />
                </div>
              </div>
              <p className="text-xs text-onyx-400 mt-1">
                Total: ₹{fmt((formData.cashAmount || 0) + (formData.neftAmount || 0))} of ₹{fmt(totalPrice)}
                {overPaid > 0.01 && (
                  <span className="text-accent-emerald font-medium">
                    {' '}— ₹{fmt(overPaid)} will be added to vendor credit
                  </span>
                )}
              </p>
              {errors.paymentSplit && <p className="text-xs text-accent-ruby mt-1">{errors.paymentSplit}</p>}
            </div>
          )}

          {isNeft && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-onyx-500 mb-1">NEFT UTR</label>
                <input
                  type="text"
                  value={formData.neftUtr}
                  onChange={(e) => set({ neftUtr: e.target.value })}
                  className={inputCls}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-onyx-500 mb-1">Bank</label>
                <input
                  type="text"
                  value={formData.neftBank}
                  onChange={(e) => set({ neftBank: e.target.value })}
                  className={inputCls}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-onyx-500 mb-1">NEFT Date</label>
                <input
                  type="date"
                  value={formData.neftDate}
                  onChange={(e) => set({ neftDate: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {/* Payment Status */}
          <div>
            <label className="block text-sm font-semibold text-onyx-700 mb-2">Payment Status</label>
            <div className="flex gap-2">
              {(['COMPLETE', 'HALF', 'PENDING'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={segBtn(formData.paymentStatus === s)}
                  onClick={() => set({ paymentStatus: s })}
                >
                  {s === 'COMPLETE' ? 'Complete' : s === 'HALF' ? 'Half' : 'Pending'}
                </button>
              ))}
            </div>
            {errors.paymentStatus && (
              <p className="text-xs text-accent-ruby mt-1">{errors.paymentStatus}</p>
            )}
          </div>

          {formData.paymentStatus === 'COMPLETE' && (
            <p className="text-sm text-onyx-400">
              Full payment of ₹{fmt(totalPrice)} recorded.
              {creditApplied > 0 && (
                <span className="text-accent-emerald"> (incl. ₹{fmt(creditApplied)} from vendor credit)</span>
              )}
            </p>
          )}
          {formData.paymentStatus === 'PENDING' && (
            <p className="text-sm text-onyx-400">Full balance ₹{fmt(totalPrice)} pending.</p>
          )}
          {formData.paymentStatus === 'HALF' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {formData.paymentMode === 'BOTH' ? (
                <div className="p-3 bg-pearl rounded-xl border border-champagne-200">
                  <p className="text-xs text-onyx-700 mb-1">Amount Paid (Cash + NEFT):</p>
                  <p className="text-lg font-bold text-onyx-900">₹{fmt(formData.amountPaid || 0)}</p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-onyx-500 mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.amountPaid || ''}
                    onChange={(e) => set({ amountPaid: num(e.target.value) })}
                    className={inputCls}
                  />
                  {errors.amountPaid && <p className="text-xs text-accent-ruby mt-1">{errors.amountPaid}</p>}
                </div>
              )}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-xs text-onyx-700 mb-1">Balance Due:</p>
                <p className="text-lg font-bold text-amber-900">₹{fmt(balanceDue)}</p>
                {creditApplied > 0 && (
                  <p className="text-xs text-accent-emerald mt-1">
                    + ₹{fmt(creditApplied)} from vendor credit
                  </p>
                )}
                {overPaid > 0.01 && (
                  <p className="text-xs text-accent-emerald mt-1 font-medium">
                    + ₹{fmt(overPaid)} will be added to vendor credit
                  </p>
                )}
              </div>
            </div>
          )}
        </>
    </div>
  );
}
