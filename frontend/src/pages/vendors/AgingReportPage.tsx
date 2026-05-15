/**
 * Vendor Aging Report — outstanding payables bucketed by how many days
 * past the dueDate each open invoice is. Sums across all 4 PURCHASE
 * domains (metal / diamond / real-stone / stone-packet).
 *
 * Buckets (matches backend `/api/vendors/aging`):
 *   current   — not yet overdue (dueDate >= today)
 *   1–30      — 1 to 30 days overdue
 *   31–60     — 31 to 60 days overdue
 *   61–90     — 61 to 90 days overdue
 *   90+       — more than 90 days overdue
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  listVendorAging,
  type VendorAging,
} from '../../services/vendor.service';

const inr = (n: number) =>
  `₹${Math.round(n).toLocaleString('en-IN')}`;

type BucketKey = 'current' | 'd1_30' | 'd31_60' | 'd61_90' | 'over_90';

const BUCKETS: Array<{
  key: BucketKey;
  label: string;
  shortLabel: string;
  cellCls: string;
  totalCls: string;
}> = [
  {
    key: 'current',
    label: 'Current (not yet due)',
    shortLabel: 'Current',
    cellCls: 'text-emerald-700',
    totalCls: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  },
  {
    key: 'd1_30',
    label: '1–30 days overdue',
    shortLabel: '1–30 d',
    cellCls: 'text-amber-700',
    totalCls: 'bg-amber-50 text-amber-800 ring-amber-200',
  },
  {
    key: 'd31_60',
    label: '31–60 days overdue',
    shortLabel: '31–60 d',
    cellCls: 'text-orange-700',
    totalCls: 'bg-orange-50 text-orange-800 ring-orange-200',
  },
  {
    key: 'd61_90',
    label: '61–90 days overdue',
    shortLabel: '61–90 d',
    cellCls: 'text-rose-700',
    totalCls: 'bg-rose-50 text-rose-800 ring-rose-200',
  },
  {
    key: 'over_90',
    label: '90+ days overdue',
    shortLabel: '90+ d',
    cellCls: 'text-red-700 font-semibold',
    totalCls: 'bg-red-50 text-red-800 ring-red-200',
  },
];

/**
 * CSV escape — guards against commas, quotes, and newlines in vendor names.
 * Keeps the export friendly to Excel/Google Sheets without a heavy dep.
 */
