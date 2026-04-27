/**
 * ============================================
 * LIVE METAL RATES CARD
 * ============================================
 * Fetches live spot prices for precious metals and converts USD/troy-oz → INR/gram.
 * Free, no-key APIs:
 *  - https://api.gold-api.com/price/XAU  (Gold, USD per troy oz)
 *  - https://api.gold-api.com/price/XAG  (Silver)
 *  - https://api.gold-api.com/price/XPT  (Platinum)
 *  - https://api.gold-api.com/price/XPD  (Palladium)
 *  - https://open.er-api.com/v6/latest/USD  (USD → INR FX)
 */

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRefreshInterval } from '../contexts/RefreshIntervalContext';

const GRAMS_PER_TROY_OZ = 31.1034768;

type MetalKey = 'GOLD' | 'SILVER' | 'PLATINUM' | 'PALLADIUM';
type ApiResponse = { price: number; prev_close_price?: number; updatedAt?: string };

const SYMBOLS: Record<MetalKey, { code: string; label: string; emoji: string; gradient: string }> =
  {
    GOLD: {
      code: 'XAU',
      label: 'Gold',
      emoji: '🥇',
      gradient: 'from-amber-400 to-amber-600',
    },
    SILVER: {
      code: 'XAG',
      label: 'Silver',
      emoji: '🥈',
      gradient: 'from-slate-300 to-slate-500',
    },
    PLATINUM: {
      code: 'XPT',
      label: 'Platinum',
      emoji: '💠',
      gradient: 'from-cyan-400 to-sky-600',
    },
    PALLADIUM: {
      code: 'XPD',
      label: 'Palladium',
      emoji: '⚪',
      gradient: 'from-violet-500 to-violet-700',
    },
  };

async function fetchMetalPrice(code: string): Promise<ApiResponse> {
  const res = await fetch(`https://api.gold-api.com/price/${code}`);
  if (!res.ok) throw new Error(`Failed to fetch ${code}`);
  return res.json();
}

async function fetchUsdInr(): Promise<number> {
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!res.ok) throw new Error('Failed to fetch FX');
  const data = await res.json();
  return data?.rates?.INR ?? 83;
}

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface AmbicaaResponse {
  success: boolean;
  healthy: boolean;
  ageMs: number;
  data: {
    source: string;
    city: string;
    fetchedAt: string;
    perGram: {
      gold24k: number | null;
      gold22k: number | null;
      gold18k: number | null;
      silver: number | null;
    };
  };
}

async function fetchAmbicaaRates(): Promise<AmbicaaResponse> {
  const res = await fetch(`${BACKEND_URL}/market-rates/live?city=bangalore`);
  if (!res.ok) throw new Error('Bangalore rates unavailable');
  return res.json();
}

type Source = 'global' | 'bangalore';

interface Props {
  selectedMetal?: MetalKey;
  selectedPurity?: number; // karats (24, 22, 18, 14). Ignored for non-gold.
  onUseRate?: (ratePerGramInr: number) => void;
}

