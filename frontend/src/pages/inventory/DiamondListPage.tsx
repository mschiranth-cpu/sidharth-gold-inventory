/**
 * ============================================
 * DIAMOND LIST PAGE — Enhanced (luxe inventory dashboard)
 * ============================================
 *
 * Pattern parity with VendorsPage / repo UX conventions:
 *   - Champagne/onyx luxe gradient backdrop
 *   - KPI strip (count, carats, value, certified, in-stock %)
 *   - Search box with leading magnifier + clear button
 *   - Status filter chips (live counts) + 4C selects
 *   - Grid ↔ Table view toggle (preference persisted in localStorage)
 *   - Sortable, sticky-header data table for table view
 *   - Card view with shape glyph, 4C chips, certification badge, price stack
 *   - Skeleton loaders (no centered spinner) — better perceived perf
 *   - Empty state differentiates "no data" vs "filtered empty"
 *   - CSV export + refresh button (spins while fetching)
 *   - Accessibility: aria-labels on icon buttons, focus rings preserved,
 *     status conveyed by icon + text (not colour alone), reduced-motion safe
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Squares2X2Icon,
  TableCellsIcon,
  SparklesIcon,
  ScaleIcon,
  BanknotesIcon,
  CheckBadgeIcon,
  CubeTransparentIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { getAllDiamonds, type Diamond } from '../../services/diamond.service';

/* ──────────────────────────────────────────────────────────────────── */
/* Types & constants                                                    */
/* ──────────────────────────────────────────────────────────────────── */

type StatusKey = 'all' | 'IN_STOCK' | 'ISSUED' | 'SET';
type SortKey = 'stockNumber' | 'caratWeight' | 'pricePerCarat' | 'totalPrice' | 'createdAt';
type SortDir = 'asc' | 'desc';
type ViewMode = 'grid' | 'table';

const SHAPES = ['ROUND', 'PRINCESS', 'OVAL', 'CUSHION', 'EMERALD', 'PEAR', 'MARQUISE', 'HEART', 'RADIANT', 'ASSCHER'];
const COLORS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
const CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1'];

const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  IN_STOCK: {
    label: 'In Stock',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  ISSUED: {
    label: 'Issued',
    cls: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
  },
  SET: {
    label: 'Set',
    cls: 'bg-onyx-100 text-onyx-700 border-onyx-200',
    dot: 'bg-onyx-500',
  },
};

const SHAPE_GLYPH: Record<string, string> = {
  ROUND: '◆',
  PRINCESS: '◇',
  OVAL: '◯',
  CUSHION: '▢',
  EMERALD: '▭',
  PEAR: '⬬',
  MARQUISE: '◊',
  HEART: '♡',
  RADIANT: '▦',
  ASSCHER: '◫',
};

const VIEW_KEY = 'ativa.diamond.viewMode';

/* ──────────────────────────────────────────────────────────────────── */
/* Page                                                                 */
/* ──────────────────────────────────────────────────────────────────── */

