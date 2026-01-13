/**
 * ============================================
 * REPORT ROUTES
 * ============================================
 *
 * API endpoints for report generation and export.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize as requireRoles } from '../../middleware/auth';
import { cacheMiddleware } from '../../middleware/cache';
import { reportsRateLimiter } from '../../middleware/rateLimiter';
import type { ReportFilters } from './report.types';
import {
  getDailyProductionReport,
  getDepartmentEfficiencyReport,
  getPendingOrdersReport,
  getOverdueOrdersReport,
  getWorkerPerformanceReport,
  getReportSummary,
} from './report.service';

const router = Router();

// All routes require authentication and manager/admin role
router.use(authenticate);
router.use(requireRoles('ADMIN', 'MANAGER'));

// Apply rate limiting to all report routes (reports can be expensive)
router.use(reportsRateLimiter);

// ============================================
// HELPER: Parse filters from query
// ============================================

function parseFilters(query: any): ReportFilters {
  const now = new Date();
  const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1); // Start of month
  const defaultEndDate = now;

  return {
    startDate: query.startDate ? new Date(query.startDate) : defaultStartDate,
    endDate: query.endDate ? new Date(query.endDate) : defaultEndDate,
    departmentId: query.departmentId || undefined,
    workerId: query.workerId || undefined,
    status: query.status || undefined,
  };
}

// Cache for 5 minutes (reports are expensive queries)
const reportsCacheMiddleware = cacheMiddleware({
  ttl: 300,
  keyPrefix: 'reports',
});

// ============================================
// REPORT SUMMARY
// ============================================

/**
 * GET /api/reports/summary
 * Get overall report summary
 */
router.get('/summary', reportsCacheMiddleware, async (req: Request, res: Response) => {
  try {
    const summary = await getReportSummary();

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error fetching report summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report summary',
    });
  }
});

// ============================================
// DAILY PRODUCTION REPORT
// ============================================

/**
 * GET /api/reports/daily-production
 * Get daily production report
 */
router.get('/daily-production', reportsCacheMiddleware, async (req: Request, res: Response) => {
  try {
    const filters = parseFilters(req.query);
    const report = await getDailyProductionReport(filters);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error fetching daily production report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily production report',
    });
  }
});

// ============================================
// DEPARTMENT EFFICIENCY REPORT
// ============================================

/**
 * GET /api/reports/department-efficiency
 * Get department efficiency report
 */
router.get(
  '/department-efficiency',
  reportsCacheMiddleware,
  async (req: Request, res: Response) => {
    try {
      const filters = parseFilters(req.query);
      const report = await getDepartmentEfficiencyReport(filters);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error('Error fetching department efficiency report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch department efficiency report',
      });
    }
  }
);

// ============================================
// PENDING ORDERS REPORT
// ============================================

/**
 * GET /api/reports/pending-orders
 * Get pending orders report grouped by department
 */
router.get('/pending-orders', reportsCacheMiddleware, async (req: Request, res: Response) => {
  try {
    const filters = parseFilters(req.query);
    const report = await getPendingOrdersReport(filters);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error fetching pending orders report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending orders report',
    });
  }
});

// ============================================
// OVERDUE ORDERS REPORT
// ============================================

/**
 * GET /api/reports/overdue-orders
 * Get overdue orders with escalation levels
 */
router.get('/overdue-orders', reportsCacheMiddleware, async (req: Request, res: Response) => {
  try {
    const filters = parseFilters(req.query);
    const report = await getOverdueOrdersReport(filters);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error fetching overdue orders report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue orders report',
    });
  }
});

// ============================================
// WORKER PERFORMANCE REPORT
// ============================================

/**
 * GET /api/reports/worker-performance
 * Get worker performance report
 */
router.get('/worker-performance', reportsCacheMiddleware, async (req: Request, res: Response) => {
  try {
    const filters = parseFilters(req.query);
    const report = await getWorkerPerformanceReport(filters);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error fetching worker performance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch worker performance report',
    });
  }
});

// ============================================
// EXPORT ENDPOINTS
// ============================================

/**
 * GET /api/reports/export/:type
 * Export report data in specified format
 */
router.get('/export/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const format = (req.query.format as string) || 'json';
    const filters = parseFilters(req.query);

    let reportData: any;

    switch (type) {
      case 'daily-production':
        reportData = await getDailyProductionReport(filters);
        break;
      case 'department-efficiency':
        reportData = await getDepartmentEfficiencyReport(filters);
        break;
      case 'pending-orders':
        reportData = await getPendingOrdersReport(filters);
        break;
      case 'overdue-orders':
        reportData = await getOverdueOrdersReport(filters);
        break;
      case 'worker-performance':
        reportData = await getWorkerPerformanceReport(filters);
        break;
      case 'summary':
        reportData = await getReportSummary();
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type',
        });
    }

    // For now, just return JSON
    // Excel/PDF generation would require additional libraries
    if (format === 'json') {
      res.json({
        success: true,
        data: reportData,
        exportedAt: new Date().toISOString(),
      });
    } else if (format === 'csv') {
      // Convert to CSV
      const csvData = convertToCSV(reportData.data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
      res.send(csvData);
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported export format. Use json or csv.',
      });
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report',
    });
  }
});

// ============================================
// HELPER: Convert to CSV
// ============================================

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    ),
  ];

  return csvRows.join('\n');
}

export default router;
