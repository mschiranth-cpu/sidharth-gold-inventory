/**
 * ============================================
 * RATE MANAGEMENT PAGE — Enhanced
 * ============================================
 *
 *  - Luxe pearl/champagne backdrop
 *  - 4-card KPI strip (one tile per metal showing latest 24K/22K rate)
 *  - Filter by metal + search
 *  - Skeleton loaders + empty state
 *  - Inline "Add new rate" panel with React-side validation
 *  - CSV export of the current view
 *  - Refresh button (spins while fetching)
 *  - Heroicons throughout
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CurrencyRupeeIcon,
  ExclamationCircleIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  createMetalRate,
  getCurrentMetalRates,
  type MetalRate,
} from '../../services/metal.service';
import { useRefreshInterval } from '../../contexts/RefreshIntervalContext';
import LiveMetalRatesCard from '../../components/LiveMetalRatesCard';
import RefreshIntervalPicker from '../../components/RefreshIntervalPicker';
import { formatIstDate } from '../../lib/dateUtils';

const METAL_OPTIONS = [
  { value: 'GOLD', label: 'Gold', symbol: 'Au', tint: 'from-amber-400 via-amber-500 to-yellow-600', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'SILVER', label: 'Silver', symbol: 'Ag', tint: 'from-slate-300 via-slate-400 to-slate-600', chip: 'bg-slate-50 text-slate-700 border-slate-200' },
  { value: 'PLATINUM', label: 'Platinum', symbol: 'Pt', tint: 'from-cyan-300 via-sky-400 to-sky-600', chip: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'PALLADIUM', label: 'Palladium', symbol: 'Pd', tint: 'from-violet-400 via-violet-500 to-violet-700', chip: 'bg-violet-50 text-violet-700 border-violet-200' },
];

const PURITY_OPTIONS = [24, 22, 18, 14];

function fmtInr(n: number): string {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RateManagementPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const userMs = useRefreshInterval();
  const { data: rates = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['metal-rates'],
    queryFn: getCurrentMetalRates,
    refetchInterval: userMs,
  });

  /* ── filters ──────────────────────────────────────────────── */
  const [search, setSearch] = useState('');
  const [metalFilter, setMetalFilter] = useState<string | 'ALL'>('ALL');
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rates.filter((r) => {
      if (metalFilter !== 'ALL' && r.metalType !== metalFilter) return false;
      if (!q) return true;
      return (
        r.metalType.toLowerCase().includes(q) ||
        String(r.purity).includes(q) ||
        String(r.ratePerGram).includes(q) ||
        (r.source ?? '').toLowerCase().includes(q)
      );
    });
  }, [rates, metalFilter, search]);

  /* ── per-metal latest highlight (24K preferred, fallback to highest purity) ─ */
  const latestByMetal = useMemo(() => {
    const m = new Map<string, MetalRate>();
    for (const r of rates) {
      const key = r.metalType;
      const existing = m.get(key);
      if (
        !existing ||
        new Date(r.effectiveDate).getTime() > new Date(existing.effectiveDate).getTime() ||
        (r.purity > existing.purity &&
          new Date(r.effectiveDate).getTime() === new Date(existing.effectiveDate).getTime())
      ) {
        m.set(key, r);
      }
    }
    return m;
  }, [rates]);

  /* ── add-rate form ───────────────────────────────────────── */
  const [form, setForm] = useState({
    metalType: 'GOLD',
    purity: 22,
    ratePerGram: 0,
    effectiveDate: new Date().toISOString().slice(0, 10),
    source: 'MANUAL',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.metalType) e.metalType = 'Pick a metal';
    if (!PURITY_OPTIONS.includes(form.purity)) e.purity = 'Pick a purity';
    if (!form.ratePerGram || form.ratePerGram <= 0) e.ratePerGram = 'Enter a rate > 0';
    if (!form.effectiveDate) e.effectiveDate = 'Pick an effective date';
    return e;
  }, [form]);
  const errorCount = Object.keys(errors).length;
  const showError = (k: string) =>
    touched[k] || showAllErrors ? errors[k] : undefined;

  const createMutation = useMutation({
    mutationFn: createMetalRate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['metal-rates'] });
      setShowForm(false);
      setForm({
        metalType: 'GOLD',
        purity: 22,
        ratePerGram: 0,
        effectiveDate: new Date().toISOString().slice(0, 10),
        source: 'MANUAL',
      });
      setTouched({});
      setShowAllErrors(false);
    },
    onError: (e: any) =>
      setSubmitError(e?.response?.data?.error || e?.message || 'Failed to save rate'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (errorCount > 0) {
      setShowAllErrors(true);
      return;
    }
    createMutation.mutate({
      ...form,
      effectiveDate: new Date(form.effectiveDate),
    });
  };

  const handleExport = () => {
    if (!filtered.length) return;
    downloadCsv(`metal-rates-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Metal', 'Purity', 'Rate per gram (INR)', 'Effective Date', 'Source'],
      ...filtered.map((r) => [
        r.metalType,
        `${r.purity}K`,
        r.ratePerGram,
        formatIstDate(r.effectiveDate),
        r.source ?? '',
      ]),
    ]);
  };

  /* ── render ──────────────────────────────────────────────── */
  return (
    <div className="p-6 bg-gradient-to-br from-pearl via-white to-champagne-50/40 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Back link */}
        <button
          type="button"
          onClick={() => navigate('/app/inventory/metal')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-onyx-500 hover:text-champagne-800 transition"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to Metal Inventory
        </button>

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-champagne-700 font-medium mb-2 flex items-center gap-1.5">
              <SparklesIcon className="w-3.5 h-3.5" />
              Inventory · Rates
            </p>
            <h1 className="font-display text-3xl font-semibold text-onyx-900">
              Rate Management
            </h1>
            <p className="text-sm text-onyx-500 mt-1">
              Manage internal rate cards used for valuations, pricing & invoicing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshIntervalPicker />
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Refresh rates"
              className="p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-champagne-50 text-onyx-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-champagne-500 transition"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={!filtered.length}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-champagne-50 text-sm font-semibold text-onyx-700 disabled:opacity-50 inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-champagne-500 transition"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Export CSV
            </button>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-champagne-700 via-champagne-800 to-onyx-800 hover:from-champagne-800 hover:to-onyx-900 text-white text-sm font-semibold inline-flex items-center gap-1.5 shadow-md shadow-onyx-700/20 focus:outline-none focus:ring-2 focus:ring-champagne-400 transition"
            >
              {showForm ? (
                <>
                  <XMarkIcon className="w-4 h-4" /> Close
                </>
              ) : (
                <>
                  <PlusIcon className="w-4 h-4" /> Add Rate
                </>
              )}
            </button>
          </div>
        </div>

        {/* Per-metal hero strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {METAL_OPTIONS.map((m) => {
            const r = latestByMetal.get(m.value);
            return (
              <div
                key={m.value}
                className="relative overflow-hidden rounded-2xl bg-white border border-champagne-100 p-4 shadow-sm"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${m.tint}`}
                  aria-hidden
                />
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${m.tint} text-white text-sm font-bold flex items-center justify-center shadow`}
                  >
                    {m.symbol}
                  </div>
                  {r ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${m.chip}`}>
                      {r.purity}K
                    </span>
                  ) : null}
                </div>
                <p className="text-xs font-semibold text-onyx-500 uppercase tracking-wider">
                  {m.label}
                </p>
                {isLoading ? (
                  <div className="h-7 mt-1 rounded bg-gray-100 animate-pulse" />
                ) : r ? (
                  <>
                    <p className="text-2xl font-bold text-onyx-900 tabular-nums mt-0.5">
                      {fmtInr(r.ratePerGram)}
                    </p>
                    <p className="text-[11px] text-onyx-400 mt-0.5">
                      per gram · {formatIstDate(r.effectiveDate)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-onyx-400 mt-1">No rate set</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Inline add-rate panel */}
        {showForm && (
          <form
            noValidate
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-sm border border-champagne-100 p-6 mb-6 animate-[slide-down_180ms_ease-out]"
          >
            <h2 className="text-base font-bold text-onyx-900 mb-1">Add new rate</h2>
            <p className="text-xs text-onyx-500 mb-4">
              The latest rate for each metal × purity combination is used for stock valuation.
            </p>

            {showAllErrors && errorCount > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
                <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Please fix {errorCount} field{errorCount > 1 ? 's' : ''} before saving.</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField label="Metal" required error={showError('metalType')}>
                <select
                  value={form.metalType}
                  onChange={(e) => setForm({ ...form, metalType: e.target.value })}
                  onBlur={() => setTouched({ ...touched, metalType: true })}
                  className={inputCls(!!showError('metalType'))}
                >
                  {METAL_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Purity" required error={showError('purity')}>
                <select
                  value={form.purity}
                  onChange={(e) => setForm({ ...form, purity: parseFloat(e.target.value) })}
                  onBlur={() => setTouched({ ...touched, purity: true })}
                  className={inputCls(!!showError('purity'))}
                >
                  {PURITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}K
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Rate / gram (₹)"
                required
                error={showError('ratePerGram')}
              >
                <div className="relative">
                  <CurrencyRupeeIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-onyx-400 pointer-events-none" />
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min={0}
                    value={form.ratePerGram || ''}
                    onChange={(e) =>
                      setForm({ ...form, ratePerGram: parseFloat(e.target.value) || 0 })
                    }
                    onBlur={() => setTouched({ ...touched, ratePerGram: true })}
                    placeholder="e.g. 7250.00"
                    className={`${inputCls(!!showError('ratePerGram'))} pl-9`}
                  />
                </div>
              </FormField>

              <FormField
                label="Effective Date"
                required
                error={showError('effectiveDate')}
              >
                <input
                  type="date"
                  value={form.effectiveDate}
                  onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                  onBlur={() => setTouched({ ...touched, effectiveDate: true })}
                  className={inputCls(!!showError('effectiveDate'))}
                />
              </FormField>
            </div>

            {submitError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
                <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                {submitError}
              </div>
            )}

            <div className="mt-5 flex flex-col-reverse md:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={createMutation.isPending}
                className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-champagne-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-champagne-700 via-champagne-800 to-onyx-800 hover:from-champagne-800 hover:to-onyx-900 text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 shadow-md disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-champagne-400"
              >
                {createMutation.isPending ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4" /> Save Rate
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Filters row */}
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-onyx-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rate, source, purity…"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-champagne-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-onyx-400 hover:text-onyx-700"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['ALL', 'GOLD', 'SILVER', 'PLATINUM', 'PALLADIUM'] as const).map((m) => {
              const active = metalFilter === m;
              const count =
                m === 'ALL'
                  ? rates.length
                  : rates.filter((r) => r.metalType === m).length;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetalFilter(m)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    active
                      ? 'bg-onyx-900 text-pearl border-onyx-900'
                      : 'bg-white text-onyx-700 border-gray-200 hover:border-champagne-400'
                  }`}
                >
                  {m === 'ALL' ? 'All' : m.charAt(0) + m.slice(1).toLowerCase()}
                  <span
                    className={`ml-1.5 ${
                      active ? 'text-champagne-200' : 'text-onyx-400'
                    } tabular-nums`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live market rates — full width so the 5 metal tiles render correctly */}
        <div className="mb-5">
          <LiveMetalRatesCard />
        </div>

        {/* Rate history table */}
        <div className="bg-white rounded-2xl border border-champagne-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-onyx-800">
              Rate History ({filtered.length})
            </h2>
            {isFetching && !isLoading && (
              <span className="text-xs text-onyx-400 inline-flex items-center gap-1">
                <ArrowPathIcon className="w-3 h-3 animate-spin" /> Refreshing
              </span>
            )}
          </div>
            <div className="overflow-x-auto">
              {isLoading ? (
                <SkeletonTable />
              ) : filtered.length === 0 ? (
                <EmptyState
                  filtered={!!search || metalFilter !== 'ALL'}
                  onAdd={() => setShowForm(true)}
                  onClear={() => {
                    setSearch('');
                    setMetalFilter('ALL');
                  }}
                />
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-champagne-50/50 text-[11px] font-bold tracking-wider text-onyx-500 uppercase">
                    <tr>
                      <th className="px-5 py-3 text-left">Metal</th>
                      <th className="px-5 py-3 text-left">Purity</th>
                      <th className="px-5 py-3 text-right">Rate / g</th>
                      <th className="px-5 py-3 text-left">Effective</th>
                      <th className="px-5 py-3 text-left">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((r) => {
                      const meta = METAL_OPTIONS.find((m) => m.value === r.metalType);
                      return (
                        <tr key={r.id} className="hover:bg-champagne-50/30 transition">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-lg bg-gradient-to-br ${meta?.tint ?? 'from-gray-300 to-gray-400'} text-white text-[10px] font-bold flex items-center justify-center`}
                              >
                                {meta?.symbol ?? r.metalType.slice(0, 2)}
                              </div>
                              <span className="font-medium text-onyx-800">
                                {meta?.label ?? r.metalType}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${meta?.chip ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}
                            >
                              {r.purity}K
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-semibold text-onyx-900 tabular-nums">
                            {fmtInr(r.ratePerGram)}
                          </td>
                          <td className="px-5 py-3 text-onyx-600">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDaysIcon className="w-3.5 h-3.5 text-onyx-400" />
                              {new Date(r.effectiveDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            {r.source ? (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-onyx-50 text-onyx-600 uppercase tracking-wide">
                                {r.source}
                              </span>
                            ) : (
                              <span className="text-onyx-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}

/* ─── helpers ───────────────────────────────────────────────────── */

function inputCls(hasError: boolean) {
  return [
    'w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm transition',
    'focus:outline-none focus:ring-2',
    hasError
      ? 'border-red-400 focus:ring-red-500'
      : 'border-gray-200 focus:ring-champagne-500 focus:border-transparent',
  ].join(' ');
}

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-onyx-700 mb-1.5">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="p-5 space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-9 rounded-lg bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({
  filtered,
  onAdd,
  onClear,
}: {
  filtered: boolean;
  onAdd: () => void;
  onClear: () => void;
}) {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-champagne-50 text-champagne-700 flex items-center justify-center mb-3">
        <CurrencyRupeeIcon className="w-6 h-6" />
      </div>
      <p className="text-sm font-semibold text-onyx-700 mb-1">
        {filtered ? 'No rates match these filters' : 'No rates yet'}
      </p>
      <p className="text-xs text-onyx-400 mb-4">
        {filtered
          ? 'Try widening the metal filter or clearing the search.'
          : 'Add the first internal rate to start valuing your stock.'}
      </p>
      {filtered ? (
        <button
          type="button"
          onClick={onClear}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50"
        >
          Clear filters
        </button>
      ) : (
        <button
          type="button"
          onClick={onAdd}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-onyx-900 text-pearl hover:bg-onyx-800 inline-flex items-center gap-1.5"
        >
          <PlusIcon className="w-3.5 h-3.5" /> Add a rate
        </button>
      )}
    </div>
  );
}
