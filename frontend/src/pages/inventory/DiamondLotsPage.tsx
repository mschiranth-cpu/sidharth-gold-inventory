/**
 * ============================================
 * DIAMOND LOTS PAGE
 * ============================================
 * View and create diamond lots / parcels.
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, CubeTransparentIcon } from '@heroicons/react/24/outline';
import {
  createDiamondLot,
  getAllDiamondLots,
  type DiamondLot,
} from '../../services/diamond.service';
import Button from '../../components/common/Button';

const fmt = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export default function DiamondLotsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    lotNumber: '',
    description: '',
    totalPieces: 0,
    totalCarats: 0,
    avgPricePerCarat: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const { data: lots = [], isLoading } = useQuery({
    queryKey: ['diamond-lots'],
    queryFn: getAllDiamondLots,
  });

  const create = useMutation({
    mutationFn: () =>
      createDiamondLot({
        lotNumber: form.lotNumber,
        description: form.description || undefined,
        totalPieces: form.totalPieces,
        totalCarats: form.totalCarats,
        avgPricePerCarat: form.avgPricePerCarat || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diamond-lots'] });
      setShowForm(false);
      setForm({
        lotNumber: '',
        description: '',
        totalPieces: 0,
        totalCarats: 0,
        avgPricePerCarat: 0,
      });
    },
    onError: (e: any) =>
      setError(e?.response?.data?.error?.message || e?.message || 'Failed to create lot'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.lotNumber.trim()) {
      setError('Lot number is required');
      return;
    }
    if (!form.totalPieces || form.totalPieces <= 0) {
      setError('Total pieces must be > 0');
      return;
    }
    if (!form.totalCarats || form.totalCarats <= 0) {
      setError('Total carats must be > 0');
      return;
    }
    create.mutate();
  };

  const inputCls =
    'w-full px-3 py-2 rounded-xl border border-champagne-300 focus:ring-2 focus:ring-champagne-500 focus:border-transparent text-sm';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl via-white to-champagne-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-3xl bg-gradient-to-br from-onyx-900 via-onyx-800 to-onyx-900 p-6 text-white shadow-xl flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CubeTransparentIcon className="h-8 w-8 text-champagne-300" />
              Diamond Lots
            </h1>
            <p className="text-pearl-200 text-sm mt-1">
              Manage diamond parcels and lot-level inventory aggregates.
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <PlusIcon className="h-4 w-4 mr-1" />
            Create Lot
          </Button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-white rounded-2xl border border-champagne-200 shadow-sm p-5 space-y-4"
          >
            <h3 className="font-semibold text-onyx-900">New Lot</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-onyx-600 mb-1">
                  Lot Number
                </label>
                <input
                  type="text"
                  value={form.lotNumber}
                  onChange={(e) => setForm({ ...form, lotNumber: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. LOT-2026-001"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-onyx-600 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inputCls}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-onyx-600 mb-1">
                  Total Pieces
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.totalPieces || ''}
                  onChange={(e) =>
                    setForm({ ...form, totalPieces: parseInt(e.target.value) || 0 })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-onyx-600 mb-1">
                  Total Carats
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={form.totalCarats || ''}
                  onChange={(e) =>
                    setForm({ ...form, totalCarats: parseFloat(e.target.value) || 0 })
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-onyx-600 mb-1">
                  Avg Price / Carat (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.avgPricePerCarat || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      avgPricePerCarat: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={inputCls}
                />
              </div>
            </div>
            {error && (
              <div className="px-3 py-2 rounded-lg bg-accent-ruby/10 text-accent-ruby text-sm">
                {error}
              </div>
            )}
            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={create.isPending}>
                Create Lot
              </Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <p className="text-sm text-onyx-400">Loading…</p>
        ) : lots.length === 0 ? (
          <div className="bg-white rounded-2xl border border-champagne-200 p-8 text-center text-sm text-onyx-400">
            No lots yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lots.map((lot: DiamondLot) => (
              <div
                key={lot.id}
                className="bg-white rounded-2xl shadow-sm p-5 border border-champagne-200"
              >
                <h3 className="text-xl font-bold text-onyx-900 mb-1">
                  {lot.lotNumber}
                </h3>
                {lot.description && (
                  <p className="text-sm text-onyx-500 mb-3">{lot.description}</p>
                )}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-onyx-400">Total Pieces</p>
                    <p className="text-lg font-bold text-onyx-800">
                      {fmt(lot.totalPieces)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-onyx-400">Total Carats</p>
                    <p className="text-lg font-bold text-onyx-800">
                      {fmt(lot.totalCarats)}
                    </p>
                  </div>
                </div>
                {lot.avgPricePerCarat ? (
                  <div className="px-3 py-2 rounded-xl bg-pearl-50 border border-champagne-200">
                    <p className="text-xs text-onyx-400">Avg Price / Carat</p>
                    <p className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-champagne-800 via-champagne-700 to-onyx-800">
                      ₹{fmt(lot.avgPricePerCarat)}
                    </p>
                  </div>
                ) : null}
                {lot.diamonds && lot.diamonds.length > 0 && (
                  <p className="mt-3 text-xs text-onyx-400">
                    {lot.diamonds.length} diamond(s) in this lot
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
