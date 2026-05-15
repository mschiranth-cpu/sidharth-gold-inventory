/**
 * Diamond Purchase Order detail — shows lines + variance, exposes lifecycle
 * actions (Place / Cancel) for DRAFT/PLACED POs, and a receive panel that
 * creates Diamond + DiamondTransaction rows once placed.
 */
import { useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  InboxArrowDownIcon,
} from '@heroicons/react/24/outline';
import {
  getDiamondPo,
  placeDiamondPo,
  cancelDiamondPo,
  receiveAgainstPo,
  type DiamondPoLine,
  type ReceiveAgainstPoInput,
  DIAMOND_PO_STATUS_LABEL,
  DIAMOND_PO_STATUS_CLS,
} from '../../services/diamondPurchaseOrder.service';
import Button from '../../components/common/Button';

const fmt = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const fmtDate = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleDateString('en-IN') : '—';

interface ReceiveDraftLine {
  poLineId: string;
  shape: string;
  color: string;
  clarity: string;
  pieces: string;
  caratWeight: string;
  pricePerCarat: string;
  notes: string;
}

function draftFromPoLine(l: DiamondPoLine): ReceiveDraftLine {
  return {
    poLineId: l.id ?? '',
    shape: l.shape ?? '',
    color: l.color ?? '',
    clarity: l.clarity ?? '',
    pieces: '',
    caratWeight: '',
    pricePerCarat: l.expectedRate != null ? String(l.expectedRate) : '',
    notes: '',
  };
}

export default function DiamondPurchaseOrderDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [showReceive, setShowReceive] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [forceCancel, setForceCancel] = useState(false);
  const [receiveLines, setReceiveLines] = useState<ReceiveDraftLine[]>([]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [receiveNotes, setReceiveNotes] = useState('');

  const { data: po, isLoading } = useQuery({
    queryKey: ['diamond-po', id],
    queryFn: () => getDiamondPo(id),
    enabled: !!id,
  });

  const place = useMutation({
    mutationFn: () => placeDiamondPo(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diamond-po', id] });
      qc.invalidateQueries({ queryKey: ['diamond-pos'] });
    },
    onError: (e: any) =>
      setError(
        e?.response?.data?.error?.message ||
          e?.message ||
          'Failed to place PO'
      ),
  });

  const cancel = useMutation({
    mutationFn: () => cancelDiamondPo(id, cancelReason || undefined, forceCancel),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diamond-po', id] });
      qc.invalidateQueries({ queryKey: ['diamond-pos'] });
      setShowCancel(false);
      setCancelReason('');
      setForceCancel(false);
    },
    onError: (e: any) =>
      setError(
        e?.response?.data?.error?.message ||
          e?.message ||
          'Failed to cancel PO'
      ),
  });

  const receive = useMutation({
    mutationFn: (input: ReceiveAgainstPoInput) => receiveAgainstPo(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diamond-po', id] });
      qc.invalidateQueries({ queryKey: ['diamond-pos'] });
      qc.invalidateQueries({ queryKey: ['diamond-transactions'] });
      qc.invalidateQueries({ queryKey: ['diamonds'] });
      setShowReceive(false);
      setReceiveLines([]);
      setReferenceNumber('');
      setReceiveNotes('');
    },
    onError: (e: any) =>
      setError(
        e?.response?.data?.error?.message ||
          e?.message ||
          'Failed to record receive'
      ),
  });

  const openReceive = () => {
    if (!po) return;
    const eligible = po.lines.filter(
      (l) =>
        (l.varianceCarats ?? -(l.expectedCarats ?? 0)) <= -0.001 ||
        (l.receivedCarats ?? 0) === 0
    );
    setReceiveLines(eligible.map(draftFromPoLine));
    setShowReceive(true);
    setError(null);
  };

  const updateReceiveLine = (
    idx: number,
    patch: Partial<ReceiveDraftLine>
  ) => {
    setReceiveLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l))
    );
  };

  const removeReceiveLine = (idx: number) => {
    setReceiveLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const submitReceive = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (receiveLines.length === 0) {
      setError('Add at least one line to receive');
      return;
    }
    const lines: ReceiveAgainstPoInput['lines'] = [];
    for (const [i, l] of receiveLines.entries()) {
      if (!l.poLineId) {
        setError(`Line ${i + 1}: missing PO line link`);
        return;
      }
      if (!l.shape) {
        setError(`Line ${i + 1}: shape is required`);
        return;
      }
      if (!l.color) {
        setError(`Line ${i + 1}: color is required`);
        return;
      }
      if (!l.clarity) {
        setError(`Line ${i + 1}: clarity is required`);
        return;
      }
      const cw = Number(l.caratWeight);
      const pcs = Number(l.pieces);
      const rate = Number(l.pricePerCarat);
      if (!cw || cw <= 0) {
        setError(`Line ${i + 1}: caratWeight must be > 0`);
        return;
      }
      if (!pcs || pcs <= 0) {
        setError(`Line ${i + 1}: pieces must be > 0`);
        return;
      }
      if (!rate || rate <= 0) {
        setError(`Line ${i + 1}: pricePerCarat must be > 0`);
        return;
      }
      lines.push({
        poLineId: l.poLineId,
        shape: l.shape,
        color: l.color,
        clarity: l.clarity,
        caratWeight: cw,
        pieces: pcs,
        pricePerCarat: rate,
        notes: l.notes || undefined,
      });
    }
    receive.mutate({
      referenceNumber: referenceNumber || undefined,
      notes: receiveNotes || undefined,
      lines,
    });
  };

  const totals = useMemo(() => {
    if (!po) return { expected: 0, received: 0 };
    const expected = po.lines.reduce(
      (s, l) => s + (l.expectedCarats ?? 0),
      0
    );
    const received = po.lines.reduce(
      (s, l) => s + (l.receivedCarats ?? 0),
      0
    );
    return { expected, received };
  }, [po]);

  const canPlace = po?.status === 'DRAFT';
  const canReceive =
    po?.status === 'PLACED' || po?.status === 'PARTIALLY_RECEIVED';
  const canCancel =
    po?.status !== 'CANCELLED' && po?.status !== 'FULLY_RECEIVED';

  const inputCls =
    'w-full px-3 py-2 rounded-xl border border-champagne-300 focus:ring-2 focus:ring-champagne-500 focus:border-transparent text-sm';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-pearl flex items-center justify-center">
        <div className="text-onyx-500">Loading…</div>
      </div>
    );
  }
  if (!po) {
    return (
      <div className="min-h-screen bg-pearl flex items-center justify-center">
        <div className="text-rose-600">Purchase order not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl via-white to-champagne-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/app/diamonds/purchase-orders')}
          className="inline-flex items-center text-sm text-onyx-500 hover:text-onyx-900"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Purchase Orders
        </button>

        <div className="rounded-3xl bg-gradient-to-br from-onyx-900 via-onyx-800 to-onyx-900 p-6 text-white shadow-xl">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold font-mono">{po.poNumber}</h1>
                <span
                  className={`inline-block px-2 py-0.5 text-xs rounded-full border ${DIAMOND_PO_STATUS_CLS[po.status]}`}
                >
                  {DIAMOND_PO_STATUS_LABEL[po.status]}
                </span>
              </div>
              <p className="text-onyx-200 mt-1 text-sm">
                Vendor:{' '}
                <Link
                  to={`/app/vendors/${po.vendorId}`}
                  className="text-champagne-300 hover:underline"
                >
                  {po.vendor?.name ?? po.vendorId}
                </Link>
                {po.vendor?.uniqueCode ? ` · ${po.vendor.uniqueCode}` : ''}
                {po.vendor?.paymentDueDays != null
                  ? ` · NET ${po.vendor.paymentDueDays}`
                  : ''}
              </p>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-xs text-onyx-200">
                <div>
                  <span className="text-onyx-400">Placed:</span>{' '}
                  {fmtDate(po.placedAt)}
                </div>
                <div>
                  <span className="text-onyx-400">Expected delivery:</span>{' '}
                  {fmtDate(po.expectedDeliveryDate)}
                </div>
                <div>
                  <span className="text-onyx-400">Due:</span>{' '}
                  {fmtDate(po.dueDate)}
                </div>
                <div>
                  <span className="text-onyx-400">Created:</span>{' '}
                  {fmtDate(po.createdAt)}
                </div>
              </div>
              {po.notes && (
                <p className="mt-3 text-sm text-onyx-200 italic">{po.notes}</p>
              )}
              {po.cancelledAt && (
                <p className="mt-3 text-sm text-rose-300">
                  Cancelled {fmtDate(po.cancelledAt)}
                  {po.cancelReason ? ` — ${po.cancelReason}` : ''}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {canPlace && (
                <Button
                  onClick={() => place.mutate()}
                  disabled={place.isPending}
                  className="bg-champagne-500 hover:bg-champagne-600 text-onyx-900 font-semibold"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1.5 inline" />
                  {place.isPending ? 'Placing…' : 'Place PO'}
                </Button>
              )}
              {canReceive && (
                <Button
                  onClick={openReceive}
                  className="bg-azure-500 hover:bg-azure-600 text-white font-semibold"
                >
                  <InboxArrowDownIcon className="h-4 w-4 mr-1.5 inline" />
                  Record Receive
                </Button>
              )}
              {canCancel && (
                <Button
                  onClick={() => {
                    setShowCancel(true);
                    setError(null);
                  }}
                  className="bg-rose-500/90 hover:bg-rose-600 text-white font-semibold"
                >
                  <XCircleIcon className="h-4 w-4 mr-1.5 inline" />
                  Cancel PO
                </Button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Lines" value={String(po.lines.length)} />
          <KpiCard label="Expected Cts" value={fmt(totals.expected)} />
          <KpiCard label="Received Cts" value={fmt(totals.received)} />
          <KpiCard
            label="Outstanding Cts"
            value={fmt(Math.max(0, totals.expected - totals.received))}
          />
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-champagne-200 p-4">
          <h2 className="text-sm font-bold text-onyx-900 mb-3">Line Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-onyx-50 text-onyx-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2 text-left">Sieve</th>
                  <th className="px-3 py-2 text-left">Shape · Color · Clarity</th>
                  <th className="px-3 py-2 text-right">Exp. Pcs</th>
                  <th className="px-3 py-2 text-right">Exp. Cts</th>
                  <th className="px-3 py-2 text-right">Rate</th>
                  <th className="px-3 py-2 text-right">Recv. Pcs</th>
                  <th className="px-3 py-2 text-right">Recv. Cts</th>
                  <th className="px-3 py-2 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-onyx-100">
                {po.lines.map((l) => {
                  const variance = l.varianceCarats ?? 0;
                  return (
                    <tr key={l.id ?? `${l.sieveSizeId}-${l.expectedCarats}`}>
                      <td className="px-3 py-2 font-mono text-xs">
                        {l.sieveSize?.code ?? '—'}
                        {l.sieveSize?.sizeLabel ? (
                          <span className="text-onyx-400">
                            {' '}
                            ({l.sieveSize.sizeLabel})
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-xs text-onyx-700">
                        {[l.shape, l.color, l.clarity]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {l.expectedPieces != null ? fmt(l.expectedPieces) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {fmt(l.expectedCarats)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {l.expectedRate != null
                          ? `₹${fmt(l.expectedRate)}`
                          : '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-onyx-500">
                        {fmt(l.receivedPieces ?? 0)}
                      </td>
                      <td className="px-3 py-2 text-right text-onyx-500">
                        {fmt(l.receivedCarats ?? 0)}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-semibold ${
                          variance < -0.5
                            ? 'text-amber-600'
                            : variance > 0.5
                              ? 'text-azure-600'
                              : 'text-emerald-600'
                        }`}
                      >
                        {variance > 0 ? '+' : ''}
                        {fmt(variance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showReceive && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-champagne-200">
              <h2 className="text-xl font-bold text-onyx-900">
                Record Receive — {po.poNumber}
              </h2>
              <button
                onClick={() => setShowReceive(false)}
                className="text-onyx-400 hover:text-onyx-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={submitReceive} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-onyx-700 mb-1">
                    Reference / Invoice #
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-onyx-700 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={receiveNotes}
                    onChange={(e) => setReceiveNotes(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {receiveLines.length === 0 ? (
                <div className="text-sm text-onyx-500 bg-onyx-50 p-4 rounded-xl">
                  No outstanding lines to receive.
                </div>
              ) : (
                <div className="space-y-3">
                  {receiveLines.map((l, idx) => {
                    const poLine = po.lines.find((x) => x.id === l.poLineId);
                    return (
                      <div
                        key={l.poLineId}
                        className="bg-champagne-50/40 rounded-xl border border-champagne-200 p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-onyx-600">
                            {poLine?.sieveSize?.code ?? '—'}
                            {' · '}
                            <span className="text-onyx-400">
                              expected {fmt(poLine?.expectedCarats)} cts
                              {poLine?.varianceCarats != null
                                ? ` (open ${fmt(Math.max(0, -(poLine.varianceCarats)))})`
                                : ''}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removeReceiveLine(idx)}
                            className="text-rose-500 hover:text-rose-700 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-12 gap-2">
                          <FieldNarrow label="Shape *" cols={1}>
                            <input
                              type="text"
                              value={l.shape}
                              onChange={(e) =>
                                updateReceiveLine(idx, { shape: e.target.value })
                              }
                              className={inputCls}
                            />
                          </FieldNarrow>
                          <FieldNarrow label="Color *" cols={1}>
                            <input
                              type="text"
                              value={l.color}
                              onChange={(e) =>
                                updateReceiveLine(idx, { color: e.target.value })
                              }
                              className={inputCls}
                            />
                          </FieldNarrow>
                          <FieldNarrow label="Clarity *" cols={1}>
                            <input
                              type="text"
                              value={l.clarity}
                              onChange={(e) =>
                                updateReceiveLine(idx, {
                                  clarity: e.target.value,
                                })
                              }
                              className={inputCls}
                            />
                          </FieldNarrow>
                          <FieldNarrow label="Pcs *" cols={2}>
                            <input
                              type="number"
                              min={0}
                              step="1"
                              value={l.pieces}
                              onChange={(e) =>
                                updateReceiveLine(idx, {
                                  pieces: e.target.value,
                                })
                              }
                              className={inputCls}
                            />
                          </FieldNarrow>
                          <FieldNarrow label="Cts *" cols={2}>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={l.caratWeight}
                              onChange={(e) =>
                                updateReceiveLine(idx, {
                                  caratWeight: e.target.value,
                                })
                              }
                              className={inputCls}
                            />
                          </FieldNarrow>
                          <FieldNarrow label="Rate / ct *" cols={2}>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={l.pricePerCarat}
                              onChange={(e) =>
                                updateReceiveLine(idx, {
                                  pricePerCarat: e.target.value,
                                })
                              }
                              className={inputCls}
                            />
                          </FieldNarrow>
                          <FieldNarrow label="Notes" cols={3}>
                            <input
                              type="text"
                              value={l.notes}
                              onChange={(e) =>
                                updateReceiveLine(idx, {
                                  notes: e.target.value,
                                })
                              }
                              className={inputCls}
                            />
                          </FieldNarrow>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-champagne-200">
                <Button
                  type="button"
                  onClick={() => setShowReceive(false)}
                  className="bg-onyx-100 hover:bg-onyx-200 text-onyx-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={receive.isPending || receiveLines.length === 0}
                  className="bg-onyx-900 hover:bg-onyx-800 text-white"
                >
                  {receive.isPending ? 'Saving…' : 'Record Receive'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCancel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            <div className="p-5 border-b border-champagne-200">
              <h2 className="text-xl font-bold text-onyx-900">
                Cancel {po.poNumber}?
              </h2>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-onyx-700 mb-1">
                  Reason
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  className={inputCls}
                />
              </div>
              {(po.totalReceivedCarats ?? 0) > 0 && (
                <label className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                  <input
                    type="checkbox"
                    checked={forceCancel}
                    onChange={(e) => setForceCancel(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    Receives already exist. Tick to force-cancel — receive rows
                    keep their PO link for audit but no further receives are
                    allowed.
                  </span>
                </label>
              )}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => setShowCancel(false)}
                  className="bg-onyx-100 hover:bg-onyx-200 text-onyx-700"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => cancel.mutate()}
                  disabled={cancel.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {cancel.isPending ? 'Cancelling…' : 'Confirm Cancel'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl shadow border border-champagne-200 p-4">
      <div className="text-[11px] uppercase text-onyx-500 font-semibold">
        {label}
      </div>
      <div className="mt-1 text-xl font-bold text-onyx-900">{value}</div>
    </div>
  );
}

const COL_SPAN: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
};

function FieldNarrow({
  label,
  cols,
  children,
}: {
  label: string;
  cols: number;
  children: React.ReactNode;
}) {
  return (
    <div className={COL_SPAN[cols] ?? 'col-span-2'}>
      <label className="block text-[10px] font-semibold text-onyx-500 uppercase mb-0.5">
        {label}
      </label>
      {children}
    </div>
  );
}
