/**
 * SpotlightGrain — slow-rotating gold conic spotlight + film grain.
 * For dark sections (CTA). Cinematic close-out.
 */
export default function SpotlightGrain({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      {/* rotating conic spotlight */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'conic-gradient(from 0deg at 50% 50%, rgba(245,225,181,0) 0deg, rgba(245,225,181,0.55) 30deg, rgba(220,170,90,0.35) 60deg, rgba(245,225,181,0) 100deg, rgba(245,225,181,0) 200deg, rgba(220,170,90,0.45) 240deg, rgba(245,225,181,0.25) 280deg, rgba(245,225,181,0) 340deg)',
          animation: 'spotlight-rotate 35s linear infinite',
          filter: 'blur(40px)',
        }}
      />

      {/* breathing center glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgba(245,225,181,0.40), transparent 55%)',
          animation: 'spotlight-breathe 8s ease-in-out infinite',
        }}
      />

      {/* corner ember */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 85% 80%, rgba(220,170,90,0.30), transparent 45%)',
        }}
      />

      {/* film grain */}
      <div
        className="absolute inset-0 opacity-[0.14] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'2\' stitchTiles=\'stitch\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\'/></svg>")',
        }}
      />

      <style>{`
        @keyframes spotlight-rotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes spotlight-breathe {
          0%,100% { opacity: 0.7; }
          50%     { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="spotlight-rotate"], [style*="spotlight-breathe"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
