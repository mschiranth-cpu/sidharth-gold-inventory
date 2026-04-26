/**
 * MoltenWaves — slow flowing molten-gold waves at the bottom of the section,
 * fading up into onyx. Evokes a goldsmith's pour.
 */
export default function MoltenWaves({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      {/* deep onyx base */}
      <div className="absolute inset-0 bg-gradient-to-b from-onyx-900 via-[#0c0a08] to-[#0a0907]" />

      {/* warm bottom glow */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            'radial-gradient(ellipse at 50% 100%, rgba(196,154,79,0.30), transparent 65%)',
        }}
      />

      {/* flowing waves */}
      <svg
        className="absolute inset-x-0 bottom-0 w-full h-1/2"
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="molten-grad-a" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#c49a4f" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#c49a4f" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="molten-grad-b" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#dcaa5a" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#dcaa5a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="molten-grad-c" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#f5e1b5" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f5e1b5" stopOpacity="0" />
          </linearGradient>
          <filter id="molten-blur">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        <g filter="url(#molten-blur)">
          <path
            fill="url(#molten-grad-a)"
            style={{ animation: 'molten-flow-a 14s ease-in-out infinite alternate' }}
            d="M0,260 C200,200 400,300 600,240 C800,180 1000,280 1200,220 L1200,400 L0,400 Z"
          />
          <path
            fill="url(#molten-grad-b)"
            style={{ animation: 'molten-flow-b 18s ease-in-out infinite alternate' }}
            d="M0,300 C200,250 400,340 600,290 C800,240 1000,330 1200,280 L1200,400 L0,400 Z"
          />
          <path
            fill="url(#molten-grad-c)"
            style={{ animation: 'molten-flow-c 22s ease-in-out infinite alternate' }}
            d="M0,340 C200,310 400,360 600,330 C800,300 1000,350 1200,320 L1200,400 L0,400 Z"
          />
        </g>
      </svg>

      {/* film grain */}
      <div
        className="absolute inset-0 opacity-[0.10] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\'/></svg>")',
        }}
      />

      <style>{`
        @keyframes molten-flow-a {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-4%); }
        }
        @keyframes molten-flow-b {
          0%   { transform: translateX(0); }
          100% { transform: translateX(5%); }
        }
        @keyframes molten-flow-c {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-3%); }
        }
        @media (prefers-reduced-motion: reduce) {
          path[style*="molten-flow"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
