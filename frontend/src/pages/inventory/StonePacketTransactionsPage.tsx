/**
 * ============================================
 * STONE PACKET TRANSACTIONS PAGE
 * ============================================
 * Full ledger view of every stone-packet transaction (PURCHASE, ISSUE,
 * RETURN, TRANSFER, ADJUSTMENT) with filters, settlement, edit, delete,
 * and Excel export. Mirrors RealStoneTransactionsPage in structure but
 * displays quantity+unit instead of carat.
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  ArrowsRightLeftIcon,
  CurrencyRupeeIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  deleteStonePacketTransaction,
  exportStonePacketTransactionsXlsx,
  getAllStonePacketTransactions,
  type StonePacketTransaction,
} from '../../services/stone.service';
import Button from '../../components/common/Button';
import SettlePaymentModal from '../../components/SettlePaymentModal';
import EditStonePacketTransactionModal from '../../components/EditStonePacketTransactionModal';

const TXN_META: Record<string, { label: string; cls: string }> = {
  PURCHASE: { label: 'Purchase', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ISSUE_TO_DEPARTMENT: { label: 'Issue', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  RETURN_FROM_DEPARTMENT: { label: 'Return', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  TRANSFER: { label: 'Transfer', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  ADJUSTMENT: { label: 'Adjustment', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const PAYMENT_STATUS_CLS: Record<string, string> = {
  COMPLETE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  HALF: 'bg-amber-50 text-amber-700 border-amber-200',
  PENDING: 'bg-rose-50 text-rose-700 border-rose-200',
};

const QUALITY_CARDS: { code: string; label: string; icon: string; accent: string }[] = [
  { code: 'AAA', label: 'AAA', icon: '★', accent: 'from-amber-400 to-amber-600' },
  { code: 'AA', label: 'AA', icon: '◈', accent: 'from-emerald-400 to-emerald-600' },
  { code: 'A', label: 'A', icon: '◇', accent: 'from-sky-400 to-sky-600' },
  { code: 'B', label: 'B', icon: '◊', accent: 'from-violet-400 to-violet-600' },
];

const fmt = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n: number) =>
  n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function StonePacketTransactionsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<{
    transactionType?: string;
    isBillable?: boolean;
    startDate?: string;
    endDate?: string;
    quality?: string;
  }>({});
  const [search, setSearch] = useState('');
  const [settleTxn, setSettleTxn] = useState<StonePacketTransaction | null>(null);
  const [editTxn, setEditTxn] = useState<StonePacketTransaction | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<StonePacketTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: txns = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['stone-packet-transactions', filters],
    queryFn: () => getAllStonePacketTransactions(filters),
  });

  const visibleTxns = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (txns as StonePacketTransaction[]).filter((t) => {
      if (filters.quality && t.packet?.quality !== filters.quality) return false;
      if (!q) return true;
      const hay = [
        t.referenceNumber,
        t.vendor?.name,
        t.vendor?.uniqueCode,
        t.packet?.packetNumber,
        t.packet?.stoneType,
        t.notes,
        t.createdBy?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [txns, search, filters.quality]);

  const totals = useMemo(() => {
    const purchases = visibleTxns.filter((t) => t.transactionType === 'PURCHASE');
    const totalValue = purchases.reduce((s, t) => s + (t.totalValue ?? 0), 0);
    const totalPaid = purchases.reduce((s, t) => s + (t.amountPaid ?? 0), 0);
    const byQuality = new Map<string, { count: number; qty: number; value: number }>();
    for (const t of visibleTxns) {
      const q = t.packet?.quality;
      if (!q) continue;
      const cur = byQuality.get(q) ?? { count: 0, qty: 0, value: 0 };
      cur.count += 1;
      cur.qty += t.quantity ?? 0;
      cur.value += t.totalValue ?? 0;
      byQuality.set(q, cur);
    }
    return {
      txnCount: visibleTxns.length,
      purchaseCount: purchases.length,
      totalValue,
      totalPaid,
      outstanding: Math.max(totalValue - totalPaid, 0),
      byQuality: Object.fromEntries(byQuality),
    };
  }, [visibleTxns]);

  const hasActiveFilters = Boolean(
    search ||
      filters.transactionType ||
      filters.isBillable !== undefined ||
      filters.startDate ||
      filters.endDate ||
      filters.quality
  );

  const clearAllFilters = () => {
    setSearch('');
    setFilters({});
  };

  const del = useMutation({
    mutationFn: (id: string) => deleteStonePacketTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stone-packet-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['stone-packets'] });
      setConfirmDelete(null);
    },
    onError: (e: any) =>
      setError(e?.response?.data?.error?.message || e?.message || 'Failed to delete'),
  });

  const handleExport = async () => {
    try {
      const blob = await exportStonePacketTransactionsXlsx(filters as any);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stone-packet-transactions-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message || 'Failed to export');
    }
  };

  return (
    <div className="p-6 bg-gradient-to-b from-pearl to-white min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-champagne-800 via-champagne-700 to-onyx-800 bg-clip-text text-transparent">
              Stone Packet Transactions
            </h1>
            <p className="text-onyx-500 mt-1">
              {totals.txnCount} of {(txns as StonePacketTransaction[]).length} transactions
              {hasActiveFilters && ' (filtered)'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/app/inventory/stone-packets/receive">
              <Button variant="primary">
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" /> Receive
              </Button>
            </Link>
            <Link to="/app/inventory/stone-packets/issue">
              <Button variant="secondary">
                <ArrowUpTrayIcon className="h-4 w-4 mr-1" /> Issue
              </Button>
            </Link>
            <Link to="/app/inventory/stone-packets/transfer">
              <Button variant="ghost">
                <ArrowsRightLeftIcon className="h-4 w-4 mr-1" /> Transfer
              </Button>
            </Link>
            <Button type="button" variant="secondary" onClick={handleExport}>
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" /> Export Excel
            </Button>
            <Link to="/app/inventory/stone-packets">
              <Button variant="secondary">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <SummaryCard
            label="Transactions"
            value={totals.txnCount.toString()}
            sub={`${totals.purchaseCount} purchases`}
            accent="from-champagne-700 to-onyx-800"
            icon="📋"
          />
          <SummaryCard
            label="Purchase Value"
            value={`₹${fmtInt(totals.totalValue)}`}
            sub={`Paid ₹${fmtInt(totals.totalPaid)}`}
            accent="from-accent-emerald to-accent-emerald/85"
            icon="💎"
          />
          <SummaryCard
            label="Outstanding"
            value={`₹${fmtInt(totals.outstanding)}`}
            accent={
              totals.outstanding > 0
                ? 'from-accent-ruby to-accent-ruby/85'
                : 'from-onyx-300 to-onyx-500'
            }
            icon="⏳"
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {QUALITY_CARDS.map((s) => {
            const data = totals.byQuality[s.code] ?? { count: 0, qty: 0, value: 0 };
            const isActive = filters.quality === s.code;
            return (
              <button
                key={s.code}
                type="button"
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    quality: f.quality === s.code ? undefined : s.code,
                  }))
                }
                className={`text-left rounded-2xl border p-4 transition-all ${
                  isActive
                    ? 'border-champagne-500 bg-champagne-50/60 shadow-md'
                    : 'border-champagne-200 bg-white hover:border-champagne-300 hover:shadow'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${s.accent} flex items-center justify-center text-white text-lg shadow-sm`}>
                    {s.icon}
                  </div>
                  <span className="text-xs text-onyx-400">{data.count} TXNS</span>
                </div>
                <p className="text-xs uppercase tracking-wide text-onyx-500">{s.label}</p>
                <p className="text-xl font-bold text-onyx-800 tabular-nums">
                  {data.qty.toFixed(2)}
                </p>
                <p className="text-xs text-onyx-400">
                  {data.value > 0 ? `₹${fmtInt(data.value)}` : '—'}
                </p>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-champagne-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-onyx-700">Filters</span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-medium text-accent-ruby hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="relative mb-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by reference, vendor, packet #, notes, created by…"
              className="w-full px-4 py-2.5 rounded-xl border border-champagne-300 text-sm focus:ring-2 focus:ring-champagne-500 focus:border-champagne-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-onyx-600 mb-1">Type</label>
              <select
                value={filters.transactionType ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, transactionType: e.target.value || undefined }))
                }
                className="w-full px-3 py-2 rounded-xl border border-champagne-300 text-sm"
              >
                <option value="">All Types</option>
                {Object.keys(TXN_META).map((t) => (
                  <option key={t} value={t}>{TXN_META[t]!.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-onyx-600 mb-1">Tax Class</label>
              <select
                value={
                  filters.isBillable === undefined
                    ? ''
                    : filters.isBillable
                    ? 'BILLABLE'
                    : 'NON_BILLABLE'
                }
                onChange={(e) => {
                  const v = e.target.value;
                  setFilters((f) => ({
                    ...f,
                    isBillable:
                      v === 'BILLABLE' ? true : v === 'NON_BILLABLE' ? false : undefined,
                  }));
                }}
                className="w-full px-3 py-2 rounded-xl border border-champagne-300 text-sm"
              >
                <option value="">All</option>
                <option value="BILLABLE">Billable</option>
                <option value="NON_BILLABLE">Non-Billable</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-onyx-600 mb-1">From</label>
              <input
                type="date"
                value={filters.startDate ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, startDate: e.target.value || undefined }))
                }
                className="w-full px-3 py-2 rounded-xl border border-champagne-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-onyx-600 mb-1">To</label>
              <input
                type="date"
                value={filters.endDate ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, endDate: e.target.value || undefined }))
                }
                className="w-full px-3 py-2 rounded-xl border border-champagne-300 text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button type="button" variant="ghost" onClick={() => refetch()} aria-label="Refresh">
                <ArrowPathIcon className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                <span className="ml-1">Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-accent-ruby/10 border border-accent-ruby/30 text-accent-ruby text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-champagne-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <p className="px-5 py-8 text-sm text-onyx-400">Loading…</p>
          ) : visibleTxns.length === 0 ? (
            <p className="px-5 py-8 text-sm text-onyx-400 italic">
              No transactions match your filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-slate-100 to-slate-50 text-xs text-onyx-600 uppercase">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium">Date</th>
                    <th className="px-3 py-3 text-left font-medium">Type</th>
                    <th className="px-3 py-3 text-left font-medium">Packet</th>
                    <th className="px-3 py-3 text-right font-medium">Qty</th>
                    <th className="px-3 py-3 text-right font-medium">₹/unit</th>
                    <th className="px-3 py-3 text-right font-medium">Total</th>
                    <th className="px-3 py-3 text-left font-medium">Vendor</th>
                    <th className="px-3 py-3 text-left font-medium">Payment</th>
                    <th className="px-3 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTxns.map((t: StonePacketTransaction) => {
                    const meta =
                      TXN_META[t.transactionType] ?? {
                        label: t.transactionType,
                        cls: 'bg-onyx-50 text-onyx-700 border-onyx-200',
                      };
                    const isPurchase = t.transactionType === 'PURCHASE';
                    const balanceDue = Math.max(
                      (t.totalValue ?? 0) - (t.amountPaid ?? 0),
                      0
                    );
                    return (
                      <tr key={t.id} className="border-t border-champagne-100 hover:bg-pearl-50/40">
                        <td className="px-3 py-3 text-onyx-700 whitespace-nowrap">
                          {new Date(t.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-block px-2 py-0.5 text-xs rounded-full border ${meta.cls}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-onyx-800">
                            {t.packet?.packetNumber ?? '—'}
                          </div>
                          <div className="text-xs text-onyx-400">
                            {[t.packet?.stoneType, t.packet?.color, t.packet?.quality]
                              .filter(Boolean)
                              .join(' · ')}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {t.quantity ?? '—'}
                          {t.unit && <span className="text-xs text-onyx-400 ml-1">{t.unit}</span>}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {t.pricePerUnit ? `₹${fmt(t.pricePerUnit)}` : '—'}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums font-semibold text-onyx-800">
                          {t.totalValue ? `₹${fmt(t.totalValue)}` : '—'}
                        </td>
                        <td className="px-3 py-3">
                          {t.vendor ? (
                            <Link
                              to={`/app/vendors/${t.vendor.id}`}
                              className="text-champagne-700 hover:text-champagne-900 underline-offset-2 hover:underline"
                            >
                              {t.vendor.name}
                            </Link>
                          ) : (
                            <span className="text-onyx-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {isPurchase ? (
                            <div className="space-y-1">
                              <span
                                className={`inline-block px-2 py-0.5 text-xs rounded-full border ${
                                  PAYMENT_STATUS_CLS[t.paymentStatus ?? 'PENDING'] ??
                                  'bg-onyx-50 text-onyx-700 border-onyx-200'
                                }`}
                              >
                                {t.paymentStatus ?? 'PENDING'}
                              </span>
                              {balanceDue > 0 && (
                                <div className="text-xs text-onyx-500">
                                  ₹{fmt(balanceDue)} due
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-onyx-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            {isPurchase && balanceDue > 0 && (
                              <button
                                type="button"
                                onClick={() => setSettleTxn(t)}
                                className="px-2.5 py-1 rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-xs font-medium inline-flex items-center gap-1"
                                title="Settle payment"
                              >
                                <CurrencyRupeeIcon className="h-3.5 w-3.5" /> Settle
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setEditTxn(t)}
                              className="px-2.5 py-1 rounded-lg text-champagne-800 bg-champagne-50 hover:bg-champagne-100 text-xs font-medium inline-flex items-center gap-1"
                              title="Edit"
                            >
                              <PencilSquareIcon className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(t)}
                              className="px-2.5 py-1 rounded-lg text-accent-ruby bg-rose-50 hover:bg-rose-100 text-xs font-medium inline-flex items-center gap-1"
                              title="Delete"
                            >
                              <TrashIcon className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {settleTxn && (
        <SettlePaymentModal
          domain="stonePacket"
          transaction={settleTxn as any}
          onClose={() => setSettleTxn(null)}
          onSettled={() =>
            queryClient.invalidateQueries({ queryKey: ['stone-packet-transactions'] })
          }
        />
      )}

      {editTxn && (
        <EditStonePacketTransactionModal
          transaction={editTxn}
          onClose={() => setEditTxn(null)}
          onSaved={() =>
            queryClient.invalidateQueries({ queryKey: ['stone-packet-transactions'] })
          }
        />
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-onyx-900 mb-2">Delete transaction?</h3>
            <p className="text-sm text-onyx-600 mb-4">
              This will reverse the row's stock and vendor-credit effects.
              {confirmDelete.transactionType === 'PURCHASE' && (
                <span className="block mt-2 text-accent-ruby">
                  Note: PURCHASE rows can only be removed by deleting the packet itself
                  (which cascades).
                </span>
              )}
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                isLoading={del.isPending}
                onClick={() => del.mutate(confirmDelete.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-champagne-200 shadow-sm p-4 flex items-center gap-4">
      <div
        className={`h-12 w-12 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white text-xl shadow-md`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-onyx-500">{label}</p>
        <p className="text-2xl font-bold text-onyx-900 tabular-nums truncate">{value}</p>
        {sub && <p className="text-xs text-onyx-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
