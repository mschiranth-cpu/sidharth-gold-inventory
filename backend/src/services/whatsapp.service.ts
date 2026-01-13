import twilio from 'twilio';

interface WhatsAppMessage {
  to: string;
  templateName: string;
  templateData: Record<string, string>;
}

interface NotificationPreferences {
  orderReceived: boolean;
  inProgress: boolean;
  readyForDelivery: boolean;
  delivered: boolean;
}

class WhatsAppService {
  private client: twilio.Twilio | null = null;
  private fromNumber: string;
  private enabled: boolean;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || '';
    this.enabled = !!(accountSid && authToken && this.fromNumber);

    if (this.enabled) {
      this.client = twilio(accountSid, authToken);
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove spaces and ensure +91 prefix for India
    let cleaned = phone.replace(/\s+/g, '').replace(/^0+/, '');
    if (!cleaned.startsWith('+')) {
      cleaned = cleaned.startsWith('91') ? `+${cleaned}` : `+91${cleaned}`;
    }
    return `whatsapp:${cleaned}`;
  }

  private getTemplate(templateName: string, data: Record<string, string>): string {
    const templates: Record<string, string> = {
      order_received: `🎉 *Order Confirmed!*\n\nDear ${data.customerName},\n\nYour order *${data.orderNumber}* has been received.\n\n📦 Items: ${data.items}\n💰 Total: ₹${data.totalAmount}\n📅 Expected: ${data.expectedDate}\n\nTrack: ${data.trackingUrl}\n\nThank you for choosing Gold Factory!`,
      
      in_progress: `⚙️ *Order Update*\n\nDear ${data.customerName},\n\nYour order *${data.orderNumber}* is now being processed.\n\n📍 Current Stage: ${data.department}\n\nTrack: ${data.trackingUrl}`,
      
      ready_for_delivery: `✅ *Order Ready!*\n\nDear ${data.customerName},\n\nGreat news! Your order *${data.orderNumber}* is ready for delivery/pickup.\n\nPlease contact us to arrange delivery.\n\n📞 Contact: ${data.contactNumber}`,
      
      delivered: `🎊 *Order Delivered*\n\nDear ${data.customerName},\n\nYour order *${data.orderNumber}* has been delivered.\n\nThank you for your business!\n\n⭐ We'd love your feedback.`,
      
      custom: data.message || '',
    };

    return templates[templateName] || templates.custom;
  }

  async sendMessage(to: string, templateName: string, templateData: Record<string, string>): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.enabled || !this.client) {
      console.log('WhatsApp not configured, skipping message');
      return { success: false, error: 'WhatsApp not configured' };
    }

    try {
      const message = await this.client.messages.create({
        from: `whatsapp:${this.fromNumber}`,
        to: this.formatPhoneNumber(to),
        body: this.getTemplate(templateName, templateData),
      });

      return { success: true, messageId: message.sid };
    } catch (error: any) {
      console.error('WhatsApp send error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendOrderReceived(order: any): Promise<void> {
    if (!order.customer?.phone) return;

    await this.sendMessage(order.customer.phone, 'order_received', {
      customerName: order.customer.name,
      orderNumber: order.orderNumber,
      items: order.items?.map((i: any) => i.name).join(', ') || 'Gold Jewelry',
      totalAmount: order.totalAmount?.toLocaleString() || '0',
      expectedDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : 'TBD',
      trackingUrl: `${process.env.APP_URL}/track/${order.trackingCode}`,
    });
  }

  async sendInProgress(order: any, department: string): Promise<void> {
    if (!order.customer?.phone) return;

    await this.sendMessage(order.customer.phone, 'in_progress', {
      customerName: order.customer.name,
      orderNumber: order.orderNumber,
      department,
      trackingUrl: `${process.env.APP_URL}/track/${order.trackingCode}`,
    });
  }

  async sendReadyForDelivery(order: any): Promise<void> {
    if (!order.customer?.phone) return;

    await this.sendMessage(order.customer.phone, 'ready_for_delivery', {
      customerName: order.customer.name,
      orderNumber: order.orderNumber,
      contactNumber: process.env.CONTACT_PHONE || '',
    });
  }

  async sendDelivered(order: any): Promise<void> {
    if (!order.customer?.phone) return;

    await this.sendMessage(order.customer.phone, 'delivered', {
      customerName: order.customer.name,
      orderNumber: order.orderNumber,
    });
  }

  async sendBulkNotification(phones: string[], message: string): Promise<{ sent: number; failed: number }> {
    let sent = 0, failed = 0;

    for (const phone of phones) {
      const result = await this.sendMessage(phone, 'custom', { message });
      if (result.success) sent++;
      else failed++;
    }

    return { sent, failed };
  }
}

export const whatsAppService = new WhatsAppService();
export default WhatsAppService;
