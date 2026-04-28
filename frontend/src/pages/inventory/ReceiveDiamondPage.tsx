/**
 * ============================================
 * RECEIVE DIAMOND PAGE
 * ============================================
 * PURCHASE entry — multi-item invoice from a single vendor.
 * Mirrors ReceiveMetalPage's vendor-aware billing flow.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  TrashIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { createDiamondPurchase } from '../../services/diamond.service';
import { type Vendor } from '../../services/vendor.service';
import Button from '../../components/common/Button';
import LiveDiamondRatesCard from '../../components/LiveDiamondRatesCard';
import { VendorSelector, BillingPaymentCard } from './ReceiveMetalPage';

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
const CATEGORIES = ['SOLITAIRE', 'LOOSE'] as const;

interface PurchaseItem {
  category: 'SOLITAIRE' | 'LOOSE';
  shape: string;
  color: string;
  clarity: string;
  caratWeight: number;
  totalPieces: number;
  pricePerCarat: number;
  certNumber?: string;
  certificationLab?: string;
  notes?: string;
}

const blankItem = (): PurchaseItem => ({
  category: 'SOLITAIRE',
  shape: 'ROUND',
  color: 'G',
  clarity: 'VS1',
  caratWeight: 0,
  totalPieces: 1,
  pricePerCarat: 0,
});

export default function ReceiveDiamondPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [items, setItems] = useState<PurchaseItem[]>([blankItem()]);
  const [formData, setFormData] = useState({
    isBillable: true,
    paymentMode: 'CASH',
    paymentStatus: 'COMPLETE',
    amountPaid: 0,
    cashAmount: 0,
    neftAmount: 0,
    neftUtr: '',
    neftBank: '',
    neftDate: '',
    creditApplied: 0,
  });
  const [errors, setErrors] = useState<{
    vendor?: string;
    items?: string;
    paymentMode?: string;
    paymentStatus?: string;
    amountPaid?: string;
    paymentSplit?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const totalPrice = useMemo(
    () =>
      items.reduce(
        (sum, it) => sum + (it.caratWeight || 0) * (it.pricePerCarat || 0),
        0
      ),
    [items]
  );

  // Mirror ReceiveMetalPage: keep `amountPaid` in sync with the chosen status
  // for CASH/NEFT modes. HALF leaves it alone (user-controlled in CASH/NEFT;
  // derived from the split in BOTH — see next effect).
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

  // BOTH mode: cash + neft inputs ARE the payment, so derive status +
  // amountPaid from their sum.
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

  const updateItem = (idx: number, patch: Partial<PurchaseItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const addItem = () => setItems((prev) => [...prev, blankItem()]);
  const removeItem = (idx: number) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  const validate = () => {
    const e: typeof errors = {};
    if (!selectedVendor) e.vendor = 'Vendor is required';
    if (
      items.length === 0 ||
      items.some(
        (it) =>
          !it.shape ||
          !it.color ||
          !it.clarity ||
          !it.caratWeight ||
          it.caratWeight <= 0 ||
          !it.pricePerCarat ||
          it.pricePerCarat <= 0
      )
    ) {
      e.items = 'Each item needs shape, color, clarity, carat weight, and price/ct';
    }
    if (totalPrice > 0) {
      if (!formData.paymentMode) e.paymentMode = 'Payment mode required';
      if (!formData.paymentStatus) e.paymentStatus = 'Payment status required';
      // In BOTH mode the split drives amountPaid + status (see effect above);
      // skip the explicit "amountPaid > 0" gate so partial splits are OK.
      if (
        formData.paymentStatus === 'HALF' &&
        formData.paymentMode !== 'BOTH' &&
        formData.amountPaid <= 0
      ) {
        e.amountPaid = 'Amount paid must be > 0';
      }
    }
    return e;
  };

  const submit = useMutation({
    mutationFn: () =>
      createDiamondPurchase({
        vendorId: selectedVendor!.id,
        referenceNumber: referenceNumber || undefined,
        transactionDate: transactionDate
          ? new Date(transactionDate).toISOString()
          : undefined,
        items: items.map((it) => ({
          ...it,
          totalValue: it.caratWeight * it.pricePerCarat,
          // Per-item billing block — server will distribute amountPaid
          // proportionally; we only attach billing on the FIRST item to avoid
          // double-counting the invoice-level payment.
        })),
        // Invoice-level billing
        ...(totalPrice > 0
          ? {
              isBillable: formData.isBillable,
              paymentMode: formData.paymentMode,
              paymentStatus: formData.paymentStatus,
              amountPaid: formData.amountPaid,
              cashAmount:
                formData.paymentMode === 'BOTH' ? formData.cashAmount : undefined,
              neftAmount:
                formData.paymentMode === 'BOTH' ? formData.neftAmount : undefined,
              neftUtr: formData.neftUtr || undefined,
              neftBank: formData.neftBank || undefined,
              neftDate: formData.neftDate
                ? new Date(formData.neftDate).toISOString()
                : undefined,
              creditApplied:
                formData.creditApplied > 0 ? formData.creditApplied : undefined,
            }
          : {}),
      } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diamond-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['diamond-stock-summary'] });
      queryClient.invalidateQueries({ queryKey: ['diamonds'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      navigate('/app/inventory/diamonds/transactions');
    },
    onError: (e: any) => {
      setServerError(
        e?.response?.data?.error?.message || e?.message || 'Failed to record purchase'
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    setServerError(null);
    if (Object.keys(v).length > 0) return;
    submit.mutate();
  };

  const inputCls =
    'w-full px-3 py-2 rounded-xl border border-champagne-300 focus:ring-2 focus:ring-champagne-500 focus:border-transparent text-sm';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl via-white to-champagne-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-br from-onyx-900 via-onyx-800 to-onyx-900 p-6 text-white shadow-xl">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-pearl-200 hover:text-white text-sm mb-3"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ArrowDownTrayIcon className="h-8 w-8 text-champagne-300" />
            Receive Diamonds
          </h1>
          <p className="text-pearl-200 text-sm mt-1">
            Multi-item invoice — record one or more diamond receipts from a vendor.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <VendorSelector
            selected={selectedVendor}
            onSelect={(v) => {
              setSelectedVendor(v);
              if (v) setErrors((prev) => ({ ...prev, vendor: undefined }));
            }}
            error={errors.vendor}
          />

          <LiveDiamondRatesCard
            selectedShape={items[0]?.shape}
            selectedColor={items[0]?.color}
            selectedClarity={items[0]?.clarity}
            selectedCarat={items[0]?.caratWeight}
            onUseRate={(rate) => updateItem(0, { pricePerCarat: rate })}
          />

          <div className="rounded-2xl bg-white border border-champagne-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-onyx-900">Invoice Details</h3>
                <p className="text-xs text-onyx-400">
                  Reference number is optional but recommended.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-onyx-700 mb-1">
                  Reference / Invoice Number
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. INV-2026-001"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-onyx-700 mb-1">
                  Transaction Date
                </label>
                <input
                  type="date"
                  value={transactionDate}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="rounded-2xl bg-white border border-champagne-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-onyx-900">Diamond Items</h3>
                <p className="text-xs text-onyx-400">
                  Add a row per stone (Solitaire) or per parcel (Loose).
                </p>
              </div>
              <Button type="button" variant="ghost" onClick={addItem}>
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            {errors.items && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-accent-ruby/10 text-accent-ruby text-sm">
                {errors.items}
              </div>
            )}

            <div className="space-y-3">
              {items.map((it, idx) => {
                const itemTotal = (it.caratWeight || 0) * (it.pricePerCarat || 0);
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-champagne-200 bg-pearl-50/40 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-onyx-500 uppercase tracking-wide">
                        Item #{idx + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-accent-ruby hover:text-accent-ruby/80"
                          aria-label="Remove item"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-onyx-600 mb-1">
                          Category
                        </label>
                        <select
                          value={it.category}
                          onChange={(e) => {
                            const next = e.target.value as PurchaseItem['category'];
                            updateItem(idx, {
                              category: next,
                              // Solitaires are always 1 piece — keep state consistent.
                              ...(next === 'SOLITAIRE' ? { totalPieces: 1 } : {}),
                            });
                          }}
                          className={inputCls}
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-onyx-600 mb-1">
                          Shape
                        </label>
                        <select
                          value={it.shape}
                          onChange={(e) => updateItem(idx, { shape: e.target.value })}
                          className={inputCls}
                        >
                          {SHAPES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-onyx-600 mb-1">
                          Color
                        </label>
                        <select
                          value={it.color}
                          onChange={(e) => updateItem(idx, { color: e.target.value })}
                          className={inputCls}
                        >
                          {COLORS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-onyx-600 mb-1">
                          Clarity
                        </label>
                        <select
                          value={it.clarity}
                          onChange={(e) => updateItem(idx, { clarity: e.target.value })}
                          className={inputCls}
                        >
                          {CLARITIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-onyx-600 mb-1">
                          Carat Weight
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          value={it.caratWeight || ''}
                          onChange={(e) =>
                            updateItem(idx, {
                              caratWeight: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={inputCls}
                        />
                      </div>
                      {it.category === 'LOOSE' ? (
                        <div>
                          <label className="block text-xs font-medium text-onyx-600 mb-1">
                            Total Pieces
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={it.totalPieces || ''}
                            onChange={(e) =>
                              updateItem(idx, {
                                totalPieces: parseInt(e.target.value) || 1,
                              })
                            }
                            className={inputCls}
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-medium text-onyx-600 mb-1">
                            Pieces
                          </label>
                          <div className="px-3 py-2 rounded-xl border border-champagne-200 bg-champagne-50/50 text-sm text-onyx-500">
                            1 (solitaire)
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-onyx-600 mb-1">
                          Price / Carat (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={it.pricePerCarat || ''}
                          onChange={(e) =>
                            updateItem(idx, {
                              pricePerCarat: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-onyx-600 mb-1">
                          Item Total
                        </label>
                        <div className="px-3 py-2 rounded-xl bg-white border border-champagne-200 text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-champagne-800 via-champagne-700 to-onyx-800">
                          ₹
                          {itemTotal.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-onyx-600 mb-1">
                          Cert Number
                        </label>
                        <input
                          type="text"
                          value={it.certNumber || ''}
                          onChange={(e) =>
                            updateItem(idx, { certNumber: e.target.value })
                          }
                          className={inputCls}
                          placeholder="GIA / IGI / HRD"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-onyx-600 mb-1">
                          Lab
                        </label>
                        <input
                          type="text"
                          value={it.certificationLab || ''}
                          onChange={(e) =>
                            updateItem(idx, { certificationLab: e.target.value })
                          }
                          className={inputCls}
                          placeholder="GIA"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-end px-4 py-3 rounded-xl bg-gradient-to-r from-pearl-50 via-white to-champagne-50 border border-champagne-200">
              <span className="text-sm text-onyx-500 mr-3">Invoice Total</span>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-champagne-800 via-champagne-700 to-onyx-800">
                ₹
                {totalPrice.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Billing */}
          {totalPrice > 0 && (
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

          {serverError && (
            <div className="px-4 py-3 rounded-xl bg-accent-ruby/10 border border-accent-ruby/30 text-accent-ruby text-sm">
              {serverError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submit.isPending}>
              <SparklesIcon className="h-4 w-4 mr-1" />
              Record Purchase
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
