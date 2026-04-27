/**
 * ============================================
 * AMBICAA SPOT — LIVE BANGALORE BULLION RATES
 * ============================================
 * Singleton Playwright service that keeps one Chromium tab open on
 * http://ambicaaspot.com/ and reads the live-pushed rate tables every poll.
 *
 * Why Playwright (not direct WebSocket): Ambicaa's SignalR hub on port 1001
 * accepts non-browser clients but only sends keepalive pings to them
 * (server-side fingerprinting). A real Chromium tab receives the gzip+base64
 * `workerPublish` payloads normally, so we read the rendered DOM.
 *
 * Cached in-memory; refreshed every 5 s. Auto-reconnects on page crash.
 */
import { logger } from '../utils/logger';

// Lazy-load playwright so the backend can boot even if the optional
// dep is missing (e.g. CI without Chromium).
type Browser = any;
type Page = any;

const TARGET_URL = 'http://ambicaaspot.com/';
// Ambicaa pushes new rates roughly every 1-2s via SignalR; we re-read the
// rendered DOM at the same cadence so frontend per-second polling sees fresh
// numbers. Override with AMBICAA_POLL_MS env if needed.
const POLL_MS = Math.max(500, Number(process.env.AMBICAA_POLL_MS) || 1_000);
const STALE_MS = 30_000; // consider data unhealthy if older than this

export interface AmbicaaRateRow {
  product: string;
  buy: number | null;
  sell: number | null;
}

export interface AmbicaaRates {
  source: 'ambicaa-spot';
  city: 'Bangalore';
  fetchedAt: string;
  // Bangalore retail (₹ per 10g for gold, ₹ per kg for silver)
  bullion: AmbicaaRateRow[];
  // International spot
  spot: AmbicaaRateRow[];
  // Futures
  futures: AmbicaaRateRow[];
  // Convenience tiles (₹ per gram, derived)
  perGram: {
    gold24k: number | null;
    gold22k: number | null;
    gold18k: number | null;
    silver: number | null;
  };
}

class AmbicaaScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private latest: AmbicaaRates | null = null;
  private lastFetchMs = 0;
  private starting: Promise<void> | null = null;
  private timer: NodeJS.Timeout | null = null;
  private disabled = false;

  async start(): Promise<void> {
    if (this.disabled) return;
    if (this.browser) return;
    if (this.starting) return this.starting;

    this.starting = (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { chromium } = require('playwright');
        this.browser = await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const context = await this.browser.newContext({
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          viewport: { width: 1280, height: 900 },
        });
        this.page = await context.newPage();
        await this.page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        // Wait for first table row to render
        await this.page
          .waitForSelector('table tr', { timeout: 20_000 })
          .catch(() => undefined);
        logger.info('🟢 Ambicaa scraper: page loaded');
        this.scheduleNext();
      } catch (err) {
        logger.warn(
          `⚠️  Ambicaa scraper disabled (Playwright unavailable): ${(err as Error).message}`
        );
        this.disabled = true;
        this.browser = null;
        this.page = null;
      } finally {
        this.starting = null;
      }
    })();
    return this.starting;
  }

  private scheduleNext(): void {
    if (this.disabled) return;
    this.timer = setTimeout(() => {
      this.poll()
        .catch((err) => logger.warn(`Ambicaa poll error: ${(err as Error).message}`))
        .finally(() => this.scheduleNext());
    }, POLL_MS);
  }

  private async poll(): Promise<void> {
    if (!this.page) return;
    // Pass the extraction function as a string so backend tsconfig (no DOM lib)
    // doesn't need to type-check browser globals.
    const extractor = `(() => {
      const num = (s) => {
        if (!s) return null;
        const cleaned = String(s).replace(/[^\\d.]/g, '');
        if (!cleaned) return null;
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : null;
      };
      const tables = Array.from(document.querySelectorAll('table'));
      const rows = [];
      for (const t of tables) {
        const trs = t.querySelectorAll('tr');
        for (const tr of Array.from(trs)) {
          const cells = Array.from(tr.querySelectorAll('td')).map(
            (c) => (c.innerText || c.textContent || '').trim()
          );
          if (cells.length < 3) continue;
          const product = cells[0];
          if (!product || /BUY|SELL|STOCK|BID|ASK|COMMODITY|PRODUCT/i.test(product)) continue;
          const firstNum = (s) => num(s.split(/\\s|\\n/)[0]);
          rows.push({ product, buy: firstNum(cells[1]), sell: firstNum(cells[2]) });
        }
      }
      return rows;
    })()`;
    const data: AmbicaaRateRow[] = (await this.page.evaluate(extractor)) || [];

    const find = (re: RegExp): AmbicaaRateRow | undefined =>
      data.find((r: AmbicaaRateRow) => re.test(r.product));

    const goldMkt = find(/^GOLD\s*MKT/i);
    const silverMkt = find(/^SILVER\s*MKT/i);

    // Bangalore retail rows (10g for gold, 1kg for silver — based on labels)
    const bullion = data.filter((r: AmbicaaRateRow) =>
      /(GOLD|SILVER)/i.test(r.product) &&
      !/SPOT|FUTURE|NEXT|MKT/i.test(r.product)
    );
    const spot = data.filter((r: AmbicaaRateRow) =>
      /(GOLD\s*SPOT|SILVER\s*SPOT|INR\s*SPOT)/i.test(r.product)
    );
    const futures = data.filter((r: AmbicaaRateRow) =>
      /(GOLD\s*(FUTURE|NEXT|MKT)|SILVER\s*(FUTURE|NEXT|MKT))/i.test(r.product)
    );

    // GOLD MKT shows ₹/10g for 24K gold — derive per-gram values
    const perGramGold24 = goldMkt?.sell ? goldMkt.sell / 10 : null;
    const perGramGold22 = perGramGold24 ? (perGramGold24 * 22) / 24 : null;
    const perGramGold18 = perGramGold24 ? (perGramGold24 * 18) / 24 : null;
    // SILVER MKT shows ₹/kg → ÷1000 for ₹/g
    const perGramSilver = silverMkt?.sell ? silverMkt.sell / 1000 : null;

    this.latest = {
      source: 'ambicaa-spot',
      city: 'Bangalore',
      fetchedAt: new Date().toISOString(),
      bullion,
      spot,
      futures,
      perGram: {
        gold24k: perGramGold24,
        gold22k: perGramGold22,
        gold18k: perGramGold18,
        silver: perGramSilver,
      },
    };
    this.lastFetchMs = Date.now();
  }

  getLatest(): { data: AmbicaaRates | null; healthy: boolean; ageMs: number } {
    const ageMs = this.lastFetchMs ? Date.now() - this.lastFetchMs : Infinity;
    return {
      data: this.latest,
      healthy: !!this.latest && ageMs < STALE_MS,
      ageMs,
    };
  }

  async stop(): Promise<void> {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (this.browser) {
      try {
        await this.browser.close();
      } catch {
        /* noop */
      }
    }
    this.browser = null;
    this.page = null;
  }
}

export const ambicaaScraper = new AmbicaaScraper();
