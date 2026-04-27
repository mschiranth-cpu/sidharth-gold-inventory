/**
 * ============================================
 * AUTH SHELL — shared dark backdrop for login/register/unauthorized pages.
 * ============================================
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import BrandMark from './BrandMark';
import { AuroraDust } from './LandingBackdrops';

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-onyx-900 text-pearl overflow-hidden flex flex-col">
      {/* animated backdrop */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <AuroraDust className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(11,11,12,0.7)_100%)]" />
      </div>

      {/* brand mark top-left */}
      <Link to="/" className="relative z-10 flex items-center gap-3 px-6 py-5 group w-fit">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-onyx-800 via-onyx-900 to-onyx-700 flex items-center justify-center shadow-lg ring-1 ring-champagne-300/30 group-hover:scale-105 transition">
          <BrandMark className="w-7 h-7" />
        </div>
        <span className="font-serif text-xl font-semibold tracking-tight bg-gradient-to-r from-pearl via-champagne-200 to-champagne-400 bg-clip-text text-transparent">
          Ativa Jewels
        </span>
      </Link>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>

      <footer className="relative z-10 text-center text-xs text-pearl/40 pb-6">
        © {new Date().getFullYear()} Ativa Jewels.
      </footer>
    </div>
  );
}
