/**
 * ============================================
 * ADD DIAMOND PAGE — Loose Pieces / Solitaire
 * ============================================
 *
 * Two-section design:
 *
 *   1. Loose Pieces  → parcel/lot purchases. Color is sold by BAND
 *      (D/E, E/F, F/G, G/H, H/I, I/J, J/K). Total carat weight + total pieces
 *      are tracked at the parcel level.
 *
 *   2. Solitaires    → individually-graded stones. Single color grade,
 *      full 4Cs, optional certificate / measurements.
 *
 * Styling matches the rest of the Ativa luxe theme: champagne / onyx /
 * pearl tokens, gradient-clipped headings, rounded-2xl cards. No legacy
 * indigo accents.
 */

import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  SparklesIcon,
  CubeTransparentIcon,
  ScaleIcon,
  BanknotesIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

import { createDiamond } from '../../services/diamond.service';
import Button from '../../components/common/Button';

/* ──────────────────────────────────────────────────────────────────── */
/* Enums (kept in sync with backend Prisma)                             */
/* ──────────────────────────────────────────────────────────────────── */

const SHAPES = [
  'ROUND', 'PRINCESS', 'OVAL', 'CUSHION', 'EMERALD',
  'PEAR', 'MARQUISE', 'HEART', 'RADIANT', 'ASSCHER', 'OTHER',
] as const;

const COLORS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N_Z', 'FANCY'] as const;

const CLARITIES = [
  'FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3',
] as const;

const CUTS = ['EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR'] as const;

/** Color bands sold for loose-piece parcels. */
const COLOR_BANDS = ['D/E', 'E/F', 'F/G', 'G/H', 'H/I', 'I/J', 'J/K'] as const;

const POLISH_OPTS = ['EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR'] as const;
const FLUORESCENCE_OPTS = ['NONE', 'FAINT', 'MEDIUM', 'STRONG', 'VERY_STRONG'] as const;
const CERT_LABS = ['GIA', 'IGI', 'HRD', 'AGS', 'GSI'] as const;

/* ──────────────────────────────────────────────────────────────────── */
/* Local form types                                                     */
/* ──────────────────────────────────────────────────────────────────── */

type Category = 'LOOSE' | 'SOLITAIRE';

interface LooseForm {
  stockNumber: string;
  caratWeight: number;
  totalPieces: number;
  shape: string;
  colorBand: string;
  clarity: string;
  cut: string;
  pricePerCarat: number;
  certificationLab: string;
}

interface SolitaireForm {
  stockNumber: string;
  caratWeight: number;
  shape: string;
  color: string;
  clarity: string;
  cut: string;
  pricePerCarat: number;
  certificationLab: string;
  certNumber: string;
  measurements: string;
  polish: string;
  symmetry: string;
  fluorescence: string;
}

const DEFAULT_LOOSE: LooseForm = {
  stockNumber: '',
  caratWeight: 0,
  totalPieces: 1,
  shape: 'ROUND',
  colorBand: 'F/G',
  clarity: 'VS1',
  cut: 'EXCELLENT',
  pricePerCarat: 0,
  certificationLab: '',
};

const DEFAULT_SOLITAIRE: SolitaireForm = {
  stockNumber: '',
  caratWeight: 0,
  shape: 'ROUND',
  color: 'D',
  clarity: 'VVS1',
  cut: 'EXCELLENT',
  pricePerCarat: 0,
  certificationLab: '',
  certNumber: '',
  measurements: '',
  polish: '',
  symmetry: '',
  fluorescence: '',
};

/* ──────────────────────────────────────────────────────────────────── */
/* Shared field primitives                                              */
/* ──────────────────────────────────────────────────────────────────── */

const inputCls =
  'w-full px-4 py-2.5 rounded-xl border border-onyx-200 bg-white text-onyx-900 ' +
  'placeholder:text-onyx-400 focus:outline-none focus:ring-2 focus:ring-champagne-500 ' +
  'focus:border-champagne-500 transition shadow-sm';

const labelCls = 'block text-sm font-semibold text-onyx-700 mb-1.5';

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-onyx-500">{hint}</p>}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* Page                                                                 */
/* ──────────────────────────────────────────────────────────────────── */

