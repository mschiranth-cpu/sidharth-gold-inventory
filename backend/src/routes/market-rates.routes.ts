import { Router, Request, Response } from 'express';
import { ambicaaScraper } from '../services/ambicaaScraper';
import { getGlobalMetalRates } from '../services/globalMetalRates';

const router = Router();

/**
 * GET /api/market-rates/live?city=bangalore
 * Returns Bangalore live bullion rates scraped from Ambicaa Sales Corp.
 * Falls back to global spot rates (gold-api.com + USD/INR FX) when the
 * Bangalore scraper is unavailable, so the UI never has to render dashes.
 * Public, no auth — purely indicative data.
 */
router.get('/live', async (req: Request, res: Response) => {
  const city = String(req.query.city || 'bangalore').toLowerCase();
  if (city !== 'bangalore') {
    return res.status(400).json({ success: false, error: 'Only city=bangalore is supported' });
  }
  // Lazy-start the scraper on first request
  await ambicaaScraper.start();
  const { data, healthy, ageMs } = ambicaaScraper.getLatest();

  if (data && healthy && data.perGram.gold24k != null) {
    res.set('Cache-Control', 'public, max-age=5');
    return res.json({ success: true, healthy, ageMs, data });
  }

  // Bangalore unhealthy → fall back to global spot rates.
  try {
    const global = await getGlobalMetalRates();
    if (global.healthy) {
      res.set('Cache-Control', 'public, max-age=30');
      return res.json({
        success: true,
        healthy: true,
        ageMs: global.ageMs,
        data: {
          source: 'global-spot',
          city: 'global',
          fetchedAt: global.fetchedAt,
          perGram: {
            gold24k: global.gold24k,
            gold22k: global.gold22k,
            gold18k: global.gold18k,
            silver: global.silver,
            platinum: global.platinum,
            palladium: global.palladium,
          },
        },
      });
    }
  } catch {
    /* swallow — fall through to 503 */
  }

  return res.status(503).json({
    success: false,
    error: 'Live rates not yet available — service is warming up',
    retryAfterMs: 5000,
  });
});

export default router;
