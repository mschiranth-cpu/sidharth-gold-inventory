/**
 * ============================================
 * TXN BULK ACTIONS — shared bulk-delete + bulk-settle UI
 * ============================================
 * Used by Metal / Diamond / RealStone / StonePacket transactions pages.
 *
 *   <BulkDeleteModal rows={...} deleteFn={...} onDone={...} />
 *   <BulkSettleModal rows={...} settleFn={...} onDone={...} />
 *   const sel = useTxnSelection(filteredIds);
 *
 * Domain differences (delete fn, settle fn, query-key invalidations,
 * row-description label) are passed in as props so this module stays
 * domain-agnostic.
 */

import { useMemo, useState } from 'react';
import Button from '../common/Button';

// ---------------------------------------------------------------------------
// Selection hook — used by every transactions page that has row checkboxes.
// Keeps selection state across renders without re-deriving from filtered
// rows. Returns helpers for "select all in current view" / "deselect all".
// ---------------------------------------------------------------------------
export function useTxnSelection(filteredIds: string[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedInView = filteredIds.filter((id) => selectedIds.has(id));
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

  /**
   * Drop succeeded ids from the selection, keep failed ids selected so
   * the user can act on them. Use as the `onDone` handler from the bulk
   * modals.
   */
  const keepFailed = (failedIds: Set<string>) => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) if (failedIds.has(id)) next.add(id);
      return next;
    });
  };

  return {
    selectedIds,
    setSelectedIds,
    toggleOne,
    selectedInView,
    allFilteredSelected,
    someFilteredSelected,
    selectAllFiltered,
    deselectAllFiltered,
    toggleHeaderCheckbox,
    keepFailed,
  };
}

