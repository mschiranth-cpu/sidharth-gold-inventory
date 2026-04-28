/**
 * ============================================
 * METAL TRANSACTIONS PAGE
 * ============================================
 */

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteMetalTransaction,
  exportMetalTransactionsXlsx,
  getAllMetalTransactions,
  type MetalTransaction,
} from '../../services/metal.service';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import SettlePaymentModal from '../../components/SettlePaymentModal';
import EditMetalTransactionModal from '../../components/EditMetalTransactionModal';
import { useAuth } from '../../contexts/AuthContext';

const SETTLE_ROLES = new Set(['ADMIN', 'OFFICE_STAFF']);
const EDIT_ROLES = new Set(['ADMIN', 'OFFICE_STAFF']);
const DELETE_ROLES = new Set(['ADMIN']);

// Per-metal stat card config — one entry per metal supported in ReceiveMetalPage.
// Order matches the Receive form's dropdown.
const METAL_CARDS: { code: string; label: string; icon: string; accent: string }[] = [
  { code: 'GOLD', label: 'Gold', icon: '🥇', accent: 'from-amber-400 to-amber-500' },
  { code: 'SILVER', label: 'Silver', icon: '🥈', accent: 'from-slate-400 to-slate-500' },
  { code: 'PLATINUM', label: 'Platinum', icon: '💎', accent: 'from-cyan-400 to-sky-500' },
  { code: 'PALLADIUM', label: 'Palladium', icon: '🔷', accent: 'from-violet-500 to-violet-700' },
];

function PaymentBadge({ status }: { status: string }) {
  const cls =
    status === 'COMPLETE'
      ? 'bg-emerald-100 text-accent-emerald'
      : status === 'HALF'
      ? 'bg-amber-100 text-amber-800'
      : 'bg-rose-100 text-accent-ruby';
  const label =
    status === 'COMPLETE'
      ? 'Paid in Full'
      : status === 'HALF'
      ? 'Partially Paid'
      : 'Payment Pending';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
}

// Friendly label for the cached paymentMode column.
function modeLabel(mode: string | null | undefined): string {
  if (!mode) return '';
  if (mode === 'CASH') return 'Cash';
  if (mode === 'NEFT') return 'NEFT';
  if (mode === 'BOTH') return 'Cash + NEFT';
  return mode;
}

function formatINR(n: number): string {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

/**
 * Payment cell.
 *  - Non-PURCHASE rows have no payment concept → "—"
 *  - PURCHASE rows (billable OR non-billable) → meaningful status
 *    (Paid in Full / Partially Paid / Pending) plus payment mode and
 *    amount paid / balance due. Non-billable rows additionally get a
 *    small "Non-billable" tag for tax-classification visibility.
 */
function PaymentCell({
  txn,
  canSettle,
  onSettle,
}: {
  txn: any;
  canSettle: boolean;
  onSettle: () => void;
}) {
  if (txn.transactionType !== 'PURCHASE') {
    return <span className="text-onyx-300">—</span>;
  }

  // Older rows (pre-payment-fields) may have no cached paymentStatus —
  // show the badge as Pending so the user can still settle / edit.
  const status = txn.paymentStatus || 'PENDING';
  const totalValue = txn.totalValue ?? 0;
  const amountPaid = txn.amountPaid ?? 0;
  const balanceDue = Math.max(0, totalValue - amountPaid);
  const mode = modeLabel(txn.paymentMode);
  const isNonBillable = txn.isBillable !== true;

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2 flex-wrap">
        <PaymentBadge status={status} />
        {isNonBillable && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-champagne-100/60 text-onyx-500 whitespace-nowrap">
            Non-billable
          </span>
        )}
        {canSettle && (status === 'HALF' || status === 'PENDING') && (
          <button
            type="button"
            onClick={onSettle}
            className="text-xs font-medium text-champagne-700 hover:text-champagne-900 hover:underline"
          >
            Settle
          </button>
        )}
      </div>
      {/* Detail line — concise, no PII. */}
      <div className="text-xs text-onyx-400">
        {status === 'COMPLETE' && (
          <>
            {mode ? `${mode} • ` : ''}
            {formatINR(totalValue)}
          </>
        )}
        {status === 'HALF' && (
          <>
            {formatINR(amountPaid)} paid · {formatINR(balanceDue)} due
            {mode ? ` · ${mode}` : ''}
          </>
        )}
        {status === 'PENDING' && (
          <>
            {formatINR(balanceDue || totalValue)} due
            {mode ? ` · ${mode}` : ''}
          </>
        )}
      </div>
    </div>
  );
}

