import * as XLSX from 'xlsx';
import { prisma } from '../config/database';
import fs from 'fs/promises';
import path from 'path';

interface OrderImportRow {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  itemName: string;
  itemType: string;
  quantity: number;
  weight?: number;
  purity?: string;
  expectedDate?: string;
  notes?: string;
  priority?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

interface ExportFilter {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  department?: string;
  customerId?: string;
}

class ExcelService {
  // Generate import template
  async generateImportTemplate(): Promise<Buffer> {
    const templateData = [
      {
        customerName: 'John Doe',
        customerPhone: '+919876543210',
        customerEmail: 'john@example.com',
        itemName: 'Gold Ring',
        itemType: 'Ring',
        quantity: 1,
        weight: 5.5,
        purity: '22K',
        expectedDate: '2026-02-15',
        notes: 'Size 8',
        priority: 'normal',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Add column widths
    worksheet['!cols'] = [
      { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 20 },
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
      { wch: 12 }, { wch: 30 }, { wch: 10 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

    // Add validation sheet
    const validationData = [
      { field: 'priority', values: 'low, normal, high, urgent' },
      { field: 'purity', values: '18K, 20K, 22K, 24K' },
      { field: 'itemType', values: 'Ring, Necklace, Bracelet, Earring, Pendant, Chain, Bangle' },
    ];
    const validationSheet = XLSX.utils.json_to_sheet(validationData);
    XLSX.utils.book_append_sheet(workbook, validationSheet, 'Valid Values');

    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  }

  // Import orders from Excel
  async importOrders(filePath: string, userId: string): Promise<ImportResult> {
    const fileBuffer = await fs.readFile(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: OrderImportRow[] = XLSX.utils.sheet_to_json(worksheet);

    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Account for header

      try {
        // Validate required fields
        if (!row.customerName || !row.itemName || !row.quantity) {
          throw new Error('Missing required fields: customerName, itemName, quantity');
        }

        // Find or create customer
        let customer = await prisma.customer.findFirst({
          where: { OR: [{ phone: row.customerPhone }, { email: row.customerEmail }] },
        });

        if (!customer && row.customerName) {
          customer = await prisma.customer.create({
            data: {
              name: row.customerName,
              phone: row.customerPhone || '',
              email: row.customerEmail,
            },
          });
        }

        // Create order
        const orderNumber = `ORD-${Date.now()}-${i}`;
        await prisma.order.create({
          data: {
            orderNumber,
            customerId: customer!.id,
            status: 'pending',
            priority: (row.priority as any) || 'normal',
            expectedDeliveryDate: row.expectedDate ? new Date(row.expectedDate) : null,
            notes: row.notes,
            createdById: userId,
            items: {
              create: {
                name: row.itemName,
                type: row.itemType || 'Other',
                quantity: Number(row.quantity),
                weight: row.weight ? Number(row.weight) : null,
                purity: row.purity || '22K',
              },
            },
          },
        });

        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({ row: rowNum, error: error.message });
      }
    }

    return result;
  }

  // Export orders to Excel
  async exportOrders(filters: ExportFilter): Promise<Buffer> {
    const whereClause: any = {};

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) whereClause.createdAt.gte = filters.startDate;
      if (filters.endDate) whereClause.createdAt.lte = filters.endDate;
    }
    if (filters.status) whereClause.status = filters.status;
    if (filters.department) whereClause.currentDepartment = filters.department;
    if (filters.customerId) whereClause.customerId = filters.customerId;

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: true,
        items: true,
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const exportData = orders.map(order => ({
      'Order Number': order.orderNumber,
      'Customer': order.customer?.name || 'N/A',
      'Phone': order.customer?.phone || '',
      'Status': order.status,
      'Department': order.currentDepartment || 'N/A',
      'Priority': order.priority,
      'Items': order.items.map(i => `${i.name} (${i.quantity})`).join(', '),
      'Total Weight': order.items.reduce((sum, i) => sum + (i.weight || 0), 0),
      'Created Date': order.createdAt.toISOString().split('T')[0],
      'Expected Date': order.expectedDeliveryDate?.toISOString().split('T')[0] || '',
      'Created By': order.createdBy?.name || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet['!cols'] = [
      { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 12 },
      { wch: 15 }, { wch: 10 }, { wch: 40 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 15 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  }

  // Export analytics report
  async exportAnalyticsReport(reportType: string, dateRange: { start: Date; end: Date }): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summary = await prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: { gte: dateRange.start, lte: dateRange.end } },
      _count: true,
    });

    const summarySheet = XLSX.utils.json_to_sheet(
      summary.map(s => ({ Status: s.status, Count: s._count }))
    );
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Department stats
    const deptStats = await prisma.order.groupBy({
      by: ['currentDepartment'],
      where: { createdAt: { gte: dateRange.start, lte: dateRange.end } },
      _count: true,
    });

    const deptSheet = XLSX.utils.json_to_sheet(
      deptStats.map(d => ({ Department: d.currentDepartment || 'N/A', Orders: d._count }))
    );
    XLSX.utils.book_append_sheet(workbook, deptSheet, 'By Department');

    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  }
}

export const excelService = new ExcelService();
export default ExcelService;
