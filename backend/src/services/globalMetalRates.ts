/**
 * Global metal rates fallback.
 *
 * When the Bangalore (Ambicaa) scraper is unavailable — e.g. Playwright
 * is missing on a new server, or ambicaaspot.com is unreachable — we
 * still want the dashboard and Receive-Metal page to display *something*.
 *
 * This service mirrors the public APIs that the frontend's
 * `LiveMetalRatesCard` falls back to in "Global" mode:
 *   - https://api.gold-api.com/price/XAU | XAG | XPT | XPD
 *   - https://open.er-api.com/v6/latest/USD  (USD → INR FX)
 *
 * Result is cached in-memory for 60s (single-flight) so we don't hammer
 * the upstream APIs from multiple aggregator calls.
 */

import { logger } from '../utils/logger';

const GRAMS_PER_TROY_OZ = 31.1034768;
const TTL_MS = 60_000;
const FX_TTL_MS = 5 * 60_000;
const REQUEST_TIMEOUT_MS = 4_000;

export interface GlobalRatesPayload {
  /** Per gram, INR. 24K. Apply karat factor for 22K/18K. */
  gold24k: number | null;
  gold22k: number | null;
  gold18k: number | null;
  silver: number | null;
  platinum: number | null;
  palladium: number | null;
  fetchedAt: string | null;
  /** True if at least gold24k resolved. */
  healthy: boolean;
  ageMs: number;
}

interface CacheEntry<T> {
  value: T;
  at: number;
}

const cache: { rates?: CacheEntry<GlobalRatesPayload>; fx?: CacheEntry<number> } = {};
let inflight: Promise<GlobalRatesPayload> | null = null;

async function timeoutFetch<T = unknown>(url: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

async function fetchUsdInr(): Promise<number> {
  if (cache.fx && Date.now() - cache.fx.at < FX_TTL_MS) {
    return cache.fx.value;
  }
  try {
    const data = await timeoutFetch<{ rates?: { INR?: number } }>(
      'https://open.er-api.com/v6/latest/USD'
    );
    const inr = data?.rates?.INR ?? 83;
    cache.fx = { value: inr, at: Date.now() };
    return inr;
  } catch (err) {
    logger.warn('Global FX fetch failed; using last known or default 83', { err: String(err) });
    return cache.fx?.value ?? 83;
  }
}

async function fetchSpotUsdPerOz(code: 'XAU' | 'XAG' | 'XPT' | 'XPD'): Promise<number | null> {
  try {
    const data = await timeoutFetch<{ price?: number }>(
      `https://api.gold-api.com/price/${code}`
    );
    return typeof data?.price === 'number' ? data.price : null;
  } catch (err) {
    logger.warn(`Global spot fetch failed for ${code}`, { err: String(err) });
    return null;
  }
}

async function buildPayload(): Promise<GlobalRatesPayload> {
  const [usdInr, xau, xag, xpt, xpd] = await Promise.all([
    fetchUsdInr(),
    fetchSpotUsdPerOz('XAU'),
    fetchSpotUsdPerOz('XAG'),
    fetchSpotUsdPerOz('XPT'),
    fetchSpotUsdPerOz('XPD'),
  ]);

  const toInrPerGram = (usdPerOz: number | null) =>
    usdPerOz == null ? null : Math.round((usdPerOz / GRAMS_PER_TROY_OZ) * usdInr * 100) / 100;

  const gold24k = toInrPerGram(xau);
  const gold22k = gold24k != null ? Math.round(((gold24k * 22) / 24) * 100) / 100 : null;
  const gold18k = gold24k != null ? Math.round(((gold24k * 18) / 24) * 100) / 100 : null;

  return {
    gold24k,
    gold22k,
    gold18k,
    silver: toInrPerGram(xag),
    platinum: toInrPerGram(xpt),
    palladium: toInrPerGram(xpd),
    fetchedAt: new Date().toISOString(),
    healthy: gold24k != null,
    ageMs: 0,
  };
}

/**
 * Returns global metal rates (per gram, INR), cached 60s.
 * Single-flight: concurrent calls dedupe to one upstream batch.
 */
export async function getGlobalMetalRates(): Promise<GlobalRatesPayload> {
  const now = Date.now();
  if (cache.rates && now - cache.rates.at < TTL_MS) {
    return { ...cache.rates.value, ageMs: now - cache.rates.at };
  }
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const payload = await buildPayload();
      cache.rates = { value: payload, at: Date.now() };
      return payload;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
