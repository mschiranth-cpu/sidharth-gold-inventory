import { formatIstDate } from '../lib/dateUtils';

/**
 * Overdue helper — shared by the 4 *TransactionsPage and the AgingReportPage.
 *
 * Predicate (matches the backend aging endpoint):
 *   `dueDate < today` AND COALESCE(paymentStatus, 'PENDING') !== 'COMPLETE'
 *
 * NULL paymentStatus is treated as PENDING (historical rows never had this
 * column populated; the new aging endpoint would otherwise miss them).
 */
export function isOverdue(
  dueDate: string | null | undefined,
  paymentStatus: string | null | undefined
): boolean {
  if (!dueDate) return false;
  const status = (paymentStatus || 'PENDING').toUpperCase();
  if (status === 'COMPLETE') return false;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return false;
  // Compare at the day boundary (00:00 local). A row due *today* is not yet
  // overdue — only strictly past-dated rows trigger the badge.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  return dueDay.getTime() < today.getTime();
}

export function daysOverdue(dueDate: string | null | undefined): number {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diff = today.getTime() - dueDay.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Inline overdue badge — rendered alongside the payment-status pill in the
 * 4 transaction list pages. Shows "Overdue 12d" with a red theme.
 */
export function OverdueBadge({
  dueDate,
  paymentStatus,
  className = '',
}: {
  dueDate: string | null | undefined;
  paymentStatus: string | null | undefined;
  className?: string;
}) {
  if (!isOverdue(dueDate, paymentStatus)) return null;
  const days = daysOverdue(dueDate);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-red-200 ${className}`}
      title={`Due ${formatIstDate(dueDate as string)} — ${days} day${days === 1 ? '' : 's'} overdue`}
    >
      <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 8 8" aria-hidden>
        <circle cx="4" cy="4" r="3" />
      </svg>
      Overdue {days}d
    </span>
  );
}
