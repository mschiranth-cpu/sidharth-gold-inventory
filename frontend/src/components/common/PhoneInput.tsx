/**
 * PhoneInput — country dial-code dropdown + numeric-only national number.
 * Value is the combined string in the format "+<dial> <national>".
 * Defaults to India (+91). Validates per-country digit length.
 */
import { useEffect, useMemo, useRef, useState } from 'react';

interface Country {
  iso: string;
  name: string;
  dial: string; // "+91"
  flag: string; // emoji
  min: number;  // min national digits
  max: number;  // max national digits
}

// Curated list — common business markets first, then alphabetical. Covers ~70 countries.
export const COUNTRIES: Country[] = [
  { iso: 'IN', name: 'India',                 dial: '+91',  flag: '🇮🇳', min: 10, max: 10 },
  { iso: 'US', name: 'United States',         dial: '+1',   flag: '🇺🇸', min: 10, max: 10 },
  { iso: 'GB', name: 'United Kingdom',        dial: '+44',  flag: '🇬🇧', min: 10, max: 10 },
  { iso: 'AE', name: 'United Arab Emirates',  dial: '+971', flag: '🇦🇪', min: 8,  max: 9  },
  { iso: 'SG', name: 'Singapore',             dial: '+65',  flag: '🇸🇬', min: 8,  max: 8  },
  { iso: 'AU', name: 'Australia',             dial: '+61',  flag: '🇦🇺', min: 9,  max: 9  },
  { iso: 'CA', name: 'Canada',                dial: '+1',   flag: '🇨🇦', min: 10, max: 10 },
  { iso: 'CN', name: 'China',                 dial: '+86',  flag: '🇨🇳', min: 11, max: 11 },
  { iso: 'DE', name: 'Germany',               dial: '+49',  flag: '🇩🇪', min: 10, max: 11 },
  { iso: 'FR', name: 'France',                dial: '+33',  flag: '🇫🇷', min: 9,  max: 9  },
  { iso: 'JP', name: 'Japan',                 dial: '+81',  flag: '🇯🇵', min: 10, max: 11 },
  { iso: 'NL', name: 'Netherlands',           dial: '+31',  flag: '🇳🇱', min: 9,  max: 9  },
  { iso: 'SA', name: 'Saudi Arabia',          dial: '+966', flag: '🇸🇦', min: 9,  max: 9  },
  { iso: 'CH', name: 'Switzerland',           dial: '+41',  flag: '🇨🇭', min: 9,  max: 9  },
  { iso: 'IT', name: 'Italy',                 dial: '+39',  flag: '🇮🇹', min: 9,  max: 11 },
  { iso: 'ES', name: 'Spain',                 dial: '+34',  flag: '🇪🇸', min: 9,  max: 9  },
  { iso: 'HK', name: 'Hong Kong',             dial: '+852', flag: '🇭🇰', min: 8,  max: 8  },
  { iso: 'IL', name: 'Israel',                dial: '+972', flag: '🇮🇱', min: 8,  max: 9  },
  { iso: 'KW', name: 'Kuwait',                dial: '+965', flag: '🇰🇼', min: 8,  max: 8  },
  { iso: 'OM', name: 'Oman',                  dial: '+968', flag: '🇴🇲', min: 8,  max: 8  },
  { iso: 'QA', name: 'Qatar',                 dial: '+974', flag: '🇶🇦', min: 8,  max: 8  },
  { iso: 'BH', name: 'Bahrain',               dial: '+973', flag: '🇧🇭', min: 8,  max: 8  },
  { iso: 'BD', name: 'Bangladesh',            dial: '+880', flag: '🇧🇩', min: 10, max: 10 },
  { iso: 'PK', name: 'Pakistan',              dial: '+92',  flag: '🇵🇰', min: 10, max: 10 },
  { iso: 'LK', name: 'Sri Lanka',             dial: '+94',  flag: '🇱🇰', min: 9,  max: 9  },
  { iso: 'NP', name: 'Nepal',                 dial: '+977', flag: '🇳🇵', min: 10, max: 10 },
  { iso: 'BT', name: 'Bhutan',                dial: '+975', flag: '🇧🇹', min: 7,  max: 8  },
  { iso: 'MV', name: 'Maldives',              dial: '+960', flag: '🇲🇻', min: 7,  max: 7  },
  { iso: 'TH', name: 'Thailand',              dial: '+66',  flag: '🇹🇭', min: 9,  max: 9  },
  { iso: 'MY', name: 'Malaysia',              dial: '+60',  flag: '🇲🇾', min: 9,  max: 10 },
  { iso: 'ID', name: 'Indonesia',             dial: '+62',  flag: '🇮🇩', min: 9,  max: 12 },
  { iso: 'PH', name: 'Philippines',           dial: '+63',  flag: '🇵🇭', min: 10, max: 10 },
  { iso: 'VN', name: 'Vietnam',               dial: '+84',  flag: '🇻🇳', min: 9,  max: 10 },
  { iso: 'KR', name: 'South Korea',           dial: '+82',  flag: '🇰🇷', min: 9,  max: 10 },
  { iso: 'TW', name: 'Taiwan',                dial: '+886', flag: '🇹🇼', min: 9,  max: 9  },
  { iso: 'NZ', name: 'New Zealand',           dial: '+64',  flag: '🇳🇿', min: 8,  max: 10 },
  { iso: 'IE', name: 'Ireland',               dial: '+353', flag: '🇮🇪', min: 9,  max: 9  },
  { iso: 'BE', name: 'Belgium',               dial: '+32',  flag: '🇧🇪', min: 9,  max: 9  },
  { iso: 'AT', name: 'Austria',               dial: '+43',  flag: '🇦🇹', min: 10, max: 11 },
  { iso: 'SE', name: 'Sweden',                dial: '+46',  flag: '🇸🇪', min: 9,  max: 9  },
  { iso: 'NO', name: 'Norway',                dial: '+47',  flag: '🇳🇴', min: 8,  max: 8  },
  { iso: 'DK', name: 'Denmark',               dial: '+45',  flag: '🇩🇰', min: 8,  max: 8  },
  { iso: 'FI', name: 'Finland',               dial: '+358', flag: '🇫🇮', min: 9,  max: 10 },
  { iso: 'PL', name: 'Poland',                dial: '+48',  flag: '🇵🇱', min: 9,  max: 9  },
  { iso: 'PT', name: 'Portugal',              dial: '+351', flag: '🇵🇹', min: 9,  max: 9  },
  { iso: 'GR', name: 'Greece',                dial: '+30',  flag: '🇬🇷', min: 10, max: 10 },
  { iso: 'TR', name: 'Turkey',                dial: '+90',  flag: '🇹🇷', min: 10, max: 10 },
  { iso: 'RU', name: 'Russia',                dial: '+7',   flag: '🇷🇺', min: 10, max: 10 },
  { iso: 'EG', name: 'Egypt',                 dial: '+20',  flag: '🇪🇬', min: 10, max: 10 },
  { iso: 'ZA', name: 'South Africa',          dial: '+27',  flag: '🇿🇦', min: 9,  max: 9  },
  { iso: 'NG', name: 'Nigeria',               dial: '+234', flag: '🇳🇬', min: 10, max: 10 },
  { iso: 'KE', name: 'Kenya',                 dial: '+254', flag: '🇰🇪', min: 9,  max: 10 },
  { iso: 'BR', name: 'Brazil',                dial: '+55',  flag: '🇧🇷', min: 10, max: 11 },
  { iso: 'MX', name: 'Mexico',                dial: '+52',  flag: '🇲🇽', min: 10, max: 10 },
  { iso: 'AR', name: 'Argentina',             dial: '+54',  flag: '🇦🇷', min: 10, max: 11 },
  { iso: 'CL', name: 'Chile',                 dial: '+56',  flag: '🇨🇱', min: 9,  max: 9  },
  { iso: 'CO', name: 'Colombia',              dial: '+57',  flag: '🇨🇴', min: 10, max: 10 },
  { iso: 'PE', name: 'Peru',                  dial: '+51',  flag: '🇵🇪', min: 9,  max: 9  },
  { iso: 'JO', name: 'Jordan',                dial: '+962', flag: '🇯🇴', min: 8,  max: 9  },
  { iso: 'LB', name: 'Lebanon',               dial: '+961', flag: '🇱🇧', min: 7,  max: 8  },
  { iso: 'IQ', name: 'Iraq',                  dial: '+964', flag: '🇮🇶', min: 10, max: 10 },
  { iso: 'IR', name: 'Iran',                  dial: '+98',  flag: '🇮🇷', min: 10, max: 10 },
  { iso: 'AF', name: 'Afghanistan',           dial: '+93',  flag: '🇦🇫', min: 9,  max: 9  },
  { iso: 'MM', name: 'Myanmar',               dial: '+95',  flag: '🇲🇲', min: 8,  max: 10 },
  { iso: 'KH', name: 'Cambodia',              dial: '+855', flag: '🇰🇭', min: 8,  max: 9  },
  { iso: 'LA', name: 'Laos',                  dial: '+856', flag: '🇱🇦', min: 8,  max: 10 },
  { iso: 'MN', name: 'Mongolia',              dial: '+976', flag: '🇲🇳', min: 8,  max: 8  },
  { iso: 'KZ', name: 'Kazakhstan',            dial: '+7',   flag: '🇰🇿', min: 10, max: 10 },
  { iso: 'UZ', name: 'Uzbekistan',            dial: '+998', flag: '🇺🇿', min: 9,  max: 9  },
  { iso: 'UA', name: 'Ukraine',               dial: '+380', flag: '🇺🇦', min: 9,  max: 9  },
];

