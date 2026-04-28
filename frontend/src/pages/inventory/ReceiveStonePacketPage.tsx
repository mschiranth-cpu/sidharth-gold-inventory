/**
 * ============================================
 * RECEIVE STONE PACKET PAGE
 * ============================================
 * PURCHASE entry — multi-item invoice from a single vendor for stone packets
 * (synthetic / semi-precious bulk stones — CZ, Kundan, Polki, AD, etc.).
 * Mirror of ReceiveRealStonePage with packet-specific fields.
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
import { createStonePacketPurchase } from '../../services/stone.service';
import { type Vendor } from '../../services/vendor.service';
import Button from '../../components/common/Button';
import { VendorSelector, BillingPaymentCard } from './ReceiveMetalPage';

const STONE_TYPES = [
  'CZ', 'KUNDAN', 'POLKI', 'AMERICAN_DIAMOND', 'CRYSTAL', 'GLASS',
  'MOISSANITE', 'SWAROVSKI', 'PEARL_IMITATION', 'OTHER',
];
const SHAPES = [
  'ROUND', 'OVAL', 'PEAR', 'SQUARE', 'RECTANGLE', 'MARQUISE',
  'HEART', 'BAGUETTE', 'CABOCHON', 'ASSORTED', 'OTHER',
];
const QUALITIES = ['', 'AAA', 'AA', 'A', 'B', 'COMMERCIAL'];
const UNITS = ['CARAT', 'GRAM', 'PIECE'];

interface PurchaseItem {
  packetNumber: string;
  stoneType: string;
  shape: string;
  size: string;
  color: string;
  quality: string;
  totalPieces: number;
  totalWeight: number;
  unit: string;
  pricePerUnit: number;
  reorderLevel?: number;
  notes?: string;
}

const blankItem = (): PurchaseItem => ({
  packetNumber: '',
  stoneType: 'CZ',
  shape: 'ROUND',
  size: '',
  color: '',
  quality: '',
  totalPieces: 0,
  totalWeight: 0,
  unit: 'CARAT',
  pricePerUnit: 0,
});

export default function ReceiveStonePacketPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
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
    () => items.reduce((sum, it) => sum + (it.totalWeight || 0) * (it.pricePerUnit || 0), 0),
    [items]
  );

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
  }, [formData.cashAmount, formData.neftAmount, formData.paymentMode, totalPrice]);

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
          !it.packetNumber ||
          !it.stoneType ||
          !it.shape ||
          !it.totalWeight ||
          it.totalWeight <= 0 ||
          !it.pricePerUnit ||
          it.pricePerUnit <= 0 ||
          !it.unit
      )
    ) {
      e.items =
        'Each item needs packet number, stone type, shape, total weight, unit, and price/unit';
    }
    if (totalPrice > 0) {
      if (!formData.paymentMode) e.paymentMode = 'Payment mode required';
      if (!formData.paymentStatus) e.paymentStatus = 'Payment status required';
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
      createStonePacketPurchase({
        vendorId: selectedVendor!.id,
        referenceNumber: referenceNumber || undefined,
        transactionDate: transactionDate ? new Date(transactionDate).toISOString() : undefined,
        items: items.map((it) => ({
          ...it,
          totalValue: it.totalWeight * it.pricePerUnit,
        })),
        ...(totalPrice > 0
          ? {
              isBillable: formData.isBillable,
              paymentMode: formData.paymentMode,
              paymentStatus: formData.paymentStatus,
              amountPaid: formData.amountPaid,
              cashAmount: formData.paymentMode === 'BOTH' ? formData.cashAmount : undefined,
              neftAmount: formData.paymentMode === 'BOTH' ? formData.neftAmount : undefined,
              neftUtr: formData.neftUtr || undefined,
              neftBank: formData.neftBank || undefined,
              neftDate: formData.neftDate ? new Date(formData.neftDate).toISOString() : undefined,
              creditApplied: formData.creditApplied > 0 ? formData.creditApplied : undefined,
            }
          : {}),
      } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stone-packet-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['stone-packet-stock-summary'] });
      queryClient.invalidateQueries({ queryKey: ['stone-packets'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      navigate('/app/inventory/stone-packets/transactions');
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
        <div className="rounded-3xl bg-gradient-to-br from-onyx-900 via-onyx-800 to-onyx-900 p-6 text-white shadow-xl">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-pearl-200 hover:text-white text-sm mb-3"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Back
          </button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ArrowDownTrayIcon className="h-8 w-8 text-champagne-300" />
            Receive Stone Packets
          </h1>
          <p className="text-pearl-200 text-sm mt-1">
            Multi-item invoice — record one or more packet receipts (CZ, Kundan, Polki, AD…) from a vendor.
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

          <div className="rounded-2xl bg-white border border-champagne-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-onyx-900">Invoice Details</h3>
                <p className="text-xs text-onyx-400">Reference number is optional but recommended.</p>
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
                <label className="block text-sm font-semibold text-onyx-700 mb-1">Transaction Date</label>
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

          <div className="rounded-2xl bg-white border border-champagne-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-onyx-900">Packet Items</h3>
                <p className="text-xs text-onyx-400">Add one row per packet.</p>
              </div>
              <Button type="button" variant="ghost" onClick={addItem}>
                <PlusIcon className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>

            {errors.items && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-accent-ruby/10 text-accent-ruby text-sm">
                {errors.items}
              </div>
            )}

            <div className="space-y-3">
              {items.map((it, idx) => {
                const itemTotal = (it.totalWeight || 0) * (it.pricePerUnit || 0);
                return (
                  <div key={idx} className="rounded-xl border border-champagne-200 bg-pearl-50/40 p-4">
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
                        <label className="block text-xs font-medium text-onyx-600 mb-1">Packet Number</label>
                        <input
                          type="text"
                          value={it.packetNumber}
                          onChange={(e) => updateItem(idx, { packetNumber: e.target.value })}
                          className={inputCls}
                          placeholder="e.g. CZ-001"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-onyx-600 mb-1">Stone Type</label>
                        <select
                          value={it.stoneType}
                          onChange={(e) => updateItem(idx, { stoneType: e.target.value })}
                          className={inputCls}
                        >
                          {STONE_TYPES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-onyx-600 mb-1">Shape</label>
                        <select
                          value={it.shape}
                          onChange={(e) => updateItem(idx, { shape: e.target.value })}
                          className={inputCls}
                        >
                          {SHAPES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-onyx-600 mb-1">Size</label>
                        <input
                          type="text"
                          value={it.size}
                          onChange={(e) => updateItem(idx, { size: e.target.value })}
                          className={inputCls}
                          placeholder="e.g. 2mm / 3x5mm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-onyx-600 mb-1">Color</label>
                        <input
                          type="text"
                          value={it.color}
                          onChange={(e) => updateItem(idx, { color: e.target.value })}
                          className={inputCls}
                          placeholder="e.g. White, Ruby Red"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-onyx-600 mb-1">Quality</label>
                        <select
                          value={it.quality}
                          onChange={(e) => updateItem(idx, { quality: e.target.value })}
                          className={inputCls}
                        >
                          {QUALITIES.map((q) => (
                            <option key={q} value={q}>{q || '—'}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-onyx-600 mb-1">Total Pieces</label>
                        <input
                          type="number"
                          step="1"
                          value={it.totalPieces || ''}
                          onChange={(e) =>
                            updateItem(idx, { totalPieces: parseInt(e.target.value, 10) || 0 })
                          }
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-onyx-600 mb-1">Total Weight</label>
                        <input
                          type="number"
                          step="0.001"
                          value={it.totalWeight || ''}
                          onChange={(e) =>
                            updateItem(idx, { totalWeight: parseFloat(e.target.value) || 0 })
                          }
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-onyx-600 mb-1">Unit</label>
                        <select
                          value={it.unit}
                          onChange={(e) => updateItem(idx, { unit: e.target.value })}
                          className={inputCls}
                        >
                          {UNITS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-onyx-600 mb-1">Price / Unit (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={it.pricePerUnit || ''}
                          onChange={(e) =>
                            updateItem(idx, { pricePerUnit: parseFloat(e.target.value) || 0 })
                          }
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-onyx-600 mb-1">Reorder Level</label>
                        <input
                          type="number"
                          step="0.001"
                          value={it.reorderLevel ?? ''}
                          onChange={(e) =>
                            updateItem(idx, {
                              reorderLevel: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0,
                            })
                          }
                          className={inputCls}
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-onyx-600 mb-1">Item Total</label>
                        <div className="px-3 py-2 rounded-xl bg-white border border-champagne-200 text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-champagne-800 via-champagne-700 to-onyx-800">
                          ₹{itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-end px-4 py-3 rounded-xl bg-gradient-to-r from-pearl-50 via-white to-champagne-50 border border-champagne-200">
              <span className="text-sm text-onyx-500 mr-3">Invoice Total</span>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-champagne-800 via-champagne-700 to-onyx-800">
                ₹{totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

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
              <SparklesIcon className="h-4 w-4 mr-1" /> Record Purchase
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
