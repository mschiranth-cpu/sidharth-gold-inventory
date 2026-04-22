import PDFDocument from 'pdfkit';
import { Order } from '@prisma/client';
import { formatDate } from '../utils/dateUtils';

interface OrderWithDetails extends Order {
  customer?: { name: string; phone?: string };
  orderDetails?: any;
  user?: { name: string };
  department?: { name: string };
}

export class PDFExportService {
  /**
   * Generate PDF for a single order with specifications
   */
  static async generateOrderPDF(order: OrderWithDetails): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text('Gold Factory Inventory', { align: 'center' })
          .moveDown(0.5);

        doc.fontSize(16).text('Order Details', { align: 'center' }).moveDown(1);

        // Order Information
        doc.fontSize(12).font('Helvetica-Bold').text('Order Information', { underline: true });
        doc.moveDown(0.5);

        doc.font('Helvetica');
        this.addField(doc, 'Order ID:', order.orderId);
        this.addField(doc, 'Customer:', order.customer?.name || 'N/A');
        if (order.customer?.phone) {
          this.addField(doc, 'Phone:', order.customer.phone);
        }
        this.addField(doc, 'Status:', order.status);
        this.addField(doc, 'Priority:', order.priority || 'NORMAL');
        this.addField(doc, 'Created:', formatDate(order.createdAt));
        if (order.dueDate) {
          this.addField(doc, 'Due Date:', formatDate(order.dueDate));
        }
        doc.moveDown(1);

        // Product Details
        if (order.orderDetails) {
          const details = order.orderDetails as any;

          doc.fontSize(12).font('Helvetica-Bold').text('Product Details', { underline: true });
          doc.moveDown(0.5);
          doc.font('Helvetica');

          if (details.productType) {
            this.addField(doc, 'Product Type:', this.formatProductType(details.productType));
          }
          if (details.purity) {
            this.addField(doc, 'Purity:', details.purity);
          }
          if (details.grossWeight) {
            this.addField(doc, 'Gross Weight:', `${details.grossWeight}g`);
          }
          if (details.netWeight) {
            this.addField(doc, 'Net Weight:', `${details.netWeight}g`);
          }
          if (details.stoneWeight) {
            this.addField(doc, 'Stone Weight:', `${details.stoneWeight}g`);
          }
          if (details.quantity) {
            this.addField(doc, 'Quantity:', details.quantity.toString());
          }

          doc.moveDown(1);

          // Product Specifications
          if (details.productSpecifications) {
            doc
              .fontSize(12)
              .font('Helvetica-Bold')
              .text('Product Specifications', { underline: true });
            doc.moveDown(0.5);
            doc.font('Helvetica');

            const specs = details.productSpecifications;
            Object.entries(specs).forEach(([key, value]) => {
              if (value !== null && value !== undefined && value !== '') {
                const label = this.formatLabel(key);
                const formattedValue = this.formatValue(value);
                this.addField(doc, label + ':', formattedValue);
              }
            });

            doc.moveDown(1);
          }

          // Design Details
          if (details.designDetails) {
            doc.fontSize(12).font('Helvetica-Bold').text('Design Details', { underline: true });
            doc.moveDown(0.5);
            doc.font('Helvetica').text(details.designDetails, { width: 500 });
            doc.moveDown(1);
          }

          // Special Instructions
          if (details.specialInstructions) {
            doc
              .fontSize(12)
              .font('Helvetica-Bold')
              .text('Special Instructions', { underline: true });
            doc.moveDown(0.5);
            doc.font('Helvetica').text(details.specialInstructions, { width: 500 });
            doc.moveDown(1);
          }
        }

        // Footer
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Generated on ${new Date().toLocaleString()}`, 50, doc.page.height - 50, {
            align: 'center',
          });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate PDF for multiple orders (batch export)
   */
  static async generateBatchOrdersPDF(orders: OrderWithDetails[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text('Gold Factory Inventory', { align: 'center' })
          .moveDown(0.5);

        doc.fontSize(16).text('Orders Summary Report', { align: 'center' }).moveDown(0.5);

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Total Orders: ${orders.length}`, { align: 'center' })
          .moveDown(1);

        // Orders Table
        orders.forEach((order, index) => {
          if (index > 0) {
            doc.addPage();
          }

          doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .text(`Order #${index + 1}: ${order.orderId}`);
          doc.moveDown(0.5);

          doc.fontSize(10).font('Helvetica');
          this.addField(doc, 'Customer:', order.customer?.name || 'N/A');
          this.addField(doc, 'Status:', order.status);
          this.addField(doc, 'Created:', formatDate(order.createdAt));

          if (order.orderDetails) {
            const details = order.orderDetails as any;
            if (details.productType) {
              this.addField(doc, 'Product:', this.formatProductType(details.productType));
            }
            if (details.grossWeight) {
              this.addField(doc, 'Weight:', `${details.grossWeight}g`);
            }
          }

          doc.moveDown(1);
        });

        // Footer
        doc
          .fontSize(10)
          .text(`Generated on ${new Date().toLocaleString()}`, 50, doc.page.height - 50, {
            align: 'center',
          });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private static addField(doc: PDFKit.PDFDocument, label: string, value: string) {
    doc.font('Helvetica-Bold').text(label, { continued: true });
    doc.font('Helvetica').text(` ${value}`);
  }

  private static formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  private static formatValue(value: any): string {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'string') {
      return value.replace(/_/g, ' ');
    }
    return String(value);
  }

  private static formatProductType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
}