const DEFAULT_ISO = 'IN';

export interface ParsedPhone {
  iso: string;
  dial: string;
  national: string;
  combined: string; // "+91 9876543210" or ""
}

/** Parse a stored phone string into iso + national. Tolerant of any formatting. */
export function parsePhone(stored: string | null | undefined): ParsedPhone {
  const raw = (stored || '').trim();
  if (!raw) {
    const c = COUNTRIES.find((x) => x.iso === DEFAULT_ISO)!;
    return { iso: c.iso, dial: c.dial, national: '', combined: '' };
  }
  // Strip everything except + and digits
  const compact = raw.replace(/[^\d+]/g, '');
  if (compact.startsWith('+')) {
    // Try longest dial code match
    const sortedByDialLen = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
    for (const c of sortedByDialLen) {
      const dialDigits = c.dial.slice(1);
      if (compact.slice(1).startsWith(dialDigits)) {
        const national = compact.slice(1 + dialDigits.length);
        return { iso: c.iso, dial: c.dial, national, combined: `${c.dial} ${national}`.trim() };
      }
    }
  }
  // Fallback: assume default country
  const c = COUNTRIES.find((x) => x.iso === DEFAULT_ISO)!;
  const national = compact.replace(/^\+/, '');
  return { iso: c.iso, dial: c.dial, national, combined: `${c.dial} ${national}`.trim() };
}

