/**
 * ============================================
 * STONE PACKET INVENTORY DASHBOARD — mirrors RealStoneInventoryDashboard
 * ============================================
 *   - Onyx hero with primary CTAs (Receive / Issue), refresh + interval picker
 *   - KPI strip (records, pieces, weight, value, purchases MTD)
 *   - Per-quality cards (top 4 by count — AAA/AA/A/B-style)
 *   - NO LiveRatesCard (synthetic stones have no rate card)
 *   - Recent activity panel (last 5 transactions)
 *   - Quick actions (Transactions, Transfer, Quality Grades, Reorder Alerts)
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowsRightLeftIcon,
  ScaleIcon,
  BanknotesIcon,
  CubeTransparentIcon,
  ClockIcon,
  ClipboardDocumentListIcon,
  CurrencyRupeeIcon,
  AdjustmentsHorizontalIcon,
  BellAlertIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  getAllStonePacketTransactions,
  getAllStonePackets,
  getStonePacketStockSummary,
  type StonePacket,
  type StonePacketTransaction,
} from '../../services/stone.service';
import { useRefreshInterval } from '../../contexts/RefreshIntervalContext';
import RefreshIntervalPicker from '../../components/RefreshIntervalPicker';

const QUALITY_META: Record<
  string,
  { label: string; gradient: string; symbol: string }
> = {
  AAA: { label: 'AAA', gradient: 'from-amber-300 via-amber-500 to-amber-700', symbol: '★' },
  AA: { label: 'AA', gradient: 'from-emerald-400 via-emerald-500 to-emerald-700', symbol: '◈' },
  A: { label: 'A', gradient: 'from-sky-400 via-sky-500 to-sky-700', symbol: '◇' },
  B: { label: 'B', gradient: 'from-violet-400 via-violet-500 to-violet-700', symbol: '◊' },
  COMMERCIAL: { label: 'Commercial', gradient: 'from-slate-400 via-slate-500 to-slate-700', symbol: '◆' },
};

const DEFAULT_QUALITY_META = {
  label: 'Other',
  gradient: 'from-slate-300 via-slate-400 to-slate-600',
  symbol: '◆',
};

const TXN_META: Record<string, { label: string; cls: string; dot: string }> = {
  PURCHASE: { label: 'Purchase', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  ISSUE_TO_DEPARTMENT: { label: 'Issue', cls: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  ISSUE: { label: 'Issue', cls: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  RETURN_FROM_DEPARTMENT: { label: 'Return', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  TRANSFER: { label: 'Transfer', cls: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  ADJUSTMENT: { label: 'Adjustment', cls: 'bg-onyx-100 text-onyx-700 border-onyx-200', dot: 'bg-onyx-500' },
};

const fmtCount = (n: number) => n.toLocaleString('en-IN');
const fmtWt = (n: number) => (n ? n.toFixed(2) : '0.00');
const fmtCompactInr = (n: number) => {
  if (!n) return '—';
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};
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

export default function StonePacketInventoryDashboard() {
  const qc = useQueryClient();
  const userMs = useRefreshInterval();
  const ourMs: number | false = userMs === false ? false : Math.max(500, userMs);
  const ourStale = ourMs === false ? 30_000 : Math.max(2_000, Math.min(ourMs, 30_000));

  const summaryQ = useQuery({
    queryKey: ['stone-packet-stock-summary'],
    queryFn: getStonePacketStockSummary,
    refetchInterval: ourMs,
    staleTime: ourStale,
    placeholderData: keepPreviousData,
    retry: 1,
  });

  const packetsQ = useQuery<StonePacket[]>({
    queryKey: ['stone-packets'],
    queryFn: () => getAllStonePackets({}),
    refetchInterval: ourMs,
    staleTime: ourStale,
    placeholderData: keepPreviousData,
    retry: 1,
  });

  const txnQ = useQuery<StonePacketTransaction[]>({
    queryKey: ['stone-packet-transactions'],
    queryFn: () => getAllStonePacketTransactions(),
    refetchInterval: ourMs,
    staleTime: ourStale,
    placeholderData: keepPreviousData,
    retry: 1,
  });

  const summary = summaryQ.data;
  const packets = packetsQ.data ?? [];
  const txns = txnQ.data ?? [];

  const topQualities = useMemo(() => {
    const sorted = [...(summary?.byQuality ?? [])].sort((a, b) => b.count - a.count);
    return sorted.slice(0, 4);
  }, [summary?.byQuality]);

  const recentTxns = useMemo(
    () =>
      [...txns]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [txns]
  );

  const purchasesThisMonth = useMemo(() => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return txns
      .filter((t) => t.transactionType === 'PURCHASE' && new Date(t.createdAt) >= start)
      .reduce((s, t) => s + (t.totalValue ?? 0), 0);
  }, [txns]);

  const isFetching = summaryQ.isFetching || packetsQ.isFetching || txnQ.isFetching;
  const lastUpdated = packetsQ.dataUpdatedAt
    ? Math.max(0, Math.round((Date.now() - packetsQ.dataUpdatedAt) / 1000))
    : null;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['stone-packet-stock-summary'] });
    qc.invalidateQueries({ queryKey: ['stone-packets'] });
    qc.invalidateQueries({ queryKey: ['stone-packet-transactions'] });
  };

  return (
    <div className="p-6 bg-gradient-to-br from-pearl via-white to-champagne-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-onyx-900 via-onyx-800 to-onyx-700 text-pearl shadow-onyx mb-6 p-6 md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gold-leaf-gradient opacity-10 pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.22em] text-champagne-300 font-medium mb-2 flex items-center gap-2">
                <SparklesIcon className="w-3.5 h-3.5" /> Inventory · Stone Packets
              </p>
              <h1 className="font-display text-3xl md:text-4xl font-semibold text-pearl mb-2">
                Stone Packet Inventory
              </h1>
              <p className="text-champagne-100/80 text-sm max-w-xl">
                Bulk synthetic & semi-precious stones (CZ, Kundan, Polki, AD) — packets tracked by
                pieces and weight with reorder alerts.
              </p>
            </div>
            <div className="flex flex-col gap-3 min-w-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs tabular-nums">
                <InlineSummaryPill
                  label="Packets"
                  value={summary ? fmtCount(summary.totalPackets) : null}
                />
                <InlineSummaryPill
                  label="Pieces"
                  value={summary ? fmtCount(summary.totalPieces) : null}
                />
                <InlineSummaryPill
                  label="Weight"
                  value={summary ? fmtWt(summary.totalWeight) : null}
                />
                <InlineSummaryPill
                  label="Purchases MTD"
                  value={fmtCompactInr(purchasesThisMonth)}
                />
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
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
                <Link
                  to="/app/inventory/stone-packets/transfer"
                  className="px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-pearl text-sm font-semibold flex items-center gap-2 backdrop-blur-sm transition focus:outline-none focus:ring-2 focus:ring-champagne-400"
                >
                  <ArrowsRightLeftIcon className="w-4 h-4" /> Transfer
                </Link>
                <Link
                  to="/app/inventory/stone-packets/issue"
                  className="px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-pearl text-sm font-semibold flex items-center gap-2 backdrop-blur-sm transition focus:outline-none focus:ring-2 focus:ring-champagne-400"
                >
                  <ArrowUpTrayIcon className="w-4 h-4" /> Issue Packet
                </Link>
                <Link
                  to="/app/inventory/stone-packets/receive"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-champagne-500 to-champagne-700 hover:from-champagne-600 hover:to-champagne-800 text-onyx-900 text-sm font-semibold flex items-center gap-2 shadow-md shadow-champagne-500/20 focus:outline-none focus:ring-2 focus:ring-champagne-300"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" /> Receive Packet
                </Link>
              </div>
            </div>
          </div>
          {lastUpdated !== null && (
            <p className="relative mt-4 text-[11px] text-champagne-200/70 flex items-center gap-1.5">
              <ClockIcon className="w-3 h-3" /> Refreshed {lastUpdated}s ago
            </p>
          )}
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <KpiCard
            icon={<CubeTransparentIcon className="w-5 h-5" />}
            label="Packets"
            value={fmtCount(summary?.totalPackets ?? 0)}
            sub={`${packets.length} indexed`}
            tint="indigo"
            loading={summaryQ.isLoading}
          />
          <KpiCard
            icon={<SparklesIcon className="w-5 h-5" />}
            label="Total Pieces"
            value={fmtCount(summary?.totalPieces ?? 0)}
            sub="across all packets"
            tint="emerald"
            loading={summaryQ.isLoading}
          />
          <KpiCard
            icon={<ScaleIcon className="w-5 h-5" />}
            label="Total Weight"
            value={fmtWt(summary?.totalWeight ?? 0)}
            sub="(carat / gram mixed)"
            tint="sky"
            loading={summaryQ.isLoading}
          />
          <KpiCard
            icon={<BanknotesIcon className="w-5 h-5" />}
            label="Inventory Value"
            value={fmtCompactInr(summary?.totalValue ?? 0)}
            sub="@ purchase rate"
            tint="violet"
            loading={summaryQ.isLoading}
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

        {/* Per-quality cards */}
        {topQualities.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {topQualities.map((q) => {
              const meta = QUALITY_META[q.quality] ?? DEFAULT_QUALITY_META;
              return (
                <Link
                  key={q.quality}
                  to={`/app/inventory/stone-packets/transactions?quality=${q.quality}`}
                  className="group relative bg-white rounded-2xl shadow-sm border border-champagne-100 hover:border-champagne-300 hover:shadow-lg transition overflow-hidden focus:outline-none focus:ring-2 focus:ring-champagne-500"
                >
                  <div className={`h-1 bg-gradient-to-r ${meta.gradient}`} />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-[10px] font-bold tracking-widest text-onyx-400 uppercase">
                          Quality
                        </div>
                        <div className="text-2xl font-bold text-onyx-900 tabular-nums leading-tight">
                          {meta.label}
                        </div>
                        <div className="text-xs text-onyx-500">
                          {q.count} {q.count === 1 ? 'packet' : 'packets'}
                        </div>
                      </div>
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.gradient} text-white text-base font-bold flex items-center justify-center shadow-sm`}
                        aria-hidden
                      >
                        {meta.symbol}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[10px] font-semibold text-onyx-400 uppercase">Pieces</div>
                        <div className="text-base font-bold tabular-nums text-onyx-900">
                          {fmtCount(q.pieces ?? 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-onyx-400 uppercase">Weight</div>
                        <div className="text-base font-bold tabular-nums text-onyx-900">
                          {fmtWt(q.weight ?? 0)}
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 mt-2 border-t border-gray-100 flex items-end justify-between">
                      <div>
                        <div className="text-[10px] font-semibold text-onyx-400 uppercase">Value</div>
                        <div
                          className={`text-base font-bold tabular-nums ${q.value > 0 ? 'text-onyx-900' : 'text-onyx-300'}`}
                        >
                          {q.value > 0 ? fmtCompactInr(q.value) : '—'}
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-champagne-700 group-hover:text-champagne-900">
                        View <ArrowRightIcon className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Two-column: Recent activity + Quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-champagne-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-onyx-900 flex items-center gap-2">
                <ClipboardDocumentListIcon className="w-5 h-5 text-champagne-700" />
                Recent Activity
              </h2>
              <Link
                to="/app/inventory/stone-packets/transactions"
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
                message="No stone packet transactions yet"
                hint="Receive packets to see activity here."
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
                  const quality = t.packet?.quality ?? '';
                  const qm = QUALITY_META[quality] ?? DEFAULT_QUALITY_META;
                  return (
                    <li
                      key={t.id}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-champagne-50/40 transition"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${qm.gradient} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}
                        aria-hidden
                      >
                        {qm.symbol}
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
                            {t.quantity != null
                              ? `${t.quantity} ${t.unit ?? ''}`
                              : (t.packet?.packetNumber ?? 'Packet')}
                          </span>
                          <span className="text-xs text-onyx-500">
                            {[t.packet?.stoneType, t.packet?.color, quality]
                              .filter(Boolean)
                              .join(' · ') || '—'}
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

          <div className="space-y-3">
            <h2 className="text-xs font-bold tracking-wider text-onyx-400 uppercase px-1">
              Quick Actions
            </h2>
            <ActionTile
              to="/app/inventory/stone-packets/transactions"
              icon={<ClipboardDocumentListIcon className="w-5 h-5" />}
              label="All Transactions"
              hint={`${txns.length} purchases, issues & transfers`}
              tint="emerald"
            />
            <ActionTile
              to="/app/inventory/stone-packets/transfer"
              icon={<ArrowsRightLeftIcon className="w-5 h-5" />}
              label="Transfer"
              hint="Move stock between locations"
              tint="sky"
            />
            <ActionTile
              to="/app/inventory/stone-packets/quality"
              icon={<AdjustmentsHorizontalIcon className="w-5 h-5" />}
              label="Quality Grades"
              hint="View stones grouped by quality"
              tint="indigo"
            />
            <ActionTile
              to="/app/inventory/stone-packets/reorder"
              icon={<BellAlertIcon className="w-5 h-5" />}
              label="Reorder Alerts"
              hint="Low-stock packets needing reorder"
              tint="rose"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const TINTS: Record<string, { ring: string; text: string; iconBg: string }> = {
  indigo: { ring: 'ring-champagne-200', text: 'text-champagne-800', iconBg: 'bg-champagne-50 text-champagne-700' },
  emerald: { ring: 'ring-emerald-100', text: 'text-emerald-700', iconBg: 'bg-emerald-50 text-emerald-600' },
  rose: { ring: 'ring-rose-100', text: 'text-rose-700', iconBg: 'bg-rose-50 text-rose-600' },
  sky: { ring: 'ring-sky-100', text: 'text-sky-700', iconBg: 'bg-sky-50 text-sky-600' },
  violet: { ring: 'ring-onyx-200', text: 'text-onyx-700', iconBg: 'bg-onyx-100 text-onyx-700' },
};

function InlineSummaryPill({ label, value }: { label: string; value: string | null }) {
  const hasValue = value != null;
  return (
    <div className="rounded-lg bg-onyx-800/60 border border-onyx-700 px-3 py-2">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-champagne-300/80">
        <span>{label}</span>
        {hasValue && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" title="Live" />}
      </div>
      <div className={`font-semibold mt-0.5 tabular-nums ${hasValue ? 'text-pearl' : 'text-champagne-300/40'}`}>
        {hasValue ? value : '—'}
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
