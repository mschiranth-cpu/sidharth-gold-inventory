/**
 * ============================================
 * METAL INVENTORY DASHBOARD — Enhanced (luxe inventory hub)
 * ============================================
 *
 * Pattern parity with VendorsPage / DiamondListPage / repo UX conventions:
 *   - Onyx hero with primary CTAs (Receive / Issue) and secondary chips
 *   - KPI strip (rows, pure grams, est. value @ live rates, vendors, transactions)
 *   - Per-metal cards (Gold / Silver / Platinum / Palladium) with totals + values
 *   - LiveMetalRatesCard (kept as-is — already great)
 *   - Recent activity panel (last 5 transactions, rich pills)
 *   - Quick actions grid (Stock register, Transactions, Melting, Rates)
 *   - Skeleton loaders, refresh button (spins while fetching), freshness label
 *   - Heroicons throughout (per repo convention), ARIA labels on icon buttons
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ScaleIcon,
  BanknotesIcon,
  CubeTransparentIcon,
  UsersIcon,
  ClockIcon,
  ClipboardDocumentListIcon,
  FireIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
  Squares2X2Icon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  getMetalStockSummary,
  getAllMetalStock,
  getAllMetalTransactions,
  type MetalStock,
  type MetalTransaction,
} from '../../services/metal.service';
import { useRefreshInterval } from '../../contexts/RefreshIntervalContext';
import RefreshIntervalPicker from '../../components/RefreshIntervalPicker';

/* ─────────────────────────────────────────────────────────────── */
/* Live rate sources (for stock valuation)                         */
/* ─────────────────────────────────────────────────────────────── */

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const GRAMS_PER_TROY_OZ = 31.1034768;

interface AmbicaaResponse {
  data: { perGram: { gold24k: number | null; silver: number | null } };
}

