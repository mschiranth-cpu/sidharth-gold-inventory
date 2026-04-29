/**
 * ============================================
 * ISSUE STONE PACKET PAGE
 * ============================================
 * Issue (partial) quantity of a stone packet to a department / worker / order.
 * Pre-validates that requested quantity ≤ currentWeight.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import {
  getAllStonePackets,
  issueStonePacket,
  type StonePacket,
} from '../../services/stone.service';
import Button from '../../components/common/Button';
import {
  combineDateWithCurrentIstTimeISO,
  nowIstDateString,
} from '../../lib/dateUtils';

const UNITS = ['CARAT', 'GRAM', 'PIECE'];

interface FormState {
  packetId: string;
  quantity: number;
  unit: string;
  departmentId: string;
  workerId: string;
  orderId: string;
  notes: string;
  transactionDate: string;
}

interface FieldErrors {
  packet?: string;
  quantity?: string;
  recipient?: string;
}

export default function IssueStonePacketPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState>({
    packetId: '',
    quantity: 0,
    unit: 'CARAT',
    departmentId: '',
    workerId: '',
    orderId: '',
    notes: '',
    transactionDate: nowIstDateString(),
  });
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: packets = [] } = useQuery({
    queryKey: ['stone-packets-issuable'],
    queryFn: () => getAllStonePackets({}),
  });

  const issuablePackets = useMemo(
    () => packets.filter((p: StonePacket) => (p.currentWeight ?? 0) > 0),
    [packets]
  );

  const selected: StonePacket | undefined = packets.find(
    (p: StonePacket) => p.id === form.packetId
  );

  const errors: FieldErrors = useMemo(() => {
    const e: FieldErrors = {};
    if (!form.packetId) e.packet = 'Select a packet';
    if (!form.quantity || form.quantity <= 0) e.quantity = 'Quantity must be > 0';
    if (selected && form.quantity > (selected.currentWeight ?? 0)) {
      e.quantity = `Cannot exceed current stock (${selected.currentWeight} ${selected.unit})`;
    }
    if (!form.departmentId.trim() && !form.workerId.trim())
      e.recipient = 'Provide a department or worker ID';
    return e;
  }, [form, selected]);

  const submit = useMutation({
    mutationFn: () =>
      issueStonePacket({
        packetId: form.packetId,
        quantity: form.quantity,
        unit: form.unit,
        orderId: form.orderId.trim() || undefined,
        departmentId: form.departmentId.trim() || undefined,
        workerId: form.workerId.trim() || undefined,
        notes: form.notes || undefined,
        transactionDate: form.transactionDate
          ? combineDateWithCurrentIstTimeISO(form.transactionDate)
          : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stone-packet-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['stone-packets'] });
      queryClient.invalidateQueries({ queryKey: ['stone-packet-stock-summary'] });
      navigate('/app/inventory/stone-packets/transactions');
    },
    onError: (e: any) =>
      setServerError(e?.response?.data?.error?.message || e?.message || 'Failed to issue'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (Object.keys(errors).length > 0) return;
    submit.mutate();
  };

  const inputCls =
    'w-full px-4 py-3 rounded-xl border border-champagne-300 focus:ring-2 focus:ring-champagne-500 focus:border-transparent';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl via-white to-champagne-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="rounded-3xl bg-gradient-to-br from-onyx-900 via-onyx-800 to-onyx-900 p-6 text-white shadow-xl">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-pearl-200 hover:text-white text-sm mb-3"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Back
          </button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ArrowUpTrayIcon className="h-8 w-8 text-champagne-300" />
            Issue Stone Packet
          </h1>
          <p className="text-pearl-200 text-sm mt-1">
            Allocate a partial quantity to a department, worker, or order.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white rounded-2xl shadow-sm border border-champagne-200 p-6 space-y-5"
        >
          <div>
            <label className="block text-sm font-semibold text-onyx-700 mb-1">
              Select Packet (only with stock)
            </label>
            <select
              value={form.packetId}
              onChange={(e) => {
                const p = packets.find((x: StonePacket) => x.id === e.target.value);
                setForm({
                  ...form,
                  packetId: e.target.value,
                  unit: p?.unit ?? form.unit,
                });
              }}
              className={inputCls}
            >
              <option value="">— Select a packet —</option>
              {issuablePackets.map((p: StonePacket) => (
                <option key={p.id} value={p.id}>
                  {p.packetNumber} — {p.stoneType} {p.color} {p.quality ?? ''} ({p.currentWeight} {p.unit})
                </option>
              ))}
            </select>
            {errors.packet && <p className="text-xs text-accent-ruby mt-1">{errors.packet}</p>}
          </div>

          {selected && (
            <div className="rounded-xl bg-pearl-50 border border-champagne-200 p-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-onyx-400">Stone Type</p>
                  <p className="font-semibold">{selected.stoneType}</p>
                </div>
                <div>
                  <p className="text-xs text-onyx-400">Quality</p>
                  <p className="font-semibold">{selected.quality ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-onyx-400">Current Stock</p>
                  <p className="font-semibold">
                    {selected.currentWeight} {selected.unit}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-onyx-400">Pieces</p>
                  <p className="font-semibold">{selected.currentPieces ?? '—'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-onyx-700 mb-1">Quantity</label>
              <input
                type="number"
                step="0.001"
                value={form.quantity || ''}
                onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
                className={inputCls}
              />
              {errors.quantity && <p className="text-xs text-accent-ruby mt-1">{errors.quantity}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-onyx-700 mb-1">Unit</label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className={inputCls}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-onyx-700 mb-1">Department ID</label>
              <input
                type="text"
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                className={inputCls}
                placeholder="e.g. SETTING"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-onyx-700 mb-1">Worker ID</label>
              <input
                type="text"
                value={form.workerId}
                onChange={(e) => setForm({ ...form, workerId: e.target.value })}
                className={inputCls}
                placeholder="Optional if a department is provided"
              />
            </div>
          </div>
          {errors.recipient && (
            <p className="text-xs text-accent-ruby -mt-2">{errors.recipient}</p>
          )}

          <div>
            <label className="block text-sm font-semibold text-onyx-700 mb-1">Order ID</label>
            <input
              type="text"
              value={form.orderId}
              onChange={(e) => setForm({ ...form, orderId: e.target.value })}
              className={inputCls}
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-onyx-700 mb-1">Transaction Date</label>
            <input
              type="date"
              value={form.transactionDate}
              max={nowIstDateString()}
              onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-onyx-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className={inputCls}
            />
          </div>

          {serverError && (
            <div className="px-3 py-2 rounded-lg bg-accent-ruby/10 text-accent-ruby text-sm flex items-center gap-2">
              <ExclamationCircleIcon className="h-4 w-4" />
              {serverError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-champagne-200">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submit.isPending}>
              Issue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
