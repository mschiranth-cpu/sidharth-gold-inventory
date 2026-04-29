/**
 * ============================================
 * SETTLE PAYMENT MODAL
 * ============================================
 * Shared modal used by MetalTransactionsPage and VendorDetailPage to record
 * a partial settlement against a billable PURCHASE metal transaction.
 *
 * Server append-only ledger semantics: client sends a delta `amount`; the
 * backend writes a metal_payments row and updates the parent transaction's
 * cached `amountPaid` + `paymentStatus`.
 */

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMetalPayments,
  settleMetalPayment,
  type MetalTransaction,
  type MetalPayment,
} from '../services/metal.service';
import {
  getDiamondPayments,
  settleDiamondPayment,
  type DiamondTransaction,
  type DiamondPayment,
} from '../services/diamond.service';
import {
  getRealStonePayments,
  settleRealStonePayment,
  getStonePacketPayments,
  settleStonePacketPayment,
  type RealStoneTransaction,
  type RealStonePayment,
  type StonePacketTransaction,
  type StonePacketPayment,
} from '../services/stone.service';
import Button from './common/Button';
import {
  combineDateWithCurrentIstTimeISO,
  formatIstDate,
} from '../lib/dateUtils';

type Domain = 'metal' | 'diamond' | 'realStone' | 'stonePacket';

type AnyTxn =
  | MetalTransaction
  | DiamondTransaction
  | RealStoneTransaction
  | StonePacketTransaction;

type AnyPayment =
  | MetalPayment
  | DiamondPayment
  | RealStonePayment
  | StonePacketPayment;

const DOMAIN_CONFIG = {
  metal: {
    paymentsKey: (id: string) => ['metal-payments', id],
    txnsKey: ['metal-transactions'],
    fetch: getMetalPayments,
    settle: settleMetalPayment,
  },
  diamond: {
    paymentsKey: (id: string) => ['diamond-payments', id],
    txnsKey: ['diamond-transactions'],
    fetch: getDiamondPayments,
    settle: settleDiamondPayment,
  },
  realStone: {
    paymentsKey: (id: string) => ['real-stone-payments', id],
    txnsKey: ['real-stone-transactions'],
    fetch: getRealStonePayments,
    settle: settleRealStonePayment,
  },
  stonePacket: {
    paymentsKey: (id: string) => ['stone-packet-payments', id],
    txnsKey: ['stone-packet-transactions'],
    fetch: getStonePacketPayments,
    settle: settleStonePacketPayment,
  },
} as const;

interface Props {
  transaction: AnyTxn;
  onClose: () => void;
  onSettled?: () => void;
  /** REQUIRED: selects API + cache keys. No default — prevents silent mis-routing. */
  domain: Domain;
}

