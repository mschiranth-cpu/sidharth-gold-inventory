/**
 * ============================================
 * MELTING BATCH PAGE — Enhanced
 * ============================================
 *
 *  - Luxe gradient backdrop, header w/ back link + actions
 *  - 4-card KPI strip (batches, total input, total output, avg wastage)
 *  - Wastage threshold filter chips (All / Excellent / Good / High)
 *  - Search box (clears via X)
 *  - Skeleton grid while loading; empty state distinguishes filtered vs. none
 *  - CSV export of the current view
 *  - "Create Batch" panel inline (purity, input, output, wastage auto-calc)
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
  FireIcon,
  ScaleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  SparklesIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';
import {
  createMeltingBatch,
  getMeltingBatches,
  type MeltingBatch,
} from '../../services/metal.service';
import { useRefreshInterval } from '../../contexts/RefreshIntervalContext';
import RefreshIntervalPicker from '../../components/RefreshIntervalPicker';

const WASTAGE_FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'GOOD', label: 'Excellent (<1%)' },
  { id: 'OK', label: 'Acceptable (1–2%)' },
  { id: 'HIGH', label: 'High (>2%)' },
] as const;

type WastageFilter = (typeof WASTAGE_FILTERS)[number]['id'];

function fmtGrams(g: number): string {
  if (!g) return '0 g';
  if (g >= 1000) return `${(g / 1000).toFixed(2)} kg`;
  return `${g.toFixed(2)} g`;
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

function wastageBucket(p: number): WastageFilter {
  if (p < 1) return 'GOOD';
  if (p <= 2) return 'OK';
  return 'HIGH';
}

function wastageMeta(p: number) {
  if (p < 1)
    return {
      label: 'Excellent',
      chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      bar: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
      ring: 'ring-emerald-200',
    };
  if (p <= 2)
    return {
      label: 'Acceptable',
      chip: 'bg-amber-50 text-amber-800 border-amber-200',
      bar: 'bg-gradient-to-r from-amber-400 to-amber-500',
      ring: 'ring-amber-200',
    };
  return {
    label: 'High',
    chip: 'bg-rose-50 text-rose-700 border-rose-200',
    bar: 'bg-gradient-to-r from-rose-400 to-rose-500',
    ring: 'ring-rose-200',
  };
}

export default function MeltingBatchPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const userMs = useRefreshInterval();
  const { data: batches = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['melting-batches'],
    queryFn: getMeltingBatches,
    refetchInterval: userMs,
  });

  /* ── filters ──────────────────────────────────────────────── */
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<WastageFilter>('ALL');
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return batches.filter((b) => {
      if (filter !== 'ALL' && wastageBucket(b.wastagePercent) !== filter) return false;
      if (!q) return true;
      return (
        b.batchNumber.toLowerCase().includes(q) ||
        (b.meltedBy?.name ?? '').toLowerCase().includes(q) ||
        String(b.outputPurity).includes(q)
      );
    });
  }, [batches, search, filter]);

  const filterCount = (id: WastageFilter): number => {
    if (id === 'ALL') return batches.length;
    return batches.filter((b) => wastageBucket(b.wastagePercent) === id).length;
  };

  /* ── KPIs ─────────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    const totalInput = batches.reduce((s, b) => s + (b.totalInputWeight || 0), 0);
    const totalOutput = batches.reduce((s, b) => s + (b.outputWeight || 0), 0);
    const totalWastage = batches.reduce((s, b) => s + (b.wastageWeight || 0), 0);
    const avgWastagePct =
      batches.length > 0
        ? batches.reduce((s, b) => s + (b.wastagePercent || 0), 0) / batches.length
        : 0;
    return { totalInput, totalOutput, totalWastage, avgWastagePct };
  }, [batches]);

  /* ── create-batch form ────────────────────────────────────── */
  const [form, setForm] = useState({
    batchNumber: '',
    inputDescription: '',
    totalInputWeight: 0,
    outputPurity: 22,
    outputWeight: 0,
    notes: '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const wastageWeight = Math.max(0, form.totalInputWeight - form.outputWeight);
  const wastagePct = form.totalInputWeight > 0
    ? (wastageWeight / form.totalInputWeight) * 100
    : 0;

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.batchNumber.trim()) e.batchNumber = 'Provide a batch number';
    if (!form.totalInputWeight || form.totalInputWeight <= 0)
      e.totalInputWeight = 'Input weight must be > 0';
    if (form.outputWeight <= 0) e.outputWeight = 'Output weight must be > 0';
    if (form.outputWeight > form.totalInputWeight)
      e.outputWeight = 'Output cannot exceed input';
    if (![24, 22, 18, 14].includes(form.outputPurity))
      e.outputPurity = 'Pick a valid purity';
    return e;
  }, [form]);
  const errorCount = Object.keys(errors).length;
  const showError = (k: string) =>
    touched[k] || showAllErrors ? errors[k] : undefined;

  const createMutation = useMutation({
    mutationFn: createMeltingBatch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['melting-batches'] });
      setShowForm(false);
      setForm({
        batchNumber: '',
        inputDescription: '',
        totalInputWeight: 0,
        outputPurity: 22,
        outputWeight: 0,
        notes: '',
      });
      setTouched({});
      setShowAllErrors(false);
    },
    onError: (e: any) =>
      setSubmitError(e?.response?.data?.error || e?.message || 'Failed to create batch'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (errorCount > 0) {
      setShowAllErrors(true);
      return;
    }
    createMutation.mutate({
      batchNumber: form.batchNumber.trim(),
      inputMetals: form.inputDescription.trim()
        ? { description: form.inputDescription.trim() }
        : {},
      totalInputWeight: form.totalInputWeight,
      outputPurity: form.outputPurity,
      outputWeight: form.outputWeight,
      wastageWeight,
      wastagePercent: wastagePct,
      notes: form.notes.trim() || undefined,
      meltedAt: new Date(),
    });
  };

  const handleExport = () => {
    if (!filtered.length) return;
    downloadCsv(`melting-batches-${new Date().toISOString().slice(0, 10)}.csv`, [
      [
        'Batch #',
        'Melted At',
        'Melted By',
        'Input (g)',
        'Output (g)',
        'Output Purity',
        'Wastage (g)',
        'Wastage %',
      ],
      ...filtered.map((b) => [
        b.batchNumber,
        new Date(b.meltedAt).toLocaleString('en-IN'),
        b.meltedBy?.name ?? '',
        b.totalInputWeight,
        b.outputWeight,
        `${b.outputPurity}K`,
        b.wastageWeight,
        b.wastagePercent.toFixed(2),
      ]),
    ]);
  };

  /* ── render ──────────────────────────────────────────────── */
  return (
    <div className="p-6 bg-gradient-to-br from-pearl via-white to-champagne-50/40 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Back */}
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
              Inventory · Melting
            </p>
            <h1 className="font-display text-3xl font-semibold text-onyx-900">
              Melting Batches
            </h1>
            <p className="text-sm text-onyx-500 mt-1">
              Track refining batches, output purity & wastage performance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshIntervalPicker />
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Refresh batches"
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
                  <PlusIcon className="w-4 h-4" /> Create Batch
                </>
              )}
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KpiCard
            label="Total Batches"
            value={isLoading ? null : batches.length.toString()}
            icon={<BeakerIcon className="w-5 h-5" />}
            tint="champagne"
          />
          <KpiCard
            label="Total Input"
            value={isLoading ? null : fmtGrams(kpis.totalInput)}
            sub="cumulative"
            icon={<ScaleIcon className="w-5 h-5" />}
            tint="sky"
          />
          <KpiCard
            label="Total Output"
            value={isLoading ? null : fmtGrams(kpis.totalOutput)}
            sub={`yield ${kpis.totalInput > 0 ? ((kpis.totalOutput / kpis.totalInput) * 100).toFixed(1) : '0.0'}%`}
            icon={<CheckCircleIcon className="w-5 h-5" />}
            tint="emerald"
          />
          <KpiCard
            label="Avg Wastage"
            value={isLoading ? null : `${kpis.avgWastagePct.toFixed(2)}%`}
            sub={fmtGrams(kpis.totalWastage)}
            icon={<FireIcon className="w-5 h-5" />}
            tint={kpis.avgWastagePct > 2 ? 'rose' : kpis.avgWastagePct > 1 ? 'amber' : 'emerald'}
          />
        </div>

        {/* Inline create form */}
        {showForm && (
          <form
            noValidate
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-sm border border-champagne-100 p-6 mb-6"
          >
            <h2 className="text-base font-bold text-onyx-900 mb-1">Create melting batch</h2>
            <p className="text-xs text-onyx-500 mb-4">
              Wastage is computed automatically from input − output weight.
            </p>

            {showAllErrors && errorCount > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
                <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Please fix {errorCount} field{errorCount > 1 ? 's' : ''} before saving.</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label="Batch Number" required error={showError('batchNumber')}>
                <input
                  type="text"
                  value={form.batchNumber}
                  onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                  onBlur={() => setTouched({ ...touched, batchNumber: true })}
                  placeholder="e.g. MB-2026-04-27-001"
                  className={inputCls(!!showError('batchNumber'))}
                />
              </FormField>

              <FormField label="Output Purity" required error={showError('outputPurity')}>
                <select
                  value={form.outputPurity}
                  onChange={(e) =>
                    setForm({ ...form, outputPurity: parseFloat(e.target.value) })
                  }
                  className={inputCls(!!showError('outputPurity'))}
                >
                  {[24, 22, 18, 14].map((p) => (
                    <option key={p} value={p}>
                      {p}K
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Input Description"
                hint="Free-text description of input metals (e.g. '20g 22K + 30g 18K scrap')"
              >
                <input
                  type="text"
                  value={form.inputDescription}
                  onChange={(e) =>
                    setForm({ ...form, inputDescription: e.target.value })
                  }
                  placeholder="Optional"
                  className={inputCls(false)}
                />
              </FormField>

              <FormField label="Input Weight (g)" required error={showError('totalInputWeight')}>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.001"
                  min={0}
                  value={form.totalInputWeight || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      totalInputWeight: parseFloat(e.target.value) || 0,
                    })
                  }
                  onBlur={() => setTouched({ ...touched, totalInputWeight: true })}
                  placeholder="e.g. 100.000"
                  className={inputCls(!!showError('totalInputWeight'))}
                />
              </FormField>

              <FormField label="Output Weight (g)" required error={showError('outputWeight')}>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.001"
                  min={0}
                  value={form.outputWeight || ''}
                  onChange={(e) =>
                    setForm({ ...form, outputWeight: parseFloat(e.target.value) || 0 })
                  }
                  onBlur={() => setTouched({ ...touched, outputWeight: true })}
                  placeholder="e.g. 98.500"
                  className={inputCls(!!showError('outputWeight'))}
                />
              </FormField>

              {/* Live wastage panel */}
              <div className="rounded-xl bg-gradient-to-br from-champagne-50 via-white to-pearl border border-champagne-100 p-3.5 flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${wastagePct > 2 ? 'bg-rose-100 text-rose-700' : wastagePct > 1 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}
                >
                  <FireIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-[11px] font-semibold text-onyx-500 uppercase tracking-wide">
                    Wastage
                  </div>
                  <div className="text-lg font-bold text-onyx-900 tabular-nums">
                    {fmtGrams(wastageWeight)} ·{' '}
                    <span
                      className={
                        wastagePct > 2
                          ? 'text-rose-600'
                          : wastagePct > 1
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }
                    >
                      {wastagePct.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <FormField label="Notes" hint="Optional context">
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className={inputCls(false)}
              />
            </FormField>

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
                    Creating…
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4" /> Save Batch
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-onyx-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search batch number, melted by…"
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
            {WASTAGE_FILTERS.map((f) => {
              const active = filter === f.id;
              const count = filterCount(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    active
                      ? 'bg-onyx-900 text-pearl border-onyx-900'
                      : 'bg-white text-onyx-700 border-gray-200 hover:border-champagne-400'
                  }`}
                >
                  {f.label}
                  <span
                    className={`ml-1.5 ${active ? 'text-champagne-200' : 'text-onyx-400'} tabular-nums`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
            {(search || filter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setFilter('ALL');
                }}
                className="px-2.5 py-1.5 rounded-full text-xs font-medium text-onyx-500 hover:text-onyx-800 underline-offset-2 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Batch list */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-44 rounded-2xl bg-white border border-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            filtered={!!search || filter !== 'ALL'}
            onAdd={() => setShowForm(true)}
            onClear={() => {
              setSearch('');
              setFilter('ALL');
            }}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((b) => (
              <BatchCard key={b.id} batch={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Subcomponents ─────────────────────────────────────────────── */

function BatchCard({ batch }: { batch: MeltingBatch }) {
  const meta = wastageMeta(batch.wastagePercent);
  const yieldPct =
    batch.totalInputWeight > 0
      ? (batch.outputWeight / batch.totalInputWeight) * 100
      : 0;

  return (
    <div
      className={`relative bg-white rounded-2xl shadow-sm border border-champagne-100 overflow-hidden hover:shadow-md transition`}
    >
      {/* top accent */}
      <div className={`absolute inset-x-0 top-0 h-1 ${meta.bar}`} aria-hidden />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="font-mono text-[15px] font-bold text-onyx-900 truncate">
              {batch.batchNumber}
            </h3>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-onyx-500 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <CalendarDaysIcon className="w-3.5 h-3.5" />
                {new Date(batch.meltedAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              {batch.meltedBy?.name && (
                <span className="inline-flex items-center gap-1">
                  <UserCircleIcon className="w-3.5 h-3.5" />
                  {batch.meltedBy.name}
                </span>
              )}
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap ${meta.chip}`}
          >
            {meta.label} · {batch.wastagePercent.toFixed(2)}%
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-pearl/70 border border-champagne-100">
          <Stat label="Input" value={fmtGrams(batch.totalInputWeight)} />
          <Stat
            label="Output"
            value={fmtGrams(batch.outputWeight)}
            accent="text-emerald-700"
          />
          <Stat
            label="Wastage"
            value={fmtGrams(batch.wastageWeight)}
            accent={
              batch.wastagePercent > 2
                ? 'text-rose-700'
                : batch.wastagePercent > 1
                ? 'text-amber-700'
                : 'text-emerald-700'
            }
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-onyx-500">
            Output purity ·{' '}
            <span className="font-bold text-onyx-800">{batch.outputPurity}K</span>
          </span>
          <span className="text-onyx-500">
            Yield ·{' '}
            <span className="font-bold text-onyx-800 tabular-nums">{yieldPct.toFixed(1)}%</span>
          </span>
        </div>

        {/* Yield/wastage bar */}
        <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={meta.bar}
            style={{ width: `${Math.min(100, yieldPct)}%`, height: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-onyx-500 uppercase tracking-wide">
        {label}
      </div>
      <div className={`text-sm font-bold tabular-nums ${accent ?? 'text-onyx-900'}`}>
        {value}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  tint,
}: {
  label: string;
  value: string | null;
  sub?: string;
  icon: React.ReactNode;
  tint: 'champagne' | 'emerald' | 'rose' | 'sky' | 'amber';
}) {
  const tintMap: Record<string, string> = {
    champagne: 'bg-champagne-50 text-champagne-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
    sky: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-800',
  };
  return (
    <div className="bg-white rounded-2xl border border-champagne-100 shadow-sm p-4">
      <div className="flex items-start justify-between mb-2">
        <span className="text-[11px] font-semibold tracking-wider text-onyx-400 uppercase">
          {label}
        </span>
        <span className={`p-1.5 rounded-lg ${tintMap[tint]}`}>{icon}</span>
      </div>
      {value === null ? (
        <div className="h-7 rounded bg-gray-100 animate-pulse" />
      ) : (
        <div className="text-2xl font-bold text-onyx-900 tabular-nums">{value}</div>
      )}
      {sub && <div className="text-[11px] text-onyx-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function FormField({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
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
      {error ? (
        <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-onyx-400">{hint}</p>
      ) : null}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return [
    'w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm transition',
    'focus:outline-none focus:ring-2',
    hasError
      ? 'border-red-400 focus:ring-red-500'
      : 'border-gray-200 focus:ring-champagne-500 focus:border-transparent',
  ].join(' ');
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
    <div className="bg-white rounded-2xl border border-champagne-100 shadow-sm p-12 text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-champagne-50 text-champagne-700 flex items-center justify-center mb-3">
        <BeakerIcon className="w-7 h-7" />
      </div>
      <p className="text-sm font-semibold text-onyx-700 mb-1">
        {filtered ? 'No batches match these filters' : 'No melting batches yet'}
      </p>
      <p className="text-xs text-onyx-400 mb-4">
        {filtered
          ? 'Try clearing the search or wastage filter.'
          : 'Create the first melting batch to start tracking refining yield.'}
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
          <PlusIcon className="w-3.5 h-3.5" /> Create batch
        </button>
      )}
    </div>
  );
}
