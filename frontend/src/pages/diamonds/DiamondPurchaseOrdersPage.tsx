/**
 * Diamond Purchase Orders — list + create page.
 * Shows existing POs (with status filter) and a "+ New PO" form modal that
 * creates a DRAFT or PLACED PO with one or more sieve-keyed lines.
 */
import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  listDiamondPos,
  createDiamondPo,
  type DiamondPoStatus,
  type CreateDiamondPoInput,
  DIAMOND_PO_STATUS_LABEL,
  DIAMOND_PO_STATUS_CLS,
} from '../../services/diamondPurchaseOrder.service';
import { listSieveSizes, type SieveSize } from '../../services/sieveSize.service';
import { listVendors } from '../../services/vendor.service';
import {
  caratsFromPieces,
  describeSieve,
  piecesFromCarats,
} from '../../hooks/useSieveAutoCalc';
import Button from '../../components/common/Button';

const fmt = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const fmtDate = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleDateString('en-IN') : '—';

interface DraftLine {
  sieveSizeId: number | '';
  shape: string;
  color: string;
  clarity: string;
  expectedPieces: string;
  expectedCarats: string;
  expectedRate: string;
  notes: string;
}

const emptyLine = (): DraftLine => ({
  sieveSizeId: '',
  shape: '',
  color: '',
  clarity: '',
  expectedPieces: '',
  expectedCarats: '',
  expectedRate: '',
  notes: '',
});

