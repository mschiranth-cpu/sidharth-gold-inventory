/**
 * Vendor Info — list, add, edit, delete with realtime GST auto-fetch.
 * Enhanced: KPI strip, filter chips, sortable table, CSV export, avatars,
 * skeleton loading, sticky header.
 */
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  BuildingOffice2Icon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  WalletIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import {
  Vendor,
  listVendors,
  deleteVendor,
  listVendorOutstanding,
  type VendorOutstanding,
  type VendorDealsCategory,
  VENDOR_DEALS_CATEGORIES,
  VENDOR_DEALS_LABELS,
  VENDOR_DEALS_SHORT,
} from '../../services/vendor.service';
import VendorFormModal from '../../components/VendorFormModal';

type FilterKey =
  | 'all'
  | 'verified'
  | 'noGst'
  | 'foreign'
  | 'outstanding'
  | 'credit'
  | 'archived'
  | 'dealsMetal'
  | 'dealsDiamond'
  | 'dealsRealStone'
  | 'dealsStonePacket';
type SortKey = 'name' | 'outstanding' | 'paid' | 'credit';
type SortDir = 'asc' | 'desc';

/**
 * Maps the supply-category filter keys to their underlying token. Lets the
 * filter chip strip and the visible-list filter share one source of truth.
 */
const FILTER_TO_DEALS: Partial<Record<FilterKey, VendorDealsCategory>> = {
  dealsMetal: 'METAL',
  dealsDiamond: 'DIAMOND',
  dealsRealStone: 'REAL_STONE',
  dealsStonePacket: 'STONE_PACKET',
};

/**
 * Per-category chip styling for both the row chips (small "M/D/RS/SP" pills)
 * and the filter chip strip. Keeps colour assignments aligned with the
 * VendorFormModal cards so users learn the colour→category mapping.
 */
const DEALS_CHIP_STYLE: Record<
  VendorDealsCategory,
  { active: string; idle: string; filterIdle: string }
> = {
  METAL: {
    active: 'bg-amber-100 text-amber-800 border-amber-300',
    idle: 'bg-slate-50 text-slate-300 border-slate-200',
    filterIdle: 'bg-amber-50 text-amber-800',
  },
  DIAMOND: {
    active: 'bg-sky-100 text-sky-800 border-sky-300',
    idle: 'bg-slate-50 text-slate-300 border-slate-200',
    filterIdle: 'bg-sky-50 text-sky-800',
  },
  REAL_STONE: {
    active: 'bg-violet-100 text-violet-800 border-violet-300',
    idle: 'bg-slate-50 text-slate-300 border-slate-200',
    filterIdle: 'bg-violet-50 text-violet-800',
  },
  STONE_PACKET: {
    active: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    idle: 'bg-slate-50 text-slate-300 border-slate-200',
    filterIdle: 'bg-emerald-50 text-emerald-800',
  },
};

const AVATAR_PALETTE = [
  'bg-champagne-100 text-champagne-800',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
  'bg-onyx-100 text-onyx-700',
  'bg-teal-100 text-teal-700',
  'bg-fuchsia-100 text-fuchsia-700',
];

function getAvatar(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const cls = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  return { initials: initials || '?', cls };
}

function isVerified(v: Vendor) {
  const s = v.gstDetails?.source;
  return s === 'rapidapi' || s === 'rapidapi-tool' || s === 'gstincheck' || s === 'mastergst';
}

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

