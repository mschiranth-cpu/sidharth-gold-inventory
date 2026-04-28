/**
 * ============================================
 * REAL STONE RATE MANAGEMENT PAGE
 * ============================================
 * Maintain the office real-stone rate-card (price-per-carat by
 * stoneType × quality × carat-range).
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, CurrencyRupeeIcon, SparklesIcon } from '@heroicons/react/24/outline';
import {
  createRealStoneRate,
  getCurrentRealStoneRates,
  type RealStoneRate,
} from '../../services/stone.service';
import Button from '../../components/common/Button';

const STONE_TYPES = [
  'RUBY',
  'EMERALD',
  'SAPPHIRE',
  'BLUE_SAPPHIRE',
  'YELLOW_SAPPHIRE',
  'TANZANITE',
  'AMETHYST',
  'TOPAZ',
  'CITRINE',
  'OPAL',
  'OTHER',
];
const QUALITIES = ['AAA', 'AA', 'A', 'B', 'COMMERCIAL'];

const fmt = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function RealStoneRateManagementPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    stoneType: 'RUBY',
    quality: 'AAA',
    caratFrom: 0.3,
    caratTo: 0.5,
    pricePerCarat: 0,
    effectiveDate: new Date().toISOString().slice(0, 10),
    source: 'OFFICE',
  });
  const [error, setError] = useState<string | null>(null);

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['real-stone-rates'],
    queryFn: getCurrentRealStoneRates,
  });

  const create = useMutation({
    mutationFn: () =>
      createRealStoneRate({
        ...form,
        effectiveDate: new Date(form.effectiveDate).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-stone-rates'] });
      setShowForm(false);
      setError(null);
      setForm((f) => ({ ...f, pricePerCarat: 0 }));
    },
    onError: (e: any) =>
      setError(e?.response?.data?.error?.message || e?.message || 'Failed to add rate'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.caratTo < form.caratFrom) {
      setError('Carat To must be ≥ Carat From');
      return;
    }
    if (!form.pricePerCarat || form.pricePerCarat <= 0) {
      setError('Price per carat must be > 0');
      return;
    }
    create.mutate();
  };

  const inputCls =
    'w-full px-3 py-2 rounded-xl border border-champagne-300 focus:ring-2 focus:ring-champagne-500 focus:border-transparent text-sm';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl via-white to-champagne-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-3xl bg-gradient-to-br from-onyx-900 via-onyx-800 to-onyx-900 p-6 text-white shadow-xl flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CurrencyRupeeIcon className="h-8 w-8 text-champagne-300" />
              Real Stone Rate Management
            </h1>
            <p className="text-pearl-200 text-sm mt-1">
              Office price-per-carat reference card by stone type × quality × carat-range.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/app/inventory/real-stones">
              <Button variant="secondary">Back to Dashboard</Button>
            </Link>
            <Button variant="primary" onClick={() => setShowForm(true)}>
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Rate
            </Button>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-white rounded-2xl shadow-sm border border-champagne-200 p-5 space-y-4"
          >
            <h3 className="font-semibold text-onyx-900">New Rate Entry</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-onyx-600 mb-1">Stone Type</label>
                <select
                  value={form.stoneType}
                  onChange={(e) => setForm({ ...form, stoneType: e.target.value })}
                  className={inputCls}
                >
                  {STONE_TYPES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-onyx-600 mb-1">Quality</label>
                <select
                  value={form.quality}
                  onChange={(e) => setForm({ ...form, quality: e.target.value })}
                  className={inputCls}
                >
                  {QUALITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-onyx-600 mb-1">Source</label>
                <input
                  type="text"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className={inputCls}
                  placeholder="OFFICE"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-onyx-600 mb-1">Effective Date</label>
                <input
                  type="date"
                  value={form.effectiveDate}
                  onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-onyx-600 mb-1">Carat From</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.caratFrom}
                  onChange={(e) => setForm({ ...form, caratFrom: parseFloat(e.target.value) || 0 })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-onyx-600 mb-1">Carat To</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.caratTo}
                  onChange={(e) => setForm({ ...form, caratTo: parseFloat(e.target.value) || 0 })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-onyx-600 mb-1">Price / Carat (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.pricePerCarat || ''}
                  onChange={(e) =>
                    setForm({ ...form, pricePerCarat: parseFloat(e.target.value) || 0 })
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
                <SparklesIcon className="h-4 w-4 mr-1" />
                Save Rate
              </Button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-champagne-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-champagne-200 bg-gradient-to-r from-pearl-50 via-white to-champagne-50">
            <h3 className="font-semibold text-onyx-900">Current Rate Card</h3>
          </div>
          {isLoading ? (
            <p className="px-5 py-6 text-sm text-onyx-400">Loading…</p>
          ) : rates.length === 0 ? (
            <p className="px-5 py-6 text-sm text-onyx-400 italic">
              No rates yet. Click <span className="font-semibold">Add Rate</span> to create the first entry.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-pearl-50 text-xs text-onyx-500">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Stone Type</th>
                    <th className="px-4 py-2 text-left font-medium">Quality</th>
                    <th className="px-4 py-2 text-right font-medium">Carat Range</th>
                    <th className="px-4 py-2 text-right font-medium">₹ / ct</th>
                    <th className="px-4 py-2 text-right font-medium">Effective</th>
                    <th className="px-4 py-2 text-left font-medium">Source</th>
                    <th className="px-4 py-2 text-left font-medium">By</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((r: RealStoneRate) => (
                    <tr key={r.id} className="border-t border-champagne-100">
                      <td className="px-4 py-2 font-semibold text-onyx-800">{r.stoneType}</td>
                      <td className="px-4 py-2">{r.quality ?? '—'}</td>
                      <td className="px-4 py-2 text-right">{r.caratFrom}–{r.caratTo}</td>
                      <td className="px-4 py-2 text-right font-bold bg-clip-text text-transparent bg-gradient-to-r from-champagne-800 via-champagne-700 to-onyx-800">
                        ₹{fmt(r.pricePerCarat)}
                      </td>
                      <td className="px-4 py-2 text-right text-xs text-onyx-400">
                        {new Date(r.effectiveDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-2 text-xs text-onyx-500">{r.source ?? '—'}</td>
                      <td className="px-4 py-2 text-xs text-onyx-500">{r.createdBy?.name ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
