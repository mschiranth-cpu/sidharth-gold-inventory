/**
 * ============================================
 * VENDOR DETAIL PAGE
 * ============================================
 * Single-vendor view: identity card, outstanding stat cards, full PURCHASE
 * transaction list with inline Settle action.
 *
 * UX: gradient onyx hero (matches inventory dashboards), tinted KPI cards
 * with icons, search + chip filters + CSV export over the transaction
 * table, sticky thead, zebra rows, payment progress bars.
 */

import { Fragment, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  PencilSquareIcon,
  IdentificationIcon,
  PhoneIcon,
  MapPinIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  GiftIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  SparklesIcon,
  CubeTransparentIcon,
  ChevronDownIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import type { MetalPayment } from '../../services/metal.service';
import type { DiamondPayment } from '../../services/diamond.service';
import type {
  RealStonePayment,
  RealStoneTransaction,
  StonePacketPayment,
  StonePacketTransaction,
} from '../../services/stone.service';
import {
  getVendor,
  getVendorOutstanding,
  getVendorTransactions,
  getVendorDiamondTransactions,
  getVendorRealStoneTransactions,
  getVendorStonePacketTransactions,
} from '../../services/vendor.service';
import type { MetalTransaction } from '../../services/metal.service';
import type { DiamondTransaction } from '../../services/diamond.service';
import Button from '../../components/common/Button';
import SettlePaymentModal from '../../components/SettlePaymentModal';
import GstInfoCard from '../../components/GstInfoCard';
import { useAuth } from '../../contexts/AuthContext';

const SETTLE_ROLES = new Set(['ADMIN', 'OFFICE_STAFF']);

type DomainFilter = 'all' | 'metal' | 'diamond' | 'realStone' | 'stonePacket';
type StatusFilter = 'all' | 'PENDING' | 'HALF' | 'COMPLETE';

function fmt(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtCompactInr(v: number) {
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  if (Math.abs(v) >= 1e3) return `₹${(v / 1e3).toFixed(1)} K`;
  return `₹${v.toFixed(0)}`;
}

function downloadCsv(rows: (string | number)[][], filename: string) {
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

function PaymentBadge({ status }: { status: string }) {
  const cls =
    status === 'COMPLETE'
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      : status === 'HALF'
      ? 'bg-amber-50 text-amber-800 border border-amber-200'
      : 'bg-rose-50 text-rose-700 border border-rose-200';
  const label = status === 'HALF' ? 'PARTIAL' : status;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  );
}

const KPI_TINTS = {
  indigo: 'from-indigo-500/15 to-indigo-500/5 text-indigo-700 ring-indigo-200/60',
  emerald: 'from-emerald-500/15 to-emerald-500/5 text-emerald-700 ring-emerald-200/60',
  rose: 'from-rose-500/15 to-rose-500/5 text-rose-700 ring-rose-200/60',
  amber: 'from-amber-500/15 to-amber-500/5 text-amber-700 ring-amber-200/60',
  champagne: 'from-champagne-500/15 to-champagne-500/5 text-champagne-800 ring-champagne-200/60',
} as const;

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
  tint: keyof typeof KPI_TINTS;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-onyx-500">
          {label}
        </span>
        <span
          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${KPI_TINTS[tint]} ring-1 inline-flex items-center justify-center`}
        >
          {icon}
        </span>
      </div>
      {loading ? (
        <div className="h-7 rounded-md bg-gray-100 animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-onyx-900 tabular-nums">{value}</p>
      )}
      {sub ? <p className="text-[11px] text-onyx-500">{sub}</p> : null}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-8 h-8 rounded-lg bg-champagne-50 text-champagne-700 inline-flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider text-onyx-500 font-semibold">{label}</p>
        <p className={`text-sm text-onyx-900 break-words ${mono ? 'font-mono' : ''}`}>
          {value || <span className="text-onyx-400">—</span>}
        </p>
      </div>
    </div>
  );
}

function PayProgress({
  paid,
  total,
}: {
  paid: number;
  total: number;
}) {
  if (!total) return null;
  const pct = Math.max(0, Math.min(100, Math.round((paid / total) * 100)));
  const color =
    pct >= 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="mt-1 flex items-center gap-1.5">
      <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] tabular-nums text-onyx-500 w-9 text-right">{pct}%</span>
    </div>
  );
}

export default function VendorDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const canSettle = SETTLE_ROLES.has(String(user?.role ?? ''));
  const [settleTxn, setSettleTxn] = useState<MetalTransaction | null>(null);
  const [settleDiamondTxn, setSettleDiamondTxn] = useState<DiamondTransaction | null>(null);

  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState<DomainFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const vendorQ = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => getVendor(id),
    enabled: Boolean(id),
  });
  const outstandingQ = useQuery({
    queryKey: ['vendor-outstanding', id],
    queryFn: () => getVendorOutstanding(id),
    enabled: Boolean(id),
  });
  const transactionsQ = useQuery({
    queryKey: ['vendor-transactions', id],
    queryFn: () => getVendorTransactions(id),
    enabled: Boolean(id),
  });
  const diamondTransactionsQ = useQuery({
    queryKey: ['vendor-diamond-transactions', id],
    queryFn: () => getVendorDiamondTransactions(id),
    enabled: Boolean(id),
  });
  const realStoneTransactionsQ = useQuery({
    queryKey: ['vendor-real-stone-transactions', id],
    queryFn: () => getVendorRealStoneTransactions(id),
    enabled: Boolean(id),
  });
  const stonePacketTransactionsQ = useQuery({
    queryKey: ['vendor-stone-packet-transactions', id],
    queryFn: () => getVendorStonePacketTransactions(id),
    enabled: Boolean(id),
  });

  const vendor = vendorQ.data;
  const outstanding = outstandingQ.data;
  const transactions = transactionsQ.data ?? [];
  const diamondTransactions = diamondTransactionsQ.data ?? [];
  const realStoneTransactions = realStoneTransactionsQ.data ?? [];
  const stonePacketTransactions = stonePacketTransactionsQ.data ?? [];

  const isFetching =
    vendorQ.isFetching ||
    outstandingQ.isFetching ||
    transactionsQ.isFetching ||
    diamondTransactionsQ.isFetching ||
    realStoneTransactionsQ.isFetching ||
    stonePacketTransactionsQ.isFetching;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['vendor', id] });
    qc.invalidateQueries({ queryKey: ['vendor-outstanding', id] });
    qc.invalidateQueries({ queryKey: ['vendor-transactions', id] });
    qc.invalidateQueries({ queryKey: ['vendor-diamond-transactions', id] });
    qc.invalidateQueries({ queryKey: ['vendor-real-stone-transactions', id] });
    qc.invalidateQueries({ queryKey: ['vendor-stone-packet-transactions', id] });
  };

  // Merge metal + diamond into a single chronological list. Each row carries
  // a `domain` discriminator + a normalised `description` so one table can
  // render both. Settle action dispatches to the right modal via the domain.
  type AnyPayment = MetalPayment | DiamondPayment | RealStonePayment | StonePacketPayment;
  type UnifiedRow = {
    id: string;
    domain: 'metal' | 'diamond' | 'realStone' | 'stonePacket';
    createdAt: string;
    description: string;
    measure: string;
    rate: number | null;
    totalValue: number | null;
    amountPaid: number | null;
    creditApplied: number | null;
    creditGenerated: number | null;
    paymentStatus: string | null;
    isBillable: boolean | null;
    payments: AnyPayment[];
    cashTotal: number;
    neftTotal: number;
    lastNeftBank: string | null;
    lastNeftUtr: string | null;
    raw: MetalTransaction | DiamondTransaction | RealStoneTransaction | StonePacketTransaction;
  };

  function summarisePayments(
    payments: AnyPayment[] | undefined,
    fallback: {
      paymentMode?: string | null;
      cashAmount?: number | null;
      neftAmount?: number | null;
      amountPaid?: number | null;
      neftBank?: string | null;
      neftUtr?: string | null;
    },
  ) {
    if (payments && payments.length > 0) {
      let cash = 0;
      let neft = 0;
      let lastNeftBank: string | null = null;
      let lastNeftUtr: string | null = null;
      // payments are ordered desc by recordedAt — first NEFT entry is the most recent.
      for (const p of payments) {
        const mode = String(p.paymentMode || '').toUpperCase();
        if (mode === 'CASH') {
          cash += p.amount || 0;
        } else if (mode === 'NEFT') {
          neft += p.amount || 0;
          if (!lastNeftBank) lastNeftBank = p.neftBank ?? null;
          if (!lastNeftUtr) lastNeftUtr = p.neftUtr ?? null;
        } else if (mode === 'BOTH') {
          cash += p.cashAmount ?? 0;
          neft += p.neftAmount ?? 0;
          if (!lastNeftBank) lastNeftBank = p.neftBank ?? null;
          if (!lastNeftUtr) lastNeftUtr = p.neftUtr ?? null;
        } else {
          cash += p.amount || 0;
        }
      }
      return { cashTotal: cash, neftTotal: neft, lastNeftBank, lastNeftUtr };
    }
    // No ledger rows yet — fall back to the cached fields on the transaction.
    const mode = String(fallback.paymentMode || '').toUpperCase();
    const paid = fallback.amountPaid ?? 0;
    if (mode === 'CASH') {
      return { cashTotal: paid, neftTotal: 0, lastNeftBank: null, lastNeftUtr: null };
    }
    if (mode === 'NEFT') {
      return {
        cashTotal: 0,
        neftTotal: paid,
        lastNeftBank: fallback.neftBank ?? null,
        lastNeftUtr: fallback.neftUtr ?? null,
      };
    }
    if (mode === 'BOTH') {
      return {
        cashTotal: fallback.cashAmount ?? 0,
        neftTotal: fallback.neftAmount ?? 0,
        lastNeftBank: fallback.neftBank ?? null,
        lastNeftUtr: fallback.neftUtr ?? null,
      };
    }
    return { cashTotal: 0, neftTotal: 0, lastNeftBank: null, lastNeftUtr: null };
  }

  const unified = useMemo<UnifiedRow[]>(
    () =>
      [
        ...transactions.map((t) => {
          const summary = summarisePayments(t.payments, t);
          return {
            id: `m-${t.id}`,
            domain: 'metal' as const,
            createdAt: t.createdAt,
            description: `${t.metalType} ${t.purity}K`,
            measure: `${t.grossWeight.toFixed(2)} g`,
            rate: t.rate ?? null,
            totalValue: t.totalValue ?? null,
            amountPaid: t.amountPaid ?? null,
            creditApplied: t.creditApplied ?? null,
            creditGenerated: t.creditGenerated ?? null,
            paymentStatus: t.paymentStatus ?? null,
            isBillable: t.isBillable ?? null,
            payments: t.payments ?? [],
            ...summary,
            raw: t,
          };
        }),
        ...diamondTransactions.map((t) => {
          const summary = summarisePayments(t.payments, t);
          return {
            id: `d-${t.id}`,
            domain: 'diamond' as const,
            createdAt: t.createdAt,
            description:
              [t.diamond?.shape, t.diamond?.color, t.diamond?.clarity]
                .filter(Boolean)
                .join(' · ') || (t.diamond?.stockNumber ?? 'Diamond'),
            measure: t.caratWeight != null ? `${t.caratWeight} ct` : '—',
            rate: t.pricePerCarat ?? null,
            totalValue: t.totalValue ?? null,
            amountPaid: t.amountPaid ?? null,
            creditApplied: t.creditApplied ?? null,
            creditGenerated: t.creditGenerated ?? null,
            paymentStatus: t.paymentStatus ?? null,
            isBillable: t.isBillable ?? null,
            payments: t.payments ?? [],
            ...summary,
            raw: t,
          };
        }),
        ...realStoneTransactions.map((t) => {
          const summary = summarisePayments(t.payments, t);
          return {
            id: `r-${t.id}`,
            domain: 'realStone' as const,
            createdAt: t.createdAt,
            description:
              [t.stone?.stoneType, t.stone?.shape, t.stone?.color, t.stone?.clarity]
                .filter(Boolean)
                .join(' · ') || (t.stone?.stockNumber ?? 'Real Stone'),
            measure: t.caratWeight != null ? `${t.caratWeight} ct` : '—',
            rate: t.pricePerCarat ?? null,
            totalValue: t.totalValue ?? null,
            amountPaid: t.amountPaid ?? null,
            creditApplied: t.creditApplied ?? null,
            creditGenerated: t.creditGenerated ?? null,
            paymentStatus: t.paymentStatus ?? null,
            isBillable: t.isBillable ?? null,
            payments: t.payments ?? [],
            ...summary,
            raw: t,
          };
        }),
        ...stonePacketTransactions.map((t) => {
          const summary = summarisePayments(t.payments, t);
          return {
            id: `p-${t.id}`,
            domain: 'stonePacket' as const,
            createdAt: t.createdAt,
            description:
              [t.packet?.stoneType, t.packet?.size, t.packet?.color, t.packet?.quality]
                .filter(Boolean)
                .join(' · ') || (t.packet?.packetNumber ?? 'Stone Packet'),
            measure:
              t.quantity != null
                ? `${t.quantity} ${t.unit || t.packet?.unit || ''}`.trim()
                : '—',
            rate: t.pricePerUnit ?? null,
            totalValue: t.totalValue ?? null,
            amountPaid: t.amountPaid ?? null,
            creditApplied: t.creditApplied ?? null,
            creditGenerated: t.creditGenerated ?? null,
            paymentStatus: t.paymentStatus ?? null,
            isBillable: t.isBillable ?? null,
            payments: t.payments ?? [],
            ...summary,
            raw: t,
          };
        }),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [transactions, diamondTransactions, realStoneTransactions, stonePacketTransactions],
  );

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c = {
      all: unified.length,
      metal: 0,
      diamond: 0,
      realStone: 0,
      stonePacket: 0,
      PENDING: 0,
      HALF: 0,
      COMPLETE: 0,
    };
    for (const r of unified) {
      if (r.domain === 'metal') c.metal++;
      else if (r.domain === 'diamond') c.diamond++;
      else if (r.domain === 'realStone') c.realStone++;
      else if (r.domain === 'stonePacket') c.stonePacket++;
      if (r.paymentStatus === 'PENDING') c.PENDING++;
      else if (r.paymentStatus === 'HALF') c.HALF++;
      else if (r.paymentStatus === 'COMPLETE') c.COMPLETE++;
    }
    return c;
  }, [unified]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return unified.filter((r) => {
      if (domainFilter !== 'all' && r.domain !== domainFilter) return false;
      if (statusFilter !== 'all' && r.paymentStatus !== statusFilter) return false;
      if (q && !r.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [unified, search, domainFilter, statusFilter]);

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      [
        'Date',
        'Type',
        'Item',
        'Qty',
        'Rate',
        'Total Value',
        'Paid',
        'Cash Paid',
        'NEFT Paid',
        'NEFT Bank',
        'NEFT UTR',
        'Credit Applied',
        'Credit Generated',
        'Payment',
        'Billable',
      ],
    ];
    for (const r of filtered) {
      rows.push([
        new Date(r.createdAt).toLocaleDateString('en-IN'),
        r.domain.toUpperCase(),
        r.description,
        r.measure,
        r.rate ?? '',
        r.totalValue ?? '',
        r.amountPaid ?? '',
        r.cashTotal || '',
        r.neftTotal || '',
        r.lastNeftBank ?? '',
        r.lastNeftUtr ?? '',
        r.creditApplied ?? '',
        r.creditGenerated ?? '',
        r.paymentStatus ?? '',
        r.isBillable === false ? 'No' : 'Yes',
      ]);
    }
    const stamp = new Date().toISOString().slice(0, 10);
    const code = vendor?.uniqueCode ?? id;
    downloadCsv(rows, `vendor-${code}-purchases-${stamp}.csv`);
  };

  if (vendorQ.isLoading) {
    return (
      <div className="p-6 bg-gradient-to-br from-pearl via-white to-champagne-50/30 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-44 rounded-3xl bg-onyx-900/80 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-white border border-gray-100 animate-pulse" />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-white border border-gray-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (vendorQ.isError || !vendor) {
    return (
      <div className="p-6 bg-gradient-to-br from-pearl via-white to-champagne-50/30 min-h-screen">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-12 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-rose-500 mb-3" />
          <p className="text-onyx-700 mb-4 font-semibold">Vendor not found.</p>
          <Link to="/app/vendors">
            <Button variant="secondary">← Back to vendors</Button>
          </Link>
        </div>
      </div>
    );
  }

  const verifiedSource = vendor.gstDetails?.source;
  const isVerified = ['rapidapi', 'rapidapi-tool', 'gstincheck', 'mastergst'].includes(
    String(verifiedSource ?? ''),
  );

  const filterChip = (active: boolean) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition border focus:outline-none focus:ring-2 focus:ring-champagne-400 ${
      active
        ? 'bg-gradient-to-r from-champagne-500 to-champagne-700 text-onyx-900 border-champagne-300 shadow-sm'
        : 'bg-white text-onyx-700 border-gray-200 hover:bg-champagne-50'
    }`;

  return (
    <div className="p-6 bg-gradient-to-br from-pearl via-white to-champagne-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hero header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-onyx-900 via-onyx-800 to-onyx-700 text-pearl shadow-onyx p-4 md:p-5">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-champagne-500/20 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gold-leaf-gradient opacity-10 pointer-events-none" />

          <div className="relative flex flex-col gap-3">
            <Link
              to="/app/vendors"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-onyx-900 bg-champagne-300 hover:bg-champagne-200 transition w-fit px-2.5 py-1 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-champagne-200 focus:ring-offset-2 focus:ring-offset-onyx-900"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to vendors
            </Link>

            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.22em] text-champagne-300 font-medium mb-1 flex items-center gap-1.5">
                  <SparklesIcon className="w-3 h-3" /> Vendor · Purchase Ledger
                </p>
                <h1 className="font-display text-xl md:text-2xl font-semibold text-pearl mb-2 break-words leading-tight">
                  {vendor.name}
                </h1>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/15 font-mono tracking-wide text-champagne-100">
                    {vendor.uniqueCode}
                  </span>
                  {vendor.phone && (
                    <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/15 inline-flex items-center gap-1 text-champagne-100">
                      <PhoneIcon className="w-3 h-3" /> {vendor.phone}
                    </span>
                  )}
                  {vendor.gstNumber && (
                    <span
                      className={`px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-mono ${
                        isVerified
                          ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30'
                          : 'bg-white/10 text-champagne-100 border border-white/15'
                      }`}
                    >
                      <ShieldCheckIcon className="w-3 h-3" /> {vendor.gstNumber}
                      {isVerified && <span className="text-[10px] font-sans font-semibold">VERIFIED</span>}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 xl:justify-end">
                <button
                  onClick={refresh}
                  disabled={isFetching}
                  aria-label="Refresh vendor data"
                  title="Refresh"
                  className="p-2 rounded-lg border border-white/15 bg-white/10 hover:bg-white/15 text-pearl disabled:opacity-50 backdrop-blur-sm transition focus:outline-none focus:ring-2 focus:ring-champagne-400"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                </button>
                <Link
                  to={`/app/vendors?edit=${vendor.id}`}
                  className="px-3 py-2 rounded-lg border border-white/20 bg-white/10 hover:bg-white/15 text-pearl text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm transition focus:outline-none focus:ring-2 focus:ring-champagne-400"
                >
                  <PencilSquareIcon className="w-3.5 h-3.5" /> Edit Vendor
                </Link>
                <button
                  onClick={exportCsv}
                  className="px-3 py-2 rounded-lg bg-gradient-to-r from-champagne-500 to-champagne-700 hover:from-champagne-600 hover:to-champagne-800 text-onyx-900 text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-champagne-500/20 focus:outline-none focus:ring-2 focus:ring-champagne-300"
                >
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiCard
            icon={<BanknotesIcon className="w-5 h-5" />}
            label="Total Purchases"
            value={`₹${fmt(outstanding?.totalBillable ?? 0)}`}
            sub={fmtCompactInr(outstanding?.totalBillable ?? 0)}
            tint="indigo"
            loading={outstandingQ.isLoading}
          />
          <KpiCard
            icon={<CheckCircleIcon className="w-5 h-5" />}
            label="Total Paid"
            value={`₹${fmt(outstanding?.totalPaid ?? 0)}`}
            sub={fmtCompactInr(outstanding?.totalPaid ?? 0)}
            tint="emerald"
            loading={outstandingQ.isLoading}
          />
          <KpiCard
            icon={<ExclamationTriangleIcon className="w-5 h-5" />}
            label="Outstanding"
            value={`₹${fmt(outstanding?.outstanding ?? 0)}`}
            sub={
              outstanding && outstanding.outstanding > 0
                ? 'Settle pending bills'
                : 'All clear'
            }
            tint={outstanding && outstanding.outstanding > 0 ? 'rose' : 'emerald'}
            loading={outstandingQ.isLoading}
          />
          <KpiCard
            icon={<GiftIcon className="w-5 h-5" />}
            label="Vendor Credit"
            value={`₹${fmt(vendor?.creditBalance ?? 0)}`}
            sub={vendor && vendor.creditBalance > 0 ? 'Available to apply' : 'No credit on file'}
            tint={vendor && vendor.creditBalance > 0 ? 'champagne' : 'indigo'}
            loading={vendorQ.isLoading}
          />
          <KpiCard
            icon={<ClockIcon className="w-5 h-5" />}
            label="Open Receipts"
            value={String(outstanding?.openCount ?? 0)}
            sub={`${counts.PENDING} pending · ${counts.HALF} partial`}
            tint="amber"
            loading={outstandingQ.isLoading}
          />
        </div>

        {/* Vendor info + GST */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-1">
            <h2 className="font-semibold text-onyx-900 mb-4 flex items-center gap-2">
              <IdentificationIcon className="w-5 h-5 text-champagne-700" />
              Vendor Information
            </h2>
            <div className="space-y-4">
              <InfoRow icon={<PhoneIcon className="w-4 h-4" />} label="Phone" value={vendor.phone} />
              <InfoRow
                icon={<ShieldCheckIcon className="w-4 h-4" />}
                label="GSTIN"
                value={vendor.gstNumber}
                mono
              />
              <InfoRow
                icon={<IdentificationIcon className="w-4 h-4" />}
                label="Vendor Code"
                value={vendor.uniqueCode}
                mono
              />
              <InfoRow icon={<MapPinIcon className="w-4 h-4" />} label="Address" value={vendor.address} />
            </div>
          </div>
          <div className="lg:col-span-2">
            {vendor.gstDetails ? (
              <GstInfoCard gstDetails={vendor.gstDetails} variant="detail" />
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-dashed border-gray-200 p-8 h-full flex flex-col items-center justify-center text-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-champagne-50 text-champagne-700 inline-flex items-center justify-center">
                  <ShieldCheckIcon className="w-6 h-6" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-onyx-800">No GST details on file</p>
                  <p className="text-xs text-onyx-500 mt-1">
                    Edit the vendor and add a GSTIN to fetch government-verified business details.
                  </p>
                </div>
                <Link
                  to={`/app/vendors?edit=${vendor.id}`}
                  className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-champagne-700 hover:text-onyx-900"
                >
                  <PencilSquareIcon className="w-3.5 h-3.5" /> Add GSTIN
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Purchase Transactions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold text-onyx-900 flex items-center gap-2">
                  <CubeTransparentIcon className="w-5 h-5 text-champagne-700" />
                  Purchase Transactions
                </h2>
                <p className="text-[11px] text-onyx-500 mt-0.5">
                  {transactions.length} metal · {diamondTransactions.length} diamond ·{' '}
                  {realStoneTransactions.length} real stone · {stonePacketTransactions.length} stone packet ·{' '}
                  {filtered.length} shown
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-onyx-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search item…"
                  className="w-full pl-9 pr-9 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-champagne-400 focus:border-transparent"
                />
                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-onyx-400 hover:text-onyx-700 hover:bg-gray-100"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={() => setDomainFilter('all')} className={filterChip(domainFilter === 'all')}>
                All <span className="opacity-70">· {counts.all}</span>
              </button>
              <button onClick={() => setDomainFilter('metal')} className={filterChip(domainFilter === 'metal')}>
                Metal <span className="opacity-70">· {counts.metal}</span>
              </button>
              <button onClick={() => setDomainFilter('diamond')} className={filterChip(domainFilter === 'diamond')}>
                Diamond <span className="opacity-70">· {counts.diamond}</span>
              </button>
              <button
                onClick={() => setDomainFilter('realStone')}
                className={filterChip(domainFilter === 'realStone')}
              >
                Real Stone <span className="opacity-70">· {counts.realStone}</span>
              </button>
              <button
                onClick={() => setDomainFilter('stonePacket')}
                className={filterChip(domainFilter === 'stonePacket')}
              >
                Stone Packet <span className="opacity-70">· {counts.stonePacket}</span>
              </button>
              <span className="w-px h-6 bg-gray-200 mx-1 self-center" />
              <button onClick={() => setStatusFilter('all')} className={filterChip(statusFilter === 'all')}>
                Any status
              </button>
              <button onClick={() => setStatusFilter('PENDING')} className={filterChip(statusFilter === 'PENDING')}>
                Pending <span className="opacity-70">· {counts.PENDING}</span>
              </button>
              <button onClick={() => setStatusFilter('HALF')} className={filterChip(statusFilter === 'HALF')}>
                Partial <span className="opacity-70">· {counts.HALF}</span>
              </button>
              <button onClick={() => setStatusFilter('COMPLETE')} className={filterChip(statusFilter === 'COMPLETE')}>
                Complete <span className="opacity-70">· {counts.COMPLETE}</span>
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <CubeTransparentIcon className="w-10 h-10 mx-auto text-onyx-300 mb-3" />
              <p className="text-sm font-semibold text-onyx-700">
                {unified.length === 0 ? 'No purchases yet' : 'No matching transactions'}
              </p>
              <p className="text-xs text-onyx-500 mt-1">
                {unified.length === 0
                  ? 'New receipts from this vendor will appear here.'
                  : 'Try a different filter or clear the search.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-[11px] text-onyx-500 uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-3 w-8" aria-label="Expand row" />
                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Type</th>
                    <th className="px-4 py-3 text-left font-semibold">Item</th>
                    <th className="px-4 py-3 text-right font-semibold">Qty</th>
                    <th className="px-4 py-3 text-right font-semibold">Rate</th>
                    <th className="px-4 py-3 text-right font-semibold">Total Value</th>
                    <th className="px-4 py-3 text-right font-semibold">Paid</th>
                    <th className="px-4 py-3 text-left font-semibold">Payment Mix</th>
                    <th className="px-4 py-3 text-left font-semibold">Credit</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => {
                    const total = row.totalValue ?? 0;
                    const paid = row.amountPaid ?? 0;
                    const showSettle =
                      canSettle &&
                      (row.paymentStatus === 'HALF' || row.paymentStatus === 'PENDING') &&
                      row.isBillable !== false;
                    const isExpanded = expandedId === row.id;
                    const hasBreakdown =
                      row.cashTotal > 0 || row.neftTotal > 0 || row.payments.length > 0;
                    return (
                      <Fragment key={row.id}>
                        <tr
                          className={`border-t border-gray-100 transition-colors ${
                            i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                          } ${isExpanded ? 'bg-champagne-50/40' : 'hover:bg-champagne-50/40'}`}
                        >
                          <td className="px-2 py-3 align-top">
                            {hasBreakdown ? (
                              <button
                                type="button"
                                onClick={() => setExpandedId(isExpanded ? null : row.id)}
                                aria-label={isExpanded ? 'Collapse payment details' : 'Expand payment details'}
                                aria-expanded={isExpanded}
                                className="p-1 rounded-md text-onyx-400 hover:text-onyx-800 hover:bg-champagne-100/60 focus:outline-none focus:ring-2 focus:ring-champagne-400"
                              >
                                <ChevronDownIcon
                                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                />
                              </button>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-onyx-700 whitespace-nowrap align-top">
                            {new Date(row.createdAt).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                row.domain === 'metal'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : row.domain === 'diamond'
                                  ? 'bg-sky-50 text-sky-800 border-sky-200'
                                  : row.domain === 'realStone'
                                  ? 'bg-violet-50 text-violet-800 border-violet-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              {row.domain === 'metal'
                                ? 'Metal'
                                : row.domain === 'diamond'
                                ? 'Diamond'
                                : row.domain === 'realStone'
                                ? 'Real Stone'
                                : 'Stone Pkt'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-onyx-900 align-top">{row.description}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-onyx-700 align-top">{row.measure}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-onyx-700 align-top">
                            {row.rate ? `₹${fmt(row.rate)}` : <span className="text-onyx-400">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold text-onyx-900 align-top">
                            {row.totalValue != null ? `₹${fmt(row.totalValue)}` : <span className="text-onyx-400">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums align-top">
                            <div className="text-onyx-700">
                              {row.amountPaid != null ? `₹${fmt(row.amountPaid)}` : <span className="text-onyx-400">—</span>}
                            </div>
                            {row.paymentStatus && total > 0 && (
                              <PayProgress paid={paid} total={total} />
                            )}
                          </td>
                          <td className="px-4 py-3 align-top">
                            {hasBreakdown ? (
                              <div className="flex flex-wrap gap-1">
                                {row.cashTotal > 0 && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    <BanknotesIcon className="w-3 h-3" /> Cash ₹{fmt(row.cashTotal)}
                                  </span>
                                )}
                                {row.neftTotal > 0 && (
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200"
                                    title={
                                      [row.lastNeftBank, row.lastNeftUtr]
                                        .filter(Boolean)
                                        .join(' · ') || 'Bank transfer'
                                    }
                                  >
                                    <BuildingLibraryIcon className="w-3 h-3" /> NEFT ₹{fmt(row.neftTotal)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-onyx-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs align-top">
                            {row.creditApplied || row.creditGenerated ? (
                              <div className="space-y-0.5">
                                {row.creditApplied ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-champagne-50 text-champagne-800 border border-champagne-200">
                                    Applied ₹{fmt(row.creditApplied)}
                                  </span>
                                ) : null}
                                {row.creditGenerated ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Generated ₹{fmt(row.creditGenerated)}
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-onyx-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top">
                            {!row.paymentStatus ? (
                              <span className="text-onyx-400">—</span>
                            ) : (
                              <div className="flex items-center gap-2 flex-wrap">
                                <PaymentBadge status={row.paymentStatus} />
                                {row.isBillable === false && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-champagne-100/60 text-onyx-500 whitespace-nowrap">
                                    Non-billable
                                  </span>
                                )}
                                {showSettle && (row.domain === 'metal' || row.domain === 'diamond') && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      row.domain === 'metal'
                                        ? setSettleTxn(row.raw as MetalTransaction)
                                        : setSettleDiamondTxn(row.raw as DiamondTransaction)
                                    }
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-champagne-500 to-champagne-700 text-onyx-900 hover:from-champagne-600 hover:to-champagne-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-champagne-400"
                                  >
                                    Settle
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-champagne-50/30 border-t border-champagne-100">
                            <td className="px-2 py-3" />
                            <td colSpan={10} className="px-4 py-4">
                              <div className="rounded-xl border border-champagne-100 bg-white p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-onyx-600">
                                    Payment Ledger
                                  </h4>
                                  <div className="flex flex-wrap gap-2 text-[11px]">
                                    {row.cashTotal > 0 && (
                                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                        <BanknotesIcon className="w-3.5 h-3.5" />
                                        Total Cash: ₹{fmt(row.cashTotal)}
                                      </span>
                                    )}
                                    {row.neftTotal > 0 && (
                                      <span className="inline-flex items-center gap-1 text-sky-700 font-semibold">
                                        <BuildingLibraryIcon className="w-3.5 h-3.5" />
                                        Total NEFT: ₹{fmt(row.neftTotal)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {row.payments.length === 0 ? (
                                  <p className="text-xs text-onyx-500">
                                    Single payment recorded against this transaction (no ledger entries yet).
                                  </p>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full text-xs">
                                      <thead className="text-[10px] text-onyx-500 uppercase tracking-wider">
                                        <tr className="border-b border-gray-100">
                                          <th className="px-2 py-2 text-left font-semibold">When</th>
                                          <th className="px-2 py-2 text-left font-semibold">Mode</th>
                                          <th className="px-2 py-2 text-right font-semibold">Cash</th>
                                          <th className="px-2 py-2 text-right font-semibold">NEFT</th>
                                          <th className="px-2 py-2 text-left font-semibold">Bank · UTR</th>
                                          <th className="px-2 py-2 text-right font-semibold">Total</th>
                                          <th className="px-2 py-2 text-left font-semibold">Recorded By</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {row.payments.map((p) => {
                                          const mode = String(p.paymentMode || '').toUpperCase();
                                          const cash =
                                            mode === 'CASH'
                                              ? p.amount
                                              : mode === 'BOTH'
                                              ? p.cashAmount ?? 0
                                              : 0;
                                          const neft =
                                            mode === 'NEFT'
                                              ? p.amount
                                              : mode === 'BOTH'
                                              ? p.neftAmount ?? 0
                                              : 0;
                                          return (
                                            <tr key={p.id} className="border-b border-gray-50 last:border-0">
                                              <td className="px-2 py-2 text-onyx-700 whitespace-nowrap">
                                                {new Date(p.recordedAt).toLocaleString('en-IN', {
                                                  day: '2-digit',
                                                  month: 'short',
                                                  year: 'numeric',
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                                })}
                                              </td>
                                              <td className="px-2 py-2">
                                                <span
                                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                                    mode === 'CASH'
                                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                      : mode === 'NEFT'
                                                      ? 'bg-sky-50 text-sky-800 border-sky-200'
                                                      : 'bg-violet-50 text-violet-800 border-violet-200'
                                                  }`}
                                                >
                                                  {mode || '—'}
                                                </span>
                                              </td>
                                              <td className="px-2 py-2 text-right tabular-nums text-onyx-700">
                                                {cash > 0 ? `₹${fmt(cash)}` : <span className="text-onyx-300">—</span>}
                                              </td>
                                              <td className="px-2 py-2 text-right tabular-nums text-onyx-700">
                                                {neft > 0 ? `₹${fmt(neft)}` : <span className="text-onyx-300">—</span>}
                                              </td>
                                              <td className="px-2 py-2 text-onyx-600">
                                                {p.neftBank || p.neftUtr ? (
                                                  <div className="flex flex-col leading-tight">
                                                    {p.neftBank && (
                                                      <span className="font-medium text-onyx-800">{p.neftBank}</span>
                                                    )}
                                                    {p.neftUtr && (
                                                      <span className="font-mono text-[10px] text-onyx-500">
                                                        UTR {p.neftUtr}
                                                      </span>
                                                    )}
                                                  </div>
                                                ) : (
                                                  <span className="text-onyx-300">—</span>
                                                )}
                                              </td>
                                              <td className="px-2 py-2 text-right tabular-nums font-semibold text-onyx-900">
                                                ₹{fmt(p.amount)}
                                              </td>
                                              <td className="px-2 py-2 text-onyx-600">
                                                {p.recordedBy?.name ?? <span className="text-onyx-300">—</span>}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                                {(row.lastNeftBank || row.lastNeftUtr) && row.payments.length === 0 && (
                                  <p className="text-xs text-onyx-600 mt-2">
                                    Last NEFT:{' '}
                                    <span className="font-semibold">{row.lastNeftBank ?? '—'}</span>
                                    {row.lastNeftUtr ? (
                                      <>
                                        {' · UTR '}
                                        <span className="font-mono">{row.lastNeftUtr}</span>
                                      </>
                                    ) : null}
                                  </p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {settleTxn && (
        <SettlePaymentModal domain="metal" transaction={settleTxn} onClose={() => setSettleTxn(null)} />
      )}

      {settleDiamondTxn && (
        <SettlePaymentModal
          domain="diamond"
          transaction={settleDiamondTxn as any}
          onClose={() => setSettleDiamondTxn(null)}
        />
      )}
    </div>
  );
}
