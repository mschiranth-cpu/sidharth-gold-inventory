import { Boxes, AlertTriangle } from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import type { InventorySnapshot } from '../../../../types/dashboard.types';

export interface InventorySnapshotWidgetProps {
  data: InventorySnapshot | undefined;
  isLoading?: boolean;
  editMode?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onHide?: () => void;
  onOpen?: () => void;
}

const num = (n: number) => n.toLocaleString('en-IN');

export const InventorySnapshotWidget = ({
  data,
  isLoading,
  editMode,
  dragHandleProps,
  onHide,
  onOpen,
}: InventorySnapshotWidgetProps) => {
  const lows = data?.lowStockItems ?? [];
  return (
    <WidgetCard
      tone="pearl"
      title="Inventory Pulse"
      icon={<Boxes className="w-4 h-4 text-champagne-700" />}
      isLoading={isLoading}
      editMode={editMode}
      dragHandleProps={dragHandleProps}
      onHide={onHide}
      action={
        onOpen && (
          <button onClick={onOpen} className="text-xs text-champagne-700 hover:underline">
            Open
          </button>
        )
      }
    >
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Metal stock" value={`${num(Math.round(data?.metalStockGrams ?? 0))} g`} />
        <Stat label="Diamonds" value={`${num(data?.diamondPieces ?? 0)} pcs`} />
        <Stat label="Real stones" value={`${num(data?.realStonePieces ?? 0)} pcs`} />
        <Stat label="Stone packets" value={`${num(data?.stonePackets ?? 0)}`} />
      </div>

      {lows.length > 0 && (
        <div className="mt-3 rounded-lg border border-accent-ruby/30 bg-accent-ruby/5 p-2.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-accent-ruby">
            <AlertTriangle className="w-3.5 h-3.5" /> Low stock ({lows.length})
          </p>
          <ul className="mt-1.5 space-y-0.5 text-xs">
            {lows.slice(0, 4).map((l) => (
              <li
                key={`${l.type}-${l.id}`}
                className="flex justify-between gap-2 text-onyx-700"
              >
                <span className="truncate">{l.label}</span>
                <span className="tabular-nums shrink-0">
                  {l.quantity} / {l.threshold}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </WidgetCard>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-champagne-50 border border-champagne-200/60 px-3 py-2">
    <p className="text-[11px] uppercase tracking-wider text-onyx-400">{label}</p>
    <p className="text-sm font-semibold text-onyx-900 tabular-nums mt-0.5">{value}</p>
  </div>
);

export default InventorySnapshotWidget;
