/**
 * BrandMark — Luxe Ativa Gold Factory monogram.
 *
 * A self-contained SVG icon: champagne-gradient ring with a serif "G"
 * over a stylised gold ingot, on the onyx tile background of the parent.
 * Designed to look at home in either an onyx or champagne container.
 */
import React from 'react';

interface Props {
  className?: string;
  /** Defaults to currentColor so it inherits text-* utilities. */
  monoColor?: string;
}

let UID = 0;

const BrandMark: React.FC<Props> = ({ className, monoColor }) => {
  // Unique ids so multiple instances don't collide.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const id = React.useMemo(() => ++UID, []);
  const ringId = `bm-ring-${id}`;
  const ingotId = `bm-ingot-${id}`;
  const sheenId = `bm-sheen-${id}`;
  const innerId = `bm-inner-${id}`;

  return (
    <svg
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <defs>
        {/* Champagne ring gradient */}
        <linearGradient id={ringId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F5E1B5" />
          <stop offset="50%" stopColor="#E8C684" />
          <stop offset="100%" stopColor="#A47729" />
        </linearGradient>
        {/* Inner soft champagne fill */}
        <radialGradient id={innerId} cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FBF1DA" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FBF1DA" stopOpacity="0" />
        </radialGradient>
        {/* Gold ingot face gradient */}
        <linearGradient id={ingotId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F4D88A" />
          <stop offset="55%" stopColor="#D4A33D" />
          <stop offset="100%" stopColor="#9B6E1E" />
        </linearGradient>
        {/* Specular sheen overlay */}
        <linearGradient id={sheenId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Outer champagne ring */}
      <circle cx="24" cy="24" r="20" fill={`url(#${ringId})`} />
      {/* Inner onyx core */}
      <circle cx="24" cy="24" r="17" fill="#1B1A18" />
      {/* Soft inner highlight */}
      <circle cx="24" cy="24" r="17" fill={`url(#${innerId})`} />

      {/* Stylised gold ingot at the bottom */}
      <g transform="translate(24 31.5)">
        <polygon
          points="-9,2.5 -6,-2.5 6,-2.5 9,2.5"
          fill={`url(#${ingotId})`}
          stroke="#5C3F11"
          strokeWidth="0.4"
          strokeLinejoin="round"
        />
        {/* sheen line */}
        <rect x="-7" y="-1.5" width="14" height="0.9" fill={`url(#${sheenId})`} />
      </g>

      {/* Serif G monogram, slightly above center */}
      <text
        x="24"
        y="22"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="'Cormorant Garamond', 'Playfair Display', Georgia, serif"
        fontWeight={600}
        fontSize="22"
        fill={monoColor || '#F5E1B5'}
        letterSpacing="-0.5"
      >
        G
      </text>
    </svg>
  );
};

export default BrandMark;
