/**
 * ============================================
 * TRANSFER STONE PACKET PAGE
 * ============================================
 * Move a stone packet between physical locations.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import {
  getAllStonePackets,
  transferStonePacket,
  type StonePacket,
} from '../../services/stone.service';
import Button from '../../components/common/Button';
import {
  combineDateWithCurrentIstTimeISO,
  nowIstDateString,
} from '../../lib/dateUtils';

export default function TransferStonePacketPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [packetId, setPacketId] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [transactionDate, setTransactionDate] = useState(nowIstDateString());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: packets = [] } = useQuery({
    queryKey: ['stone-packets-available'],
    queryFn: () => getAllStonePackets({}),
  });

  const selected = packets.find((p: StonePacket) => p.id === packetId);

  const submit = useMutation({
    mutationFn: () =>
      transferStonePacket({
        packetId,
        fromLocation: fromLocation || undefined,
        toLocation,
        notes: notes || undefined,
        transactionDate: transactionDate ? combineDateWithCurrentIstTimeISO(transactionDate) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stone-packet-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['stone-packets'] });
      navigate('/app/inventory/stone-packets/transactions');
    },
    onError: (e: any) =>
      setError(e?.response?.data?.error?.message || e?.message || 'Failed to transfer'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!packetId || !toLocation) {
      setError('Packet and destination location are required.');
      return;
    }
    submit.mutate();
  };

  const inputCls =
    'w-full px-4 py-3 rounded-xl border border-champagne-300 focus:ring-2 focus:ring-champagne-500 focus:border-transparent';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl via-white to-champagne-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-3xl bg-gradient-to-br from-onyx-900 via-onyx-800 to-onyx-900 p-6 text-white shadow-xl">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-pearl-200 hover:text-white text-sm mb-3"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Back
          </button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ArrowsRightLeftIcon className="h-8 w-8 text-champagne-300" />
            Transfer Stone Packet
          </h1>
          <p className="text-pearl-200 text-sm mt-1">
            Move a stone packet between physical locations.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white rounded-2xl shadow-sm border border-champagne-200 p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-semibold text-onyx-700 mb-1">Packet</label>
            <select
              value={packetId}
              onChange={(e) => setPacketId(e.target.value)}
              className={inputCls}
            >
              <option value="">— Select a packet —</option>
              {packets.map((p: StonePacket) => (
                <option key={p.id} value={p.id}>
                  {p.packetNumber} — {p.stoneType} {p.color} {p.quality ?? ''} ({p.currentWeight} {p.unit})
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="rounded-xl bg-pearl-50 border border-champagne-200 p-3 text-sm">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-onyx-400">Packet</p>
                  <p className="font-semibold">{selected.packetNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-onyx-400">Stone Type</p>
                  <p className="font-semibold">{selected.stoneType}</p>
                </div>
                <div>
                  <p className="text-xs text-onyx-400">Stock</p>
                  <p className="font-semibold">{selected.currentWeight} {selected.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-onyx-400">Quality</p>
                  <p className="font-semibold">{selected.quality ?? '—'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-onyx-700 mb-1">From Location</label>
              <input
                type="text"
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                className={inputCls}
                placeholder="e.g. Vault A"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-onyx-700 mb-1">To Location</label>
              <input
                type="text"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                className={inputCls}
                placeholder="e.g. Showroom Display"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-onyx-700 mb-1">Transaction Date</label>
            <input
              type="date"
              value={transactionDate}
              max={nowIstDateString()}
              onChange={(e) => setTransactionDate(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-onyx-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={inputCls}
            />
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-accent-ruby/10 text-accent-ruby text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submit.isPending}>
              Transfer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
