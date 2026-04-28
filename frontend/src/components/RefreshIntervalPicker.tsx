/**
 * ============================================
 * REFRESH INTERVAL PICKER
 * ============================================
 *
 * Compact dropdown that lets the user choose the auto-refresh cadence.
 * The selection is site-wide (persisted via RefreshIntervalContext).
 *
 *   <RefreshIntervalPicker />              // standalone, light theme
 *   <RefreshIntervalPicker variant="dark"/> // for dark hero bars
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ClockIcon, CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import {
  REFRESH_OPTIONS,
  useRefreshIntervalControls,
} from '../contexts/RefreshIntervalContext';

interface Props {
  variant?: 'light' | 'dark';
  align?: 'left' | 'right';
}

export default function RefreshIntervalPicker({
  variant = 'light',
  align = 'right',
}: Props) {
  const { option, setIntervalMs } = useRefreshIntervalControls();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const PANEL_WIDTH = 224; // matches w-56

  // Recompute panel position when opening, on scroll, and on resize.
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const place = () => {
      const r = btnRef.current!.getBoundingClientRect();
      const top = r.bottom + 6; // 6px gap, matches mt-1.5
      let left = align === 'right' ? r.right - PANEL_WIDTH : r.left;
      // Keep within viewport horizontally with an 8px safe margin.
      left = Math.max(8, Math.min(left, window.innerWidth - PANEL_WIDTH - 8));
      setPos({ top, left });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isDark = variant === 'dark';

  return (
    <div ref={ref} className="relative inline-block">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={`Auto-refresh: ${option.label}`}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-champagne-400 ${
          isDark
            ? 'bg-onyx-800/70 border border-onyx-600 text-champagne-200 hover:text-pearl'
            : 'bg-white border border-gray-200 text-onyx-700 hover:bg-champagne-50'
        }`}
      >
        <ClockIcon className="w-3.5 h-3.5" />
        <span>Refresh · {option.short}</span>
        <ChevronDownIcon
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && pos && createPortal(
        <div
          ref={panelRef}
          role="listbox"
          aria-label="Auto-refresh interval"
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: PANEL_WIDTH }}
          className="z-[1000] rounded-xl border bg-white shadow-2xl overflow-hidden border-gray-200"
        >
          <div className="px-3 py-2 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-onyx-400">
            Auto-refresh interval
          </div>
          <ul className="py-1 text-sm">
            {REFRESH_OPTIONS.map((opt) => {
              const active = opt.ms === option.ms;
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      setIntervalMs(opt.ms);
                      setOpen(false);
                    }}
                    className={`w-full px-3 py-2 flex items-center justify-between text-left transition ${
                      active
                        ? 'bg-champagne-50 text-champagne-800 font-semibold'
                        : 'text-onyx-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {active && <CheckIcon className="w-4 h-4 text-champagne-700" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="px-3 py-2 border-t border-gray-100 text-[10px] text-onyx-400 leading-snug">
            Applies site-wide. Live rates currently scrape Ambicaa Spot
            (Bangalore) every 1 second on the server.
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
