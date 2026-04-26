import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

export interface KpiTileProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: 'pearl' | 'champagne' | 'ruby' | 'emerald';
  onDrillDown?: () => void;
  isLoading?: boolean;
  sparkline?: number[];
}

const TONES: Record<NonNullable<KpiTileProps['tone']>, { card: string; value: string; icon: string; spark: string }> = {
  pearl: { card: 'bg-pearl border-champagne-200/70', value: 'text-onyx-900', icon: 'text-champagne-700', spark: '#C9A55C' },
  champagne: {
    card: 'bg-champagne-gradient border-champagne-300/70',
    value: 'text-onyx-900',
    icon: 'text-champagne-800',
    spark: '#8C6A2F',
  },
  ruby: { card: 'bg-pearl border-accent-ruby/30', value: 'text-accent-ruby', icon: 'text-accent-ruby', spark: '#B43A4A' },
  emerald: {
    card: 'bg-pearl border-accent-emerald/30',
    value: 'text-accent-emerald',
    icon: 'text-accent-emerald',
    spark: '#1F8A6F',
  },
};

const Sparkline = ({ values, color }: { values: number[]; color: string }) => {
  if (!values || values.length < 2) return null;
  const w = 100;
  const h = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => `${(i * step).toFixed(2)},${(h - ((v - min) / range) * h).toFixed(2)}`)
    .join(' ');
  const areaPoints = `0,${h} ${points} ${w},${h}`;
  const gradId = `spark-${color.replace('#', '')}`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="w-full h-7 mt-2"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const KpiTile = ({
  label,
  value,
  hint,
  icon,
  tone = 'pearl',
  onDrillDown,
  isLoading = false,
  sparkline,
}: KpiTileProps) => {
  const t = TONES[tone];
  return (
    <button
      type="button"
      onClick={onDrillDown}
      disabled={!onDrillDown}
      className={`group text-left rounded-2xl border ${t.card} p-4 md:p-5 shadow-pearl transition hover:shadow-luxe disabled:cursor-default w-full`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-onyx-400 font-medium truncate">
            {label}
          </p>
          {isLoading ? (
            <div className="h-8 w-24 mt-1 rounded bg-champagne-100 animate-pulse" />
          ) : (
            <div className={`font-display text-2xl md:text-3xl font-semibold mt-1 tabular-nums ${t.value}`}>
              {value}
            </div>
          )}
          {hint && <p className="text-xs text-onyx-400 mt-1 truncate">{hint}</p>}
        </div>
        {icon && <div className={`shrink-0 ${t.icon}`}>{icon}</div>}
      </div>
      {!isLoading && sparkline && sparkline.length >= 2 && (
        <Sparkline values={sparkline} color={t.spark} />
      )}
      {onDrillDown && (
        <div className="mt-3 flex items-center gap-1 text-xs text-champagne-700 opacity-0 group-hover:opacity-100 transition">
          View detail <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </button>
  );
};

export default KpiTile;
