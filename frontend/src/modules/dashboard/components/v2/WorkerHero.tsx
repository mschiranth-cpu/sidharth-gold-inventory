import { Briefcase, CheckCircle2 } from 'lucide-react';
import type { WorkerDashboardOverview, MarketRatesPayload } from '../../../../types/dashboard.types';
import { formatIstTime } from '../../../../lib/dateUtils';

const fmt = (n: number | null | undefined) =>
  n == null ? '—' : `₹${Math.round(n).toLocaleString('en-IN')}`;

export interface WorkerHeroProps {
  userName: string;
  attendance: WorkerDashboardOverview['myAttendanceToday'];
  department: string | null;
  rates: MarketRatesPayload;
  generatedAt: string | null;
  onCheckIn?: () => void;
}

const STATUS_LABEL: Record<WorkerDashboardOverview['myAttendanceToday']['status'], { text: string; color: string }> = {
  PRESENT: { text: 'Checked in', color: 'text-accent-emerald' },
  CHECKED_OUT: { text: 'Checked out', color: 'text-onyx-400' },
  ABSENT: { text: 'Not checked in', color: 'text-accent-ruby' },
  ON_LEAVE: { text: 'On leave today', color: 'text-champagne-700' },
};

export const WorkerHero = ({
  userName,
  attendance,
  department,
  rates,
  generatedAt,
}: WorkerHeroProps) => {
  const s = STATUS_LABEL[attendance.status];
  return (
    <section className="rounded-2xl bg-onyx-gradient text-pearl shadow-onyx p-5 md:p-6 border border-onyx-700">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-champagne-300/80">My Floor</p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold mt-1 truncate">
            Hello, <span className="text-gold-leaf">{userName.split(' ')[0]}</span>
          </h1>
          <p className="text-xs text-champagne-200/70 mt-1">
            {department ?? 'Unassigned department'}
            {generatedAt && (
              <>
                {' · '}Updated{' '}
                {formatIstTime(generatedAt)}
              </>
            )}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            {attendance.status === 'CHECKED_OUT' ? (
              <CheckCircle2 className="w-4 h-4 text-accent-emerald" />
            ) : (
              <Briefcase className="w-4 h-4 text-gold-leaf" />
            )}
            <span className={`font-semibold ${s.color}`}>{s.text}</span>
            {attendance.checkInTime && (
              <span className="text-champagne-300/80">
                · in{' '}
                {formatIstTime(attendance.checkInTime)}
              </span>
            )}
            {attendance.checkOutTime && (
              <span className="text-champagne-300/80">
                · out{' '}
                {formatIstTime(attendance.checkOutTime)}
              </span>
            )}
          </div>
        </div>

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
}) => (
  <div className="rounded-lg bg-onyx-800/60 border border-onyx-700 px-3 py-2">
    <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-champagne-300/80">
      <span>{label}</span>
      {hasValue && (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            healthy ? 'bg-accent-emerald' : 'bg-champagne-400'
          }`}
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

export default WorkerHero;
