/**
 * ============================================
 * EDIT METAL TRANSACTION MODAL
 * ============================================
 * Mirrors ReceiveMetalPage's form (vendor + metal + billing/payment) with
 * every field auto-populated from the existing transaction.
 *
 * Backend reverses the OLD row's stock + vendor-credit effects, then applies
 * the NEW values inside one $transaction. Edits are blocked server-side if
 * the transaction has settlement-ledger entries (`metal_payments`).
 */

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  updateMetalTransaction,
  type MetalTransaction,
} from '../services/metal.service';
import { getVendor, listVendors, type Vendor } from '../services/vendor.service';
import Button from './common/Button';
import LiveMetalRatesCard from './LiveMetalRatesCard';
import { VendorSelector, BillingPaymentCard } from '../pages/inventory/ReceiveMetalPage';

interface Props {
  transaction: MetalTransaction;
  onClose: () => void;
  onSaved?: () => void;
}

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

// Strip the auto-prepended "[Vendor: Name (CODE)]" line that the Receive form
// adds, so editing a row doesn't show the marker as part of the user notes.
function stripVendorTag(notes: string | null | undefined): string {
  if (!notes) return '';
  return notes.replace(/^\[Vendor:[^\]]*\]\n?/, '').trim();
}

function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export default function EditMetalTransactionModal({
  transaction,
  onClose,
  onSaved,
}: Props) {
  const queryClient = useQueryClient();
  const txn = transaction as any;

  // Hydrate the vendor — the transaction list payload has limited vendor
  // fields, so refetch the full record (incl. gstNumber, creditBalance) once.
  const { data: hydratedVendor } = useQuery({
    queryKey: ['vendor', txn.vendorId],
    queryFn: () => getVendor(txn.vendorId),
    enabled: Boolean(txn.vendorId),
    staleTime: 60_000,
  });

  // Also pull the full vendor list so the picker dropdown works inline.
  useQuery({
    queryKey: ['vendors'],
    queryFn: () => listVendors(),
    staleTime: 60_000,
  });

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(
    (txn.vendor as Vendor) ?? null
  );
  useEffect(() => {
    if (hydratedVendor) setSelectedVendor(hydratedVendor as Vendor);
  }, [hydratedVendor]);

  // Hydrate from the existing row. For isBillable we explicitly check === true:
  // older rows store NULL, which the list treats as "Non-billable", and the
  // edit modal must reflect that same truth (otherwise the form opens as
  // Billable + Cash + Complete and silently flips the row on save).
  const wasBillable = txn.isBillable === true;
  const [formData, setFormData] = useState({
    metalType: txn.metalType ?? 'GOLD',
    purity: txn.purity ?? 24,
    form: txn.form ?? 'BAR',
    grossWeight: txn.grossWeight ?? 0,
    rate: txn.rate ?? 0,
    referenceNumber: txn.referenceNumber ?? '',
    notes: stripVendorTag(txn.notes),
    // Pre-fill with the row's existing transaction date.
    transactionDate: isoToDateInput(txn.createdAt),
    isBillable: wasBillable,
    // Payment-mode/status only meaningful when billable; for non-billable rows
    // we keep the defaults but they're ignored on save.
    paymentMode: txn.paymentMode ?? (wasBillable ? 'CASH' : 'CASH'),
    paymentStatus: txn.paymentStatus ?? (wasBillable ? 'COMPLETE' : 'PENDING'),
    amountPaid: txn.amountPaid ?? 0,
    cashAmount: txn.cashAmount ?? 0,
    neftAmount: txn.neftAmount ?? 0,
    neftUtr: txn.neftUtr ?? '',
    neftBank: txn.neftBank ?? '',
    neftDate: isoToDateInput(txn.neftDate),
    creditApplied: txn.creditApplied ?? 0,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showErrorModal, setShowErrorModal] = useState(false);

  const totalPrice = useMemo(() => {
    const pure = (formData.grossWeight * formData.purity) / 24;
    return pure * formData.rate;
  }, [formData.grossWeight, formData.purity, formData.rate]);

  const isPurchase = (txn.transactionType ?? 'PURCHASE') === 'PURCHASE';

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (isPurchase && !selectedVendor) {
      e.vendor = 'Vendor is required';
    }
    if (!formData.metalType) e.metalType = 'Metal Type is required';
    if (!formData.purity) e.purity = 'Purity is required';
    if (!formData.form) e.form = 'Form is required';
    if (!formData.grossWeight || formData.grossWeight <= 0)
      e.grossWeight = 'Gross Weight must be greater than 0';
    if (isPurchase && (!formData.rate || formData.rate <= 0))
      e.rate = 'Rate per Gram is required';
    if (isPurchase && formData.isBillable && totalPrice > 0) {
      if (!formData.paymentMode) e.paymentMode = 'Payment Mode is required';
      if (!formData.paymentStatus) e.paymentStatus = 'Payment Status is required';
      if (formData.paymentStatus === 'HALF' && formData.paymentMode !== 'BOTH') {
        if (formData.amountPaid <= 0) {
          e.amountPaid = 'Amount Paid must be greater than 0';
        }
      }
    }
    return e;
  };

  const save = useMutation({
    mutationFn: () => {
      const vendorTag = selectedVendor
        ? `[Vendor: ${selectedVendor.name} (${selectedVendor.uniqueCode})]`
        : '';
      const composedNotes = [vendorTag, formData.notes].filter(Boolean).join('\n');
      const isNeft =
        formData.paymentMode === 'NEFT' || formData.paymentMode === 'BOTH';

      const payload: Record<string, unknown> = {
        metalType: formData.metalType,
        purity: formData.purity,
        form: formData.form,
        grossWeight: formData.grossWeight,
        rate: formData.rate,
        vendorId: selectedVendor?.id ?? null,
        notes: composedNotes,
        referenceNumber: formData.referenceNumber,
        isBillable: isPurchase ? formData.isBillable : false,
        transactionDate: formData.transactionDate
          ? new Date(formData.transactionDate).toISOString()
          : undefined,
      };

      if (isPurchase && formData.isBillable) {
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
          payload.neftUtr = formData.neftUtr || '';
          payload.neftBank = formData.neftBank || '';
          payload.neftDate = formData.neftDate
            ? new Date(formData.neftDate).toISOString()
            : '';
        }
      }
      return updateMetalTransaction(transaction.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metal-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['metal-stock-summary'] });
      queryClient.invalidateQueries({ queryKey: ['metal-stock'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      onSaved?.();
      onClose();
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.error?.message || e?.message || 'Failed to update';
      setErrors({ vendor: msg });
      setShowErrorModal(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) {
      setShowErrorModal(true);
      return;
    }
    save.mutate();
  };

  const inputClass = (hasError?: string) =>
    `w-full px-4 py-3 rounded-xl border ${
      hasError ? 'border-accent-ruby/50 focus:ring-accent-ruby' : 'border-champagne-300 focus:ring-champagne-500'
    } focus:ring-2 focus:border-transparent`;

  const Req = () => <span className="text-accent-ruby ml-0.5">*</span>;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-champagne-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-xl font-bold text-onyx-900">Edit Transaction</h2>
            <p className="text-xs text-onyx-400 mt-0.5">
              Stock and vendor credit will be re-balanced automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-onyx-300 hover:text-onyx-500 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Vendor selector — same component as Receive Metal */}
          {isPurchase && (
            <VendorSelector
              selected={selectedVendor}
              onSelect={(v) => {
                setSelectedVendor(v);
                if (v) setErrors((prev) => ({ ...prev, vendor: undefined }));
              }}
              error={errors.vendor}
            />
          )}

          {/* Live market rates — only for purchase, click to autofill rate */}
          {isPurchase && (
            <LiveMetalRatesCard
              selectedMetal={formData.metalType as 'GOLD' | 'SILVER' | 'PLATINUM' | 'PALLADIUM'}
              selectedPurity={formData.purity}
              onUseRate={(rate) =>
                setFormData((prev) => ({ ...prev, rate }))
              }
            />
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-onyx-700 mb-2">
                  Metal Type<Req />
                </label>
                <select
                  value={formData.metalType}
                  onChange={(e) =>
                    setFormData({ ...formData, metalType: e.target.value })
                  }
                  className={inputClass(errors.metalType)}
                >
                  <option value="GOLD">Gold</option>
                  <option value="SILVER">Silver</option>
                  <option value="PLATINUM">Platinum</option>
                  <option value="PALLADIUM">Palladium</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-onyx-700 mb-2">
                  Purity (Karat)<Req />
                </label>
                <select
                  value={formData.purity}
                  onChange={(e) =>
                    setFormData({ ...formData, purity: parseFloat(e.target.value) })
                  }
                  className={inputClass(errors.purity)}
                >
                  <option value="24">24K</option>
                  <option value="22">22K</option>
                  <option value="18">18K</option>
                  <option value="14">14K</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-onyx-700 mb-2">
                  Form<Req />
                </label>
                <select
                  value={formData.form}
                  onChange={(e) =>
                    setFormData({ ...formData, form: e.target.value })
                  }
                  className={inputClass(errors.form)}
                >
                  <option value="BAR">Bar</option>
                  <option value="WIRE">Wire</option>
                  <option value="SHEET">Sheet</option>
                  <option value="GRAIN">Grain</option>
                  <option value="SCRAP">Scrap</option>
                </select>
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
                    setFormData({
                      ...formData,
                      grossWeight: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={inputClass(errors.grossWeight)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-onyx-700 mb-2">
                  Rate per Gram (₹){isPurchase && <Req />}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) =>
                    setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })
                  }
                  className={inputClass(errors.rate)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-onyx-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.referenceNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, referenceNumber: e.target.value })
                  }
                  className={inputClass()}
                  placeholder="Invoice/Bill number"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-onyx-700 mb-2">
                  Transaction Date
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

            {/* Billing & Payment — same component as Receive Metal */}
            {isPurchase && (
              <BillingPaymentCard
                formData={formData as any}
                setFormData={setFormData as any}
                totalPrice={totalPrice}
                vendorHasGstin={Boolean(selectedVendor?.gstNumber)}
                vendorCredit={selectedVendor?.creditBalance ?? 0}
                vendorName={selectedVendor?.name ?? null}
                errors={errors}
              />
            )}

            <div className="flex gap-4 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={save.isPending}
                className="flex-1"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Validation / error modal */}
      {showErrorModal && Object.keys(errors).length > 0 && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowErrorModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-onyx-900 mb-2">Please fix these errors</h3>
            <ul className="space-y-2 mb-6 pl-4">
              {Object.entries(errors).map(([field, msg]) => (
                <li key={field} className="text-sm text-accent-ruby list-disc">
                  {msg}
                </li>
              ))}
            </ul>
            <div className="flex justify-end">
              <Button type="button" variant="primary" onClick={() => setShowErrorModal(false)}>
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
