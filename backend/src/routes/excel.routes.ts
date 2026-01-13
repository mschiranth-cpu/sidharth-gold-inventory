import { Router, Request, Response } from 'express';
import { excelService } from '../services/excel.service';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: '/tmp/uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files allowed'));
    }
  },
});

// Download import template
router.get('/template', authenticateToken, async (req: Request, res: Response) => {
  try {
    const buffer = await excelService.generateImportTemplate();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=order-import-template.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Template generation error:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

// Import orders from Excel
router.post('/import', authenticateToken, authorizeRoles('admin', 'manager'), upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = (req as any).user.id;
    const result = await excelService.importOrders(req.file.path, userId);

    // Cleanup uploaded file
    await fs.unlink(req.file.path).catch(() => {});

    res.json({
      success: true,
      data: {
        imported: result.success,
        failed: result.failed,
        errors: result.errors.slice(0, 10), // Return first 10 errors
      },
    });
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message || 'Import failed' });
  }
});

// Export orders
router.get('/export/orders', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, status, department, customerId } = req.query;

    const filters = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      status: status as string,
      department: department as string,
      customerId: customerId as string,
    };

    const buffer = await excelService.exportOrders(filters);
    const filename = `orders-export-${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Export analytics report
router.get('/export/report', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const { type = 'summary', startDate, endDate } = req.query;

    const dateRange = {
      start: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: endDate ? new Date(endDate as string) : new Date(),
    };

    const buffer = await excelService.exportAnalyticsReport(type as string, dateRange);
    const filename = `report-${type}-${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(buffer);
  } catch (error) {
    console.error('Report export error:', error);
    res.status(500).json({ error: 'Report export failed' });
  }
});

export default router;