export default function LiveMetalRatesCard({ selectedMetal = 'GOLD', selectedPurity = 24, onUseRate }: Props) {
  const [now, setNow] = useState(Date.now());
  const [source, setSource] = useState<Source>('bangalore');

  // Site-wide refresh cadence (set via header picker).
  const userInterval = useRefreshInterval();
  const pollMs: number | false = userInterval === false ? false : Math.max(500, userInterval);

  // Refresh "last updated" label — same cadence as polling, capped to 1s for the UI.
  useEffect(() => {
    const labelMs = pollMs === false ? 30_000 : Math.max(1_000, Math.min(pollMs, 30_000));
    const id = setInterval(() => setNow(Date.now()), labelMs);
    return () => clearInterval(id);
  }, [pollMs]);

  // Fetch FX rate (cached 5 min)
  const fx = useQuery({
    queryKey: ['fx-usd-inr'],
    queryFn: fetchUsdInr,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  // Fetch all four metal prices in parallel from the global spot API.
  // The free api.gold-api.com endpoint updates ~every minute, so we floor the
  // poll interval at 60s for the global tab regardless of the user's preference.
  const globalMs: number | false = pollMs === false ? false : Math.max(60_000, pollMs);
  const metals = useQuery({
    queryKey: ['live-metal-prices'],
    queryFn: async () => {
      const entries = await Promise.all(
        (Object.keys(SYMBOLS) as MetalKey[]).map(async (k) => {
          try {
            const data = await fetchMetalPrice(SYMBOLS[k].code);
            return [k, data] as const;
          } catch {
            return [k, null] as const;
          }
        })
      );
      return Object.fromEntries(entries) as Record<MetalKey, ApiResponse | null>;
    },
    staleTime: 60_000,
    refetchInterval: globalMs,
    refetchIntervalInBackground: false,
  });

  // Fetch Bangalore (Ambicaa) rates from our backend.
  // Backend cache is refreshed by the Playwright scraper every 1s, so honour
  // the user's chosen cadence right down to per-second polling.
  const bangalore = useQuery({
    queryKey: ['bangalore-rates'],
    queryFn: fetchAmbicaaRates,
    staleTime: pollMs === false ? 30_000 : Math.max(500, Math.min(pollMs, 30_000)),
    refetchInterval: pollMs,
    refetchIntervalInBackground: false,
    enabled: source === 'bangalore',
    retry: 1,
  });

  const usdInr = fx.data ?? 83;
  const isLoading =
    source === 'global' ? metals.isLoading || fx.isLoading : bangalore.isLoading;
  // Show error banner ONLY when we have no usable data at all.
  // Bangalore mode: backend returns global-spot fallback when Ambicaa is down — that still counts as data.
  const hasBangaloreData = !!bangalore.data?.data?.perGram?.gold24k;
  const hasGlobalData = !!metals.data;
  const isError =
    source === 'global'
      ? metals.isError && !hasGlobalData
      : bangalore.isError && !hasBangaloreData && !hasGlobalData;
  const usingFallback = source === 'bangalore' && bangalore.data?.data?.source === 'global-spot';

  // Compute INR/gram for each metal and apply purity factor for gold
  const cards = useMemo(() => {
    if (!metals.data) return null;
    return (Object.keys(SYMBOLS) as MetalKey[]).map((k) => {
      const meta = SYMBOLS[k];
      const data = metals.data?.[k];
      if (!data) return { key: k, meta, perGramInr: null, change: null };
      const perGramUsd = data.price / GRAMS_PER_TROY_OZ;
      const perGramInr = perGramUsd * usdInr;
      const change =
        data.prev_close_price && data.prev_close_price > 0
          ? ((data.price - data.prev_close_price) / data.prev_close_price) * 100
          : null;
      return { key: k, meta, perGramInr, change };
    });
  }, [metals.data, usdInr]);

  // Compute the "Use rate" value for the currently selected metal+purity
  const selectedRate = useMemo(() => {
    // Bangalore source: use Ambicaa per-gram rates directly for gold/silver,
    // fall back to global spot for platinum/palladium (Ambicaa doesn't publish them).
    if (source === 'bangalore' && bangalore.data?.data?.perGram) {
      const pg = bangalore.data.data.perGram;
      if (selectedMetal === 'SILVER') return pg.silver;
      if (selectedMetal === 'GOLD') {
        if (selectedPurity === 24) return pg.gold24k;
        if (selectedPurity === 22) return pg.gold22k;
        if (selectedPurity === 18) return pg.gold18k;
        return pg.gold24k ? (pg.gold24k * selectedPurity) / 24 : null;
      }
      // PT/PD → fall through to the global-spot calculation below
    }
    const card = cards?.find((c) => c.key === selectedMetal);
    if (!card?.perGramInr) return null;
    if (selectedMetal === 'GOLD') {
      // Apply karat purity (e.g. 22K = perGram * 22/24)
      return (card.perGramInr * selectedPurity) / 24;
    }
    return card.perGramInr;
  }, [cards, selectedMetal, selectedPurity, source, bangalore.data]);

  const lastUpdated =
    source === 'global'
      ? metals.dataUpdatedAt
        ? Math.max(0, Math.round((now - metals.dataUpdatedAt) / 1000))
        : null
      : bangalore.dataUpdatedAt
        ? Math.max(0, Math.round((now - bangalore.dataUpdatedAt) / 1000))
        : null;

  return (
    <div className="mb-6 bg-white rounded-2xl shadow-lg border border-champagne-100 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-champagne-700 to-onyx-800 text-white flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
            </span>
            Live Market Rates
          </h3>
          <p className="text-xs text-pearl mt-0.5">
            {source === 'bangalore' ? (
              usingFallback ? (
                <>Bangalore unavailable — showing global spot · USD→INR @ ₹{usdInr.toFixed(2)}</>
              ) : (
                <>Bangalore retail • Ambicaa Sales Corp</>
              )
            ) : (
              <>Global spot • USD→INR @ ₹{usdInr.toFixed(2)}</>
            )}
            {lastUpdated !== null && ` • updated ${lastUpdated}s ago`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-white/10 rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => setSource('bangalore')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                source === 'bangalore'
                  ? 'bg-white text-champagne-800 shadow'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              🇮🇳 Bangalore
            </button>
            <button
              onClick={() => setSource('global')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                source === 'global'
                  ? 'bg-white text-champagne-800 shadow'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              🌐 Global
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {isError && (
          <div className="text-sm text-accent-ruby bg-red-50 border border-accent-ruby/30 rounded-lg px-3 py-2 mb-3">
            Could not fetch live rates. Check your internet connection.
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(() => {
            // Build a static list of tiles: Gold 24K, Gold 22K, Silver, Platinum, Palladium
            type Tile = {
              id: string;
              metalKey: MetalKey;
              karat?: number;
              perGramInr: number | null;
              change: number | null;
              tileSource: 'ambicaa' | 'global';
            };
            const tiles: Tile[] = [
              { id: 'GOLD-24', metalKey: 'GOLD', karat: 24, perGramInr: null, change: null, tileSource: 'global' },
              { id: 'GOLD-22', metalKey: 'GOLD', karat: 22, perGramInr: null, change: null, tileSource: 'global' },
              { id: 'SILVER', metalKey: 'SILVER', perGramInr: null, change: null, tileSource: 'global' },
              { id: 'PLATINUM', metalKey: 'PLATINUM', perGramInr: null, change: null, tileSource: 'global' },
              { id: 'PALLADIUM', metalKey: 'PALLADIUM', perGramInr: null, change: null, tileSource: 'global' },
            ];
            if (cards) {
              for (const tile of tiles) {
                const c = cards.find((x) => x.key === tile.metalKey);
                if (!c?.perGramInr) continue;
                tile.change = c.change;
                tile.perGramInr =
                  tile.metalKey === 'GOLD' && tile.karat
                    ? (c.perGramInr * tile.karat) / 24
                    : c.perGramInr;
              }
            }
            // Override gold/silver tiles with Bangalore data; keep PT/PD from global spot
            if (source === 'bangalore' && bangalore.data?.data?.perGram) {
              const pg = bangalore.data.data.perGram;
              const tileLabel = bangalore.data.data.source === 'global-spot' ? 'global' : 'ambicaa';
              for (const tile of tiles) {
                if (tile.id === 'GOLD-24') {
                  tile.perGramInr = pg.gold24k;
                  tile.change = null;
                  tile.tileSource = tileLabel;
                } else if (tile.id === 'GOLD-22') {
                  tile.perGramInr = pg.gold22k;
                  tile.change = null;
                  tile.tileSource = tileLabel;
                } else if (tile.id === 'SILVER') {
                  tile.perGramInr = pg.silver;
                  tile.change = null;
                  tile.tileSource = tileLabel;
                }
                // Platinum & Palladium fall through to the global spot values set above
              }
            }
            return tiles.map((t) => {
              const meta = SYMBOLS[t.metalKey];
              const isSelected =
                t.metalKey === selectedMetal &&
                (t.metalKey !== 'GOLD' || t.karat === selectedPurity);
              return (
                <div
                  key={t.id}
                  className={`relative rounded-xl p-3 border transition-all ${
                    isSelected
                      ? 'border-champagne-400 bg-champagne-50/50 ring-1 ring-champagne-300'
                      : 'border-champagne-200 bg-pearl/50'
                  }`}
                >
                  <div
                    className={`absolute -top-2 left-2 text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                      t.tileSource === 'ambicaa'
                        ? 'bg-accent-emerald text-white'
                        : 'bg-slate-500 text-white'
                    }`}
                  >
                    {t.tileSource === 'ambicaa' ? '🇮🇳 Ambika' : '🌐 Global'}
                  </div>
                  <div className="flex items-center justify-between mb-2 mt-1">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold text-white px-2 py-0.5 rounded-md bg-gradient-to-r ${meta.gradient}`}
                    >
                      <span>{meta.emoji}</span>
                      {meta.label}
                      {t.karat && <span className="ml-0.5 opacity-90">{t.karat}K</span>}
                    </span>
                    {t.change !== null && (
                      <span
                        className={`text-xs font-medium ${
                          t.change >= 0 ? 'text-accent-emerald' : 'text-accent-ruby'
                        }`}
                      >
                        {t.change >= 0 ? '▲' : '▼'} {Math.abs(t.change).toFixed(2)}%
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-bold text-onyx-900">
                    {isLoading || t.perGramInr === null
                      ? '—'
                      : `₹${t.perGramInr.toLocaleString('en-IN', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}`}
                    <span className="text-xs font-medium text-onyx-400 ml-1">/g</span>
                  </div>
                  {isSelected && selectedRate !== null && onUseRate && (
                    <button
                      onClick={() => onUseRate(Math.round(selectedRate))}
                      className="mt-2 w-full text-xs font-semibold px-2 py-1.5 rounded-lg bg-champagne-700 text-white hover:bg-champagne-800 transition-colors"
                    >
                      Use this rate
                    </button>
                  )}
                </div>
              );
            });
          })()}
        </div>

        <p className="mt-3 text-[11px] text-onyx-300 text-center">
          Indicative only — confirm with dealer before settlement
        </p>
      </div>
    </div>
  );
}
