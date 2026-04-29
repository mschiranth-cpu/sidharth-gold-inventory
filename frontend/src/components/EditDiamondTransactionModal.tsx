/**
 * ============================================
 * EDIT DIAMOND TRANSACTION MODAL
 * ============================================
 * Mirror of EditMetalTransactionModal for diamond inventory.
 * Backend reverses old stock + vendor-credit effects in one $transaction,
 * then re-applies new values. Edits blocked server-side if `diamond_payments`
 * rows exist for this transaction.
 */

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  updateDiamondTransaction,
  type DiamondTransaction,
} from '../services/diamond.service';
import { getVendor, listVendors, type Vendor } from '../services/vendor.service';
import {
  combineDateWithCurrentIstTimeISO,
  nowIstDateString,
  toIstDateInputValue,
} from '../lib/dateUtils';
import Button from './common/Button';
import LiveDiamondRatesCard from './LiveDiamondRatesCard';
import { VendorSelector, BillingPaymentCard } from '../pages/inventory/ReceiveMetalPage';

interface Props {
  transaction: DiamondTransaction;
  onClose: () => void;
  onSaved?: () => void;
}

interface FieldErrors {
  vendor?: string;
  shape?: string;
  color?: string;
  clarity?: string;
  caratWeight?: string;
  pricePerCarat?: string;
  paymentMode?: string;
  paymentStatus?: string;
  amountPaid?: string;
  paymentSplit?: string;
}

const SHAPES = [
  'ROUND',
  'PRINCESS',
  'EMERALD',
  'OVAL',
  'PEAR',
  'MARQUISE',
  'CUSHION',
  'RADIANT',
  'ASSCHER',
  'HEART',
];
const COLORS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
const CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1'];

function isoToDateInput(iso: string | null | undefined): string {
  // IST-aware: see dateUtils.ts.
  return toIstDateInputValue(iso);
}

function stripVendorTag(notes: string | null | undefined): string {
  if (!notes) return '';
  return notes.replace(/^\[Vendor:[^\]]*\]\n?/, '').trim();
}

