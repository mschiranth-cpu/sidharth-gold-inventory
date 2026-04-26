/**
 * GoldThread — animated gold filigree threads being drawn across an onyx field.
 * Uses SVG strokeDashoffset animation for a "drawing" feel, like a goldsmith's
 * hand etching the pattern onto the metal.
 */
export default function GoldThread({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      {/* onyx base */}
      <div className="absolute inset-0 bg-gradient-to-b from-onyx-900 via-[#0a0908] to-onyx-900" />

      {/* radial warm glow center, behind threads */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(196,154,79,0.18),transparent_60%)]" />

      {/* drawing threads */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="thread-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#c49a4f" stopOpacity="0" />
            <stop offset="20%" stopColor="#dcaa5a" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#f5e1b5" stopOpacity="1" />
            <stop offset="80%" stopColor="#dcaa5a" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#c49a4f" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g fill="none" stroke="url(#thread-grad)" strokeWidth="1.2" strokeLinecap="round">
          {/* sweeping arabesque arcs */}
          <path
            d="M-50,150 C 200,50  400,250  600,150 S 1000,250 1250,150"
            style={{ strokeDasharray: 1200, strokeDashoffset: 1200, animation: 'thread-draw 14s ease-in-out infinite' }}
          />
          <path
            d="M-50,300 C 250,180  450,420  650,300 S 1050,180 1250,300"
            opacity="0.7"
            style={{ strokeDasharray: 1300, strokeDashoffset: 1300, animation: 'thread-draw 16s ease-in-out 1.5s infinite' }}
          />
          <path
            d="M-50,450 C 200,350  400,550  600,450 S 1000,550 1250,450"
            opacity="0.85"
            style={{ strokeDasharray: 1200, strokeDashoffset: 1200, animation: 'thread-draw 18s ease-in-out 3s infinite' }}
          />

          {/* small filigree loops */}
          <path
            d="M150,120 q40,-60 80,0 t80,0"
            opacity="0.6"
            style={{ strokeDasharray: 250, strokeDashoffset: 250, animation: 'thread-draw 10s ease-in-out 0.5s infinite' }}
          />
          <path
            d="M850,480 q40,-60 80,0 t80,0"
            opacity="0.6"
            style={{ strokeDasharray: 250, strokeDashoffset: 250, animation: 'thread-draw 10s ease-in-out 2.5s infinite' }}
          />
          <path
            d="M500,200 q-50,80 -100,0 t-100,0"
            opacity="0.55"
            style={{ strokeDasharray: 280, strokeDashoffset: 280, animation: 'thread-draw 12s ease-in-out 4s infinite' }}
          />
        </g>

        {/* tiny stud accents at strategic points */}
        <g fill="#f5e1b5">
          <circle cx="200" cy="140" r="1.5" opacity="0.7">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="900" cy="500" r="1.5" opacity="0.7">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="4s" begin="1s" repeatCount="indefinite" />
          </circle>
          <circle cx="600" cy="300" r="2" opacity="0.8">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="3.5s" begin="0.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="350" cy="430" r="1.5" opacity="0.6">
            <animate attributeName="opacity" values="0.2;0.9;0.2" dur="5s" repeatCount="indefinite" />
          </circle>
          <circle cx="1000" cy="180" r="1.5" opacity="0.6">
            <animate attributeName="opacity" values="0.2;0.9;0.2" dur="4.5s" begin="2s" repeatCount="indefinite" />
          </circle>
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
        @keyframes thread-draw {
          0%   { stroke-dashoffset: var(--len, 1200); }
          50%  { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -1200; }
        }
        @media (prefers-reduced-motion: reduce) {
          path[style*="thread-draw"] { animation: none !important; stroke-dashoffset: 0 !important; }
        }
      `}</style>
    </div>
  );
}
