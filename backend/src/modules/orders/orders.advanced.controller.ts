/**
 * ============================================
 * ORDERS ADVANCED FEATURES CONTROLLER
 * ============================================
 *
 * Advanced features: PDF export, batch operations, templates, etc.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.types';
import { PDFExportService } from '../../services/pdfExport.service';
import { getOrderById, updateOrder } from './orders.service';
import {
  getSpecificationTemplates,
  saveSpecificationTemplate,
  deleteSpecificationTemplate,
  getSpecificationAnalytics,
  getOrderHistory,
} from './orders.advanced.service';
import { logger } from '../../utils/logger';

/**
 * Export single order as PDF
 * GET /api/orders/:id/export/pdf
 */
export async function handleExportOrderPDF(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const order = await getOrderById(id, req.user!);

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const pdfBuffer = await PDFExportService.generateOrderPDF(order as any);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=order-${order.orderId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Error exporting order PDF:', error);
    next(error);
  }
}

/**
 * Export multiple orders as PDF (batch)
 * POST /api/orders/export/pdf/batch
 * Body: { orderIds: string[] }
 */
export async function handleBatchExportPDF(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { orderIds } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      res.status(400).json({ error: 'orderIds array is required' });
      return;
    }

    if (orderIds.length > 50) {
      res.status(400).json({ error: 'Maximum 50 orders can be exported at once' });
      return;
    }

    const orders = await Promise.all(orderIds.map((id) => getOrderById(id, req.user!)));

    const validOrders = orders.filter((order) => order !== null);

    if (validOrders.length === 0) {
      res.status(404).json({ error: 'No valid orders found' });
      return;
    }

    const pdfBuffer = await PDFExportService.generateBatchOrdersPDF(validOrders as any);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=orders-batch-${Date.now()}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Error batch exporting PDFs:', error);
    next(error);
  }
}

/**
 * Batch update orders
 * PATCH /api/orders/batch/update
 * Body: { orderIds: string[], updates: Partial<Order> }
 */
export async function handleBatchUpdateOrders(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { orderIds, updates } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      res.status(400).json({ error: 'orderIds array is required' });
      return;
    }

    if (!updates || typeof updates !== 'object') {
      res.status(400).json({ error: 'updates object is required' });
      return;
    }

    if (orderIds.length > 100) {
      res.status(400).json({ error: 'Maximum 100 orders can be updated at once' });
      return;
    }

    const results = await Promise.allSettled(
      orderIds.map((id) => updateOrder(id, updates, req.user!))
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    res.json({
      success: true,
      message: `Batch update completed: ${successful} successful, ${failed} failed`,
      successful,
      failed,
      total: orderIds.length,
    });
  } catch (error) {
    logger.error('Error batch updating orders:', error);
    next(error);
  }
}

/**
 * Get specification templates
 * GET /api/orders/specifications/templates
 */
export async function handleGetSpecificationTemplates(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { productType } = req.query;

    const templates = await getSpecificationTemplates(
      productType as string | undefined,
      req.user!.userId
    );

    res.json({ templates });
  } catch (error) {
    logger.error('Error getting specification templates:', error);
    next(error);
  }
}

/**
 * Save specification template
 * POST /api/orders/specifications/templates
 * Body: { name: string, productType: string, specifications: object }
 */
export async function handleSaveSpecificationTemplate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, productType, specifications } = req.body;

    if (!name || !productType || !specifications) {
      res.status(400).json({ error: 'name, productType, and specifications are required' });
      return;
    }

    const template = await saveSpecificationTemplate({
      name,
      productType,
      specifications,
      userId: req.user!.id,
    });

    res.status(201).json({ template });
  } catch (error) {
    logger.error('Error saving specification template:', error);
    next(error);
  }
}

/**
 * Delete specification template
 * DELETE /api/orders/specifications/templates/:id
 */
export async function handleDeleteSpecificationTemplate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    await deleteSpecificationTemplate(id, req.user!.userId);

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    logger.error('Error deleting specification template:', error);
    next(error);
  }
}

/**
 * Get specification analytics
 * GET /api/orders/specifications/analytics
 */
export async function handleGetSpecificationAnalytics(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { productType, startDate, endDate } = req.query;

    const analytics = await getSpecificationAnalytics({
      productType: productType as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({ analytics });
  } catch (error) {
    logger.error('Error getting specification analytics:', error);
    next(error);
  }
}

/**
 * Get order history for auto-populate
 * GET /api/orders/history/customer/:phone
 */
export async function handleGetOrderHistory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { phone } = req.params;
    const { limit = '5' } = req.query;

    const history = await getOrderHistory(phone, parseInt(limit as string));

    res.json({ history });
  } catch (error) {
    logger.error('Error getting order history:', error);
    next(error);
  }
}

/**
 * Compare order specifications
 * POST /api/orders/specifications/compare
 * Body: { orderIds: string[] }
 */
export async function handleCompareSpecifications(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { orderIds } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length < 2) {
      res.status(400).json({ error: 'At least 2 order IDs are required for comparison' });
      return;
    }

    if (orderIds.length > 5) {
      res.status(400).json({ error: 'Maximum 5 orders can be compared at once' });
      return;
    }

    const orders = await Promise.all(
      orderIds.map((id) => getOrderById(id, req.user!.userId, req.user!.role))
    );

    const validOrders = orders.filter((order) => order !== null);

    if (validOrders.length < 2) {
      res.status(404).json({ error: 'Not enough valid orders found for comparison' });
      return;
    }

    const comparison = validOrders.map((order) => ({
      orderId: order!.id,
      productType: (order!.orderDetails as any)?.productType,
      specifications: (order!.orderDetails as any)?.productSpecifications || {},
      createdAt: order!.createdAt,
    }));

    res.json({ comparison });
  } catch (error) {
    logger.error('Error comparing specifications:', error);
    next(error);
  }
}