// ---------------------------------------------------------------------------
// BULK DELETE MODAL
// Sequentially deletes each row. Per-row errors are surfaced; failed rows
// are returned to the parent via `onDone(failedIds)` so the user can
// investigate them.
// ---------------------------------------------------------------------------
export function BulkDeleteModal<TRow extends { id: string }>({
  rows,
  deleteFn,
  describeRow,
  describeTypeLabel,
  onCancel,
  onDone,
}: {
  rows: TRow[];
  /** Domain delete service — should throw on failure with a useful error message. */
  deleteFn: (id: string) => Promise<any>;
  /** Optional per-row reference for the error list (defaults to id slice). */
  describeRow?: (row: TRow) => string;
  /**
   * Optional grouping label fn for the upfront breakdown (e.g. transactionType).
   * If returned, the breakdown shows count per group label.
   */
  describeTypeLabel?: (row: TRow) => string;
  onCancel: () => void;
  onDone: (failedIds: Set<string>) => void;
}) {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [errors, setErrors] = useState<{ id: string; ref: string; msg: string }[]>([]);
  const total = rows.length;

  const summary = useMemo(() => {
    if (!describeTypeLabel) return null;
    const byType: Record<string, number> = {};
    for (const t of rows) {
      const k = describeTypeLabel(t) || 'OTHER';
      byType[k] = (byType[k] ?? 0) + 1;
    }
    return byType;
  }, [rows, describeTypeLabel]);

  const refOf = (t: TRow) =>
    (describeRow ? describeRow(t) : null) || t.id.slice(0, 8);

  const run = async () => {
    setRunning(true);
    setErrors([]);
    setDone(0);
    const failed: { id: string; ref: string; msg: string }[] = [];
    for (const t of rows) {
      try {
        await deleteFn(t.id);
      } catch (e: any) {
        failed.push({
          id: t.id,
          ref: refOf(t),
          msg:
            e?.response?.data?.error?.message ||
            e?.message ||
            'Failed to delete',
        });
      }
      setDone((n) => n + 1);
    }
    setErrors(failed);
    setRunning(false);
    if (failed.length === 0) {
      onDone(new Set());
    }
  };

  const close = () => onDone(new Set(errors.map((e) => e.id)));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={running ? undefined : onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-onyx-900">
              Delete {total} {total === 1 ? 'transaction' : 'transactions'}?
            </h2>
            <p className="text-sm text-onyx-500 mt-1">
              Stock balances and vendor credits will be re-balanced for each row. This
              cannot be undone.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 space-y-3">
          {summary && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm space-y-1">
              {Object.entries(summary).map(([k, n]) => (
                <div key={k} className="flex items-center justify-between text-onyx-700">
                  <span>{k}</span>
                  <span className="font-semibold">{n}</span>
                </div>
              ))}
            </div>
          )}

          {running && (
            <div className="rounded-lg bg-champagne-50 border border-champagne-200 p-3">
              <div className="flex items-center justify-between text-xs text-onyx-600 mb-2">
                <span>Deleting…</span>
                <span className="font-mono">
                  {done} / {total}
                </span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-ruby transition-all duration-200"
                  style={{ width: `${(done / Math.max(total, 1)) * 100}%` }}
                />
              </div>
            </div>
          )}

          {!running && errors.length > 0 && (
            <div className="rounded-lg bg-rose-50 border border-accent-ruby/30 p-3 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-accent-ruby mb-2">
                {errors.length} of {total} could not be deleted:
              </p>
              <ul className="text-xs text-onyx-700 space-y-1">
                {errors.map((e) => (
                  <li key={e.id}>
                    <span className="font-mono">{e.ref}</span> — {e.msg}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          {!running && errors.length === 0 && (
            <>
              <Button type="button" variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
              <button
                type="button"
                onClick={run}
                className="px-4 py-2 rounded-xl bg-accent-ruby hover:bg-accent-ruby/90 text-white font-medium min-h-[44px]"
              >
                Delete {total} {total === 1 ? 'transaction' : 'transactions'}
              </button>
            </>
          )}
          {!running && errors.length > 0 && (
            <button
              type="button"
              onClick={close}
              className="px-4 py-2 rounded-xl bg-onyx-700 hover:bg-onyx-800 text-white font-medium min-h-[44px]"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BULK SETTLE MODAL
// Settles partial/pending PURCHASE rows in bulk. Each row has its own
// "Settle now" input defaulted to balance due (editable). Shared notes
// + CASH-only payment mode keep the bulk path simple — for NEFT settlements
// with UTR/bank refs, users use the per-row Settle button.
// ---------------------------------------------------------------------------
export interface BulkSettleRow {
  id: string;
  totalValue?: number | null;
  amountPaid?: number | null;
  referenceNumber?: string | null;
  vendor?: { id: string; name: string; uniqueCode: string } | null;
}

export interface BulkSettlePayload {
  amount: number;
  paymentMode: 'CASH';
  notes?: string;
}

export function BulkSettleModal<TRow extends BulkSettleRow>({
  rows,
  settleFn,
  describeRow,
  onCancel,
  onDone,
}: {
  rows: TRow[];
  /** Domain settle service — should throw on failure. */
  settleFn: (id: string, payload: BulkSettlePayload) => Promise<any>;
  /** Per-row description shown in the inline table (e.g. "GOLD 24K"). */
  describeRow: (row: TRow) => string;
  onCancel: () => void;
  onDone: (failedIds: Set<string>) => void;
}) {
  const [amounts, setAmounts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const t of rows) {
      const due = Math.max(0, (t.totalValue ?? 0) - (t.amountPaid ?? 0));
      init[t.id] = due.toFixed(2);
    }
    return init;
  });
  const [notes, setNotes] = useState('');
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [errors, setErrors] = useState<{ id: string; ref: string; msg: string }[]>([]);

  const total = rows.length;

  // Group rows by vendor for clearer display.
  const groups = useMemo(() => {
    const map = new Map<
      string,
      {
        vendor: { id: string; name: string; uniqueCode: string };
        items: TRow[];
        totalDue: number;
      }
    >();
    for (const t of rows) {
      if (!t.vendor) continue;
      const k = t.vendor.id;
      if (!map.has(k)) {
        map.set(k, { vendor: t.vendor, items: [], totalDue: 0 });
      }
      const g = map.get(k)!;
      g.items.push(t);
      g.totalDue += Math.max(0, (t.totalValue ?? 0) - (t.amountPaid ?? 0));
    }
    return Array.from(map.values());
  }, [rows]);

  const grandTotal = useMemo(
    () => Object.values(amounts).reduce((s, v) => s + (Number(v) || 0), 0),
    [amounts]
  );

  const refOf = (t: TRow) => t.referenceNumber || t.id.slice(0, 8);

  const run = async () => {
    setRunning(true);
    setErrors([]);
    setDone(0);
    const failed: { id: string; ref: string; msg: string }[] = [];
    for (const t of rows) {
      const amt = Number(amounts[t.id] || '0');
      if (amt <= 0) {
        // Skipped — user explicitly zeroed; treat as success.
        setDone((n) => n + 1);
        continue;
      }
      try {
        await settleFn(t.id, {
          amount: amt,
          paymentMode: 'CASH',
          notes: notes || undefined,
        });
      } catch (e: any) {
        failed.push({
          id: t.id,
          ref: refOf(t),
          msg:
            e?.response?.data?.error?.message ||
            e?.message ||
            'Failed to settle',
        });
      }
      setDone((n) => n + 1);
    }
    setErrors(failed);
    setRunning(false);
    if (failed.length === 0) {
      onDone(new Set());
    }
  };

  const close = () => onDone(new Set(errors.map((e) => e.id)));

  const fmt = (n: number) =>
    `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      onClick={running ? undefined : onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="text-2xl text-emerald-700 leading-none">₹</span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-onyx-900">
              Settle {total} {total === 1 ? 'payment' : 'payments'}
            </h2>
            <p className="text-sm text-onyx-500 mt-1">
              Records a CASH settlement against each row. Adjust per-row amounts as needed.
              For NEFT settlements with UTR/bank refs, use the per-row Settle button instead.
            </p>
          </div>
          {!running && (
            <button
              type="button"
              onClick={onCancel}
              className="text-onyx-300 hover:text-onyx-500 text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>

        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {groups.map((g) => (
            <div
              key={g.vendor.id}
              className="rounded-xl border border-champagne-200 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-champagne-50/60 border-b border-champagne-100">
                <div className="min-w-0">
                  <div className="font-semibold text-onyx-900 truncate">{g.vendor.name}</div>
                  <div className="text-[11px] font-mono text-onyx-400">
                    {g.vendor.uniqueCode}
                  </div>
                </div>
                <div className="text-xs text-onyx-500 text-right">
                  <div>
                    {g.items.length} {g.items.length === 1 ? 'txn' : 'txns'}
                  </div>
                  <div className="font-semibold text-onyx-700">{fmt(g.totalDue)} due</div>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] text-onyx-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Reference</th>
                    <th className="px-3 py-2 text-left font-semibold">Item</th>
                    <th className="px-3 py-2 text-right font-semibold">Total</th>
                    <th className="px-3 py-2 text-right font-semibold">Paid</th>
                    <th className="px-3 py-2 text-right font-semibold">Due</th>
                    <th className="px-3 py-2 text-right font-semibold">Settle now</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {g.items.map((t) => {
                    const due = Math.max(
                      0,
                      (t.totalValue ?? 0) - (t.amountPaid ?? 0)
                    );
                    return (
                      <tr key={t.id}>
                        <td className="px-3 py-2 text-onyx-700 font-mono text-xs">
                          {refOf(t)}
                        </td>
                        <td className="px-3 py-2 text-onyx-700">{describeRow(t)}</td>
                        <td className="px-3 py-2 text-right text-onyx-700">
                          {fmt(t.totalValue ?? 0)}
                        </td>
                        <td className="px-3 py-2 text-right text-emerald-700">
                          {fmt(t.amountPaid ?? 0)}
                        </td>
                        <td className="px-3 py-2 text-right text-amber-700 font-semibold">
                          {fmt(due)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            max={due}
                            step="0.01"
                            value={amounts[t.id] ?? ''}
                            disabled={running}
                            onChange={(e) =>
                              setAmounts((prev) => ({
                                ...prev,
                                [t.id]: e.target.value,
                              }))
                            }
                            className="w-28 px-2 py-1 rounded border border-champagne-300 text-sm text-right focus:ring-2 focus:ring-champagne-500 focus:border-champagne-500 outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-onyx-500 uppercase tracking-wider mb-1">
              Notes (applied to all settlements)
            </label>
            <input
              type="text"
              value={notes}
              disabled={running}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bulk cash settlement"
              className="w-full px-3 py-2 rounded-xl border border-champagne-300 text-sm focus:ring-2 focus:ring-champagne-500 focus:border-champagne-500 outline-none"
            />
          </div>

          {running && (
            <div className="rounded-lg bg-champagne-50 border border-champagne-200 p-3">
              <div className="flex items-center justify-between text-xs text-onyx-600 mb-2">
                <span>Settling…</span>
                <span className="font-mono">
                  {done} / {total}
                </span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-200"
                  style={{ width: `${(done / Math.max(total, 1)) * 100}%` }}
                />
              </div>
            </div>
          )}

          {!running && errors.length > 0 && (
            <div className="rounded-lg bg-rose-50 border border-accent-ruby/30 p-3 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-accent-ruby mb-2">
                {errors.length} of {total} could not be settled:
              </p>
              <ul className="text-xs text-onyx-700 space-y-1">
                {errors.map((e) => (
                  <li key={e.id}>
                    <span className="font-mono">{e.ref}</span> — {e.msg}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
          <div className="text-sm text-onyx-700">
            Total to settle:{' '}
            <span className="font-bold text-emerald-700">{fmt(grandTotal)}</span>
          </div>
          <div className="flex items-center gap-3">
            {!running && errors.length === 0 && (
              <>
                <Button type="button" variant="secondary" onClick={onCancel}>
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={run}
                  disabled={grandTotal <= 0}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white font-medium min-h-[44px]"
                >
                  Settle {fmt(grandTotal)}
                </button>
              </>
            )}
            {!running && errors.length > 0 && (
              <button
                type="button"
                onClick={close}
                className="px-4 py-2 rounded-xl bg-onyx-700 hover:bg-onyx-800 text-white font-medium min-h-[44px]"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SELECTION TOOLBAR
// Renders the selection summary + bulk action buttons. Shown above the
// table whenever ≥1 row in the current view is selected.
// ---------------------------------------------------------------------------
export function SelectionToolbar({
  selectedCount,
  filteredCount,
  allFilteredSelected,
  canSettle,
  settleableCount,
  onSettle,
  canDelete,
  onDelete,
  onSelectAll,
  onDeselectAll,
}: {
  selectedCount: number;
  filteredCount: number;
  allFilteredSelected: boolean;
  canSettle: boolean;
  settleableCount: number;
  onSettle: () => void;
  canDelete: boolean;
  onDelete: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}) {
  if (selectedCount === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-champagne-50 border-b border-champagne-100">
      <div className="text-sm text-onyx-900">
        <span className="font-semibold">{selectedCount}</span> selected
        {filteredCount !== selectedCount && (
          <span className="text-champagne-800"> · {filteredCount} in current view</span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {canSettle && settleableCount > 0 && (
          <button
            type="button"
            onClick={onSettle}
            className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5"
            aria-label={`Settle ${settleableCount} selected payments`}
          >
            <span aria-hidden="true">₹</span>
            Settle {settleableCount}
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-accent-ruby hover:bg-accent-ruby/90 transition-colors"
            aria-label={`Delete ${selectedCount} selected transactions`}
          >
            Delete {selectedCount}
          </button>
        )}
        {!allFilteredSelected && (
          <button
            type="button"
            onClick={onSelectAll}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-champagne-700 hover:bg-champagne-800 transition-colors"
          >
            Select all {filteredCount}
          </button>
        )}
        <button
          type="button"
          onClick={onDeselectAll}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-champagne-800 bg-white border border-champagne-200 hover:bg-champagne-50 transition-colors"
        >
          Deselect all
        </button>
      </div>
    </div>
  );
}
