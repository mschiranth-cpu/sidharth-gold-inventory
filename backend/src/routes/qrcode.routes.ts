import { Router, Request, Response } from 'express';
import { qrCodeService } from '../services/qrcode.service';
import { prisma } from '../config/database';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Generate QR code for an order
router.post('/generate/:orderId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const qrResult = await qrCodeService.generateOrderQRCode(orderId, order.orderNumber);

    // Update order with tracking code
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        trackingCode: qrResult.trackingCode,
        qrCodePath: qrResult.qrCodePath,
      },
    });

    res.json({
      success: true,
      data: {
        qrCodeDataUrl: qrResult.qrCodeDataUrl,
        qrCodePath: qrResult.qrCodePath,
        trackingCode: qrResult.trackingCode,
      },
    });
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Get printable label
router.get('/label/:orderId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        customer: true,
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    let qrCodeDataUrl = '';
    if (order.qrCodePath) {
      // Regenerate QR for label
      const qrResult = await qrCodeService.generateOrderQRCode(orderId, order.orderNumber);
      qrCodeDataUrl = qrResult.qrCodeDataUrl;
    }

    const labelHtml = await qrCodeService.generateLabelWithQR({
      orderNumber: order.orderNumber,
      customerName: order.customer?.name || 'N/A',
      items: order.items.map(i => `${i.name} - ${i.quantity}pcs`),
      qrCodeDataUrl,
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(labelHtml);
  } catch (error) {
    console.error('Label generation error:', error);
    res.status(500).json({ error: 'Failed to generate label' });
  }
});

// Track order by tracking code (public)
router.get('/track/:trackingCode', async (req: Request, res: Response) => {
  try {
    const { trackingCode } = req.params;

    const order = await prisma.order.findFirst({
      where: { trackingCode },
      select: {
        orderNumber: true,
        status: true,
        currentDepartment: true,
        createdAt: true,
        expectedDeliveryDate: true,
        customer: { select: { name: true } },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            status: true,
            department: true,
            createdAt: true,
            notes: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ error: 'Failed to track order' });
  }
});

// Scan QR and update status (for mobile app)
router.post('/scan', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { qrData, newStatus, department, notes, photoUrl } = req.body;
    const userId = (req as any).user.id;

    const decodedData = qrCodeService.decodeQRData(qrData);
    if (!decodedData) {
      return res.status(400).json({ error: 'Invalid QR code data' });
    }

    const order = await prisma.order.findUnique({
      where: { id: decodedData.orderId },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: decodedData.orderId },
      data: {
        status: newStatus || order.status,
        currentDepartment: department || order.currentDepartment,
        statusHistory: {
          create: {
            status: newStatus || order.status,
            department: department || order.currentDepartment,
            notes: notes || 'Updated via QR scan',
            updatedById: userId,
            photoUrl,
          },
        },
      },
    });

    res.json({ 
      success: true, 
      data: {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        newStatus: updatedOrder.status,
      },
    });
  } catch (error) {
    console.error('QR scan update error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Bulk generate QR codes
router.post('/bulk-generate', authenticateToken, authorizeRoles('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const { orderIds } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'Order IDs required' });
    }

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, orderNumber: true },
    });

    const results = await qrCodeService.generateBulkQRCodes(orders);

    // Update orders with QR codes
    for (let i = 0; i < orders.length; i++) {
      await prisma.order.update({
        where: { id: orders[i].id },
        data: {
          trackingCode: results[i].trackingCode,
          qrCodePath: results[i].qrCodePath,
        },
      });
    }

    res.json({ success: true, count: results.length });
  } catch (error) {
    console.error('Bulk QR generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR codes' });
  }
});

export default router;
