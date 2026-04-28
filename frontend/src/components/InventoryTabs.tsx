/**
 * InventoryTabs
 * Shared quick-nav strip that lets users jump between the 4 inventory
 * dashboards (Metal / Diamond / Real Stone / Stone Packets) without going
 * back to the sidebar. Highlights the active route automatically.
 */
import { NavLink } from 'react-router-dom';
import {
  CubeTransparentIcon,
  SparklesIcon,
  FireIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

type Variant = 'dark' | 'light';

interface Props {
  /** Visual variant — `dark` for use inside the onyx hero, `light` on white. */
  variant?: Variant;
  className?: string;
}

const TABS = [
  {
    to: '/app/inventory/metal',
    label: 'Metal',
    Icon: CubeTransparentIcon,
  },
  {
    to: '/app/inventory/diamonds',
    label: 'Diamond',
    Icon: SparklesIcon,
  },
  {
    to: '/app/inventory/real-stones',
    label: 'Real Stone',
    Icon: FireIcon,
  },
  {
    to: '/app/inventory/stone-packets',
    label: 'Stone Packets',
    Icon: Squares2X2Icon,
  },
] as const;

export default function InventoryTabs({ variant = 'dark', className = '' }: Props) {
  const isDark = variant === 'dark';

  const baseTab =
    'group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition focus:outline-none focus:ring-2';
  const inactive = isDark
    ? 'text-champagne-100/70 hover:text-pearl hover:bg-white/10 border border-transparent focus:ring-champagne-400'
    : 'text-onyx-700 hover:text-onyx-900 hover:bg-champagne-50 border border-transparent focus:ring-champagne-500';
  const active = isDark
    ? 'bg-gradient-to-r from-champagne-500 to-champagne-700 text-onyx-900 shadow-md shadow-champagne-500/20 border border-champagne-300/40 focus:ring-champagne-300'
    : 'bg-gradient-to-r from-champagne-500 to-champagne-700 text-onyx-900 shadow-md shadow-champagne-500/20 border border-champagne-300 focus:ring-champagne-300';

  return (
    <nav
      aria-label="Inventory sections"
      className={`flex flex-wrap gap-2 ${className}`}
    >
      {TABS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `${baseTab} ${isActive ? active : inactive}`
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                className={`w-4 h-4 ${
                  isActive ? '' : 'opacity-80 group-hover:opacity-100'
                }`}
                aria-hidden
              />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
