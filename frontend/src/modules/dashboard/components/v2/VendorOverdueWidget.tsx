/**
 * Home-dashboard companion to VendorOutstandingWidget.tsx.
 *
 * VendorOutstanding shows the *full* open balance per vendor (paid vs open
 * across all bills, including not-yet-due ones). VendorOverdue shows only the
 * slice that is past `dueDate` — the work the user actually has to chase
 * today — and links straight into the dedicated AgingReportPage. Kept as a
 * sibling rather than a switch on the existing widget so the two concerns
 * stay independently editable + draggable in the dashboard layout.
 */
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { WidgetCard } from './WidgetCard';
import { listVendorAging, type VendorAging } from '../../../../services/vendor.service';

export interface VendorOverdueWidgetProps {
  editMode?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onHide?: () => void;
  /** Fired with optional vendorId — undefined means "open the full report". */
  onOpen?: (vendorId?: string) => void;
}

const inr = (n: number) => `\u20B9${Math.round(n).toLocaleString('en-IN')}`;

/**
 * Sum of all overdue buckets — i.e. anything past the due date. The
 * `current` bucket on `VendorAging` is "not yet overdue" so we deliberately
 * exclude it here.
 */
function overdueAmount(row: VendorAging): number {
  return row.d1_30 + row.d31_60 + row.d61_90 + row.over_90;
}

export const VendorOverdueWidget = ({
  editMode,
  dragHandleProps,
  onHide,
  onOpen,
}: VendorOverdueWidgetProps) => {
  // Self-fetched: the home overview endpoint already carries enough context
  // for the outstanding widget; piggy-backing this on the same payload would
  // bloat that response for every dashboard tile. The aging endpoint is
  // small (one row per vendor) and cached for 60s on the client.
  const { data, isLoading } = useQuery<VendorAging[]>({
    queryKey: ['vendor-aging'],
    queryFn: listVendorAging,
    staleTime: 60_000,
  });

  const overdueRows = (data ?? [])
    .map((r) => ({ row: r, overdue: overdueAmount(r) }))
    .filter((x) => x.overdue > 0)
    .sort((a, b) => b.overdue - a.overdue)
    .slice(0, 5);

  const totalOverdue = (data ?? []).reduce((s, r) => s + overdueAmount(r), 0);
  const overdueVendorCount = (data ?? []).filter((r) => overdueAmount(r) > 0).length;

  const subtitle =
    totalOverdue > 0
      ? `${inr(totalOverdue)} across ${overdueVendorCount} vendor${overdueVendorCount === 1 ? '' : 's'}`
      : 'No overdue invoices.';

  return (
    <WidgetCard
      tone="pearl"
      title="Overdue Vendors"
      subtitle={subtitle}
      icon={<AlertTriangle className="w-4 h-4 text-accent-ruby" />}
      isLoading={isLoading}
      editMode={editMode}
      dragHandleProps={dragHandleProps}
      onHide={onHide}
      action={
        <button
          type="button"
          onClick={() => onOpen?.(undefined)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-champagne-700 hover:text-champagne-900"
          aria-label="Open aging report"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      }
    >
      {overdueRows.length === 0 && !isLoading ? (
        <div className="text-sm text-onyx-400 py-6 text-center">
          All vendors current.
        </div>
      ) : (
        <ul className="divide-y divide-champagne-200/60">
          {overdueRows.map(({ row, overdue }) => {
            // Pick the worst bucket the vendor is in to colour the row.
            const tone =
              row.over_90 > 0
                ? 'text-accent-ruby'
                : row.d61_90 > 0
                  ? 'text-orange-600'
                  : row.d31_60 > 0
                    ? 'text-amber-600'
                    : 'text-emerald-700';
            const worst =
              row.over_90 > 0
                ? '90+ days'
                : row.d61_90 > 0
                  ? '61–90 days'
                  : row.d31_60 > 0
                    ? '31–60 days'
                    : '1–30 days';
            return (
              <li
                key={row.vendorId}
                className="py-2.5 px-2 -mx-2 hover:bg-champagne-50 rounded-lg cursor-pointer"
                onClick={() => onOpen?.(row.vendorId)}
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-onyx-900 truncate">
                      {row.name}
                    </p>
                    <p className={`text-xs truncate ${tone}`}>
                      {row.uniqueCode} · worst: {worst}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold tabular-nums ${tone}`}>
                      {inr(overdue)}
                    </p>
                    <p className="text-[10px] text-onyx-400">
                      {row.openCount} open bill{row.openCount === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
};

export default VendorOverdueWidget;