async function fetchAmbicaa(): Promise<AmbicaaResponse> {
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

async function fetchSpot(code: 'XPT' | 'XPD'): Promise<{ price: number }> {
  const res = await fetch(`https://api.gold-api.com/price/${code}`);
  if (!res.ok) throw new Error(`spot ${code} unavailable`);
  return res.json();
}

/* ─────────────────────────────────────────────────────────────── */
/* Visual config                                                    */
/* ─────────────────────────────────────────────────────────────── */

const METAL_META: Record<
  string,
  { label: string; gradient: string; ring: string; chip: string; symbol: string }
> = {
  GOLD: {
    label: 'Gold',
    gradient: 'from-amber-400 via-amber-500 to-yellow-600',
    ring: 'ring-amber-200',
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
    symbol: 'Au',
  },
  SILVER: {
    label: 'Silver',
    gradient: 'from-slate-300 via-slate-400 to-slate-600',
    ring: 'ring-slate-200',
    chip: 'bg-slate-50 text-slate-700 border-slate-200',
    symbol: 'Ag',
  },
  PLATINUM: {
    label: 'Platinum',
    gradient: 'from-cyan-300 via-sky-400 to-sky-600',
    ring: 'ring-sky-200',
    chip: 'bg-sky-50 text-sky-700 border-sky-200',
    symbol: 'Pt',
  },
  PALLADIUM: {
    label: 'Palladium',
    gradient: 'from-violet-400 via-violet-500 to-violet-700',
    ring: 'ring-violet-200',
    chip: 'bg-violet-50 text-violet-700 border-violet-200',
    symbol: 'Pd',
  },
};

const TXN_META: Record<string, { label: string; cls: string; dot: string }> = {
  PURCHASE: { label: 'Purchase', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  SALE: { label: 'Sale', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  ISSUE: { label: 'Issue', cls: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  RECEIVE: { label: 'Receive', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  RETURN: { label: 'Return', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  ADJUSTMENT: { label: 'Adjustment', cls: 'bg-onyx-100 text-onyx-700 border-onyx-200', dot: 'bg-onyx-500' },
};

/* ─────────────────────────────────────────────────────────────── */
/* Formatters                                                       */
/* ─────────────────────────────────────────────────────────────── */

const fmtGrams = (g: number) => {
  if (!g) return '0 g';
  if (g >= 1000) return `${(g / 1000).toFixed(2)} kg`;
  return `${g.toFixed(2)} g`;
};

const fmtCompactInr = (n: number) => {
  if (!n) return '—';
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const fmtInr = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const fmtTimeAgo = (iso?: string) => {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

/* ─────────────────────────────────────────────────────────────── */
/* Page                                                             */
/* ─────────────────────────────────────────────────────────────── */

export default function MetalInventoryDashboard() {
  const qc = useQueryClient();
  // Site-wide refresh cadence (header picker). Backend-cached queries follow it
  // directly; public spot APIs (api.gold-api.com) are floored to 60s.
  const userMs = useRefreshInterval();
  const ourMs: number | false = userMs === false ? false : Math.max(500, userMs);
  const spotMs: number | false = userMs === false ? false : Math.max(60_000, userMs);

  // Cache for at least 5 s so back-to-back renders don't blank the cards.
  const ourStale = ourMs === false ? 30_000 : Math.max(2_000, Math.min(ourMs, 30_000));

  const summaryQ = useQuery({
    queryKey: ['metal-stock-summary'],
    queryFn: getMetalStockSummary,
    refetchInterval: ourMs,
    staleTime: ourStale,
    placeholderData: keepPreviousData,
  });

  const stockQ = useQuery({
    queryKey: ['metal-stock-all'],
    queryFn: () => getAllMetalStock(),
    refetchInterval: ourMs,
    staleTime: ourStale,
    placeholderData: keepPreviousData,
  });

  const txnQ = useQuery({
    queryKey: ['metal-transactions-recent'],
    queryFn: () => getAllMetalTransactions(),
    refetchInterval: ourMs,
    staleTime: ourStale,
    placeholderData: keepPreviousData,
  });

  // Public bullion APIs are slow & flaky — never let them block the dashboard.
  // Treat them as best-effort: long stale window, no retry storm.
  const ambicaaQ = useQuery({
    queryKey: ['bangalore-rates-dashboard'],
    queryFn: fetchAmbicaa,
    refetchInterval: ourMs,
    staleTime: 60_000,
    retry: 1,
    placeholderData: keepPreviousData,
  });
  const fxQ = useQuery({
    queryKey: ['fx-usd-inr'],
    queryFn: fetchUsdInr,
    staleTime: 5 * 60_000,
    retry: 1,
    placeholderData: keepPreviousData,
  });
  const ptQ = useQuery({
    queryKey: ['spot-XPT'],
    queryFn: () => fetchSpot('XPT'),
    refetchInterval: spotMs,
    staleTime: 60_000,
    retry: 1,
    placeholderData: keepPreviousData,
  });
  const pdQ = useQuery({
    queryKey: ['spot-XPD'],
    queryFn: () => fetchSpot('XPD'),
    refetchInterval: spotMs,
    staleTime: 60_000,
    retry: 1,
    placeholderData: keepPreviousData,
  });

  const ratePerGram = {
    GOLD: ambicaaQ.data?.data?.perGram?.gold24k ?? null,
    SILVER: ambicaaQ.data?.data?.perGram?.silver ?? null,
    PLATINUM: ptQ.data ? (ptQ.data.price / GRAMS_PER_TROY_OZ) * (fxQ.data ?? 83) : null,
    PALLADIUM: pdQ.data ? (pdQ.data.price / GRAMS_PER_TROY_OZ) * (fxQ.data ?? 83) : null,
  };

  const stocks: MetalStock[] = stockQ.data ?? [];
  const txns: MetalTransaction[] = txnQ.data ?? [];

  /* ── derived ──────────────────────────────────────────────────── */

  const valueOfRow = (s: MetalStock) => {
    const r = ratePerGram[s.metalType as keyof typeof ratePerGram];
    if (r == null) return null;
    return (s.pureWeight ?? 0) * r;
  };

  const totals = useMemo(() => {
    const byMetal: Record<
      string,
      { rows: number; gross: number; pure: number; value: number; hasRate: boolean }
    > = {
      GOLD: { rows: 0, gross: 0, pure: 0, value: 0, hasRate: ratePerGram.GOLD != null },
      SILVER: { rows: 0, gross: 0, pure: 0, value: 0, hasRate: ratePerGram.SILVER != null },
      PLATINUM: { rows: 0, gross: 0, pure: 0, value: 0, hasRate: ratePerGram.PLATINUM != null },
      PALLADIUM: { rows: 0, gross: 0, pure: 0, value: 0, hasRate: ratePerGram.PALLADIUM != null },
    };
    let totalValue = 0;
    let totalPure = 0;
    let totalGross = 0;
    const vendorIds = new Set<string>();

    for (const s of stocks) {
      const v = valueOfRow(s) ?? 0;
      totalValue += v;
      totalPure += s.pureWeight ?? 0;
      totalGross += s.grossWeight ?? 0;
      const bucket = byMetal[s.metalType];
      if (bucket) {
        bucket.rows += 1;
        bucket.gross += s.grossWeight ?? 0;
        bucket.pure += s.pureWeight ?? 0;
        bucket.value += v;
      }
      ((s as any).vendors || []).forEach((v: any) => v?.id && vendorIds.add(v.id));
    }
    return { totalValue, totalPure, totalGross, vendors: vendorIds.size, rows: stocks.length, byMetal };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stocks, ratePerGram.GOLD, ratePerGram.SILVER, ratePerGram.PLATINUM, ratePerGram.PALLADIUM]);

  const recentTxns = useMemo(() => {
    return [...txns]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [txns]);

  const purchasesThisMonth = useMemo(() => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return txns
      .filter(
        (t) =>
          (t.transactionType === 'PURCHASE' || t.transactionType === 'RECEIVE') &&
          new Date(t.createdAt) >= start
      )
      .reduce((s, t) => s + (t.totalValue ?? 0), 0);
  }, [txns]);

  const isFetching =
    summaryQ.isFetching || stockQ.isFetching || txnQ.isFetching;

  const lastUpdated = stockQ.dataUpdatedAt
    ? Math.max(0, Math.round((Date.now() - stockQ.dataUpdatedAt) / 1000))
    : null;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['metal-stock-summary'] });
    qc.invalidateQueries({ queryKey: ['metal-stock-all'] });
    qc.invalidateQueries({ queryKey: ['metal-transactions-recent'] });
    qc.invalidateQueries({ queryKey: ['bangalore-rates-dashboard'] });
  };

  /* ── render ──────────────────────────────────────────────────── */

  return (
    <div className="p-6 bg-gradient-to-br from-pearl via-white to-champagne-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Hero header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-onyx-900 via-onyx-800 to-onyx-700 text-pearl shadow-onyx mb-6 p-6 md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-champagne-500/20 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gold-leaf-gradient opacity-10 pointer-events-none" />
          <div className="relative flex flex-col gap-6">
            {/* Top: title + live rates strip */}
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
              <div className="min-w-0 max-w-xl">
                <p className="text-[11px] uppercase tracking-[0.22em] text-champagne-300 font-medium mb-2 flex items-center gap-2">
                  <SparklesIcon className="w-3.5 h-3.5" />
                  Inventory · Precious Metal
                </p>
                <h1 className="font-display text-3xl md:text-4xl font-semibold text-pearl mb-2">
                  Metal Inventory
                </h1>
                <p className="text-champagne-100/80 text-sm">
                  Live valuation across Gold, Silver, Platinum &amp; Palladium — purchases, melting and
                  vendor balances, all in one place.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 text-xs tabular-nums xl:min-w-[640px]">
                <InlineRatePill label="Gold 24K" value={ratePerGram.GOLD} />
                <InlineRatePill label="Gold 22K" value={ratePerGram.GOLD == null ? null : ratePerGram.GOLD * (22 / 24)} />
                <InlineRatePill label="Gold 18K" value={ratePerGram.GOLD == null ? null : ratePerGram.GOLD * (18 / 24)} />
                <InlineRatePill label="Silver" value={ratePerGram.SILVER} />
                <InlineRatePill label="Platinum" value={ratePerGram.PLATINUM} />
                <InlineRatePill label="Palladium" value={ratePerGram.PALLADIUM} />
              </div>
            </div>

            {/* Bottom: meta toolbar + actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-white/10">
              <div className="flex items-center flex-wrap gap-2 text-[11px] text-champagne-200/70">
                {lastUpdated !== null && (
                  <span className="inline-flex items-center gap-1.5">
                    <ClockIcon className="w-3.5 h-3.5" /> Refreshed {lastUpdated}s ago
                  </span>
                )}
                <span className="opacity-30 hidden sm:inline">·</span>
                <RefreshIntervalPicker variant="dark" />
                <button
                  onClick={refresh}
                  disabled={isFetching}
                  aria-label="Refresh dashboard"
                  title="Refresh"
                  className="p-2.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-pearl disabled:opacity-50 backdrop-blur-sm transition focus:outline-none focus:ring-2 focus:ring-champagne-400"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Link
                  to="/app/inventory/metal/issue"
                  className="px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-pearl text-sm font-semibold flex items-center gap-2 backdrop-blur-sm transition focus:outline-none focus:ring-2 focus:ring-champagne-400"
                >
                  <ArrowUpTrayIcon className="w-4 h-4" /> Issue Metal
                </Link>
                <Link
                  to="/app/inventory/metal/receive"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-champagne-500 to-champagne-700 hover:from-champagne-600 hover:to-champagne-800 text-onyx-900 text-sm font-semibold flex items-center gap-2 shadow-md shadow-champagne-500/20 focus:outline-none focus:ring-2 focus:ring-champagne-300"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" /> Receive Metal
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <KpiCard
            icon={<CubeTransparentIcon className="w-5 h-5" />}
            label="Stock Rows"
            value={String(totals.rows)}
            sub={`${(summaryQ.data ?? []).length} buckets`}
            tint="indigo"
            loading={stockQ.isLoading}
          />
          <KpiCard
            icon={<ScaleIcon className="w-5 h-5" />}
            label="Pure Weight"
            value={fmtGrams(totals.totalPure)}
            sub={`${fmtGrams(totals.totalGross)} gross`}
            tint="emerald"
            loading={stockQ.isLoading}
          />
          <KpiCard
            icon={<BanknotesIcon className="w-5 h-5" />}
            label="Inventory Value"
            value={fmtCompactInr(totals.totalValue)}
            sub="@ live rates"
            tint="violet"
            loading={stockQ.isLoading}
          />
          <KpiCard
            icon={<UsersIcon className="w-5 h-5" />}
            label="Vendors"
            value={String(totals.vendors)}
            sub="across stock"
            tint="sky"
            loading={stockQ.isLoading}
          />
          <KpiCard
            icon={<CurrencyRupeeIcon className="w-5 h-5" />}
            label="Purchases (MTD)"
            value={fmtCompactInr(purchasesThisMonth)}
            sub={`${txns.length} txns total`}
            tint="rose"
            loading={txnQ.isLoading}
          />
        </div>

        {/* Per-metal cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {(['GOLD', 'SILVER', 'PLATINUM', 'PALLADIUM'] as const).map((code) => {
            const m = METAL_META[code]!;
            const b = totals.byMetal[code]!;
            const rate = ratePerGram[code];
            return (
              <Link
                key={code}
                to={`/app/inventory/metal/stock?metal=${code}`}
                className="group relative bg-white rounded-2xl shadow-sm border border-champagne-100 hover:border-champagne-300 hover:shadow-lg transition overflow-hidden focus:outline-none focus:ring-2 focus:ring-champagne-500"
              >
                <div className={`h-1 bg-gradient-to-r ${m.gradient}`} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-[10px] font-bold tracking-widest text-onyx-400 uppercase">
                        {m.label}
                      </div>
                      <div className="text-2xl font-bold text-onyx-900 tabular-nums leading-tight">
                        {fmtGrams(b.gross)}
                      </div>
                      <div className="text-xs text-onyx-500">
                        Pure {fmtGrams(b.pure)} · {b.rows} {b.rows === 1 ? 'row' : 'rows'}
                      </div>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.gradient} text-white text-base font-bold flex items-center justify-center shadow-sm`}
                      aria-hidden
                    >
                      {m.symbol}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex items-end justify-between">
                    <div>
                      <div className="text-[10px] font-semibold text-onyx-400 uppercase">Value</div>
                      <div className={`text-base font-bold tabular-nums ${b.value > 0 ? 'text-onyx-900' : 'text-onyx-300'}`}>
                        {b.value > 0 ? fmtCompactInr(b.value) : '—'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-semibold text-onyx-400 uppercase">Rate/g</div>
                      <div className="text-xs font-semibold text-onyx-700 tabular-nums">
                        {rate != null ? fmtInr(rate) : <span className="text-onyx-300">—</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-champagne-700 group-hover:text-champagne-900">
                    View stock <ArrowRightIcon className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Two-column: Recent activity + Quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent transactions */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-champagne-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-onyx-900 flex items-center gap-2">
                <ClipboardDocumentListIcon className="w-5 h-5 text-champagne-700" />
                Recent Activity
              </h2>
              <Link
                to="/app/inventory/metal/transactions"
                className="text-xs font-semibold text-champagne-700 hover:text-champagne-900 inline-flex items-center gap-1"
              >
                View all <ArrowRightIcon className="w-3 h-3" />
              </Link>
            </div>
            {txnQ.isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-xl bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-2/5" />
                      <div className="h-2 bg-gray-100 rounded w-1/3" />
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-20" />
                  </div>
                ))}
              </div>
            ) : recentTxns.length === 0 ? (
              <EmptyInline
                icon={<ClipboardDocumentListIcon className="w-7 h-7" />}
                message="No metal transactions yet"
                hint="Receive metal to see activity here."
              />
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentTxns.map((t) => {
                  const meta =
                    TXN_META[t.transactionType] ?? {
                      label: t.transactionType,
                      cls: 'bg-gray-50 text-gray-700 border-gray-200',
                      dot: 'bg-gray-400',
                    };
                  const m = METAL_META[t.metalType];
                  return (
                    <li
                      key={t.id}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-champagne-50/40 transition"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${m?.gradient ?? 'from-gray-300 to-gray-500'} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}
                        aria-hidden
                      >
                        {m?.symbol ?? '·'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${meta.cls}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </span>
                          <span className="text-sm font-semibold text-onyx-900">
                            {fmtGrams(t.grossWeight ?? 0)}
                          </span>
                          <span className="text-xs text-onyx-500">
                            {t.metalType} · {t.purity}K · {t.form}
                          </span>
                          {t.vendor && (
                            <span className="text-xs text-champagne-700 font-medium truncate max-w-[160px]">
                              {t.vendor.name}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-onyx-400 mt-0.5">
                          {fmtTimeAgo(t.createdAt)}
                          {t.createdBy?.name && ` · by ${t.createdBy.name}`}
                        </div>
                      </div>
                      <div className="text-right tabular-nums flex-shrink-0">
                        <div className="text-sm font-bold text-onyx-900">
                          {t.totalValue ? fmtCompactInr(t.totalValue) : <span className="text-onyx-300">—</span>}
                        </div>
                        {t.paymentStatus && (
                          <div
                            className={`text-[10px] font-semibold ${
                              t.paymentStatus === 'COMPLETE'
                                ? 'text-emerald-600'
                                : t.paymentStatus === 'HALF'
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {t.paymentStatus}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Quick actions */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold tracking-wider text-onyx-400 uppercase px-1">
              Quick Actions
            </h2>
            <ActionTile
              to="/app/inventory/metal/stock"
              icon={<Squares2X2Icon className="w-5 h-5" />}
              label="Stock Register"
              hint="Detailed table by metal & purity"
              tint="indigo"
            />
            <ActionTile
              to="/app/inventory/metal/transactions"
              icon={<ClipboardDocumentListIcon className="w-5 h-5" />}
              label="All Transactions"
              hint={`${txns.length} purchases, sales & issues`}
              tint="emerald"
            />
            <ActionTile
              to="/app/inventory/metal/melting"
              icon={<FireIcon className="w-5 h-5" />}
              label="Melting Batches"
              hint="Track wastage & purity uplift"
              tint="rose"
            />
            <ActionTile
              to="/app/inventory/metal/rates"
              icon={<ChartBarIcon className="w-5 h-5" />}
              label="Rate Management"
              hint="Override or pin metal rates"
              tint="violet"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Sub-components                                                   */
/* ─────────────────────────────────────────────────────────────── */

const TINTS: Record<string, { ring: string; text: string; iconBg: string }> = {
  indigo: { ring: 'ring-champagne-200', text: 'text-champagne-800', iconBg: 'bg-champagne-50 text-champagne-700' },
  emerald: { ring: 'ring-emerald-100', text: 'text-emerald-700', iconBg: 'bg-emerald-50 text-emerald-600' },
  rose: { ring: 'ring-rose-100', text: 'text-rose-700', iconBg: 'bg-rose-50 text-rose-600' },
  sky: { ring: 'ring-sky-100', text: 'text-sky-700', iconBg: 'bg-sky-50 text-sky-600' },
  violet: { ring: 'ring-onyx-200', text: 'text-onyx-700', iconBg: 'bg-onyx-100 text-onyx-700' },
};

function InlineRatePill({ label, value }: { label: string; value: number | null }) {
  const hasValue = value != null && Number.isFinite(value);
  const display = hasValue ? `\u20B9${Math.round(value as number).toLocaleString('en-IN')}` : '—';
  return (
    <div className="rounded-lg bg-onyx-800/60 border border-onyx-700 px-3 py-2">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-champagne-300/80">
        <span>{label}</span>
        {hasValue && (
          <span
            className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"
            title="Live"
          />
        )}
      </div>
      <div className={`font-semibold mt-0.5 tabular-nums ${hasValue ? 'text-pearl' : 'text-champagne-300/40'}`}>
        {display}
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  tint,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tint: keyof typeof TINTS;
  loading?: boolean;
}) {
  const t = TINTS[tint]!;
  return (
    <div className={`rounded-2xl p-4 bg-white ring-1 ${t.ring} shadow-sm hover:shadow-md transition`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <div className={`p-1.5 rounded-lg ${t.iconBg}`}>{icon}</div>
      </div>
      {loading ? (
        <div className="space-y-1.5">
          <div className="h-6 bg-gray-100 rounded w-2/3 animate-pulse" />
          {sub && <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />}
        </div>
      ) : (
        <>
          <div className={`text-2xl font-bold ${t.text} tabular-nums`}>{value}</div>
          {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
        </>
      )}
    </div>
  );
}

function ActionTile({
  to,
  icon,
  label,
  hint,
  tint,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
  tint: keyof typeof TINTS;
}) {
  const t = TINTS[tint]!;
  return (
    <Link
      to={to}
      className="group block bg-white rounded-2xl shadow-sm border border-champagne-100 hover:border-champagne-300 hover:shadow-md transition p-4 focus:outline-none focus:ring-2 focus:ring-champagne-500"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${t.iconBg} flex-shrink-0`}>{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-onyx-900 group-hover:text-champagne-800 transition">
            {label}
          </div>
          <div className="text-[11px] text-onyx-500 truncate">{hint}</div>
        </div>
        <ArrowRightIcon className="w-4 h-4 text-onyx-300 group-hover:text-champagne-700 transition" />
      </div>
    </Link>
  );
}

function EmptyInline({
  icon,
  message,
  hint,
}: {
  icon: React.ReactNode;
  message: string;
  hint?: string;
}) {
  return (
    <div className="p-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-champagne-50 text-champagne-700 mx-auto mb-3 flex items-center justify-center">
        {icon}
      </div>
      <div className="text-sm font-semibold text-onyx-700">{message}</div>
      {hint && <div className="text-xs text-onyx-400 mt-1">{hint}</div>}
    </div>
  );
}
