import type { ReactNode } from 'react';
import { GripVertical, EyeOff } from 'lucide-react';

export interface WidgetCardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: 'pearl' | 'champagne' | 'onyx';
  isLoading?: boolean;
  editMode?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onHide?: () => void;
}

const TONES: Record<NonNullable<WidgetCardProps['tone']>, string> = {
  pearl: 'bg-pearl text-onyx-900 border-champagne-200/70 shadow-pearl',
  champagne: 'bg-champagne-gradient text-onyx-900 border-champagne-300/70 shadow-luxe',
  onyx: 'bg-onyx-gradient text-pearl border-onyx-700 shadow-onyx',
};

export const WidgetCard = ({
  title,
  subtitle,
  icon,
  action,
  children,
  className = '',
  tone = 'pearl',
  isLoading = false,
  editMode = false,
  dragHandleProps,
  onHide,
}: WidgetCardProps) => {
  return (
    <section
      className={`group relative rounded-2xl border ${TONES[tone]} p-4 md:p-5 transition-shadow duration-300 ${className}`}
    >
      {editMode && (
        <div className="absolute -top-3 -right-3 z-10 flex items-center gap-1 rounded-full bg-onyx-900 px-2 py-1 text-pearl shadow-onyx">
          <button
            type="button"
            className="cursor-grab touch-none p-1 hover:text-gold-leaf"
            aria-label="Drag widget"
            {...dragHandleProps}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          {onHide && (
            <button
              type="button"
              className="p-1 hover:text-accent-ruby"
              aria-label="Hide widget"
              onClick={onHide}
            >
              <EyeOff className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      {(title || action) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h3 className="font-display text-sm md:text-base font-semibold tracking-wide flex items-center gap-2 truncate">
                {icon}
                <span className="truncate">{title}</span>
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-onyx-400 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={isLoading ? 'animate-pulse' : ''}>{children}</div>
    </section>
  );
};

export default WidgetCard;