const STATUS_OPTIONS: Array<{ value: '' | DiamondPoStatus; label: string }> = [
  { value: '', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PLACED', label: 'Placed' },
  { value: 'PARTIALLY_RECEIVED', label: 'Partial' },
  { value: 'FULLY_RECEIVED', label: 'Fully Received' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function DiamondPurchaseOrdersPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'' | DiamondPoStatus>('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vendorId, setVendorId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitAs, setSubmitAs] = useState<'DRAFT' | 'PLACED'>('PLACED');
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);
  // Per-line touched flags — once a user types into pieces/cts directly we stop
  // overwriting that side from sieve-driven auto-calc. Mirrors the
  // `lastAutoCurrency` pattern used in VendorFormModal.
  const piecesTouchedRef = useRef<boolean[]>([false]);
  const caratsTouchedRef = useRef<boolean[]>([false]);

  const { data: pos = [], isLoading } = useQuery({
    queryKey: ['diamond-pos', { status: statusFilter }],
    queryFn: () =>
      listDiamondPos({ status: statusFilter || undefined }),
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors-for-po'],
    queryFn: () => listVendors(),
  });

  const { data: sieves = [] } = useQuery({
    queryKey: ['sieve-sizes', { kind: 'MESH', activeOnly: true }],
    queryFn: () => listSieveSizes({ kind: 'MESH' }),
  });

  const create = useMutation({
    mutationFn: (input: CreateDiamondPoInput) => createDiamondPo(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diamond-pos'] });
      resetForm();
      setShowForm(false);
    },
    onError: (e: any) =>
      setError(
        e?.response?.data?.error?.message ||
          e?.response?.data?.message ||
          e?.message ||
          'Failed to create PO'
      ),
  });

  const resetForm = () => {
    setVendorId('');
    setExpectedDeliveryDate('');
    setDueDate('');
    setNotes('');
    setSubmitAs('PLACED');
    setLines([emptyLine()]);
    piecesTouchedRef.current = [false];
    caratsTouchedRef.current = [false];
    setError(null);
  };

  const sieveById = useMemo(() => {
    const m = new Map<number, SieveSize>();
    sieves.forEach((s) => m.set(s.id, s));
    return m;
  }, [sieves]);

  const totals = useMemo(() => {
    let pieces = 0;
    let carats = 0;
    let value = 0;
    for (const l of lines) {
      const p = Number(l.expectedPieces) || 0;
      const c = Number(l.expectedCarats) || 0;
      const r = Number(l.expectedRate) || 0;
      pieces += p;
      carats += c;
      value += c * r;
    }
    return { pieces, carats, value };
  }, [lines]);

  const updateLine = (idx: number, patch: Partial<DraftLine>) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l))
    );
  };

  const addLine = () => {
    setLines((prev) => [...prev, emptyLine()]);
    piecesTouchedRef.current.push(false);
    caratsTouchedRef.current.push(false);
  };

  const removeLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
    piecesTouchedRef.current = piecesTouchedRef.current.filter((_, i) => i !== idx);
    caratsTouchedRef.current = caratsTouchedRef.current.filter((_, i) => i !== idx);
  };

  /**
   * Sieve-driven auto-calc: when the user picks/changes a sieve we re-suggest
   * whichever side (pcs or cts) is still untouched. Once they type into a
   * given field the touched-ref pins it and only that side stays put — the
   * other still gets recomputed from the sieve. Same pattern lives in
   * VendorFormModal's currency auto-fill.
   */
  const handleLineSieveChange = (idx: number, value: string) => {
    const sieveId = value ? Number(value) : '';
    const sieve = sieveId ? sieveById.get(sieveId) ?? null : null;
    const line = lines[idx];
    const patch: Partial<DraftLine> = { sieveSizeId: sieveId };
    if (sieve && line) {
      const cts = Number(line.expectedCarats) || 0;
      const pcs = Number(line.expectedPieces) || 0;
      if (cts > 0 && !piecesTouchedRef.current[idx]) {
        patch.expectedPieces = String(piecesFromCarats(cts, sieve) || '');
      } else if (pcs > 0 && !caratsTouchedRef.current[idx]) {
        patch.expectedCarats = String(caratsFromPieces(pcs, sieve) || '');
      }
    }
    updateLine(idx, patch);
  };

  const handleLineCaratsChange = (idx: number, value: string) => {
    caratsTouchedRef.current[idx] = true;
    const line = lines[idx];
    const sieveId = line?.sieveSizeId ? Number(line.sieveSizeId) : null;
    const sieve = sieveId ? sieveById.get(sieveId) ?? null : null;
    const cts = Number(value) || 0;
    const patch: Partial<DraftLine> = { expectedCarats: value };
    if (sieve && cts > 0 && !piecesTouchedRef.current[idx]) {
      const next = piecesFromCarats(cts, sieve);
      if (next > 0) patch.expectedPieces = String(next);
    }
    updateLine(idx, patch);
  };

  const handleLinePiecesChange = (idx: number, value: string) => {
    piecesTouchedRef.current[idx] = true;
    const line = lines[idx];
    const sieveId = line?.sieveSizeId ? Number(line.sieveSizeId) : null;
    const sieve = sieveId ? sieveById.get(sieveId) ?? null : null;
    const pcs = Number(value) || 0;
    const patch: Partial<DraftLine> = { expectedPieces: value };
    if (sieve && pcs > 0 && !caratsTouchedRef.current[idx]) {
      const next = caratsFromPieces(pcs, sieve);
      if (next > 0) patch.expectedCarats = String(next);
    }
    updateLine(idx, patch);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!vendorId) {
      setError('Vendor is required');
      return;
    }
    if (lines.length === 0) {
      setError('At least one line is required');
      return;
    }
    const cleanLines: CreateDiamondPoInput['lines'] = [];
    for (const [i, l] of lines.entries()) {
      if (!l.sieveSizeId) {
        setError(`Line ${i + 1}: pick a sieve size`);
        return;
      }
      const ec = Number(l.expectedCarats);
      if (!ec || ec <= 0) {
        setError(`Line ${i + 1}: expected carats must be > 0`);
        return;
      }
      cleanLines.push({
        sieveSizeId: Number(l.sieveSizeId),
        shape: l.shape || null,
        color: l.color || null,
        clarity: l.clarity || null,
        expectedPieces: l.expectedPieces ? Number(l.expectedPieces) : null,
        expectedCarats: ec,
        expectedRate: l.expectedRate ? Number(l.expectedRate) : null,
        notes: l.notes || null,
      });
    }

    create.mutate({
      vendorId,
      status: submitAs,
      expectedDeliveryDate: expectedDeliveryDate || null,
      dueDate: dueDate || null,
      notes: notes || null,
      lines: cleanLines,
    });
  };

  const inputCls =
    'w-full px-3 py-2 rounded-xl border border-champagne-300 focus:ring-2 focus:ring-champagne-500 focus:border-transparent text-sm';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl via-white to-champagne-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-3xl bg-gradient-to-br from-onyx-900 via-onyx-800 to-onyx-900 p-6 text-white shadow-xl flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <DocumentTextIcon className="h-8 w-8 text-champagne-300" />
              Diamond Purchase Orders
            </h1>
            <p className="text-onyx-200 mt-1 text-sm">
              Place sieve-keyed orders with vendors; receive against them as
              shipments arrive.
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-champagne-500 hover:bg-champagne-600 text-onyx-900 font-semibold"
          >
            <PlusIcon className="h-4 w-4 mr-1.5 inline" /> New PO
          </Button>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-champagne-200 p-4">
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <span className="text-xs font-semibold text-onyx-500 uppercase">
              Status:
            </span>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value || 'all'}
                onClick={() => setStatusFilter(opt.value as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  statusFilter === opt.value
                    ? 'bg-onyx-900 text-white border-onyx-900'
                    : 'bg-white text-onyx-600 border-onyx-200 hover:border-onyx-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-onyx-500">Loading…</div>
          ) : pos.length === 0 ? (
            <div className="text-center py-12 text-onyx-500">
              No purchase orders yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-onyx-50 text-onyx-600 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 text-left">PO #</th>
                    <th className="px-3 py-2 text-left">Vendor</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Lines</th>
                    <th className="px-3 py-2 text-right">Expected Cts</th>
                    <th className="px-3 py-2 text-right">Received Cts</th>
                    <th className="px-3 py-2 text-left">Placed</th>
                    <th className="px-3 py-2 text-left">Due</th>
                    <th className="px-3 py-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-onyx-100">
                  {pos.map((po) => {
                    const expected = po.lines.reduce(
                      (s, l) => s + (l.expectedCarats ?? 0),
                      0
                    );
                    return (
                      <tr key={po.id} className="hover:bg-champagne-50/40">
                        <td className="px-3 py-2 font-mono text-xs">
                          <Link
                            className="text-azure-600 hover:underline"
                            to={`/app/diamonds/purchase-orders/${po.id}`}
                          >
                            {po.poNumber}
                          </Link>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-onyx-900">
                            {po.vendor?.name ?? '—'}
                          </div>
                          <div className="text-xs text-onyx-500">
                            {po.vendor?.uniqueCode}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs rounded-full border ${DIAMOND_PO_STATUS_CLS[po.status]}`}
                          >
                            {DIAMOND_PO_STATUS_LABEL[po.status]}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {po.lines.length}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {fmt(expected)}
                        </td>
                        <td className="px-3 py-2 text-right text-onyx-500">
                          {fmt(po.totalReceivedCarats ?? 0)}
                        </td>
                        <td className="px-3 py-2">{fmtDate(po.placedAt)}</td>
                        <td className="px-3 py-2">{fmtDate(po.dueDate)}</td>
                        <td className="px-3 py-2 text-right">
                          <Link
                            className="text-azure-600 hover:underline text-xs"
                            to={`/app/diamonds/purchase-orders/${po.id}`}
                          >
                            View →
                          </Link>
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

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-champagne-200">
              <h2 className="text-xl font-bold text-onyx-900">
                New Diamond Purchase Order
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-onyx-400 hover:text-onyx-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-onyx-700 mb-1">
                    Vendor *
                  </label>
                  <select
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">— pick vendor —</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.uniqueCode})
                        {v.paymentDueDays != null
                          ? ` · NET ${v.paymentDueDays}`
                          : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-onyx-700 mb-1">
                    Expected Delivery
                  </label>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-onyx-700 mb-1">
                    Payment Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={inputCls}
                  />
                  <p className="text-[11px] text-onyx-400 mt-0.5">
                    Leave empty to auto-compute from vendor's credit days.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-onyx-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className={inputCls}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-onyx-900">
                    Line Items
                  </h3>
                  <button
                    type="button"
                    onClick={addLine}
                    className="text-xs text-azure-600 hover:underline font-semibold"
                  >
                    + Add line
                  </button>
                </div>

                <div className="space-y-3">
                  {lines.map((l, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-start bg-champagne-50/40 rounded-xl border border-champagne-200 p-3"
                    >
                      <div className="col-span-3">
                        <label className="block text-[10px] font-semibold text-onyx-500 uppercase mb-0.5">
                          Sieve *
                        </label>
                        <select
                          value={l.sieveSizeId}
                          onChange={(e) => handleLineSieveChange(idx, e.target.value)}
                          className={inputCls}
                        >
                          <option value="">— sieve —</option>
                          {sieves.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.code}
                              {s.sizeLabel ? ` (${s.sizeLabel})` : ''}
                              {s.piecesPerCaratAvg
                                ? ` · ~${fmt(s.piecesPerCaratAvg)} pcs/ct`
                                : ''}
                            </option>
                          ))}
                        </select>
                        {l.sieveSizeId && sieveById.get(Number(l.sieveSizeId)) && (
                          <p className="mt-1 text-[10px] text-onyx-400">
                            {describeSieve(
                              sieveById.get(Number(l.sieveSizeId)) ?? null
                            )}
                          </p>
                        )}
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] font-semibold text-onyx-500 uppercase mb-0.5">
                          Shape
                        </label>
                        <input
                          type="text"
                          value={l.shape}
                          onChange={(e) =>
                            updateLine(idx, { shape: e.target.value })
                          }
                          placeholder="RND"
                          className={inputCls}
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] font-semibold text-onyx-500 uppercase mb-0.5">
                          Color
                        </label>
                        <input
                          type="text"
                          value={l.color}
                          onChange={(e) =>
                            updateLine(idx, { color: e.target.value })
                          }
                          placeholder="GH"
                          className={inputCls}
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] font-semibold text-onyx-500 uppercase mb-0.5">
                          Clarity
                        </label>
                        <input
                          type="text"
                          value={l.clarity}
                          onChange={(e) =>
                            updateLine(idx, { clarity: e.target.value })
                          }
                          placeholder="VS"
                          className={inputCls}
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] font-semibold text-onyx-500 uppercase mb-0.5">
                          Pcs
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="1"
                          value={l.expectedPieces}
                          onChange={(e) =>
                            handleLinePiecesChange(idx, e.target.value)
                          }
                          className={inputCls}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold text-onyx-500 uppercase mb-0.5">
                          Cts *
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={l.expectedCarats}
                          onChange={(e) =>
                            handleLineCaratsChange(idx, e.target.value)
                          }
                          className={inputCls}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold text-onyx-500 uppercase mb-0.5">
                          Rate / ct
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={l.expectedRate}
                          onChange={(e) =>
                            updateLine(idx, { expectedRate: e.target.value })
                          }
                          className={inputCls}
                        />
                      </div>
                      <div className="col-span-1 flex items-end justify-end pb-1">
                        {lines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="text-rose-500 hover:text-rose-700"
                            aria-label="Remove line"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-onyx-50 rounded-xl p-3 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-[10px] uppercase text-onyx-500">
                    Total pcs
                  </div>
                  <div className="font-semibold">{fmt(totals.pieces)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-onyx-500">
                    Total cts
                  </div>
                  <div className="font-semibold">{fmt(totals.carats)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-onyx-500">
                    Indicative value
                  </div>
                  <div className="font-semibold">₹{fmt(totals.value)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-champagne-200">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-onyx-700">
                    Save as:
                  </label>
                  <select
                    value={submitAs}
                    onChange={(e) =>
                      setSubmitAs(e.target.value as 'DRAFT' | 'PLACED')
                    }
                    className={inputCls}
                    style={{ width: 140 }}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PLACED">Placed</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="bg-onyx-100 hover:bg-onyx-200 text-onyx-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={create.isPending}
                    className="bg-onyx-900 hover:bg-onyx-800 text-white"
                  >
                    {create.isPending ? 'Saving…' : 'Create PO'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
