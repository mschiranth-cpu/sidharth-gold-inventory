/**
 * EmberDrift — quiet onyx footer backdrop with a single slow ember glow drifting
 * left to right. Subtle close-out for the page.
 */
export default function EmberDrift({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0907] via-onyx-900 to-[#080706]" />

      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[50vh] w-[50vh] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(196,154,79,0.28), rgba(196,154,79,0) 65%)',
            animation: 'ember-drift 30s linear infinite',
            filter: 'blur(40px)',
          }}
        />
      </div>

      {/* champagne hairline at top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-champagne-500/40 to-transparent" />

      <style>{`
        @keyframes ember-drift {
          0%   { left: -30%; }
          100% { left: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="ember-drift"] { animation: none !important; left: 50% !important; }
        }
      `}</style>
    </div>
  );
}
