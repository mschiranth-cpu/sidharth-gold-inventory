import { Wallet } from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import type { VendorOutstandingRow } from '../../../../types/dashboard.types';

export interface VendorOutstandingWidgetProps {
  data: VendorOutstandingRow[] | undefined;
  isLoading?: boolean;
  editMode?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onHide?: () => void;
  onOpen?: (vendorId: string) => void;
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export const VendorOutstandingWidget = ({
  data,
  isLoading,
  editMode,
  dragHandleProps,
  onHide,
  onOpen,
}: VendorOutstandingWidgetProps) => {
  const rows = data ?? [];
  const total = rows.reduce((s, x) => s + x.outstanding, 0);
  return (
    <WidgetCard
      tone="pearl"
      title="Top Vendors — Outstanding"
      subtitle={`${inr(total)} across ${rows.length} vendor${rows.length === 1 ? '' : 's'}`}
      icon={<Wallet className="w-4 h-4 text-champagne-700" />}
      isLoading={isLoading}
      editMode={editMode}
      dragHandleProps={dragHandleProps}
      onHide={onHide}
    >
      {rows.length === 0 && !isLoading ? (
        <div className="text-sm text-onyx-400 py-6 text-center">All vendors settled.</div>
      ) : (
        <ul className="divide-y divide-champagne-200/60">
          {rows.map((v) => {
            const billable = v.totalBillable || v.outstanding + v.totalPaid;
            const paidPct = billable > 0 ? Math.min(100, (v.totalPaid / billable) * 100) : 0;
            const outPct = billable > 0 ? Math.min(100 - paidPct, (v.outstanding / billable) * 100) : 100;
            return (
              <li
                key={v.vendorId}
                className="py-2.5 px-2 -mx-2 hover:bg-champagne-50 rounded-lg cursor-pointer"
                onClick={() => onOpen?.(v.vendorId)}
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-onyx-900 truncate">{v.name}</p>
                    <p className="text-xs text-onyx-400 truncate">
                      {v.uniqueCode} · {v.openCount} open bill{v.openCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-accent-ruby tabular-nums">
                      {inr(v.outstanding)}
                    </p>
                    <p className="text-[10px] text-onyx-400">of {inr(billable)}</p>
                  </div>
                </div>
                <div
                  className="mt-1.5 h-1.5 w-full rounded-full bg-champagne-100 overflow-hidden flex"
                  role="img"
                  aria-label={`Paid ${paidPct.toFixed(0)}%, outstanding ${outPct.toFixed(0)}%`}
                >
                  <div
                    className="h-full bg-accent-emerald"
                    style={{ width: `${paidPct}%` }}
                    title={`Paid ${inr(v.totalPaid)}`}
                  />
                  <div
                    className="h-full bg-accent-ruby"
                    style={{ width: `${outPct}%` }}
                    title={`Outstanding ${inr(v.outstanding)}`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
};

export default VendorOutstandingWidget;
