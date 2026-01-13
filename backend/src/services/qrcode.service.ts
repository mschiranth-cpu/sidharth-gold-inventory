import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

interface QRCodeData {
  orderNumber: string;
  orderId: string;
  trackingUrl: string;
  createdAt: string;
}

interface QRCodeResult {
  qrCodeDataUrl: string;
  qrCodePath: string;
  trackingCode: string;
}

class QRCodeService {
  private baseUrl: string;
  private uploadDir: string;

  constructor() {
    this.baseUrl = process.env.APP_URL || 'http://localhost:3000';
    this.uploadDir = process.env.UPLOAD_DIR || './uploads/qrcodes';
  }

  async ensureUploadDir(): Promise<void> {
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  generateTrackingCode(): string {
    return `GF-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4).toUpperCase()}`;
  }

  async generateOrderQRCode(orderId: string, orderNumber: string): Promise<QRCodeResult> {
    await this.ensureUploadDir();

    const trackingCode = this.generateTrackingCode();
    const trackingUrl = `${this.baseUrl}/track/${trackingCode}`;

    const qrData: QRCodeData = {
      orderNumber,
      orderId,
      trackingUrl,
      createdAt: new Date().toISOString(),
    };

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Save QR code to file
    const fileName = `qr_${orderNumber}_${Date.now()}.png`;
    const qrCodePath = path.join(this.uploadDir, fileName);
    
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    await fs.writeFile(qrCodePath, base64Data, 'base64');

    return {
      qrCodeDataUrl,
      qrCodePath: `/uploads/qrcodes/${fileName}`,
      trackingCode,
    };
  }

  async generateBulkQRCodes(orders: Array<{ id: string; orderNumber: string }>): Promise<QRCodeResult[]> {
    const results: QRCodeResult[] = [];
    
    for (const order of orders) {
      const result = await this.generateOrderQRCode(order.id, order.orderNumber);
      results.push(result);
    }
    
    return results;
  }

  async generateLabelWithQR(orderData: {
    orderNumber: string;
    customerName: string;
    items: string[];
    qrCodeDataUrl: string;
  }): Promise<string> {
    // Returns HTML for printable label
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .label { width: 4in; padding: 10px; border: 1px solid #000; font-family: Arial; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .qr-code { text-align: center; margin: 15px 0; }
          .qr-code img { width: 150px; height: 150px; }
          .details { font-size: 12px; }
          .order-number { font-size: 18px; font-weight: bold; }
          .items { margin-top: 10px; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="header">
            <div class="order-number">${orderData.orderNumber}</div>
            <div>${orderData.customerName}</div>
          </div>
          <div class="qr-code">
            <img src="${orderData.qrCodeDataUrl}" alt="QR Code" />
            <div style="font-size: 10px;">Scan to track order</div>
          </div>
          <div class="items">
            <strong>Items:</strong>
            <ul>${orderData.items.map(i => `<li>${i}</li>`).join('')}</ul>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  decodeQRData(qrContent: string): QRCodeData | null {
    try {
      return JSON.parse(qrContent) as QRCodeData;
    } catch {
      return null;
    }
  }
}

export const qrCodeService = new QRCodeService();
export default QRCodeService;
