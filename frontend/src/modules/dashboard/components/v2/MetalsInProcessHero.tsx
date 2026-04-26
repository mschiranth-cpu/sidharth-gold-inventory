import { Sparkles } from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import type { MetalsInProcess } from '../../../../types/dashboard.types';

const fmtG = (n: number) =>
  `${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} g`;

export interface MetalsInProcessHeroProps {
  data: MetalsInProcess | undefined;
  isLoading?: boolean;
  editMode?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onHide?: () => void;
}

export const MetalsInProcessHero = ({
  data,
  isLoading,
  editMode,
  dragHandleProps,
  onHide,
}: MetalsInProcessHeroProps) => {
  const gold = data?.gold ?? 0;
  const silver = data?.silver ?? 0;
  const platinum = data?.platinum ?? 0;
  const total = gold + silver + platinum;
  return (
    <WidgetCard
      tone="champagne"
      title="Metals on the Floor"
      subtitle="Currently in process across departments"
      icon={<Sparkles className="w-4 h-4 text-champagne-800" />}
      isLoading={isLoading}
      editMode={editMode}
      dragHandleProps={dragHandleProps}
      onHide={onHide}
    >
      <div className="grid grid-cols-3 gap-3">
        <MetalBlock label="Gold" value={gold} accent="text-champagne-900" />
        <MetalBlock label="Silver" value={silver} accent="text-onyx-500" />
        <MetalBlock label="Platinum" value={platinum} accent="text-onyx-700" />
      </div>
      <div className="mt-3 text-xs text-onyx-500">
        Total: <span className="font-semibold tabular-nums">{fmtG(total)}</span>
      </div>
    </WidgetCard>
  );
};

const MetalBlock = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) => (
  <div className="rounded-xl bg-pearl/70 border border-champagne-200 p-3">
    <p className="text-[11px] uppercase tracking-wider text-onyx-400">{label}</p>
    <p className={`font-display text-lg md:text-xl font-semibold mt-0.5 tabular-nums ${accent}`}>
      {fmtG(value)}
    </p>
  </div>
);

export default MetalsInProcessHero;