export default function AddDiamondPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [category, setCategory] = useState<Category>('SOLITAIRE');
  const [loose, setLoose] = useState<LooseForm>(DEFAULT_LOOSE);
  const [sol, setSol] = useState<SolitaireForm>(DEFAULT_SOLITAIRE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* live total-price preview */
  const totalPrice = useMemo(() => {
    const f = category === 'LOOSE' ? loose : sol;
    const carat = Number(f.caratWeight) || 0;
    const ppc = Number(f.pricePerCarat) || 0;
    return carat * ppc;
  }, [category, loose, sol]);

  const createMutation = useMutation({
    mutationFn: createDiamond,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diamonds'] });
      navigate('/app/inventory/diamonds');
    },
    onError: (err: any) => {
      setErrorMsg(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to add diamond. Please try again.'
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (category === 'LOOSE') {
      // For loose pieces we still satisfy the legacy `color` enum column with
      // the lower bound of the band so existing reports keep working.
      const lowerBound = loose.colorBand.split('/')[0] || 'F';
      createMutation.mutate({
        stockNumber: loose.stockNumber.trim(),
        category: 'LOOSE',
        caratWeight: Number(loose.caratWeight),
        color: lowerBound,
        colorBand: loose.colorBand,
        clarity: loose.clarity,
        cut: loose.cut || undefined,
        shape: loose.shape,
        pricePerCarat: loose.pricePerCarat ? Number(loose.pricePerCarat) : undefined,
        certificationLab: loose.certificationLab || undefined,
      } as any);
    } else {
      createMutation.mutate({
        stockNumber: sol.stockNumber.trim(),
        category: 'SOLITAIRE',
        caratWeight: Number(sol.caratWeight),
        color: sol.color,
        clarity: sol.clarity,
        cut: sol.cut || undefined,
        shape: sol.shape,
        measurements: sol.measurements || undefined,
        polish: sol.polish || undefined,
        symmetry: sol.symmetry || undefined,
        fluorescence: sol.fluorescence || undefined,
        certificationLab: sol.certificationLab || undefined,
        certNumber: sol.certNumber || undefined,
        pricePerCarat: sol.pricePerCarat ? Number(sol.pricePerCarat) : undefined,
      } as any);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pearl via-white to-champagne-50/40 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb / back */}
        <div className="mb-5">
          <Link
            to="/app/inventory/diamonds"
            className="inline-flex items-center gap-1.5 text-sm text-onyx-600 hover:text-champagne-700 transition"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Diamond Inventory
          </Link>
        </div>

        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-champagne-800 via-champagne-700 to-onyx-800 bg-clip-text text-transparent">
            Add Diamond Stock
          </h1>
          <p className="mt-1.5 text-onyx-600">
            Record either a parcel of loose pieces or an individually-graded solitaire.
          </p>
        </header>

        {/* Segmented toggle */}
        <div
          role="tablist"
          aria-label="Diamond purchase type"
          className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-white shadow-sm border border-onyx-100 mb-6"
        >
          <SegmentButton
            active={category === 'LOOSE'}
            onClick={() => setCategory('LOOSE')}
            icon={<CubeTransparentIcon className="h-5 w-5" />}
            title="Section 1 · Loose Pieces"
            subtitle="Parcel purchase, color band"
          />
          <SegmentButton
            active={category === 'SOLITAIRE'}
            onClick={() => setCategory('SOLITAIRE')}
            icon={<SparklesIcon className="h-5 w-5" />}
            title="Section 2 · Solitaires"
            subtitle="Individually graded stone"
          />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-onyx-100 overflow-hidden">
          {/* Card header strip */}
          <div className="px-6 md:px-8 py-4 bg-gradient-to-r from-champagne-50 via-white to-white border-b border-onyx-100">
            <h2 className="text-lg font-semibold text-onyx-800">
              {category === 'LOOSE' ? 'Loose Pieces — Parcel Details' : 'Solitaire — Stone Details'}
            </h2>
            <p className="text-xs text-onyx-500 mt-0.5">
              {category === 'LOOSE'
                ? 'Sold as a parcel. Color is captured as a band (e.g. E/F).'
                : 'Single graded stone. Capture full 4Cs and certificate.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            {category === 'LOOSE' ? (
              <LooseFields data={loose} setData={setLoose} />
            ) : (
              <SolitaireFields data={sol} setData={setSol} />
            )}

            {/* Live total preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <PreviewStat
                icon={<ScaleIcon className="h-5 w-5" />}
                label="Total Carat"
                value={(category === 'LOOSE' ? loose.caratWeight : sol.caratWeight) || 0}
                suffix="ct"
              />
              <PreviewStat
                icon={<BanknotesIcon className="h-5 w-5" />}
                label="Price / Carat"
                value={(category === 'LOOSE' ? loose.pricePerCarat : sol.pricePerCarat) || 0}
                prefix="₹"
              />
              <PreviewStat
                icon={<CheckBadgeIcon className="h-5 w-5" />}
                label="Total Value"
                value={totalPrice}
                prefix="₹"
                emphasis
              />
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMsg}
              </div>
            )}

            <div className="flex flex-col-reverse md:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate('/app/inventory/diamonds')}
                className="md:flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={createMutation.isPending}
                className="md:flex-1"
              >
                {category === 'LOOSE' ? 'Add Loose Parcel' : 'Add Solitaire'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* Sub-components                                                       */
/* ──────────────────────────────────────────────────────────────────── */

function SegmentButton({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        'flex items-center gap-3 px-4 py-3 rounded-xl text-left transition',
        'focus:outline-none focus:ring-2 focus:ring-champagne-500',
        active
          ? 'bg-gradient-to-r from-champagne-100 via-champagne-50 to-white border border-champagne-300 shadow-sm'
          : 'bg-transparent border border-transparent hover:bg-onyx-50',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-9 w-9 items-center justify-center rounded-lg shrink-0',
          active ? 'bg-champagne-600 text-white' : 'bg-onyx-100 text-onyx-600',
        ].join(' ')}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span
          className={[
            'block text-sm font-semibold',
            active ? 'text-champagne-800' : 'text-onyx-700',
          ].join(' ')}
        >
          {title}
        </span>
        <span className="block text-xs text-onyx-500 truncate">{subtitle}</span>
      </span>
    </button>
  );
}

function LooseFields({
  data,
  setData,
}: {
  data: LooseForm;
  setData: React.Dispatch<React.SetStateAction<LooseForm>>;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Field label="Stock / Lot Number" required hint="Reference for this parcel">
        <input
          type="text"
          required
          value={data.stockNumber}
          onChange={(e) => setData({ ...data, stockNumber: e.target.value })}
          className={inputCls}
          placeholder="e.g. LP-2026-001"
        />
      </Field>

      <Field label="Total Carat Weight" required>
        <input
          type="number"
          required
          step="0.001"
          min="0"
          value={data.caratWeight || ''}
          onChange={(e) => setData({ ...data, caratWeight: parseFloat(e.target.value) || 0 })}
          className={inputCls}
          placeholder="0.000"
        />
      </Field>

      <Field label="Total Pieces" hint="Number of stones in the parcel">
        <input
          type="number"
          min="1"
          step="1"
          value={data.totalPieces || ''}
          onChange={(e) => setData({ ...data, totalPieces: parseInt(e.target.value) || 0 })}
          className={inputCls}
          placeholder="e.g. 50"
        />
      </Field>

      <Field label="Shape" required>
        <select
          required
          value={data.shape}
          onChange={(e) => setData({ ...data, shape: e.target.value })}
          className={inputCls}
        >
          {SHAPES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Color (Band)" required hint="Loose parcels are graded as a color band">
        <select
          required
          value={data.colorBand}
          onChange={(e) => setData({ ...data, colorBand: e.target.value })}
          className={inputCls}
        >
          {COLOR_BANDS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Clarity" required>
        <select
          required
          value={data.clarity}
          onChange={(e) => setData({ ...data, clarity: e.target.value })}
          className={inputCls}
        >
          {CLARITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Cut">
        <select
          value={data.cut}
          onChange={(e) => setData({ ...data, cut: e.target.value })}
          className={inputCls}
        >
          {CUTS.map((c) => (
            <option key={c} value={c}>
              {c.replace('_', ' ')}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Avg Price per Carat (₹)">
        <input
          type="number"
          step="0.01"
          min="0"
          value={data.pricePerCarat || ''}
          onChange={(e) => setData({ ...data, pricePerCarat: parseFloat(e.target.value) || 0 })}
          className={inputCls}
          placeholder="0.00"
        />
      </Field>

      <Field label="Certification Lab" hint="Optional — most loose parcels are uncertified">
        <select
          value={data.certificationLab}
          onChange={(e) => setData({ ...data, certificationLab: e.target.value })}
          className={inputCls}
        >
          <option value="">— None —</option>
          {CERT_LABS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function SolitaireFields({
  data,
  setData,
}: {
  data: SolitaireForm;
  setData: React.Dispatch<React.SetStateAction<SolitaireForm>>;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Stock Number" required>
          <input
            type="text"
            required
            value={data.stockNumber}
            onChange={(e) => setData({ ...data, stockNumber: e.target.value })}
            className={inputCls}
            placeholder="e.g. SOL-2026-001"
          />
        </Field>

        <Field label="Carat Weight" required>
          <input
            type="number"
            required
            step="0.001"
            min="0"
            value={data.caratWeight || ''}
            onChange={(e) => setData({ ...data, caratWeight: parseFloat(e.target.value) || 0 })}
            className={inputCls}
            placeholder="0.000"
          />
        </Field>

        <Field label="Shape" required>
          <select
            required
            value={data.shape}
            onChange={(e) => setData({ ...data, shape: e.target.value })}
            className={inputCls}
          >
            {SHAPES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Color" required>
          <select
            required
            value={data.color}
            onChange={(e) => setData({ ...data, color: e.target.value })}
            className={inputCls}
          >
            {COLORS.map((c) => (
              <option key={c} value={c}>
                {c === 'N_Z' ? 'N–Z' : c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Clarity" required>
          <select
            required
            value={data.clarity}
            onChange={(e) => setData({ ...data, clarity: e.target.value })}
            className={inputCls}
          >
            {CLARITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Cut">
          <select
            value={data.cut}
            onChange={(e) => setData({ ...data, cut: e.target.value })}
            className={inputCls}
          >
            {CUTS.map((c) => (
              <option key={c} value={c}>
                {c.replace('_', ' ')}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Price per Carat (₹)">
          <input
            type="number"
            step="0.01"
            min="0"
            value={data.pricePerCarat || ''}
            onChange={(e) => setData({ ...data, pricePerCarat: parseFloat(e.target.value) || 0 })}
            className={inputCls}
            placeholder="0.00"
          />
        </Field>

        <Field label="Certification Lab">
          <select
            value={data.certificationLab}
            onChange={(e) => setData({ ...data, certificationLab: e.target.value })}
            className={inputCls}
          >
            <option value="">— None —</option>
            {CERT_LABS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <details className="rounded-xl border border-onyx-100 bg-onyx-50/40 group">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-onyx-700 flex items-center justify-between">
          <span>Advanced details (optional)</span>
          <span className="text-xs text-onyx-500 group-open:hidden">click to expand</span>
        </summary>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 pt-2">
          <Field label="Certificate Number">
            <input
              type="text"
              value={data.certNumber}
              onChange={(e) => setData({ ...data, certNumber: e.target.value })}
              className={inputCls}
              placeholder="e.g. 2185432198"
            />
          </Field>

          <Field label="Measurements" hint="e.g. 6.50 × 6.52 × 4.01 mm">
            <input
              type="text"
              value={data.measurements}
              onChange={(e) => setData({ ...data, measurements: e.target.value })}
              className={inputCls}
              placeholder="L × W × D"
            />
          </Field>

          <Field label="Polish">
            <select
              value={data.polish}
              onChange={(e) => setData({ ...data, polish: e.target.value })}
              className={inputCls}
            >
              <option value="">—</option>
              {POLISH_OPTS.map((o) => (
                <option key={o} value={o}>
                  {o.replace('_', ' ')}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Symmetry">
            <select
              value={data.symmetry}
              onChange={(e) => setData({ ...data, symmetry: e.target.value })}
              className={inputCls}
            >
              <option value="">—</option>
              {POLISH_OPTS.map((o) => (
                <option key={o} value={o}>
                  {o.replace('_', ' ')}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Fluorescence">
            <select
              value={data.fluorescence}
              onChange={(e) => setData({ ...data, fluorescence: e.target.value })}
              className={inputCls}
            >
              <option value="">—</option>
              {FLUORESCENCE_OPTS.map((o) => (
                <option key={o} value={o}>
                  {o.replace('_', ' ')}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </details>
    </div>
  );
}

function PreviewStat({
  icon,
  label,
  value,
  prefix,
  suffix,
  emphasis,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  emphasis?: boolean;
}) {
  const formatted = (value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: value && value % 1 !== 0 ? 2 : 0,
  });
  return (
    <div
      className={[
        'rounded-xl border px-4 py-3 flex items-center gap-3',
        emphasis
          ? 'bg-gradient-to-br from-champagne-100 via-champagne-50 to-white border-champagne-300'
          : 'bg-onyx-50/60 border-onyx-100',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-9 w-9 items-center justify-center rounded-lg shrink-0',
          emphasis ? 'bg-champagne-600 text-white' : 'bg-white text-onyx-600 border border-onyx-100',
        ].join(' ')}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-onyx-500">{label}</p>
        <p
          className={[
            'text-lg font-semibold tabular-nums',
            emphasis ? 'text-champagne-900' : 'text-onyx-800',
          ].join(' ')}
        >
          {prefix}
          {formatted}
          {suffix && <span className="text-sm font-medium ml-1 text-onyx-500">{suffix}</span>}
        </p>
      </div>
    </div>
  );
}
