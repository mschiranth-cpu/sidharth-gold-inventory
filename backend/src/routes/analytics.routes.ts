import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Bottleneck analysis
router.get('/bottlenecks', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateRange = startDate && endDate ? {
      start: new Date(startDate as string),
      end: new Date(endDate as string),
    } : undefined;

    const data = await analyticsService.analyzeBottlenecks(dateRange);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Bottleneck analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Worker productivity
router.get('/productivity', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const { department } = req.query;
    const data = await analyticsService.getWorkerProductivity(department as string);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Productivity analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Cycle time trends
router.get('/cycle-trends', authenticateToken, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = await analyticsService.getCycleTimeTrends(days);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Cycle trends error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Predict delivery date
router.get('/predict-delivery/:orderId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const data = await analyticsService.predictDeliveryDate(orderId);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Prediction error:', error);
    res.status(500).json({ error: error.message || 'Prediction failed' });
  }
});

// Customer patterns
router.get('/customer-patterns', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const { customerId } = req.query;
    const data = await analyticsService.getCustomerPatterns(customerId as string);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Customer patterns error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

export default router;
