/**
 * ============================================
 * EDIT REAL STONE TRANSACTION MODAL
 * ============================================
 * Mirror of EditDiamondTransactionModal for real-stone inventory.
 * Backend reverses old stock + vendor-credit effects in one $transaction,
 * then re-applies new values. Edits blocked server-side if `real_stone_payments`
 * rows exist for this transaction.
 */

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  updateRealStoneTransaction,
  type RealStoneTransaction,
} from '../services/stone.service';
import { getVendor, listVendors, type Vendor } from '../services/vendor.service';
import Button from './common/Button';
import LiveRealStoneRatesCard from './LiveRealStoneRatesCard';
import { VendorSelector, BillingPaymentCard } from '../pages/inventory/ReceiveMetalPage';

interface Props {
  transaction: RealStoneTransaction;
  onClose: () => void;
  onSaved?: () => void;
}

interface FieldErrors {
  vendor?: string;
  stoneType?: string;
  shape?: string;
  color?: string;
  caratWeight?: string;
  pricePerCarat?: string;
  paymentMode?: string;
  paymentStatus?: string;
  amountPaid?: string;
  paymentSplit?: string;
}

const STONE_TYPES = [
  'RUBY',
  'EMERALD',
  'SAPPHIRE',
  'TANZANITE',
  'TOURMALINE',
  'TOPAZ',
  'AMETHYST',
  'AQUAMARINE',
  'GARNET',
  'OPAL',
  'PEARL',
  'OTHER',
];
const SHAPES = [
  'ROUND',
  'OVAL',
  'PEAR',
  'EMERALD',
  'CUSHION',
  'PRINCESS',
  'MARQUISE',
  'HEART',
  'CABOCHON',
  'OTHER',
];
const QUALITIES = ['AAA', 'AA', 'A', 'B', 'COMMERCIAL'];

function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function stripVendorTag(notes: string | null | undefined): string {
  if (!notes) return '';
  return notes.replace(/^\[Vendor:[^\]]*\]\n?/, '').trim();
}

export default function EditRealStoneTransactionModal({
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
  const txnTotal = txn.totalValue ?? ((txn.caratWeight ?? 0) * (txn.pricePerCarat ?? 0));
  const isLegacyRow = !txn.paymentStatus;
  const hydratedAmountPaid = isLegacyRow ? txnTotal : (txn.amountPaid ?? 0);
  const hydratedStatus = isLegacyRow ? 'COMPLETE' : (txn.paymentStatus ?? 'COMPLETE');
  const hydratedMode = txn.paymentMode ?? 'CASH';

  const [formData, setFormData] = useState({
    stoneType: txn.stone?.stoneType ?? '',
    shape: txn.stone?.shape ?? '',
    color: txn.stone?.color ?? '',
    clarity: txn.stone?.clarity ?? '',
    caratWeight: txn.caratWeight ?? 0,
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
    if (!formData.stoneType) e.stoneType = 'Stone type is required';
    if (!formData.shape) e.shape = 'Shape is required';
    if (!formData.color) e.color = 'Color is required';
    if (!formData.caratWeight || formData.caratWeight <= 0)
      e.caratWeight = 'Carat weight must be greater than 0';
    if (isPurchase && (!formData.pricePerCarat || formData.pricePerCarat <= 0))
      e.pricePerCarat = 'Price per carat is required';
    if (isPurchase && totalPrice > 0) {
      if (!formData.paymentMode) e.paymentMode = 'Payment Mode is required';
      if (!formData.paymentStatus) e.paymentStatus = 'Payment Status is required';
      if (formData.paymentStatus === 'HALF' && formData.paymentMode !== 'BOTH') {
        if (formData.amountPaid <= 0) e.amountPaid = 'Amount Paid must be greater than 0';
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
      const isNeft = formData.paymentMode === 'NEFT' || formData.paymentMode === 'BOTH';

      const payload: Record<string, unknown> = {
        stoneType: formData.stoneType,
        shape: formData.shape,
        color: formData.color,
        clarity: formData.clarity || undefined,
        caratWeight: formData.caratWeight,
        pricePerCarat: formData.pricePerCarat,
        vendorId: selectedVendor?.id ?? null,
        notes: composedNotes,
        referenceNumber: formData.referenceNumber,
        isBillable: isPurchase ? formData.isBillable : false,
        transactionDate: formData.transactionDate
          ? new Date(formData.transactionDate).toISOString()
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
            ? new Date(formData.neftDate).toISOString()
            : '';
        }
      }
      return updateRealStoneTransaction(transaction.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-stone-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['real-stone-stock-summary'] });
      queryClient.invalidateQueries({ queryKey: ['real-stones'] });
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
            <h2 className="text-xl font-bold text-onyx-900">Edit Real Stone Transaction</h2>
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
            <LiveRealStoneRatesCard
              selectedStoneType={formData.stoneType}
              selectedQuality={formData.clarity}
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
                  Stone Type<Req />
                </label>
                <select
                  value={formData.stoneType}
                  onChange={(e) => setFormData({ ...formData, stoneType: e.target.value })}
                  className={inputClass(errors.stoneType)}
                >
                  <option value="">— select —</option>
                  {STONE_TYPES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

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
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-onyx-700 mb-2">
                  Color<Req />
                </label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className={inputClass(errors.color)}
                  placeholder="e.g. Pigeon Blood"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-onyx-700 mb-2">
                  Quality / Clarity
                </label>
                <select
                  value={formData.clarity}
                  onChange={(e) => setFormData({ ...formData, clarity: e.target.value })}
                  className={inputClass()}
                >
                  <option value="">— optional —</option>
                  {QUALITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
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
                  max={new Date().toISOString().slice(0, 10)}
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

            <div className="rounded-2xl border border-champagne-200 bg-gradient-to-r from-pearl-50 via-white to-champagne-50 p-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-onyx-400">Total Value</p>
                <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-champagne-800 via-champagne-700 to-onyx-800">
                  ₹{totalPrice.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="text-xs text-onyx-400 text-right">
                <p>{formData.caratWeight} ct × ₹{formData.pricePerCarat}/ct</p>
              </div>
            </div>

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