export default function DiamondListPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  // Filters live as a single object — drives query key as well as client filter.
  const [shape, setShape] = useState('');
  const [color, setColor] = useState('');
  const [clarity, setClarity] = useState('');
  const [status, setStatus] = useState<StatusKey>('IN_STOCK');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'grid';
    return (window.localStorage.getItem(VIEW_KEY) as ViewMode) || 'grid';
  });

  useEffect(() => {
    window.localStorage.setItem(VIEW_KEY, view);
  }, [view]);

  // Server filters: only pass non-empty values + ALWAYS pass status (or omit
  // when "all"). Search is client-side because backend doesn't support it.
  const serverFilters = useMemo(() => {
    const f: Record<string, string> = {};
    if (shape) f.shape = shape;
    if (color) f.color = color;
    if (clarity) f.clarity = clarity;
    if (status !== 'all') f.status = status;
    return f;
  }, [shape, color, clarity, status]);

  const { data: diamonds = [], isLoading, isFetching } = useQuery({
    queryKey: ['diamonds', serverFilters],
    queryFn: () => getAllDiamonds(serverFilters),
  });

  /* ── derived ─────────────────────────────────────────────────────── */

  const fmt = (n: number) =>
    n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtCompact = (n: number) =>
    n >= 10000000
      ? `₹${(n / 10000000).toFixed(2)} Cr`
      : n >= 100000
      ? `₹${(n / 100000).toFixed(2)} L`
      : `₹${n.toLocaleString('en-IN')}`;

  const totalCarats = useMemo(
    () => diamonds.reduce((s, d) => s + (d.caratWeight ?? 0), 0),
    [diamonds]
  );
  const totalValue = useMemo(
    () =>
      diamonds.reduce(
        (s, d) => s + (d.totalPrice ?? (d.pricePerCarat ?? 0) * (d.caratWeight ?? 0)),
        0
      ),
    [diamonds]
  );
  const certifiedCount = useMemo(
    () => diamonds.filter((d) => !!d.certificationLab).length,
    [diamonds]
  );
  const inStockCount = useMemo(
    () => diamonds.filter((d) => d.status === 'IN_STOCK').length,
    [diamonds]
  );
  const issuedCount = useMemo(
    () => diamonds.filter((d) => d.status === 'ISSUED').length,
    [diamonds]
  );
  const setCount = useMemo(
    () => diamonds.filter((d) => d.status === 'SET').length,
    [diamonds]
  );

  // Client-side search + sort.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = !q
      ? diamonds
      : diamonds.filter((d) => {
          return (
            d.stockNumber?.toLowerCase().includes(q) ||
            d.certNumber?.toLowerCase().includes(q) ||
            d.certificationLab?.toLowerCase().includes(q) ||
            d.shape?.toLowerCase().includes(q) ||
            d.color?.toLowerCase().includes(q) ||
            d.clarity?.toLowerCase().includes(q)
          );
        });

    const cmp = (a: Diamond, b: Diamond) => {
      const va = (a as any)[sortKey];
      const vb = (b as any)[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return va - vb;
      return String(va).localeCompare(String(vb), 'en', { sensitivity: 'base' });
    };
    list = [...list].sort((a, b) => (sortDir === 'asc' ? cmp(a, b) : -cmp(a, b)));
    return list;
  }, [diamonds, search, sortKey, sortDir]);

  /* ── handlers ────────────────────────────────────────────────────── */

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['diamonds'] });
  };

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(k);
      setSortDir(k === 'stockNumber' ? 'asc' : 'desc');
    }
  };

  const clearFilters = () => {
    setShape('');
    setColor('');
    setClarity('');
    setStatus('all');
    setSearch('');
  };

  const filtersActive =
    !!shape || !!color || !!clarity || status !== 'IN_STOCK' || !!search;

  const exportCsv = () => {
    const header = [
      'Stock No.',
      'Shape',
      'Carat',
      'Color',
      'Clarity',
      'Cut',
      'Cert Lab',
      'Cert No.',
      'Price/ct (INR)',
      'Total Price (INR)',
      'Status',
      'Created',
    ];
    const rows = [header];
    visible.forEach((d) => {
      rows.push([
        d.stockNumber,
        d.shape,
        d.caratWeight?.toString() ?? '',
        d.color,
        d.clarity,
        d.cut ?? '',
        d.certificationLab ?? '',
        d.certNumber ?? '',
        (d.pricePerCarat ?? 0).toFixed(2),
        (d.totalPrice ?? (d.pricePerCarat ?? 0) * (d.caratWeight ?? 0)).toFixed(2),
        STATUS_META[d.status]?.label ?? d.status,
        d.createdAt ? new Date(d.createdAt).toISOString().slice(0, 10) : '',
      ]);
    });
    downloadCsv(rows, `diamonds-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  /* ── chips ───────────────────────────────────────────────────────── */

  const statusChips: { key: StatusKey; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: diamonds.length },
    { key: 'IN_STOCK', label: 'In Stock', count: inStockCount },
    { key: 'ISSUED', label: 'Issued', count: issuedCount },
    { key: 'SET', label: 'Set', count: setCount },
  ];

  /* ── render ──────────────────────────────────────────────────────── */

  return (
    <div className="p-6 bg-gradient-to-br from-champagne-50/40 via-white to-pearl min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <SparklesIcon className="w-8 h-8 text-champagne-700" />
              Diamond Inventory
            </h1>
            <p className="text-gray-600 text-sm">
              Manage diamond stock with 4C grading &middot; live valuations &amp; certification
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ViewToggle view={view} onChange={setView} />
            <button
              onClick={refresh}
              disabled={isFetching}
              aria-label="Refresh inventory"
              title="Refresh"
              className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-champagne-500"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={exportCsv}
              disabled={visible.length === 0}
              aria-label="Export to CSV"
              className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium flex items-center gap-2 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-champagne-500"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={() => navigate('/app/inventory/diamonds/new')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-champagne-700 via-champagne-800 to-onyx-800 hover:from-champagne-800 hover:via-onyx-700 hover:to-onyx-900 text-white text-sm font-semibold flex items-center gap-2 shadow-md shadow-onyx-700/20 focus:outline-none focus:ring-2 focus:ring-champagne-400"
            >
              <PlusIcon className="w-4 h-4" /> Add Diamond
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <KpiCard
            icon={<CubeTransparentIcon className="w-5 h-5" />}
            label="Total Diamonds"
            value={String(diamonds.length)}
            sub={`${inStockCount} in stock`}
            tint="indigo"
          />
          <KpiCard
            icon={<ScaleIcon className="w-5 h-5" />}
            label="Total Carats"
            value={`${totalCarats.toFixed(2)} ct`}
            tint="emerald"
          />
          <KpiCard
            icon={<BanknotesIcon className="w-5 h-5" />}
            label="Inventory Value"
            value={fmtCompact(totalValue)}
            tint="violet"
          />
          <KpiCard
            icon={<CheckBadgeIcon className="w-5 h-5" />}
            label="Certified"
            value={String(certifiedCount)}
            sub={`${diamonds.length ? Math.round((certifiedCount / diamonds.length) * 100) : 0}% of stock`}
            tint="sky"
          />
          <KpiCard
            icon={<SparklesIcon className="w-5 h-5" />}
            label="Issued · Set"
            value={`${issuedCount} · ${setCount}`}
            sub="active workflow"
            tint="rose"
          />
        </div>

        {/* Search + filters */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 mb-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by stock no., cert no., lab, shape, color, clarity…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-champagne-600 focus:border-transparent bg-gray-50 focus:bg-white transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 text-gray-400 focus:outline-none focus:ring-2 focus:ring-champagne-500"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 4C selects + status chips */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1">
              <FilterSelect
                label="Shape"
                value={shape}
                onChange={setShape}
                options={SHAPES.map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() }))}
              />
              <FilterSelect
                label="Color"
                value={color}
                onChange={setColor}
                options={COLORS.map((c) => ({ value: c, label: c }))}
              />
              <FilterSelect
                label="Clarity"
                value={clarity}
                onChange={setClarity}
                options={CLARITIES.map((c) => ({ value: c, label: c }))}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {statusChips.map((c) => {
              const active = status === c.key;
              const meta = c.key !== 'all' ? STATUS_META[c.key] : null;
              return (
                <button
                  key={c.key}
                  onClick={() => setStatus(c.key)}
                  aria-pressed={active}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition flex items-center gap-1.5 ${
                    active
                      ? 'border-champagne-700 bg-champagne-800 text-white shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {meta && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white/80' : meta.dot}`}
                    />
                  )}
                  {c.label}
                  <span
                    className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                      active ? 'bg-white/25' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {c.count}
                  </span>
                </button>
              );
            })}
            {filtersActive && (
              <button
                onClick={clearFilters}
                className="ml-1 px-2.5 py-1.5 rounded-full text-xs font-medium text-rose-700 hover:bg-rose-50 inline-flex items-center gap-1"
              >
                <XMarkIcon className="w-3.5 h-3.5" /> Clear
              </button>
            )}
            <span className="ml-auto text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-700">{visible.length}</span> of{' '}
              {diamonds.length}
            </span>
          </div>
        </div>

        {/* Body */}
        {isLoading ? (
          view === 'grid' ? (
            <SkeletonGrid />
          ) : (
            <SkeletonTable />
          )
        ) : visible.length === 0 ? (
          <EmptyState
            onAdd={() => navigate('/app/inventory/diamonds/new')}
            onClear={clearFilters}
            hasFilters={filtersActive}
          />
        ) : view === 'grid' ? (
          <DiamondGrid
            diamonds={visible}
            fmt={fmt}
            fmtCompact={fmtCompact}
          />
        ) : (
          <DiamondTable
            diamonds={visible}
            fmt={fmt}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
          />
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* Sub-components                                                       */
/* ──────────────────────────────────────────────────────────────────── */

const TINTS: Record<string, { ring: string; text: string; iconBg: string }> = {
  indigo: { ring: 'ring-champagne-200', text: 'text-champagne-800', iconBg: 'bg-champagne-50 text-champagne-700' },
  emerald: { ring: 'ring-emerald-100', text: 'text-emerald-700', iconBg: 'bg-emerald-50 text-emerald-600' },
  rose: { ring: 'ring-rose-100', text: 'text-rose-700', iconBg: 'bg-rose-50 text-rose-600' },
  sky: { ring: 'ring-sky-100', text: 'text-sky-700', iconBg: 'bg-sky-50 text-sky-600' },
  violet: { ring: 'ring-onyx-200', text: 'text-onyx-700', iconBg: 'bg-onyx-100 text-onyx-700' },
};

function KpiCard({
  icon,
  label,
  value,
  sub,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tint: keyof typeof TINTS;
}) {
  const t = TINTS[tint];
  return (
    <div className={`rounded-2xl p-4 bg-white ring-1 ${t.ring} shadow-sm hover:shadow-md transition`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <div className={`p-1.5 rounded-lg ${t.iconBg}`}>{icon}</div>
      </div>
      <div className={`text-2xl font-bold ${t.text} tabular-nums`}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="inline-flex p-1 rounded-xl border border-gray-200 bg-white">
      <button
        onClick={() => onChange('grid')}
        aria-pressed={view === 'grid'}
        aria-label="Grid view"
        className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold transition ${
          view === 'grid' ? 'bg-champagne-50 text-champagne-800' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <Squares2X2Icon className="w-4 h-4" />
        <span className="hidden sm:inline">Grid</span>
      </button>
      <button
        onClick={() => onChange('table')}
        aria-pressed={view === 'table'}
        aria-label="Table view"
        className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold transition ${
          view === 'table' ? 'bg-champagne-50 text-champagne-800' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <TableCellsIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Table</span>
      </button>
    </div>
  );
}

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
    <label className="block">
      <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-3 py-2 pr-9 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-champagne-500 focus:border-transparent"
        >
          <option value="">All {label}s</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </label>
  );
}

/* ── Grid view ───────────────────────────────────────────────────── */

function DiamondGrid({
  diamonds,
  fmt,
  fmtCompact,
}: {
  diamonds: Diamond[];
  fmt: (n: number) => string;
  fmtCompact: (n: number) => string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {diamonds.map((d) => {
        const meta = STATUS_META[d.status] ?? {
          label: d.status,
          cls: 'bg-gray-50 text-gray-700 border-gray-200',
          dot: 'bg-gray-400',
        };
        const total =
          d.totalPrice ?? (d.pricePerCarat ?? 0) * (d.caratWeight ?? 0);
        return (
          <Link
            key={d.id}
            to={`/app/inventory/diamonds/${d.id}`}
            className="group bg-white rounded-2xl border border-gray-100 hover:border-champagne-300 hover:shadow-lg shadow-sm transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-champagne-500"
          >
            {/* Hero band — shape glyph + carat */}
            <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-champagne-50 via-white to-onyx-50/50 border-b border-champagne-100/70">
              <div className="flex items-start justify-between mb-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${meta.cls}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
                {d.certificationLab && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-onyx-900 text-champagne-100 shadow-sm">
                    <CheckBadgeIcon className="w-3 h-3" /> {d.certificationLab}
                  </span>
                )}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">
                    {d.stockNumber}
                  </div>
                  <div className="text-3xl font-bold text-onyx-800 tabular-nums leading-tight">
                    {d.caratWeight?.toFixed(2)}
                    <span className="text-base font-medium text-gray-500 ml-1">ct</span>
                  </div>
                </div>
                <div
                  className="text-5xl text-champagne-400/80 group-hover:text-champagne-600 transition"
                  aria-hidden
                >
                  {SHAPE_GLYPH[d.shape] ?? '◆'}
                </div>
              </div>
              <div className="mt-1 text-xs font-medium text-gray-600 capitalize">
                {d.shape.toLowerCase()}
              </div>
            </div>

            {/* 4C chips */}
            <div className="px-5 py-4 grid grid-cols-3 gap-2">
              <GradeChip label="Color" value={d.color} />
              <GradeChip label="Clarity" value={d.clarity} />
              <GradeChip label="Cut" value={d.cut ?? '—'} />
            </div>

            {/* Footer — price + cert + CTA */}
            <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                    Total Value
                  </div>
                  <div className="text-lg font-bold text-onyx-800 tabular-nums">
                    {total > 0 ? fmtCompact(total) : '—'}
                  </div>
                </div>
                {d.pricePerCarat ? (
                  <div className="text-right">
                    <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                      Per ct
                    </div>
                    <div className="text-sm font-semibold text-gray-700 tabular-nums">
                      ₹{fmt(d.pricePerCarat)}
                    </div>
                  </div>
                ) : null}
              </div>
              {d.certNumber && (
                <div className="text-[11px] font-mono text-gray-500 mb-2 truncate">
                  cert # {d.certNumber}
                </div>
              )}
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-champagne-800 group-hover:text-champagne-900">
                <EyeIcon className="w-3.5 h-3.5" /> View Details
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function GradeChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 px-2 py-2 text-center">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</div>
      <div className="text-sm font-bold text-onyx-800 tabular-nums">{value}</div>
    </div>
  );
}

/* ── Table view ──────────────────────────────────────────────────── */

function DiamondTable({
  diamonds,
  fmt,
  sortKey,
  sortDir,
  onSort,
}: {
  diamonds: Diamond[];
  fmt: (n: number) => string;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const sortIcon = (k: SortKey) => {
    if (sortKey !== k) return <ChevronUpDownIcon className="w-3.5 h-3.5 opacity-40" />;
    return sortDir === 'asc' ? (
      <ChevronUpIcon className="w-3.5 h-3.5" />
    ) : (
      <ChevronDownIcon className="w-3.5 h-3.5" />
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200 sticky top-0 z-10">
            <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <Th onClick={() => onSort('stockNumber')}>
                <span className="flex items-center gap-1">Stock {sortIcon('stockNumber')}</span>
              </Th>
              <Th>Shape</Th>
              <Th align="right" onClick={() => onSort('caratWeight')}>
                <span className="flex items-center justify-end gap-1">Carat {sortIcon('caratWeight')}</span>
              </Th>
              <Th align="center">Color</Th>
              <Th align="center">Clarity</Th>
              <Th align="center">Cut</Th>
              <Th>Cert.</Th>
              <Th align="right" onClick={() => onSort('pricePerCarat')}>
                <span className="flex items-center justify-end gap-1">Price/ct {sortIcon('pricePerCarat')}</span>
              </Th>
              <Th align="right" onClick={() => onSort('totalPrice')}>
                <span className="flex items-center justify-end gap-1">Total {sortIcon('totalPrice')}</span>
              </Th>
              <Th align="center">Status</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {diamonds.map((d) => {
              const meta = STATUS_META[d.status] ?? {
                label: d.status,
                cls: 'bg-gray-50 text-gray-700 border-gray-200',
                dot: 'bg-gray-400',
              };
              const total = d.totalPrice ?? (d.pricePerCarat ?? 0) * (d.caratWeight ?? 0);
              return (
                <tr key={d.id} className="hover:bg-champagne-50/40 transition">
                  <td className="px-4 py-3">
                    <Link
                      to={`/app/inventory/diamonds/${d.id}`}
                      className="font-mono text-xs font-semibold text-champagne-800 hover:text-champagne-900"
                    >
                      {d.stockNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 capitalize text-gray-700">
                      <span className="text-champagne-500" aria-hidden>
                        {SHAPE_GLYPH[d.shape] ?? '◆'}
                      </span>
                      {d.shape.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-onyx-800">
                    {d.caratWeight?.toFixed(2)} ct
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block min-w-[28px] px-2 py-0.5 rounded bg-gray-50 text-gray-800 text-xs font-bold">
                      {d.color}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block min-w-[36px] px-2 py-0.5 rounded bg-gray-50 text-gray-800 text-xs font-bold">
                      {d.clarity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-600">
                    {d.cut ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {d.certificationLab ? (
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-onyx-800">{d.certificationLab}</span>
                        {d.certNumber && (
                          <span className="text-[10px] font-mono text-gray-500 truncate max-w-[140px]">
                            {d.certNumber}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                    {d.pricePerCarat ? `₹${fmt(d.pricePerCarat)}` : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-onyx-800">
                    {total > 0 ? `₹${fmt(total)}` : <span className="text-gray-300 font-normal">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${meta.cls}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/app/inventory/diamonds/${d.id}`}
                      aria-label={`View ${d.stockNumber}`}
                      className="p-2 rounded-lg text-champagne-700 hover:bg-champagne-50 inline-flex"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  children,
  align = 'left',
  onClick,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  onClick?: () => void;
}) {
  const cls = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th
      onClick={onClick}
      className={`px-4 py-3 ${cls} ${onClick ? 'cursor-pointer select-none hover:text-champagne-700' : ''}`}
    >
      {children}
    </th>
  );
}

/* ── Skeletons ───────────────────────────────────────────────────── */

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse"
        >
          <div className="h-32 bg-gradient-to-br from-champagne-50 via-white to-onyx-50/50 border-b border-champagne-100/70" />
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="h-12 bg-gray-100 rounded-xl" />
              <div className="h-12 bg-gray-100 rounded-xl" />
              <div className="h-12 bg-gray-100 rounded-xl" />
            </div>
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0 animate-pulse"
        >
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-3 bg-gray-100 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-12" />
          <div className="h-3 bg-gray-100 rounded w-10" />
          <div className="h-3 bg-gray-100 rounded w-10" />
          <div className="flex-1" />
          <div className="h-3 bg-gray-200 rounded w-20" />
          <div className="h-3 bg-gray-200 rounded w-16" />
        </div>
      ))}
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────── */

function EmptyState({
  onAdd,
  onClear,
  hasFilters,
}: {
  onAdd: () => void;
  onClear: () => void;
  hasFilters: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-champagne-50 text-champagne-700 mx-auto mb-4 flex items-center justify-center">
        <SparklesIcon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {hasFilters ? 'No diamonds match your filters' : 'No diamonds in inventory yet'}
      </h3>
      <p className="text-sm text-gray-500 mb-5 max-w-md mx-auto">
        {hasFilters
          ? 'Try adjusting the search, status or 4C filters above to see more results.'
          : 'Add your first diamond to start tracking 4C grading, certification and valuations.'}
      </p>
      <div className="flex items-center justify-center gap-2">
        {hasFilters ? (
          <button
            onClick={onClear}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold inline-flex items-center gap-2"
          >
            <XMarkIcon className="w-4 h-4" /> Clear filters
          </button>
        ) : null}
        <button
          onClick={onAdd}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-champagne-700 via-champagne-800 to-onyx-800 hover:from-champagne-800 hover:via-onyx-700 hover:to-onyx-900 text-white text-sm font-semibold inline-flex items-center gap-2 shadow-md shadow-onyx-700/20"
        >
          <PlusIcon className="w-4 h-4" /> Add Diamond
        </button>
      </div>
    </div>
  );
}

/* ── CSV helper ──────────────────────────────────────────────────── */

function downloadCsv(rows: any[][], filename: string) {
  const escape = (s: any) => {
    const v = s == null ? '' : String(s);
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  };
  const csv = rows.map((r) => r.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
