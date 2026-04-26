import { Calendar, RefreshCw, Pencil, Check, RotateCcw } from 'lucide-react';
import type { DashboardRange, MarketRatesPayload } from '../../../../types/dashboard.types';

interface HeroBarProps {
  userName: string;
  roleLabel: string;
  range: DashboardRange;
  onRangeChange: (r: DashboardRange) => void;
  customFrom?: string;
  customTo?: string;
  onCustomChange?: (from: string, to: string) => void;
  isFetching: boolean;
  onRefresh: () => void;
  editMode: boolean;
  onToggleEdit: () => void;
  onResetLayout: () => void;
  rates: MarketRatesPayload;
  generatedAt: string | null;
}

const RANGES: Array<{ id: DashboardRange; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: 'custom', label: 'Custom' },
];

const fmt = (n: number | null | undefined) =>
  n == null ? '—' : `₹${Math.round(n).toLocaleString('en-IN')}`;

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export const HeroBar = ({
  userName,
  roleLabel,
  range,
  onRangeChange,
  customFrom,
  customTo,
  onCustomChange,
  isFetching,
  onRefresh,
  editMode,
  onToggleEdit,
  onResetLayout,
  rates,
  generatedAt,
}: HeroBarProps) => {
  return (
    <section className="rounded-2xl bg-onyx-gradient text-pearl shadow-onyx p-5 md:p-6 border border-onyx-700">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-champagne-300/80">
            Ativa Jewels — Live Floor
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold mt-1 truncate">
            {greeting()}, <span className="text-gold-leaf">{userName.split(' ')[0]}</span>
          </h1>
          <p className="text-xs text-champagne-200/70 mt-1">
            {roleLabel}
            {generatedAt && (
              <>
                {' · '}Updated{' '}
                {new Date(generatedAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </>
            )}
          </p>
        </div>

        {/* Rates strip */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs tabular-nums">
            <RatePill label="Gold 24K" value={fmt(rates.gold24k)} healthy={rates.healthy} hasValue={rates.gold24k != null} />
            <RatePill label="Gold 22K" value={fmt(rates.gold22k)} healthy={rates.healthy} hasValue={rates.gold22k != null} />
            <RatePill label="Gold 18K" value={fmt(rates.gold18k)} healthy={rates.healthy} hasValue={rates.gold18k != null} />
            <RatePill label="Silver" value={fmt(rates.silver)} healthy={rates.healthy} hasValue={rates.silver != null} />
          </div>
          {!rates.healthy && rates.gold24k == null && (
            <p className="text-[10px] text-champagne-300/70 text-right">
              Live rates temporarily unavailable
            </p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mt-5">
        <div className="inline-flex items-center rounded-full bg-onyx-800/70 border border-onyx-600 p-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onRangeChange(r.id)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition ${
                range === r.id
                  ? 'bg-gold-leaf-gradient text-onyx-900 shadow'
                  : 'text-champagne-200/80 hover:text-pearl'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {range === 'custom' && onCustomChange && (
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-4 h-4 text-champagne-300" />
            <input
              type="date"
              value={customFrom ?? ''}
              onChange={(e) => onCustomChange(e.target.value, customTo ?? e.target.value)}
              className="bg-onyx-800 border border-onyx-600 rounded-md px-2 py-1 text-pearl"
            />
            <span className="text-champagne-300">→</span>
            <input
              type="date"
              value={customTo ?? ''}
              onChange={(e) => onCustomChange(customFrom ?? e.target.value, e.target.value)}
              className="bg-onyx-800 border border-onyx-600 rounded-md px-2 py-1 text-pearl"
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 rounded-full bg-onyx-800/70 border border-onyx-600 px-3 py-1.5 text-xs text-champagne-200 hover:text-pearl"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {editMode && (
            <button
              type="button"
              onClick={onResetLayout}
              className="inline-flex items-center gap-1.5 rounded-full bg-onyx-800/70 border border-onyx-600 px-3 py-1.5 text-xs text-champagne-200 hover:text-pearl"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={onToggleEdit}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              editMode
                ? 'bg-gold-leaf-gradient text-onyx-900 shadow'
                : 'bg-onyx-800/70 border border-onyx-600 text-champagne-200 hover:text-pearl'
            }`}
          >
            {editMode ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
            {editMode ? 'Done' : 'Edit Layout'}
          </button>
        </div>
      </div>
    </section>
  );
};

const RatePill = ({
  label,
  value,
  healthy,
  hasValue,
}: {
  label: string;
  value: string;
  healthy: boolean;
  hasValue: boolean;
}) => {
  // Only show a status dot if we have *some* signal. If the value is missing,
  // skip the alarming red dot — the dash already conveys "no data".
  const showDot = hasValue;
  return (
    <div className="rounded-lg bg-onyx-800/60 border border-onyx-700 px-3 py-2">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-champagne-300/80">
        <span>{label}</span>
        {showDot && (
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${
              healthy ? 'bg-accent-emerald' : 'bg-champagne-400'
            }`}
            title={healthy ? 'Live' : 'Stale'}
          />
        )}
      </div>
      <div
        className={`font-semibold mt-0.5 tabular-nums ${
          hasValue ? 'text-pearl' : 'text-champagne-300/40'
        }`}
      >
        {value}
      </div>
    </div>
  );
};

export default HeroBar;