export default function SettlePaymentModal({ transaction, onClose, onSettled, domain }: Props) {
  const queryClient = useQueryClient();
  const txnId = transaction.id;
  const totalValue = transaction.totalValue ?? 0;
  const cfg = DOMAIN_CONFIG[domain];
  const paymentsQueryKey = cfg.paymentsKey(txnId);
  const txnsQueryKey = cfg.txnsKey;
  const fetchPayments = (): Promise<AnyPayment[]> =>
    cfg.fetch(txnId) as Promise<AnyPayment[]>;

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<AnyPayment[]>({
    queryKey: paymentsQueryKey,
    queryFn: fetchPayments,
  });

  const ledgerSum = useMemo(() => payments.reduce((s, p) => s + p.amount, 0), [payments]);
  // Mirrors backend Math.max fallback so the display is consistent before the first ledger row.
  const previouslyPaid = Math.max(ledgerSum, transaction.amountPaid ?? 0);
  const balanceDue = Math.max(totalValue - previouslyPaid, 0);

  const [amount, setAmount] = useState<number>(0);
  const [amountTouched, setAmountTouched] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'NEFT' | 'BOTH'>('CASH');
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [neftAmount, setNeftAmount] = useState<number>(0);
  const [neftUtr, setNeftUtr] = useState('');
  const [neftBank, setNeftBank] = useState('');
  const [neftDate, setNeftDate] = useState('');
  const [notes, setNotes] = useState('');
  const [creditApplied, setCreditApplied] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const vendorCredit = transaction.vendor?.creditBalance ?? 0;
  const maxApplicableCredit = Math.max(0, Math.min(vendorCredit, balanceDue - amount));

  // Auto-default to balance due, but ONLY until the user has touched the
  // amount input. Otherwise refetching the ledger would clobber a deliberate
  // 0 or partial value the user typed.
  useEffect(() => {
    if (amountTouched) return;
    if (balanceDue > 0) setAmount(balanceDue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balanceDue, amountTouched]);

  const settle = useMutation<AnyTxn, unknown, void>({
    mutationFn: () => {
      const payload = {
        amount,
        paymentMode,
        cashAmount: paymentMode === 'BOTH' ? cashAmount : undefined,
        neftAmount: paymentMode === 'BOTH' ? neftAmount : undefined,
        neftUtr: neftUtr || undefined,
        neftBank: neftBank || undefined,
        neftDate: neftDate ? combineDateWithCurrentIstTimeISO(neftDate) : undefined,
        notes: notes || undefined,
        creditApplied: creditApplied > 0 ? creditApplied : undefined,
      };
      return cfg.settle(txnId, payload as any) as Promise<AnyTxn>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: txnsQueryKey });
      queryClient.invalidateQueries({ queryKey: paymentsQueryKey });
      queryClient.invalidateQueries({ queryKey: ['vendors-outstanding'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      if (transaction.vendorId) {
        queryClient.invalidateQueries({ queryKey: ['vendor', transaction.vendorId] });
        queryClient.invalidateQueries({ queryKey: ['vendor-transactions', transaction.vendorId] });
        queryClient.invalidateQueries({ queryKey: ['vendor-diamond-transactions', transaction.vendorId] });
        queryClient.invalidateQueries({ queryKey: ['vendor-real-stone-transactions', transaction.vendorId] });
        queryClient.invalidateQueries({ queryKey: ['vendor-stone-packet-transactions', transaction.vendorId] });
        queryClient.invalidateQueries({ queryKey: ['vendor-outstanding', transaction.vendorId] });
      }
      onSettled?.();
      onClose();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to settle payment');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (amount <= 0 && creditApplied <= 0) {
      return setError('Enter an amount or apply vendor credit');
    }
    if (paymentMode === 'BOTH' && Math.abs(cashAmount + neftAmount - amount) > 0.01) {
      return setError(`Cash + NEFT must equal settlement amount (₹${amount.toFixed(2)})`);
    }
    settle.mutate();
  };

  const num = (v: string) => parseFloat(v) || 0;
  const fmt = (n: number) =>
    n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const isNeft = paymentMode === 'NEFT' || paymentMode === 'BOTH';
  const segBtn = (active: boolean) =>
    `flex-1 px-3 py-2 text-sm font-medium rounded-lg transition border ${
      active
        ? 'bg-indigo-600 text-white border-indigo-600'
        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
    }`;
  const inputCls =
    'w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Settle Payment</h2>
              {transaction.vendor && (
                <p className="text-sm text-gray-600 mt-0.5">
                  {transaction.vendor.name} ({transaction.vendor.uniqueCode})
                </p>
              )}
            </div>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
              ×
            </button>
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-xs text-gray-500">Total Value</p>
                <p className="text-lg font-bold text-gray-900">₹{fmt(totalValue)}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-xs text-gray-500">Previously Paid</p>
                <p className="text-lg font-bold text-emerald-900">₹{fmt(previouslyPaid)}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs text-gray-500">Balance Due</p>
                <p className="text-lg font-bold text-amber-900">₹{fmt(balanceDue)}</p>
              </div>
            </div>

            {/* History */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment History</h3>
              {paymentsLoading ? (
                <p className="text-xs text-gray-500">Loading…</p>
              ) : payments.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No prior settlements.</p>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-600">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Date</th>
                        <th className="px-3 py-2 text-right font-medium">Amount</th>
                        <th className="px-3 py-2 text-left font-medium">Mode</th>
                        <th className="px-3 py-2 text-left font-medium">Credit</th>
                        <th className="px-3 py-2 text-left font-medium">By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-t border-gray-100">
                          <td className="px-3 py-2 text-gray-700">
                            {formatIstDate(p.recordedAt)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-gray-900">
                            ₹{fmt(p.amount)}
                          </td>
                          <td className="px-3 py-2 text-gray-700">{p.paymentMode}</td>
                          <td className="px-3 py-2 text-xs">
                            {p.creditApplied || p.creditGenerated ? (
                              <div className="space-y-0.5">
                                {p.creditApplied ? (
                                  <span className="block text-indigo-700">-₹{fmt(p.creditApplied)}</span>
                                ) : null}
                                {p.creditGenerated ? (
                                  <span className="block text-emerald-700">+₹{fmt(p.creditGenerated)}</span>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-700">{p.recordedBy?.name ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-4">
              {/* Vendor credit panel */}
              {vendorCredit > 0.01 && (
                <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
                  <div className="text-sm text-emerald-900">
                    Vendor has <span className="font-semibold">₹{fmt(vendorCredit)}</span> in credit.
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={maxApplicableCredit}
                      step="0.01"
                      value={creditApplied || ''}
                      onChange={(e) =>
                        setCreditApplied(Math.min(num(e.target.value), maxApplicableCredit))
                      }
                      placeholder="0"
                      className="w-28 px-2 py-1 rounded border border-emerald-300 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setCreditApplied(maxApplicableCredit)}
                      className="text-xs font-medium text-emerald-700 hover:text-emerald-900 underline"
                    >
                      Apply max
                    </button>
                  </div>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Amount to settle now (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={amount || ''}
                  onChange={(e) => {
                    setAmountTouched(true);
                    setAmount(num(e.target.value));
                  }}
                  className={inputCls}
                />
                {amount + creditApplied > balanceDue + 0.01 && (
                  <p className="text-xs text-emerald-700 mt-1">
                    Over-payment of ₹{fmt(amount + creditApplied - balanceDue)} will be added to vendor credit.
                  </p>
                )}
              </div>

              {/* Payment mode */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Mode</label>
                <div className="flex gap-2">
                  {(['CASH', 'NEFT', 'BOTH'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={segBtn(paymentMode === m)}
                      onClick={() => setPaymentMode(m)}
                    >
                      {m === 'CASH' ? 'Cash' : m === 'NEFT' ? 'NEFT' : 'Both'}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMode === 'BOTH' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cash (₹)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={cashAmount || ''}
                      onChange={(e) => setCashAmount(num(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">NEFT (₹)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={neftAmount || ''}
                      onChange={(e) => setNeftAmount(num(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              {isNeft && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">UTR</label>
                    <input
                      type="text"
                      value={neftUtr}
                      onChange={(e) => setNeftUtr(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bank</label>
                    <input
                      type="text"
                      value={neftBank}
                      onChange={(e) => setNeftBank(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                    <input
                      type="date"
                      value={neftDate}
                      onChange={(e) => setNeftDate(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={inputCls}
                  placeholder="Optional"
                />
              </div>

              {error && (
                <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={settle.isPending}>
              Record Settlement
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