/** Validate a phone string. Returns error message or null. Empty = required error. */
export function validatePhone(stored: string | null | undefined): string | null {
  const p = parsePhone(stored);
  if (!p.national) return 'Phone number is required';
  if (!/^\d+$/.test(p.national)) return 'Phone number must contain only digits';
  const c = COUNTRIES.find((x) => x.iso === p.iso);
  if (!c) return 'Select a valid country';
  if (p.national.length < c.min) {
    return c.min === c.max
      ? `Phone number must be ${c.min} digits for ${c.name}`
      : `Phone number must be at least ${c.min} digits for ${c.name}`;
  }
  if (p.national.length > c.max) {
    return c.min === c.max
      ? `Phone number must be ${c.max} digits for ${c.name}`
      : `Phone number must be at most ${c.max} digits for ${c.name}`;
  }
  return null;
}

interface Props {
  value: string; // combined "+91 9876543210"
  onChange: (combined: string) => void;
  onBlur?: () => void;
  hasError?: boolean;
  placeholder?: string;
  id?: string;
  /** data-field attribute, used by the form for "scroll to first error". */
  dataField?: string;
}

export default function PhoneInput({ value, onChange, onBlur, hasError, placeholder, id, dataField }: Props) {
  const parsed = useMemo(() => parsePhone(value), [value]);
  const [iso, setIso] = useState<string>(parsed.iso);
  const [national, setNational] = useState<string>(parsed.national);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Re-sync when external value changes (e.g. form reset).
  useEffect(() => {
    if (parsed.iso !== iso) setIso(parsed.iso);
    if (parsed.national !== national) setNational(parsed.national);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', handler);
    // Auto-focus search
    setTimeout(() => searchRef.current?.focus(), 50);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  const country = COUNTRIES.find((c) => c.iso === iso) || COUNTRIES[0]!;

  const emit = (newIso: string, newNational: string) => {
    const c = COUNTRIES.find((x) => x.iso === newIso) || COUNTRIES[0]!;
    onChange(newNational ? `${c.dial} ${newNational}` : '');
  };

  const onNationalChange = (raw: string) => {
    // Strip everything except digits.
    const digits = raw.replace(/\D/g, '');
    const c = COUNTRIES.find((x) => x.iso === iso) || COUNTRIES[0]!;
    const trimmed = digits.slice(0, c.max);
    setNational(trimmed);
    emit(iso, trimmed);
  };

  const pickCountry = (newIso: string) => {
    setIso(newIso);
    setOpen(false);
    setSearch('');
    // Re-clamp national to new max
    const c = COUNTRIES.find((x) => x.iso === newIso) || COUNTRIES[0]!;
    const clamped = national.slice(0, c.max);
    if (clamped !== national) setNational(clamped);
    emit(newIso, clamped);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.iso.toLowerCase().includes(q),
    );
  }, [search]);

  const borderClass = hasError
    ? 'border-red-400 focus-within:ring-red-500'
    : 'border-gray-300 focus-within:ring-champagne-600';

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={`flex items-stretch rounded-lg border bg-white focus-within:ring-2 focus-within:border-transparent text-sm overflow-visible ${borderClass}`}
      >
        {/* Country selector trigger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          onBlur={onBlur}
          className="flex items-center gap-1.5 pl-3 pr-2 border-r border-gray-200 hover:bg-champagne-50/40 transition rounded-l-lg"
          aria-haspopup="listbox"
          aria-expanded={open}
          title={`${country.name} (${country.dial})`}
        >
          <span className="text-base leading-none">{country.flag}</span>
          <span className="font-medium text-onyx-800 tabular-nums">{country.dial}</span>
          <svg className="w-3 h-3 text-onyx-500" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 8.5L2 4.5h8z" />
          </svg>
        </button>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          data-field={dataField}
          value={national}
          onChange={(e) => onNationalChange(e.target.value)}
          onPaste={(e) => {
            // Allow paste but strip non-digits
            e.preventDefault();
            const text = e.clipboardData.getData('text');
            // If pasted with country code, swap country
            if (text.trim().startsWith('+')) {
              const p = parsePhone(text);
              setIso(p.iso);
              setNational(p.national.slice(0, COUNTRIES.find((c) => c.iso === p.iso)?.max ?? 15));
              emit(p.iso, p.national.slice(0, COUNTRIES.find((c) => c.iso === p.iso)?.max ?? 15));
            } else {
              onNationalChange(text);
            }
          }}
          onKeyDown={(e) => {
            // Block letter keys (allow control keys, navigation, digits)
            if (
              e.key.length === 1 &&
              !/[0-9]/.test(e.key) &&
              !e.ctrlKey &&
              !e.metaKey
            ) {
              e.preventDefault();
            }
          }}
          onBlur={onBlur}
          placeholder={placeholder ?? '9876543210'}
          className="flex-1 px-3 py-2.5 outline-none bg-transparent rounded-r-lg tabular-nums"
        />
      </div>

      {open && (
        <div
          className="absolute z-50 mt-1 left-0 w-72 max-w-[calc(100vw-2rem)] bg-white border border-champagne-200 rounded-xl shadow-xl overflow-hidden"
          role="listbox"
        >
          <div className="px-3 py-2 border-b border-champagne-100 bg-pearl/50">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country or code"
              className="w-full px-2 py-1.5 text-xs rounded-md border border-champagne-200 focus:ring-2 focus:ring-champagne-600 focus:border-transparent outline-none"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1 text-sm">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-onyx-500">No countries match “{search}”.</li>
            )}
            {filtered.map((c) => (
              <li key={c.iso}>
                <button
                  type="button"
                  onClick={() => pickCountry(c.iso)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-champagne-50 text-left ${
                    c.iso === iso ? 'bg-champagne-50/70' : ''
                  }`}
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className="flex-1 truncate text-onyx-900">{c.name}</span>
                  <span className="text-onyx-500 tabular-nums text-xs">{c.dial}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
