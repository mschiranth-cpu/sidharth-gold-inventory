/**
 * VelvetGlow — onyx velvet with slow diagonal gold light beams sweeping across.
 * Feels like museum lighting falling on a display case.
 */
export default function VelvetGlow({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      {/* deep onyx base with slight vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-onyx-900 via-[#0c0a08] to-onyx-900" />

      {/* faint vertical "velvet" texture */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(245,225,181,0.04) 0px, rgba(245,225,181,0.04) 1px, transparent 1px, transparent 4px)',
        }}
      />

      {/* gold light beam 1 — slow diagonal sweep */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -inset-[30%]"
          style={{
            background:
              'linear-gradient(110deg, transparent 38%, rgba(245,225,181,0.08) 47%, rgba(252,240,210,0.18) 50%, rgba(245,225,181,0.08) 53%, transparent 62%)',
            animation: 'velvet-beam-a 22s ease-in-out infinite',
            filter: 'blur(40px)',
          }}
        />
      </div>

      {/* gold light beam 2 — counter-angle, slower */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -inset-[30%]"
          style={{
            background:
              'linear-gradient(250deg, transparent 40%, rgba(220,170,90,0.08) 49%, rgba(245,225,181,0.14) 51%, rgba(220,170,90,0.08) 53%, transparent 60%)',
            animation: 'velvet-beam-b 32s ease-in-out infinite',
            filter: 'blur(50px)',
          }}
        />
      </div>

      {/* warm corner pools */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(196,154,79,0.20),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(220,170,90,0.15),transparent_55%)]" />

      {/* film grain */}
      <div
        className="absolute inset-0 opacity-[0.10] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\'/></svg>")',
        }}
      />

      <style>{`
        @keyframes velvet-beam-a {
          0%   { transform: translate(-25%, -10%); }
          50%  { transform: translate(25%,  10%); }
          100% { transform: translate(-25%, -10%); }
        }
        @keyframes velvet-beam-b {
          0%   { transform: translate(20%,  10%); }
          50%  { transform: translate(-20%, -10%); }
          100% { transform: translate(20%,  10%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="velvet-beam"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
