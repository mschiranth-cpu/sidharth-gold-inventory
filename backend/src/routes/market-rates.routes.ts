import { Router, Request, Response } from 'express';
import { ambicaaScraper } from '../services/ambicaaScraper';

const router = Router();

/**
 * GET /api/market-rates/live?city=bangalore
 * Returns Bangalore live bullion rates scraped from Ambicaa Sales Corp.
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
  if (!data) {
    return res.status(503).json({
      success: false,
      error: 'Live rates not yet available — service is warming up',
      retryAfterMs: 5000,
    });
  }
  res.set('Cache-Control', 'public, max-age=5');
  res.json({ success: true, healthy, ageMs, data });
});

export default router;