export default function VendorsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: vendors = [], isLoading, isFetching } = useQuery({
    queryKey: ['vendors', search],
    queryFn: () => listVendors(search || undefined),
  });

  const { data: outstanding = [], isLoading: outstandingLoading } = useQuery({
    queryKey: ['vendors-outstanding'],
    queryFn: listVendorOutstanding,
  });

  const outstandingMap = useMemo(() => {
    const m = new Map<string, VendorOutstanding>();
    outstanding.forEach((o) => m.set(o.vendorId, o));
    return m;
  }, [outstanding]);

  const fmt = (n: number) =>
    n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtCompact = (n: number) =>
    n >= 10000000
      ? `₹${(n / 10000000).toFixed(2)} Cr`
      : n >= 100000
      ? `₹${(n / 100000).toFixed(2)} L`
      : `₹${fmt(n)}`;

  // KPI roll-ups
  const kpis = useMemo(() => {
    const totalOut = vendors.reduce((s, v) => s + (outstandingMap.get(v.id)?.outstanding ?? 0), 0);
    const totalCredit = vendors.reduce((s, v) => s + (v.creditBalance ?? 0), 0);
    const verifiedCount = vendors.filter(isVerified).length;
    const withGstCount = vendors.filter((v) => !!v.gstNumber).length;
    return {
      total: vendors.length,
      verified: verifiedCount,
      withGst: withGstCount,
      totalOut,
      totalCredit,
    };
  }, [vendors, outstandingMap]);

  // Filter + sort
  const visible = useMemo(() => {
    let list = vendors.filter((v) => {
      const o = outstandingMap.get(v.id);
      const dealsCat = FILTER_TO_DEALS[filter];
      if (dealsCat) return (v.dealsIn ?? []).includes(dealsCat);
      switch (filter) {
        case 'verified':
          return isVerified(v);
        case 'noGst':
          return !v.gstNumber;
        case 'foreign': {
          // International vendor: country is set and ≠ India, OR
          // foreignDetails blob exists. Either signal qualifies because a
          // freshly-saved foreign vendor always has both, but legacy data
          // may have only one of them.
          const c = (v.country || v.gstDetails?.country || '').trim();
          return (c.length > 0 && c !== 'India') || !!v.gstDetails?.foreignDetails;
        }
        case 'outstanding':
          return (o?.outstanding ?? 0) > 0;
        case 'credit':
          return (v.creditBalance ?? 0) > 0;
        case 'archived':
          // Soft-archived = explicitly empty dealsIn array. Treat
          // "undefined" as legacy (not archived) so old API responses
          // don't surface as archived by accident.
          return Array.isArray(v.dealsIn) && v.dealsIn.length === 0;
        default:
          return true;
      }
    });
    list = [...list].sort((a, b) => {
      const oa = outstandingMap.get(a.id);
      const ob = outstandingMap.get(b.id);
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
          break;
        case 'outstanding':
          cmp = (oa?.outstanding ?? 0) - (ob?.outstanding ?? 0);
          break;
        case 'paid':
          cmp = (oa?.totalPaid ?? 0) - (ob?.totalPaid ?? 0);
          break;
        case 'credit':
          cmp = (a.creditBalance ?? 0) - (b.creditBalance ?? 0);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [vendors, outstandingMap, filter, sortKey, sortDir]);

  const removeMut = useMutation({
    mutationFn: deleteVendor,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendors'] });
      qc.invalidateQueries({ queryKey: ['vendors-outstanding'] });
      setDeleteTarget(null);
      setDeleteError(null);
    },
    onError: (e: any) => setDeleteError(e?.response?.data?.error || e?.message || 'Delete failed'),
  });

  const handleEdit = (v: Vendor) => {
    setEditing(v);
    setIsOpen(true);
  };
  const handleAdd = () => {
    setEditing(null);
    setIsOpen(true);
  };
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['vendors'] });
    qc.invalidateQueries({ queryKey: ['vendors-outstanding'] });
  };

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(k);
      setSortDir(k === 'name' ? 'asc' : 'desc');
    }
  };

  const sortIcon = (k: SortKey) => {
    if (sortKey !== k) return <ChevronUpDownIcon className="w-3.5 h-3.5 opacity-40" />;
    return sortDir === 'asc' ? (
      <ChevronUpIcon className="w-3.5 h-3.5" />
    ) : (
      <ChevronDownIcon className="w-3.5 h-3.5" />
    );
  };

  const exportCsv = () => {
    const header = [
      'Name',
      'Unique Code',
      'Phone',
      'Email',
      'Country',
      'GSTIN',
      'Verified',
      'Status',
      'Legal Name',
      'Trade Name',
      'State',
      'City',
      'Pincode',
      'Business Type',
      'Deals In',
      // Foreign / international vendor columns — blank for India vendors.
      'Foreign Tax ID',
      'Foreign Tax Label',
      'Currency',
      'Bank Name',
      'SWIFT/BIC',
      'IBAN',
      'Account #',
      'Beneficiary',
      'Incoterms',
      'HS Code',
      'KPC #',
      'Payment Terms',
      'LC Required',
      'Outstanding',
      'Paid',
      'Credit',
      'Open Bills',
    ];
    const rows = [header];
    visible.forEach((v) => {
      const o = outstandingMap.get(v.id);
      const fd = v.gstDetails?.foreignDetails;
      // For foreign vendors, prefer foreignDetails.city/state/postalCode over
      // gstDetails.city/state which only carry meaning for Indian vendors.
      const isForeign =
        !!fd ||
        ((v.country || v.gstDetails?.country || '') !== 'India' && !v.gstNumber);
      rows.push([
        v.name,
        v.uniqueCode,
        v.phone || '',
        v.email || v.gstDetails?.email || '',
        v.country || v.gstDetails?.country || '',
        v.gstNumber || '',
        isVerified(v) ? 'Yes' : '',
        v.gstDetails?.status || '',
        v.gstDetails?.legalName || '',
        v.gstDetails?.tradeName || '',
        isForeign ? fd?.state || '' : v.gstDetails?.state || '',
        isForeign ? fd?.city || '' : v.gstDetails?.city || '',
        isForeign ? fd?.postalCode || '' : v.gstDetails?.pincode || '',
        v.gstDetails?.businessType || '',
        // Semicolon-joined so it survives Excel's comma split-on-import.
        (v.dealsIn ?? []).join(';'),
        fd?.taxId || '',
        fd?.taxIdLabel || '',
        fd?.currency || '',
        fd?.bankName || '',
        fd?.swift || '',
        fd?.iban || '',
        fd?.accountNumber || '',
        fd?.beneficiaryName || '',
        fd?.incoterms || '',
        fd?.defaultHsCode || '',
        fd?.kpcNumber || '',
        fd?.paymentTerms || '',
        fd?.letterOfCreditRequired ? 'Yes' : '',
        (o?.outstanding ?? 0).toFixed(2),
        (o?.totalPaid ?? 0).toFixed(2),
        (v.creditBalance ?? 0).toFixed(2),
        String(o?.openCount ?? 0),
      ]);
    });
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(rows, `vendors-${stamp}.csv`);
  };

  const filterChips: { key: FilterKey; label: string; count: number; cls: string }[] = [
    { key: 'all', label: 'All', count: vendors.length, cls: 'bg-slate-100 text-slate-700' },
    {
      key: 'verified',
      label: 'GST Verified',
      count: kpis.verified,
      cls: 'bg-emerald-100 text-emerald-800',
    },
    {
      key: 'noGst',
      label: 'No GST',
      count: vendors.filter((v) => !v.gstNumber).length,
      cls: 'bg-amber-100 text-amber-800',
    },
    {
      key: 'foreign',
      label: '🌍 International',
      count: vendors.filter((v) => {
        const c = (v.country || v.gstDetails?.country || '').trim();
        return (c.length > 0 && c !== 'India') || !!v.gstDetails?.foreignDetails;
      }).length,
      cls: 'bg-sky-100 text-sky-800',
    },
    {
      key: 'outstanding',
      label: 'Has Outstanding',
      count: vendors.filter((v) => (outstandingMap.get(v.id)?.outstanding ?? 0) > 0).length,
      cls: 'bg-rose-100 text-rose-800',
    },
    {
      key: 'credit',
      label: 'Has Credit',
      count: vendors.filter((v) => (v.creditBalance ?? 0) > 0).length,
      cls: 'bg-sky-100 text-sky-800',
    },
    {
      key: 'archived',
      label: 'Archived',
      count: vendors.filter(
        (v) => Array.isArray(v.dealsIn) && v.dealsIn.length === 0,
      ).length,
      cls: 'bg-slate-200 text-slate-700',
    },
    // Per-category supply filters — mirror the order on the Receive pages.
    ...VENDOR_DEALS_CATEGORIES.map((cat) => {
      const filterKey = (
        cat === 'METAL'
          ? 'dealsMetal'
          : cat === 'DIAMOND'
          ? 'dealsDiamond'
          : cat === 'REAL_STONE'
          ? 'dealsRealStone'
          : 'dealsStonePacket'
      ) as FilterKey;
      return {
        key: filterKey,
        label: `Supplies ${VENDOR_DEALS_LABELS[cat]}`,
        count: vendors.filter((v) => (v.dealsIn ?? []).includes(cat)).length,
        cls: DEALS_CHIP_STYLE[cat].filterIdle,
      };
    }),
  ];

  return (
    <div className="p-6 bg-gradient-to-br from-champagne-50/40 via-white to-pearl min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <BuildingOffice2Icon className="w-8 h-8 text-champagne-700" />
              Vendor Info
            </h1>
            <p className="text-gray-600 text-sm">
              Manage vendors with realtime GST auto-fetch &middot; live outstanding &amp; credit
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={isFetching}
              title="Refresh"
              className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={exportCsv}
              disabled={visible.length === 0}
              className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={handleAdd}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-champagne-700 via-champagne-800 to-onyx-800 hover:from-champagne-800 hover:via-onyx-700 hover:to-onyx-900 text-white text-sm font-semibold flex items-center gap-2 shadow-md shadow-onyx-700/20"
            >
              <PlusIcon className="w-4 h-4" /> Add Vendor
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <KpiCard
            icon={<UsersIcon className="w-5 h-5" />}
            label="Total Vendors"
            value={String(kpis.total)}
            tint="indigo"
          />
          <KpiCard
            icon={<CheckBadgeIcon className="w-5 h-5" />}
            label="GST Verified"
            value={`${kpis.verified}`}
            sub={`of ${kpis.withGst} with GST`}
            tint="emerald"
          />
          <KpiCard
            icon={<ExclamationTriangleIcon className="w-5 h-5" />}
            label="Total Outstanding"
            value={fmtCompact(kpis.totalOut)}
            tint="rose"
          />
          <KpiCard
            icon={<WalletIcon className="w-5 h-5" />}
            label="Total Credit"
            value={fmtCompact(kpis.totalCredit)}
            tint="sky"
          />
          <KpiCard
            icon={<BanknotesIcon className="w-5 h-5" />}
            label="With GST"
            value={`${kpis.withGst}`}
            sub={`${kpis.total - kpis.withGst} without`}
            tint="violet"
          />
        </div>

        {/* Search + filters */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 mb-4">
          <div className="relative mb-3">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, code, GSTIN or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-champagne-600 focus:border-transparent bg-gray-50 focus:bg-white transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {filterChips.map((c) => {
              const active = filter === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setFilter(c.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    active
                      ? 'border-champagne-700 bg-champagne-800 text-white shadow-sm'
                      : `border-transparent ${c.cls} hover:brightness-95`
                  }`}
                >
                  {c.label}
                  <span
                    className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                      active ? 'bg-white/25' : 'bg-white/70'
                    }`}
                  >
                    {c.count}
                  </span>
                </button>
              );
            })}
            <span className="ml-auto text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-700">{visible.length}</span> of{' '}
              {vendors.length}
            </span>
          </div>
        </div>

        {/* Table / states */}
        {isLoading ? (
          <SkeletonTable />
        ) : visible.length === 0 ? (
          <EmptyState onAdd={handleAdd} hasSearch={!!search || filter !== 'all'} />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <Th onClick={() => toggleSort('name')}>
                      <span className="flex items-center gap-1">Name {sortIcon('name')}</span>
                    </Th>
                    <Th>Code</Th>
                    <Th>Phone</Th>
                    <Th>GSTIN</Th>
                    <Th>Location</Th>
                    <Th align="right" onClick={() => toggleSort('outstanding')}>
                      <span className="flex items-center justify-end gap-1">
                        Outstanding {sortIcon('outstanding')}
                      </span>
                    </Th>
                    <Th align="right" onClick={() => toggleSort('paid')}>
                      <span className="flex items-center justify-end gap-1">
                        Paid {sortIcon('paid')}
                      </span>
                    </Th>
                    <Th align="right" onClick={() => toggleSort('credit')}>
                      <span className="flex items-center justify-end gap-1">
                        Credit {sortIcon('credit')}
                      </span>
                    </Th>
                    <Th align="center">Open</Th>
                    <Th align="right">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visible.map((v) => {
                    const o = outstandingMap.get(v.id);
                    const verified = isVerified(v);
                    const status = v.gstDetails?.status || '';
                    const statusLower = status.toLowerCase();
                    const statusCls =
                      statusLower === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : statusLower === 'cancelled' || statusLower === 'canceled'
                        ? 'bg-rose-100 text-rose-800'
                        : statusLower === 'suspended'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700';
                    const av = getAvatar(v.name);
                    return (
                      <tr
                        key={v.id}
                        className="hover:bg-champagne-50/40 cursor-pointer transition"
                        onClick={() => navigate(`/app/vendors/${v.id}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${av.cls}`}
                            >
                              {av.initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 truncate max-w-[240px]">
                                {v.name}
                              </div>
                              {v.gstDetails?.legalName &&
                                v.gstDetails.legalName !== v.name && (
                                  <div className="text-xs font-normal text-gray-500 truncate max-w-[240px]">
                                    {v.gstDetails.legalName}
                                  </div>
                                )}
                              {v.gstDetails?.businessType && (
                                <span className="mt-1 inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                                  {v.gstDetails.businessType}
                                </span>
                              )}
                              {/* Supply-category chips: bright when flagged,
                                  dim when not. Empty array (soft-archived)
                                  shows all 4 dimmed so the gap is obvious. */}
                              <div className="mt-1 flex flex-wrap gap-1" aria-label="Supply categories">
                                {VENDOR_DEALS_CATEGORIES.map((cat) => {
                                  const on = (v.dealsIn ?? []).includes(cat);
                                  const style = DEALS_CHIP_STYLE[cat];
                                  return (
                                    <span
                                      key={cat}
                                      title={`${VENDOR_DEALS_LABELS[cat]}${
                                        on ? '' : ' — not flagged for this category'
                                      }`}
                                      className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1 rounded border text-[10px] font-bold tracking-wide ${
                                        on ? style.active : style.idle
                                      }`}
                                    >
                                      {VENDOR_DEALS_SHORT[cat]}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">
                          {v.uniqueCode}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {v.phone || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {v.gstNumber ? (
                            <div className="flex flex-col gap-1">
                              <span>{v.gstNumber}</span>
                              <div className="flex flex-wrap gap-1">
                                {verified ? (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                                    <CheckBadgeIcon className="w-3 h-3" /> Verified
                                  </span>
                                ) : v.gstDetails ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-semibold">
                                    Structural
                                  </span>
                                ) : null}
                                {status && (
                                  <span
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusCls}`}
                                  >
                                    {status}
                                  </span>
                                )}
                                {(v.gstDetails?.eInvoiceStatus || '').toLowerCase() === 'yes' && (
                                  <span
                                    className="inline-flex items-center px-1.5 py-0.5 rounded bg-champagne-50 text-champagne-800 border border-champagne-200 text-[10px] font-semibold"
                                    title="e-Invoice eligible"
                                  >
                                    ⚡ e-Inv
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (() => {
                            // Foreign vendor: surface country + currency chips
                            // in place of the GSTIN column so the user can
                            // tell at a glance this is an international vendor.
                            const country = v.country || v.gstDetails?.country || '';
                            const fd = v.gstDetails?.foreignDetails;
                            if (country && country !== 'India') {
                              return (
                                <div className="flex flex-col gap-1">
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-semibold w-fit">
                                    🌍 {country}
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {fd?.currency && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                                        {fd.currency}
                                      </span>
                                    )}
                                    {fd?.incoterms && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                                        {fd.incoterms}
                                      </span>
                                    )}
                                    {fd?.kpcNumber && (
                                      <span
                                        className="inline-flex items-center px-1.5 py-0.5 rounded bg-violet-50 text-violet-800 border border-violet-200 text-[10px] font-semibold"
                                        title={`Kimberley Process Cert: ${fd.kpcNumber}`}
                                      >
                                        KPC ✓
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            return <span className="text-gray-300">—</span>;
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            // Foreign vendors store address on foreignDetails;
                            // domestic vendors use the India-side gstDetails
                            // fields (state code 01-38). Prefer the foreign
                            // copy so a vendor that was migrated India→Foreign
                            // doesn't keep showing the stale Indian state.
                            const fd = v.gstDetails?.foreignDetails;
                            const isForeign =
                              !!fd ||
                              ((v.country || v.gstDetails?.country || '') !== 'India' &&
                                !v.gstNumber);
                            const state = isForeign
                              ? fd?.state || ''
                              : v.gstDetails?.state || '';
                            const city = isForeign
                              ? fd?.city || ''
                              : v.gstDetails?.city || '';
                            if (!state && !city) {
                              return <span className="text-gray-300">—</span>;
                            }
                            return (
                              <div className="flex flex-col">
                                {state && (
                                  <span className="text-gray-900 text-sm">{state}</span>
                                )}
                                {city && (
                                  <span className="text-gray-500 text-xs">{city}</span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td
                          className={`px-4 py-3 text-right tabular-nums ${
                            o && o.outstanding > 0
                              ? 'text-rose-600 font-semibold'
                              : 'text-gray-700'
                          }`}
                        >
                          {outstandingLoading ? (
                            <span className="text-gray-300">—</span>
                          ) : (
                            `₹${fmt(o?.outstanding ?? 0)}`
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
                          {outstandingLoading ? (
                            <span className="text-gray-300">—</span>
                          ) : (
                            `₹${fmt(o?.totalPaid ?? 0)}`
                          )}
                        </td>
                        <td
                          className={`px-4 py-3 text-right tabular-nums ${
                            v.creditBalance > 0
                              ? 'text-emerald-600 font-semibold'
                              : 'text-gray-300'
                          }`}
                        >
                          {v.creditBalance > 0 ? `₹${fmt(v.creditBalance)}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {outstandingLoading || !o || o.openCount === 0 ? (
                            <span className="text-gray-300">—</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                              {o.openCount}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(v);
                              }}
                              title="Edit vendor"
                              className="p-2 rounded-lg text-champagne-700 hover:bg-champagne-50"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteError(null);
                                setDeleteTarget(v);
                              }}
                              title="Delete vendor"
                              className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isOpen && (
          <VendorFormModal
            vendor={editing}
            onClose={() => setIsOpen(false)}
            onSaved={() => {
              setIsOpen(false);
              qc.invalidateQueries({ queryKey: ['vendors'] });
              qc.invalidateQueries({ queryKey: ['vendors-outstanding'] });
            }}
          />
        )}

        {deleteTarget && (
          <ConfirmDeleteModal
            vendor={deleteTarget}
            error={deleteError}
            isPending={removeMut.isPending}
            onCancel={() => {
              if (removeMut.isPending) return;
              setDeleteTarget(null);
              setDeleteError(null);
            }}
            onConfirm={() => removeMut.mutate(deleteTarget.id)}
          />
        )}
      </div>
    </div>
  );
}

/* ----------------------------- Sub-components ----------------------------- */

const TINTS: Record<string, { ring: string; bg: string; text: string; iconBg: string }> = {
  indigo: {
    ring: 'ring-champagne-200',
    bg: 'bg-white',
    text: 'text-champagne-800',
    iconBg: 'bg-champagne-50 text-champagne-700',
  },
  emerald: {
    ring: 'ring-emerald-100',
    bg: 'bg-white',
    text: 'text-emerald-700',
    iconBg: 'bg-emerald-50 text-emerald-600',
  },
  rose: {
    ring: 'ring-rose-100',
    bg: 'bg-white',
    text: 'text-rose-700',
    iconBg: 'bg-rose-50 text-rose-600',
  },
  sky: {
    ring: 'ring-sky-100',
    bg: 'bg-white',
    text: 'text-sky-700',
    iconBg: 'bg-sky-50 text-sky-600',
  },
  violet: {
    ring: 'ring-onyx-200',
    bg: 'bg-white',
    text: 'text-onyx-700',
    iconBg: 'bg-onyx-100 text-onyx-700',
  },
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
  const t = TINTS[tint]!;
  return (
    <div
      className={`rounded-2xl p-4 ${t.bg} ring-1 ${t.ring} shadow-sm hover:shadow-md transition`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <div className={`p-1.5 rounded-lg ${t.iconBg}`}>{icon}</div>
      </div>
      <div className={`text-2xl font-bold ${t.text}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
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
  const cls =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th
      onClick={onClick}
      className={`px-4 py-3 ${cls} ${onClick ? 'cursor-pointer select-none hover:text-champagne-700' : ''}`}
    >
      {children}
    </th>
  );
}

function SkeletonTable() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0 animate-pulse">
          <div className="w-9 h-9 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/3" />
            <div className="h-2 bg-gray-100 rounded w-1/4" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-20" />
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-3 bg-gray-200 rounded w-16" />
        </div>
      ))}
    </div>
  );
}

function ConfirmDeleteModal({
  vendor,
  error,
  isPending,
  onCancel,
  onConfirm,
}: {
  vendor: Vendor;
  error: string | null;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
              <ExclamationTriangleIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-gray-900">Delete vendor?</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                This will permanently remove <span className="font-semibold">{vendor.name}</span>{' '}
                <span className="font-mono text-xs text-gray-500">({vendor.uniqueCode})</span>.
                This action cannot be undone.
              </p>
            </div>
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mt-2">
              {error}
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {isPending && (
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onAdd, hasSearch }: { onAdd: () => void; hasSearch: boolean }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-champagne-50 text-champagne-700 mx-auto mb-4 flex items-center justify-center">
        <BuildingOffice2Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {hasSearch ? 'No vendors match your filters' : 'No vendors yet'}
      </h3>
      <p className="text-sm text-gray-500 mb-5">
        {hasSearch
          ? 'Try adjusting your search or filter to see more results.'
          : 'Add your first vendor to start tracking purchases, payments and GST details.'}
      </p>
      {!hasSearch && (
        <button
          onClick={onAdd}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-champagne-700 via-champagne-800 to-onyx-800 hover:from-champagne-800 hover:via-onyx-700 hover:to-onyx-900 text-white text-sm font-semibold inline-flex items-center gap-2 shadow-md shadow-onyx-700/20"
        >
          <PlusIcon className="w-4 h-4" /> Add Vendor
        </button>
      )}
    </div>
  );
}
