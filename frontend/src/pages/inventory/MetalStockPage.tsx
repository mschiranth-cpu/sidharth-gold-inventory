/**
 * ============================================
 * METAL STOCK REGISTER PAGE
 * ============================================
 * Enhanced register with:
 *  - KPI cards (rows, pure grams, estimated value @ live Bangalore rates, vendors)
 *  - Per-metal clickable cards (Gold / Silver / Platinum / Palladium)
 *  - Search + Metal + Purity + Form filters
 *  - Sortable column headers
 *  - Live stock-value column (Bangalore Ambicaa rates with global fallback)
 *  - Vendor pills with unique-code, location chip, batch chip
 *  - CSV export of the current filtered view
 *  - Refresh + freshness indicator
 *  - Loading shimmer + empty state + table totals row
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import { getAllMetalStock } from '../../services/metal.service';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const GRAMS_PER_TROY_OZ = 31.1034768;

// ---------- Live rates (per-gram, used to value stock) ----------

interface AmbicaaResponse {
  data: { perGram: { gold24k: number | null; silver: number | null } };
}

interface SpotResponse {
  price: number;
}

async function fetchAmbicaaRates(): Promise<AmbicaaResponse> {
  const res = await fetch(`${BACKEND_URL}/market-rates/live?city=bangalore`);
  if (!res.ok) throw new Error('Bangalore rates unavailable');
  return res.json();
}

async function fetchUsdInr(): Promise<number> {
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!res.ok) throw new Error('FX unavailable');
  const data = await res.json();
  return data?.rates?.INR ?? 83;
}

async function fetchSpot(code: 'XPT' | 'XPD'): Promise<SpotResponse> {
  const res = await fetch(`https://api.gold-api.com/price/${code}`);
  if (!res.ok) throw new Error('Spot unavailable');
  return res.json();
}

// ---------- Visual config ----------

const METAL_CARDS: { code: string; label: string; icon: string; accent: string; ring: string }[] = [
  { code: 'GOLD', label: 'Gold', icon: '🥇', accent: 'from-amber-400 to-yellow-500', ring: 'ring-amber-300' },
  { code: 'SILVER', label: 'Silver', icon: '🥈', accent: 'from-slate-400 to-slate-500', ring: 'ring-slate-300' },
  { code: 'PLATINUM', label: 'Platinum', icon: '💎', accent: 'from-cyan-400 to-sky-500', ring: 'ring-sky-300' },
  { code: 'PALLADIUM', label: 'Palladium', icon: '🔷', accent: 'from-violet-400 to-purple-500', ring: 'ring-violet-300' },
];

function metalTextClass(metal: string): string {
  if (metal === 'GOLD') return 'text-amber-600';
  if (metal === 'SILVER') return 'text-slate-500';
  if (metal === 'PLATINUM') return 'text-sky-600';
  if (metal === 'PALLADIUM') return 'text-violet-600';
  return 'text-gray-900';
}

function formatGrams(g: number): string {
  if (!g) return '0g';
  if (g >= 1000) return `${(g / 1000).toFixed(2)}kg`;
  return `${g.toFixed(2)}g`;
}

function formatINR(n: number, max = 0): string {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: max })}`;
}

// ---------- Component ----------

type SortKey = 'metalType' | 'purity' | 'form' | 'grossWeight' | 'pureWeight' | 'value';
type SortDir = 'asc' | 'desc';

export default function MetalStockPage() {
  const [metalFilter, setMetalFilter] = useState('');
  const [purityFilter, setPurityFilter] = useState('');
  const [formFilter, setFormFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('value');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const { data: stocks = [], isLoading, dataUpdatedAt, refetch, isFetching } = useQuery({
    queryKey: ['metal-stock-all'],
    queryFn: () => getAllMetalStock(),
    refetchInterval: 30_000,
  });

  // Live rates (refresh every 60s; values used to estimate stock worth)
  const bangalore = useQuery({
    queryKey: ['bangalore-rates-stockpage'],
    queryFn: fetchAmbicaaRates,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const fx = useQuery({ queryKey: ['fx-usd-inr'], queryFn: fetchUsdInr, staleTime: 5 * 60_000 });
  const platinum = useQuery({ queryKey: ['spot-XPT'], queryFn: () => fetchSpot('XPT'), refetchInterval: 60_000 });
  const palladium = useQuery({ queryKey: ['spot-XPD'], queryFn: () => fetchSpot('XPD'), refetchInterval: 60_000 });

  const ratePerGram24k = bangalore.data?.data?.perGram?.gold24k ?? null;
  const ratePerGramSilver = bangalore.data?.data?.perGram?.silver ?? null;
  const usdInr = fx.data ?? 83;
  const ratePerGramPlatinum = platinum.data ? (platinum.data.price / GRAMS_PER_TROY_OZ) * usdInr : null;
  const ratePerGramPalladium = palladium.data ? (palladium.data.price / GRAMS_PER_TROY_OZ) * usdInr : null;

  // Estimate per-row value: pureWeight (24K-equivalent for gold) × per-gram-pure rate
  const stockValue = (s: any): number | null => {
    if (s.metalType === 'GOLD' && ratePerGram24k) return s.pureWeight * ratePerGram24k;
    if (s.metalType === 'SILVER' && ratePerGramSilver) return s.pureWeight * ratePerGramSilver;
    if (s.metalType === 'PLATINUM' && ratePerGramPlatinum) return s.pureWeight * ratePerGramPlatinum;
    if (s.metalType === 'PALLADIUM' && ratePerGramPalladium) return s.pureWeight * ratePerGramPalladium;
    return null;
  };

  // Build filter option lists from data
  const purityOptions = useMemo(() => {
    const s = new Set<number>();
    (stocks as any[]).forEach((r) => s.add(r.purity));
    return Array.from(s).sort((a, b) => b - a);
  }, [stocks]);
  const formOptions = useMemo(() => {
    const s = new Set<string>();
    (stocks as any[]).forEach((r) => r.form && s.add(r.form));
    return Array.from(s).sort();
  }, [stocks]);

  // Apply filters
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (stocks as any[]).filter((s) => {
      if (metalFilter && s.metalType !== metalFilter) return false;
      if (purityFilter && String(s.purity) !== purityFilter) return false;
      if (formFilter && s.form !== formFilter) return false;
      if (q) {
        const hay = [
          s.metalType,
          s.form,
          s.location,
          s.batchNumber,
          ...(s.vendors || []).map((v: any) => `${v?.name} ${v?.uniqueCode}`),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [stocks, metalFilter, purityFilter, formFilter, search]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a: any, b: any) => {
      let av: any;
      let bv: any;
      if (sortKey === 'value') {
        av = stockValue(a) ?? -1;
        bv = stockValue(b) ?? -1;
      } else {
        av = a[sortKey];
        bv = b[sortKey];
      }
      if (typeof av === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, sortKey, sortDir, ratePerGram24k, ratePerGramSilver, ratePerGramPlatinum, ratePerGramPalladium]);

  // Aggregates over the filtered view
  const summary = useMemo(() => {
    const byMetal: Record<string, { grams: number; pure: number; value: number; rows: number }> = {
      GOLD: { grams: 0, pure: 0, value: 0, rows: 0 },
      SILVER: { grams: 0, pure: 0, value: 0, rows: 0 },
      PLATINUM: { grams: 0, pure: 0, value: 0, rows: 0 },
      PALLADIUM: { grams: 0, pure: 0, value: 0, rows: 0 },
    };
    let totalValue = 0;
    let totalPure = 0;
    let totalGross = 0;
    const vendorSet = new Set<string>();
    for (const s of filtered) {
      const v = stockValue(s) ?? 0;
      totalValue += v;
      totalPure += s.pureWeight || 0;
      totalGross += s.grossWeight || 0;
      const bucket = byMetal[s.metalType];
      if (bucket) {
        bucket.grams += s.grossWeight || 0;
        bucket.pure += s.pureWeight || 0;
        bucket.value += v;
        bucket.rows += 1;
      }
      (s.vendors || []).forEach((vendor: any) => vendor?.id && vendorSet.add(vendor.id));
    }
    return { totalValue, totalPure, totalGross, vendors: vendorSet.size, rows: filtered.length, byMetal };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, ratePerGram24k, ratePerGramSilver, ratePerGramPlatinum, ratePerGramPalladium]);

  const hasActiveFilters = !!(metalFilter || purityFilter || formFilter || search.trim());
  const clearAll = () => {
    setMetalFilter('');
    setPurityFilter('');
    setFormFilter('');
    setSearch('');
  };

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(k);
      setSortDir(k === 'metalType' || k === 'form' ? 'asc' : 'desc');
    }
  };

  const lastUpdated = dataUpdatedAt
    ? Math.max(0, Math.round((Date.now() - dataUpdatedAt) / 1000))
    : null;

  // CSV export
  const exportCsv = () => {
    const header = [
      'Metal',
      'Purity',
      'Form',
      'Gross Weight (g)',
      'Pure Weight (g)',
      'Estimated Value (INR)',
      'Vendors',
      'Location',
      'Batch',
    ];
    const rows = sorted.map((s: any) => [
      s.metalType,
      `${s.purity}K`,
      s.form,
      s.grossWeight?.toFixed(3) ?? '0',
      s.pureWeight?.toFixed(3) ?? '0',
      (stockValue(s) ?? 0).toFixed(0),
      (s.vendors || []).map((v: any) => `${v.name} (${v.uniqueCode})`).join(' | '),
      s.location || '',
      s.batchNumber || '',
    ]);
    const csv = [header, ...rows]
      .map((r) =>
        r
          .map((cell) => {
            const str = String(cell ?? '');
            return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
          })
          .join(',')
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metal-stock-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-gradient-to-b from-slate-50 to-white min-h-screen">
        <div className="max-w-[1400px] mx-auto space-y-4">
          <div className="h-10 w-72 bg-gray-200 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-2xl shadow-sm animate-pulse" />
            ))}
          </div>
          <div className="h-72 bg-white rounded-2xl shadow-sm animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-b from-slate-50 to-white min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
              Metal Stock Register
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              {summary.rows} of {(stocks as any[]).length} stock rows
              {hasActiveFilters && ' (filtered)'}
              {lastUpdated !== null && ` · refreshed ${lastUpdated}s ago`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-3 py-2 rounded-xl text-sm font-medium text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
            >
              {isFetching ? 'Refreshing…' : '↻ Refresh'}
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={sorted.length === 0}
              className="px-3 py-2 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              ⬇ Export CSV
            </button>
            <Link to="/app/inventory/metal">
              <Button variant="secondary">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <SummaryCard
            label="Stock Rows"
            value={summary.rows.toString()}
            sub={`${(stocks as any[]).length} total`}
            accent="from-indigo-500 to-indigo-600"
            icon="📦"
          />
          <SummaryCard
            label="Pure Weight"
            value={formatGrams(summary.totalPure)}
            sub={`${formatGrams(summary.totalGross)} gross`}
            accent="from-emerald-500 to-emerald-600"
            icon="⚖️"
          />
          <SummaryCard
            label="Estimated Value"
            value={formatINR(summary.totalValue)}
            sub="@ live Bangalore rates"
            accent="from-amber-500 to-orange-500"
            icon="💰"
          />
          <SummaryCard
            label="Distinct Vendors"
            value={summary.vendors.toString()}
            sub="across filtered rows"
            accent="from-violet-500 to-purple-600"
            icon="🤝"
          />
        </div>

        {/* Per-metal cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {METAL_CARDS.map((m) => {
            const b = summary.byMetal[m.code];
            const active = metalFilter === m.code;
            return (
              <button
                key={m.code}
                type="button"
                onClick={() => setMetalFilter(active ? '' : m.code)}
                className={`text-left p-4 bg-white rounded-2xl shadow-sm border transition-all ${
                  active
                    ? `border-transparent ring-2 ${m.ring}`
                    : 'border-gray-200 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.accent} text-white text-2xl flex items-center justify-center shadow-sm`}
                  >
                    {m.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                      <span>{m.label}</span>
                      <span className="text-gray-300">·</span>
                      <span>{b?.rows ?? 0} ROWS</span>
                      {active && (
                        <span className="ml-auto inline-flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                      )}
                    </div>
                    <div className="text-xl font-bold text-gray-900 mt-0.5">
                      {formatGrams(b?.grams ?? 0)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {b?.value ? formatINR(b.value) : '—'}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Vendor, vendor code, location, batch…"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
            <FilterSelect
              label="Metal"
              value={metalFilter}
              onChange={setMetalFilter}
              options={[
                { value: '', label: 'All metals' },
                ...METAL_CARDS.map((m) => ({ value: m.code, label: m.label })),
              ]}
            />
            <FilterSelect
              label="Purity"
              value={purityFilter}
              onChange={setPurityFilter}
              options={[
                { value: '', label: 'All purities' },
                ...purityOptions.map((p) => ({ value: String(p), label: `${p}K` })),
              ]}
            />
            <FilterSelect
              label="Form"
              value={formFilter}
              onChange={setFormFilter}
              options={[
                { value: '', label: 'All forms' },
                ...formOptions.map((f) => ({ value: f, label: f })),
              ]}
            />
          </div>
          {hasActiveFilters && (
            <div className="mt-3 flex items-center justify-end">
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Live-rate ribbon */}
        <div className="mb-4 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
          <span className="font-semibold text-indigo-800 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Valuation rates
          </span>
          <RateChip label="Gold 24K" value={ratePerGram24k} />
          <RateChip label="Silver" value={ratePerGramSilver} />
          <RateChip label="Platinum" value={ratePerGramPlatinum} />
          <RateChip label="Palladium" value={ratePerGramPalladium} />
          <span className="text-gray-500 ml-auto">Indicative · per gram pure</span>
        </div>

        {/* Stock Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
                <tr>
                  <SortableTh label="Metal" k="metalType" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  <SortableTh label="Purity" k="purity" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  <SortableTh label="Form" k="form" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  <SortableTh label="Gross Weight" k="grossWeight" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                  <SortableTh label="Pure Weight" k="pureWeight" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                  <SortableTh label="Est. Value" k="value" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                  <Th>Vendors</Th>
                  <Th>Location</Th>
                  <Th>Batch</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-sm font-medium text-gray-600">
                          {hasActiveFilters ? 'No stock matches your filters' : 'No metal stock yet'}
                        </p>
                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={clearAll}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                {sorted.map((stock: any, idx: number) => {
                  const value = stockValue(stock);
                  return (
                    <tr
                      key={stock.id}
                      className={`hover:bg-indigo-50/40 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`font-semibold ${metalTextClass(stock.metalType)}`}>
                          {stock.metalType}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {stock.purity}K
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {stock.form || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-semibold text-gray-900">
                        {formatGrams(stock.grossWeight ?? 0)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-gray-700">
                        {formatGrams(stock.pureWeight ?? 0)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-semibold text-gray-900">
                        {value !== null ? formatINR(value) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {stock.vendors && stock.vendors.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[260px]">
                            {stock.vendors.slice(0, 3).map((v: any) => (
                              <span
                                key={v.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-[11px]"
                                title={v.name}
                              >
                                <span className="font-medium text-indigo-900 truncate max-w-[100px]">
                                  {v.name}
                                </span>
                                <span className="font-mono text-indigo-500">{v.uniqueCode}</span>
                              </span>
                            ))}
                            {stock.vendors.length > 3 && (
                              <span className="text-[11px] text-gray-500 self-center">
                                +{stock.vendors.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {stock.location ? (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs">
                            📍 {stock.location}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {stock.batchNumber ? (
                          <span className="font-mono text-xs text-gray-600">{stock.batchNumber}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {sorted.length > 0 && (
                <tfoot className="bg-slate-50 border-t border-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-700" colSpan={3}>
                      Totals ({summary.rows} rows)
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      {formatGrams(summary.totalGross)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      {formatGrams(summary.totalPure)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-700">
                      {formatINR(summary.totalValue)}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Helpers ----------

function SummaryCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex items-center gap-3">
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent} text-white text-xl flex items-center justify-center shadow-sm`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">{label}</div>
        <div className="text-xl font-bold text-gray-900 truncate">{value}</div>
        {sub && <div className="text-[11px] text-gray-500 truncate">{sub}</div>}
      </div>
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
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={`px-4 py-3 text-${align} text-[10px] font-bold tracking-wider text-gray-500 uppercase`}
    >
      {children}
    </th>
  );
}

function SortableTh({
  label,
  k,
  sortKey,
  sortDir,
  onClick,
  align = 'left',
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onClick: (k: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const active = sortKey === k;
  return (
    <th className={`px-4 py-3 text-${align} text-[10px] font-bold tracking-wider text-gray-500 uppercase`}>
      <button
        type="button"
        onClick={() => onClick(k)}
        className={`inline-flex items-center gap-1 hover:text-indigo-700 transition-colors ${
          active ? 'text-indigo-700' : ''
        }`}
      >
        {label}
        <span className="text-[9px]">
          {active ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
}

function RateChip({ label, value }: { label: string; value: number | null }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">
        {value !== null ? `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/g` : '—'}
      </span>
    </span>
  );
}