export default function EditDiamondTransactionModal({
  transaction,
  onClose,
  onSaved,
}: Props) {
  const queryClient = useQueryClient();
  const txn = transaction as any;

  const { data: hydratedVendor } = useQuery({
    queryKey: ['vendor', txn.vendorId],
    queryFn: () => getVendor(txn.vendorId),
    enabled: Boolean(txn.vendorId),
    staleTime: 60_000,
  });

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

  const wasBillable = txn.isBillable === true;
  const txnTotal =
    txn.totalValue ??
    ((txn.caratWeight ?? 0) * (txn.pricePerCarat ?? 0));
  const isLegacyRow = !txn.paymentStatus;
  const hydratedAmountPaid = isLegacyRow ? txnTotal : (txn.amountPaid ?? 0);
  const hydratedStatus = isLegacyRow ? 'COMPLETE' : (txn.paymentStatus ?? 'COMPLETE');
  const hydratedMode = txn.paymentMode ?? 'CASH';

  const [formData, setFormData] = useState({
    // Diamond attribute snapshot fields (editable on the row's snapshot).
    shape: txn.diamond?.shape ?? '',
    color: txn.diamond?.color ?? '',
    clarity: txn.diamond?.clarity ?? '',
    caratWeight: txn.caratWeight ?? 0,
    quantityPieces: txn.quantityPieces ?? 1,
    pricePerCarat: txn.pricePerCarat ?? 0,
    referenceNumber: txn.referenceNumber ?? '',
    notes: stripVendorTag(txn.notes),
    transactionDate: isoToDateInput(txn.createdAt),
    isBillable: wasBillable,
    paymentMode: hydratedMode,
    paymentStatus: hydratedStatus,
    amountPaid: hydratedAmountPaid,
    cashAmount: txn.cashAmount ?? 0,
    neftAmount: txn.neftAmount ?? 0,
    neftUtr: txn.neftUtr ?? '',
    neftBank: txn.neftBank ?? '',
    neftDate: isoToDateInput(txn.neftDate),
    creditApplied: txn.creditApplied ?? 0,
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [showErrorModal, setShowErrorModal] = useState(false);

  const totalPrice = useMemo(
    () => (formData.caratWeight || 0) * (formData.pricePerCarat || 0),
    [formData.caratWeight, formData.pricePerCarat]
  );

  const isPurchase = (txn.transactionType ?? 'PURCHASE') === 'PURCHASE';

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (isPurchase && !selectedVendor) e.vendor = 'Vendor is required';
    if (!formData.shape) e.shape = 'Shape is required';
    if (!formData.color) e.color = 'Color is required';
    if (!formData.clarity) e.clarity = 'Clarity is required';
    if (!formData.caratWeight || formData.caratWeight <= 0)
      e.caratWeight = 'Carat weight must be greater than 0';
    if (isPurchase && (!formData.pricePerCarat || formData.pricePerCarat <= 0))
      e.pricePerCarat = 'Price per carat is required';
    if (isPurchase && totalPrice > 0) {
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
        shape: formData.shape,
        color: formData.color,
        clarity: formData.clarity,
        caratWeight: formData.caratWeight,
        quantityPieces: formData.quantityPieces,
        pricePerCarat: formData.pricePerCarat,
        vendorId: selectedVendor?.id ?? null,
        notes: composedNotes,
        referenceNumber: formData.referenceNumber,
        isBillable: isPurchase ? formData.isBillable : false,
        transactionDate: formData.transactionDate
          ? combineDateWithCurrentIstTimeISO(formData.transactionDate)
          : undefined,
      };

      if (isPurchase) {
        payload.paymentMode = formData.paymentMode;
        payload.paymentStatus = formData.paymentStatus;
        payload.amountPaid = formData.amountPaid;
        if (formData.creditApplied > 0) payload.creditApplied = formData.creditApplied;
        if (formData.paymentMode === 'BOTH') {
          payload.cashAmount = formData.cashAmount;
          payload.neftAmount = formData.neftAmount;
        }
        if (isNeft) {
          payload.neftUtr = formData.neftUtr || '';
          payload.neftBank = formData.neftBank || '';
          payload.neftDate = formData.neftDate
            ? combineDateWithCurrentIstTimeISO(formData.neftDate)
            : '';
        }
      }
      return updateDiamondTransaction(transaction.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diamond-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['diamond-stock-summary'] });
      queryClient.invalidateQueries({ queryKey: ['diamonds'] });
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
            <h2 className="text-xl font-bold text-onyx-900">Edit Diamond Transaction</h2>
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

          {isPurchase && (
            <LiveDiamondRatesCard
              selectedShape={formData.shape}
              selectedColor={formData.color}
              selectedClarity={formData.clarity}
              selectedCarat={formData.caratWeight}
              onUseRate={(rate) =>
                setFormData((prev) => ({ ...prev, pricePerCarat: rate }))
              }
            />
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-onyx-700 mb-2">
                  Shape<Req />
                </label>
                <select
                  value={formData.shape}
                  onChange={(e) => setFormData({ ...formData, shape: e.target.value })}
                  className={inputClass(errors.shape)}
                >
                  <option value="">— select —</option>
                  {SHAPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-onyx-700 mb-2">
                  Color<Req />
                </label>
                <select
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className={inputClass(errors.color)}
                >
                  <option value="">— select —</option>
                  {COLORS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-onyx-700 mb-2">
                  Clarity<Req />
                </label>
                <select
                  value={formData.clarity}
                  onChange={(e) => setFormData({ ...formData, clarity: e.target.value })}
                  className={inputClass(errors.clarity)}
                >
                  <option value="">— select —</option>
                  {CLARITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-onyx-700 mb-2">
                  Carat Weight<Req />
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.caratWeight}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      caratWeight: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={inputClass(errors.caratWeight)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-onyx-700 mb-2">
                  Quantity (Pieces)
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.quantityPieces}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantityPieces: parseInt(e.target.value) || 1,
                    })
                  }
                  className={inputClass()}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-onyx-700 mb-2">
                  Price per Carat (₹){isPurchase && <Req />}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerCarat}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricePerCarat: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={inputClass(errors.pricePerCarat)}
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
                <input
                  type="date"
                  value={formData.transactionDate}
                  max={nowIstDateString()}
                  onChange={(e) =>
                    setFormData({ ...formData, transactionDate: e.target.value })
                  }
                  className={inputClass()}
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-semibold text-onyx-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className={inputClass()}
                  placeholder="Anything worth recording for this transaction"
                />
              </div>
            </div>

            {/* Total preview */}
            <div className="rounded-2xl border border-champagne-200 bg-gradient-to-r from-pearl-50 via-white to-champagne-50 p-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-onyx-400">
                  Total Value
                </p>
                <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-champagne-800 via-champagne-700 to-onyx-800">
                  ₹
                  {totalPrice.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="text-xs text-onyx-400 text-right">
                <p>{formData.caratWeight} ct × ₹{formData.pricePerCarat}/ct</p>
                <p>{formData.quantityPieces} piece(s)</p>
              </div>
            </div>

            {/* Billing & Payment block — reused from Receive Metal */}
            {isPurchase && (
              <BillingPaymentCard
                formData={formData as any}
                setFormData={setFormData as any}
                totalPrice={totalPrice}
                vendorHasGstin={Boolean((selectedVendor as any)?.gstNumber)}
                vendorCredit={(selectedVendor as any)?.creditBalance ?? 0}
                vendorName={selectedVendor?.name ?? null}
                errors={errors}
              />
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-champagne-200">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={save.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>

      {showErrorModal && Object.keys(errors).length > 0 && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowErrorModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-accent-ruby mb-2">
              Please fix the following
            </h3>
            <ul className="text-sm text-onyx-700 space-y-1 list-disc pl-5">
              {Object.entries(errors)
                .filter(([, v]) => Boolean(v))
                .map(([k, v]) => (
                  <li key={k}>{v as string}</li>
                ))}
            </ul>
            <div className="mt-4 flex justify-end">
              <Button variant="primary" onClick={() => setShowErrorModal(false)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