function csvField(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(filename: string, rows: VendorAging[]): void {
  const header = [
    'Vendor Code',
    'Vendor Name',
    'Current',
    '1-30 days',
    '31-60 days',
    '61-90 days',
    '90+ days',
    'Total Open',
    'Open Bills',
  ];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(
      [
        csvField(r.uniqueCode),
        csvField(r.name),
        r.current,
        r.d1_30,
        r.d31_60,
        r.d61_90,
        r.over_90,
        r.totalOpen,
        r.openCount,
      ].join(',')
    );
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AgingReportPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(true);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['vendor-aging'],
    queryFn: listVendorAging,
    staleTime: 60_000,
  });

  const rows = data ?? [];

  const filtered = useMemo(() => {
    let r = rows;
    if (overdueOnly) {
      r = r.filter(
        (v) => v.d1_30 + v.d31_60 + v.d61_90 + v.over_90 > 0
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.uniqueCode.toLowerCase().includes(q)
      );
    }
    return r;
  }, [rows, overdueOnly, search]);

  // Totals across the *visible* set so the summary strip reflects filters.
  const totals = useMemo(() => {
    const init = {
      current: 0,
      d1_30: 0,
      d31_60: 0,
      d61_90: 0,
      over_90: 0,
      totalOpen: 0,
      openCount: 0,
      vendorCount: filtered.length,
    };
    return filtered.reduce(
      (acc, v) => ({
        current: acc.current + v.current,
        d1_30: acc.d1_30 + v.d1_30,
        d31_60: acc.d31_60 + v.d31_60,
        d61_90: acc.d61_90 + v.d61_90,
        over_90: acc.over_90 + v.over_90,
        totalOpen: acc.totalOpen + v.totalOpen,
        openCount: acc.openCount + v.openCount,
        vendorCount: filtered.length,
      }),
      init
    );
  }, [filtered]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl-50 via-champagne-50 to-pearl-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <Link
              to="/app/vendors"
              className="p-2 rounded-lg text-onyx-600 hover:bg-white hover:shadow-sm transition"
              aria-label="Back to vendors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-onyx-900">
                Vendor Aging
              </h1>
              <p className="text-sm text-onyx-500">
                Outstanding payables bucketed by how late each invoice is.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => downloadCsv(`vendor-aging-${new Date().toISOString().slice(0, 10)}.csv`, filtered)}
            disabled={filtered.length === 0 || isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white shadow-sm text-onyx-700 hover:bg-champagne-50 disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            CSV
          </button>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
          {BUCKETS.map((b) => (
            <div
              key={b.key}
              className={`rounded-xl ring-1 px-3 py-3 ${b.totalCls}`}
            >
              <p className="text-[11px] font-medium uppercase tracking-wide opacity-80">
                {b.shortLabel}
              </p>
              <p className="text-lg font-semibold tabular-nums mt-1">
                {inr(totals[b.key])}
              </p>
            </div>
          ))}
          <div className="rounded-xl ring-1 ring-onyx-200 bg-white px-3 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-onyx-500">
              Total Open
            </p>
            <p className="text-lg font-semibold tabular-nums mt-1 text-onyx-900">
              {inr(totals.totalOpen)}
            </p>
            <p className="text-[10px] text-onyx-400 mt-0.5">
              {totals.vendorCount} vendor{totals.vendorCount === 1 ? '' : 's'} ·{' '}
              {totals.openCount} open bill{totals.openCount === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-onyx-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendor name or code…"
              className="w-full pl-9 pr-3 py-2 rounded-lg ring-1 ring-onyx-200 bg-white text-sm focus:ring-champagne-400 focus:outline-none"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-onyx-700 select-none">
            <input
              type="checkbox"
              className="rounded text-champagne-600 focus:ring-champagne-400"
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
            />
            Overdue only
          </label>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          {isError ? (
            <div className="px-6 py-10 text-center text-rose-700">
              <ExclamationTriangleIcon className="h-6 w-6 mx-auto mb-2" />
              Couldn’t load aging report.{' '}
              <button onClick={() => refetch()} className="underline">
                Retry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-slate-100 to-slate-50 text-xs text-onyx-600 uppercase">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium">Vendor</th>
                    {BUCKETS.map((b) => (
                      <th
                        key={b.key}
                        className="px-3 py-3 text-right font-medium whitespace-nowrap"
                      >
                        {b.shortLabel}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-right font-medium">Total</th>
                    <th className="px-3 py-3 text-right font-medium">Bills</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-champagne-100/60">
                  {isLoading && (
                    <tr>
                      <td colSpan={8} className="px-3 py-10 text-center text-onyx-400">
                        Loading aging report…
                      </td>
                    </tr>
                  )}
                  {!isLoading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-10 text-center text-onyx-400">
                        {overdueOnly
                          ? 'No overdue vendors. All caught up!'
                          : 'No open vendor balances.'}
                      </td>
                    </tr>
                  )}
                  {filtered.map((v) => {
                    const overduePart =
                      v.d1_30 + v.d31_60 + v.d61_90 + v.over_90;
                    const isOverdue = overduePart > 0;
                    return (
                      <tr
                        key={v.vendorId}
                        className={`hover:bg-champagne-50 cursor-pointer ${
                          v.over_90 > 0 ? 'bg-red-50/40' : ''
                        }`}
                        onClick={() => navigate(`/app/vendors/${v.vendorId}`)}
                      >
                        <td className="px-3 py-3">
                          <div className="font-medium text-onyx-900 truncate max-w-[260px]">
                            {v.name}
                          </div>
                          <div className="text-xs text-onyx-400">
                            {v.uniqueCode}
                            {isOverdue && (
                              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-red-200">
                                Overdue {inr(overduePart)}
                              </span>
                            )}
                          </div>
                        </td>
                        {BUCKETS.map((b) => {
                          const val = v[b.key];
                          return (
                            <td
                              key={b.key}
                              className={`px-3 py-3 text-right tabular-nums ${
                                val > 0 ? b.cellCls : 'text-onyx-300'
                              }`}
                            >
                              {val > 0 ? inr(val) : '—'}
                            </td>
                          );
                        })}
                        <td className="px-3 py-3 text-right tabular-nums font-semibold text-onyx-900">
                          {inr(v.totalOpen)}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-onyx-500">
                          {v.openCount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-3 text-[11px] text-onyx-400">
          Buckets are computed from each open invoice's <code>dueDate</code>{' '}
          (vendor's <code>paymentDueDays</code> + transaction date, unless
          overridden). Rows where <code>dueDate</code> is missing are treated
          as due-on-receipt.
        </p>
      </div>
    </div>
  );
}