export default function MetalTransactionsPage() {
  const { user } = useAuth();
  const canSettle = SETTLE_ROLES.has(String(user?.role ?? ''));
  const canEdit = EDIT_ROLES.has(String(user?.role ?? ''));
  const canDelete = DELETE_ROLES.has(String(user?.role ?? ''));
  const [filters, setFilters] = useState({ metalType: '', transactionType: '' });
  // Client-side filters (the backend list endpoint only supports metalType +
  // transactionType, so we slice the rest in memory).
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>(''); // '', COMPLETE, HALF, PENDING, NON_BILLABLE
  const [vendorFilter, setVendorFilter] = useState<string>(''); // vendor.id or ''
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [settleTxn, setSettleTxn] = useState<MetalTransaction | null>(null);
  const [editTxn, setEditTxn] = useState<MetalTransaction | null>(null);
  const [deleteTxn, setDeleteTxn] = useState<MetalTransaction | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMetalTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metal-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['metal-stock-summary'] });
      queryClient.invalidateQueries({ queryKey: ['metal-stock'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setDeleteTxn(null);
      setDeleteError(null);
    },
    onError: (e: any) => {
      setDeleteError(
        e?.response?.data?.error?.message || e?.message || 'Failed to delete transaction'
      );
    },
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['metal-transactions', filters],
    queryFn: () => getAllMetalTransactions(filters),
  });

  // Apply client-side filters.
  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : null;
    const toTs = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : null;

    return (transactions as any[]).filter((t) => {
      // Date range
      if (fromTs !== null || toTs !== null) {
        const created = new Date(t.createdAt).getTime();
        if (fromTs !== null && created < fromTs) return false;
        if (toTs !== null && created > toTs) return false;
      }
      // Vendor
      if (vendorFilter && t.vendor?.id !== vendorFilter) return false;
      // Payment filter
      if (paymentFilter) {
        if (paymentFilter === 'NON_BILLABLE') {
          if (!(t.transactionType === 'PURCHASE' && t.isBillable !== true)) return false;
        } else if (paymentFilter === 'BILLABLE') {
          if (!(t.transactionType === 'PURCHASE' && t.isBillable === true)) return false;
        } else {
          if (t.transactionType !== 'PURCHASE') return false;
          const status = t.paymentStatus || 'PENDING';
          if (status !== paymentFilter) return false;
        }
      }
      // Free-text search across reference, notes, vendor name/code, createdBy
      if (q) {
        const hay = [
          t.referenceNumber,
          t.notes,
          t.vendor?.name,
          t.vendor?.uniqueCode,
          t.createdBy?.name,
          t.metalType,
          t.transactionType,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, search, paymentFilter, vendorFilter, dateFrom, dateTo]);

  // Selection derived from the current filtered view so toolbar counts and
  // select-all/deselect-all always reflect what the user is looking at.
  const filteredIds = useMemo(
    () => filteredTransactions.map((t: any) => t.id as string),
    [filteredTransactions]
  );
  const selectedInView = useMemo(
    () => filteredIds.filter((id) => selectedIds.has(id)),
    [filteredIds, selectedIds]
  );
  const allFilteredSelected =
    filteredIds.length > 0 && selectedInView.length === filteredIds.length;
  const someFilteredSelected =
    selectedInView.length > 0 && !allFilteredSelected;

  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of filteredIds) next.add(id);
      return next;
    });
  };
  const deselectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of filteredIds) next.delete(id);
      return next;
    });
  };
  const toggleHeaderCheckbox = () => {
    if (allFilteredSelected) deselectAllFiltered();
    else selectAllFiltered();
  };

  // Build the Vendor filter dropdown options from the currently-loaded rows
  // so users only see vendors that actually have transactions.
  const vendorOptions = useMemo(() => {    const map = new Map<string, { id: string; name: string; code: string }>();
    for (const t of transactions as any[]) {
      if (t.vendor?.id && !map.has(t.vendor.id)) {
        map.set(t.vendor.id, {
          id: t.vendor.id,
          name: t.vendor.name,
          code: t.vendor.uniqueCode,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [transactions]);

  // Summary computed over the FILTERED set so users see totals matching what
  // they're actually looking at.
  const summary = useMemo(() => {
    let purchaseValue = 0;
    let pendingDue = 0;
    // Per-metal aggregates (grams + total purchase value), keyed by metal code.
    const byMetal: Record<string, { grams: number; value: number; count: number }> = {
      GOLD: { grams: 0, value: 0, count: 0 },
      SILVER: { grams: 0, value: 0, count: 0 },
      PLATINUM: { grams: 0, value: 0, count: 0 },
      PALLADIUM: { grams: 0, value: 0, count: 0 },
    };
    for (const t of filteredTransactions) {
      if (t.transactionType === 'PURCHASE' && t.totalValue) {
        purchaseValue += t.totalValue;
        // All purchases (billable or not) contribute to vendor outstanding.
        const due = Math.max(0, (t.totalValue ?? 0) - (t.amountPaid ?? 0));
        pendingDue += due;
      }
      const bucket = byMetal[t.metalType];
      if (bucket) {
        bucket.grams += t.grossWeight || 0;
        bucket.value += t.totalValue || 0;
        bucket.count += 1;
      }
    }
    return {
      count: filteredTransactions.length,
      purchaseValue,
      pendingDue,
      byMetal,
    };
  }, [filteredTransactions]);

  const hasActiveFilters =
    filters.metalType ||
    filters.transactionType ||
    paymentFilter ||
    vendorFilter ||
    dateFrom ||
    dateTo ||
    search.trim().length > 0;

  const clearAllFilters = () => {
    setFilters({ metalType: '', transactionType: '' });
    setPaymentFilter('');
    setVendorFilter('');
    setDateFrom('');
    setDateTo('');
    setSearch('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-champagne-700"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-b from-pearl to-white min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-champagne-800 via-champagne-700 to-onyx-800 bg-clip-text text-transparent">
              Metal Transactions
            </h1>
            <p className="text-onyx-500 mt-1">
              {summary.count} of {(transactions as any[]).length} transactions
              {hasActiveFilters && ' (filtered)'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportMenu filters={filters} dateFrom={dateFrom} dateTo={dateTo} />
            <Link to="/app/inventory/metal">
              <Button variant="secondary">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <SummaryCard
            label="Transactions"
            value={summary.count.toString()}
            accent="from-champagne-700 to-onyx-800"
            icon="📋"
          />
          <SummaryCard
            label="Purchase Value"
            value={`₹${summary.purchaseValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            accent="from-accent-emerald to-accent-emerald/85"
            icon="💰"
          />
          <SummaryCard
            label="Pending Due"
            value={`₹${summary.pendingDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            accent={summary.pendingDue > 0 ? 'from-accent-ruby to-accent-ruby/85' : 'from-onyx-300 to-onyx-500'}
            icon="⏳"
          />
        </div>

        {/* Per-metal cards — one per metal supported in the Receive form. */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {METAL_CARDS.map((m) => (
            <MetalCard
              key={m.code}
              code={m.code}
              label={m.label}
              icon={m.icon}
              accent={m.accent}
              grams={summary.byMetal[m.code]?.grams || 0}
              value={summary.byMetal[m.code]?.value || 0}
              count={summary.byMetal[m.code]?.count || 0}
              isActive={filters.metalType === m.code}
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  metalType: f.metalType === m.code ? '' : m.code,
                }))
              }
            />
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-champagne-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-onyx-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-sm font-semibold text-onyx-700">Filters</span>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-medium text-accent-ruby hover:text-accent-ruby hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Search row */}
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-onyx-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by reference, vendor, notes, created by…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-champagne-300 text-sm focus:ring-2 focus:ring-champagne-500 focus:border-champagne-500 outline-none"
            />
          </div>

          {/* Filter selects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <FilterSelect
              label="Metal"
              value={filters.metalType}
              onChange={(v) => setFilters({ ...filters, metalType: v })}
              options={[
                { value: '', label: 'All Metals' },
                { value: 'GOLD', label: 'Gold' },
                { value: 'SILVER', label: 'Silver' },
                { value: 'PLATINUM', label: 'Platinum' },
              ]}
            />
            <FilterSelect
              label="Type"
              value={filters.transactionType}
              onChange={(v) => setFilters({ ...filters, transactionType: v })}
              options={[
                { value: '', label: 'All Types' },
                { value: 'PURCHASE', label: 'Purchase' },
                { value: 'SALE', label: 'Sale' },
                { value: 'ISSUE_TO_DEPARTMENT', label: 'Issue to Dept' },
                { value: 'RETURN_FROM_DEPARTMENT', label: 'Return from Dept' },
                { value: 'WASTAGE', label: 'Wastage' },
              ]}
            />
            <FilterSelect
              label="Vendor"
              value={vendorFilter}
              onChange={setVendorFilter}
              options={[
                { value: '', label: 'All Vendors' },
                ...vendorOptions.map((v) => ({
                  value: v.id,
                  label: `${v.name} (${v.code})`,
                })),
              ]}
            />
            <FilterSelect
              label="Payment"
              value={paymentFilter}
              onChange={setPaymentFilter}
              options={[
                { value: '', label: 'All Payments' },
                { value: 'COMPLETE', label: 'Paid in Full' },
                { value: 'HALF', label: 'Partially Paid' },
                { value: 'PENDING', label: 'Payment Pending' },
                { value: 'BILLABLE', label: 'Billable (tax)' },
                { value: 'NON_BILLABLE', label: 'Non-billable (tax)' },
              ]}
            />
            <div>
              <label className="block text-xs font-medium text-onyx-500 mb-1">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-champagne-300 text-sm focus:ring-2 focus:ring-champagne-500 focus:border-champagne-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-onyx-500 mb-1">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-champagne-300 text-sm focus:ring-2 focus:ring-champagne-500 focus:border-champagne-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-champagne-200 overflow-hidden">
          {selectedInView.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-champagne-50 border-b border-champagne-100">
              <div className="text-sm text-onyx-900">
                <span className="font-semibold">{selectedInView.length}</span>{' '}
                selected
                {filteredIds.length !== selectedInView.length && (
                  <span className="text-champagne-800">
                    {' '}
                    · {filteredIds.length} in current view
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!allFilteredSelected && (
                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-champagne-700 hover:bg-champagne-800 transition-colors"
                  >
                    Select all {filteredIds.length}
                  </button>
                )}
                <button
                  type="button"
                  onClick={deselectAllFiltered}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-champagne-800 bg-white border border-champagne-200 hover:bg-champagne-50 transition-colors"
                >
                  Deselect all
                </button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-slate-100 to-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      aria-label={allFilteredSelected ? 'Deselect all' : 'Select all'}
                      checked={allFilteredSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someFilteredSelected;
                      }}
                      onChange={toggleHeaderCheckbox}
                      disabled={filteredIds.length === 0}
                      className="h-4 w-4 rounded border-champagne-300 text-champagne-700 focus:ring-champagne-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                    />
                  </th>
                  <Th>Date</Th>
                  <Th>Type</Th>
                  <Th>Vendor</Th>
                  <Th>Metal</Th>
                  <Th>Purity</Th>
                  <Th>Weight</Th>
                  <Th>Value</Th>
                  <Th>Payment</Th>
                  <Th>Credit</Th>
                  <Th>Created By</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-onyx-300">
                        <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-sm font-medium text-onyx-500">
                          {hasActiveFilters ? 'No transactions match your filters' : 'No transactions yet'}
                        </p>
                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={clearAllFilters}
                            className="text-xs font-medium text-champagne-700 hover:text-champagne-900 hover:underline"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                {filteredTransactions.map((txn: any, idx: number) => (
                  <tr
                    key={txn.id}
                    className={`hover:bg-champagne-50/40 transition-colors ${
                      selectedIds.has(txn.id)
                        ? 'bg-champagne-50/70'
                        : idx % 2 === 0
                        ? 'bg-white'
                        : 'bg-slate-50/40'
                    }`}
                  >
                    <td className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        aria-label={`Select transaction ${txn.referenceNumber ?? txn.id}`}
                        checked={selectedIds.has(txn.id)}
                        onChange={() => toggleOne(txn.id)}
                        className="h-4 w-4 rounded border-champagne-300 text-champagne-700 focus:ring-champagne-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-onyx-700">
                      <div>{new Date(txn.createdAt).toLocaleDateString('en-IN')}</div>
                      <div className="text-xs text-onyx-300">
                        {new Date(txn.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          txn.transactionType === 'PURCHASE'
                            ? 'bg-emerald-100 text-accent-emerald'
                            : txn.transactionType === 'SALE'
                            ? 'bg-champagne-100 text-champagne-800'
                            : txn.transactionType === 'WASTAGE'
                            ? 'bg-rose-100 text-accent-ruby'
                            : 'bg-champagne-100/60 text-onyx-700'
                        }`}
                      >
                        {txn.transactionType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {txn.vendor ? (
                        <div className="min-w-0">
                          <div className="font-medium text-onyx-900 truncate max-w-[160px]">
                            {txn.vendor.name}
                          </div>
                          <div className="text-[11px] text-onyx-400 font-mono">
                            {txn.vendor.uniqueCode}
                          </div>
                        </div>
                      ) : (
                        <span className="text-onyx-200">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          txn.metalType === 'GOLD'
                            ? 'text-amber-600'
                            : txn.metalType === 'SILVER'
                            ? 'text-slate-500'
                            : 'text-onyx-900'
                        }`}
                      >
                        {txn.metalType}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-onyx-700">{txn.purity}K</td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-onyx-900">
                      {txn.grossWeight.toFixed(2)}g
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-onyx-900">
                      {txn.totalValue ? `₹${txn.totalValue.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <PaymentCell
                        txn={txn}
                        canSettle={canSettle}
                        onSettle={() => setSettleTxn(txn)}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      {txn.creditApplied || txn.creditGenerated ? (
                        <div className="space-y-0.5">
                          {txn.creditApplied ? (
                            <span className="block text-champagne-800">
                              Applied: ₹{txn.creditApplied.toLocaleString('en-IN')}
                            </span>
                          ) : null}
                          {txn.creditGenerated ? (
                            <span className="block text-accent-emerald">
                              Generated: ₹{txn.creditGenerated.toLocaleString('en-IN')}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-onyx-200">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-onyx-500">
                      {txn.createdBy?.name || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        {canSettle &&
                          txn.transactionType === 'PURCHASE' &&
                          (txn.paymentStatus === 'HALF' || txn.paymentStatus === 'PENDING' || !txn.paymentStatus) && (
                            <button
                              type="button"
                              onClick={() => setSettleTxn(txn)}
                              className="px-2.5 py-1 rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-xs font-medium transition-colors inline-flex items-center gap-1"
                              title="Settle payment"
                            >
                              ₹ Settle
                            </button>
                          )}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => setEditTxn(txn)}
                            className="px-2.5 py-1 rounded-lg text-champagne-800 bg-champagne-50 hover:bg-champagne-100 text-xs font-medium transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTxn(txn);
                            }}
                            className="px-2.5 py-1 rounded-lg text-accent-ruby bg-rose-50 hover:bg-rose-100 text-xs font-medium transition-colors"
                          >
                            Delete
                          </button>
                        )}
                        {!canEdit && !canDelete && !canSettle && <span className="text-onyx-200">—</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {settleTxn && (
        <SettlePaymentModal
          transaction={settleTxn}
          onClose={() => setSettleTxn(null)}
        />
      )}
      {editTxn && (
        <EditMetalTransactionModal
          transaction={editTxn}
          onClose={() => setEditTxn(null)}
        />
      )}
      {deleteTxn && (
        <DeleteConfirmModal
          transaction={deleteTxn}
          error={deleteError}
          isPending={deleteMutation.isPending}
          onCancel={() => {
            setDeleteTxn(null);
            setDeleteError(null);
          }}
          onConfirm={() => deleteMutation.mutate(deleteTxn.id)}
        />
      )}
    </div>
  );
}

/** Compact summary card for the top KPI row. */
function SummaryCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-champagne-200 p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
      <div
        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-xl shadow-sm`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-onyx-400 font-medium uppercase tracking-wide">{label}</div>
        <div className="text-lg font-bold text-onyx-900 truncate">{value}</div>
      </div>
    </div>
  );
}

/**
 * Per-metal stat card. Clickable — toggles the metal filter.
 * Highlighted (ring + accented bg) when the matching metal filter is active.
 */
function MetalCard({
  code: _code,
  label,
  icon,
  accent,
  grams,
  value,
  count,
  isActive,
  onClick,
}: {
  code: string;
  label: string;
  icon: string;
  accent: string;
  grams: number;
  value: number;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const formatGrams = (g: number) => {
    if (g === 0) return '0g';
    if (g >= 1000) return `${(g / 1000).toFixed(2)}kg`;
    return `${g.toFixed(2)}g`;
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative text-left bg-white rounded-2xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5 ${
        isActive
          ? 'border-champagne-400 ring-2 ring-champagne-300 shadow-md'
          : 'border-champagne-200 shadow-sm'
      }`}
      aria-pressed={isActive}
      title={isActive ? `Click to clear ${label} filter` : `Filter by ${label}`}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-xl shadow-sm`}
        >
          {icon}
        </div>
        {/* Label + count + weight + value all in one column, single line each */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-onyx-400 uppercase tracking-wide truncate">
              {label}
            </span>
            <span className="flex-shrink-0 text-[10px] font-semibold text-onyx-300 uppercase tracking-wider">
              {count} {count === 1 ? 'txn' : 'txns'}
            </span>
          </div>
          <div className="text-lg font-bold text-onyx-900 leading-tight truncate">
            {formatGrams(grams)}
          </div>
          <div className="text-xs text-onyx-400 truncate">
            {value > 0
              ? `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
              : '—'}
          </div>
        </div>
      </div>
      {isActive && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-champagne-500 animate-pulse" />
      )}
    </button>
  );
}

/** Labeled select used in the filter bar. */
function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-onyx-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-champagne-300 text-sm bg-white focus:ring-2 focus:ring-champagne-500 focus:border-champagne-500 outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Compact, consistent table header cell. */
function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={`px-4 py-3 ${
        align === 'right' ? 'text-right' : 'text-left'
      } text-[11px] font-semibold text-onyx-500 uppercase tracking-wider whitespace-nowrap`}
    >
      {children}
    </th>
  );
}

/** Inline confirmation modal for deleting a transaction. */
function DeleteConfirmModal({
  transaction,
  error,
  isPending,
  onCancel,
  onConfirm,
}: {
  transaction: MetalTransaction;
  error: string | null;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = transaction as any;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-accent-ruby" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-onyx-900">Delete this transaction?</h3>
            <p className="text-sm text-onyx-500 mt-1">
              <span className="font-medium">{t.transactionType?.replace(/_/g, ' ')}</span> —{' '}
              {t.metalType} {t.purity}K • {t.grossWeight?.toFixed(2)}g
              {t.totalValue ? ` • ₹${t.totalValue.toLocaleString('en-IN')}` : ''}
            </p>
            <p className="text-sm text-onyx-500 mt-2">
              Stock balances and vendor credit will be re-balanced automatically. This action cannot be undone.
            </p>
          </div>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-accent-ruby/30 rounded-lg text-sm text-accent-ruby">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 rounded-xl bg-accent-ruby hover:bg-accent-ruby/90 text-white font-medium disabled:opacity-60"
          >
            {isPending ? 'Deleting…' : 'Delete Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Export-to-Excel dropdown. Sends the current list filters to the
 * `/metal/transactions/export` endpoint and triggers a download. The
 * "Billable only" / "Non-billable only" variants narrow the export to
 * the matching tax class for Income-Tax filing.
 */
function ExportMenu({
  filters,
  dateFrom,
  dateTo,
}: {
  filters: { metalType: string; transactionType: string };
  dateFrom: string;
  dateTo: string;
}) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const download = async (taxClass?: 'BILLABLE' | 'NON_BILLABLE') => {
    setOpen(false);
    setDownloading(true);
    try {
      const blob = await exportMetalTransactionsXlsx({
        metalType: filters.metalType || undefined,
        transactionType: filters.transactionType || undefined,
        startDate: dateFrom || undefined,
        endDate: dateTo || undefined,
        taxClass,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const suffix = taxClass
        ? taxClass === 'BILLABLE'
          ? '-billable'
          : '-non-billable'
        : '';
      a.download = `metal-transactions${suffix}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
      alert('Export failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="secondary"
        onClick={() => setOpen((o) => !o)}
        disabled={downloading}
      >
        {downloading ? 'Exporting…' : 'Export Excel ▾'}
      </Button>
      {open && (
        <div
          className="absolute right-0 mt-1 w-56 rounded-xl border border-champagne-200 bg-white shadow-lg z-20"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            type="button"
            className="w-full text-left px-4 py-2 text-sm hover:bg-champagne-50 rounded-t-xl"
            onClick={() => download()}
          >
            All Transactions
          </button>
          <button
            type="button"
            className="w-full text-left px-4 py-2 text-sm hover:bg-champagne-50"
            onClick={() => download('BILLABLE')}
          >
            Billable only (IT filing)
          </button>
          <button
            type="button"
            className="w-full text-left px-4 py-2 text-sm hover:bg-champagne-50 rounded-b-xl"
            onClick={() => download('NON_BILLABLE')}
          >
            Non-Billable only
          </button>
        </div>
      )}
    </div>
  );
}
